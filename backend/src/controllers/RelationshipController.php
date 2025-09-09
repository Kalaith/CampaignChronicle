<?php

namespace App\Controllers;

use App\Models\Relationship;
use App\Models\Campaign;
use App\Models\Character;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class RelationshipController extends BaseController
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

            $query = $campaign->relationships()->with(['fromCharacter', 'toCharacter']);
            $query = $this->applyFilters($query, $filters, ['description']);
            
            $result = $this->paginated($query, $pagination['page'], $pagination['per_page']);
            
            return $this->success($response, $result);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve relationships: ' . $e->getMessage(), 500);
        }
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $relationship = Relationship::with(['fromCharacter', 'toCharacter'])->find($args['id']);
            
            if (!$relationship) {
                return $this->notFound($response, 'Relationship not found');
            }

            return $this->success($response, $relationship->getSummary());
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve relationship: ' . $e->getMessage(), 500);
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
            
            $errors = $this->validateRequired($data, ['from_character', 'to_character', 'type']);
            if (!empty($errors)) {
                return $this->validationError($response, $errors);
            }

            // Validate characters exist and belong to campaign
            $fromCharacter = Character::where('id', $data['from_character'])->where('campaign_id', $campaign->id)->first();
            $toCharacter = Character::where('id', $data['to_character'])->where('campaign_id', $campaign->id)->first();

            if (!$fromCharacter || !$toCharacter) {
                return $this->error($response, 'One or both characters not found in this campaign');
            }

            if ($data['from_character'] === $data['to_character']) {
                return $this->error($response, 'Characters cannot have relationships with themselves');
            }

            $data['campaign_id'] = $campaign->id;
            $relationship = Relationship::create($data);

            return $this->success($response, $relationship->getSummary(), 'Relationship created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to create relationship: ' . $e->getMessage(), 500);
        }
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $relationship = Relationship::find($args['id']);
            if (!$relationship) {
                return $this->notFound($response, 'Relationship not found');
            }

            $data = $this->getRequestData($request);
            $relationship->update(array_filter($data, fn($value) => $value !== null));

            return $this->success($response, $relationship->getSummary(), 'Relationship updated successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to update relationship: ' . $e->getMessage(), 500);
        }
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $relationship = Relationship::find($args['id']);
            if (!$relationship) {
                return $this->notFound($response, 'Relationship not found');
            }

            $relationship->delete();
            return $this->success($response, null, 'Relationship deleted successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to delete relationship: ' . $e->getMessage(), 500);
        }
    }

    public function network(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $networkData = Relationship::getNetworkData($campaign->id);
            return $this->success($response, $networkData);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve relationship network: ' . $e->getMessage(), 500);
        }
    }

    public function statistics(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $statistics = Relationship::getStatistics($campaign->id);
            return $this->success($response, $statistics);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve relationship statistics: ' . $e->getMessage(), 500);
        }
    }

    public function findPath(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $queryParams = $this->getQueryParams($request);
            $fromCharacterId = $queryParams['from'] ?? null;
            $toCharacterId = $queryParams['to'] ?? null;
            $maxDepth = (int) ($queryParams['max_depth'] ?? 3);

            if (!$fromCharacterId || !$toCharacterId) {
                return $this->error($response, 'Both from and to character IDs are required');
            }

            $paths = Relationship::findPath($fromCharacterId, $toCharacterId, $maxDepth);
            
            return $this->success($response, [
                'from_character' => $fromCharacterId,
                'to_character' => $toCharacterId,
                'max_depth' => $maxDepth,
                'paths' => $paths,
                'path_count' => count($paths),
            ]);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to find relationship path: ' . $e->getMessage(), 500);
        }
    }

    public function characterRelationships(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $character = Character::find($args['character_id']);
            if (!$character) {
                return $this->notFound($response, 'Character not found');
            }

            $relationships = Relationship::involvingCharacter($character->id)
                ->with(['fromCharacter', 'toCharacter'])
                ->get()
                ->map(fn($rel) => $rel->getSummary());

            return $this->success($response, $relationships);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve character relationships: ' . $e->getMessage(), 500);
        }
    }
}