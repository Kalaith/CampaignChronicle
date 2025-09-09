<?php

namespace App\Controllers;

use App\Models\Item;
use App\Models\Campaign;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class ItemController extends BaseController
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

            $query = $campaign->items();
            $query = $this->applyFilters($query, $filters, ['name', 'description', 'type']);
            
            $result = $this->paginated($query, $pagination['page'], $pagination['per_page']);
            
            return $this->success($response, $result);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve items: ' . $e->getMessage(), 500);
        }
    }

    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $item = Item::with(['ownerCharacter', 'locationEntity'])->find($args['id']);
            
            if (!$item) {
                return $this->notFound($response, 'Item not found');
            }

            return $this->success($response, $item);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve item: ' . $e->getMessage(), 500);
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
            $item = Item::create($data);

            return $this->success($response, $item, 'Item created successfully', 201);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to create item: ' . $e->getMessage(), 500);
        }
    }

    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $item = Item::find($args['id']);
            if (!$item) {
                return $this->notFound($response, 'Item not found');
            }

            $data = $this->getRequestData($request);
            $item->update(array_filter($data, fn($value) => $value !== null));

            return $this->success($response, $item, 'Item updated successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to update item: ' . $e->getMessage(), 500);
        }
    }

    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $item = Item::find($args['id']);
            if (!$item) {
                return $this->notFound($response, 'Item not found');
            }

            $item->delete();
            return $this->success($response, null, 'Item deleted successfully');
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to delete item: ' . $e->getMessage(), 500);
        }
    }

    public function transfer(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $item = Item::find($args['id']);
            if (!$item) {
                return $this->notFound($response, 'Item not found');
            }

            $data = $this->getRequestData($request);
            
            if (isset($data['to_character'])) {
                $item->transferToCharacter($data['to_character']);
                $message = 'Item transferred to character successfully';
            } elseif (isset($data['to_location'])) {
                $item->transferToLocation($data['to_location']);
                $message = 'Item transferred to location successfully';
            } else {
                return $this->error($response, 'Transfer target not specified');
            }

            return $this->success($response, $item, $message);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to transfer item: ' . $e->getMessage(), 500);
        }
    }

    public function history(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        try {
            $item = Item::find($args['id']);
            if (!$item) {
                return $this->notFound($response, 'Item not found');
            }

            $history = $item->getOwnershipHistory();
            return $this->success($response, $history);
        } catch (\Exception $e) {
            return $this->error($response, 'Failed to retrieve item history: ' . $e->getMessage(), 500);
        }
    }
}