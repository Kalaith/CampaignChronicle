import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Campaign, Character, Location, Item, Note, Relationship, TimelineEvent, Quest, CampaignMap, ViewType } from '../types';
import {
  campaignApi,
  characterApi,
  locationApi,
  itemApi,
  noteApi,
  relationshipApi,
  timelineApi,
  mapApi,
} from '../services/api';
import { errorHandler } from '../utils/errors';
import { storeLogger } from '../utils/logger';

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
  currentView: ViewType;
  
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
  addMap: (map: Omit<CampaignMap, 'id' | 'createdAt' | 'lastModified'> & { imageFile?: File }) => Promise<void>;
  updateMap: (mapId: string, updates: Partial<CampaignMap>) => Promise<void>;
  deleteMap: (mapId: string) => Promise<void>;

  // View Management
  setCurrentView: (view: ViewType) => void;

  // Data Loading
  loadCampaignData: (campaignId: string) => Promise<void>;

  // Search
  search: (query: string, types?: string[]) => Promise<unknown>;

  // Import/Export (now uses backend)
  exportCampaign: (campaignId: string) => Promise<unknown>;
  importCampaignData: (data: unknown) => Promise<void>;

  // Utility Functions
  clearAll: () => void;
}

type CampaignStore = CampaignState & CampaignActions;

// Helper function to handle errors using new error handling system
const handleStoreError = (error: unknown, context: string, set: (state: Partial<CampaignState>) => void) => {
  const appError = errorHandler.normalize(error, context);
  storeLogger.error(`Store error in ${context}`, appError);
  set({ error: appError.userMessage, isLoading: false });
};

const handleApiError = (error: unknown, set: (state: Partial<CampaignState>) => void) => {
  handleStoreError(error, 'apiCampaignStore', set);
};

type BackendRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const transformCampaign = (backendCampaign: BackendRecord): Campaign => ({
  id: asString(backendCampaign.id),
  name: asString(backendCampaign.name),
  description: asString(backendCampaign.description),
  createdAt: asString(backendCampaign.created_at ?? backendCampaign.createdAt),
  lastModified: asString(backendCampaign.updated_at ?? backendCampaign.lastModified),
});

const transformCharacter = (backendChar: BackendRecord): Character => ({
  id: asString(backendChar.id),
  campaignId: asString(backendChar.campaign_id),
  name: asString(backendChar.name),
  type: (asString(backendChar.type, 'NPC') as Character['type']),
  race: asString(backendChar.race),
  class: asString(backendChar.class),
  level: asNumber(backendChar.level, 1),
  description: asString(backendChar.description),
  hp: typeof backendChar.hp === 'number' ? backendChar.hp : undefined,
  ac: typeof backendChar.ac === 'number' ? backendChar.ac : undefined,
  status: (asString(backendChar.status, 'alive') as Character['status']),
  location: typeof backendChar.location === 'string' ? backendChar.location : undefined,
  tags: asStringArray(backendChar.tags),
});

const transformLocation = (backendLoc: BackendRecord): Location => ({
  id: asString(backendLoc.id),
  campaignId: asString(backendLoc.campaign_id),
  name: asString(backendLoc.name),
  type: (asString(backendLoc.type, 'City') as Location['type']),
  description: asString(backendLoc.description),
  parentId: typeof backendLoc.parent_location === 'string' ? backendLoc.parent_location : undefined,
  tags: asStringArray(backendLoc.tags),
});

const transformItem = (backendItem: BackendRecord): Item => ({
  id: asString(backendItem.id),
  campaignId: asString(backendItem.campaign_id),
  name: asString(backendItem.name),
  type: (asString(backendItem.type, 'Tool') as Item['type']),
  description: asString(backendItem.description),
  owner: typeof backendItem.owner === 'string' ? backendItem.owner : undefined,
  location: typeof backendItem.location === 'string' ? backendItem.location : undefined,
  tags: asStringArray(backendItem.tags),
});

