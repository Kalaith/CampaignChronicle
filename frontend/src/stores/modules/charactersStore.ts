// Characters Store Module - Focused on character management only

import { StateCreator } from 'zustand';
import { characterService } from '../../services';
import { storeLogger } from '../../utils/logger';
import type { Character, CreateCharacterRequest, UpdateCharacterRequest } from '../../types';
import type { CharacterFilterOptions } from '../../services/CharacterService';

export interface CharactersState {
  characters: Character[];
  selectedCharacter: Character | null;
  filterType: 'PC' | 'NPC' | 'Villain' | 'Ally' | 'all';
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

export interface CharactersActions {
  // Character CRUD
  loadCharacters: (campaignId: string) => Promise<void>;
  createCharacter: (data: CreateCharacterRequest) => Promise<Character>;
  updateCharacter: (id: string, data: UpdateCharacterRequest) => Promise<void>;
  deleteCharacter: (id: string) => Promise<void>;
  
  // Character selection and filtering
  selectCharacter: (character: Character | null) => void;
  setFilterType: (filterType: CharactersState['filterType']) => void;
  setSearchQuery: (query: string) => void;
  
  // Utilities
  clearCharacters: () => void;
  getCharacterById: (id: string) => Character | undefined;
  getFilteredCharacters: () => Character[];
  getCharactersByType: (type: Character['type']) => Character[];
  getAliveCharacters: () => Character[];
}

export type CharactersSlice = CharactersState & CharactersActions;

const handleError = (error: unknown, context: string): string => {
  storeLogger.error(`Characters store error in ${context}`, error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const createCharactersSlice: StateCreator<
  CharactersSlice,
  [],
  [],
  CharactersSlice
> = (set, get) => ({
  // Initial state
  characters: [],
  selectedCharacter: null,
  filterType: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  // Actions
  loadCharacters: async (campaignId) => {
    if (!campaignId) {
      storeLogger.warn('Attempted to load characters without campaign ID');
      return;
    }

    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Loading characters for campaign ${campaignId}`);
      const characters = await characterService.getCharacters(campaignId);
      set({ characters, isLoading: false });
      storeLogger.info(`Loaded ${characters.length} characters`);
    } catch (error) {
      const errorMessage = handleError(error, 'loadCharacters');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createCharacter: async (data) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug('Creating character', data);
      const character = await characterService.createCharacter(data);
      
      set((state) => ({
        characters: [...state.characters, character],
        selectedCharacter: character,
        isLoading: false,
      }));
      
      storeLogger.info(`Character created: ${character.name}`);
      return character;
    } catch (error) {
      const errorMessage = handleError(error, 'createCharacter');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCharacter: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Updating character ${id}`, data);
      const updatedCharacter = await characterService.updateCharacter(id, data);
      
      set((state) => ({
        characters: state.characters.map(c => 
          c.id === id ? updatedCharacter : c
        ),
        selectedCharacter: state.selectedCharacter?.id === id ? updatedCharacter : state.selectedCharacter,
        isLoading: false,
      }));
      
      storeLogger.info(`Character updated: ${updatedCharacter.name}`);
    } catch (error) {
      const errorMessage = handleError(error, 'updateCharacter');
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteCharacter: async (id) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Deleting character ${id}`);
      await characterService.deleteCharacter(id);
      
      set((state) => ({
        characters: state.characters.filter(c => c.id !== id),
        selectedCharacter: state.selectedCharacter?.id === id ? null : state.selectedCharacter,
        isLoading: false,
      }));
      
      storeLogger.info(`Character deleted: ${id}`);
    } catch (error) {
      const errorMessage = handleError(error, 'deleteCharacter');
      set({ error: errorMessage, isLoading: false });
    }
  },

  selectCharacter: (character) => {
    storeLogger.debug('Selecting character', character?.name || 'none');
    set({ selectedCharacter: character });
  },

  setFilterType: (filterType) => {
    set({ filterType });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  clearCharacters: () => {
    set({
      characters: [],
      selectedCharacter: null,
      filterType: 'all',
      searchQuery: '',
      isLoading: false,
      error: null,
    });
  },

  getCharacterById: (id) => {
    return get().characters.find(c => c.id === id);
  },

  getFilteredCharacters: () => {
    const { characters, filterType, searchQuery } = get();
    let filtered = characters;

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(character => character.type === filterType);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(character =>
        character.name.toLowerCase().includes(query) ||
        character.race?.toLowerCase().includes(query) ||
        character.class?.toLowerCase().includes(query) ||
        character.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  },

  getCharactersByType: (type) => {
    return get().characters.filter(character => character.type === type);
  },

  getAliveCharacters: () => {
    return get().characters.filter(character => 
      character.status !== 'dead' && (character.hp || 0) > 0
    );
  },
});