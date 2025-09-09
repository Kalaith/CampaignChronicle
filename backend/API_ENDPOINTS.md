# Campaign Chronicle API Documentation

## Overview
RESTful API for Campaign Chronicle - a D&D campaign management system built with PHP 8.1+ and Slim 4 framework.

## Base URL
- Development: `http://localhost:8000/api`
- Production: `https://your-domain.com/api`

## Authentication
Currently no authentication required (can be added in future phases).

## Response Format
All responses follow this JSON structure:
```json
{
  "success": true|false,
  "message": "Status message",
  "data": {...}
}
```

## Campaign Endpoints

### GET /campaigns
List all campaigns with pagination and filtering.

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `per_page` (int): Items per page (default: 20, max: 100)
- `search` (string): Search term
- `sort` (string): Sort field (default: created_at)
- `order` (string): asc|desc (default: desc)

### POST /campaigns
Create a new campaign.

**Request Body:**
```json
{
  "name": "Campaign Name",
  "description": "Optional description"
}
```

### GET /campaigns/{id}
Get campaign details.

**Query Parameters:**
- `include_stats` (flag): Include statistics
- `include_entities` (flag): Include all related entities

### PUT /campaigns/{id}
Update campaign.

### DELETE /campaigns/{id}
Delete campaign.

### GET /campaigns/{id}/export
Export campaign data.

**Query Parameters:**
- `entities` (string): Comma-separated list (characters,locations,items,notes,relationships,timeline_events)
- `include_stats` (flag): Include statistics

### GET /campaigns/{id}/export/csv/{entity_type}
Export specific entity type as CSV.

**Entity Types:** characters, locations, items, notes, relationships, timeline_events

### GET /campaigns/{id}/analytics
Get campaign analytics and statistics.

### GET /campaigns/{id}/search
Search across all campaign entities.

**Query Parameters:**
- `q` (string): Search query (required)
- `types` (string): Comma-separated entity types to search

### GET /campaigns/{id}/search/suggestions
Get search suggestions based on partial query.

**Query Parameters:**
- `q` (string): Partial search term (min 2 characters)

### POST /import
Import campaign data.

## Character Endpoints

### GET /campaigns/{campaign_id}/characters
List characters in campaign.

### POST /campaigns/{campaign_id}/characters
Create new character in campaign.

**Request Body:**
```json
{
  "name": "Character Name",
  "type": "PC|NPC|antagonist|ally|neutral",
  "description": "Optional description",
  "race": "Optional race",
  "class": "Optional class",
  "level": 1,
  "hp": 10,
  "ac": 10,
  "status": "alive",
  "location": "location_uuid",
  "tags": ["tag1", "tag2"]
}
```

### GET /characters/{id}
Get character details.

### PUT /characters/{id}
Update character.

### DELETE /characters/{id}
Delete character.

### GET /characters/{id}/relationships
Get character relationships.

## Location Endpoints

### GET /campaigns/{campaign_id}/locations
List locations in campaign.

### POST /campaigns/{campaign_id}/locations
Create new location in campaign.

**Request Body:**
```json
{
  "name": "Location Name",
  "type": "city|town|village|dungeon|wilderness|building|room|region|plane|other",
  "description": "Optional description",
  "parent_location": "parent_location_uuid",
  "tags": ["tag1", "tag2"]
}
```

### GET /campaigns/{campaign_id}/locations/hierarchy
Get location hierarchy tree.

### GET /locations/{id}
Get location details.

### PUT /locations/{id}
Update location.

### DELETE /locations/{id}
Delete location.

### GET /locations/{id}/items
Get items in location.

## Item Endpoints

### GET /campaigns/{campaign_id}/items
List items in campaign.

### POST /campaigns/{campaign_id}/items
Create new item in campaign.

**Request Body:**
```json
{
  "name": "Item Name",
  "type": "weapon|armor|tool|treasure|consumable|quest|misc",
  "description": "Optional description",
  "quantity": 1,
  "value": 0,
  "weight": 0,
  "rarity": "common",
  "properties": {},
  "owner": "character_uuid",
  "location": "location_uuid",
  "tags": ["tag1", "tag2"]
}
```

### GET /items/{id}
Get item details.

### PUT /items/{id}
Update item.

### DELETE /items/{id}
Delete item.

### POST /items/{id}/transfer
Transfer item ownership.

**Request Body:**
```json
{
  "to_character": "character_uuid"
}
```
OR
```json
{
  "to_location": "location_uuid"
}
```

### GET /items/{id}/history
Get item ownership history.

## Note Endpoints

### GET /campaigns/{campaign_id}/notes
List notes in campaign.

### POST /campaigns/{campaign_id}/notes
Create new note in campaign.

