<?php

namespace App\Models;

class Relationship extends BaseModel
{
    protected $table = 'relationships';

    protected $fillable = [
        'campaign_id',
        'from_character',
        'to_character',
        'type',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the campaign that owns the relationship.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get the character this relationship originates from.
     */
    public function fromCharacter()
    {
        return $this->belongsTo(Character::class, 'from_character');
    }

    /**
     * Get the character this relationship points to.
     */
    public function toCharacter()
    {
        return $this->belongsTo(Character::class, 'to_character');
    }

    /**
     * Scope a query to only include relationships of a given type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to include relationships involving a specific character.
     */
    public function scopeInvolvingCharacter($query, $characterId)
    {
        return $query->where(function ($q) use ($characterId) {
            $q->where('from_character', $characterId)
              ->orWhere('to_character', $characterId);
        });
    }

    /**
     * Get relationship network data for visualization.
     */
    public static function getNetworkData($campaignId)
    {
        $relationships = static::where('campaign_id', $campaignId)
            ->with(['fromCharacter', 'toCharacter'])
            ->get();

        $nodes = collect();
        $edges = collect();

        // Build nodes and edges for network visualization
        foreach ($relationships as $relationship) {
            // Add source character node
            if (!$nodes->contains('id', $relationship->from_character)) {
                $nodes->push([
                    'id' => $relationship->from_character,
                    'name' => $relationship->fromCharacter->name,
                    'type' => $relationship->fromCharacter->type,
                ]);
            }

            // Add target character node
            if (!$nodes->contains('id', $relationship->to_character)) {
                $nodes->push([
                    'id' => $relationship->to_character,
                    'name' => $relationship->toCharacter->name,
                    'type' => $relationship->toCharacter->type,
                ]);
            }

            // Add edge
            $edges->push([
                'id' => $relationship->id,
                'source' => $relationship->from_character,
                'target' => $relationship->to_character,
                'type' => $relationship->type,
                'description' => $relationship->description,
            ]);
        }

        return [
            'nodes' => $nodes->values(),
            'edges' => $edges->values(),
        ];
    }

    /**
     * Get relationship statistics for a campaign.
     */
    public static function getStatistics($campaignId)
    {
        $relationships = static::where('campaign_id', $campaignId)->get();

        $typeBreakdown = $relationships->groupBy('type')
            ->map(fn($group) => $group->count());

        // Most connected characters
        $characterConnections = collect();
        foreach ($relationships as $rel) {
            $characterConnections->push($rel->from_character);
            $characterConnections->push($rel->to_character);
        }

        $mostConnected = $characterConnections->countBy()
            ->sortDesc()
            ->take(5)
            ->map(function ($count, $characterId) {
                $character = Character::find($characterId);
                return [
                    'character' => $character ? $character->name : 'Unknown',
                    'connections' => $count,
                ];
            });

        return [
            'total_relationships' => $relationships->count(),
            'type_breakdown' => $typeBreakdown,
            'most_connected_characters' => $mostConnected,
            'network_density' => $this->calculateNetworkDensity($campaignId),
        ];
    }

    /**
     * Calculate network density (how connected the character network is).
     */
    private static function calculateNetworkDensity($campaignId)
    {
        $characterCount = Character::where('campaign_id', $campaignId)->count();
        $relationshipCount = static::where('campaign_id', $campaignId)->count();

        if ($characterCount < 2) {
            return 0;
        }

        $maxPossibleRelationships = $characterCount * ($characterCount - 1);
        return round(($relationshipCount * 2) / $maxPossibleRelationships, 3);
    }

    /**
     * Find paths between two characters.
     */
    public static function findPath($fromCharacterId, $toCharacterId, $maxDepth = 3)
    {
        if ($fromCharacterId === $toCharacterId) {
            return [[$fromCharacterId]];
        }

        $visited = collect();
        $paths = collect();

        static::findPathRecursive(
            $fromCharacterId, 
            $toCharacterId, 
            [$fromCharacterId], 
            $visited, 
            $paths, 
            $maxDepth
        );

        return $paths->toArray();
    }

    private static function findPathRecursive($current, $target, $path, $visited, &$paths, $depth)
    {
        if ($depth <= 0) {
            return;
        }

        $visited->push($current);

        $relationships = static::where(function ($q) use ($current) {
            $q->where('from_character', $current)
              ->orWhere('to_character', $current);
        })->get();

        foreach ($relationships as $rel) {
            $next = $rel->from_character === $current ? $rel->to_character : $rel->from_character;

            if ($next === $target) {
                $paths->push(array_merge($path, [$next]));
            } elseif (!$visited->contains($next)) {
                static::findPathRecursive(
                    $next,
                    $target,
                    array_merge($path, [$next]),
                    clone $visited,
                    $paths,
                    $depth - 1
                );
            }
        }
    }

    /**
     * Get relationship summary with character names.
     */
    public function getSummary()
    {
        return [
            'id' => $this->id,
            'from_character' => [
                'id' => $this->fromCharacter->id,
                'name' => $this->fromCharacter->name,
                'type' => $this->fromCharacter->type,
            ],
            'to_character' => [
                'id' => $this->toCharacter->id,
                'name' => $this->toCharacter->name,
                'type' => $this->toCharacter->type,
            ],
            'type' => $this->type,
            'description' => $this->description,
            'created_at' => $this->created_at,
        ];
    }

    protected function getSearchableFields()
    {
        return ['description'];
    }
}