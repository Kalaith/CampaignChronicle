<?php

namespace App\Controllers;

use App\Models\Character;
use App\Models\Campaign;
use App\Services\ValidationService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class CharacterController extends BaseController
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

            $query = $campaign->characters();
            $query = $this->applyFilters($query, $filters, ['name', 'description', 'race', 'class']);
            
            $result = $this->paginated($query, $pagination['page'], $pagination['per_page']);
            
            return $this->success($response, $result);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve characters: ' . $e->getMessage(), 500);
        }
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $character = Character::with(['locationEntity', 'ownedItems'])->find($args['id']);
            
            if (!$character) {
                return $this->notFound($response, 'Character not found');
            }

            $queryParams = $this->getQueryParams($request);
            $includeSummary = isset($queryParams['include_summary']);

            $data = $character->toArray();
            
            if ($includeSummary) {
                $data['summary'] = $character->getSummary();
                $data['network_connections'] = $character->getNetworkConnections();
            }

            return $this->success($response, $data);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve character: ' . $e->getMessage(), 500);
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
            $data = ValidationService::sanitizeInput($data);
            
            $errors = ValidationService::validateCharacter($data);
            if (!empty($errors)) {
                return $this->validationError($response, $errors);
            }

            $data['campaign_id'] = $campaign->id;
            $character = Character::create($data);

            return $this->success($response, $character, 'Character created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to create character: ' . $e->getMessage(), 500);
        }
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $character = Character::find($args['id']);
            if (!$character) {
                return $this->notFound($response, 'Character not found');
            }

            $data = $this->getRequestData($request);
            $character->update(array_filter($data, fn($value) => $value !== null));

            return $this->success($response, $character, 'Character updated successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to update character: ' . $e->getMessage(), 500);
        }
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $character = Character::find($args['id']);
            if (!$character) {
                return $this->notFound($response, 'Character not found');
            }

            $character->delete();
            return $this->success($response, null, 'Character deleted successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to delete character: ' . $e->getMessage(), 500);
        }
    }

    public function relationships(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $character = Character::find($args['id']);
            if (!$character) {
                return $this->notFound($response, 'Character not found');
            }

            $relationships = $character->allRelationships();
            return $this->success($response, $relationships);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve relationships: ' . $e->getMessage(), 500);
        }
    }
}