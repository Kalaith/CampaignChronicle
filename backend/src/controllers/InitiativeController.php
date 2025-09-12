<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Models\CombatEncounter;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class InitiativeController extends BaseController
{
    /**
     * List all encounters for a campaign.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;

        if (!$campaignId) {
            return $this->error($response, 'Campaign ID is required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        $queryParams = $this->getQueryParams($request);
        $paginationParams = $this->getPaginationParams($queryParams);
        $searchParams = $this->getSearchParams($queryParams);

        $query = $this->filterByUser(CombatEncounter::where('campaign_id', $campaignId), $userId);

        // Apply status filter
        if (!empty($queryParams['status'])) {
            $query->byStatus($queryParams['status']);
        }

        // Apply search and other filters
        $searchableFields = ['name', 'description', 'notes'];
        $query = $this->applyFilters($query, $searchParams, $searchableFields);

        $result = $this->paginated($query, $paginationParams['page'], $paginationParams['per_page']);

        return $this->success($response, $result);
    }

    /**
     * Get a specific encounter.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        return $this->success($response, $encounter);
    }

    /**
     * Create a new encounter.
     */
    public function create(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;

        if (!$campaignId) {
            return $this->error($response, 'Campaign ID is required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        $data = $this->getRequestData($request);

        // Validate required fields
        $errors = $this->validateRequired($data, ['name']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        // Validate status
        if (isset($data['status']) && !in_array($data['status'], CombatEncounter::VALID_STATUSES)) {
            return $this->error($response, 'Invalid status. Valid values: ' . implode(', ', CombatEncounter::VALID_STATUSES), 400);
        }

        try {
            $encounter = new CombatEncounter([
                'user_id' => $userId,
                'campaign_id' => $campaignId,
                'name' => $data['name'],
                'description' => $data['description'] ?? '',
                'status' => $data['status'] ?? 'preparing',
                'current_round' => 0,
                'current_turn' => 0,
                'initiative_order' => [],
                'combatants' => [],
                'environment_effects' => $data['environment_effects'] ?? [],
                'notes' => $data['notes'] ?? '',
            ]);

            $encounter->save();

            return $this->success($response, $encounter, 'Encounter created successfully', 201);

        } catch (\Exception $e) {
            error_log("Encounter creation failed: " . $e->getMessage());
            return $this->error($response, 'Failed to create encounter', 500);
        }
    }

    /**
     * Update an encounter.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        $data = $this->getRequestData($request);

        // Validate status if provided
        if (isset($data['status']) && !in_array($data['status'], CombatEncounter::VALID_STATUSES)) {
            return $this->error($response, 'Invalid status. Valid values: ' . implode(', ', CombatEncounter::VALID_STATUSES), 400);
        }

        try {
            // Update allowed fields
            $updateFields = ['name', 'description', 'status', 'environment_effects', 'notes'];
            foreach ($updateFields as $field) {
                if (array_key_exists($field, $data)) {
                    $encounter->{$field} = $data[$field];
                }
            }

            $encounter->save();

            return $this->success($response, $encounter, 'Encounter updated successfully');

        } catch (\Exception $e) {
            error_log("Encounter update failed: " . $e->getMessage());
            return $this->error($response, 'Failed to update encounter', 500);
        }
    }

    /**
     * Delete an encounter.
     */
    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        try {
            $encounter->delete();
            return $this->success($response, null, 'Encounter deleted successfully');

        } catch (\Exception $e) {
            error_log("Encounter deletion failed: " . $e->getMessage());
            return $this->error($response, 'Failed to delete encounter', 500);
        }
    }

    /**
     * Add combatant to encounter.
     */
    public function addCombatant(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        $data = $this->getRequestData($request);

        // Validate required fields
        $errors = $this->validateRequired($data, ['name', 'initiative', 'hp', 'max_hp']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        try {
            $combatantId = $encounter->addCombatant($data);
            $encounter->save();

            return $this->success($response, [
                'combatant_id' => $combatantId,
                'encounter' => $encounter
            ], 'Combatant added successfully');

        } catch (\Exception $e) {
            error_log("Add combatant failed: " . $e->getMessage());
            return $this->error($response, 'Failed to add combatant', 500);
        }
    }

    /**
     * Update combatant.
     */
    public function updateCombatant(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;
        $combatantId = $args['combatant_id'] ?? null;

        if (!$encounterId || !$combatantId) {
            return $this->error($response, 'Encounter ID and Combatant ID are required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        $data = $this->getRequestData($request);

        try {
            $success = $encounter->updateCombatant($combatantId, $data);
            
            if (!$success) {
                return $this->notFound($response, 'Combatant not found');
            }

            $encounter->save();

            return $this->success($response, $encounter, 'Combatant updated successfully');

        } catch (\Exception $e) {
            error_log("Update combatant failed: " . $e->getMessage());
            return $this->error($response, 'Failed to update combatant', 500);
        }
    }

    /**
     * Remove combatant.
     */
    public function removeCombatant(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;
        $combatantId = $args['combatant_id'] ?? null;

        if (!$encounterId || !$combatantId) {
            return $this->error($response, 'Encounter ID and Combatant ID are required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        try {
            $success = $encounter->removeCombatant($combatantId);
            
            if (!$success) {
                return $this->notFound($response, 'Combatant not found');
            }

            $encounter->save();

            return $this->success($response, $encounter, 'Combatant removed successfully');

        } catch (\Exception $e) {
            error_log("Remove combatant failed: " . $e->getMessage());
            return $this->error($response, 'Failed to remove combatant', 500);
        }
    }

    /**
     * Start encounter.
     */
    public function startEncounter(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        try {
            $encounter->startEncounter();
            $encounter->save();

            return $this->success($response, $encounter, 'Encounter started successfully');

        } catch (\Exception $e) {
            error_log("Start encounter failed: " . $e->getMessage());
            return $this->error($response, 'Failed to start encounter', 500);
        }
    }

    /**
     * End encounter.
     */
    public function endEncounter(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        try {
            $encounter->endEncounter();
            $encounter->save();

            return $this->success($response, $encounter, 'Encounter ended successfully');

        } catch (\Exception $e) {
            error_log("End encounter failed: " . $e->getMessage());
            return $this->error($response, 'Failed to end encounter', 500);
        }
    }

    /**
     * Advance to next turn.
     */
    public function nextTurn(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        if ($encounter->status !== 'active') {
            return $this->error($response, 'Encounter must be active to advance turns', 400);
        }

        try {
            $turnInfo = $encounter->nextTurn();
            $encounter->save();

            return $this->success($response, [
                'encounter' => $encounter,
                'turn_info' => $turnInfo
            ], 'Advanced to next turn');

        } catch (\Exception $e) {
            error_log("Next turn failed: " . $e->getMessage());
            return $this->error($response, 'Failed to advance turn', 500);
        }
    }

    /**
     * Add status effect to combatant.
     */
    public function addStatusEffect(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;
        $combatantId = $args['combatant_id'] ?? null;

        if (!$encounterId || !$combatantId) {
            return $this->error($response, 'Encounter ID and Combatant ID are required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        $data = $this->getRequestData($request);

        // Validate required fields
        $errors = $this->validateRequired($data, ['name', 'description']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        try {
            $effectId = $encounter->addStatusEffect($combatantId, $data);
            
            if (!$effectId) {
                return $this->notFound($response, 'Combatant not found');
            }

            $encounter->save();

            return $this->success($response, [
                'effect_id' => $effectId,
                'encounter' => $encounter
            ], 'Status effect added successfully');

        } catch (\Exception $e) {
            error_log("Add status effect failed: " . $e->getMessage());
            return $this->error($response, 'Failed to add status effect', 500);
        }
    }

    /**
     * Remove status effect from combatant.
     */
    public function removeStatusEffect(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;
        $combatantId = $args['combatant_id'] ?? null;
        $effectId = $args['effect_id'] ?? null;

        if (!$encounterId || !$combatantId || !$effectId) {
            return $this->error($response, 'Encounter ID, Combatant ID, and Effect ID are required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        try {
            $success = $encounter->removeStatusEffect($combatantId, $effectId);
            
            if (!$success) {
                return $this->notFound($response, 'Status effect not found');
            }

            $encounter->save();

            return $this->success($response, $encounter, 'Status effect removed successfully');

        } catch (\Exception $e) {
            error_log("Remove status effect failed: " . $e->getMessage());
            return $this->error($response, 'Failed to remove status effect', 500);
        }
    }

    /**
     * Apply damage to combatant.
     */
    public function applyDamage(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;
        $combatantId = $args['combatant_id'] ?? null;

        if (!$encounterId || !$combatantId) {
            return $this->error($response, 'Encounter ID and Combatant ID are required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        $data = $this->getRequestData($request);

        // Validate required fields
        $errors = $this->validateRequired($data, ['damage']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        $damage = (int)$data['damage'];
        if ($damage < 0) {
            return $this->error($response, 'Damage must be a positive number', 400);
        }

        try {
            $success = $encounter->applyDamage($combatantId, $damage);
            
            if (!$success) {
                return $this->notFound($response, 'Combatant not found');
            }

            $encounter->save();

            return $this->success($response, $encounter, "Applied {$damage} damage successfully");

        } catch (\Exception $e) {
            error_log("Apply damage failed: " . $e->getMessage());
            return $this->error($response, 'Failed to apply damage', 500);
        }
    }

    /**
     * Apply healing to combatant.
     */
    public function applyHealing(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;
        $combatantId = $args['combatant_id'] ?? null;

        if (!$encounterId || !$combatantId) {
            return $this->error($response, 'Encounter ID and Combatant ID are required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        $data = $this->getRequestData($request);

        // Validate required fields
        $errors = $this->validateRequired($data, ['healing']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        $healing = (int)$data['healing'];
        if ($healing < 0) {
            return $this->error($response, 'Healing must be a positive number', 400);
        }

        try {
            $success = $encounter->applyHealing($combatantId, $healing);
            
            if (!$success) {
                return $this->notFound($response, 'Combatant not found');
            }

            $encounter->save();

            return $this->success($response, $encounter, "Applied {$healing} healing successfully");

        } catch (\Exception $e) {
            error_log("Apply healing failed: " . $e->getMessage());
            return $this->error($response, 'Failed to apply healing', 500);
        }
    }

    /**
     * Get predefined status effects.
     */
    public function getStatusEffects(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->success($response, CombatEncounter::PREDEFINED_STATUS_EFFECTS);
    }

    /**
     * Get encounter summary.
     */
    public function getSummary(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $encounterId = $args['id'] ?? null;

        if (!$encounterId) {
            return $this->error($response, 'Encounter ID is required', 400);
        }

        $encounter = $this->filterByUser(CombatEncounter::query(), $userId)
            ->where('id', $encounterId)
            ->first();

        if (!$encounter) {
            return $this->notFound($response, 'Encounter not found');
        }

        try {
            $summary = $encounter->getSummary();
            return $this->success($response, $summary);

        } catch (\Exception $e) {
            error_log("Get encounter summary failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get encounter summary', 500);
        }
    }
}