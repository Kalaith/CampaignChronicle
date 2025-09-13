<?php

namespace App\Models;

class PlayerAccess extends BaseModel
{
    protected $table = 'player_access';

    protected $fillable = [
        'user_id',
        'campaign_id',
        'player_email',
        'player_name',
        'access_token',
        'permissions',
        'character_ids',
        'status',
        'invited_at',
        'joined_at',
        'last_accessed_at',
        'notes',
    ];

    protected $casts = [
        'permissions' => 'array',
        'character_ids' => 'array',
        'invited_at' => 'datetime',
        'joined_at' => 'datetime',
        'last_accessed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Valid access statuses.
     */
    const VALID_STATUSES = ['invited', 'active', 'suspended', 'revoked'];

    /**
     * Default permissions for new players.
     */
    const DEFAULT_PERMISSIONS = [
        'view_own_character' => true,
        'view_campaign_info' => true,
        'view_timeline' => false,
        'view_locations' => false,
        'view_npcs' => false,
        'view_quests' => false,
        'view_notes' => false,
        'add_notes' => false,
        'view_resources' => true,
    ];

    /**
     * Available permission types.
     */
    const AVAILABLE_PERMISSIONS = [
        'view_own_character' => 'View Own Character',
        'view_campaign_info' => 'View Campaign Information',
        'view_timeline' => 'View Campaign Timeline',
        'view_locations' => 'View Locations',
        'view_npcs' => 'View NPCs',
        'view_quests' => 'View Quests',
        'view_notes' => 'View Notes',
        'add_notes' => 'Add Notes',
        'view_resources' => 'View Shared Resources',
        'upload_resources' => 'Upload Resources',
        'edit_own_character' => 'Edit Own Character',
    ];

    /**
     * Get the user that owns this access grant.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the campaign this access grant is for.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Generate a secure access token.
     */
    public static function generateAccessToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Check if player has specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        $permissions = $this->permissions ?? self::DEFAULT_PERMISSIONS;
        return $permissions[$permission] ?? false;
    }

    /**
     * Grant permission to player.
     */
    public function grantPermission(string $permission): void
    {
        $permissions = $this->permissions ?? self::DEFAULT_PERMISSIONS;
        $permissions[$permission] = true;
        $this->permissions = $permissions;
    }

    /**
     * Revoke permission from player.
     */
    public function revokePermission(string $permission): void
    {
        $permissions = $this->permissions ?? self::DEFAULT_PERMISSIONS;
        $permissions[$permission] = false;
        $this->permissions = $permissions;
    }

    /**
     * Get accessible characters for this player.
     */
    public function getAccessibleCharacters()
    {
        if (!$this->character_ids || empty($this->character_ids)) {
            return collect([]);
        }

        return Character::whereIn('id', $this->character_ids)
            ->where('campaign_id', $this->campaign_id)
            ->get();
    }

    /**
     * Add character access.
     */
    public function addCharacterAccess(string $characterId): void
    {
        $characterIds = $this->character_ids ?? [];
        if (!in_array($characterId, $characterIds)) {
            $characterIds[] = $characterId;
            $this->character_ids = $characterIds;
        }
    }

    /**
     * Remove character access.
     */
    public function removeCharacterAccess(string $characterId): void
    {
        $characterIds = $this->character_ids ?? [];
        $this->character_ids = array_values(array_filter($characterIds, function($id) use ($characterId) {
            return $id !== $characterId;
        }));
    }

    /**
     * Update last accessed timestamp.
     */
    public function updateLastAccessed(): void
    {
        $this->last_accessed_at = now();
        $this->save();
    }

    /**
     * Activate player access.
     */
    public function activate(): void
    {
        $this->status = 'active';
        $this->joined_at = now();
    }

    /**
     * Suspend player access.
     */
    public function suspend(): void
    {
        $this->status = 'suspended';
    }

    /**
     * Revoke player access.
     */
    public function revoke(): void
    {
        $this->status = 'revoked';
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get active players.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter by campaign.
     */
    public function scopeByCampaign($query, string $campaignId)
    {
        return $query->where('campaign_id', $campaignId);
    }

    protected function getSearchableFields()
    {
        return ['player_name', 'player_email', 'notes'];
    }
}