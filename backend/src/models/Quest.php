<?php

namespace App\Models;

class Quest extends BaseModel
{
    protected $table = 'quests';

    protected $fillable = [
        'user_id',
        'campaign_id',
        'title',
        'description',
        'status',
        'priority',
        'quest_giver',
        'rewards',
        'objectives',
        'related_characters',
        'related_locations',
        'tags',
        'completed_at',
    ];

    protected $casts = [
        'objectives' => 'array',
        'related_characters' => 'array',
        'related_locations' => 'array',
        'tags' => 'array',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Valid quest statuses.
     */
    const VALID_STATUSES = ['active', 'completed', 'failed', 'on-hold'];

    /**
     * Valid quest priorities.
     */
    const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

    /**
     * Get the user that owns the quest.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the campaign that owns the quest.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get the quest giver character.
     */
    public function questGiver()
    {
        return $this->belongsTo(Character::class, 'quest_giver');
    }

    /**
     * Get related characters.
     */
    public function relatedCharacters()
    {
        if (empty($this->related_characters)) {
            return collect();
        }

        return Character::whereIn('id', $this->related_characters)->get();
    }

    /**
     * Get related locations.
     */
    public function relatedLocations()
    {
        if (empty($this->related_locations)) {
            return collect();
        }

        return Location::whereIn('id', $this->related_locations)->get();
    }

    /**
     * Add an objective to the quest.
     */
    public function addObjective(string $description): string
    {
        $objectives = $this->objectives ?? [];
        $objectiveId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $objectives[] = [
            'id' => $objectiveId,
            'description' => $description,
            'completed' => false,
            'completedAt' => null,
        ];
        
        $this->objectives = $objectives;
        return $objectiveId;
    }

    /**
     * Update an objective.
     */
    public function updateObjective(string $objectiveId, array $updates): bool
    {
        $objectives = $this->objectives ?? [];
        
        foreach ($objectives as $index => $objective) {
            if ($objective['id'] === $objectiveId) {
                $objectives[$index] = array_merge($objective, $updates);
                
                // Set completedAt timestamp if marking as completed
                if (isset($updates['completed']) && $updates['completed'] && !$objective['completed']) {
                    $objectives[$index]['completedAt'] = now()->toISOString();
                }
                
                $this->objectives = $objectives;
                return true;
            }
        }
        
        return false;
    }

    /**
     * Remove an objective from the quest.
     */
    public function removeObjective(string $objectiveId): bool
    {
        $objectives = $this->objectives ?? [];
        $originalCount = count($objectives);
        
        $this->objectives = array_values(array_filter($objectives, function ($objective) use ($objectiveId) {
            return $objective['id'] !== $objectiveId;
        }));
        
        return count($this->objectives) < $originalCount;
    }

    /**
     * Mark objective as completed.
     */
    public function completeObjective(string $objectiveId): bool
    {
        return $this->updateObjective($objectiveId, [
            'completed' => true,
            'completedAt' => now()->toISOString(),
        ]);
    }

    /**
     * Get quest completion percentage.
     */
    public function getCompletionPercentageAttribute(): int
    {
        $objectives = $this->objectives ?? [];
        if (empty($objectives)) {
            return 0;
        }

        $completedCount = count(array_filter($objectives, fn($obj) => $obj['completed']));
        return round(($completedCount / count($objectives)) * 100);
    }

    /**
     * Check if all objectives are completed.
     */
    public function areAllObjectivesCompleted(): bool
    {
        $objectives = $this->objectives ?? [];
        if (empty($objectives)) {
            return false;
        }

        return count(array_filter($objectives, fn($obj) => $obj['completed'])) === count($objectives);
    }

    /**
     * Mark quest as completed.
     */
    public function markAsCompleted(): void
    {
        $this->status = 'completed';
        $this->completed_at = now();
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by priority.
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope to get active quests.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get completed quests.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope to order by priority.
     */
    public function scopeOrderByPriority($query, string $direction = 'desc')
    {
        $priorityOrder = ['critical' => 4, 'high' => 3, 'medium' => 2, 'low' => 1];
        
        $cases = [];
        foreach ($priorityOrder as $priority => $order) {
            $cases[] = "WHEN priority = '{$priority}' THEN {$order}";
        }
        $caseStatement = 'CASE ' . implode(' ', $cases) . ' ELSE 0 END';
        
        return $query->orderByRaw("{$caseStatement} {$direction}");
    }

    /**
     * Get quest statistics.
     */
    public static function getStatistics(string $campaignId): array
    {
        $quests = static::where('campaign_id', $campaignId);
        
        return [
            'total' => $quests->count(),
            'active' => $quests->where('status', 'active')->count(),
            'completed' => $quests->where('status', 'completed')->count(),
            'failed' => $quests->where('status', 'failed')->count(),
            'on_hold' => $quests->where('status', 'on-hold')->count(),
            'by_priority' => [
                'critical' => $quests->where('priority', 'critical')->count(),
                'high' => $quests->where('priority', 'high')->count(),
                'medium' => $quests->where('priority', 'medium')->count(),
                'low' => $quests->where('priority', 'low')->count(),
            ],
        ];
    }

    protected function getSearchableFields()
    {
        return ['title', 'description', 'rewards'];
    }
}