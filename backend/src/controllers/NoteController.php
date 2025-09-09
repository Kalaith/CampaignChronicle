<?php

namespace App\Controllers;

use App\Models\Note;
use App\Models\Campaign;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class NoteController extends BaseController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $pagination = $this->getPaginationParams($queryParams);
            $filters = $this->getSearchParams($queryParams);

            $query = $campaign->notes();
            $query = $this->applyFilters($query, $filters, ['title', 'content']);
            
            $result = $this->paginated($query, $pagination['page'], $pagination['per_page']);
            
            return $this->success($response, $result);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve notes: ' . $e->getMessage(), 500);
        }
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $note = Note::find($args['id']);
            
            if (!$note) {
                return $this->notFound($response, 'Note not found');
            }

            return $this->success($response, $note);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve note: ' . $e->getMessage(), 500);
        }
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $data = $this->getRequestData($request);
            
            $errors = $this->validateRequired($data, ['title', 'content']);
            if (!empty($errors)) {
                return $this->validationError($response, $errors);
            }

            $data['campaign_id'] = $campaign->id;
            $note = Note::create($data);

            return $this->success($response, $note, 'Note created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to create note: ' . $e->getMessage(), 500);
        }
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $note = Note::find($args['id']);
            if (!$note) {
                return $this->notFound($response, 'Note not found');
            }

            $data = $this->getRequestData($request);
            $note->update(array_filter($data, fn($value) => $value !== null));

            return $this->success($response, $note, 'Note updated successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to update note: ' . $e->getMessage(), 500);
        }
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $note = Note::find($args['id']);
            if (!$note) {
                return $this->notFound($response, 'Note not found');
            }

            $note->delete();
            return $this->success($response, null, 'Note deleted successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to delete note: ' . $e->getMessage(), 500);
        }
    }

    public function search(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $searchTerm = $queryParams['q'] ?? '';

            if (empty($searchTerm)) {
                return $this->error($response, 'Search term is required');
            }

            $results = Note::fullTextSearch($campaign->id, $searchTerm);
            
            return $this->success($response, [
                'query' => $searchTerm,
                'results' => $results,
                'count' => $results->count(),
            ]);
        } catch (\Exception $e) {
            return $this->error($response, 'Search failed: ' . $e->getMessage(), 500);
        }
    }

    public function statistics(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $statistics = Note::getStatistics($campaign->id);
            return $this->success($response, $statistics);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve note statistics: ' . $e->getMessage(), 500);
        }
    }

    public function references(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $note = Note::find($args['id']);
            if (!$note) {
                return $this->notFound($response, 'Note not found');
            }

            $queryParams = $this->getQueryParams($request);
            $entityName = $queryParams['entity'] ?? '';

            if (empty($entityName)) {
                return $this->error($response, 'Entity name is required');
            }

            $references = $note->findReferences($entityName);
            return $this->success($response, $references);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to find references: ' . $e->getMessage(), 500);
        }
    }
}