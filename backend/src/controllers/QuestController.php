<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Models\Quest;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class QuestController extends BaseController
{
    /**
     * List all quests for a campaign.
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

        $query = $this->filterByUser(Quest::where('campaign_id', $campaignId), $userId);

        // Apply additional quest-specific filters
        if (!empty($queryParams['status'])) {
            $query->byStatus($queryParams['status']);
        }

        if (!empty($queryParams['priority'])) {
            $query->byPriority($queryParams['priority']);
        }

        // Apply search and other filters
        $searchableFields = ['title', 'description', 'rewards'];
        $query = $this->applyFilters($query, $searchParams, $searchableFields);

        // Apply priority ordering if requested
        if (isset($queryParams['order_by_priority'])) {
            $query->orderByPriority($queryParams['order_by_priority'] === 'asc' ? 'asc' : 'desc');
        }

        $result = $this->paginated($query, $paginationParams['page'], $paginationParams['per_page']);

        return $this->success($response, $result);
    }

    /**
     * Get a specific quest.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $questId = $args['id'] ?? null;

        if (!$questId) {
            return $this->error($response, 'Quest ID is required', 400);
        }

        $quest = $this->filterByUser(Quest::query(), $userId)
            ->where('id', $questId)
            ->first();

        if (!$quest) {
            return $this->notFound($response, 'Quest not found');
        }

        return $this->success($response, $quest);
    }

    /**
     * Create a new quest.
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
        $errors = $this->validateRequired($data, ['title', 'description']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        // Validate status and priority
        if (isset($data['status']) && !in_array($data['status'], Quest::VALID_STATUSES)) {
            return $this->error($response, 'Invalid status. Valid values: ' . implode(', ', Quest::VALID_STATUSES), 400);
        }

        if (isset($data['priority']) && !in_array($data['priority'], Quest::VALID_PRIORITIES)) {
            return $this->error($response, 'Invalid priority. Valid values: ' . implode(', ', Quest::VALID_PRIORITIES), 400);
        }

        try {
            $quest = new Quest([
                'user_id' => $userId,
                'campaign_id' => $campaignId,
                'title' => $data['title'],
                'description' => $data['description'],
                'status' => $data['status'] ?? 'active',
                'priority' => $data['priority'] ?? 'medium',
                'quest_giver' => $data['quest_giver'] ?? null,
                'rewards' => $data['rewards'] ?? null,
                'objectives' => $data['objectives'] ?? [],
                'related_characters' => $data['related_characters'] ?? [],
                'related_locations' => $data['related_locations'] ?? [],
                'tags' => $data['tags'] ?? [],
            ]);

            $quest->save();

            return $this->success($response, $quest, 'Quest created successfully', 201);

        } catch (\Exception $e) {
            error_log("Quest creation failed: " . $e->getMessage());
            return $this->error($response, 'Failed to create quest', 500);
        }
    }

    /**
     * Update a quest.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $questId = $args['id'] ?? null;

        if (!$questId) {
            return $this->error($response, 'Quest ID is required', 400);
        }

        $quest = $this->filterByUser(Quest::query(), $userId)
            ->where('id', $questId)
            ->first();

        if (!$quest) {
            return $this->notFound($response, 'Quest not found');
        }

        $data = $this->getRequestData($request);

        // Validate status and priority if provided
        if (isset($data['status'])) {
            if (!in_array($data['status'], Quest::VALID_STATUSES)) {
                return $this->error($response, 'Invalid status. Valid values: ' . implode(', ', Quest::VALID_STATUSES), 400);
            }
            
            // Set completed_at if marking as completed
            if ($data['status'] === 'completed' && $quest->status !== 'completed') {
                $data['completed_at'] = now();
            }
        }

        if (isset($data['priority']) && !in_array($data['priority'], Quest::VALID_PRIORITIES)) {
            return $this->error($response, 'Invalid priority. Valid values: ' . implode(', ', Quest::VALID_PRIORITIES), 400);
        }

        try {
            // Update allowed fields
            $updateFields = [
                'title', 'description', 'status', 'priority', 'quest_giver', 
                'rewards', 'objectives', 'related_characters', 'related_locations', 
                'tags', 'completed_at'
            ];
            
            foreach ($updateFields as $field) {
                if (array_key_exists($field, $data)) {
                    $quest->{$field} = $data[$field];
                }
            }

            $quest->save();

            return $this->success($response, $quest, 'Quest updated successfully');

        } catch (\Exception $e) {
            error_log("Quest update failed: " . $e->getMessage());
            return $this->error($response, 'Failed to update quest', 500);
        }
    }

    /**
     * Delete a quest.
     */
    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $questId = $args['id'] ?? null;

        if (!$questId) {
            return $this->error($response, 'Quest ID is required', 400);
        }

        $quest = $this->filterByUser(Quest::query(), $userId)
            ->where('id', $questId)
            ->first();

        if (!$quest) {
            return $this->notFound($response, 'Quest not found');
        }

        try {
            $quest->delete();
            return $this->success($response, null, 'Quest deleted successfully');

        } catch (\Exception $e) {
            error_log("Quest deletion failed: " . $e->getMessage());
            return $this->error($response, 'Failed to delete quest', 500);
        }
    }

    /**
     * Add an objective to a quest.
     */
    public function addObjective(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $questId = $args['id'] ?? null;

        if (!$questId) {
            return $this->error($response, 'Quest ID is required', 400);
        }

        $quest = $this->filterByUser(Quest::query(), $userId)
            ->where('id', $questId)
            ->first();

        if (!$quest) {
            return $this->notFound($response, 'Quest not found');
        }

        $data = $this->getRequestData($request);

        // Validate required fields
        $errors = $this->validateRequired($data, ['description']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        try {
            $objectiveId = $quest->addObjective($data['description']);
            $quest->save();

            return $this->success($response, [
                'quest' => $quest,
                'objective_id' => $objectiveId
            ], 'Objective added successfully');

        } catch (\Exception $e) {
            error_log("Objective addition failed: " . $e->getMessage());
            return $this->error($response, 'Failed to add objective', 500);
        }
    }

    /**
     * Update an objective.
     */
    public function updateObjective(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $questId = $args['id'] ?? null;
        $objectiveId = $args['objective_id'] ?? null;

        if (!$questId || !$objectiveId) {
            return $this->error($response, 'Quest ID and Objective ID are required', 400);
        }

        $quest = $this->filterByUser(Quest::query(), $userId)
            ->where('id', $questId)
            ->first();

        if (!$quest) {
            return $this->notFound($response, 'Quest not found');
        }

        $data = $this->getRequestData($request);

        try {
            $success = $quest->updateObjective($objectiveId, $data);
            
            if (!$success) {
                return $this->notFound($response, 'Objective not found');
            }

            $quest->save();

            return $this->success($response, $quest, 'Objective updated successfully');

        } catch (\Exception $e) {
            error_log("Objective update failed: " . $e->getMessage());
            return $this->error($response, 'Failed to update objective', 500);
        }
    }

    /**
     * Delete an objective.
     */
    public function deleteObjective(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $questId = $args['id'] ?? null;
        $objectiveId = $args['objective_id'] ?? null;

        if (!$questId || !$objectiveId) {
            return $this->error($response, 'Quest ID and Objective ID are required', 400);
        }

        $quest = $this->filterByUser(Quest::query(), $userId)
            ->where('id', $questId)
            ->first();

        if (!$quest) {
            return $this->notFound($response, 'Quest not found');
        }

        try {
            $success = $quest->removeObjective($objectiveId);
            
            if (!$success) {
                return $this->notFound($response, 'Objective not found');
            }

            $quest->save();

            return $this->success($response, $quest, 'Objective deleted successfully');

        } catch (\Exception $e) {
            error_log("Objective deletion failed: " . $e->getMessage());
            return $this->error($response, 'Failed to delete objective', 500);
        }
    }

    /**
     * Get quest statistics for a campaign.
     */
    public function statistics(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
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

        try {
            $statistics = Quest::getStatistics($campaignId);
            return $this->success($response, $statistics);

        } catch (\Exception $e) {
            error_log("Quest statistics failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get quest statistics', 500);
        }
    }

    /**
     * Complete a quest (marks all objectives as completed).
     */
    public function complete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $questId = $args['id'] ?? null;

        if (!$questId) {
            return $this->error($response, 'Quest ID is required', 400);
        }

        $quest = $this->filterByUser(Quest::query(), $userId)
            ->where('id', $questId)
            ->first();

        if (!$quest) {
            return $this->notFound($response, 'Quest not found');
        }

        try {
            $quest->markAsCompleted();
            $quest->save();

            return $this->success($response, $quest, 'Quest completed successfully');

        } catch (\Exception $e) {
            error_log("Quest completion failed: " . $e->getMessage());
            return $this->error($response, 'Failed to complete quest', 500);
        }
    }
}