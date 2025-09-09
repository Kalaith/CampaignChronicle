<?php

namespace App\Controllers;

use App\Models\Location;
use App\Models\Campaign;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class LocationController extends BaseController
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

            $query = $campaign->locations();
            $query = $this->applyFilters($query, $filters, ['name', 'description', 'type']);
            
            $result = $this->paginated($query, $pagination['page'], $pagination['per_page']);
            
            return $this->success($response, $result);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve locations: ' . $e->getMessage(), 500);
        }
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $location = Location::with(['parentLocation', 'childLocations', 'items'])->find($args['id']);
            
            if (!$location) {
                return $this->notFound($response, 'Location not found');
            }

            $queryParams = $this->getQueryParams($request);
            $includeHierarchy = isset($queryParams['include_hierarchy']);

            $data = $location->toArray();
            
            if ($includeHierarchy) {
                $data['hierarchy_path'] = $location->getHierarchyPath();
                $data['all_descendants'] = $location->getAllDescendants();
            }

            return $this->success($response, $data);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve location: ' . $e->getMessage(), 500);
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
            
            $errors = $this->validateRequired($data, ['name', 'type']);
            if (!empty($errors)) {
                return $this->validationError($response, $errors);
            }

            $data['campaign_id'] = $campaign->id;
            $location = Location::create($data);

            return $this->success($response, $location, 'Location created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to create location: ' . $e->getMessage(), 500);
        }
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $location = Location::find($args['id']);
            if (!$location) {
                return $this->notFound($response, 'Location not found');
            }

            $data = $this->getRequestData($request);
            $location->update(array_filter($data, fn($value) => $value !== null));

            return $this->success($response, $location, 'Location updated successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to update location: ' . $e->getMessage(), 500);
        }
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $location = Location::find($args['id']);
            if (!$location) {
                return $this->notFound($response, 'Location not found');
            }

            $location->delete();
            return $this->success($response, null, 'Location deleted successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to delete location: ' . $e->getMessage(), 500);
        }
    }

    public function hierarchy(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $campaign = Campaign::find($args['campaign_id']);
            if (!$campaign) {
                return $this->notFound($response, 'Campaign not found');
            }

            $hierarchy = Location::getHierarchyTree($campaign->id);
            return $this->success($response, $hierarchy);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve location hierarchy: ' . $e->getMessage(), 500);
        }
    }

    public function items(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $location = Location::find($args['id']);
            if (!$location) {
                return $this->notFound($response, 'Location not found');
            }

            $items = $location->items;
            return $this->success($response, $items);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve location items: ' . $e->getMessage(), 500);
        }
    }
}