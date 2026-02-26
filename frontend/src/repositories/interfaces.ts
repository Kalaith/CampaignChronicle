// Repository interface definitions for clean separation of concerns

import type {
  Campaign,
  Character,
  Location,
  Item,
  Note,
  Relationship,
  TimelineEvent,
  Quest,
  CampaignMap,
  DiceRoll,
  DiceTemplate,
  SharedResource,
  PlayerAccess
} from '../types';

import type {
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  CreateLocationRequest,
  UpdateLocationRequest,
  CreateItemRequest,
  UpdateItemRequest,
  CreateNoteRequest,
  UpdateNoteRequest,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  CreateTimelineEventRequest,
  UpdateTimelineEventRequest,
  CreateQuestRequest,
  CreateMapRequest,
  CreateDiceRollRequest,
  CreateDiceTemplateRequest,
  DiceStatisticsResponse,
  CreateSharedResourceRequest,
  CreatePlayerAccessRequest,
  PaginatedResponse,
  SearchFilters
} from '../types/api';

// Base repository interface
export interface BaseRepository<T, TCreate, TUpdate> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<void>;
}

// Campaign Repository
export interface ICampaignRepository extends BaseRepository<Campaign, CreateCampaignRequest, UpdateCampaignRequest> {
  search(campaignId: string, query: string, types?: string[]): Promise<unknown>;
  export(campaignId: string, options?: { entities?: string[]; include_stats?: boolean }): Promise<unknown>;
  import(file: File, options?: { merge_duplicates?: boolean }): Promise<unknown>;
  getAnalytics(campaignId: string): Promise<unknown>;
}

// Character Repository
export interface ICharacterRepository extends BaseRepository<Character, CreateCharacterRequest, UpdateCharacterRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Character>>;
  findByLocation(locationId: string): Promise<Character[]>;
  getRelationships(characterId: string): Promise<Relationship[]>;
  updateStats(characterId: string, stats: { hp?: number; max_hp?: number; ac?: number }): Promise<Character>;
}

// Location Repository
export interface ILocationRepository extends BaseRepository<Location, CreateLocationRequest, UpdateLocationRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Location>>;
  getHierarchy(campaignId: string): Promise<Location[]>;
  findChildren(parentId: string): Promise<Location[]>;
  getItems(locationId: string): Promise<Item[]>;
  getCharacters(locationId: string): Promise<Character[]>;
}

// Item Repository
export interface IItemRepository extends BaseRepository<Item, CreateItemRequest, UpdateItemRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Item>>;
  findByOwner(ownerId: string): Promise<Item[]>;
  findByLocation(locationId: string): Promise<Item[]>;
  transfer(itemId: string, toOwner?: string, toLocation?: string): Promise<Item>;
  getHistory(itemId: string): Promise<unknown[]>;
}

// Note Repository
export interface INoteRepository extends BaseRepository<Note, CreateNoteRequest, UpdateNoteRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Note>>;
  search(campaignId: string, query: string): Promise<Note[]>;
  getReferences(noteId: string): Promise<unknown[]>;
  getStatistics(campaignId: string): Promise<unknown>;
}

// Relationship Repository
export interface IRelationshipRepository extends BaseRepository<Relationship, CreateRelationshipRequest, UpdateRelationshipRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Relationship>>;
  findByCharacter(characterId: string): Promise<Relationship[]>;
  getNetwork(campaignId: string): Promise<unknown>;
  findPath(fromCharacterId: string, toCharacterId: string): Promise<Relationship[]>;
  getStatistics(campaignId: string): Promise<unknown>;
}

// Timeline Event Repository
export interface ITimelineEventRepository extends BaseRepository<TimelineEvent, CreateTimelineEventRequest, UpdateTimelineEventRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<TimelineEvent>>;
  getGroupedBySessions(campaignId: string): Promise<unknown>;
  getCharacterInvolvement(characterId: string): Promise<TimelineEvent[]>;
  getLocationHistory(locationId: string): Promise<TimelineEvent[]>;
  getActivity(campaignId: string, days?: number): Promise<unknown>;
  getMentions(campaignId: string): Promise<unknown>;
  getStatistics(campaignId: string): Promise<unknown>;
  addRelatedEntity(eventId: string, entityType: string, entityId: string): Promise<TimelineEvent>;
}

// Quest Repository
export interface IQuestRepository extends BaseRepository<Quest, CreateQuestRequest, UpdateQuestRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Quest>>;
  complete(questId: string): Promise<Quest>;
  addObjective(questId: string, objective: { description: string }): Promise<Quest>;
  updateObjective(questId: string, objectiveId: string, updates: { description?: string; completed?: boolean }): Promise<Quest>;
  deleteObjective(questId: string, objectiveId: string): Promise<Quest>;
  getStatistics(campaignId: string): Promise<unknown>;
}

// Map Repository
export interface IMapRepository extends BaseRepository<CampaignMap, CreateMapRequest, UpdateMapRequest> {
  findByCampaign(campaignId: string): Promise<CampaignMap[]>;
  addPin(mapId: string, pin: Omit<MapPin, 'id'>): Promise<CampaignMap>;
  updatePin(mapId: string, pinId: string, updates: Partial<MapPin>): Promise<CampaignMap>;
  deletePin(mapId: string, pinId: string): Promise<CampaignMap>;
  addRoute(mapId: string, route: Omit<MapRoute, 'id'>): Promise<CampaignMap>;
  updateRoute(mapId: string, routeId: string, updates: Partial<MapRoute>): Promise<CampaignMap>;
  deleteRoute(mapId: string, routeId: string): Promise<CampaignMap>;
}

