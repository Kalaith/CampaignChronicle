// Campaign Chronicle Types

export interface Campaign {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  lastModified: string;
}

export interface Character {
  id: string;
  campaignId: string;
  name: string;
  type: 'PC' | 'NPC' | 'Villain' | 'Ally';
  race?: string;
  class?: string;
  location?: string;
  description?: string;
  tags: string[];
}

export interface Location {
  id: string;
  campaignId: string;
  name: string;
  type: 'Continent' | 'Region' | 'City' | 'Town' | 'Village' | 'Building' | 'Room' | 'Dungeon';
  parentId?: string;
  description?: string;
  tags: string[];
  children?: Location[];
}

export interface Item {
  id: string;
  campaignId: string;
  name: string;
  type: 'Weapon' | 'Armor' | 'Magic Item' | 'Tool' | 'Treasure' | 'Document' | 'Key Item';
  owner?: string;
  location?: string;
  description?: string;
  tags: string[];
}

export interface Note {
  id: string;
  campaignId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  lastModified: string;
}

export interface Relationship {
  id: string;
  campaignId: string;
  from: string; // Character ID
  to: string; // Character ID
  type: 'ally' | 'enemy' | 'family' | 'mentor' | 'neutral';
  description?: string;
}

export interface TimelineEvent {
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

export interface Quest {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  questGiver?: string; // Character ID
  rewards?: string;
  objectives: QuestObjective[];
  relatedCharacters?: string[]; // Character IDs
  relatedLocations?: string[]; // Location IDs
  tags: string[];
  createdAt: string;
  lastModified: string;
  completedAt?: string;
}

export interface QuestObjective {
  id: string;
  description: string;
  completed: boolean;
  completedAt?: string;
}

export interface CampaignMap {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  imageUrl: string;
  width: number;
  height: number;
  pins: MapPin[];
  routes: MapRoute[];
  createdAt: string;
  lastModified: string;
}

export interface MapPin {
  id: string;
  x: number; // Percentage of map width
  y: number; // Percentage of map height
  type: 'location' | 'poi' | 'danger' | 'treasure' | 'settlement';
  name: string;
  description?: string;
  locationId?: string; // Link to Location entity
  icon: string;
  color: string;
}

export interface MapRoute {
  id: string;
  name: string;
  description?: string;
  points: RoutePoint[];
  color: string;
  type: 'path' | 'road' | 'river' | 'border';
  isVisible: boolean;
}

export interface RoutePoint {
  x: number; // Percentage of map width
  y: number; // Percentage of map height
}

// Dice Rolling Types
export interface DiceRoll {
  id: string;
  campaignId: string;
  playerId?: string; // For player attribution
  playerName?: string;
  expression: string; // The dice expression (e.g., "2d6+3", "1d20")
  result: number;
  individualRolls: number[]; // The individual die results
  modifier: number;
  timestamp: string;
  context?: string; // What this roll was for (e.g., "Attack Roll", "Saving Throw")
  advantage?: boolean; // For D&D advantage rolls
  disadvantage?: boolean; // For D&D disadvantage rolls
  critical?: boolean; // Was this a critical hit/fail?
  tags: string[];
  isPrivate: boolean; // Whether this roll is visible to players
}

export interface DiceTemplate {
  id: string;
  campaignId: string;
  name: string;
  expression: string;
  description?: string;
  category: 'attack' | 'damage' | 'save' | 'skill' | 'custom';
  tags: string[];
  createdAt: string;
}

export interface DiceSet {
  id: string;
  campaignId: string;
  name: string;
  dice: DiceDefinition[];
  description?: string;
  isDefault: boolean;
}

export interface DiceDefinition {
  sides: number;
  quantity: number;
  modifier?: number;
  color?: string;
  label?: string;
}

export interface DiceProbability {
  value: number;
  probability: number;
  percentage: string;
}

export interface DiceStatistics {
  min: number;
  max: number;
  average: number;
  mostLikely: number;
  distribution: DiceProbability[];
}

export type ViewType = 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes' | 'timeline' | 'quests' | 'maps' | 'player-access' | 'resources' | 'mobile-companion' | 'dice-roller';
