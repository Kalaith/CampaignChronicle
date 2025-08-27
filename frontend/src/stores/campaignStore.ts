import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Campaign, Character, Location, Item, Note, Relationship } from '../types';

interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  currentView: 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes';
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

  // View Management
  setCurrentView: (view: 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes') => void;

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

      // View Management
      setCurrentView: (view) =>
        set({ currentView: view }),

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
        currentView: state.currentView,
      }),
    }
  )
);