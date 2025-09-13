import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DiceRoll, DiceTemplate, DiceSet, DiceStatistics, DiceProbability } from '../types';

interface DiceState {
  rolls: DiceRoll[];
  templates: DiceTemplate[];
  diceSets: DiceSet[];
  currentExpression: string;
  rollHistory: DiceRoll[];
  showProbabilities: boolean;
  autoScroll: boolean;
  maxHistorySize: number;
}

interface DiceActions {
  // Roll Management
  rollDice: (expression: string, context?: string, options?: {
    advantage?: boolean;
    disadvantage?: boolean;
    isPrivate?: boolean;
    playerId?: string;
    playerName?: string;
  }) => DiceRoll | null;
  addRoll: (roll: Omit<DiceRoll, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  deleteRoll: (rollId: string) => void;
  
  // Template Management
  addTemplate: (template: Omit<DiceTemplate, 'id' | 'createdAt'>) => void;
  updateTemplate: (templateId: string, updates: Partial<DiceTemplate>) => void;
  deleteTemplate: (templateId: string) => void;
  
  // Dice Set Management
  addDiceSet: (diceSet: Omit<DiceSet, 'id'>) => void;
  updateDiceSet: (diceSetId: string, updates: Partial<DiceSet>) => void;
  deleteDiceSet: (diceSetId: string) => void;
  
  // Utility Actions
  setCurrentExpression: (expression: string) => void;
  toggleProbabilities: () => void;
  toggleAutoScroll: () => void;
  setMaxHistorySize: (size: number) => void;
  
  // Statistics
  calculateProbabilities: (expression: string) => DiceStatistics | null;
  getRecentRolls: (limit?: number) => DiceRoll[];
  getRollsByContext: (context: string) => DiceRoll[];
}

type DiceStore = DiceState & DiceActions;

const generateId = () => crypto.randomUUID();

// Dice parsing utilities
const parseDiceExpression = (expression: string): {
  numDice: number;
  sides: number;
  modifier: number;
  isValid: boolean;
} => {
  const match = expression.trim().match(/^(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?$/i);
  if (!match) {
    return { numDice: 0, sides: 0, modifier: 0, isValid: false };
  }

  const [, numDice, sides, operation, modValue] = match;
  const modifier = operation && modValue 
    ? (operation === '+' ? parseInt(modValue) : -parseInt(modValue))
    : 0;

  return {
    numDice: parseInt(numDice),
    sides: parseInt(sides),
    modifier,
    isValid: true
  };
};

const rollSingleDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1;
};

const calculateDiceStatistics = (numDice: number, sides: number, modifier: number): DiceStatistics => {
  const min = numDice + modifier;
  const max = (numDice * sides) + modifier;
  const average = ((numDice * (sides + 1)) / 2) + modifier;
  
  // Calculate probability distribution
  const distribution: DiceProbability[] = [];
  const totalOutcomes = Math.pow(sides, numDice);
  
  for (let sum = min; sum <= max; sum++) {
    const ways = countWays(numDice, sides, sum - modifier);
    const probability = ways / totalOutcomes;
    distribution.push({
      value: sum,
      probability,
      percentage: (probability * 100).toFixed(2) + '%'
    });
  }
  
  const mostLikely = distribution.reduce((prev, curr) => 
    curr.probability > prev.probability ? curr : prev
  ).value;

  return { min, max, average, mostLikely, distribution };
};

// Count the number of ways to achieve a sum with given dice
const countWays = (numDice: number, sides: number, target: number): number => {
  if (numDice === 0) return target === 0 ? 1 : 0;
  if (target < numDice || target > numDice * sides) return 0;
  
  let ways = 0;
  for (let i = 1; i <= sides && i <= target; i++) {
    ways += countWays(numDice - 1, sides, target - i);
  }
  return ways;
};

const checkCritical = (individualRolls: number[], sides: number): boolean => {
  if (sides === 20) {
    return individualRolls.some(roll => roll === 1 || roll === 20);
  }
  return false;
};

export const useDiceStore = create<DiceStore>()(
  persist(
    (set, get) => ({
      // State
      rolls: [],
      templates: [
        {
          id: generateId(),
          campaignId: '',
          name: 'D20 Roll',
          expression: '1d20',
          category: 'skill',
          tags: ['basic'],
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          campaignId: '',
          name: 'Attack Roll',
          expression: '1d20',
          category: 'attack',
          tags: ['combat'],
          createdAt: new Date().toISOString(),
        },
        {
          id: generateId(),
          campaignId: '',
          name: 'Damage (1d8)',
          expression: '1d8',
          category: 'damage',
          tags: ['combat'],
          createdAt: new Date().toISOString(),
        },
      ],
      diceSets: [],
      currentExpression: '1d20',
      rollHistory: [],
      showProbabilities: true,
      autoScroll: true,
      maxHistorySize: 100,

      // Actions
      rollDice: (expression, context, options = {}) => {
        const parsed = parseDiceExpression(expression);
        if (!parsed.isValid) {
          console.error('Invalid dice expression:', expression);
          return null;
        }

        const { numDice, sides, modifier } = parsed;
        let individualRolls: number[] = [];
        
        // Handle advantage/disadvantage for d20 rolls
        if (sides === 20 && numDice === 1 && (options.advantage || options.disadvantage)) {
          const roll1 = rollSingleDie(20);
          const roll2 = rollSingleDie(20);
          individualRolls = [roll1, roll2];
          
          if (options.advantage) {
            individualRolls = [Math.max(roll1, roll2)];
          } else if (options.disadvantage) {
            individualRolls = [Math.min(roll1, roll2)];
          }
        } else {
          for (let i = 0; i < numDice; i++) {
            individualRolls.push(rollSingleDie(sides));
          }
        }

        const result = individualRolls.reduce((sum, roll) => sum + roll, 0) + modifier;
        const critical = checkCritical(individualRolls, sides);

        const roll: DiceRoll = {
          id: generateId(),
          campaignId: '', // Will be set by the component using this store
          playerId: options.playerId,
          playerName: options.playerName,
          expression,
          result,
          individualRolls,
          modifier,
          timestamp: new Date().toISOString(),
          context,
          advantage: options.advantage,
          disadvantage: options.disadvantage,
          critical,
          tags: [],
          isPrivate: options.isPrivate || false,
        };

        set((state) => {
          const newHistory = [roll, ...state.rollHistory].slice(0, state.maxHistorySize);
          return {
            rolls: [roll, ...state.rolls].slice(0, state.maxHistorySize),
            rollHistory: newHistory,
          };
        });

        return roll;
      },

      addRoll: (rollData) => {
        const roll = { ...rollData, id: generateId(), timestamp: new Date().toISOString() };
        set((state) => ({
          rolls: [roll, ...state.rolls].slice(0, state.maxHistorySize),
          rollHistory: [roll, ...state.rollHistory].slice(0, state.maxHistorySize),
        }));
      },

      clearHistory: () => set({ rolls: [], rollHistory: [] }),

      deleteRoll: (rollId) =>
        set((state) => ({
          rolls: state.rolls.filter(roll => roll.id !== rollId),
          rollHistory: state.rollHistory.filter(roll => roll.id !== rollId),
        })),

      // Template Management
      addTemplate: (templateData) => {
        const template = { 
          ...templateData, 
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ templates: [...state.templates, template] }));
      },

      updateTemplate: (templateId, updates) =>
        set((state) => ({
          templates: state.templates.map(template =>
            template.id === templateId ? { ...template, ...updates } : template
          ),
        })),

      deleteTemplate: (templateId) =>
        set((state) => ({
          templates: state.templates.filter(template => template.id !== templateId),
        })),

      // Dice Set Management
      addDiceSet: (diceSetData) => {
        const diceSet = { ...diceSetData, id: generateId() };
        set((state) => ({ diceSets: [...state.diceSets, diceSet] }));
      },

      updateDiceSet: (diceSetId, updates) =>
        set((state) => ({
          diceSets: state.diceSets.map(diceSet =>
            diceSet.id === diceSetId ? { ...diceSet, ...updates } : diceSet
          ),
        })),

      deleteDiceSet: (diceSetId) =>
        set((state) => ({
          diceSets: state.diceSets.filter(diceSet => diceSet.id !== diceSetId),
        })),

      // Utility Actions
      setCurrentExpression: (expression) => set({ currentExpression: expression }),

      toggleProbabilities: () => set((state) => ({ showProbabilities: !state.showProbabilities })),

      toggleAutoScroll: () => set((state) => ({ autoScroll: !state.autoScroll })),

      setMaxHistorySize: (size) => set({ maxHistorySize: Math.max(10, Math.min(1000, size)) }),

      // Statistics
      calculateProbabilities: (expression) => {
        const parsed = parseDiceExpression(expression);
        if (!parsed.isValid) return null;
        
        const { numDice, sides, modifier } = parsed;
        return calculateDiceStatistics(numDice, sides, modifier);
      },

      getRecentRolls: (limit = 10) => {
        const state = get();
        return state.rollHistory.slice(0, limit);
      },

      getRollsByContext: (context) => {
        const state = get();
        return state.rollHistory.filter(roll => roll.context === context);
      },
    }),
    {
      name: 'dice-rolling-storage',
      partialize: (state) => ({
        templates: state.templates,
        diceSets: state.diceSets,
        currentExpression: state.currentExpression,
        showProbabilities: state.showProbabilities,
        autoScroll: state.autoScroll,
        maxHistorySize: state.maxHistorySize,
        // Don't persist rolls history - it should be fresh each session
      }),
    }
  )
);