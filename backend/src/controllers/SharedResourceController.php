<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Models\SharedResource;
use App\Models\PlayerAccess;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class SharedResourceController extends BaseController
{
    /**
     * Get all shared resources for a campaign.
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

        try {
            $queryParams = $this->getQueryParams($request);
            $type = $queryParams['type'] ?? null;
            $category = $queryParams['category'] ?? null;
            $accessLevel = $queryParams['access_level'] ?? null;
            $tag = $queryParams['tag'] ?? null;

            $query = SharedResource::where('campaign_id', $campaignId)
                ->where('user_id', $userId);

            if ($type) {
                $query->byType($type);
            }

            if ($category) {
                $query->byCategory($category);
            }

            if ($accessLevel) {
                $query->byAccessLevel($accessLevel);
            }

            if ($tag) {
                $query->withTag($tag);
            }

            $resources = $query->orderBy('created_at', 'desc')->get();

            return $this->success($response, $resources);

        } catch (\Exception $e) {
            error_log("Shared resources retrieval failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get shared resources', 500);
        }
    }

    /**
     * Create a new shared resource (upload file).
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
        $data = $request->getParsedBody();

        if (!isset($uploadedFiles['file'])) {
            return $this->error($response, 'No file uploaded', 400);
        }

        $uploadedFile = $uploadedFiles['file'];

        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            return $this->error($response, 'File upload error', 400);
        }

        // Validate required fields
        $errors = $this->validateRequired($data, ['name', 'type', 'category']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        // Validate type and category
        if (!in_array($data['type'], SharedResource::VALID_TYPES)) {
            return $this->error($response, 'Invalid resource type', 400);
        }

        if (!array_key_exists($data['category'], SharedResource::VALID_CATEGORIES)) {
            return $this->error($response, 'Invalid resource category', 400);
        }

        if (isset($data['access_level']) && !in_array($data['access_level'], SharedResource::VALID_ACCESS_LEVELS)) {
            return $this->error($response, 'Invalid access level', 400);
        }

        // Validate file size
        if ($uploadedFile->getSize() > SharedResource::MAX_FILE_SIZE) {
            return $this->error($response, 'File size exceeds maximum limit (50MB)', 400);
        }

        $fileName = $uploadedFile->getClientFilename();
        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);

        // Validate file type
        if (!SharedResource::isFileTypeAllowed($fileExtension, $data['type'])) {
            return $this->error($response, 'File type not allowed for this resource type', 400);
        }

        try {
            // Generate file path
            $filePath = SharedResource::generateFilePath($campaignId, $fileName, $data['type']);
            $fullPath = 'uploads/' . $filePath;

            // Create directory if it doesn't exist
            $directory = dirname($fullPath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            // Move uploaded file
            $uploadedFile->moveTo($fullPath);

            // Generate thumbnail for images
            $thumbnailPath = null;
            $thumbnailUrl = null;
            if ($data['type'] === 'image') {
                $thumbnailPath = SharedResource::generateThumbnailPath($filePath);
                $fullThumbnailPath = 'uploads/' . $thumbnailPath;
                
                // Create thumbnail directory if it doesn't exist
                $thumbnailDirectory = dirname($fullThumbnailPath);
                if (!is_dir($thumbnailDirectory)) {
                    mkdir($thumbnailDirectory, 0755, true);
                }

                // Generate thumbnail (simplified - you might want to use a proper image library)
                if ($this->generateThumbnail($fullPath, $fullThumbnailPath)) {
                    $thumbnailUrl = '/uploads/' . $thumbnailPath;
                }
            }

            // Create resource record
            $resource = new SharedResource([
                'user_id' => $userId,
                'campaign_id' => $campaignId,
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'type' => $data['type'],
                'category' => $data['category'],
                'file_path' => $filePath,
                'file_url' => '/uploads/' . $filePath,
                'file_size' => $uploadedFile->getSize(),
                'file_type' => $uploadedFile->getClientMediaType(),
                'thumbnail_path' => $thumbnailPath,
                'thumbnail_url' => $thumbnailUrl,
                'tags' => isset($data['tags']) ? explode(',', $data['tags']) : [],
                'access_level' => $data['access_level'] ?? 'players',
                'uploaded_by_player' => false,
                'player_access_id' => null,
                'download_count' => 0,
                'is_public' => (bool)($data['is_public'] ?? false),
                'metadata' => $data['metadata'] ?? [],
            ]);

            $resource->save();

            return $this->success($response, $resource, 'Resource uploaded successfully', 201);

        } catch (\Exception $e) {
            error_log("Resource upload failed: " . $e->getMessage());
            return $this->error($response, 'Failed to upload resource', 500);
        }
    }

    /**
     * Get a specific shared resource.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $resourceId = $args['id'] ?? null;

        if (!$resourceId) {
            return $this->error($response, 'Resource ID is required', 400);
        }

        try {
            $resource = SharedResource::where('id', $resourceId)
                ->where('user_id', $userId)
                ->first();

            if (!$resource) {
                return $this->notFound($response, 'Resource not found');
            }

            return $this->success($response, $resource);

        } catch (\Exception $e) {
            error_log("Resource retrieval failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get resource', 500);
        }
    }

    /**
     * Update a shared resource.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $resourceId = $args['id'] ?? null;

        if (!$resourceId) {
            return $this->error($response, 'Resource ID is required', 400);
        }

        $data = $this->getRequestData($request);

        try {
            $resource = SharedResource::where('id', $resourceId)
                ->where('user_id', $userId)
                ->first();

            if (!$resource) {
                return $this->notFound($response, 'Resource not found');
            }

            // Validate access level if provided
            if (isset($data['access_level']) && !in_array($data['access_level'], SharedResource::VALID_ACCESS_LEVELS)) {
                return $this->error($response, 'Invalid access level', 400);
            }

            // Update allowed fields
            $allowedFields = ['name', 'description', 'category', 'access_level', 'is_public', 'metadata'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $resource->{$field} = $data[$field];
                }
            }

            // Handle tags specially
            if (isset($data['tags'])) {
                $resource->tags = is_array($data['tags']) ? $data['tags'] : explode(',', $data['tags']);
            }

            $resource->save();

            return $this->success($response, $resource, 'Resource updated successfully');

        } catch (\Exception $e) {
            error_log("Resource update failed: " . $e->getMessage());
            return $this->error($response, 'Failed to update resource', 500);
        }
    }

    /**
     * Delete a shared resource.
     */
    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $resourceId = $args['id'] ?? null;

        if (!$resourceId) {
            return $this->error($response, 'Resource ID is required', 400);
        }

        try {
            $resource = SharedResource::where('id', $resourceId)
                ->where('user_id', $userId)
                ->first();

            if (!$resource) {
                return $this->notFound($response, 'Resource not found');
            }

            // Delete files from filesystem
            $filePath = 'uploads/' . $resource->file_path;
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            if ($resource->thumbnail_path) {
                $thumbnailPath = 'uploads/' . $resource->thumbnail_path;
                if (file_exists($thumbnailPath)) {
                    unlink($thumbnailPath);
                }
            }

            $resource->delete();

            return $this->success($response, null, 'Resource deleted successfully');

        } catch (\Exception $e) {
            error_log("Resource deletion failed: " . $e->getMessage());
            return $this->error($response, 'Failed to delete resource', 500);
        }
    }

    /**
     * Download a resource.
     */
    public function download(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $resourceId = $args['id'] ?? null;

        if (!$resourceId) {
            return $this->error($response, 'Resource ID is required', 400);
        }

        try {
            $resource = SharedResource::where('id', $resourceId)
                ->where('user_id', $userId)
                ->first();

            if (!$resource) {
                return $this->notFound($response, 'Resource not found');
            }

            $filePath = 'uploads/' . $resource->file_path;
            
            if (!file_exists($filePath)) {
                return $this->notFound($response, 'File not found');
            }

            // Increment download count
            $resource->incrementDownload();

            // Return file download response
            $response->getBody()->write(file_get_contents($filePath));
            
            return $response
                ->withHeader('Content-Type', $resource->file_type ?: 'application/octet-stream')
                ->withHeader('Content-Disposition', 'attachment; filename="' . basename($resource->file_path) . '"')
                ->withHeader('Content-Length', (string)$resource->file_size);

        } catch (\Exception $e) {
            error_log("Resource download failed: " . $e->getMessage());
            return $this->error($response, 'Failed to download resource', 500);
        }
    }

    /**
     * Get resource categories and types.
     */
    public function getResourceInfo(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->success($response, [
            'types' => SharedResource::VALID_TYPES,
            'categories' => SharedResource::VALID_CATEGORIES,
            'access_levels' => SharedResource::VALID_ACCESS_LEVELS,
            'max_file_size' => SharedResource::MAX_FILE_SIZE,
            'allowed_file_types' => SharedResource::ALLOWED_FILE_TYPES
        ]);
    }

    /**
     * Player portal resource access.
     */
    public function playerIndex(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $token = $args['token'] ?? null;

        if (!$token) {
            return $this->error($response, 'Access token is required', 400);
        }

        try {
            $playerAccess = PlayerAccess::where('access_token', $token)
                ->where('status', 'active')
                ->first();

            if (!$playerAccess) {
                return $this->notFound($response, 'Invalid or expired access token');
            }

            if (!$playerAccess->hasPermission('view_resources')) {
                return $this->error($response, 'No permission to view resources', 403);
            }

            $queryParams = $this->getQueryParams($request);
            $type = $queryParams['type'] ?? null;
            $category = $queryParams['category'] ?? null;

            $query = SharedResource::where('campaign_id', $playerAccess->campaign_id)
                ->playerAccessible();

            if ($type) {
                $query->byType($type);
            }

            if ($category) {
                $query->byCategory($category);
            }

            $resources = $query->orderBy('created_at', 'desc')->get();

            // Filter out resources that player shouldn't see
            $accessibleResources = $resources->filter(function($resource) use ($playerAccess) {
                return $resource->isAccessibleByPlayer($playerAccess);
            });

            return $this->success($response, $accessibleResources->values());

        } catch (\Exception $e) {
            error_log("Player resource access failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get resources', 500);
        }
    }

    /**
     * Generate thumbnail for image files.
     */
    private function generateThumbnail(string $sourcePath, string $thumbnailPath, int $maxWidth = 200, int $maxHeight = 200): bool
    {
        try {
            $imageInfo = getimagesize($sourcePath);
            if (!$imageInfo) {
                return false;
            }

            list($originalWidth, $originalHeight, $imageType) = $imageInfo;

            // Calculate thumbnail dimensions
            $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
            $thumbnailWidth = (int)($originalWidth * $ratio);
            $thumbnailHeight = (int)($originalHeight * $ratio);

            // Create source image
            switch ($imageType) {
                case IMAGETYPE_JPEG:
                    $sourceImage = imagecreatefromjpeg($sourcePath);
                    break;
                case IMAGETYPE_PNG:
                    $sourceImage = imagecreatefrompng($sourcePath);
                    break;
                case IMAGETYPE_GIF:
                    $sourceImage = imagecreatefromgif($sourcePath);
                    break;
                default:
                    return false;
            }

            if (!$sourceImage) {
                return false;
            }

            // Create thumbnail
            $thumbnail = imagecreatetruecolor($thumbnailWidth, $thumbnailHeight);
            
            // Preserve transparency for PNG and GIF
            if ($imageType === IMAGETYPE_PNG || $imageType === IMAGETYPE_GIF) {
                imagecolortransparent($thumbnail, imagecolorallocatealpha($thumbnail, 0, 0, 0, 127));
                imagealphablending($thumbnail, false);
                imagesavealpha($thumbnail, true);
            }

            imagecopyresampled($thumbnail, $sourceImage, 0, 0, 0, 0, $thumbnailWidth, $thumbnailHeight, $originalWidth, $originalHeight);

            // Save thumbnail
            $result = imagejpeg($thumbnail, $thumbnailPath, 85);

            // Clean up
            imagedestroy($sourceImage);
            imagedestroy($thumbnail);

            return $result;

        } catch (\Exception $e) {
            error_log("Thumbnail generation failed: " . $e->getMessage());
            return false;
        }
    }
}