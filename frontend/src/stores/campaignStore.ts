import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Campaign, Character, Location, Item, Note, Relationship, TimelineEvent } from '../types';

// Type guard functions
const isValidImportData = (data: unknown): data is {
  campaign: Campaign;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
} => {
  return typeof data === 'object' && data !== null && 'campaign' in data;
};

const isValidBackupData = (data: unknown): data is {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  currentView?: string;
} => {
  return typeof data === 'object' && data !== null && 'campaigns' in data;
};

interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  timelineEvents: TimelineEvent[];
  currentView: 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes' | 'timeline';
}

interface CampaignActions {
  // Campaign Management
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'lastModified'>) => Campaign;
  selectCampaign: (campaign: Campaign | null) => void;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (campaignId: string) => void;

  // Character Management
  addCharacter: (character: Omit<Character, 'id'>) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;

  // Location Management
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (locationId: string, updates: Partial<Location>) => void;
  deleteLocation: (locationId: string) => void;

  // Item Management
  addItem: (item: Omit<Item, 'id'>) => void;
  updateItem: (itemId: string, updates: Partial<Item>) => void;
  deleteItem: (itemId: string) => void;

  // Notes Management
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'lastModified'>) => void;
  updateNote: (noteId: string, updates: Partial<Note>) => void;
  deleteNote: (noteId: string) => void;

  // Relationships Management
  addRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  updateRelationship: (relationshipId: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (relationshipId: string) => void;

  // Timeline Management
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'lastModified'>) => void;
  updateTimelineEvent: (eventId: string, updates: Partial<TimelineEvent>) => void;
  deleteTimelineEvent: (eventId: string) => void;

  // View Management
  setCurrentView: (view: 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes' | 'timeline') => void;

  // Import/Export Functions
  importCampaignData: (data: unknown) => void;
  importFullBackup: (data: unknown) => void;

  // Utility Functions
  clearAll: () => void;
}

type CampaignStore = CampaignState & CampaignActions;

const generateId = () => crypto.randomUUID();

