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
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CharacterResponse,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  ItemResponse,
  CreateItemRequest,
  UpdateItemRequest,
  NoteResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  RelationshipResponse,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  TimelineEventResponse,
  CreateTimelineEventRequest,
  UpdateTimelineEventRequest,
  QuestResponse,
  CreateQuestRequest,
  MapResponse,
  CreateMapRequest,
  DiceRollResponse,
  CreateDiceRollRequest,
  DiceTemplateResponse,
  CreateDiceTemplateRequest,
  DiceStatisticsResponse,
  SharedResourceResponse,
  CreateSharedResourceRequest,
  PlayerAccessResponse,
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
  search(campaignId: string, query: string, types?: string[]): Promise<any>;
  export(campaignId: string, options?: { entities?: string[]; include_stats?: boolean }): Promise<any>;
  import(file: File, options?: { merge_duplicates?: boolean }): Promise<any>;
  getAnalytics(campaignId: string): Promise<any>;
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
  getHistory(itemId: string): Promise<any[]>;
}

// Note Repository
export interface INoteRepository extends BaseRepository<Note, CreateNoteRequest, UpdateNoteRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Note>>;
  search(campaignId: string, query: string): Promise<Note[]>;
  getReferences(noteId: string): Promise<any[]>;
  getStatistics(campaignId: string): Promise<any>;
}

// Relationship Repository
export interface IRelationshipRepository extends BaseRepository<Relationship, CreateRelationshipRequest, UpdateRelationshipRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Relationship>>;
  findByCharacter(characterId: string): Promise<Relationship[]>;
  getNetwork(campaignId: string): Promise<any>;
  findPath(fromCharacterId: string, toCharacterId: string): Promise<Relationship[]>;
  getStatistics(campaignId: string): Promise<any>;
}

// Timeline Event Repository
export interface ITimelineEventRepository extends BaseRepository<TimelineEvent, CreateTimelineEventRequest, UpdateTimelineEventRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<TimelineEvent>>;
  getGroupedBySessions(campaignId: string): Promise<any>;
  getCharacterInvolvement(characterId: string): Promise<TimelineEvent[]>;
  getLocationHistory(locationId: string): Promise<TimelineEvent[]>;
  getActivity(campaignId: string, days?: number): Promise<any>;
  getMentions(campaignId: string): Promise<any>;
  getStatistics(campaignId: string): Promise<any>;
  addRelatedEntity(eventId: string, entityType: string, entityId: string): Promise<TimelineEvent>;
}

// Quest Repository
export interface IQuestRepository extends BaseRepository<Quest, CreateQuestRequest, UpdateQuestRequest> {
  findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Quest>>;
  complete(questId: string): Promise<Quest>;
  addObjective(questId: string, objective: { description: string }): Promise<Quest>;
  updateObjective(questId: string, objectiveId: string, updates: { description?: string; completed?: boolean }): Promise<Quest>;
  deleteObjective(questId: string, objectiveId: string): Promise<Quest>;
  getStatistics(campaignId: string): Promise<any>;
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
  clearRollHistory(campaignId: string, playerId?: string): Promise<any>;
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
  getResourceInfo(): Promise<any>;
  
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
  getPortalAccess(token: string): Promise<any>;
  getCampaignData(token: string): Promise<any>;
  getPermissions(): Promise<any>;
}

// Weather Repository
export interface IWeatherRepository {
  getWeather(campaignId: string): Promise<any>;
  generateWeather(campaignId: string, options?: any): Promise<any>;
  advanceDay(campaignId: string): Promise<any>;
  setDate(campaignId: string, date: string): Promise<any>;
  addEvent(campaignId: string, event: any): Promise<any>;
  updateEvent(campaignId: string, eventId: string, updates: any): Promise<any>;
  deleteEvent(campaignId: string, eventId: string): Promise<void>;
  getUpcomingEvents(campaignId: string): Promise<any[]>;
  getStatistics(campaignId: string): Promise<any>;
  getWeatherInfo(): Promise<any>;
}

// NPC Repository
export interface INPCRepository {
  generate(campaignId: string, options?: any): Promise<Character>;
  generateBatch(campaignId: string, count: number, options?: any): Promise<Character[]>;
  getRaces(): Promise<any[]>;
  getRaceTemplate(race: string): Promise<any>;
}

// Initiative/Combat Repository
export interface ICombatRepository {
  getEncounters(campaignId: string): Promise<any[]>;
  createEncounter(campaignId: string, encounter: any): Promise<any>;
  getEncounter(campaignId: string, encounterId: string): Promise<any>;
  updateEncounter(campaignId: string, encounterId: string, updates: any): Promise<any>;
  deleteEncounter(campaignId: string, encounterId: string): Promise<void>;
  startEncounter(campaignId: string, encounterId: string): Promise<any>;
  endEncounter(campaignId: string, encounterId: string): Promise<any>;
  nextTurn(campaignId: string, encounterId: string): Promise<any>;
  addCombatant(campaignId: string, encounterId: string, combatant: any): Promise<any>;
  updateCombatant(campaignId: string, encounterId: string, combatantId: string, updates: any): Promise<any>;
  removeCombatant(campaignId: string, encounterId: string, combatantId: string): Promise<void>;
  applyDamage(campaignId: string, encounterId: string, combatantId: string, damage: number): Promise<any>;
  applyHealing(campaignId: string, encounterId: string, combatantId: string, healing: number): Promise<any>;
  addStatusEffect(campaignId: string, encounterId: string, combatantId: string, effect: any): Promise<any>;
  removeStatusEffect(campaignId: string, encounterId: string, combatantId: string, effectId: string): Promise<void>;
  getSummary(campaignId: string, encounterId: string): Promise<any>;
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
  permissions?: any;
  isActive?: boolean;
}