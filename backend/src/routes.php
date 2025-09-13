<?php

use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\Controllers\CampaignController;
use App\Controllers\CharacterController;
use App\Controllers\LocationController;
use App\Controllers\ItemController;
use App\Controllers\NoteController;
use App\Controllers\RelationshipController;
use App\Controllers\TimelineEventController;
use App\Controllers\MapController;
use App\Controllers\QuestController;
use App\Controllers\NPCController;
use App\Controllers\WeatherController;
use App\Controllers\InitiativeController;
use App\Controllers\PlayerAccessController;
use App\Controllers\SharedResourceController;
use App\Controllers\Auth0Controller;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

return function (App $app) {
    // Health check endpoint
    $app->get('/health', function (Request $request, Response $response) {
        $data = [
            'status' => 'ok',
            'timestamp' => date('c'),
            'version' => '1.0.0'
        ];
        
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json');
    });

    // API routes group with CORS middleware
    $app->group('/api', function (RouteCollectorProxy $group) {
        
        // Auth0 endpoints
        $group->group('/auth', function (RouteCollectorProxy $auth) {
            $auth->post('/verify-user', [Auth0Controller::class, 'verifyUser'])->add(new \App\Middleware\Auth0Middleware());
            $auth->get('/current-user', [Auth0Controller::class, 'getCurrentUser'])->add(new \App\Middleware\Auth0Middleware());
            $auth->get('/validate-session', [Auth0Controller::class, 'validateSession'])->add(new \App\Middleware\Auth0Middleware());
            
            // Debug endpoint
            $auth->get('/debug', function (Request $request, Response $response) {
                $auth0User = $request->getAttribute('auth0_user');
                $user = $request->getAttribute('user');
                
                $debug = [
                    'auth0_user' => $auth0User,
                    'user' => $user,
                    'has_auth0_user' => $auth0User !== null,
                    'has_user' => $user !== null
                ];
                
                $response->getBody()->write(json_encode($debug, JSON_PRETTY_PRINT));
                return $response->withHeader('Content-Type', 'application/json');
            })->add(new \App\Middleware\Auth0Middleware());
        });
        
        // Protected routes (require authentication)
        $group->group('', function (RouteCollectorProxy $protected) {
        
            // Campaign routes
            $protected->group('/campaigns', function (RouteCollectorProxy $campaigns) {
            $campaigns->get('', [CampaignController::class, 'index']);
            $campaigns->post('', [CampaignController::class, 'create']);
            $campaigns->get('/{id}', [CampaignController::class, 'show']);
            $campaigns->put('/{id}', [CampaignController::class, 'update']);
            $campaigns->delete('/{id}', [CampaignController::class, 'delete']);
            $campaigns->get('/{id}/export', [CampaignController::class, 'export']);
            $campaigns->get('/{id}/analytics', [CampaignController::class, 'analytics']);
            $campaigns->get('/{id}/search', [CampaignController::class, 'search']);
            
            // CSV Export endpoints
            $campaigns->get('/{id}/export/csv/{entity_type}', function ($request, $response, $args) {
                try {
                    $csv = \App\Services\ExportService::exportToCSV($args['id'], $args['entity_type']);
                    $response->getBody()->write($csv);
                    return $response->withHeader('Content-Type', 'text/csv')
                                  ->withHeader('Content-Disposition', 'attachment; filename="' . $args['entity_type'] . '.csv"');
                } catch (\Exception $e) {
                    $error = json_encode(['success' => false, 'message' => $e->getMessage()]);
                    $response->getBody()->write($error);
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
                }
            });
            
            // Search suggestions
            $campaigns->get('/{id}/search/suggestions', function ($request, $response, $args) {
                try {
                    $queryParams = $request->getQueryParams();
                    $partial = $queryParams['q'] ?? '';
                    
                    if (strlen($partial) < 2) {
                        return (new \App\Controllers\BaseController())->error($response, 'Query must be at least 2 characters');
                    }
                    
                    $suggestions = \App\Services\SearchService::getSearchSuggestions($args['id'], $partial);
                    return (new \App\Controllers\BaseController())->success($response, $suggestions);
                } catch (\Exception $e) {
                    return (new \App\Controllers\BaseController())->error($response, $e->getMessage(), 500);
                }
            });
            
                // Character routes within campaigns
                $campaigns->group('/{campaign_id}/characters', function (RouteCollectorProxy $characters) {
                    $characters->get('', [CharacterController::class, 'index']);
                    $characters->post('', [CharacterController::class, 'create']);
                });

                // Location routes within campaigns
                $campaigns->group('/{campaign_id}/locations', function (RouteCollectorProxy $locations) {
                    $locations->get('', [LocationController::class, 'index']);
                    $locations->post('', [LocationController::class, 'create']);
                    $locations->get('/hierarchy', [LocationController::class, 'hierarchy']);
                });

                // Item routes within campaigns
                $campaigns->group('/{campaign_id}/items', function (RouteCollectorProxy $items) {
                    $items->get('', [ItemController::class, 'index']);
                    $items->post('', [ItemController::class, 'create']);
                });

                // Note routes within campaigns
                $campaigns->group('/{campaign_id}/notes', function (RouteCollectorProxy $notes) {
                    $notes->get('', [NoteController::class, 'index']);
                    $notes->post('', [NoteController::class, 'create']);
                    $notes->get('/search', [NoteController::class, 'search']);
                    $notes->get('/statistics', [NoteController::class, 'statistics']);
                });

                // Relationship routes within campaigns
                $campaigns->group('/{campaign_id}/relationships', function (RouteCollectorProxy $relationships) {
                    $relationships->get('', [RelationshipController::class, 'index']);
                    $relationships->post('', [RelationshipController::class, 'create']);
                    $relationships->get('/network', [RelationshipController::class, 'network']);
                    $relationships->get('/statistics', [RelationshipController::class, 'statistics']);
                    $relationships->get('/find-path', [RelationshipController::class, 'findPath']);
                });

                // Timeline event routes within campaigns
                $campaigns->group('/{campaign_id}/timeline', function (RouteCollectorProxy $timeline) {
                    $timeline->get('', [TimelineEventController::class, 'index']);
                    $timeline->post('', [TimelineEventController::class, 'create']);
                    $timeline->get('/grouped', [TimelineEventController::class, 'groupedBySessions']);
                    $timeline->get('/statistics', [TimelineEventController::class, 'statistics']);
                    $timeline->get('/activity', [TimelineEventController::class, 'activity']);
                    $timeline->get('/mentions', [TimelineEventController::class, 'mentions']);
                    $timeline->get('/characters/{character_id}/involvement', [TimelineEventController::class, 'characterInvolvement']);
                    $timeline->get('/locations/{location_id}/history', [TimelineEventController::class, 'locationHistory']);
                });

                // Map routes within campaigns
                $campaigns->group('/{campaign_id}/maps', function (RouteCollectorProxy $maps) {
                    $maps->get('', [MapController::class, 'index']);
                    $maps->post('', [MapController::class, 'create']);
                });

                // Quest routes within campaigns
                $campaigns->group('/{campaign_id}/quests', function (RouteCollectorProxy $quests) {
                    $quests->get('', [QuestController::class, 'index']);
                    $quests->post('', [QuestController::class, 'create']);
                    $quests->get('/statistics', [QuestController::class, 'statistics']);
                });

                // NPC Generator routes within campaigns
                $campaigns->group('/{campaign_id}/npcs', function (RouteCollectorProxy $npcs) {
                    $npcs->post('/generate', [NPCController::class, 'generate']);
                    $npcs->post('/generate/batch', [NPCController::class, 'generateBatch']);
                    $npcs->get('/races', [NPCController::class, 'getRaces']);
                    $npcs->get('/races/{race}', [NPCController::class, 'getRaceTemplate']);
                });

                // Weather & Calendar routes within campaigns
                $campaigns->group('/{campaign_id}/weather', function (RouteCollectorProxy $weather) {
                    $weather->get('', [WeatherController::class, 'index']);
                    $weather->post('/generate', [WeatherController::class, 'generateWeather']);
                    $weather->post('/advance-day', [WeatherController::class, 'advanceDay']);
                    $weather->post('/set-date', [WeatherController::class, 'setDate']);
                    $weather->post('/events', [WeatherController::class, 'addEvent']);
                    $weather->put('/events/{event_id}', [WeatherController::class, 'updateEvent']);
                    $weather->delete('/events/{event_id}', [WeatherController::class, 'deleteEvent']);
                    $weather->get('/events/upcoming', [WeatherController::class, 'getUpcomingEvents']);
                    $weather->get('/statistics', [WeatherController::class, 'getWeatherStatistics']);
                });

                // Initiative Tracker routes within campaigns
                $campaigns->group('/{campaign_id}/combat', function (RouteCollectorProxy $combat) {
                    $combat->get('', [InitiativeController::class, 'index']);
                    $combat->post('', [InitiativeController::class, 'create']);
                    $combat->get('/{encounter_id}', [InitiativeController::class, 'show']);
                    $combat->put('/{encounter_id}', [InitiativeController::class, 'update']);
                    $combat->delete('/{encounter_id}', [InitiativeController::class, 'delete']);
                    $combat->post('/{encounter_id}/start', [InitiativeController::class, 'start']);
                    $combat->post('/{encounter_id}/end', [InitiativeController::class, 'end']);
                    $combat->post('/{encounter_id}/next-turn', [InitiativeController::class, 'nextTurn']);
                    $combat->post('/{encounter_id}/combatants', [InitiativeController::class, 'addCombatant']);
                    $combat->put('/{encounter_id}/combatants/{combatant_id}', [InitiativeController::class, 'updateCombatant']);
                    $combat->delete('/{encounter_id}/combatants/{combatant_id}', [InitiativeController::class, 'removeCombatant']);
                    $combat->post('/{encounter_id}/combatants/{combatant_id}/damage', [InitiativeController::class, 'applyDamage']);
                    $combat->post('/{encounter_id}/combatants/{combatant_id}/heal', [InitiativeController::class, 'applyHealing']);
                    $combat->post('/{encounter_id}/combatants/{combatant_id}/status-effects', [InitiativeController::class, 'addStatusEffect']);
                    $combat->delete('/{encounter_id}/combatants/{combatant_id}/status-effects/{effect_id}', [InitiativeController::class, 'removeStatusEffect']);
                    $combat->get('/{encounter_id}/summary', [InitiativeController::class, 'getSummary']);
                });

                // Player Access routes within campaigns
                $campaigns->group('/{campaign_id}/players', function (RouteCollectorProxy $players) {
                    $players->get('', [PlayerAccessController::class, 'index']);
                    $players->post('', [PlayerAccessController::class, 'create']);
                    $players->get('/{access_id}', [PlayerAccessController::class, 'show']);
                    $players->put('/{access_id}', [PlayerAccessController::class, 'update']);
                    $players->delete('/{access_id}', [PlayerAccessController::class, 'delete']);
                    $players->post('/{access_id}/regenerate-token', [PlayerAccessController::class, 'regenerateToken']);
                });

                // Shared Resource routes within campaigns
                $campaigns->group('/{campaign_id}/resources', function (RouteCollectorProxy $resources) {
                    $resources->get('', [SharedResourceController::class, 'index']);
                    $resources->post('', [SharedResourceController::class, 'create']);
                });
            });

            // Individual entity routes (accessed by ID across all campaigns)
            $protected->group('/characters', function (RouteCollectorProxy $characters) {
                $characters->get('/{id}', [CharacterController::class, 'show']);
                $characters->put('/{id}', [CharacterController::class, 'update']);
                $characters->delete('/{id}', [CharacterController::class, 'delete']);
                $characters->get('/{id}/relationships', [CharacterController::class, 'relationships']);
            });

            $protected->group('/locations', function (RouteCollectorProxy $locations) {
                $locations->get('/{id}', [LocationController::class, 'show']);
                $locations->put('/{id}', [LocationController::class, 'update']);
                $locations->delete('/{id}', [LocationController::class, 'delete']);
                $locations->get('/{id}/items', [LocationController::class, 'items']);
            });

            $protected->group('/items', function (RouteCollectorProxy $items) {
                $items->get('/{id}', [ItemController::class, 'show']);
                $items->put('/{id}', [ItemController::class, 'update']);
                $items->delete('/{id}', [ItemController::class, 'delete']);
                $items->post('/{id}/transfer', [ItemController::class, 'transfer']);
                $items->get('/{id}/history', [ItemController::class, 'history']);
            });

            $protected->group('/notes', function (RouteCollectorProxy $notes) {
                $notes->get('/{id}', [NoteController::class, 'show']);
                $notes->put('/{id}', [NoteController::class, 'update']);
                $notes->delete('/{id}', [NoteController::class, 'delete']);
                $notes->get('/{id}/references', [NoteController::class, 'references']);
            });

            $protected->group('/relationships', function (RouteCollectorProxy $relationships) {
                $relationships->get('/{id}', [RelationshipController::class, 'show']);
                $relationships->put('/{id}', [RelationshipController::class, 'update']);
                $relationships->delete('/{id}', [RelationshipController::class, 'delete']);
            });

            $protected->group('/timeline', function (RouteCollectorProxy $timeline) {
                $timeline->get('/{id}', [TimelineEventController::class, 'show']);
                $timeline->put('/{id}', [TimelineEventController::class, 'update']);
                $timeline->delete('/{id}', [TimelineEventController::class, 'delete']);
                $timeline->post('/{id}/entities', [TimelineEventController::class, 'addRelatedEntity']);
            });

            $protected->group('/maps', function (RouteCollectorProxy $maps) {
                $maps->get('/{id}', [MapController::class, 'show']);
                $maps->put('/{id}', [MapController::class, 'update']);
                $maps->delete('/{id}', [MapController::class, 'delete']);
                $maps->post('/{id}/pins', [MapController::class, 'addPin']);
                $maps->put('/{id}/pins/{pin_id}', [MapController::class, 'updatePin']);
                $maps->delete('/{id}/pins/{pin_id}', [MapController::class, 'deletePin']);
                $maps->post('/{id}/routes', [MapController::class, 'addRoute']);
                $maps->put('/{id}/routes/{route_id}', [MapController::class, 'updateRoute']);
                $maps->delete('/{id}/routes/{route_id}', [MapController::class, 'deleteRoute']);
            });

            $protected->group('/quests', function (RouteCollectorProxy $quests) {
                $quests->get('/{id}', [QuestController::class, 'show']);
                $quests->put('/{id}', [QuestController::class, 'update']);
                $quests->delete('/{id}', [QuestController::class, 'delete']);
                $quests->post('/{id}/complete', [QuestController::class, 'complete']);
                $quests->post('/{id}/objectives', [QuestController::class, 'addObjective']);
                $quests->put('/{id}/objectives/{objective_id}', [QuestController::class, 'updateObjective']);
                $quests->delete('/{id}/objectives/{objective_id}', [QuestController::class, 'deleteObjective']);
            });

            $protected->group('/resources', function (RouteCollectorProxy $resources) {
                $resources->get('/{id}', [SharedResourceController::class, 'show']);
                $resources->put('/{id}', [SharedResourceController::class, 'update']);
                $resources->delete('/{id}', [SharedResourceController::class, 'delete']);
                $resources->get('/{id}/download', [SharedResourceController::class, 'download']);
            });

            // Weather info endpoint
            $protected->get('/weather/info', [WeatherController::class, 'getWeatherInfo']);

            // Player access permissions endpoint
            $protected->get('/players/permissions', [PlayerAccessController::class, 'getPermissions']);

            // Shared resources info endpoint
            $protected->get('/resources/info', [SharedResourceController::class, 'getResourceInfo']);

            // Import endpoint (creates new campaign)
            $protected->post('/import', [CampaignController::class, 'import']);
            
        })->add(new \App\Middleware\Auth0Middleware());

        // Public player portal routes (no authentication required)
        $group->group('/player-portal', function (RouteCollectorProxy $portal) {
            $portal->get('/{token}', [PlayerAccessController::class, 'portalAccess']);
            $portal->get('/{token}/campaign', [PlayerAccessController::class, 'getCampaignData']);
            $portal->get('/{token}/resources', [SharedResourceController::class, 'playerIndex']);
        });
        
    })->add(new \App\Middleware\CorsMiddleware());

    // Handle preflight requests
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });
};