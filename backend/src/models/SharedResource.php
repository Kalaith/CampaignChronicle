<?php

namespace App\Models;

class SharedResource extends BaseModel
{
    protected $table = 'shared_resources';

    protected $fillable = [
        'user_id',
        'campaign_id',
        'name',
        'description',
        'type',
        'category',
        'file_path',
        'file_url',
        'file_size',
        'file_type',
        'thumbnail_path',
        'thumbnail_url',
        'tags',
        'access_level',
        'uploaded_by_player',
        'player_access_id',
        'download_count',
        'is_public',
        'metadata',
    ];

    protected $casts = [
        'tags' => 'array',
        'metadata' => 'array',
        'file_size' => 'integer',
        'download_count' => 'integer',
        'is_public' => 'boolean',
        'uploaded_by_player' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Valid resource types.
     */
    const VALID_TYPES = ['image', 'document', 'audio', 'video', 'map', 'handout', 'reference', 'other'];

    /**
     * Valid categories.
     */
    const VALID_CATEGORIES = [
        'maps' => 'Maps & Battle Maps',
        'characters' => 'Character Art',
        'locations' => 'Location Images',
        'items' => 'Item Illustrations',
        'monsters' => 'Monster Art',
        'handouts' => 'Player Handouts',
        'references' => 'Rules & References',
        'audio' => 'Music & Sound Effects',
        'documents' => 'Documents',
        'other' => 'Other Resources'
    ];

    /**
     * Valid access levels.
     */
    const VALID_ACCESS_LEVELS = ['dm_only', 'players', 'public'];

    /**
     * Max file size in bytes (50MB).
     */
    const MAX_FILE_SIZE = 52428800;

    /**
     * Allowed file types by category.
     */
    const ALLOWED_FILE_TYPES = [
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        'document' => ['pdf', 'doc', 'docx', 'txt', 'rtf'],
        'audio' => ['mp3', 'wav', 'ogg', 'm4a'],
        'video' => ['mp4', 'webm', 'mov', 'avi'],
        'other' => ['zip', 'rar', '7z']
    ];

    /**
     * Get the user that owns the resource.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the campaign that owns the resource.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get the player access that uploaded this (if applicable).
     */
    public function playerAccess()
    {
        return $this->belongsTo(PlayerAccess::class);
    }

    /**
     * Generate file path for storage.
     */
    public static function generateFilePath(string $campaignId, string $fileName, string $type): string
    {
        $date = date('Y/m');
        $sanitizedName = preg_replace('/[^a-zA-Z0-9.-]/', '_', $fileName);
        return "campaigns/{$campaignId}/resources/{$type}/{$date}/{$sanitizedName}";
    }

    /**
     * Generate thumbnail path.
     */
    public static function generateThumbnailPath(string $filePath): string
    {
        $pathInfo = pathinfo($filePath);
        return $pathInfo['dirname'] . '/thumbnails/' . $pathInfo['filename'] . '_thumb.jpg';
    }

    /**
     * Get file extension.
     */
    public function getFileExtension(): string
    {
        return pathinfo($this->file_path, PATHINFO_EXTENSION);
    }

    /**
     * Check if file type is allowed for the resource type.
     */
    public static function isFileTypeAllowed(string $fileExtension, string $resourceType): bool
    {
        $allowedTypes = self::ALLOWED_FILE_TYPES[$resourceType] ?? [];
        return in_array(strtolower($fileExtension), $allowedTypes);
    }

    /**
     * Get human readable file size.
     */
    public function getFormattedFileSize(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Increment download count.
     */
    public function incrementDownload(): void
    {
        $this->increment('download_count');
    }

    /**
     * Add tag to resource.
     */
    public function addTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tag = strtolower(trim($tag));
        
        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->tags = $tags;
        }
    }

    /**
     * Remove tag from resource.
     */
    public function removeTag(string $tag): void
    {
        $tags = $this->tags ?? [];
        $tag = strtolower(trim($tag));
        
        $this->tags = array_values(array_filter($tags, function($t) use ($tag) {
            return $t !== $tag;
        }));
    }

    /**
     * Check if resource is accessible by player.
     */
    public function isAccessibleByPlayer(PlayerAccess $playerAccess): bool
    {
        // DM-only resources are not accessible
        if ($this->access_level === 'dm_only') {
            return false;
        }

        // Player must have view_resources permission
        if (!$playerAccess->hasPermission('view_resources')) {
            return false;
        }

        // Public resources are always accessible
        if ($this->access_level === 'public') {
            return true;
        }

        // Player-level resources are accessible if in same campaign
        return $this->campaign_id === $playerAccess->campaign_id;
    }

    /**
     * Scope to filter by type.
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter by category.
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope to filter by access level.
     */
    public function scopeByAccessLevel($query, string $accessLevel)
    {
        return $query->where('access_level', $accessLevel);
    }

    /**
     * Scope to get public resources.
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope to get resources accessible by players.
     */
    public function scopePlayerAccessible($query)
    {
        return $query->whereIn('access_level', ['players', 'public']);
    }

    /**
     * Scope to search by tags.
     */
    public function scopeWithTag($query, string $tag)
    {
        return $query->whereJsonContains('tags', strtolower($tag));
    }

    /**
     * Scope to get popular resources.
     */
    public function scopePopular($query, int $minDownloads = 5)
    {
        return $query->where('download_count', '>=', $minDownloads)
                    ->orderBy('download_count', 'desc');
    }

    protected function getSearchableFields()
    {
        return ['name', 'description', 'tags'];
    }
}