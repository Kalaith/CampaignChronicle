<?php

namespace App\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Psr7\Response;

abstract class BaseController
{
    /**
     * Create a JSON response.
     */
    protected function json(ResponseInterface $response, $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data, JSON_PRETTY_PRINT));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    /**
     * Create a success response.
     */
    protected function success(ResponseInterface $response, $data = null, string $message = 'Success', int $status = 200): ResponseInterface
    {
        return $this->json($response, [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Create an error response.
     */
    protected function error(ResponseInterface $response, string $message, int $status = 400, $errors = null): ResponseInterface
    {
        $errorData = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $errorData['errors'] = $errors;
        }

        return $this->json($response, $errorData, $status);
    }

    /**
     * Create a not found response.
     */
    protected function notFound(ResponseInterface $response, string $message = 'Resource not found'): ResponseInterface
    {
        return $this->error($response, $message, 404);
    }

    /**
     * Create a validation error response.
     */
    protected function validationError(ResponseInterface $response, $errors, string $message = 'Validation failed'): ResponseInterface
    {
        return $this->error($response, $message, 422, $errors);
    }

    /**
     * Get request data from JSON body.
     */
    protected function getRequestData(ServerRequestInterface $request): array
    {
        $contentType = $request->getHeaderLine('Content-Type');
        
        if (strpos($contentType, 'application/json') !== false) {
            $data = json_decode((string) $request->getBody(), true);
            return is_array($data) ? $data : [];
        }
        
        return $request->getParsedBody() ?: [];
    }

    /**
     * Get query parameters.
     */
    protected function getQueryParams(ServerRequestInterface $request): array
    {
        return $request->getQueryParams();
    }

    /**
     * Get route arguments.
     */
    protected function getRouteArgs(ServerRequestInterface $request): array
    {
        return $request->getAttribute('routeInfo')[2] ?? [];
    }

    /**
     * Get authenticated user from request.
     */
    protected function getUser(ServerRequestInterface $request): ?array
    {
        return $request->getAttribute('user');
    }

    /**
     * Get authenticated user ID from request.
     */
    protected function getUserId(ServerRequestInterface $request): ?int
    {
        return $request->getAttribute('user_id');
    }

    /**
     * Apply user filtering to query.
     */
    protected function filterByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Validate required fields in request data.
     */
    protected function validateRequired(array $data, array $required): array
    {
        $errors = [];
        
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $errors[$field] = "The {$field} field is required.";
            }
        }
        
        return $errors;
    }

    /**
     * Build paginated response.
     */
    protected function paginated($query, int $page = 1, int $perPage = 20): array
    {
        $total = $query->count();
        $offset = ($page - 1) * $perPage;
        $items = $query->offset($offset)->limit($perPage)->get();

        return [
            'data' => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => ceil($total / $perPage),
                'has_next' => $page * $perPage < $total,
                'has_prev' => $page > 1,
            ],
        ];
    }

    /**
     * Parse pagination parameters from query.
     */
    protected function getPaginationParams(array $queryParams): array
    {
        return [
            'page' => max(1, (int) ($queryParams['page'] ?? 1)),
            'per_page' => min(100, max(1, (int) ($queryParams['per_page'] ?? 20))),
        ];
    }

    /**
     * Parse search parameters from query.
     */
    protected function getSearchParams(array $queryParams): array
    {
        return [
            'search' => $queryParams['search'] ?? null,
            'type' => $queryParams['type'] ?? null,
            'tags' => isset($queryParams['tags']) ? explode(',', $queryParams['tags']) : null,
            'sort' => $queryParams['sort'] ?? 'created_at',
            'order' => in_array(strtolower($queryParams['order'] ?? 'desc'), ['asc', 'desc']) 
                ? strtolower($queryParams['order'] ?? 'desc')
                : 'desc',
        ];
    }

    /**
     * Apply search and filtering to a query.
     */
    protected function applyFilters($query, array $filters, array $searchableFields = [])
    {
        // Apply search
        if (!empty($filters['search']) && !empty($searchableFields)) {
            $searchTerm = $filters['search'];
            $query->where(function ($q) use ($searchTerm, $searchableFields) {
                foreach ($searchableFields as $field) {
                    $q->orWhere($field, 'LIKE', "%{$searchTerm}%");
                }
            });
        }

        // Apply type filter
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // Apply tag filters
        if (!empty($filters['tags'])) {
            foreach ($filters['tags'] as $tag) {
                $query->whereJsonContains('tags', trim($tag));
            }
        }

        // Apply sorting
        $sortField = $filters['sort'] ?? 'created_at';
        $sortOrder = $filters['order'] ?? 'desc';
        $query->orderBy($sortField, $sortOrder);

        return $query;
    }
}