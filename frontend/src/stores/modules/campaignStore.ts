// Campaign Store Module - Focused on campaign management only

import { StateCreator } from 'zustand';
import { campaignService } from '../../services';
import { storeLogger } from '../../utils/logger';
import type { Campaign, CreateCampaignRequest, UpdateCampaignRequest } from '../../types';

export interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

export interface CampaignActions {
  // Campaign CRUD
  loadCampaigns: () => Promise<void>;
  createCampaign: (data: CreateCampaignRequest) => Promise<Campaign>;
  updateCampaign: (id: string, data: UpdateCampaignRequest) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  
  // Campaign selection
  selectCampaign: (campaign: Campaign | null) => void;
  
  // Search
  setSearchQuery: (query: string) => void;
  
  // Utilities
  clearCampaigns: () => void;
  getCampaignById: (id: string) => Campaign | undefined;
  getFilteredCampaigns: () => Campaign[];
}

export type CampaignSlice = CampaignState & CampaignActions;

const handleError = (error: unknown, context: string): string => {
  storeLogger.error(`Campaign store error in ${context}`, error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const createCampaignSlice: StateCreator<
  CampaignSlice,
  [],
  [],
  CampaignSlice
> = (set, get) => ({
  // Initial state
  campaigns: [],
  currentCampaign: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  // Actions
  loadCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug('Loading campaigns');
      const campaigns = await campaignService.getAllCampaigns();
      set({ campaigns, isLoading: false });
      storeLogger.info(`Loaded ${campaigns.length} campaigns`);
    } catch (error) {
      const errorMessage = handleError(error, 'loadCampaigns');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createCampaign: async (data) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug('Creating campaign', data);
      const campaign = await campaignService.createCampaign(data);
      
      set((state) => ({
        campaigns: [...state.campaigns, campaign],
        currentCampaign: campaign,
        isLoading: false,
      }));
      
      storeLogger.info(`Campaign created: ${campaign.name}`);
      return campaign;
    } catch (error) {
      const errorMessage = handleError(error, 'createCampaign');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCampaign: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Updating campaign ${id}`, data);
      const updatedCampaign = await campaignService.updateCampaign(id, data);
      
      set((state) => ({
        campaigns: state.campaigns.map(c => 
          c.id === id ? updatedCampaign : c
        ),
        currentCampaign: state.currentCampaign?.id === id ? updatedCampaign : state.currentCampaign,
        isLoading: false,
      }));
      
      storeLogger.info(`Campaign updated: ${updatedCampaign.name}`);
    } catch (error) {
      const errorMessage = handleError(error, 'updateCampaign');
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteCampaign: async (id) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Deleting campaign ${id}`);
      await campaignService.deleteCampaign(id);
      
      set((state) => ({
        campaigns: state.campaigns.filter(c => c.id !== id),
        currentCampaign: state.currentCampaign?.id === id ? null : state.currentCampaign,
        isLoading: false,
      }));
      
      storeLogger.info(`Campaign deleted: ${id}`);
    } catch (error) {
      const errorMessage = handleError(error, 'deleteCampaign');
      set({ error: errorMessage, isLoading: false });
    }
  },

  selectCampaign: (campaign) => {
    storeLogger.debug('Selecting campaign', campaign?.name || 'none');
    set({ currentCampaign: campaign });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  clearCampaigns: () => {
    set({
      campaigns: [],
      currentCampaign: null,
      searchQuery: '',
      isLoading: false,
      error: null,
    });
  },

  getCampaignById: (id) => {
    return get().campaigns.find(c => c.id === id);
  },

  getFilteredCampaigns: () => {
    const { campaigns, searchQuery } = get();
    if (!searchQuery.trim()) {
      return campaigns;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(query) ||
      campaign.description?.toLowerCase().includes(query)
    );
  },
});