**Request Body:**
```json
{
  "title": "Note Title",
  "content": "Note content",
  "tags": ["tag1", "tag2"]
}
```

### GET /campaigns/{campaign_id}/notes/search
Full-text search in notes.

### GET /campaigns/{campaign_id}/notes/statistics
Get note statistics.

### GET /notes/{id}
Get note details.

### PUT /notes/{id}
Update note.

### DELETE /notes/{id}
Delete note.

### GET /notes/{id}/references
Find references to entity in note.

## Relationship Endpoints

### GET /campaigns/{campaign_id}/relationships
List relationships in campaign.

### POST /campaigns/{campaign_id}/relationships
Create new relationship.

**Request Body:**
```json
{
  "from_character": "character_uuid",
  "to_character": "character_uuid",
  "type": "ally|enemy|friend|family|romantic|mentor|rival|acquaintance|other",
  "description": "Relationship description"
}
```

### GET /campaigns/{campaign_id}/relationships/network
Get relationship network data for visualization.

### GET /campaigns/{campaign_id}/relationships/statistics
Get relationship statistics.

### GET /campaigns/{campaign_id}/relationships/find-path
Find connection paths between characters.

**Query Parameters:**
- `from` (string): Source character UUID
- `to` (string): Target character UUID
- `max_depth` (int): Maximum path depth (default: 3)

### GET /relationships/{id}
Get relationship details.

### PUT /relationships/{id}
Update relationship.

### DELETE /relationships/{id}
Delete relationship.

## Timeline Event Endpoints

### GET /campaigns/{campaign_id}/timeline
List timeline events in campaign.

**Query Parameters:**
- `session` (int): Filter by session number
- `type` (string): Filter by event type

### POST /campaigns/{campaign_id}/timeline
Create new timeline event.

**Request Body:**
```json
{
  "title": "Event Title",
  "description": "Event description",
  "date": "2024-01-01",
  "session_number": 1,
  "type": "combat|roleplay|exploration|puzzle|social|travel|rest|story|other",
  "tags": ["tag1", "tag2"],
  "related_characters": ["char_uuid1", "char_uuid2"],
  "related_locations": ["loc_uuid1", "loc_uuid2"]
}
```

### GET /campaigns/{campaign_id}/timeline/grouped
Get timeline events grouped by session.

### GET /campaigns/{campaign_id}/timeline/statistics
Get timeline statistics.

### GET /campaigns/{campaign_id}/timeline/activity
Get timeline activity over time.

**Query Parameters:**
- `days` (int): Number of days to analyze (default: 30)

### GET /campaigns/{campaign_id}/timeline/mentions
Find timeline events mentioning an entity.

**Query Parameters:**
- `entity` (string): Entity name to search for

### GET /campaigns/{campaign_id}/timeline/characters/{character_id}/involvement
Get character involvement in timeline events.

### GET /campaigns/{campaign_id}/timeline/locations/{location_id}/history
Get location history from timeline events.

### GET /timeline/{id}
Get timeline event details.

### PUT /timeline/{id}
Update timeline event.

### DELETE /timeline/{id}
Delete timeline event.

### POST /timeline/{id}/entities
Add related entities to timeline event.

**Request Body:**
```json
{
  "character_id": "character_uuid",
  "location_id": "location_uuid"
}
```

## Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Data Types

### Campaign
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string|null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Character Types
- `PC` - Player Character
- `NPC` - Non-Player Character
- `antagonist` - Antagonist/Villain
- `ally` - Ally
- `neutral` - Neutral

### Location Types
- `city`, `town`, `village` - Settlements
- `dungeon` - Dungeon
- `wilderness` - Wilderness area
- `building`, `room` - Structures
- `region` - Geographic region
- `plane` - Plane of existence
- `other` - Other type

### Item Types
- `weapon` - Weapons
- `armor` - Armor and shields
- `tool` - Tools and equipment
- `treasure` - Treasure and valuables
- `consumable` - Consumable items
- `quest` - Quest items
- `misc` - Miscellaneous

### Relationship Types
- `ally` - Allied relationship
- `enemy` - Enemy relationship
- `friend` - Friendship
- `family` - Family relation
- `romantic` - Romantic relationship
- `mentor` - Mentor/student
- `rival` - Rivalry
- `acquaintance` - Acquaintance
- `other` - Other type

### Timeline Event Types
- `combat` - Combat encounter
- `roleplay` - Roleplay scene
- `exploration` - Exploration
- `puzzle` - Puzzle or challenge
- `social` - Social encounter
- `travel` - Travel/movement
- `rest` - Rest or downtime
- `story` - Story development
- `other` - Other event type