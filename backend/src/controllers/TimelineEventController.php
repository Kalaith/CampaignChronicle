<?php

namespace App\Controllers;

use App\Models\TimelineEvent;
use App\Models\Campaign;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class TimelineEventController extends BaseController
{
    public function index(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $pagination = $this->getPaginationParams($queryParams);
            $filters = $this->getSearchParams($queryParams);

            $query = $campaign->timelineEvents();
            
            // Apply type filter if specified
            if (!empty($filters['type'])) {
                $query->ofType($filters['type']);
            }

            // Apply session filter if specified
            if (isset($queryParams['session'])) {
                $query->fromSession((int) $queryParams['session']);
            }

            // Apply search filters
            $query = $this->applyFilters($query, $filters, ['title', 'description']);

            // Default chronological ordering
            $query->chronological();
            
            $result = $this->paginated($query, $pagination['page'], $pagination['per_page']);
            
            return $this->success($response, $result);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve timeline events: ' . $e->getMessage(), 500);
        }
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $event = TimelineEvent::find($args['id']);
            
            if (!$event) {
                return $this->notFound($response, 'Timeline event not found');
            }

            $queryParams = $this->getQueryParams($request);
            $includeSummary = isset($queryParams['include_summary']);

            $data = $event->toArray();
            
            if ($includeSummary) {
                $data = $event->getSummary();
            }

            return $this->success($response, $data);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve timeline event: ' . $e->getMessage(), 500);
        }
    }

    public function create(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $data = $this->getRequestData($request);
            
            $errors = $this->validateRequired($data, ['title']);
            if (!empty($errors)) {
                return $this->validationError($response, $errors);
            }

            $data['campaign_id'] = $campaign->id;
            $event = TimelineEvent::create($data);

            return $this->success($response, $event, 'Timeline event created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to create timeline event: ' . $e->getMessage(), 500);
        }
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $event = TimelineEvent::find($args['id']);
            if (!$event) {
                return $this->notFound($response, 'Timeline event not found');
            }

            $data = $this->getRequestData($request);
            $event->update(array_filter($data, fn($value) => $value !== null));

            return $this->success($response, $event, 'Timeline event updated successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to update timeline event: ' . $e->getMessage(), 500);
        }
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $event = TimelineEvent::find($args['id']);
            if (!$event) {
                return $this->notFound($response, 'Timeline event not found');
            }

            $event->delete();
            return $this->success($response, null, 'Timeline event deleted successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to delete timeline event: ' . $e->getMessage(), 500);
        }
    }

    public function groupedBySessions(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $groupedEvents = TimelineEvent::getGroupedBySession($campaign->id);
            return $this->success($response, $groupedEvents);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve grouped timeline events: ' . $e->getMessage(), 500);
        }
    }

    public function statistics(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $statistics = TimelineEvent::getStatistics($campaign->id);
            return $this->success($response, $statistics);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve timeline statistics: ' . $e->getMessage(), 500);
        }
    }

    public function activity(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $days = (int) ($queryParams['days'] ?? 30);

            $activity = TimelineEvent::getActivity($campaign->id, $days);
            
            return $this->success($response, [
                'period_days' => $days,
                'activity' => $activity,
            ]);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve timeline activity: ' . $e->getMessage(), 500);
        }
    }

    public function mentions(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $queryParams = $this->getQueryParams($request);
            $entityName = $queryParams['entity'] ?? '';

            if (empty($entityName)) {
                return $this->error($response, 'Entity name is required');
            }

            $mentions = TimelineEvent::findMentions($campaign->id, $entityName);
            
            return $this->success($response, [
                'entity' => $entityName,
                'mentions' => $mentions,
                'count' => $mentions->count(),
            ]);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to find entity mentions: ' . $e->getMessage(), 500);
        }
    }

    public function characterInvolvement(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $characterId = $args['character_id'];
            $involvement = TimelineEvent::getCharacterInvolvement($campaign->id, $characterId);

            return $this->success($response, [
                'character_id' => $characterId,
                'events' => $involvement,
                'count' => $involvement->count(),
            ]);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve character involvement: ' . $e->getMessage(), 500);
        }
    }

    public function locationHistory(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $locationId = $args['location_id'];
            $history = TimelineEvent::getLocationHistory($campaign->id, $locationId);

            return $this->success($response, [
                'location_id' => $locationId,
                'events' => $history,
                'count' => $history->count(),
            ]);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve location history: ' . $e->getMessage(), 500);
        }
    }

    public function addRelatedEntity(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $event = TimelineEvent::find($args['id']);
            if (!$event) {
                return $this->notFound($response, 'Timeline event not found');
            }

            $data = $this->getRequestData($request);

            if (isset($data['character_id'])) {
                $event->addRelatedCharacter($data['character_id']);
            }

            if (isset($data['location_id'])) {
                $event->addRelatedLocation($data['location_id']);
            }

            $event->save();

            return $this->success($response, $event->getSummary(), 'Related entity added successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to add related entity: ' . $e->getMessage(), 500);
        }
    }
}