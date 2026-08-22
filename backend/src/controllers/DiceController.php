<?php

namespace App\Controllers;

use App\Models\Campaign;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Dice Roll Model
class DiceRoll extends Model
{
    protected $table = 'dice_rolls';
    
    protected $fillable = [
        'campaign_id',
        'player_id',
        'player_name',
        'expression',
        'result',
        'individual_rolls',
        'modifier',
        'context',
        'advantage',
        'disadvantage',
        'critical',
        'tags',
        'is_private',
        'created_at'
    ];

    protected $casts = [
        'individual_rolls' => 'array',
        'advantage' => 'boolean',
        'disadvantage' => 'boolean',
        'critical' => 'boolean',
        'tags' => 'array',
        'is_private' => 'boolean'
    ];

    public $timestamps = false;

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}

// Dice Template Model
class DiceTemplate extends Model
{
    protected $table = 'dice_templates';
    
    protected $fillable = [
        'campaign_id',
        'name',
        'expression',
        'description',
        'category',
        'tags',
        'created_at'
    ];

    protected $casts = [
        'tags' => 'array'
    ];

    public $timestamps = false;

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}

class DiceController extends BaseController
{
    public function __construct()
    {
        parent::__construct();
    }

    private function campaignId(array $args): ?string
    {
        return isset($args['campaign_id']) && trim((string) $args['campaign_id']) !== ''
            ? trim((string) $args['campaign_id'])
            : (isset($args['campaignId']) && trim((string) $args['campaignId']) !== ''
                ? trim((string) $args['campaignId'])
                : null);
    }

    private function campaignRequired($request, $response, array $args): ?string
    {
        $campaignId = $this->campaignId($args);
        if ($campaignId === null || $this->ownedCampaign($request, $campaignId) === null) {
            $this->notFound($response, 'Campaign not found');
            return null;
        }

        return $campaignId;
    }

    // Roll History Management
    public function getRolls($request, $response, $args)
    {
        $campaignId = $this->campaignRequired($request, $response, $args);
        $limit = $request->getQueryParams()['limit'] ?? 50;
        $includePrivate = $request->getQueryParams()['includePrivate'] ?? false;

        if ($campaignId === null) return $this->notFound($response, 'Campaign not found');

        try {
            $query = DiceRoll::where('campaign_id', $campaignId)
                ->orderBy('created_at', 'desc')
                ->limit($limit);

            // Filter private rolls unless specifically requested
            if (!$includePrivate) {
                $query->where('is_private', false);
            }

            $rolls = $query->get();

            return $this->jsonResponse($response, $rolls->toArray());
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to fetch rolls: ' . $e->getMessage()], 500);
        }
    }

    public function createRoll($request, $response, $args)
    {
        $campaignId = $this->campaignRequired($request, $response, $args);
        
        if ($campaignId === null) return $this->notFound($response, 'Campaign not found');

        $data = $request->getParsedBody();
        
        // Validate required fields
        $required = ['expression', 'result', 'individual_rolls'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return $this->jsonResponse($response, ['error' => "Missing required field: $field"], 400);
            }
        }

        try {
            $roll = DiceRoll::create([
                'campaign_id' => $campaignId,
                'player_id' => $data['player_id'] ?? null,
                'player_name' => $data['player_name'] ?? 'Anonymous',
                'expression' => $data['expression'],
                'result' => $data['result'],
                'individual_rolls' => $data['individual_rolls'],
                'modifier' => $data['modifier'] ?? 0,
                'context' => $data['context'] ?? null,
                'advantage' => $data['advantage'] ?? false,
                'disadvantage' => $data['disadvantage'] ?? false,
                'critical' => $data['critical'] ?? false,
                'tags' => $data['tags'] ?? [],
                'is_private' => $data['is_private'] ?? false
            ]);

            return $this->jsonResponse($response, $roll->toArray(), 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to create roll: ' . $e->getMessage()], 500);
        }
    }

    public function deleteRoll($request, $response, $args)
    {
        $rollId = $args['rollId'] ?? null;
        
        if (!$rollId) {
            return $this->jsonResponse($response, ['error' => 'Roll ID required'], 400);
        }

        try {
            $campaignId = $this->campaignRequired($request, $response, $args);
            if ($campaignId === null) return $this->notFound($response, 'Campaign not found');
            $roll = $this->ownedEntityInCampaign($request, DiceRoll::class, $rollId, $campaignId);
            
            if (!$roll) {
                return $this->jsonResponse($response, ['error' => 'Roll not found'], 404);
            }

            $roll->delete();
            return $this->jsonResponse($response, ['message' => 'Roll deleted successfully']);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to delete roll: ' . $e->getMessage()], 500);
        }
    }

