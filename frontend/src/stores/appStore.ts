// Modern App Store - Composed from focused modules using new infrastructure

import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import { createCampaignSlice, type CampaignSlice } from './modules/campaignStore';
import { createCharactersSlice, type CharactersSlice } from './modules/charactersStore';
import { createDiceSlice, type DiceSlice } from './modules/diceStore';
import { createUISlice, type UISlice } from './modules/uiStore';
import { storeLogger } from '../utils/logger';

// Combined store type
export type AppStore = CampaignSlice & CharactersSlice & DiceSlice & UISlice;

// Create the combined store
export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...args) => ({
          // Combine all slices
          ...createCampaignSlice(...args),
          ...createCharactersSlice(...args),
          ...createDiceSlice(...args),
          ...createUISlice(...args),
        }),
        {
          name: 'campaign-chronicle-app-store',
          // Only persist specific parts of the store
          partialize: (state) => ({
            // Campaign state
            currentCampaign: state.currentCampaign,
            
            // UI preferences
            currentView: state.currentView,
            sidebarCollapsed: state.sidebarCollapsed,
            sidebarWidth: state.sidebarWidth,
            theme: state.theme,
            
            // Dice preferences
            currentExpression: state.currentExpression,
            showHistory: state.showHistory,
            showTemplates: state.showTemplates,
            
            // Character filters
            filterType: state.filterType,
          }),
          onRehydrateStorage: () => {
            storeLogger.info('Store rehydrating from persistence');
            return (state, error) => {
              if (error) {
                storeLogger.error('Store rehydration failed', error);
              } else {
                storeLogger.info('Store rehydrated successfully');
              }
            };
          },
        }
      )
    ),
    {
      name: 'campaign-chronicle-store',
    }
  )
);

// Selector hooks for better performance and type safety
export const useCampaignState = () => useAppStore((state) => ({
  campaigns: state.campaigns,
  currentCampaign: state.currentCampaign,
  searchQuery: state.searchQuery,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useCampaignActions = () => useAppStore((state) => ({
  loadCampaigns: state.loadCampaigns,
  createCampaign: state.createCampaign,
  updateCampaign: state.updateCampaign,
  deleteCampaign: state.deleteCampaign,
  selectCampaign: state.selectCampaign,
  setSearchQuery: state.setSearchQuery,
  clearCampaigns: state.clearCampaigns,
  getCampaignById: state.getCampaignById,
  getFilteredCampaigns: state.getFilteredCampaigns,
}));

export const useCharactersState = () => useAppStore((state) => ({
  characters: state.characters,
  selectedCharacter: state.selectedCharacter,
  filterType: state.filterType,
  searchQuery: state.searchQuery,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useCharactersActions = () => useAppStore((state) => ({
  loadCharacters: state.loadCharacters,
  createCharacter: state.createCharacter,
  updateCharacter: state.updateCharacter,
  deleteCharacter: state.deleteCharacter,
  selectCharacter: state.selectCharacter,
  setFilterType: state.setFilterType,
  setSearchQuery: state.setSearchQuery,
  clearCharacters: state.clearCharacters,
  getCharacterById: state.getCharacterById,
  getFilteredCharacters: state.getFilteredCharacters,
  getCharactersByType: state.getCharactersByType,
  getAliveCharacters: state.getAliveCharacters,
}));

export const useDiceState = () => useAppStore((state) => ({
  rolls: state.rolls,
  templates: state.templates,
  currentExpression: state.currentExpression,
  showHistory: state.showHistory,
  showTemplates: state.showTemplates,
  isRolling: state.isRolling,
  isLoading: state.isLoading,
  error: state.error,
}));

export const useDiceActions = () => useAppStore((state) => ({
  rollDice: state.rollDice,
  clearHistory: state.clearHistory,
  deleteRoll: state.deleteRoll,
  loadTemplates: state.loadTemplates,
  createTemplate: state.createTemplate,
  deleteTemplate: state.deleteTemplate,
  useTemplate: state.useTemplate,
  setCurrentExpression: state.setCurrentExpression,
  setShowHistory: state.setShowHistory,
  setShowTemplates: state.setShowTemplates,
  loadHistory: state.loadHistory,
  getRecentRolls: state.getRecentRolls,
  getRollsByExpression: state.getRollsByExpression,
  validateExpression: state.validateExpression,
  clearAll: state.clearAll,
}));

export const useUIState = () => useAppStore((state) => ({
  currentView: state.currentView,
  previousView: state.previousView,
  isLoading: state.isLoading,
  loadingMessage: state.loadingMessage,
  error: state.error,
  errorContext: state.errorContext,
  activeModal: state.activeModal,
  modalData: state.modalData,
  sidebarCollapsed: state.sidebarCollapsed,
  sidebarWidth: state.sidebarWidth,
  toasts: state.toasts,
  isMobile: state.isMobile,
  screenSize: state.screenSize,
  theme: state.theme,
  globalSearchOpen: state.globalSearchOpen,
  globalSearchQuery: state.globalSearchQuery,
}));

export const useUIActions = () => useAppStore((state) => ({
  setCurrentView: state.setCurrentView,
  goBack: state.goBack,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  openModal: state.openModal,
  closeModal: state.closeModal,
  toggleSidebar: state.toggleSidebar,
  setSidebarCollapsed: state.setSidebarCollapsed,
  setSidebarWidth: state.setSidebarWidth,
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts,
  setScreenSize: state.setScreenSize,
  setIsMobile: state.setIsMobile,
  setTheme: state.setTheme,
  setGlobalSearchOpen: state.setGlobalSearchOpen,
  setGlobalSearchQuery: state.setGlobalSearchQuery,
  getActiveToasts: state.getActiveToasts,
  isModalOpen: state.isModalOpen,
}));

// Computed selectors for complex derived state
export const useCurrentCampaignData = () => useAppStore((state) => {
  if (!state.currentCampaign) return null;
  
  const campaignCharacters = state.characters.filter(
    char => char.campaignId === state.currentCampaign!.id
  );
  
  const campaignRolls = state.rolls.filter(
    roll => roll.campaignId === state.currentCampaign!.id
  );
  
  return {
    campaign: state.currentCampaign,
    characters: campaignCharacters,
    rolls: campaignRolls,
    characterCount: campaignCharacters.length,
    recentRollsCount: campaignRolls.slice(0, 10).length,
  };
});

export const useAppStatus = () => useAppStore((state) => ({
  isAnyLoading: state.isLoading,
  hasErrors: Boolean(state.error),
  activeModals: state.activeModal ? [state.activeModal] : [],
  toastCount: state.toasts.length,
}));

// Subscription helpers for side effects
export const subscribeToCurrentCampaign = (callback: (campaign: any) => void) => {
  return useAppStore.subscribe(
    (state) => state.currentCampaign,
    callback,
    { fireImmediately: true }
  );
};

export const subscribeToErrors = (callback: (error: string | null) => void) => {
  return useAppStore.subscribe(
    (state) => state.error,
    callback
  );
};