export const useCampaignStore = create<CampaignStore>()(
  persist(
    (set) => ({
      // State
      campaigns: [],
      currentCampaign: null,
      characters: [],
      locations: [],
      items: [],
      notes: [],
      relationships: [],
      timelineEvents: [],
      currentView: 'dashboard',

      // Campaign Actions
      createCampaign: (campaignData) => {
        const newCampaign: Campaign = {
          ...campaignData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        set((state) => ({
          campaigns: [...state.campaigns, newCampaign],
          currentCampaign: newCampaign,
        }));
        return newCampaign;
      },

      selectCampaign: (campaign) =>
        set({ currentCampaign: campaign }),

      updateCampaign: (campaignId, updates) =>
        set((state) => ({
          campaigns: state.campaigns.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, ...updates, lastModified: new Date().toISOString() }
              : campaign
          ),
          currentCampaign:
            state.currentCampaign?.id === campaignId
              ? { ...state.currentCampaign, ...updates, lastModified: new Date().toISOString() }
              : state.currentCampaign,
        })),

      deleteCampaign: (campaignId) =>
        set((state) => ({
          campaigns: state.campaigns.filter(campaign => campaign.id !== campaignId),
          currentCampaign: state.currentCampaign?.id === campaignId ? null : state.currentCampaign,
          characters: state.characters.filter(character => character.campaignId !== campaignId),
          locations: state.locations.filter(location => location.campaignId !== campaignId),
          items: state.items.filter(item => item.campaignId !== campaignId),
          notes: state.notes.filter(note => note.campaignId !== campaignId),
          relationships: state.relationships.filter(relationship => relationship.campaignId !== campaignId),
          timelineEvents: state.timelineEvents.filter(event => event.campaignId !== campaignId),
        })),

      // Character Actions
      addCharacter: (characterData) =>
        set((state) => ({
          characters: [...state.characters, { ...characterData, id: generateId() }],
        })),

      updateCharacter: (characterId, updates) =>
        set((state) => ({
          characters: state.characters.map(character =>
            character.id === characterId ? { ...character, ...updates } : character
          ),
        })),

      deleteCharacter: (characterId) =>
        set((state) => ({
          characters: state.characters.filter(character => character.id !== characterId),
          relationships: state.relationships.filter(
            relationship => relationship.from !== characterId && relationship.to !== characterId
          ),
        })),

      // Location Actions
      addLocation: (locationData) =>
        set((state) => ({
          locations: [...state.locations, { ...locationData, id: generateId() }],
        })),

      updateLocation: (locationId, updates) =>
        set((state) => ({
          locations: state.locations.map(location =>
            location.id === locationId ? { ...location, ...updates } : location
          ),
        })),

      deleteLocation: (locationId) =>
        set((state) => ({
          locations: state.locations.filter(location => location.id !== locationId),
        })),

      // Item Actions
      addItem: (itemData) =>
        set((state) => ({
          items: [...state.items, { ...itemData, id: generateId() }],
        })),

      updateItem: (itemId, updates) =>
        set((state) => ({
          items: state.items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        })),

      deleteItem: (itemId) =>
        set((state) => ({
          items: state.items.filter(item => item.id !== itemId),
        })),

      // Note Actions
      addNote: (noteData) =>
        set((state) => {
          const timestamp = new Date().toISOString();
          return {
            notes: [
              ...state.notes,
              {
                ...noteData,
                id: generateId(),
                createdAt: timestamp,
                lastModified: timestamp,
              },
            ],
          };
        }),

      updateNote: (noteId, updates) =>
        set((state) => ({
          notes: state.notes.map(note =>
            note.id === noteId
              ? { ...note, ...updates, lastModified: new Date().toISOString() }
              : note
          ),
        })),

      deleteNote: (noteId) =>
        set((state) => ({
          notes: state.notes.filter(note => note.id !== noteId),
        })),

      // Relationship Actions
      addRelationship: (relationshipData) =>
        set((state) => ({
          relationships: [...state.relationships, { ...relationshipData, id: generateId() }],
        })),

      updateRelationship: (relationshipId, updates) =>
        set((state) => ({
          relationships: state.relationships.map(relationship =>
            relationship.id === relationshipId ? { ...relationship, ...updates } : relationship
          ),
        })),

      deleteRelationship: (relationshipId) =>
        set((state) => ({
          relationships: state.relationships.filter(relationship => relationship.id !== relationshipId),
        })),

      // Timeline Actions
      addTimelineEvent: (eventData) =>
        set((state) => {
          const timestamp = new Date().toISOString();
          return {
            timelineEvents: [
              ...state.timelineEvents,
              {
                ...eventData,
                id: generateId(),
                createdAt: timestamp,
                lastModified: timestamp,
              },
            ],
          };
        }),

      updateTimelineEvent: (eventId, updates) =>
        set((state) => ({
          timelineEvents: state.timelineEvents.map(event =>
            event.id === eventId
              ? { ...event, ...updates, lastModified: new Date().toISOString() }
              : event
          ),
        })),

      deleteTimelineEvent: (eventId) =>
        set((state) => ({
          timelineEvents: state.timelineEvents.filter(event => event.id !== eventId),
        })),

      // View Management
      setCurrentView: (view) =>
        set({ currentView: view }),

      // Import/Export Functions
      importCampaignData: (data) => {
        if (!isValidImportData(data)) {
          console.error('Invalid import data format');
          return;
        }

        set((state) => {
          // Generate new IDs for imported data to avoid conflicts
          const newCampaignId = generateId();
          const campaign = {
            ...data.campaign,
            id: newCampaignId,
            name: `${data.campaign.name} (Imported)`,
            lastModified: new Date().toISOString(),
          };

          // Map old IDs to new IDs for relationships
          const idMap = new Map<string, string>();
          
          const characters = data.characters.map((char) => {
            const newId = generateId();
            idMap.set(char.id, newId);
            return { ...char, id: newId, campaignId: newCampaignId };
          });

          const locations = data.locations.map((loc) => ({
            ...loc,
            id: generateId(),
            campaignId: newCampaignId,
            parentId: loc.parentId ? idMap.get(loc.parentId) || undefined : undefined,
          }));

          const items = data.items.map((item) => ({
            ...item,
            id: generateId(),
            campaignId: newCampaignId,
            owner: item.owner ? idMap.get(item.owner) || item.owner : undefined,
          }));

          const notes = data.notes.map((note) => ({
            ...note,
            id: generateId(),
            campaignId: newCampaignId,
          }));

          const relationships = data.relationships.map((rel) => ({
            ...rel,
            id: generateId(),
            campaignId: newCampaignId,
            from: idMap.get(rel.from) || rel.from,
            to: idMap.get(rel.to) || rel.to,
          }));

          return {
            campaigns: [...state.campaigns, campaign],
            characters: [...state.characters, ...characters],
            locations: [...state.locations, ...locations],
            items: [...state.items, ...items],
            notes: [...state.notes, ...notes],
            relationships: [...state.relationships, ...relationships],
            currentCampaign: campaign,
          };
        });
      },

      importFullBackup: (data) => {
        if (!isValidBackupData(data)) {
          console.error('Invalid backup data format');
          return;
        }

        if (confirm('This will replace ALL your current data. Are you sure you want to continue?')) {
          set({
            campaigns: data.campaigns || [],
            currentCampaign: data.currentCampaign || null,
            characters: data.characters || [],
            locations: data.locations || [],
            items: data.items || [],
            notes: data.notes || [],
            relationships: data.relationships || [],
            currentView: (data.currentView && ['dashboard', 'characters', 'locations', 'items', 'relationships', 'notes'].includes(data.currentView) 
              ? data.currentView 
              : 'dashboard') as 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes',
          });
        }
      },

      // Utility
      clearAll: () =>
        set({
          campaigns: [],
          currentCampaign: null,
          characters: [],
          locations: [],
          items: [],
          notes: [],
          relationships: [],
          timelineEvents: [],
          currentView: 'dashboard',
        }),
    }),
    {
      name: 'campaign-chronicle-storage',
      partialize: (state) => ({
        campaigns: state.campaigns,
        currentCampaign: state.currentCampaign,
        characters: state.characters,
        locations: state.locations,
        items: state.items,
        notes: state.notes,
        relationships: state.relationships,
        timelineEvents: state.timelineEvents,
        currentView: state.currentView,
      }),
    }
  )
);