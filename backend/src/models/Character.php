<?php

namespace App\Models;

class Character extends BaseModel
{
    protected $table = 'characters';

    protected $fillable = [
        'campaign_id',
        'name',
        'type',
        'race',
        'class',
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
     * Get the campaign that owns the character.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get the location where this character is.
     */
    public function locationEntity()
    {
        return $this->belongsTo(Location::class, 'location');
    }

    /**
     * Get relationships where this character is the source.
     */
    public function relationshipsFrom()
    {
        return $this->hasMany(Relationship::class, 'from_character');
    }

    /**
     * Get relationships where this character is the target.
     */
    public function relationshipsTo()
    {
        return $this->hasMany(Relationship::class, 'to_character');
    }

    /**
     * Get all relationships for this character.
     */
    public function allRelationships()
    {
        return Relationship::where('from_character', $this->id)
            ->orWhere('to_character', $this->id)
            ->get();
    }

    /**
     * Get items owned by this character.
     */
    public function ownedItems()
    {
        return $this->hasMany(Item::class, 'owner');
    }

    /**
     * Get timeline events related to this character.
     */
    public function timelineEvents()
    {
        return TimelineEvent::whereJsonContains('related_characters', $this->id)->get();
    }

    /**
     * Scope a query to only include characters of a given type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include characters at a specific location.
     */
    public function scopeAtLocation($query, $locationId)
    {
        return $query->where('location', $locationId);
    }

    /**
     * Get character's network connections.
     */
    public function getNetworkConnections()
    {
        $connections = [];
        
        $outgoing = $this->relationshipsFrom()->with('toCharacter')->get();
        foreach ($outgoing as $rel) {
            $connections[] = [
                'character' => $rel->toCharacter,
                'relationship_type' => $rel->type,
                'direction' => 'outgoing',
                'description' => $rel->description,
            ];
        }

        $incoming = $this->relationshipsTo()->with('fromCharacter')->get();
        foreach ($incoming as $rel) {
            $connections[] = [
                'character' => $rel->fromCharacter,
                'relationship_type' => $rel->type,
                'direction' => 'incoming',
                'description' => $rel->description,
            ];
        }

        return $connections;
    }

    /**
     * Get character summary with related data.
     */
    public function getSummary()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'race' => $this->race,
            'class' => $this->class,
            'description' => $this->description,
            'location' => $this->locationEntity ? $this->locationEntity->name : null,
            'relationships_count' => $this->allRelationships()->count(),
            'owned_items_count' => $this->ownedItems()->count(),
            'timeline_events_count' => $this->timelineEvents()->count(),
            'tags' => $this->tags ?? [],
        ];
    }

    protected function getSearchableFields()
    {
        return ['name', 'description', 'race', 'class'];
    }
}