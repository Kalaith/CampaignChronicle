<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Models\PlayerAccess;
use App\Models\Character;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class PlayerAccessController extends BaseController
{
    /**
     * Get all player access grants for a campaign.
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

        try {
            $queryParams = $this->getQueryParams($request);
            $status = $queryParams['status'] ?? null;

            $query = PlayerAccess::where('campaign_id', $campaignId)
                ->where('user_id', $userId);

            if ($status) {
                $query->where('status', $status);
            }

            $playerAccess = $query->orderBy('created_at', 'desc')->get();

            // Load accessible characters for each player
            foreach ($playerAccess as $access) {
                $access->accessible_characters = $access->getAccessibleCharacters();
            }

            return $this->success($response, $playerAccess);

        } catch (\Exception $e) {
            error_log("Player access retrieval failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get player access grants', 500);
        }
    }

    /**
     * Create a new player access grant (invite player).
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
        $errors = $this->validateRequired($data, ['player_email', 'player_name']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        // Validate email format
        if (!filter_var($data['player_email'], FILTER_VALIDATE_EMAIL)) {
            return $this->error($response, 'Invalid email format', 400);
        }

        try {
            // Check if player already has access
            $existingAccess = PlayerAccess::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->where('player_email', $data['player_email'])
                ->first();

            if ($existingAccess) {
                return $this->error($response, 'Player already has access to this campaign', 400);
            }

            $playerAccess = new PlayerAccess([
                'user_id' => $userId,
                'campaign_id' => $campaignId,
                'player_email' => $data['player_email'],
                'player_name' => $data['player_name'],
                'access_token' => PlayerAccess::generateAccessToken(),
                'permissions' => $data['permissions'] ?? PlayerAccess::DEFAULT_PERMISSIONS,
                'character_ids' => $data['character_ids'] ?? [],
                'status' => 'invited',
                'invited_at' => now(),
                'notes' => $data['notes'] ?? '',
            ]);

            $playerAccess->save();

            // Load accessible characters
            $playerAccess->accessible_characters = $playerAccess->getAccessibleCharacters();

            return $this->success($response, $playerAccess, 'Player invited successfully', 201);

        } catch (\Exception $e) {
            error_log("Player invite failed: " . $e->getMessage());
            return $this->error($response, 'Failed to invite player', 500);
        }
    }

    /**
     * Get a specific player access grant.
     */
    public function show(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;
        $accessId = $args['access_id'] ?? null;

        if (!$campaignId || !$accessId) {
            return $this->error($response, 'Campaign ID and Access ID are required', 400);
        }

        try {
            $playerAccess = PlayerAccess::where('id', $accessId)
                ->where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$playerAccess) {
                return $this->notFound($response, 'Player access not found');
            }

            // Load accessible characters
            $playerAccess->accessible_characters = $playerAccess->getAccessibleCharacters();

            return $this->success($response, $playerAccess);

        } catch (\Exception $e) {
            error_log("Player access retrieval failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get player access', 500);
        }
    }

    /**
     * Update a player access grant.
     */
    public function update(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;
        $accessId = $args['access_id'] ?? null;

        if (!$campaignId || !$accessId) {
            return $this->error($response, 'Campaign ID and Access ID are required', 400);
        }

        $data = $this->getRequestData($request);

        try {
            $playerAccess = PlayerAccess::where('id', $accessId)
                ->where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$playerAccess) {
                return $this->notFound($response, 'Player access not found');
            }

            // Validate status if provided
            if (isset($data['status']) && !in_array($data['status'], PlayerAccess::VALID_STATUSES)) {
                return $this->error($response, 'Invalid status. Valid statuses: ' . implode(', ', PlayerAccess::VALID_STATUSES), 400);
            }

            // Update allowed fields
            $allowedFields = ['player_name', 'permissions', 'character_ids', 'status', 'notes'];
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $playerAccess->{$field} = $data[$field];
                }
            }

            $playerAccess->save();

            // Load accessible characters
            $playerAccess->accessible_characters = $playerAccess->getAccessibleCharacters();

            return $this->success($response, $playerAccess, 'Player access updated successfully');

        } catch (\Exception $e) {
            error_log("Player access update failed: " . $e->getMessage());
            return $this->error($response, 'Failed to update player access', 500);
        }
    }

    /**
     * Delete a player access grant.
     */
    public function delete(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;
        $accessId = $args['access_id'] ?? null;

        if (!$campaignId || !$accessId) {
            return $this->error($response, 'Campaign ID and Access ID are required', 400);
        }

        try {
            $playerAccess = PlayerAccess::where('id', $accessId)
                ->where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$playerAccess) {
                return $this->notFound($response, 'Player access not found');
            }

            $playerAccess->delete();

            return $this->success($response, null, 'Player access revoked successfully');

        } catch (\Exception $e) {
            error_log("Player access deletion failed: " . $e->getMessage());
            return $this->error($response, 'Failed to revoke player access', 500);
        }
    }

    /**
     * Player portal access (public endpoint with token).
     */
    public function portalAccess(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $token = $args['token'] ?? null;

        if (!$token) {
            return $this->error($response, 'Access token is required', 400);
        }

        try {
            $playerAccess = PlayerAccess::where('access_token', $token)
                ->where('status', 'active')
                ->first();

            if (!$playerAccess) {
                return $this->notFound($response, 'Invalid or expired access token');
            }

            // Update last accessed
            $playerAccess->updateLastAccessed();

            // Load campaign and accessible characters
            $playerAccess->load('campaign');
            $playerAccess->accessible_characters = $playerAccess->getAccessibleCharacters();

            return $this->success($response, [
                'player_access' => $playerAccess,
                'campaign' => $playerAccess->campaign,
                'characters' => $playerAccess->accessible_characters,
                'permissions' => $playerAccess->permissions
            ]);

        } catch (\Exception $e) {
            error_log("Portal access failed: " . $e->getMessage());
            return $this->error($response, 'Failed to access portal', 500);
        }
    }

    /**
     * Get campaign data for player portal.
     */
    public function getCampaignData(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $token = $args['token'] ?? null;

        if (!$token) {
            return $this->error($response, 'Access token is required', 400);
        }

        try {
            $playerAccess = PlayerAccess::where('access_token', $token)
                ->where('status', 'active')
                ->first();

            if (!$playerAccess) {
                return $this->notFound($response, 'Invalid or expired access token');
            }

            // Update last accessed
            $playerAccess->updateLastAccessed();

            $campaignData = [];

            // Always include basic campaign info
            $campaignData['campaign'] = $playerAccess->campaign;
            $campaignData['characters'] = $playerAccess->getAccessibleCharacters();

            // Include data based on permissions
            if ($playerAccess->hasPermission('view_timeline')) {
                $campaignData['timeline'] = \App\Models\TimelineEvent::where('campaign_id', $playerAccess->campaign_id)
                    ->orderBy('session_date', 'desc')
                    ->limit(10)
                    ->get();
            }

            if ($playerAccess->hasPermission('view_locations')) {
                $campaignData['locations'] = \App\Models\Location::where('campaign_id', $playerAccess->campaign_id)
                    ->orderBy('name')
                    ->get();
            }

            if ($playerAccess->hasPermission('view_quests')) {
                $campaignData['quests'] = \App\Models\Quest::where('campaign_id', $playerAccess->campaign_id)
                    ->whereIn('status', ['active', 'completed'])
                    ->orderBy('created_at', 'desc')
                    ->get();
            }

            if ($playerAccess->hasPermission('view_notes')) {
                $campaignData['notes'] = \App\Models\Note::where('campaign_id', $playerAccess->campaign_id)
                    ->where('is_public', true)
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get();
            }

            return $this->success($response, $campaignData);

        } catch (\Exception $e) {
            error_log("Campaign data retrieval failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get campaign data', 500);
        }
    }

    /**
     * Get available permissions.
     */
    public function getPermissions(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->success($response, [
            'available_permissions' => PlayerAccess::AVAILABLE_PERMISSIONS,
            'default_permissions' => PlayerAccess::DEFAULT_PERMISSIONS
        ]);
    }

    /**
     * Regenerate access token.
     */
    public function regenerateToken(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;
        $accessId = $args['access_id'] ?? null;

        if (!$campaignId || !$accessId) {
            return $this->error($response, 'Campaign ID and Access ID are required', 400);
        }

        try {
            $playerAccess = PlayerAccess::where('id', $accessId)
                ->where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$playerAccess) {
                return $this->notFound($response, 'Player access not found');
            }

            $playerAccess->access_token = PlayerAccess::generateAccessToken();
            $playerAccess->save();

            return $this->success($response, [
                'access_token' => $playerAccess->access_token
            ], 'Access token regenerated successfully');

        } catch (\Exception $e) {
            error_log("Token regeneration failed: " . $e->getMessage());
            return $this->error($response, 'Failed to regenerate token', 500);
        }
    }
}