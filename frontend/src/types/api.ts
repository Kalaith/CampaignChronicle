// Comprehensive API response types to replace 'any'

// Base API Response Structure
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Campaign API Types
export interface CampaignResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
  user_id: string;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
}

export interface CampaignSearchResponse {
  campaigns: CampaignResponse[];
  characters: CharacterResponse[];
  locations: LocationResponse[];
  items: ItemResponse[];
  notes: NoteResponse[];
  relationships: RelationshipResponse[];
  timelineEvents: TimelineEventResponse[];
  quests: QuestResponse[];
  total_results: number;
}

// Character API Types
export interface CharacterResponse {
  id: string;
  campaignId: string;
  name: string;
  type: 'PC' | 'NPC' | 'Villain' | 'Ally';
  race?: string;
  class?: string;
  level?: number;
  location?: string;
  description?: string;
  tags: string[];
  hp?: number;
  max_hp?: number;
  ac?: number;
  createdAt: string;
  lastModified: string;
}

export interface CreateCharacterRequest {
  campaignId: string;
  name: string;
  type: 'PC' | 'NPC' | 'Villain' | 'Ally';
  race?: string;
  class?: string;
  level?: number;
  location?: string;
  description?: string;
  tags: string[];
  hp?: number;
  max_hp?: number;
  ac?: number;
}

export interface UpdateCharacterRequest {
  name?: string;
  type?: 'PC' | 'NPC' | 'Villain' | 'Ally';
  race?: string;
  class?: string;
  level?: number;
  location?: string;
  description?: string;
  tags?: string[];
  hp?: number;
  max_hp?: number;
  ac?: number;
}

// Location API Types
export interface LocationResponse {
  id: string;
  campaignId: string;
  name: string;
  type: 'Continent' | 'Region' | 'City' | 'Town' | 'Village' | 'Building' | 'Room' | 'Dungeon';
  parentId?: string;
  description?: string;
  tags: string[];
  createdAt: string;
  lastModified: string;
  children?: LocationResponse[];
}

export interface CreateLocationRequest {
  campaignId: string;
  name: string;
  type: 'Continent' | 'Region' | 'City' | 'Town' | 'Village' | 'Building' | 'Room' | 'Dungeon';
  parentId?: string;
  description?: string;
  tags: string[];
}

export interface UpdateLocationRequest {
  name?: string;
  type?: 'Continent' | 'Region' | 'City' | 'Town' | 'Village' | 'Building' | 'Room' | 'Dungeon';
  parentId?: string;
  description?: string;
  tags?: string[];
}

// Item API Types
export interface ItemResponse {
  id: string;
  campaignId: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Magic Item' | 'Tool' | 'Treasure' | 'Document' | 'Key Item';
  quantity?: number;
  owner?: string;
  location?: string;
  description?: string;
  tags: string[];
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
  createdAt: string;
  lastModified: string;
}

export interface CreateItemRequest {
  campaignId: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Magic Item' | 'Tool' | 'Treasure' | 'Document' | 'Key Item';
  quantity?: number;
  owner?: string;
  location?: string;
  description?: string;
  tags: string[];
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
}

export interface UpdateItemRequest {
  name?: string;
  type?: 'Weapon' | 'Armor' | 'Magic Item' | 'Tool' | 'Treasure' | 'Document' | 'Key Item';
  quantity?: number;
  owner?: string;
  location?: string;
  description?: string;
  tags?: string[];
  rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
}

// Note API Types
export interface NoteResponse {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  lastModified: string;
}

