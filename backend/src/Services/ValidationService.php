<?php

namespace App\Services;

class ValidationService
{
    public static function validateCampaign(array $data): array
    {
        $errors = [];

        if (empty($data['name'])) {
            $errors['name'] = 'Campaign name is required';
        } elseif (strlen($data['name']) > 255) {
            $errors['name'] = 'Campaign name cannot exceed 255 characters';
        }

        if (isset($data['description']) && strlen($data['description']) > 10000) {
            $errors['description'] = 'Campaign description cannot exceed 10,000 characters';
        }

        return $errors;
    }

    public static function validateCharacter(array $data): array
    {
        $errors = [];

        if (empty($data['name'])) {
            $errors['name'] = 'Character name is required';
        } elseif (strlen($data['name']) > 255) {
            $errors['name'] = 'Character name cannot exceed 255 characters';
        }

        if (empty($data['type'])) {
            $errors['type'] = 'Character type is required';
        } elseif (!in_array($data['type'], ['PC', 'NPC', 'antagonist', 'ally', 'neutral'])) {
            $errors['type'] = 'Invalid character type';
        }

        if (isset($data['description']) && strlen($data['description']) > 10000) {
            $errors['description'] = 'Character description cannot exceed 10,000 characters';
        }

        if (isset($data['race']) && strlen($data['race']) > 100) {
            $errors['race'] = 'Race cannot exceed 100 characters';
        }

        if (isset($data['class']) && strlen($data['class']) > 100) {
            $errors['class'] = 'Class cannot exceed 100 characters';
        }

        if (isset($data['level']) && (!is_numeric($data['level']) || $data['level'] < 0 || $data['level'] > 100)) {
            $errors['level'] = 'Level must be a number between 0 and 100';
        }

        return $errors;
    }

    public static function validateLocation(array $data): array
    {
        $errors = [];

        if (empty($data['name'])) {
            $errors['name'] = 'Location name is required';
        } elseif (strlen($data['name']) > 255) {
            $errors['name'] = 'Location name cannot exceed 255 characters';
        }

        if (empty($data['type'])) {
            $errors['type'] = 'Location type is required';
        } elseif (!in_array($data['type'], ['city', 'town', 'village', 'dungeon', 'wilderness', 'building', 'room', 'region', 'plane', 'other'])) {
            $errors['type'] = 'Invalid location type';
        }

        if (isset($data['description']) && strlen($data['description']) > 10000) {
            $errors['description'] = 'Location description cannot exceed 10,000 characters';
        }

        return $errors;
    }

    public static function validateItem(array $data): array
    {
        $errors = [];

        if (empty($data['name'])) {
            $errors['name'] = 'Item name is required';
        } elseif (strlen($data['name']) > 255) {
            $errors['name'] = 'Item name cannot exceed 255 characters';
        }

        if (empty($data['type'])) {
            $errors['type'] = 'Item type is required';
        } elseif (!in_array($data['type'], ['weapon', 'armor', 'tool', 'treasure', 'consumable', 'quest', 'misc'])) {
            $errors['type'] = 'Invalid item type';
        }

        if (isset($data['description']) && strlen($data['description']) > 10000) {
            $errors['description'] = 'Item description cannot exceed 10,000 characters';
        }

        if (isset($data['quantity']) && (!is_numeric($data['quantity']) || $data['quantity'] < 0)) {
            $errors['quantity'] = 'Quantity must be a positive number';
        }

        if (isset($data['value']) && (!is_numeric($data['value']) || $data['value'] < 0)) {
            $errors['value'] = 'Value must be a positive number';
        }

        return $errors;
    }

    public static function validateNote(array $data): array
    {
        $errors = [];

        if (empty($data['title'])) {
            $errors['title'] = 'Note title is required';
        } elseif (strlen($data['title']) > 255) {
            $errors['title'] = 'Note title cannot exceed 255 characters';
        }

        if (empty($data['content'])) {
            $errors['content'] = 'Note content is required';
        } elseif (strlen($data['content']) > 50000) {
            $errors['content'] = 'Note content cannot exceed 50,000 characters';
        }

        return $errors;
    }

    public static function validateRelationship(array $data): array
    {
        $errors = [];

        if (empty($data['from_character'])) {
            $errors['from_character'] = 'Source character is required';
        }

        if (empty($data['to_character'])) {
            $errors['to_character'] = 'Target character is required';
        }

        if (isset($data['from_character']) && isset($data['to_character']) && $data['from_character'] === $data['to_character']) {
            $errors['characters'] = 'Characters cannot have relationships with themselves';
        }

        if (empty($data['type'])) {
            $errors['type'] = 'Relationship type is required';
        } elseif (!in_array($data['type'], ['ally', 'enemy', 'friend', 'family', 'romantic', 'mentor', 'rival', 'acquaintance', 'other'])) {
            $errors['type'] = 'Invalid relationship type';
        }

        if (isset($data['description']) && strlen($data['description']) > 1000) {
            $errors['description'] = 'Relationship description cannot exceed 1,000 characters';
        }

        return $errors;
    }

    public static function validateTimelineEvent(array $data): array
    {
        $errors = [];

        if (empty($data['title'])) {
            $errors['title'] = 'Event title is required';
        } elseif (strlen($data['title']) > 255) {
            $errors['title'] = 'Event title cannot exceed 255 characters';
        }

        if (isset($data['description']) && strlen($data['description']) > 10000) {
            $errors['description'] = 'Event description cannot exceed 10,000 characters';
        }

        if (isset($data['session_number']) && (!is_numeric($data['session_number']) || $data['session_number'] < 0)) {
            $errors['session_number'] = 'Session number must be a positive number';
        }

        if (isset($data['type']) && !in_array($data['type'], ['combat', 'roleplay', 'exploration', 'puzzle', 'social', 'travel', 'rest', 'story', 'other'])) {
            $errors['type'] = 'Invalid event type';
        }

        if (isset($data['related_characters']) && !is_array($data['related_characters'])) {
            $errors['related_characters'] = 'Related characters must be an array';
        }

        if (isset($data['related_locations']) && !is_array($data['related_locations'])) {
            $errors['related_locations'] = 'Related locations must be an array';
        }

        return $errors;
    }

    public static function sanitizeInput(array $data): array
    {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = trim(htmlspecialchars($value, ENT_QUOTES, 'UTF-8'));
            } elseif (is_array($value)) {
                $sanitized[$key] = array_map(function($item) {
                    return is_string($item) ? trim(htmlspecialchars($item, ENT_QUOTES, 'UTF-8')) : $item;
                }, $value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }

    public static function validateUUID(string $uuid): bool
    {
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';
        return preg_match($pattern, $uuid) === 1;
    }

    public static function validateTags(array $tags): array
    {
        $errors = [];
        
        if (count($tags) > 20) {
            $errors['tags'] = 'Maximum 20 tags allowed';
        }
        
        foreach ($tags as $index => $tag) {
            if (!is_string($tag)) {
                $errors['tags'] = 'All tags must be strings';
                break;
            }
            
            if (strlen($tag) > 50) {
                $errors['tags'] = 'Each tag cannot exceed 50 characters';
                break;
            }
        }
        
        return $errors;
    }
}