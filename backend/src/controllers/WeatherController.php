<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Models\CampaignWeather;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class WeatherController extends BaseController
{
    /**
     * Get weather and calendar data for a campaign.
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
            // Get or create weather system for campaign
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                $weatherSystem = new CampaignWeather([
                    'user_id' => $userId,
                    'campaign_id' => $campaignId,
                    'current_date' => [
                        'day' => 1,
                        'month' => 0,
                        'year' => 1492,
                        'season' => 'Winter'
                    ],
                    'current_weather' => null,
                    'weather_history' => [],
                    'calendar_events' => [],
                    'settings' => [
                        'auto_advance' => false,
                        'weather_effects' => true
                    ]
                ]);
                
                // Generate initial weather
                $weatherSystem->generateWeather();
                $weatherSystem->save();
            }

            return $this->success($response, $weatherSystem);

        } catch (\Exception $e) {
            error_log("Weather system retrieval failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get weather system', 500);
        }
    }

    /**
     * Generate new weather.
     */
    public function generateWeather(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
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
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $newWeather = $weatherSystem->generateWeather();
            $weatherSystem->save();

            return $this->success($response, [
                'weather' => $newWeather,
                'current_date' => $weatherSystem->current_date
            ], 'New weather generated successfully');

        } catch (\Exception $e) {
            error_log("Weather generation failed: " . $e->getMessage());
            return $this->error($response, 'Failed to generate weather', 500);
        }
    }

    /**
     * Advance the calendar by one day.
     */
    public function advanceDay(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
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
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $newDate = $weatherSystem->advanceDay();
            $weatherSystem->save();

            return $this->success($response, [
                'current_date' => $newDate,
                'current_weather' => $weatherSystem->current_weather,
                'events_today' => $weatherSystem->getEventsForDate($newDate)
            ], 'Calendar advanced by one day');

        } catch (\Exception $e) {
            error_log("Calendar advance failed: " . $e->getMessage());
            return $this->error($response, 'Failed to advance calendar', 500);
        }
    }

    /**
     * Set a specific date.
     */
    public function setDate(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
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
        $errors = $this->validateRequired($data, ['day', 'month', 'year']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        try {
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $weatherSystem->setDate((int)$data['day'], (int)$data['month'], (int)$data['year']);
            $weatherSystem->generateWeather(); // Generate weather for new date
            $weatherSystem->save();

            return $this->success($response, [
                'current_date' => $weatherSystem->current_date,
                'current_weather' => $weatherSystem->current_weather
            ], 'Date set successfully');

        } catch (\Exception $e) {
            error_log("Set date failed: " . $e->getMessage());
            return $this->error($response, 'Failed to set date', 500);
        }
    }

    /**
     * Add a calendar event.
     */
    public function addEvent(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
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
        $errors = $this->validateRequired($data, ['name', 'date']);
        if (!empty($errors)) {
            return $this->validationError($response, $errors);
        }

        // Validate event type
        $validTypes = ['holiday', 'quest', 'event', 'session'];
        if (isset($data['type']) && !in_array($data['type'], $validTypes)) {
            return $this->error($response, 'Invalid event type. Valid types: ' . implode(', ', $validTypes), 400);
        }

        try {
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $eventId = $weatherSystem->addCalendarEvent($data);
            $weatherSystem->save();

            return $this->success($response, [
                'event_id' => $eventId,
                'calendar_events' => $weatherSystem->calendar_events
            ], 'Calendar event added successfully', 201);

        } catch (\Exception $e) {
            error_log("Add calendar event failed: " . $e->getMessage());
            return $this->error($response, 'Failed to add calendar event', 500);
        }
    }

    /**
     * Update a calendar event.
     */
    public function updateEvent(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;
        $eventId = $args['event_id'] ?? null;

        if (!$campaignId || !$eventId) {
            return $this->error($response, 'Campaign ID and Event ID are required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        $data = $this->getRequestData($request);

        // Validate event type if provided
        if (isset($data['type'])) {
            $validTypes = ['holiday', 'quest', 'event', 'session'];
            if (!in_array($data['type'], $validTypes)) {
                return $this->error($response, 'Invalid event type. Valid types: ' . implode(', ', $validTypes), 400);
            }
        }

        try {
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $success = $weatherSystem->updateCalendarEvent($eventId, $data);
            
            if (!$success) {
                return $this->notFound($response, 'Calendar event not found');
            }

            $weatherSystem->save();

            return $this->success($response, [
                'calendar_events' => $weatherSystem->calendar_events
            ], 'Calendar event updated successfully');

        } catch (\Exception $e) {
            error_log("Update calendar event failed: " . $e->getMessage());
            return $this->error($response, 'Failed to update calendar event', 500);
        }
    }

    /**
     * Delete a calendar event.
     */
    public function deleteEvent(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;
        $eventId = $args['event_id'] ?? null;

        if (!$campaignId || !$eventId) {
            return $this->error($response, 'Campaign ID and Event ID are required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        try {
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $success = $weatherSystem->removeCalendarEvent($eventId);
            
            if (!$success) {
                return $this->notFound($response, 'Calendar event not found');
            }

            $weatherSystem->save();

            return $this->success($response, [
                'calendar_events' => $weatherSystem->calendar_events
            ], 'Calendar event deleted successfully');

        } catch (\Exception $e) {
            error_log("Delete calendar event failed: " . $e->getMessage());
            return $this->error($response, 'Failed to delete calendar event', 500);
        }
    }

    /**
     * Get upcoming events.
     */
    public function getUpcomingEvents(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
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

        $queryParams = $this->getQueryParams($request);
        $days = min((int)($queryParams['days'] ?? 30), 90); // Limit to 90 days max

        try {
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $upcomingEvents = $weatherSystem->getUpcomingEvents($days);

            return $this->success($response, [
                'upcoming_events' => $upcomingEvents,
                'days_ahead' => $days
            ]);

        } catch (\Exception $e) {
            error_log("Get upcoming events failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get upcoming events', 500);
        }
    }

    /**
     * Get weather statistics.
     */
    public function getWeatherStatistics(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
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
            $weatherSystem = CampaignWeather::where('campaign_id', $campaignId)
                ->where('user_id', $userId)
                ->first();

            if (!$weatherSystem) {
                return $this->notFound($response, 'Weather system not found');
            }

            $statistics = $weatherSystem->getWeatherStatistics();

            return $this->success($response, $statistics);

        } catch (\Exception $e) {
            error_log("Get weather statistics failed: " . $e->getMessage());
            return $this->error($response, 'Failed to get weather statistics', 500);
        }
    }

    /**
     * Get available weather conditions and calendar info.
     */
    public function getWeatherInfo(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        return $this->success($response, [
            'weather_conditions' => CampaignWeather::WEATHER_CONDITIONS,
            'months' => CampaignWeather::MONTHS,
            'seasons' => CampaignWeather::SEASONS
        ]);
    }
}