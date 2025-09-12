<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Models\CampaignMap;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;

class MapController extends BaseController
{
    /**
     * List all maps for a campaign.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;

        if (!$campaignId) {
            return $this->error($response, 'Campaign ID is required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        $queryParams = $this->getQueryParams($request);
        $paginationParams = $this->getPaginationParams($queryParams);
        $searchParams = $this->getSearchParams($queryParams);

        $query = $this->filterByUser(CampaignMap::where('campaign_id', $campaignId), $userId);
        
        $searchableFields = ['name', 'description'];
        $query = $this->applyFilters($query, $searchParams, $searchableFields);

        $result = $this->paginated($query, $paginationParams['page'], $paginationParams['per_page']);

        return $this->success($response, $result);
    }

    /**
     * Get a specific map.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;

        if (!$mapId) {
            return $this->error($response, 'Map ID is required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        return $this->success($response, $map);
    }

    /**
     * Create a new map with image upload.
     */
    public function create(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;

        if (!$campaignId) {
            return $this->error($response, 'Campaign ID is required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        $uploadedFiles = $request->getUploadedFiles();
        $parsedBody = $request->getParsedBody();

        // Validate required fields
        $errors = $this->validateRequired($parsedBody, ['name']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        // Check if image file was uploaded
        if (!isset($uploadedFiles['image']) || $uploadedFiles['image']->getError() !== UPLOAD_ERR_OK) {
            return $this->error($response, 'Map image is required', 400);
        }

        $imageFile = $uploadedFiles['image'];
        
        // Validate image file
        $validationResult = $this->validateImageFile($imageFile);
        if (!$validationResult['valid']) {
            return $this->error($response, $validationResult['message'], 400);
        }

        try {
            // Upload and process the image
            $imageInfo = $this->processImageUpload($imageFile, $userId, $campaignId);

            // Create the map record
            $map = new CampaignMap([
                'user_id' => $userId,
                'campaign_id' => $campaignId,
                'name' => $parsedBody['name'],
                'description' => $parsedBody['description'] ?? null,
                'image_path' => $imageInfo['path'],
                'image_url' => $imageInfo['url'],
                'width' => $imageInfo['width'],
                'height' => $imageInfo['height'],
                'pins' => [],
                'routes' => [],
            ]);

            $map->save();

            return $this->success($response, $map, 'Map created successfully', 201);

        } catch (\Exception $e) {
            error_log("Map creation failed: " . $e->getMessage());
            return $this->error($response, 'Failed to create map', 500);
        }
    }

    /**
     * Update a map.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;

        if (!$mapId) {
            return $this->error($response, 'Map ID is required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        $data = $this->getRequestData($request);

        // Update allowed fields
        $updateFields = ['name', 'description', 'pins', 'routes'];
        foreach ($updateFields as $field) {
            if (isset($data[$field])) {
                $map->{$field} = $data[$field];
            }
        }

        $map->save();

        return $this->success($response, $map, 'Map updated successfully');
    }

    /**
     * Delete a map.
     */
    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;

        if (!$mapId) {
            return $this->error($response, 'Map ID is required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        // Delete the image file
        if ($map->image_path) {
            $fullPath = $this->getStoragePath($map->image_path);
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
        }

        $map->delete();

        return $this->success($response, null, 'Map deleted successfully');
    }

    /**
     * Add a pin to a map.
     */
    public function addPin(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;

        if (!$mapId) {
            return $this->error($response, 'Map ID is required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        $data = $this->getRequestData($request);
        
        // Validate required pin fields
        $errors = $this->validateRequired($data, ['x', 'y', 'type', 'name']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        $map->addPin($data);
        $map->save();

        return $this->success($response, $map, 'Pin added successfully');
    }

    /**
     * Update a pin on a map.
     */
    public function updatePin(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;
        $pinId = $args['pin_id'] ?? null;

        if (!$mapId || !$pinId) {
            return $this->error($response, 'Map ID and Pin ID are required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        $data = $this->getRequestData($request);

        $map->updatePin($pinId, $data);
        $map->save();

        return $this->success($response, $map, 'Pin updated successfully');
    }

    /**
     * Delete a pin from a map.
     */
    public function deletePin(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;
        $pinId = $args['pin_id'] ?? null;

        if (!$mapId || !$pinId) {
            return $this->error($response, 'Map ID and Pin ID are required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        $map->removePin($pinId);
        $map->save();

        return $this->success($response, $map, 'Pin deleted successfully');
    }

    /**
     * Add a route to a map.
     */
    public function addRoute(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;

        if (!$mapId) {
            return $this->error($response, 'Map ID is required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        $data = $this->getRequestData($request);
        
        // Validate required route fields
        $errors = $this->validateRequired($data, ['type', 'name', 'points']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        $map->addRoute($data);
        $map->save();

        return $this->success($response, $map, 'Route added successfully');
    }

    /**
     * Update a route on a map.
     */
    public function updateRoute(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;
        $routeId = $args['route_id'] ?? null;

        if (!$mapId || !$routeId) {
            return $this->error($response, 'Map ID and Route ID are required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        $data = $this->getRequestData($request);

        $map->updateRoute($routeId, $data);
        $map->save();

        return $this->success($response, $map, 'Route updated successfully');
    }

    /**
     * Delete a route from a map.
     */
    public function deleteRoute(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $mapId = $args['id'] ?? null;
        $routeId = $args['route_id'] ?? null;

        if (!$mapId || !$routeId) {
            return $this->error($response, 'Map ID and Route ID are required', 400);
        }

        $map = $this->filterByUser(CampaignMap::query(), $userId)
            ->where('id', $mapId)
            ->first();

        if (!$map) {
            return $this->notFound($response, 'Map not found');
        }

        $map->removeRoute($routeId);
        $map->save();

        return $this->success($response, $map, 'Route deleted successfully');
    }

    /**
     * Validate uploaded image file.
     */
    private function validateImageFile(UploadedFileInterface $file): array
    {
        // Check file size (limit to 10MB)
        if ($file->getSize() > 10 * 1024 * 1024) {
            return ['valid' => false, 'message' => 'Image file is too large. Maximum size is 10MB.'];
        }

        // Check MIME type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $clientMediaType = $file->getClientMediaType();
        
        if (!in_array($clientMediaType, $allowedTypes)) {
            return ['valid' => false, 'message' => 'Invalid image format. Supported formats: JPEG, PNG, GIF, WebP.'];
        }

        return ['valid' => true];
    }

    /**
     * Process image upload and get image dimensions.
     */
    private function processImageUpload(UploadedFileInterface $file, string $userId, string $campaignId): array
    {
        // Generate unique filename
        $extension = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
        $filename = uniqid('map_') . '.' . $extension;
        
        // Create directory structure: uploads/maps/{userId}/{campaignId}/
        $relativePath = "maps/{$userId}/{$campaignId}/{$filename}";
        $fullPath = $this->getStoragePath($relativePath);
        
        // Create directories if they don't exist
        $directory = dirname($fullPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Move uploaded file
        $file->moveTo($fullPath);

        // Get image dimensions
        $imageSize = getimagesize($fullPath);
        $width = $imageSize[0] ?? 0;
        $height = $imageSize[1] ?? 0;

        return [
            'path' => $relativePath,
            'url' => "/storage/{$relativePath}",
            'width' => $width,
            'height' => $height,
        ];
    }

    /**
     * Get the full storage path for a relative path.
     */
    private function getStoragePath(string $relativePath): string
    {
        // This should be configured based on your storage setup
        $storagePath = dirname(__DIR__, 2) . '/storage/app/public/';
        return $storagePath . $relativePath;
    }
}