// Dice Store Module - Focused on dice rolling functionality

import { StateCreator } from 'zustand';
import { diceService } from '../../services';
import { DiceRoll, type RollOptions } from '../../models/DiceRoll';
import { storeLogger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../constants/app';
import type { DiceTemplate, CreateDiceTemplateRequest } from '../../types';

export interface DiceState {
  rolls: DiceRoll[];
  templates: DiceTemplate[];
  currentExpression: string;
  showHistory: boolean;
  showTemplates: boolean;
  isRolling: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface DiceActions {
  // Dice rolling
  rollDice: (campaignId: string, expression: string, options?: RollOptions) => Promise<DiceRoll>;
  clearHistory: () => void;
  deleteRoll: (rollId: string) => Promise<void>;
  
  // Templates
  loadTemplates: (campaignId: string) => Promise<void>;
  createTemplate: (data: CreateDiceTemplateRequest) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  useTemplate: (template: DiceTemplate) => void;
  
  // UI state
  setCurrentExpression: (expression: string) => void;
  setShowHistory: (show: boolean) => void;
  setShowTemplates: (show: boolean) => void;
  
  // History management
  loadHistory: (campaignId: string) => Promise<void>;
  getRecentRolls: (limit?: number) => DiceRoll[];
  getRollsByExpression: (expression: string) => DiceRoll[];
  
  // Validation
  validateExpression: (expression: string) => { isValid: boolean; message?: string };
  
  // Utilities
  clearAll: () => void;
}

export type DiceSlice = DiceState & DiceActions;

const handleError = (error: unknown, context: string): string => {
  storeLogger.error(`Dice store error in ${context}`, error);
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const createDiceSlice: StateCreator<
  DiceSlice,
  [],
  [],
  DiceSlice
> = (set, get) => ({
  // Initial state
  rolls: [],
  templates: [],
  currentExpression: APP_CONSTANTS.DICE.DEFAULT_EXPRESSION,
  showHistory: true,
  showTemplates: false,
  isRolling: false,
  isLoading: false,
  error: null,

  // Actions
  rollDice: async (campaignId, expression, options = {}) => {
    if (!campaignId) {
      throw new Error('Campaign ID is required for dice rolls');
    }

    set({ isRolling: true, error: null });
    try {
      storeLogger.debug('Rolling dice', { campaignId, expression, options });
      const roll = await diceService.rollDice(campaignId, expression, options);
      
      set((state) => {
        const newRolls = [roll, ...state.rolls].slice(0, APP_CONSTANTS.DICE.MAX_HISTORY_SIZE);
        return {
          rolls: newRolls,
          currentExpression: expression,
          isRolling: false,
        };
      });
      
      storeLogger.info(`Dice rolled: ${expression} = ${roll.result}`);
      return roll;
    } catch (error) {
      const errorMessage = handleError(error, 'rollDice');
      set({ error: errorMessage, isRolling: false });
      throw error;
    }
  },

  clearHistory: () => {
    storeLogger.debug('Clearing dice history');
    set({ rolls: [] });
  },

  deleteRoll: async (rollId) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Deleting dice roll ${rollId}`);
      await diceService.deleteDiceRoll(rollId);
      
      set((state) => ({
        rolls: state.rolls.filter(roll => roll.id !== rollId),
        isLoading: false,
      }));
      
      storeLogger.info(`Dice roll deleted: ${rollId}`);
    } catch (error) {
      const errorMessage = handleError(error, 'deleteRoll');
      set({ error: errorMessage, isLoading: false });
    }
  },

  loadTemplates: async (campaignId) => {
    if (!campaignId) {
      storeLogger.warn('Attempted to load templates without campaign ID');
      return;
    }

    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Loading dice templates for campaign ${campaignId}`);
      const templates = await diceService.getDiceTemplates(campaignId);
      set({ templates, isLoading: false });
      storeLogger.info(`Loaded ${templates.length} dice templates`);
    } catch (error) {
      const errorMessage = handleError(error, 'loadTemplates');
      set({ error: errorMessage, isLoading: false });
    }
  },

  createTemplate: async (data) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug('Creating dice template', data);
      const template = await diceService.createDiceTemplate(data);
      
      set((state) => ({
        templates: [...state.templates, template],
        isLoading: false,
      }));
      
      storeLogger.info(`Dice template created: ${template.name}`);
    } catch (error) {
      const errorMessage = handleError(error, 'createTemplate');
      set({ error: errorMessage, isLoading: false });
    }
  },

  deleteTemplate: async (templateId) => {
    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Deleting dice template ${templateId}`);
      await diceService.deleteDiceTemplate(templateId);
      
      set((state) => ({
        templates: state.templates.filter(template => template.id !== templateId),
        isLoading: false,
      }));
      
      storeLogger.info(`Dice template deleted: ${templateId}`);
    } catch (error) {
      const errorMessage = handleError(error, 'deleteTemplate');
      set({ error: errorMessage, isLoading: false });
    }
  },

  useTemplate: (template) => {
    storeLogger.debug('Using dice template', template.name);
    set({ currentExpression: template.expression });
  },

  setCurrentExpression: (expression) => {
    set({ currentExpression: expression });
  },

  setShowHistory: (show) => {
    set({ showHistory: show });
  },

  setShowTemplates: (show) => {
    set({ showTemplates: show });
  },

  loadHistory: async (campaignId) => {
    if (!campaignId) {
      storeLogger.warn('Attempted to load history without campaign ID');
      return;
    }

    set({ isLoading: true, error: null });
    try {
      storeLogger.debug(`Loading dice history for campaign ${campaignId}`);
      const rolls = await diceService.getDiceHistory(campaignId, {
        limit: APP_CONSTANTS.DICE.MAX_HISTORY_SIZE
      });
      set({ rolls, isLoading: false });
      storeLogger.info(`Loaded ${rolls.length} dice rolls`);
    } catch (error) {
      const errorMessage = handleError(error, 'loadHistory');
      set({ error: errorMessage, isLoading: false });
    }
  },

  getRecentRolls: (limit = 10) => {
    return get().rolls.slice(0, limit);
  },

  getRollsByExpression: (expression) => {
    return get().rolls.filter(roll => roll.expression === expression);
  },

  validateExpression: (expression) => {
    return diceService.validateDiceExpression(expression);
  },

  clearAll: () => {
    set({
      rolls: [],
      templates: [],
      currentExpression: APP_CONSTANTS.DICE.DEFAULT_EXPRESSION,
      showHistory: true,
      showTemplates: false,
      isRolling: false,
      isLoading: false,
      error: null,
    });
  },
});