import type { Campaign, Character, Location, Item, Note, Quest } from '../types';

export type BackendRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

export const mapCampaignRecord = (record: BackendRecord): Campaign => ({
  id: asString(record.id),
  name: asString(record.name),
  description: asString(record.description),
  createdAt: asString(record.created_at ?? record.createdAt),
  lastModified: asString(record.updated_at ?? record.lastModified),
});

export const mapCharacterRecord = (record: BackendRecord): Character => ({
  id: asString(record.id),
  campaignId: asString(record.campaign_id),
  name: asString(record.name),
  type: asString(record.type, 'NPC') as Character['type'],
  race: asString(record.race),
  class: asString(record.class),
  level: asNumber(record.level, 1),
  description: asString(record.description),
  hp: typeof record.hp === 'number' ? record.hp : undefined,
  ac: typeof record.ac === 'number' ? record.ac : undefined,
  status: asString(record.status, 'alive') as Character['status'],
  location: typeof record.location === 'string' ? record.location : undefined,
  tags: asStringArray(record.tags),
});

export const mapLocationRecord = (record: BackendRecord): Location => ({
  id: asString(record.id),
  campaignId: asString(record.campaign_id),
  name: asString(record.name),
  type: asString(record.type, 'City') as Location['type'],
  description: asString(record.description),
  parentId: typeof record.parent_location === 'string' ? record.parent_location : undefined,
  tags: asStringArray(record.tags),
});

export const mapItemRecord = (record: BackendRecord): Item => ({
  id: asString(record.id),
  campaignId: asString(record.campaign_id),
  name: asString(record.name),
  type: asString(record.type, 'Tool') as Item['type'],
  description: asString(record.description),
  owner: typeof record.owner === 'string' ? record.owner : undefined,
  location: typeof record.location === 'string' ? record.location : undefined,
  tags: asStringArray(record.tags),
});

export const mapNoteRecord = (record: BackendRecord): Note => ({
  id: asString(record.id),
  campaignId: asString(record.campaign_id),
  title: asString(record.title),
  content: asString(record.content),
  createdAt: asString(record.created_at),
  lastModified: asString(record.updated_at),
  tags: asStringArray(record.tags),
});

export const mapQuestRecord = (record: BackendRecord): Quest => ({
  id: asString(record.id),
  campaignId: asString(record.campaign_id),
  title: asString(record.title),
  description: asString(record.description),
  status: asString(record.status, 'active') as Quest['status'],
  priority: asString(record.priority, 'medium') as Quest['priority'],
  questGiver: typeof record.quest_giver === 'string' ? record.quest_giver : undefined,
  rewards: typeof record.rewards === 'string' ? record.rewards : undefined,
  objectives: Array.isArray(record.objectives) ? record.objectives as Quest['objectives'] : [],
  relatedCharacters: asStringArray(record.related_characters),
  relatedLocations: asStringArray(record.related_locations),
  tags: asStringArray(record.tags),
  createdAt: asString(record.created_at),
  lastModified: asString(record.updated_at),
  completedAt: typeof record.completed_at === 'string' ? record.completed_at : undefined,
});
