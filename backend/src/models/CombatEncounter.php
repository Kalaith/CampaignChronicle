<?php

namespace App\Models;

class CombatEncounter extends BaseModel
{
    protected $table = 'combat_encounters';

    protected $fillable = [
        'user_id',
        'campaign_id',
        'name',
        'description',
        'status',
        'current_round',
        'current_turn',
        'initiative_order',
        'combatants',
        'environment_effects',
        'notes',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'initiative_order' => 'array',
        'combatants' => 'array',
        'environment_effects' => 'array',
        'current_round' => 'integer',
        'current_turn' => 'integer',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Valid encounter statuses.
     */
    const VALID_STATUSES = ['preparing', 'active', 'paused', 'completed'];

    /**
     * Predefined status effects.
     */
    const PREDEFINED_STATUS_EFFECTS = [
        ['name' => 'Blessed', 'description' => '+1d4 to attack rolls and saves', 'type' => 'buff'],
        ['name' => 'Poisoned', 'description' => 'Disadvantage on attack rolls and ability checks', 'type' => 'debuff'],
        ['name' => 'Paralyzed', 'description' => 'Cannot move or act', 'type' => 'debuff'],
        ['name' => 'Stunned', 'description' => 'Cannot move or act, fails Str/Dex saves', 'type' => 'debuff'],
        ['name' => 'Charmed', 'description' => 'Cannot attack charmer, charmer has advantage on social interactions', 'type' => 'debuff'],
        ['name' => 'Frightened', 'description' => 'Disadvantage on ability checks and attacks while source is in sight', 'type' => 'debuff'],
        ['name' => 'Blinded', 'description' => 'Cannot see, auto-fail sight checks, disadvantage on attacks', 'type' => 'debuff'],
        ['name' => 'Deafened', 'description' => 'Cannot hear, auto-fail hearing checks', 'type' => 'debuff'],
        ['name' => 'Prone', 'description' => 'Can only crawl, disadvantage on melee attacks', 'type' => 'debuff'],
        ['name' => 'Restrained', 'description' => 'Speed 0, disadvantage on attacks and Dex saves', 'type' => 'debuff'],
        ['name' => 'Haste', 'description' => 'Double speed, extra action, +2 AC', 'type' => 'buff'],
        ['name' => 'Slow', 'description' => 'Half speed, -2 AC, limited actions', 'type' => 'debuff'],
        ['name' => 'Invisible', 'description' => 'Cannot be seen, advantage on attacks', 'type' => 'buff'],
        ['name' => 'Concentration', 'description' => 'Maintaining a spell', 'type' => 'neutral'],
    ];

    /**
     * Get the user that owns the encounter.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the campaign that owns the encounter.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Add a combatant to the encounter.
     */
    public function addCombatant(array $combatantData): string
    {
        $combatants = $this->combatants ?? [];
        $combatantId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $combatant = [
            'id' => $combatantId,
            'name' => $combatantData['name'],
            'initiative' => (int)$combatantData['initiative'],
            'hp' => (int)$combatantData['hp'],
            'max_hp' => (int)$combatantData['max_hp'],
            'ac' => (int)($combatantData['ac'] ?? 10),
            'status_effects' => [],
            'is_player' => (bool)($combatantData['is_player'] ?? false),
            'notes' => $combatantData['notes'] ?? '',
            'character_id' => $combatantData['character_id'] ?? null,
        ];
        
        $combatants[] = $combatant;
        $this->combatants = $combatants;
        
        // Re-sort initiative order
        $this->sortInitiativeOrder();
        
        return $combatantId;
    }

    /**
     * Update a combatant.
     */
    public function updateCombatant(string $combatantId, array $updates): bool
    {
        $combatants = $this->combatants ?? [];
        
        foreach ($combatants as $index => $combatant) {
            if ($combatant['id'] === $combatantId) {
                $combatants[$index] = array_merge($combatant, $updates);
                $this->combatants = $combatants;
                
                // Re-sort if initiative changed
                if (isset($updates['initiative'])) {
                    $this->sortInitiativeOrder();
                }
                
                return true;
            }
        }
        
        return false;
    }

    /**
     * Remove a combatant.
     */
    public function removeCombatant(string $combatantId): bool
    {
        $combatants = $this->combatants ?? [];
        $originalCount = count($combatants);
        
        $this->combatants = array_values(array_filter($combatants, function($combatant) use ($combatantId) {
            return $combatant['id'] !== $combatantId;
        }));
        
        if (count($this->combatants) < $originalCount) {
            $this->sortInitiativeOrder();
            return true;
        }
        
        return false;
    }

    /**
     * Add status effect to a combatant.
     */
    public function addStatusEffect(string $combatantId, array $statusEffectData): ?string
    {
        $combatants = $this->combatants ?? [];
        $effectId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        foreach ($combatants as $index => $combatant) {
            if ($combatant['id'] === $combatantId) {
                $statusEffect = [
                    'id' => $effectId,
                    'name' => $statusEffectData['name'],
                    'description' => $statusEffectData['description'],
                    'duration' => (int)($statusEffectData['duration'] ?? -1),
                    'type' => $statusEffectData['type'] ?? 'neutral',
                ];
                
                $combatant['status_effects'][] = $statusEffect;
                $combatants[$index] = $combatant;
                $this->combatants = $combatants;
                
                return $effectId;
            }
        }
        
        return null;
    }

    /**
     * Remove status effect from a combatant.
     */
    public function removeStatusEffect(string $combatantId, string $effectId): bool
    {
        $combatants = $this->combatants ?? [];
        
        foreach ($combatants as $index => $combatant) {
            if ($combatant['id'] === $combatantId) {
                $originalCount = count($combatant['status_effects']);
                $combatant['status_effects'] = array_values(array_filter($combatant['status_effects'], function($effect) use ($effectId) {
                    return $effect['id'] !== $effectId;
                }));
                
                if (count($combatant['status_effects']) < $originalCount) {
                    $combatants[$index] = $combatant;
                    $this->combatants = $combatants;
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Start the encounter.
     */
    public function startEncounter(): void
    {
        $this->status = 'active';
        $this->current_round = 1;
        $this->current_turn = 0;
        $this->started_at = now();
        $this->sortInitiativeOrder();
    }

    /**
     * End the encounter.
     */
    public function endEncounter(): void
    {
        $this->status = 'completed';
        $this->ended_at = now();
    }

    /**
     * Advance to next turn.
     */
    public function nextTurn(): array
    {
        $combatants = $this->combatants ?? [];
        if (empty($combatants)) {
            return ['round' => $this->current_round, 'turn' => $this->current_turn];
        }

        $this->current_turn = ($this->current_turn + 1) % count($combatants);
        
        if ($this->current_turn === 0) {
            $this->current_round += 1;
            $this->processEndOfRoundEffects();
        }

        return [
            'round' => $this->current_round,
            'turn' => $this->current_turn,
            'current_combatant' => $this->getCurrentCombatant()
        ];
    }

    /**
     * Get current combatant.
     */
    public function getCurrentCombatant(): ?array
    {
        $combatants = $this->combatants ?? [];
        if (empty($combatants) || $this->current_turn >= count($combatants)) {
            return null;
        }

        return $combatants[$this->current_turn] ?? null;
    }

    /**
     * Sort combatants by initiative (highest first).
     */
    private function sortInitiativeOrder(): void
    {
        $combatants = $this->combatants ?? [];
        
        usort($combatants, function($a, $b) {
            // Sort by initiative (descending), then by name (ascending) for ties
            if ($a['initiative'] === $b['initiative']) {
                return strcmp($a['name'], $b['name']);
            }
            return $b['initiative'] <=> $a['initiative'];
        });
        
        $this->combatants = $combatants;
        $this->initiative_order = array_column($combatants, 'id');
        
        // Reset turn if needed
        if ($this->current_turn >= count($combatants)) {
            $this->current_turn = 0;
        }
    }

    /**
     * Process end of round status effect durations.
     */
    private function processEndOfRoundEffects(): void
    {
        $combatants = $this->combatants ?? [];
        
        foreach ($combatants as $index => $combatant) {
            foreach ($combatant['status_effects'] as $effectIndex => $effect) {
                if ($effect['duration'] > 0) {
                    $combatants[$index]['status_effects'][$effectIndex]['duration']--;
                    
                    // Remove expired effects
                    if ($combatants[$index]['status_effects'][$effectIndex]['duration'] <= 0) {
                        unset($combatants[$index]['status_effects'][$effectIndex]);
                        $combatants[$index]['status_effects'] = array_values($combatants[$index]['status_effects']);
                    }
                }
            }
        }
        
        $this->combatants = $combatants;
    }

    /**
     * Apply damage to a combatant.
     */
    public function applyDamage(string $combatantId, int $damage): bool
    {
        return $this->updateCombatant($combatantId, [
            'hp' => max(0, $this->getCombatant($combatantId)['hp'] - $damage)
        ]);
    }

    /**
     * Apply healing to a combatant.
     */
    public function applyHealing(string $combatantId, int $healing): bool
    {
        $combatant = $this->getCombatant($combatantId);
        if (!$combatant) return false;
        
        return $this->updateCombatant($combatantId, [
            'hp' => min($combatant['max_hp'], $combatant['hp'] + $healing)
        ]);
    }

    /**
     * Get combatant by ID.
     */
    public function getCombatant(string $combatantId): ?array
    {
        $combatants = $this->combatants ?? [];
        
        foreach ($combatants as $combatant) {
            if ($combatant['id'] === $combatantId) {
                return $combatant;
            }
        }
        
        return null;
    }

    /**
     * Get encounter summary.
     */
    public function getSummary(): array
    {
        $combatants = $this->combatants ?? [];
        $playerCount = 0;
        $enemyCount = 0;
        $totalHp = 0;
        $totalMaxHp = 0;
        
        foreach ($combatants as $combatant) {
            if ($combatant['is_player']) {
                $playerCount++;
            } else {
                $enemyCount++;
            }
            $totalHp += $combatant['hp'];
            $totalMaxHp += $combatant['max_hp'];
        }
        
        return [
            'total_combatants' => count($combatants),
            'players' => $playerCount,
            'enemies' => $enemyCount,
            'current_round' => $this->current_round,
            'status' => $this->status,
            'duration' => $this->started_at ? 
                now()->diffInMinutes($this->started_at) : null,
            'health_percentage' => $totalMaxHp > 0 ? 
                round(($totalHp / $totalMaxHp) * 100, 1) : 0
        ];
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get active encounters.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    protected function getSearchableFields()
    {
        return ['name', 'description', 'notes'];
    }
}