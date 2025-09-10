<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Services\ValidationService;
use App\Services\ExportService;
use App\Services\SearchService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class CampaignController extends BaseController
{
    /**
     * List all campaigns for the authenticated user.
     */
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $userId = $this->getUserId($request);
            if (!$userId) {
                return $this->error($response, 'User not authenticated', 401);
            }

            $queryParams = $this->getQueryParams($request);
            $pagination = $this->getPaginationParams($queryParams);
            $filters = $this->getSearchParams($queryParams);

            $query = Campaign::query()->forUser($userId);
            
            // Apply filters
            if (!empty($filters['search'])) {
                $query->search($filters['search']);
            }

            $query->orderBy($filters['sort'], $filters['order']);
            
            $result = $this->paginated($query, $pagination['page'], $pagination['per_page']);
            
            return $this->success($response, $result);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve campaigns: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get a specific campaign with details.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $userId = $this->getUserId($request);
            if (!$userId) {
                return $this->error($response, 'User not authenticated', 401);
            }

            $campaign = Campaign::where('id', $args['id'])->forUser($userId)->first();
            
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $includeStats = isset($queryParams['include_stats']);
            $includeEntities = isset($queryParams['include_entities']);

            $data = $campaign->toArray();

            if ($includeStats) {
                $data['stats'] = $campaign->stats;
                $data['character_breakdown'] = $campaign->getCharacterTypeBreakdown();
                $data['location_breakdown'] = $campaign->getLocationTypeBreakdown();
                $data['item_breakdown'] = $campaign->getItemTypeBreakdown();
            }

            if ($includeEntities) {
                $data['characters'] = $campaign->characters;
                $data['locations'] = $campaign->locations;
                $data['items'] = $campaign->items;
                $data['notes'] = $campaign->notes;
                $data['relationships'] = $campaign->relationships;
                $data['timeline_events'] = $campaign->timelineEvents;
            }

            return $this->success($response, $data);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve campaign: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Create a new campaign.
     */
    public function create(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $userId = $this->getUserId($request);
            if (!$userId) {
                return $this->error($response, 'User not authenticated', 401);
            }

            $data = $this->getRequestData($request);
            $data = ValidationService::sanitizeInput($data);
            
            // Validate campaign data
            $errors = ValidationService::validateCampaign($data);
            if (!empty($errors)) {
                return $this->validationError($response, $errors);
            }

            $campaign = Campaign::create([
                'user_id' => $userId,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
            ]);

            return $this->success($response, $campaign, 'Campaign created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to create campaign: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update a campaign.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['id']);
            
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $data = $this->getRequestData($request);
            
            $campaign->update(array_filter([
                'name' => $data['name'] ?? $campaign->name,
                'description' => $data['description'] ?? $campaign->description,
            ]));

            return $this->success($response, $campaign, 'Campaign updated successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to update campaign: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete a campaign.
     */
    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['id']);
            
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $campaign->delete();

            return $this->success($response, null, 'Campaign deleted successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to delete campaign: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Export campaign data.
     */
    public function export(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['id']);
            
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $options = [
                'entities' => isset($queryParams['entities']) ? explode(',', $queryParams['entities']) : null,
                'include_stats' => isset($queryParams['include_stats']),
            ];
            
            $exportData = ExportService::exportCampaign($campaign->id, $options);
            
            return $this->success($response, $exportData, 'Campaign exported successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to export campaign: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get campaign analytics.
     */
    public function analytics(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['id']);
            
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $analytics = [
                'stats' => $campaign->stats,
                'character_breakdown' => $campaign->getCharacterTypeBreakdown(),
                'location_breakdown' => $campaign->getLocationTypeBreakdown(),
                'item_breakdown' => $campaign->getItemTypeBreakdown(),
                'recent_activity' => $campaign->getRecentActivity(10),
            ];

            return $this->success($response, $analytics);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to get campaign analytics: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Search across all entities in the campaign.
     */
    public function search(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['id']);
            
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $searchTerm = $queryParams['q'] ?? '';
            $types = isset($queryParams['types']) ? explode(',', $queryParams['types']) : null;

            if (empty($searchTerm)) {
                return $this->error($response, 'Search term is required');
            }

            $results = SearchService::globalSearch($campaign->id, $searchTerm, $types);

            $totalCount = 0;
            foreach ($results as $typeResults) {
                $totalCount += count($typeResults);
            }

            return $this->success($response, [
                'query' => $searchTerm,
                'types' => $types,
                'results' => $results,
                'count' => $totalCount,
            ]);
        } catch (\Exception $e) {
            return $this->error($response, 'Search failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Import campaign data.
     */
    public function import(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        try {
            $data = $this->getRequestData($request);
            
            // Validate import data structure
            $errors = ExportService::validateImportData($data);
            if (!empty($errors)) {
                return $this->error($response, 'Import validation failed: ' . implode(', ', $errors));
            }

            // Create new campaign with imported data
            $campaignData = $data['campaign'];
            $campaignData['name'] = ($campaignData['name'] ?? 'Imported Campaign') . ' (Imported)';
            
            $campaign = Campaign::create([
                'name' => $campaignData['name'],
                'description' => $campaignData['description'] ?? null,
            ]);

            // Import related entities
            $this->importEntities($campaign->id, $data);

            return $this->success($response, $campaign, 'Campaign imported successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to import campaign: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Import related entities for a campaign.
     */
    private function importEntities(string $campaignId, array $data): void
    {
        // Map old IDs to new IDs
        $idMap = [];

        // Import characters
        foreach ($data['characters'] ?? [] as $characterData) {
            $oldId = $characterData['id'] ?? null;
            unset($characterData['id'], $characterData['created_at'], $characterData['updated_at']);
            $characterData['campaign_id'] = $campaignId;
            
            $character = \App\Models\Character::create($characterData);
            if ($oldId) {
                $idMap['characters'][$oldId] = $character->id;
            }
        }

        // Import locations
        foreach ($data['locations'] ?? [] as $locationData) {
            $oldId = $locationData['id'] ?? null;
            unset($locationData['id'], $locationData['created_at'], $locationData['updated_at']);
            $locationData['campaign_id'] = $campaignId;
            
            $location = \App\Models\Location::create($locationData);
            if ($oldId) {
                $idMap['locations'][$oldId] = $location->id;
            }
        }

        // Import items
        foreach ($data['items'] ?? [] as $itemData) {
            unset($itemData['id'], $itemData['created_at'], $itemData['updated_at']);
            $itemData['campaign_id'] = $campaignId;
            
            // Map owner and location IDs
            if (isset($itemData['owner']) && isset($idMap['characters'][$itemData['owner']])) {
                $itemData['owner'] = $idMap['characters'][$itemData['owner']];
            }
            if (isset($itemData['location']) && isset($idMap['locations'][$itemData['location']])) {
                $itemData['location'] = $idMap['locations'][$itemData['location']];
            }
            
            \App\Models\Item::create($itemData);
        }

        // Import notes
        foreach ($data['notes'] ?? [] as $noteData) {
            unset($noteData['id'], $noteData['created_at'], $noteData['updated_at']);
            $noteData['campaign_id'] = $campaignId;
            
            \App\Models\Note::create($noteData);
        }

        // Import relationships
        foreach ($data['relationships'] ?? [] as $relationshipData) {
            unset($relationshipData['id'], $relationshipData['created_at'], $relationshipData['updated_at']);
            $relationshipData['campaign_id'] = $campaignId;
            
            // Map character IDs
            if (isset($idMap['characters'][$relationshipData['from_character']])) {
                $relationshipData['from_character'] = $idMap['characters'][$relationshipData['from_character']];
            }
            if (isset($idMap['characters'][$relationshipData['to_character']])) {
                $relationshipData['to_character'] = $idMap['characters'][$relationshipData['to_character']];
            }
            
            \App\Models\Relationship::create($relationshipData);
        }

        // Import timeline events
        foreach ($data['timeline_events'] ?? [] as $eventData) {
            unset($eventData['id'], $eventData['created_at'], $eventData['updated_at']);
            $eventData['campaign_id'] = $campaignId;
            
            // Map related character and location IDs
            if (isset($eventData['related_characters']) && is_array($eventData['related_characters'])) {
                $eventData['related_characters'] = array_map(function ($id) use ($idMap) {
                    return $idMap['characters'][$id] ?? $id;
                }, $eventData['related_characters']);
            }
            
            if (isset($eventData['related_locations']) && is_array($eventData['related_locations'])) {
                $eventData['related_locations'] = array_map(function ($id) use ($idMap) {
                    return $idMap['locations'][$id] ?? $id;
                }, $eventData['related_locations']);
            }
            
            \App\Models\TimelineEvent::create($eventData);
        }
    }
}