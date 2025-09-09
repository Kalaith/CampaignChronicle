<?php

namespace App\Models;

class Location extends BaseModel
{
    protected $table = 'locations';

    protected $fillable = [
        'campaign_id',
        'name',
        'type',
        'parent_id',
        'description',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the campaign that owns the location.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get the parent location.
     */
    public function parent()
    {
        return $this->belongsTo(Location::class, 'parent_id');
    }

    /**
     * Get child locations.
     */
    public function children()
    {
        return $this->hasMany(Location::class, 'parent_id');
    }

    /**
     * Get all descendant locations.
     */
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get characters at this location.
     */
    public function characters()
    {
        return $this->hasMany(Character::class, 'location');
    }

    /**
     * Get items at this location.
     */
    public function items()
    {
        return $this->hasMany(Item::class, 'location');
    }

    /**
     * Get timeline events related to this location.
     */
    public function timelineEvents()
    {
        return TimelineEvent::whereJsonContains('related_locations', $this->id)->get();
    }

    /**
     * Scope a query to only include root locations (no parent).
     */
    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope a query to only include locations of a given type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get the full hierarchy path for this location.
     */
    public function getHierarchyPath()
    {
        $path = [$this->name];
        $current = $this->parent;
        
        while ($current) {
            array_unshift($path, $current->name);
            $current = $current->parent;
        }
        
        return implode(' > ', $path);
    }

    /**
     * Get location tree structure.
     */
    public static function getTree($campaignId, $parentId = null)
    {
        return static::where('campaign_id', $campaignId)
            ->where('parent_id', $parentId)
            ->with(['children' => function ($query) use ($campaignId) {
                $query->orderBy('name');
            }])
            ->orderBy('name')
            ->get()
            ->map(function ($location) use ($campaignId) {
                return [
                    'id' => $location->id,
                    'name' => $location->name,
                    'type' => $location->type,
                    'description' => $location->description,
                    'tags' => $location->tags,
                    'characters_count' => $location->characters()->count(),
                    'items_count' => $location->items()->count(),
                    'children' => static::getTree($campaignId, $location->id),
                ];
            });
    }

    /**
     * Get all ancestors of this location.
     */
    public function getAncestors()
    {
        $ancestors = collect();
        $current = $this->parent;
        
        while ($current) {
            $ancestors->prepend($current);
            $current = $current->parent;
        }
        
        return $ancestors;
    }

    /**
     * Get all descendants of this location.
     */
    public function getAllDescendants()
    {
        $descendants = collect();
        
        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->concat($child->getAllDescendants());
        }
        
        return $descendants;
    }

    /**
     * Check if this location is an ancestor of another location.
     */
    public function isAncestorOf(Location $location)
    {
        return $location->getAncestors()->contains('id', $this->id);
    }

    /**
     * Check if this location is a descendant of another location.
     */
    public function isDescendantOf(Location $location)
    {
        return $this->getAncestors()->contains('id', $location->id);
    }

    /**
     * Get location summary with hierarchy information.
     */
    public function getSummary()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'type' => $this->type,
            'description' => $this->description,
            'hierarchy_path' => $this->getHierarchyPath(),
            'parent' => $this->parent ? $this->parent->name : null,
            'children_count' => $this->children()->count(),
            'characters_count' => $this->characters()->count(),
            'items_count' => $this->items()->count(),
            'timeline_events_count' => $this->timelineEvents()->count(),
            'tags' => $this->tags ?? [],
        ];
    }

    protected function getSearchableFields()
    {
        return ['name', 'description'];
    }
}