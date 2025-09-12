import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Campaign, Character, Location, Item, Note, Relationship, TimelineEvent, Quest, CampaignMap } from '../types';
import { 
  campaignApi, 
  characterApi, 
  locationApi, 
  itemApi, 
  noteApi, 
  relationshipApi, 
  timelineApi,
  questApi,
  mapApi,
  ApiError 
} from '../services/api';

interface CampaignState {
  // Data
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  timelineEvents: TimelineEvent[];
  quests: Quest[];
  maps: CampaignMap[];
  
  // UI State
  currentView: 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes' | 'timeline' | 'quests' | 'maps';
  
  // Loading States
  isLoading: boolean;
  error: string | null;
}

interface CampaignActions {
  // Loading helpers
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Campaign Management
  loadCampaigns: () => Promise<void>;
  createCampaign: (campaign: Omit<Campaign, 'id' | 'createdAt' | 'lastModified'>) => Promise<Campaign>;
  selectCampaign: (campaign: Campaign | null) => Promise<void>;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;

  // Character Management
  loadCharacters: (campaignId: string) => Promise<void>;
  addCharacter: (character: Omit<Character, 'id'>) => Promise<void>;
  updateCharacter: (characterId: string, updates: Partial<Character>) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;

  // Location Management
  loadLocations: (campaignId: string) => Promise<void>;
  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (locationId: string, updates: Partial<Location>) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;

