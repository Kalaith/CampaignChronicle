<?php

namespace App\Services;

use App\Models\Campaign;

class ExportService
{
    public static function exportCampaign(string $campaignId, array $options = []): array
    {
        $campaign = Campaign::with([
            'characters',
            'locations',
            'items',
            'notes',
            'relationships',
            'timelineEvents'
        ])->find($campaignId);

        if (!$campaign) {
            throw new \Exception('Campaign not found');
        }

        $exportData = [
            'meta' => [
                'exported_at' => now()->toISOString(),
                'version' => '1.0.0',
                'exporter' => 'Campaign Chronicle Backend',
                'campaign_id' => $campaignId,
                'campaign_name' => $campaign->name,
            ],
            'campaign' => $campaign->only(['id', 'name', 'description', 'created_at', 'updated_at']),
        ];

        // Export entities based on options
        if (!isset($options['entities']) || in_array('characters', $options['entities'])) {
            $exportData['characters'] = self::exportCharacters($campaign);
        }

        if (!isset($options['entities']) || in_array('locations', $options['entities'])) {
            $exportData['locations'] = self::exportLocations($campaign);
        }

        if (!isset($options['entities']) || in_array('items', $options['entities'])) {
            $exportData['items'] = self::exportItems($campaign);
        }

        if (!isset($options['entities']) || in_array('notes', $options['entities'])) {
            $exportData['notes'] = self::exportNotes($campaign);
        }

        if (!isset($options['entities']) || in_array('relationships', $options['entities'])) {
            $exportData['relationships'] = self::exportRelationships($campaign);
        }

        if (!isset($options['entities']) || in_array('timeline_events', $options['entities'])) {
            $exportData['timeline_events'] = self::exportTimelineEvents($campaign);
        }

        // Add statistics if requested
        if (isset($options['include_stats']) && $options['include_stats']) {
            $exportData['statistics'] = [
                'total_characters' => $campaign->characters->count(),
                'total_locations' => $campaign->locations->count(),
                'total_items' => $campaign->items->count(),
                'total_notes' => $campaign->notes->count(),
                'total_relationships' => $campaign->relationships->count(),
                'total_timeline_events' => $campaign->timelineEvents->count(),
                'character_breakdown' => $campaign->getCharacterTypeBreakdown(),
                'location_breakdown' => $campaign->getLocationTypeBreakdown(),
                'item_breakdown' => $campaign->getItemTypeBreakdown(),
            ];
        }

        return $exportData;
    }

    private static function exportCharacters(Campaign $campaign): array
    {
        return $campaign->characters->map(function ($character) {
            return [
                'id' => $character->id,
                'name' => $character->name,
                'description' => $character->description,
                'type' => $character->type,
                'race' => $character->race,
                'class' => $character->class,
                'level' => $character->level,
                'hp' => $character->hp,
                'ac' => $character->ac,
                'status' => $character->status,
                'location' => $character->location,
                'tags' => $character->tags,
                'created_at' => $character->created_at,
                'updated_at' => $character->updated_at,
            ];
        })->toArray();
    }

    private static function exportLocations(Campaign $campaign): array
    {
        return $campaign->locations->map(function ($location) {
            return [
                'id' => $location->id,
                'name' => $location->name,
                'description' => $location->description,
                'type' => $location->type,
                'parent_location' => $location->parent_location,
                'tags' => $location->tags,
                'created_at' => $location->created_at,
                'updated_at' => $location->updated_at,
            ];
        })->toArray();
    }