    public function clearRollHistory($request, $response, $args)
    {
        $campaignId = $this->campaignRequired($request, $response, $args);
        
        if ($campaignId === null) return $this->notFound($response, 'Campaign not found');

        try {
            $data = $request->getParsedBody();
            $playerId = $data['player_id'] ?? null;

            $query = DiceRoll::where('campaign_id', $campaignId);
            
            // If player_id is specified, only clear that player's rolls
            if ($playerId) {
                $query->where('player_id', $playerId);
            }

            $deletedCount = $query->delete();

            return $this->jsonResponse($response, [
                'message' => 'Roll history cleared successfully',
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to clear roll history: ' . $e->getMessage()], 500);
        }
    }

    // Template Management
    public function getTemplates($request, $response, $args)
    {
        $campaignId = $this->campaignRequired($request, $response, $args);
        
        if ($campaignId === null) return $this->notFound($response, 'Campaign not found');

        try {
            $templates = DiceTemplate::where('campaign_id', $campaignId)
                ->orderBy('category')
                ->orderBy('name')
                ->get();

            return $this->jsonResponse($response, $templates->toArray());
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to fetch templates: ' . $e->getMessage()], 500);
        }
    }

    public function createTemplate($request, $response, $args)
    {
        $campaignId = $this->campaignRequired($request, $response, $args);
        
        if ($campaignId === null) return $this->notFound($response, 'Campaign not found');

        $data = $request->getParsedBody();
        
        // Validate required fields
        $required = ['name', 'expression', 'category'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                return $this->jsonResponse($response, ['error' => "Missing required field: $field"], 400);
            }
        }

        try {
            $template = DiceTemplate::create([
                'campaign_id' => $campaignId,
                'name' => $data['name'],
                'expression' => $data['expression'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'tags' => $data['tags'] ?? []
            ]);

            return $this->jsonResponse($response, $template->toArray(), 201);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to create template: ' . $e->getMessage()], 500);
        }
    }

    public function updateTemplate($request, $response, $args)
    {
        $templateId = $args['templateId'] ?? null;
        
        if (!$templateId) {
            return $this->jsonResponse($response, ['error' => 'Template ID required'], 400);
        }

        try {
            $campaignId = $this->campaignRequired($request, $response, $args);
            if ($campaignId === null) return $this->notFound($response, 'Campaign not found');
            $template = $this->ownedEntityInCampaign($request, DiceTemplate::class, $templateId, $campaignId);
            
            if (!$template) {
                return $this->jsonResponse($response, ['error' => 'Template not found'], 404);
            }

            $data = $request->getParsedBody();
            $template->update($data);

            return $this->jsonResponse($response, $template->fresh()->toArray());
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to update template: ' . $e->getMessage()], 500);
        }
    }

    public function deleteTemplate($request, $response, $args)
    {
        $templateId = $args['templateId'] ?? null;
        
        if (!$templateId) {
            return $this->jsonResponse($response, ['error' => 'Template ID required'], 400);
        }

        try {
            $campaignId = $this->campaignRequired($request, $response, $args);
            if ($campaignId === null) return $this->notFound($response, 'Campaign not found');
            $template = $this->ownedEntityInCampaign($request, DiceTemplate::class, $templateId, $campaignId);
            
            if (!$template) {
                return $this->jsonResponse($response, ['error' => 'Template not found'], 404);
            }

            $template->delete();
            return $this->jsonResponse($response, ['message' => 'Template deleted successfully']);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to delete template: ' . $e->getMessage()], 500);
        }
    }

    // Statistics and Analytics
    public function getRollStatistics($request, $response, $args)
    {
        $campaignId = $this->campaignRequired($request, $response, $args);
        
        if ($campaignId === null) return $this->notFound($response, 'Campaign not found');

        $params = $request->getQueryParams();
        $playerId = $params['player_id'] ?? null;
        $days = $params['days'] ?? 30;
        $context = $params['context'] ?? null;

        try {
            $query = DiceRoll::where('campaign_id', $campaignId)
                ->where('created_at', '>=', date('Y-m-d H:i:s', strtotime("-{$days} days")))
                ->where('is_private', false);

            if ($playerId) {
                $query->where('player_id', $playerId);
            }

            if ($context) {
                $query->where('context', $context);
            }

            $rolls = $query->get();

            $statistics = [
                'total_rolls' => $rolls->count(),
                'average_result' => $rolls->avg('result'),
                'highest_roll' => $rolls->max('result'),
                'lowest_roll' => $rolls->min('result'),
                'critical_hits' => $rolls->where('critical', true)->count(),
                'advantage_rolls' => $rolls->where('advantage', true)->count(),
                'disadvantage_rolls' => $rolls->where('disadvantage', true)->count(),
                'rolls_by_context' => $rolls->groupBy('context')->map->count()->toArray(),
                'rolls_by_player' => $rolls->groupBy('player_name')->map->count()->toArray(),
                'rolls_by_day' => $rolls->groupBy(function($roll) {
                    return date('Y-m-d', strtotime($roll->created_at));
                })->map->count()->toArray()
            ];

            return $this->jsonResponse($response, $statistics);
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to get statistics: ' . $e->getMessage()], 500);
        }
    }

    // Real-time sharing
    public function getRecentRolls($request, $response, $args)
    {
        $campaignId = $this->campaignRequired($request, $response, $args);
        
        if ($campaignId === null) return $this->notFound($response, 'Campaign not found');

        $params = $request->getQueryParams();
        $since = $params['since'] ?? null;
        $limit = $params['limit'] ?? 10;

        try {
            $query = DiceRoll::where('campaign_id', $campaignId)
                ->where('is_private', false)
                ->orderBy('created_at', 'desc')
                ->limit($limit);

            if ($since) {
                $query->where('created_at', '>', $since);
            }

            $rolls = $query->get();

            return $this->jsonResponse($response, $rolls->toArray());
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Failed to fetch recent rolls: ' . $e->getMessage()], 500);
        }
    }
}
