<?php

namespace App\Models;

class TimelineEvent extends BaseModel
{
    protected $table = 'timeline_events';

    protected $fillable = [
        'campaign_id',
        'title',
        'description',
        'date',
        'session_number',
        'type',
        'tags',
        'related_characters',
        'related_locations',
    ];

    protected $casts = [
        'tags' => 'array',
        'related_characters' => 'array',
        'related_locations' => 'array',
        'session_number' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the campaign that owns the timeline event.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get related characters.
     */
    public function getRelatedCharacters()
    {
        if (empty($this->related_characters)) {
            return collect();
        }

        return Character::whereIn('id', $this->related_characters)->get();
    }

    /**
     * Get related locations.
     */
    public function getRelatedLocations()
    {
        if (empty($this->related_locations)) {
            return collect();
        }

        return Location::whereIn('id', $this->related_locations)->get();
    }

    /**
     * Scope a query to only include events of a given type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include events from a specific session.
     */
    public function scopeFromSession($query, $sessionNumber)
    {
        return $query->where('session_number', $sessionNumber);
    }

    /**
     * Scope a query to order events chronologically.
     */
    public function scopeChronological($query)
    {
        return $query->orderBy('session_number')->orderBy('date');
    }

    /**
     * Scope a query to include events related to a character.
     */
    public function scopeRelatedToCharacter($query, $characterId)
    {
        return $query->whereJsonContains('related_characters', $characterId);
    }

    /**
     * Scope a query to include events related to a location.
     */
    public function scopeRelatedToLocation($query, $locationId)
    {
        return $query->whereJsonContains('related_locations', $locationId);
    }

    /**
     * Get timeline events grouped by session.
     */
    public static function getGroupedBySession($campaignId)
    {
        return static::where('campaign_id', $campaignId)
            ->orderBy('session_number')
            ->orderBy('created_at')
            ->get()
            ->groupBy('session_number')
            ->map(function ($events, $session) {
                return [
                    'session_number' => $session,
                    'event_count' => $events->count(),
                    'events' => $events->values(),
                ];
            })
            ->values();
    }

    /**
     * Get timeline statistics for a campaign.
     */
    public static function getStatistics($campaignId)
    {
        $events = static::where('campaign_id', $campaignId)->get();

        $typeBreakdown = $events->groupBy('type')
            ->map(fn($group) => $group->count());

        $sessionBreakdown = $events->whereNotNull('session_number')
            ->groupBy('session_number')
            ->map(fn($group) => $group->count())
            ->sortKeys();

        $recentEvents = $events->where('created_at', '>=', now()->subDays(30))
            ->count();

        return [
            'total_events' => $events->count(),
            'type_breakdown' => $typeBreakdown,
            'session_breakdown' => $sessionBreakdown,
            'recent_events' => $recentEvents,
            'sessions_recorded' => $events->whereNotNull('session_number')->unique('session_number')->count(),
        ];
    }

    /**
     * Get events activity over time.
     */
    public static function getActivity($campaignId, $days = 30)
    {
        return static::where('campaign_id', $campaignId)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn($item) => [$item->date => $item->count]);
    }

    /**
     * Find events that mention a specific entity.
     */
    public static function findMentions($campaignId, $entityName)
    {
        return static::where('campaign_id', $campaignId)
            ->where(function ($q) use ($entityName) {
                $q->where('title', 'LIKE', "%{$entityName}%")
                  ->orWhere('description', 'LIKE', "%{$entityName}%");
            })
            ->get();
    }

    /**
     * Get character involvement in timeline.
     */
    public static function getCharacterInvolvement($campaignId, $characterId)
    {
        return static::where('campaign_id', $campaignId)
            ->whereJsonContains('related_characters', $characterId)
            ->chronological()
            ->get();
    }

    /**
     * Get location history from timeline.
     */
    public static function getLocationHistory($campaignId, $locationId)
    {
        return static::where('campaign_id', $campaignId)
            ->whereJsonContains('related_locations', $locationId)
            ->chronological()
            ->get();
    }

    /**
     * Add related entity to the event.
     */
    public function addRelatedCharacter($characterId)
    {
        $characters = $this->related_characters ?? [];
        if (!in_array($characterId, $characters)) {
            $characters[] = $characterId;
            $this->related_characters = $characters;
        }
        return $this;
    }

    /**
     * Add related location to the event.
     */
    public function addRelatedLocation($locationId)
    {
        $locations = $this->related_locations ?? [];
        if (!in_array($locationId, $locations)) {
            $locations[] = $locationId;
            $this->related_locations = $locations;
        }
        return $this;
    }

    /**
     * Get event summary with related entities.
     */
    public function getSummary()
    {
        $relatedCharacters = $this->getRelatedCharacters();
        $relatedLocations = $this->getRelatedLocations();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'date' => $this->date,
            'session_number' => $this->session_number,
            'type' => $this->type,
            'related_characters' => $relatedCharacters->map(fn($char) => [
                'id' => $char->id,
                'name' => $char->name,
                'type' => $char->type,
            ])->values(),
            'related_locations' => $relatedLocations->map(fn($loc) => [
                'id' => $loc->id,
                'name' => $loc->name,
                'type' => $loc->type,
            ])->values(),
            'tags' => $this->tags ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function getSearchableFields()
    {
        return ['title', 'description'];
    }
}