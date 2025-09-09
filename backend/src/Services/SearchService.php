<?php

namespace App\Services;

use App\Models\Campaign;
use App\Models\Character;
use App\Models\Location;
use App\Models\Item;
use App\Models\Note;
use App\Models\Relationship;
use App\Models\TimelineEvent;

class SearchService
{
    public static function globalSearch(string $campaignId, string $query, array $types = null): array
    {
        $results = [];
        $searchTypes = $types ?? ['characters', 'locations', 'items', 'notes', 'timeline_events'];

        if (in_array('characters', $searchTypes)) {
            $results['characters'] = self::searchCharacters($campaignId, $query);
        }

        if (in_array('locations', $searchTypes)) {
            $results['locations'] = self::searchLocations($campaignId, $query);
        }

        if (in_array('items', $searchTypes)) {
            $results['items'] = self::searchItems($campaignId, $query);
        }

        if (in_array('notes', $searchTypes)) {
            $results['notes'] = self::searchNotes($campaignId, $query);
        }

        if (in_array('timeline_events', $searchTypes)) {
            $results['timeline_events'] = self::searchTimelineEvents($campaignId, $query);
        }

        if (in_array('relationships', $searchTypes)) {
            $results['relationships'] = self::searchRelationships($campaignId, $query);
        }

        return $results;
    }