// Dice Repository
export interface IDiceRepository {
  // Rolls
  getRolls(campaignId: string, params?: {
    limit?: number;
    includePrivate?: boolean;
    since?: string;
    playerId?: string;
    context?: string;
  }): Promise<DiceRoll[]>;
  createRoll(campaignId: string, rollData: CreateDiceRollRequest): Promise<DiceRoll>;
  deleteRoll(campaignId: string, rollId: string): Promise<void>;
  clearRollHistory(campaignId: string, playerId?: string): Promise<unknown>;
  getRecentRolls(campaignId: string, params?: { since?: string; limit?: number }): Promise<DiceRoll[]>;
  
  // Templates
  getTemplates(campaignId: string): Promise<DiceTemplate[]>;
  createTemplate(campaignId: string, templateData: CreateDiceTemplateRequest): Promise<DiceTemplate>;
  updateTemplate(campaignId: string, templateId: string, updates: Partial<DiceTemplate>): Promise<DiceTemplate>;
  deleteTemplate(campaignId: string, templateId: string): Promise<void>;
  
  // Statistics
  getStatistics(campaignId: string, params?: {
    player_id?: string;
    days?: number;
    context?: string;
  }): Promise<DiceStatisticsResponse>;
}

// Shared Resource Repository
export interface ISharedResourceRepository extends BaseRepository<SharedResource, CreateSharedResourceRequest, UpdateSharedResourceRequest> {
  findByCampaign(campaignId: string, filters?: {
    type?: string;
    category?: string;
    access_level?: string;
    tag?: string;
  }): Promise<SharedResource[]>;
  download(resourceId: string): Promise<Blob>;
  getResourceInfo(): Promise<unknown>;
  
  // Player portal access
  getPlayerResources(token: string, filters?: {
    type?: string;
    category?: string;
  }): Promise<SharedResource[]>;
}

// Player Access Repository
export interface IPlayerAccessRepository extends BaseRepository<PlayerAccess, CreatePlayerAccessRequest, UpdatePlayerAccessRequest> {
  findByCampaign(campaignId: string): Promise<PlayerAccess[]>;
  regenerateToken(accessId: string): Promise<PlayerAccess>;
  getPortalAccess(token: string): Promise<unknown>;
  getCampaignData(token: string): Promise<unknown>;
  getPermissions(): Promise<unknown>;
}

// Weather Repository
export interface IWeatherRepository {
  getWeather(campaignId: string): Promise<unknown>;
  generateWeather(campaignId: string, options?: unknown): Promise<unknown>;
  advanceDay(campaignId: string): Promise<unknown>;
  setDate(campaignId: string, date: string): Promise<unknown>;
  addEvent(campaignId: string, event: unknown): Promise<unknown>;
  updateEvent(campaignId: string, eventId: string, updates: unknown): Promise<unknown>;
  deleteEvent(campaignId: string, eventId: string): Promise<void>;
  getUpcomingEvents(campaignId: string): Promise<unknown[]>;
  getStatistics(campaignId: string): Promise<unknown>;
  getWeatherInfo(): Promise<unknown>;
}

// NPC Repository
export interface INPCRepository {
  generate(campaignId: string, options?: unknown): Promise<Character>;
  generateBatch(campaignId: string, count: number, options?: unknown): Promise<Character[]>;
  getRaces(): Promise<unknown[]>;
  getRaceTemplate(race: string): Promise<unknown>;
}

// Initiative/Combat Repository
export interface ICombatRepository {
  getEncounters(campaignId: string): Promise<unknown[]>;
  createEncounter(campaignId: string, encounter: unknown): Promise<unknown>;
  getEncounter(campaignId: string, encounterId: string): Promise<unknown>;
  updateEncounter(campaignId: string, encounterId: string, updates: unknown): Promise<unknown>;
  deleteEncounter(campaignId: string, encounterId: string): Promise<void>;
  startEncounter(campaignId: string, encounterId: string): Promise<unknown>;
  endEncounter(campaignId: string, encounterId: string): Promise<unknown>;
  nextTurn(campaignId: string, encounterId: string): Promise<unknown>;
  addCombatant(campaignId: string, encounterId: string, combatant: unknown): Promise<unknown>;
  updateCombatant(campaignId: string, encounterId: string, combatantId: string, updates: unknown): Promise<unknown>;
  removeCombatant(campaignId: string, encounterId: string, combatantId: string): Promise<void>;
  applyDamage(campaignId: string, encounterId: string, combatantId: string, damage: number): Promise<unknown>;
  applyHealing(campaignId: string, encounterId: string, combatantId: string, healing: number): Promise<unknown>;
  addStatusEffect(campaignId: string, encounterId: string, combatantId: string, effect: unknown): Promise<unknown>;
  removeStatusEffect(campaignId: string, encounterId: string, combatantId: string, effectId: string): Promise<void>;
  getSummary(campaignId: string, encounterId: string): Promise<unknown>;
}

// Generic update interface (used in base repository)
interface UpdateMapRequest {
  name?: string;
  description?: string;
}

interface UpdateSharedResourceRequest {
  name?: string;
  description?: string;
  type?: string;
  category?: string;
  accessLevel?: string;
  tags?: string[];
}

interface UpdatePlayerAccessRequest {
  playerName?: string;
  permissions?: unknown;
  isActive?: boolean;
}
