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

export type ViewType = 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes';