const transformNote = (backendNote: BackendRecord): Note => ({
  id: asString(backendNote.id),
  campaignId: asString(backendNote.campaign_id),
  title: asString(backendNote.title),
  content: asString(backendNote.content),
  createdAt: asString(backendNote.created_at),
  lastModified: asString(backendNote.updated_at),
  tags: asStringArray(backendNote.tags),
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
          storeLogger.debug('Loading campaigns');
          const response = await campaignApi.list();
          const campaigns = response.data.map((campaign) => transformCampaign(campaign as BackendRecord));
          set({ campaigns, isLoading: false });
          storeLogger.info(`Loaded ${campaigns.length} campaigns`);
        } catch (error) {
          handleStoreError(error, 'loadCampaigns', set);
        }
      },

      createCampaign: async (campaignData) => {
        set({ isLoading: true, error: null });
        try {
          storeLogger.debug('Creating campaign', campaignData);
          const createdCampaign = await campaignApi.create({
            name: campaignData.name,
            description: campaignData.description || '',
          });
          const campaign = transformCampaign(createdCampaign as BackendRecord);
          
          set((state) => ({
            campaigns: [...state.campaigns, campaign],
            currentCampaign: campaign,
            isLoading: false,
          }));
          
          storeLogger.info(`Campaign created: ${campaign.name}`);
          return campaign;
        } catch (error) {
          handleStoreError(error, 'createCampaign', set);
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
          storeLogger.debug(`Updating campaign ${campaignId}`, updates);
          const backendCampaign = await campaignApi.update(campaignId, {
            name: updates.name,
            description: updates.description,
          });
          const updatedCampaign = transformCampaign(backendCampaign as BackendRecord);
          
          set((state) => ({
            campaigns: state.campaigns.map(c => 
              c.id === campaignId ? updatedCampaign : c
            ),
            currentCampaign: state.currentCampaign?.id === campaignId ? updatedCampaign : state.currentCampaign,
            isLoading: false,
          }));
          
          storeLogger.info(`Campaign updated: ${updatedCampaign.name}`);
        } catch (error) {
          handleStoreError(error, 'updateCampaign', set);
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
          const characters = response.data.map((record) => transformCharacter(record as BackendRecord));
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
          const character = transformCharacter(backendChar as BackendRecord);
          
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
          const character = transformCharacter(backendChar as BackendRecord);
          
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
          const locations = response.data.map((record) => transformLocation(record as BackendRecord));
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
          const location = transformLocation(backendLoc as BackendRecord);
          
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
          const location = transformLocation(backendLoc as BackendRecord);
          
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
          const items = response.data.map((record) => transformItem(record as BackendRecord));
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
          const item = transformItem(backendItem as BackendRecord);
          
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
          const item = transformItem(backendItem as BackendRecord);
          
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
          const notes = response.data.map((record) => transformNote(record as BackendRecord));
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
          const note = transformNote(backendNote as BackendRecord);
          
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
          const note = transformNote(backendNote as BackendRecord);
          
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
          const relationships = (response.data || []) as Relationship[];
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
          const relationship = await relationshipApi.create(currentCampaign.id, relationshipData) as Relationship;
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
          const relationship = await relationshipApi.update(relationshipId, updates) as Relationship;
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
          const timelineEvents = (response.data || []) as TimelineEvent[];
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
          const event = await timelineApi.create(currentCampaign.id, eventData) as TimelineEvent;
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
          const event = await timelineApi.update(eventId, updates) as TimelineEvent;
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
          set({ maps: (result.data || []) as CampaignMap[] });
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
          const newMap = mapData.imageFile
            ? (await mapApi.create(currentCampaign.id, {
                name: mapData.name,
                description: mapData.description,
                imageFile: mapData.imageFile,
              })) as CampaignMap
            : ({
                ...mapData,
                id: crypto.randomUUID(),
                campaignId: currentCampaign.id,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
              } as CampaignMap);
          
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
          const updatedMap = await mapApi.update(mapId, updates) as CampaignMap;
          
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
        return campaignApi.search(currentCampaign.id, query, types);
      },

      // Export/Import
      exportCampaign: async (campaignId) => {
        return campaignApi.export(campaignId);
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