export interface CreateNoteRequest {
  campaignId: string;
  title: string;
  content: string;
  tags: string[];
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

// Relationship API Types
export interface RelationshipResponse {
  id: string;
  campaignId: string;
  from: string; // Character ID
  to: string; // Character ID
  type: 'ally' | 'enemy' | 'family' | 'mentor' | 'neutral';
  description?: string;
  createdAt: string;
  lastModified: string;
}

export interface CreateRelationshipRequest {
  campaignId: string;
  from: string;
  to: string;
  type: 'ally' | 'enemy' | 'family' | 'mentor' | 'neutral';
  description?: string;
}

export interface UpdateRelationshipRequest {
  from?: string;
  to?: string;
  type?: 'ally' | 'enemy' | 'family' | 'mentor' | 'neutral';
  description?: string;
}

// Timeline Event API Types
export interface TimelineEventResponse {
  id: string;
  campaignId: string;
  title: string;
  description?: string;
  date: string; // In-game date or session date
  sessionNumber?: number;
  type: 'session' | 'story' | 'character' | 'location' | 'combat' | 'milestone';
  tags: string[];
  relatedCharacters?: string[]; // Character IDs
  relatedLocations?: string[]; // Location IDs
  createdAt: string;
  lastModified: string;
}

export interface CreateTimelineEventRequest {
  campaignId: string;
  title: string;
  description?: string;
  date: string;
  sessionNumber?: number;
  type: 'session' | 'story' | 'character' | 'location' | 'combat' | 'milestone';
  tags: string[];
  relatedCharacters?: string[];
  relatedLocations?: string[];
}

export interface UpdateTimelineEventRequest {
  title?: string;
  description?: string;
  date?: string;
  sessionNumber?: number;
  type?: 'session' | 'story' | 'character' | 'location' | 'combat' | 'milestone';
  tags?: string[];
  relatedCharacters?: string[];
  relatedLocations?: string[];
}

// Quest API Types
export interface QuestResponse {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  questGiver?: string; // Character ID
  rewards?: string;
  objectives: QuestObjectiveResponse[];
  relatedCharacters?: string[]; // Character IDs
  relatedLocations?: string[]; // Location IDs
  tags: string[];
  createdAt: string;
  lastModified: string;
  completedAt?: string;
}

export interface QuestObjectiveResponse {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface CreateQuestRequest {
  campaignId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  questGiver?: string;
  rewards?: string;
  objectives: CreateQuestObjectiveRequest[];
  relatedCharacters?: string[];
  relatedLocations?: string[];
  tags: string[];
}

export interface CreateQuestObjectiveRequest {
  description: string;
  completed: boolean;
}

// Map API Types
export interface MapResponse {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  imageUrl: string;
  width: number;
  height: number;
  pins: MapPinResponse[];
  routes: MapRouteResponse[];
  createdAt: string;
  lastModified: string;
}

export interface MapPinResponse {
  id: string;
  x: number;
  y: number;
  type: 'location' | 'poi' | 'danger' | 'treasure' | 'settlement';
  name: string;
  description?: string;
  locationId?: string;
  icon: string;
  color: string;
}

export interface MapRouteResponse {
  id: string;
  name: string;
  description?: string;
  points: RoutePointResponse[];
  color: string;
  type: 'path' | 'road' | 'river' | 'border';
  isVisible: boolean;
}

export interface RoutePointResponse {
  x: number;
  y: number;
}

export interface CreateMapRequest {
  name: string;
  description?: string;
  imageFile: File;
}

// Dice Rolling API Types
export interface DiceRollResponse {
  id: string;
  campaignId: string;
  playerId?: string;
  playerName?: string;
  expression: string;
  result: number;
  individual_rolls: number[];
  modifier: number;
  context?: string;
  advantage?: boolean;
  disadvantage?: boolean;
  critical?: boolean;
  tags: string[];
  is_private: boolean;
  created_at: string;
}

export interface CreateDiceRollRequest {
  expression: string;
  result: number;
  individual_rolls: number[];
  modifier?: number;
  context?: string;
  advantage?: boolean;
  disadvantage?: boolean;
  critical?: boolean;
  tags?: string[];
  is_private?: boolean;
  player_id?: string;
  player_name?: string;
}

export interface DiceTemplateResponse {
  id: string;
  campaignId: string;
  name: string;
  expression: string;
  description?: string;
  category: 'attack' | 'damage' | 'save' | 'skill' | 'custom';
  tags: string[];
  created_at: string;
}

export interface CreateDiceTemplateRequest {
  name: string;
  expression: string;
  description?: string;
  category: 'attack' | 'damage' | 'save' | 'skill' | 'custom';
  tags?: string[];
}

export interface DiceStatisticsResponse {
  total_rolls: number;
  average_result: number;
  highest_roll: number;
  lowest_roll: number;
  critical_hits: number;
  advantage_rolls: number;
  disadvantage_rolls: number;
  rolls_by_context: Record<string, number>;
  rolls_by_player: Record<string, number>;
  rolls_by_day: Record<string, number>;
}

// Player Access API Types
export interface PlayerAccessResponse {
  id: string;
  campaignId: string;
  playerName: string;
  token: string;
  permissions: PlayerPermissions;
  isActive: boolean;
  lastAccessed?: string;
  createdAt: string;
}

export interface PlayerPermissions {
  viewCharacters: boolean;
  viewNotes: boolean;
  viewMaps: boolean;
  viewTimeline: boolean;
  viewQuests: boolean;
  viewResources: boolean;
}

export interface CreatePlayerAccessRequest {
  campaignId: string;
  playerName: string;
  permissions: PlayerPermissions;
}

// Shared Resource API Types
export interface SharedResourceResponse {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
  category: 'maps' | 'handouts' | 'references' | 'music' | 'other';
  filename: string;
  fileSize: number;
  mimeType: string;
  accessLevel: 'dm_only' | 'players' | 'public';
  tags: string[];
  createdAt: string;
  lastModified: string;
}

export interface CreateSharedResourceRequest {
  name: string;
  description?: string;
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
  category: 'maps' | 'handouts' | 'references' | 'music' | 'other';
  accessLevel: 'dm_only' | 'players' | 'public';
  tags: string[];
  file: File;
}

// Search and Filter Types
export interface SearchFilters {
  search?: string;
  type?: string;
  tags?: string[];
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface SearchSuggestion {
  type: 'campaign' | 'character' | 'location' | 'item' | 'note' | 'quest';
  id: string;
  name: string;
  description?: string;
  relevance: number;
}

// Export/Import Types
export interface ExportOptions {
  entities?: string[];
  include_stats?: boolean;
  format?: 'json' | 'csv' | 'pdf';
}

export interface ExportResponse {
  filename: string;
  downloadUrl: string;
  expiresAt: string;
  size: number;
}

export interface ImportRequest {
  file: File;
  options?: {
    merge_duplicates?: boolean;
    update_existing?: boolean;
  };
}

export interface ImportResponse {
  success: boolean;
  imported_count: number;
  errors: string[];
  warnings: string[];
}