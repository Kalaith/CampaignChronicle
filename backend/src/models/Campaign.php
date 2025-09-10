<?php

namespace App\Models;

class Campaign extends BaseModel
{
    protected $table = 'campaigns';

    protected $fillable = [
        'user_id',
        'name',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the campaign.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all characters for this campaign.
     */
    public function characters()
    {
        return $this->hasMany(Character::class);
    }

    /**
     * Get all locations for this campaign.
     */
    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    /**
     * Get all items for this campaign.
     */
    public function items()
    {
        return $this->hasMany(Item::class);
    }

    /**
     * Get all notes for this campaign.
     */
    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    /**
     * Get all relationships for this campaign.
     */
    public function relationships()
    {
        return $this->hasMany(Relationship::class);
    }

    /**
     * Get all timeline events for this campaign.
     */
    public function timelineEvents()
    {
        return $this->hasMany(TimelineEvent::class);
    }

    /**
     * Get campaign statistics.
     */
    public function getStatsAttribute()
    {
        return [
            'characters' => $this->characters()->count(),
            'locations' => $this->locations()->count(),
            'items' => $this->items()->count(),
            'notes' => $this->notes()->count(),
            'relationships' => $this->relationships()->count(),
            'timeline_events' => $this->timelineEvents()->count(),
        ];
    }

    /**
     * Get character type breakdown.
     */
    public function getCharacterTypeBreakdown()
    {
        return $this->characters()
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();
    }

    /**
     * Get location type breakdown.
     */
    public function getLocationTypeBreakdown()
    {
        return $this->locations()
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();
    }

    /**
     * Get item type breakdown.
     */
    public function getItemTypeBreakdown()
    {
        return $this->items()
            ->selectRaw('type, COUNT(*) as count')
            ->groupBy('type')
            ->pluck('count', 'type')
            ->toArray();
    }

    /**
     * Get recent activity (notes and timeline events).
     */
    public function getRecentActivity($limit = 10)
    {
        $notes = $this->notes()
            ->select('id', 'title as name', 'updated_at', \DB::raw("'note' as type"))
            ->orderBy('updated_at', 'desc')
            ->limit($limit);

        $events = $this->timelineEvents()
            ->select('id', 'title as name', 'updated_at', \DB::raw("'event' as type"))
            ->orderBy('updated_at', 'desc')
            ->limit($limit);

        return $notes->union($events)
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Search across all campaign entities.
     */
    public function searchEntities($term, $types = null)
    {
        $results = collect();

        $searchTypes = $types ?? ['characters', 'locations', 'items', 'notes', 'timeline_events'];

        foreach ($searchTypes as $type) {
            switch ($type) {
                case 'characters':
                    $entities = $this->characters()->search($term)->get()
                        ->map(fn($item) => ['type' => 'character', 'data' => $item]);
                    break;
                case 'locations':
                    $entities = $this->locations()->search($term)->get()
                        ->map(fn($item) => ['type' => 'location', 'data' => $item]);
                    break;
                case 'items':
                    $entities = $this->items()->search($term)->get()
                        ->map(fn($item) => ['type' => 'item', 'data' => $item]);
                    break;
                case 'notes':
                    $entities = $this->notes()->search($term)->get()
                        ->map(fn($item) => ['type' => 'note', 'data' => $item]);
                    break;
                case 'timeline_events':
                    $entities = $this->timelineEvents()->search($term)->get()
                        ->map(fn($item) => ['type' => 'timeline_event', 'data' => $item]);
                    break;
                default:
                    $entities = collect();
            }

            $results = $results->concat($entities);
        }

        return $results;
    }

    /**
     * Export campaign data.
     */
    public function exportData()
    {
        return [
            'campaign' => $this->only(['id', 'name', 'description', 'created_at', 'updated_at']),
            'characters' => $this->characters()->get(),
            'locations' => $this->locations()->get(),
            'items' => $this->items()->get(),
            'notes' => $this->notes()->get(),
            'relationships' => $this->relationships()->get(),
            'timeline_events' => $this->timelineEvents()->get(),
            'exported_at' => now()->toISOString(),
            'version' => '1.0.0',
        ];
    }

    protected function getSearchableFields()
    {
        return ['name', 'description'];
    }
}