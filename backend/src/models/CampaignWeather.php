<?php

namespace App\Models;

class CampaignWeather extends BaseModel
{
    protected $table = 'campaign_weather';

    protected $fillable = [
        'user_id',
        'campaign_id',
        'current_date',
        'current_weather',
        'weather_history',
        'calendar_events',
        'settings',
    ];

    protected $casts = [
        'current_date' => 'array',
        'current_weather' => 'array',
        'weather_history' => 'array',
        'calendar_events' => 'array',
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Weather conditions with seasonal probabilities.
     */
    const WEATHER_CONDITIONS = [
        [
            'condition' => 'Clear',
            'temperature' => 'Mild',
            'icon' => '☀️',
            'description' => 'Clear skies with bright sunshine',
            'effects' => ['Good visibility', 'Normal travel conditions']
        ],
        [
            'condition' => 'Partly Cloudy',
            'temperature' => 'Cool',
            'icon' => '⛅',
            'description' => 'Some clouds with occasional sunshine',
            'effects' => ['Good visibility', 'Pleasant traveling weather']
        ],
        [
            'condition' => 'Overcast',
            'temperature' => 'Cool',
            'icon' => '☁️',
            'description' => 'Completely cloudy skies',
            'effects' => ['Reduced visibility', 'Gloomy atmosphere']
        ],
        [
            'condition' => 'Light Rain',
            'temperature' => 'Cool',
            'icon' => '🌦️',
            'description' => 'Light rainfall with occasional breaks',
            'effects' => ['Wet roads', 'Disadvantage on tracking', 'Reduced visibility']
        ],
        [
            'condition' => 'Heavy Rain',
            'temperature' => 'Cold',
            'icon' => '🌧️',
            'description' => 'Steady, heavy rainfall',
            'effects' => ['Flooded paths', 'Difficult travel', 'Poor visibility', 'Disadvantage on Perception (sight)']
        ],
        [
            'condition' => 'Thunderstorm',
            'temperature' => 'Warm',
            'icon' => '⛈️',
            'description' => 'Heavy rain with thunder and lightning',
            'effects' => ['Dangerous travel', 'Loud thunder masks sounds', 'Risk of lightning strikes', 'Animals are skittish']
        ],
        [
            'condition' => 'Snow',
            'temperature' => 'Cold',
            'icon' => '❄️',
            'description' => 'Falling snow',
            'effects' => ['Slippery surfaces', 'Tracks in snow', 'Reduced visibility', 'Cold weather effects']
        ],
        [
            'condition' => 'Blizzard',
            'temperature' => 'Frigid',
            'icon' => '🌨️',
            'description' => 'Heavy snow with strong winds',
            'effects' => ['Extreme cold', 'Near zero visibility', 'Dangerous travel', 'Risk of exposure']
        ],
        [
            'condition' => 'Fog',
            'temperature' => 'Cool',
            'icon' => '🌫️',
            'description' => 'Dense fog limiting visibility',
            'effects' => ['Heavily obscured area', 'Muffled sounds', 'Easy to get lost', 'Advantage on Stealth']
        ],
        [
            'condition' => 'Windy',
            'temperature' => 'Cool',
            'icon' => '💨',
            'description' => 'Strong winds',
            'effects' => ['Difficult flight', 'Ranged attacks at disadvantage', 'Loud wind masks sounds']
        ]
    ];

    /**
     * Fantasy calendar months.
     */
    const MONTHS = [
        'Midwinter', 'Late Winter', 'The Claw of Winter', 'The Claw of the Sunsets',
        'The Melting', 'The Time of Flowers', 'Flamerule', 'Eleasis',
        'Eleint', 'Marpenoth', 'Uktar', 'The Rotting'
    ];

    /**
     * Seasons mapping to months.
     */
    const SEASONS = [
        'Winter' => [0, 1, 2],
        'Spring' => [3, 4, 5],
        'Summer' => [6, 7, 8],
        'Autumn' => [9, 10, 11]
    ];

    /**
     * Get the user that owns the weather system.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the campaign that owns the weather system.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Generate weather based on current season.
     */
    public function generateWeather(): array
    {
        $currentDate = $this->current_date ?? $this->getDefaultDate();
        $season = $this->getSeason($currentDate['month']);
        
        $availableWeather = $this->getSeasonalWeather($season);
        $weather = $availableWeather[array_rand($availableWeather)];
        
        // Store in weather history
        $history = $this->weather_history ?? [];
        $history[] = [
            'date' => $currentDate,
            'weather' => $weather,
            'generated_at' => now()->toISOString()
        ];
        
        // Keep only last 30 days of history
        if (count($history) > 30) {
            $history = array_slice($history, -30);
        }
        
        $this->current_weather = $weather;
        $this->weather_history = $history;
        
        return $weather;
    }

    /**
     * Get seasonal weather conditions.
     */
    private function getSeasonalWeather(string $season): array
    {
        $allWeather = self::WEATHER_CONDITIONS;
        
        switch ($season) {
            case 'Winter':
                return array_filter($allWeather, function($w) {
                    return in_array($w['condition'], ['Clear', 'Overcast', 'Snow', 'Blizzard', 'Fog']);
                });
            case 'Summer':
                return array_filter($allWeather, function($w) {
                    return in_array($w['condition'], ['Clear', 'Partly Cloudy', 'Thunderstorm', 'Windy', 'Light Rain']);
                });
            case 'Spring':
            case 'Autumn':
                return array_filter($allWeather, function($w) {
                    return !in_array($w['condition'], ['Blizzard', 'Snow']);
                });
            default:
                return $allWeather;
        }
    }

    /**
     * Get season from month index.
     */
    public function getSeason(int $month): string
    {
        foreach (self::SEASONS as $season => $months) {
            if (in_array($month, $months)) {
                return $season;
            }
        }
        return 'Spring';
    }

    /**
     * Advance the calendar by one day.
     */
    public function advanceDay(): array
    {
        $currentDate = $this->current_date ?? $this->getDefaultDate();
        
        $newDay = $currentDate['day'] + 1;
        $newMonth = $currentDate['month'];
        $newYear = $currentDate['year'];

        // Assuming 30 days per month for fantasy calendar
        if ($newDay > 30) {
            $newDay = 1;
            $newMonth += 1;
            if ($newMonth > 11) {
                $newMonth = 0;
                $newYear += 1;
            }
        }

        $newDate = [
            'day' => $newDay,
            'month' => $newMonth,
            'year' => $newYear,
            'season' => $this->getSeason($newMonth)
        ];

        $this->current_date = $newDate;
        
        // Generate new weather for the new day
        $this->generateWeather();
        
        return $newDate;
    }

    /**
     * Add calendar event.
     */
    public function addCalendarEvent(array $eventData): string
    {
        $events = $this->calendar_events ?? [];
        $eventId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $event = [
            'id' => $eventId,
            'name' => $eventData['name'],
            'date' => $eventData['date'],
            'description' => $eventData['description'] ?? '',
            'type' => $eventData['type'] ?? 'event',
            'created_at' => now()->toISOString()
        ];
        
        $events[] = $event;
        $this->calendar_events = $events;
        
        return $eventId;
    }

    /**
     * Update calendar event.
     */
    public function updateCalendarEvent(string $eventId, array $updates): bool
    {
        $events = $this->calendar_events ?? [];
        
        foreach ($events as $index => $event) {
            if ($event['id'] === $eventId) {
                $events[$index] = array_merge($event, $updates);
                $this->calendar_events = $events;
                return true;
            }
        }
        
        return false;
    }

    /**
     * Remove calendar event.
     */
    public function removeCalendarEvent(string $eventId): bool
    {
        $events = $this->calendar_events ?? [];
        $originalCount = count($events);
        
        $this->calendar_events = array_values(array_filter($events, function($event) use ($eventId) {
            return $event['id'] !== $eventId;
        }));
        
        return count($this->calendar_events) < $originalCount;
    }

    /**
     * Get events for a specific date.
     */
    public function getEventsForDate(array $date): array
    {
        $events = $this->calendar_events ?? [];
        
        return array_filter($events, function($event) use ($date) {
            return $event['date']['day'] === $date['day'] &&
                   $event['date']['month'] === $date['month'] &&
                   $event['date']['year'] === $date['year'];
        });
    }

    /**
     * Get upcoming events.
     */
    public function getUpcomingEvents(int $days = 30): array
    {
        $events = $this->calendar_events ?? [];
        $currentDate = $this->current_date ?? $this->getDefaultDate();
        $upcomingEvents = [];
        
        foreach ($events as $event) {
            $eventDate = $event['date'];
            $daysDiff = $this->calculateDaysDifference($currentDate, $eventDate);
            
            if ($daysDiff >= 0 && $daysDiff <= $days) {
                $event['days_until'] = $daysDiff;
                $upcomingEvents[] = $event;
            }
        }
        
        // Sort by days until event
        usort($upcomingEvents, function($a, $b) {
            return $a['days_until'] <=> $b['days_until'];
        });
        
        return $upcomingEvents;
    }

    /**
     * Calculate days difference between two dates.
     */
    private function calculateDaysDifference(array $date1, array $date2): int
    {
        $days1 = $date1['year'] * 360 + $date1['month'] * 30 + $date1['day'];
        $days2 = $date2['year'] * 360 + $date2['month'] * 30 + $date2['day'];
        
        return $days2 - $days1;
    }

    /**
     * Get default starting date.
     */
    private function getDefaultDate(): array
    {
        return [
            'day' => 1,
            'month' => 0,
            'year' => 1492,
            'season' => 'Winter'
        ];
    }

    /**
     * Set custom date.
     */
    public function setDate(int $day, int $month, int $year): void
    {
        $this->current_date = [
            'day' => max(1, min(30, $day)),
            'month' => max(0, min(11, $month)),
            'year' => max(1, $year),
            'season' => $this->getSeason($month)
        ];
    }

    /**
     * Get weather statistics.
     */
    public function getWeatherStatistics(): array
    {
        $history = $this->weather_history ?? [];
        $stats = [];
        
        foreach ($history as $entry) {
            $condition = $entry['weather']['condition'];
            $stats[$condition] = ($stats[$condition] ?? 0) + 1;
        }
        
        return [
            'total_days' => count($history),
            'conditions' => $stats,
            'most_common' => count($stats) > 0 ? array_keys($stats, max($stats))[0] : null
        ];
    }
}