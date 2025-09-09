<?php

namespace App\Models;

class Item extends BaseModel
{
    protected $table = 'items';

    protected $fillable = [
        'campaign_id',
        'name',
        'type',
        'owner',
        'location',
        'description',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the campaign that owns the item.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get the character that owns this item.
     */
    public function ownerCharacter()
    {
        return $this->belongsTo(Character::class, 'owner');
    }

    /**
     * Get the location where this item is.
     */
    public function locationEntity()
    {
        return $this->belongsTo(Location::class, 'location');
    }

    /**
     * Scope a query to only include items of a given type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include items owned by a specific character.
     */
    public function scopeOwnedBy($query, $characterId)
    {
        return $query->where('owner', $characterId);
    }

    /**
     * Scope a query to only include items at a specific location.
     */
    public function scopeAtLocation($query, $locationId)
    {
        return $query->where('location', $locationId);
    }

    /**
     * Scope a query to only include unowned items.
     */
    public function scopeUnowned($query)
    {
        return $query->whereNull('owner');
    }

    /**
     * Get item's current holder (character or location).
     */
    public function getCurrentHolder()
    {
        if ($this->owner) {
            return [
                'type' => 'character',
                'data' => $this->ownerCharacter,
            ];
        }

        if ($this->location) {
            return [
                'type' => 'location',
                'data' => $this->locationEntity,
            ];
        }

        return null;
    }

    /**
     * Transfer item to a character.
     */
    public function transferToCharacter($characterId)
    {
        $this->owner = $characterId;
        $this->location = null;
        return $this->save();
    }

    /**
     * Transfer item to a location.
     */
    public function transferToLocation($locationId)
    {
        $this->location = $locationId;
        $this->owner = null;
        return $this->save();
    }

    /**
     * Get item summary with holder information.
     */
    public function getSummary()
    {
        $holder = $this->getCurrentHolder();
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'description' => $this->description,
            'holder' => $holder ? [
                'type' => $holder['type'],
                'name' => $holder['data']->name ?? 'Unknown',
                'id' => $holder['data']->id ?? null,
            ] : null,
            'tags' => $this->tags ?? [],
        ];
    }

    /**
     * Get items grouped by type for a campaign.
     */
    public static function getGroupedByType($campaignId)
    {
        return static::where('campaign_id', $campaignId)
            ->get()
            ->groupBy('type')
            ->map(function ($items, $type) {
                return [
                    'type' => $type,
                    'count' => $items->count(),
                    'items' => $items->values(),
                ];
            })
            ->values();
    }

    /**
     * Get items by ownership status.
     */
    public static function getByOwnership($campaignId)
    {
        $items = static::where('campaign_id', $campaignId)->get();

        return [
            'owned' => $items->whereNotNull('owner')->values(),
            'located' => $items->whereNull('owner')->whereNotNull('location')->values(),
            'unassigned' => $items->whereNull('owner')->whereNull('location')->values(),
        ];
    }

    protected function getSearchableFields()
    {
        return ['name', 'description'];
    }
}