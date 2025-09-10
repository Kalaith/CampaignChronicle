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

            // Import endpoint (creates new campaign)
            $protected->post('/import', [CampaignController::class, 'import']);
            
        })->add(new \App\Middleware\Auth0Middleware());
        
    })->add(new \App\Middleware\CorsMiddleware());

    // Handle preflight requests
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });
};