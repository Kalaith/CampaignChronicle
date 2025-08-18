import { useState, useEffect } from 'react';
import type { Campaign, Character, Location, Item, Note, Relationship, ViewType } from '../types';

// Storage helpers
const STORAGE_KEY = 'campaign-chronicle';

interface AppState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
}

const initialState: AppState = {
  campaigns: [],
  currentCampaign: null,
  characters: [],
  locations: [],
  items: [],
  notes: [],
  relationships: [],
};

export const useCampaignData = () => {
  const [state, setState] = useState<AppState>(initialState);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setState(parsed);
      } catch (error) {
        console.error('Failed to parse saved data:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever state changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Campaign operations
  const createCampaign = (name: string, description: string) => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      campaigns: [...prev.campaigns, newCampaign],
    }));

    return newCampaign;
  };

  const selectCampaign = (campaign: Campaign | null) => {
    setState(prev => ({ ...prev, currentCampaign: campaign }));
  };

  const deleteCampaign = (campaignId: string) => {
    setState(prev => ({
      ...prev,
      campaigns: prev.campaigns.filter(c => c.id !== campaignId),
      currentCampaign: prev.currentCampaign?.id === campaignId ? null : prev.currentCampaign,
      // Clear related data
      characters: prev.characters.filter(c => c.campaignId !== campaignId),
      locations: prev.locations.filter(l => l.campaignId !== campaignId),
      items: prev.items.filter(i => i.campaignId !== campaignId),
      notes: prev.notes.filter(n => n.campaignId !== campaignId),
      relationships: prev.relationships.filter(r => r.campaignId !== campaignId),
    }));
  };

  // Character operations
  const addCharacter = (character: Omit<Character, 'id'>) => {
    const newCharacter: Character = {
      ...character,
      id: Date.now().toString(),
    };

    setState(prev => ({
      ...prev,
      characters: [...prev.characters, newCharacter],
    }));
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const deleteCharacter = (id: string) => {
    setState(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id),
      relationships: prev.relationships.filter(r => r.from !== id && r.to !== id),
    }));
  };

  // Location operations
  const addLocation = (location: Omit<Location, 'id'>) => {
    const newLocation: Location = {
      ...location,
      id: Date.now().toString(),
    };

    setState(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation],
    }));
  };

  const updateLocation = (id: string, updates: Partial<Location>) => {
    setState(prev => ({
      ...prev,
      locations: prev.locations.map(l => 
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  };

  const deleteLocation = (id: string) => {
    setState(prev => ({
      ...prev,
      locations: prev.locations.filter(l => l.id !== id),
    }));
  };

  // Item operations
  const addItem = (item: Omit<Item, 'id'>) => {
    const newItem: Item = {
      ...item,
      id: Date.now().toString(),
    };

    setState(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => 
        i.id === id ? { ...i, ...updates } : i
      ),
    }));
  };

  const deleteItem = (id: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(i => i.id !== id),
    }));
  };

  // Note operations
  const addNote = (note: Omit<Note, 'id' | 'createdAt' | 'lastModified'>) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      notes: [...prev.notes, newNote],
    }));
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.map(n => 
        n.id === id ? { ...n, ...updates, lastModified: new Date().toISOString() } : n
      ),
    }));
  };

  const deleteNote = (id: string) => {
    setState(prev => ({
      ...prev,
      notes: prev.notes.filter(n => n.id !== id),
    }));
  };

  // Relationship operations
  const addRelationship = (relationship: Omit<Relationship, 'id'>) => {
    const newRelationship: Relationship = {
      ...relationship,
      id: Date.now().toString(),
    };

    setState(prev => ({
      ...prev,
      relationships: [...prev.relationships, newRelationship],
    }));
  };

  const deleteRelationship = (id: string) => {
    setState(prev => ({
      ...prev,
      relationships: prev.relationships.filter(r => r.id !== id),
    }));
  };

  // Filtered data for current campaign
  const currentCampaignData = state.currentCampaign ? {
    characters: state.characters.filter(c => c.campaignId === state.currentCampaign!.id),
    locations: state.locations.filter(l => l.campaignId === state.currentCampaign!.id),
    items: state.items.filter(i => i.campaignId === state.currentCampaign!.id),
    notes: state.notes.filter(n => n.campaignId === state.currentCampaign!.id),
    relationships: state.relationships.filter(r => r.campaignId === state.currentCampaign!.id),
  } : null;

  return {
    // State
    campaigns: state.campaigns,
    currentCampaign: state.currentCampaign,
    currentView,
    currentCampaignData,
    isLoaded,
    
    // Actions
    setCurrentView,
    createCampaign,
    selectCampaign,
    deleteCampaign,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addLocation,
    updateLocation,
    deleteLocation,
    addItem,
    updateItem,
    deleteItem,
    addNote,
    updateNote,
    deleteNote,
    addRelationship,
    deleteRelationship,
  };
};