    private static function exportItems(Campaign $campaign): array
    {
        return $campaign->items->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'description' => $item->description,
                'type' => $item->type,
                'quantity' => $item->quantity,
                'value' => $item->value,
                'weight' => $item->weight,
                'rarity' => $item->rarity,
                'properties' => $item->properties,
                'owner' => $item->owner,
                'location' => $item->location,
                'tags' => $item->tags,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
            ];
        })->toArray();
    }

    private static function exportNotes(Campaign $campaign): array
    {
        return $campaign->notes->map(function ($note) {
            return [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $note->content,
                'word_count' => $note->word_count,
                'tags' => $note->tags,
                'created_at' => $note->created_at,
                'updated_at' => $note->updated_at,
            ];
        })->toArray();
    }

    private static function exportRelationships(Campaign $campaign): array
    {
        return $campaign->relationships->map(function ($relationship) {
            return [
                'id' => $relationship->id,
                'from_character' => $relationship->from_character,
                'to_character' => $relationship->to_character,
                'type' => $relationship->type,
                'description' => $relationship->description,
                'created_at' => $relationship->created_at,
                'updated_at' => $relationship->updated_at,
            ];
        })->toArray();
    }

    private static function exportTimelineEvents(Campaign $campaign): array
    {
        return $campaign->timelineEvents->map(function ($event) {
            return [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'date' => $event->date,
                'session_number' => $event->session_number,
                'type' => $event->type,
                'tags' => $event->tags,
                'related_characters' => $event->related_characters,
                'related_locations' => $event->related_locations,
                'created_at' => $event->created_at,
                'updated_at' => $event->updated_at,
            ];
        })->toArray();
    }

    public static function exportToCSV(string $campaignId, string $entityType): string
    {
        $campaign = Campaign::find($campaignId);
        
        if (!$campaign) {
            throw new \Exception('Campaign not found');
        }

        switch ($entityType) {
            case 'characters':
                return self::charactersToCSV($campaign);
            case 'locations':
                return self::locationsToCSV($campaign);
            case 'items':
                return self::itemsToCSV($campaign);
            case 'notes':
                return self::notesToCSV($campaign);
            case 'relationships':
                return self::relationshipsToCSV($campaign);
            case 'timeline_events':
                return self::timelineEventsToCSV($campaign);
            default:
                throw new \Exception('Invalid entity type for CSV export');
        }
    }

    private static function charactersToCSV(Campaign $campaign): string
    {
        $characters = $campaign->characters;
        $headers = ['ID', 'Name', 'Type', 'Race', 'Class', 'Level', 'HP', 'AC', 'Status', 'Description', 'Tags', 'Created At'];
        
        $csv = implode(',', $headers) . "\n";
        
        foreach ($characters as $character) {
            $row = [
                $character->id,
                '"' . str_replace('"', '""', $character->name) . '"',
                $character->type,
                $character->race ?: '',
                $character->class ?: '',
                $character->level ?: '',
                $character->hp ?: '',
                $character->ac ?: '',
                $character->status ?: '',
                '"' . str_replace('"', '""', $character->description ?: '') . '"',
                '"' . implode(', ', $character->tags ?: []) . '"',
                $character->created_at->format('Y-m-d H:i:s'),
            ];
            $csv .= implode(',', $row) . "\n";
        }
        
        return $csv;
    }

    private static function locationsToCSV(Campaign $campaign): string
    {
        $locations = $campaign->locations;
        $headers = ['ID', 'Name', 'Type', 'Parent Location', 'Description', 'Tags', 'Created At'];
        
        $csv = implode(',', $headers) . "\n";
        
        foreach ($locations as $location) {
            $row = [
                $location->id,
                '"' . str_replace('"', '""', $location->name) . '"',
                $location->type,
                $location->parent_location ?: '',
                '"' . str_replace('"', '""', $location->description ?: '') . '"',
                '"' . implode(', ', $location->tags ?: []) . '"',
                $location->created_at->format('Y-m-d H:i:s'),
            ];
            $csv .= implode(',', $row) . "\n";
        }
        
        return $csv;
    }

    private static function itemsToCSV(Campaign $campaign): string
    {
        $items = $campaign->items()->with(['ownerCharacter', 'locationEntity'])->get();
        $headers = ['ID', 'Name', 'Type', 'Quantity', 'Value', 'Weight', 'Rarity', 'Owner', 'Location', 'Description', 'Tags', 'Created At'];
        
        $csv = implode(',', $headers) . "\n";
        
        foreach ($items as $item) {
            $row = [
                $item->id,
                '"' . str_replace('"', '""', $item->name) . '"',
                $item->type,
                $item->quantity ?: '',
                $item->value ?: '',
                $item->weight ?: '',
                $item->rarity ?: '',
                $item->ownerCharacter ? '"' . str_replace('"', '""', $item->ownerCharacter->name) . '"' : '',
                $item->locationEntity ? '"' . str_replace('"', '""', $item->locationEntity->name) . '"' : '',
                '"' . str_replace('"', '""', $item->description ?: '') . '"',
                '"' . implode(', ', $item->tags ?: []) . '"',
                $item->created_at->format('Y-m-d H:i:s'),
            ];
            $csv .= implode(',', $row) . "\n";
        }
        
        return $csv;
    }

    private static function notesToCSV(Campaign $campaign): string
    {
        $notes = $campaign->notes;
        $headers = ['ID', 'Title', 'Content', 'Word Count', 'Tags', 'Created At'];
        
        $csv = implode(',', $headers) . "\n";
        
        foreach ($notes as $note) {
            $row = [
                $note->id,
                '"' . str_replace('"', '""', $note->title) . '"',
                '"' . str_replace('"', '""', $note->content) . '"',
                $note->word_count,
                '"' . implode(', ', $note->tags ?: []) . '"',
                $note->created_at->format('Y-m-d H:i:s'),
            ];
            $csv .= implode(',', $row) . "\n";
        }
        
        return $csv;
    }

    private static function relationshipsToCSV(Campaign $campaign): string
    {
        $relationships = $campaign->relationships()->with(['fromCharacter', 'toCharacter'])->get();
        $headers = ['ID', 'From Character', 'To Character', 'Type', 'Description', 'Created At'];
        
        $csv = implode(',', $headers) . "\n";
        
        foreach ($relationships as $relationship) {
            $row = [
                $relationship->id,
                '"' . str_replace('"', '""', $relationship->fromCharacter->name) . '"',
                '"' . str_replace('"', '""', $relationship->toCharacter->name) . '"',
                $relationship->type,
                '"' . str_replace('"', '""', $relationship->description ?: '') . '"',
                $relationship->created_at->format('Y-m-d H:i:s'),
            ];
            $csv .= implode(',', $row) . "\n";
        }
        
        return $csv;
    }

    private static function timelineEventsToCSV(Campaign $campaign): string
    {
        $events = $campaign->timelineEvents;
        $headers = ['ID', 'Title', 'Description', 'Date', 'Session Number', 'Type', 'Related Characters', 'Related Locations', 'Tags', 'Created At'];
        
        $csv = implode(',', $headers) . "\n";
        
        foreach ($events as $event) {
            $row = [
                $event->id,
                '"' . str_replace('"', '""', $event->title) . '"',
                '"' . str_replace('"', '""', $event->description ?: '') . '"',
                $event->date ?: '',
                $event->session_number ?: '',
                $event->type ?: '',
                '"' . implode(', ', $event->related_characters ?: []) . '"',
                '"' . implode(', ', $event->related_locations ?: []) . '"',
                '"' . implode(', ', $event->tags ?: []) . '"',
                $event->created_at->format('Y-m-d H:i:s'),
            ];
            $csv .= implode(',', $row) . "\n";
        }
        
        return $csv;
    }

    public static function getExportFormats(): array
    {
        return [
            'json' => 'JSON (complete data)',
            'csv_characters' => 'CSV - Characters',
            'csv_locations' => 'CSV - Locations',
            'csv_items' => 'CSV - Items',
            'csv_notes' => 'CSV - Notes',
            'csv_relationships' => 'CSV - Relationships',
            'csv_timeline_events' => 'CSV - Timeline Events',
        ];
    }

    public static function validateImportData(array $data): array
    {
        $errors = [];
        $requiredKeys = ['campaign', 'characters', 'locations', 'items', 'notes', 'relationships', 'timeline_events'];

        foreach ($requiredKeys as $key) {
            if (!isset($data[$key])) {
                $errors[] = "Missing required import section: {$key}";
            }
        }

        if (!isset($data['meta']) || !isset($data['meta']['version'])) {
            $errors[] = "Missing version information in import data";
        }

        if (isset($data['campaign'])) {
            if (empty($data['campaign']['name'])) {
                $errors[] = "Campaign name is required in import data";
            }
        }

        return $errors;
    }
}