  // Item Management
  loadItems: (campaignId: string) => Promise<void>;
  addItem: (item: Omit<Item, 'id'>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;

  // Notes Management
  loadNotes: (campaignId: string) => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;

  // Relationships Management
  loadRelationships: (campaignId: string) => Promise<void>;
  addRelationship: (relationship: Omit<Relationship, 'id'>) => Promise<void>;
  updateRelationship: (relationshipId: string, updates: Partial<Relationship>) => Promise<void>;
  deleteRelationship: (relationshipId: string) => Promise<void>;

  // Timeline Management
  loadTimelineEvents: (campaignId: string) => Promise<void>;
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateTimelineEvent: (eventId: string, updates: Partial<TimelineEvent>) => Promise<void>;
  deleteTimelineEvent: (eventId: string) => Promise<void>;

  // Quest Management
  loadQuests: (campaignId: string) => Promise<void>;
  addQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateQuest: (questId: string, updates: Partial<Quest>) => Promise<void>;
  deleteQuest: (questId: string) => Promise<void>;

  // Map Management
  loadMaps: (campaignId: string) => Promise<void>;
  addMap: (map: Omit<CampaignMap, 'id' | 'createdAt' | 'lastModified'>) => Promise<void>;
  updateMap: (mapId: string, updates: Partial<CampaignMap>) => Promise<void>;
  deleteMap: (mapId: string) => Promise<void>;

  // View Management
  setCurrentView: (view: 'dashboard' | 'characters' | 'locations' | 'items' | 'relationships' | 'notes' | 'timeline' | 'quests' | 'maps') => void;

  // Data Loading
  loadCampaignData: (campaignId: string) => Promise<void>;

  // Search
  search: (query: string, types?: string[]) => Promise<any>;

  // Import/Export (now uses backend)
  exportCampaign: (campaignId: string) => Promise<any>;
  importCampaignData: (data: unknown) => Promise<void>;

  // Utility Functions
  clearAll: () => void;
}

type CampaignStore = CampaignState & CampaignActions;

// Helper function to handle API errors
const handleApiError = (error: unknown, set: (state: Partial<CampaignState>) => void) => {
  if (error instanceof ApiError) {
    set({ error: error.message, isLoading: false });
  } else if (error instanceof Error) {
    set({ error: error.message, isLoading: false });
  } else {
    set({ error: 'An unknown error occurred', isLoading: false });
  }
};

// Helper to transform backend data to frontend format
const transformCampaign = (backendCampaign: any): Campaign => ({
  id: backendCampaign.id,
  name: backendCampaign.name,
  description: backendCampaign.description || '',
  createdAt: backendCampaign.created_at,
  lastModified: backendCampaign.updated_at,
});

const transformCharacter = (backendChar: any): Character => ({
  id: backendChar.id,
  campaignId: backendChar.campaign_id,
  name: backendChar.name,
  type: backendChar.type as Character['type'],
  race: backendChar.race || '',
  class: backendChar.class || '',
  level: backendChar.level || 1,
  description: backendChar.description || '',
  hp: backendChar.hp,
  ac: backendChar.ac,
  status: backendChar.status || 'alive',
  location: backendChar.location,
  tags: backendChar.tags || [],
});

const transformLocation = (backendLoc: any): Location => ({
  id: backendLoc.id,
  campaignId: backendLoc.campaign_id,
  name: backendLoc.name,
  type: backendLoc.type as Location['type'],
  description: backendLoc.description || '',
  parentId: backendLoc.parent_location,
  tags: backendLoc.tags || [],
});

const transformItem = (backendItem: any): Item => ({
  id: backendItem.id,
  campaignId: backendItem.campaign_id,
  name: backendItem.name,
  type: backendItem.type as Item['type'],
  description: backendItem.description || '',
  quantity: backendItem.quantity || 1,
  value: backendItem.value || 0,
  weight: backendItem.weight || 0,
  rarity: backendItem.rarity as Item['rarity'] || 'common',
  properties: backendItem.properties || {},
  owner: backendItem.owner,
  location: backendItem.location,
  tags: backendItem.tags || [],
});

const transformNote = (backendNote: any): Note => ({
  id: backendNote.id,
  campaignId: backendNote.campaign_id,
  title: backendNote.title,
  content: backendNote.content,
  createdAt: backendNote.created_at,
  lastModified: backendNote.updated_at,
  tags: backendNote.tags || [],
});

export const useApiCampaignStore = create<CampaignStore>()(
  persist(
    (set, get) => ({
      // State
      campaigns: [],
      currentCampaign: null,
      characters: [],
      locations: [],
      items: [],
      notes: [],
      relationships: [],
      timelineEvents: [],
      quests: [],
      maps: [],
      currentView: 'dashboard',
      isLoading: false,
      error: null,

      // Loading helpers
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Campaign Actions
      loadCampaigns: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await campaignApi.list();
          const campaigns = response.data.map(transformCampaign);
          set({ campaigns, isLoading: false });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      createCampaign: async (campaignData) => {
        set({ isLoading: true, error: null });
        try {
          const backendCampaign = await campaignApi.create({
            name: campaignData.name,
            description: campaignData.description,
          });
          const campaign = transformCampaign(backendCampaign);
          
          set((state) => ({
            campaigns: [...state.campaigns, campaign],
            currentCampaign: campaign,
            isLoading: false,
          }));
          
          return campaign;
        } catch (error) {
          handleApiError(error, set);
          throw error;
        }
      },

      selectCampaign: async (campaign) => {
        set({ currentCampaign: campaign, isLoading: true, error: null });
        if (campaign) {
          await get().loadCampaignData(campaign.id);
        } else {
          set({ 
            characters: [],
            locations: [],
            items: [],
            notes: [],
            relationships: [],
            timelineEvents: [],
            quests: [],
            maps: [],
            isLoading: false 
          });
        }
      },

      updateCampaign: async (campaignId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const backendCampaign = await campaignApi.update(campaignId, updates);
          const updatedCampaign = transformCampaign(backendCampaign);
          
          set((state) => ({
            campaigns: state.campaigns.map(c => 
              c.id === campaignId ? updatedCampaign : c
            ),
            currentCampaign: state.currentCampaign?.id === campaignId ? updatedCampaign : state.currentCampaign,
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteCampaign: async (campaignId) => {
        set({ isLoading: true, error: null });
        try {
          await campaignApi.delete(campaignId);
          set((state) => ({
            campaigns: state.campaigns.filter(c => c.id !== campaignId),
            currentCampaign: state.currentCampaign?.id === campaignId ? null : state.currentCampaign,
            characters: state.currentCampaign?.id === campaignId ? [] : state.characters,
            locations: state.currentCampaign?.id === campaignId ? [] : state.locations,
            items: state.currentCampaign?.id === campaignId ? [] : state.items,
            notes: state.currentCampaign?.id === campaignId ? [] : state.notes,
            relationships: state.currentCampaign?.id === campaignId ? [] : state.relationships,
            timelineEvents: state.currentCampaign?.id === campaignId ? [] : state.timelineEvents,
            quests: state.currentCampaign?.id === campaignId ? [] : state.quests,
            maps: state.currentCampaign?.id === campaignId ? [] : state.maps,
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Load all campaign data
      loadCampaignData: async (campaignId) => {
        try {
          await Promise.all([
            get().loadCharacters(campaignId),
            get().loadLocations(campaignId),
            get().loadItems(campaignId),
            get().loadNotes(campaignId),
            get().loadRelationships(campaignId),
            get().loadTimelineEvents(campaignId),
            get().loadQuests(campaignId),
            get().loadMaps(campaignId),
          ]);
          set({ isLoading: false });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Character Actions
      loadCharacters: async (campaignId) => {
        try {
          const response = await characterApi.list(campaignId);
          const characters = response.data.map(transformCharacter);
          set({ characters });
        } catch (error) {
          // Don't set loading to false here, let loadCampaignData handle it
          console.error('Failed to load characters:', error);
        }
      },

      addCharacter: async (characterData) => {
        const { currentCampaign } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const backendChar = await characterApi.create(currentCampaign.id, characterData);
          const character = transformCharacter(backendChar);
          
          set((state) => ({
            characters: [...state.characters, character],
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateCharacter: async (characterId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const backendChar = await characterApi.update(characterId, updates);
          const character = transformCharacter(backendChar);
          
          set((state) => ({
            characters: state.characters.map(c => 
              c.id === characterId ? character : c
            ),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteCharacter: async (characterId) => {
        set({ isLoading: true, error: null });
        try {
          await characterApi.delete(characterId);
          set((state) => ({
            characters: state.characters.filter(c => c.id !== characterId),
            relationships: state.relationships.filter(
              r => r.from !== characterId && r.to !== characterId
            ),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Location Actions
      loadLocations: async (campaignId) => {
        try {
          const response = await locationApi.list(campaignId);
          const locations = response.data.map(transformLocation);
          set({ locations });
        } catch (error) {
          console.error('Failed to load locations:', error);
        }
      },

      addLocation: async (locationData) => {
        const { currentCampaign } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const backendLoc = await locationApi.create(currentCampaign.id, locationData);
          const location = transformLocation(backendLoc);
          
          set((state) => ({
            locations: [...state.locations, location],
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateLocation: async (locationId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const backendLoc = await locationApi.update(locationId, updates);
          const location = transformLocation(backendLoc);
          
          set((state) => ({
            locations: state.locations.map(l => 
              l.id === locationId ? location : l
            ),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteLocation: async (locationId) => {
        set({ isLoading: true, error: null });
        try {
          await locationApi.delete(locationId);
          set((state) => ({
            locations: state.locations.filter(l => l.id !== locationId),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Item Actions
      loadItems: async (campaignId) => {
        try {
          const response = await itemApi.list(campaignId);
          const items = response.data.map(transformItem);
          set({ items });
        } catch (error) {
          console.error('Failed to load items:', error);
        }
      },

      addItem: async (itemData) => {
        const { currentCampaign } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const backendItem = await itemApi.create(currentCampaign.id, itemData);
          const item = transformItem(backendItem);
          
          set((state) => ({
            items: [...state.items, item],
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateItem: async (itemId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const backendItem = await itemApi.update(itemId, updates);
          const item = transformItem(backendItem);
          
          set((state) => ({
            items: state.items.map(i => 
              i.id === itemId ? item : i
            ),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteItem: async (itemId) => {
        set({ isLoading: true, error: null });
        try {
          await itemApi.delete(itemId);
          set((state) => ({
            items: state.items.filter(i => i.id !== itemId),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Note Actions
      loadNotes: async (campaignId) => {
        try {
          const response = await noteApi.list(campaignId);
          const notes = response.data.map(transformNote);
          set({ notes });
        } catch (error) {
          console.error('Failed to load notes:', error);
        }
      },

      addNote: async (noteData) => {
        const { currentCampaign } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const backendNote = await noteApi.create(currentCampaign.id, noteData);
          const note = transformNote(backendNote);
          
          set((state) => ({
            notes: [...state.notes, note],
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateNote: async (noteId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const backendNote = await noteApi.update(noteId, updates);
          const note = transformNote(backendNote);
          
          set((state) => ({
            notes: state.notes.map(n => 
              n.id === noteId ? note : n
            ),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteNote: async (noteId) => {
        set({ isLoading: true, error: null });
        try {
          await noteApi.delete(noteId);
          set((state) => ({
            notes: state.notes.filter(n => n.id !== noteId),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Relationship Actions (simplified for now)
      loadRelationships: async (campaignId) => {
        try {
          const response = await relationshipApi.list(campaignId);
          const relationships = response.data || [];
          set({ relationships });
        } catch (error) {
          console.error('Failed to load relationships:', error);
        }
      },

      addRelationship: async (relationshipData) => {
        const { currentCampaign } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const relationship = await relationshipApi.create(currentCampaign.id, relationshipData);
          set((state) => ({
            relationships: [...state.relationships, relationship],
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateRelationship: async (relationshipId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const relationship = await relationshipApi.update(relationshipId, updates);
          set((state) => ({
            relationships: state.relationships.map(r => 
              r.id === relationshipId ? relationship : r
            ),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteRelationship: async (relationshipId) => {
        set({ isLoading: true, error: null });
        try {
          await relationshipApi.delete(relationshipId);
          set((state) => ({
            relationships: state.relationships.filter(r => r.id !== relationshipId),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Timeline Actions (simplified for now)
      loadTimelineEvents: async (campaignId) => {
        try {
          const response = await timelineApi.list(campaignId);
          const timelineEvents = response.data || [];
          set({ timelineEvents });
        } catch (error) {
          console.error('Failed to load timeline events:', error);
        }
      },

      addTimelineEvent: async (eventData) => {
        const { currentCampaign } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const event = await timelineApi.create(currentCampaign.id, eventData);
          set((state) => ({
            timelineEvents: [...state.timelineEvents, event],
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateTimelineEvent: async (eventId, updates) => {
        set({ isLoading: true, error: null });
        try {
          const event = await timelineApi.update(eventId, updates);
          set((state) => ({
            timelineEvents: state.timelineEvents.map(e => 
              e.id === eventId ? event : e
            ),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteTimelineEvent: async (eventId) => {
        set({ isLoading: true, error: null });
        try {
          await timelineApi.delete(eventId);
          set((state) => ({
            timelineEvents: state.timelineEvents.filter(e => e.id !== eventId),
            isLoading: false,
          }));
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Quest Actions (local storage for now)
      loadQuests: async (campaignId) => {
        try {
          // For now, use local storage until backend quest API is implemented
          const storedQuests = localStorage.getItem(`quests_${campaignId}`);
          const quests = storedQuests ? JSON.parse(storedQuests) : [];
          set({ quests });
        } catch (error) {
          console.error('Failed to load quests:', error);
          set({ quests: [] });
        }
      },

      addQuest: async (questData) => {
        const { currentCampaign, quests } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const newQuest = {
            ...questData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
          };
          
          const updatedQuests = [...quests, newQuest];
          localStorage.setItem(`quests_${currentCampaign.id}`, JSON.stringify(updatedQuests));
          
          set({
            quests: updatedQuests,
            isLoading: false,
          });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateQuest: async (questId, updates) => {
        const { currentCampaign, quests } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const updatedQuests = quests.map(quest => 
            quest.id === questId 
              ? { ...quest, ...updates, lastModified: new Date().toISOString() }
              : quest
          );
          
          localStorage.setItem(`quests_${currentCampaign.id}`, JSON.stringify(updatedQuests));
          
          set({
            quests: updatedQuests,
            isLoading: false,
          });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteQuest: async (questId) => {
        const { currentCampaign, quests } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          const updatedQuests = quests.filter(quest => quest.id !== questId);
          localStorage.setItem(`quests_${currentCampaign.id}`, JSON.stringify(updatedQuests));
          
          set({
            quests: updatedQuests,
            isLoading: false,
          });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Map Actions
      loadMaps: async (campaignId) => {
        try {
          const result = await mapApi.list(campaignId);
          set({ maps: result.data || [] });
        } catch (error) {
          console.error('Failed to load maps:', error);
          set({ maps: [] });
        }
      },

      addMap: async (mapData) => {
        const { currentCampaign, maps } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        set({ isLoading: true, error: null });
        try {
          // mapData should include the imageFile for upload
          const newMap = await mapApi.create(currentCampaign.id, mapData);
          
          set({
            maps: [...maps, newMap],
            isLoading: false,
          });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      updateMap: async (mapId, updates) => {
        const { maps } = get();

        set({ isLoading: true, error: null });
        try {
          const updatedMap = await mapApi.update(mapId, updates);
          
          const updatedMaps = maps.map(map => 
            map.id === mapId ? updatedMap : map
          );
          
          set({
            maps: updatedMaps,
            isLoading: false,
          });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      deleteMap: async (mapId) => {
        const { maps } = get();

        set({ isLoading: true, error: null });
        try {
          await mapApi.delete(mapId);
          
          const updatedMaps = maps.filter(map => map.id !== mapId);
          
          set({
            maps: updatedMaps,
            isLoading: false,
          });
        } catch (error) {
          handleApiError(error, set);
        }
      },

      // Search
      search: async (query, types) => {
        const { currentCampaign } = get();
        if (!currentCampaign) throw new Error('No campaign selected');

        try {
          return await campaignApi.search(currentCampaign.id, query, types);
        } catch (error) {
          throw error;
        }
      },

      // Export/Import
      exportCampaign: async (campaignId) => {
        try {
          return await campaignApi.export(campaignId);
        } catch (error) {
          throw error;
        }
      },

      importCampaignData: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await campaignApi.import(data);
          // Reload campaigns after import
          await get().loadCampaigns();
        } catch (error) {
          handleApiError(error, set);
          throw error;
        }
      },

      // View Management
      setCurrentView: (view) => set({ currentView: view }),

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
          quests: [],
          maps: [],
          currentView: 'dashboard',
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'campaign-chronicle-api-storage',
      partialize: (state) => ({
        currentCampaign: state.currentCampaign,
        currentView: state.currentView,
      }),
    }
  )
);