    public static function searchCharacters(string $campaignId, string $query): array
    {
        return Character::where('campaign_id', $campaignId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%")
                  ->orWhere('race', 'LIKE', "%{$query}%")
                  ->orWhere('class', 'LIKE', "%{$query}%");
            })
            ->limit(10)
            ->get()
            ->map(function ($character) {
                return [
                    'id' => $character->id,
                    'type' => 'character',
                    'name' => $character->name,
                    'description' => $character->description,
                    'meta' => [
                        'race' => $character->race,
                        'class' => $character->class,
                        'level' => $character->level,
                        'character_type' => $character->type,
                    ],
                ];
            })
            ->toArray();
    }

    public static function searchLocations(string $campaignId, string $query): array
    {
        return Location::where('campaign_id', $campaignId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
            })
            ->limit(10)
            ->get()
            ->map(function ($location) {
                return [
                    'id' => $location->id,
                    'type' => 'location',
                    'name' => $location->name,
                    'description' => $location->description,
                    'meta' => [
                        'location_type' => $location->type,
                        'parent_location' => $location->parent_location,
                    ],
                ];
            })
            ->toArray();
    }

    public static function searchItems(string $campaignId, string $query): array
    {
        return Item::where('campaign_id', $campaignId)
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
            })
            ->with(['ownerCharacter', 'locationEntity'])
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'item',
                    'name' => $item->name,
                    'description' => $item->description,
                    'meta' => [
                        'item_type' => $item->type,
                        'value' => $item->value,
                        'quantity' => $item->quantity,
                        'owner' => $item->ownerCharacter ? $item->ownerCharacter->name : null,
                        'location' => $item->locationEntity ? $item->locationEntity->name : null,
                    ],
                ];
            })
            ->toArray();
    }

    public static function searchNotes(string $campaignId, string $query): array
    {
        return Note::where('campaign_id', $campaignId)
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('content', 'LIKE', "%{$query}%");
            })
            ->limit(10)
            ->get()
            ->map(function ($note) {
                return [
                    'id' => $note->id,
                    'type' => 'note',
                    'name' => $note->title,
                    'description' => substr($note->content, 0, 200) . (strlen($note->content) > 200 ? '...' : ''),
                    'meta' => [
                        'word_count' => $note->word_count,
                        'created_at' => $note->created_at->format('Y-m-d H:i:s'),
                    ],
                ];
            })
            ->toArray();
    }

    public static function searchTimelineEvents(string $campaignId, string $query): array
    {
        return TimelineEvent::where('campaign_id', $campaignId)
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%");
            })
            ->limit(10)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'type' => 'timeline_event',
                    'name' => $event->title,
                    'description' => $event->description,
                    'meta' => [
                        'event_type' => $event->type,
                        'session_number' => $event->session_number,
                        'date' => $event->date,
                        'related_characters_count' => count($event->related_characters ?? []),
                        'related_locations_count' => count($event->related_locations ?? []),
                    ],
                ];
            })
            ->toArray();
    }

    public static function searchRelationships(string $campaignId, string $query): array
    {
        return Relationship::where('campaign_id', $campaignId)
            ->where('description', 'LIKE', "%{$query}%")
            ->with(['fromCharacter', 'toCharacter'])
            ->limit(10)
            ->get()
            ->map(function ($relationship) {
                return [
                    'id' => $relationship->id,
                    'type' => 'relationship',
                    'name' => "{$relationship->fromCharacter->name} -> {$relationship->toCharacter->name}",
                    'description' => $relationship->description,
                    'meta' => [
                        'relationship_type' => $relationship->type,
                        'from_character' => $relationship->fromCharacter->name,
                        'to_character' => $relationship->toCharacter->name,
                    ],
                ];
            })
            ->toArray();
    }

    public static function advancedSearch(string $campaignId, array $criteria): array
    {
        $results = [];

        // Name-based search across all entities
        if (!empty($criteria['name'])) {
            $results['by_name'] = self::searchByName($campaignId, $criteria['name']);
        }

        // Tag-based search
        if (!empty($criteria['tags'])) {
            $results['by_tags'] = self::searchByTags($campaignId, $criteria['tags']);
        }

        // Type-specific searches
        if (!empty($criteria['character_type'])) {
            $results['by_character_type'] = self::searchCharactersByType($campaignId, $criteria['character_type']);
        }

        if (!empty($criteria['location_type'])) {
            $results['by_location_type'] = self::searchLocationsByType($campaignId, $criteria['location_type']);
        }

        if (!empty($criteria['item_type'])) {
            $results['by_item_type'] = self::searchItemsByType($campaignId, $criteria['item_type']);
        }

        // Relationship searches
        if (!empty($criteria['relationship_type'])) {
            $results['by_relationship_type'] = self::searchRelationshipsByType($campaignId, $criteria['relationship_type']);
        }

        // Timeline searches
        if (!empty($criteria['session_number'])) {
            $results['by_session'] = self::searchTimelineBySession($campaignId, (int)$criteria['session_number']);
        }

        if (!empty($criteria['event_type'])) {
            $results['by_event_type'] = self::searchTimelineByEventType($campaignId, $criteria['event_type']);
        }

        // Date range search for timeline events
        if (!empty($criteria['date_from']) || !empty($criteria['date_to'])) {
            $results['by_date_range'] = self::searchTimelineByDateRange(
                $campaignId,
                $criteria['date_from'] ?? null,
                $criteria['date_to'] ?? null
            );
        }

        return $results;
    }

    private static function searchByName(string $campaignId, string $name): array
    {
        return self::globalSearch($campaignId, $name);
    }

    private static function searchByTags(string $campaignId, array $tags): array
    {
        $results = [];

        foreach ($tags as $tag) {
            $characters = Character::where('campaign_id', $campaignId)
                ->whereJsonContains('tags', $tag)
                ->get();

            $locations = Location::where('campaign_id', $campaignId)
                ->whereJsonContains('tags', $tag)
                ->get();

            $items = Item::where('campaign_id', $campaignId)
                ->whereJsonContains('tags', $tag)
                ->get();

            $notes = Note::where('campaign_id', $campaignId)
                ->whereJsonContains('tags', $tag)
                ->get();

            $events = TimelineEvent::where('campaign_id', $campaignId)
                ->whereJsonContains('tags', $tag)
                ->get();

            $results[$tag] = [
                'characters' => $characters->count(),
                'locations' => $locations->count(),
                'items' => $items->count(),
                'notes' => $notes->count(),
                'timeline_events' => $events->count(),
            ];
        }

        return $results;
    }

    private static function searchCharactersByType(string $campaignId, string $type): array
    {
        return Character::where('campaign_id', $campaignId)
            ->where('type', $type)
            ->get()
            ->map(function ($character) {
                return [
                    'id' => $character->id,
                    'name' => $character->name,
                    'type' => $character->type,
                    'race' => $character->race,
                    'class' => $character->class,
                ];
            })
            ->toArray();
    }

    private static function searchLocationsByType(string $campaignId, string $type): array
    {
        return Location::where('campaign_id', $campaignId)
            ->where('type', $type)
            ->get()
            ->map(function ($location) {
                return [
                    'id' => $location->id,
                    'name' => $location->name,
                    'type' => $location->type,
                    'description' => substr($location->description ?? '', 0, 100),
                ];
            })
            ->toArray();
    }

    private static function searchItemsByType(string $campaignId, string $type): array
    {
        return Item::where('campaign_id', $campaignId)
            ->where('type', $type)
            ->with(['ownerCharacter', 'locationEntity'])
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'type' => $item->type,
                    'value' => $item->value,
                    'owner' => $item->ownerCharacter->name ?? null,
                    'location' => $item->locationEntity->name ?? null,
                ];
            })
            ->toArray();
    }

    private static function searchRelationshipsByType(string $campaignId, string $type): array
    {
        return Relationship::where('campaign_id', $campaignId)
            ->where('type', $type)
            ->with(['fromCharacter', 'toCharacter'])
            ->get()
            ->map(function ($rel) {
                return [
                    'id' => $rel->id,
                    'type' => $rel->type,
                    'from_character' => $rel->fromCharacter->name,
                    'to_character' => $rel->toCharacter->name,
                    'description' => $rel->description,
                ];
            })
            ->toArray();
    }

    private static function searchTimelineBySession(string $campaignId, int $sessionNumber): array
    {
        return TimelineEvent::where('campaign_id', $campaignId)
            ->where('session_number', $sessionNumber)
            ->chronological()
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'type' => $event->type,
                    'session_number' => $event->session_number,
                    'date' => $event->date,
                ];
            })
            ->toArray();
    }

    private static function searchTimelineByEventType(string $campaignId, string $eventType): array
    {
        return TimelineEvent::where('campaign_id', $campaignId)
            ->where('type', $eventType)
            ->chronological()
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'type' => $event->type,
                    'session_number' => $event->session_number,
                    'date' => $event->date,
                ];
            })
            ->toArray();
    }

    private static function searchTimelineByDateRange(string $campaignId, ?string $dateFrom, ?string $dateTo): array
    {
        $query = TimelineEvent::where('campaign_id', $campaignId);

        if ($dateFrom) {
            $query->where('date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('date', '<=', $dateTo);
        }

        return $query->chronological()
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'type' => $event->type,
                    'session_number' => $event->session_number,
                    'date' => $event->date,
                ];
            })
            ->toArray();
    }

    public static function getSearchSuggestions(string $campaignId, string $partial): array
    {
        $suggestions = [];

        // Character name suggestions
        $characters = Character::where('campaign_id', $campaignId)
            ->where('name', 'LIKE', "{$partial}%")
            ->limit(5)
            ->pluck('name')
            ->toArray();

        // Location name suggestions
        $locations = Location::where('campaign_id', $campaignId)
            ->where('name', 'LIKE', "{$partial}%")
            ->limit(5)
            ->pluck('name')
            ->toArray();

        // Item name suggestions
        $items = Item::where('campaign_id', $campaignId)
            ->where('name', 'LIKE', "{$partial}%")
            ->limit(5)
            ->pluck('name')
            ->toArray();

        $suggestions = array_merge($characters, $locations, $items);
        $suggestions = array_unique($suggestions);
        sort($suggestions);

        return array_slice($suggestions, 0, 10);
    }
}