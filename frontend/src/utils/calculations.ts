// Calculations Utility Module - Mathematical and game-specific calculations

import { APP_CONSTANTS } from '../constants/app';

// Basic mathematical utilities
export const mathUtils = {
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  },

  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  },

  random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  },

  round(value: number, decimals = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  percentage(value: number, total: number): number {
    if (total === 0) return 0;
    return (value / total) * 100;
  },

  average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  },

  median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  },

  standardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(this.average(squaredDiffs));
  },

  gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  },

  lcm(a: number, b: number): number {
    return (a * b) / this.gcd(a, b);
  },
};

// D&D 5e specific calculations
export const dndCalculations = {
  // Ability score modifier calculation
  getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  },

  // Proficiency bonus by level
  getProficiencyBonus(level: number): number {
    return Math.ceil(level / 4) + 1;
  },

  // Experience points needed for level
  getExperienceForLevel(level: number): number {
    const xpTable = [
      0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
      85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
    ];
    return xpTable[Math.min(level - 1, xpTable.length - 1)] || 0;
  },

  // Calculate level from experience points
  getLevelFromExperience(xp: number): number {
    let level = 1;
    while (level < 20 && xp >= this.getExperienceForLevel(level + 1)) {
      level++;
    }
    return level;
  },

  // Calculate spell slots by level
  getSpellSlots(level: number, spellcastingClass: 'full' | 'half' | 'third'): number[] {
    const fullCasterTable = [
      [2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
      [3, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
      [4, 2, 0, 0, 0, 0, 0, 0, 0], // Level 3
      [4, 3, 0, 0, 0, 0, 0, 0, 0], // Level 4
      [4, 3, 2, 0, 0, 0, 0, 0, 0], // Level 5
      [4, 3, 3, 0, 0, 0, 0, 0, 0], // Level 6
      [4, 3, 3, 1, 0, 0, 0, 0, 0], // Level 7
      [4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
      [4, 3, 3, 3, 1, 0, 0, 0, 0], // Level 9
      [4, 3, 3, 3, 2, 0, 0, 0, 0], // Level 10
      [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 11
      [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 12
      [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 13
      [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 14
      [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 15
      [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 16
      [4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
      [4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
      [4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
      [4, 3, 3, 3, 3, 2, 2, 1, 1], // Level 20
    ];

    if (level < 1 || level > 20) return [];
    
    const slots = fullCasterTable[level - 1];
    
    if (spellcastingClass === 'half') {
      // Half casters (Paladin, Ranger) start at level 2
      const halfCasterLevel = Math.max(0, Math.ceil((level - 1) / 2));
      return halfCasterLevel > 0 ? fullCasterTable[halfCasterLevel - 1] : [];
    }
    
    if (spellcastingClass === 'third') {
      // Third casters (Eldritch Knight, Arcane Trickster) start at level 3
      const thirdCasterLevel = Math.max(0, Math.ceil((level - 2) / 3));
      return thirdCasterLevel > 0 ? fullCasterTable[thirdCasterLevel - 1] : [];
    }
    
    return slots;
  },

  // Calculate challenge rating XP
  getChallengeRatingXP(cr: number | string): number {
    const crToXP: Record<string, number> = {
      '0': 10, '1/8': 25, '1/4': 50, '1/2': 100,
      '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
      '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
      '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
      '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
      '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
      '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000,
    };
    return crToXP[cr.toString()] || 0;
  },

  // Calculate encounter difficulty
  calculateEncounterDifficulty(
    partyLevel: number[], 
    monsterCRs: (number | string)[]
  ): {
    adjustedXP: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
    thresholds: { easy: number; medium: number; hard: number; deadly: number };
  } {
    // Calculate party thresholds
    const partySize = partyLevel.length;
    const avgLevel = Math.round(partyLevel.reduce((sum, level) => sum + level, 0) / partySize);
    
    const levelThresholds = [
      { easy: 25, medium: 50, hard: 75, deadly: 100 },   // Level 1
      { easy: 50, medium: 100, hard: 150, deadly: 200 }, // Level 2
      { easy: 75, medium: 150, hard: 225, deadly: 400 }, // Level 3
      { easy: 125, medium: 250, hard: 375, deadly: 500 }, // Level 4
      { easy: 250, medium: 500, hard: 750, deadly: 1100 }, // Level 5
      // ... Continue for all levels
    ];
    
    const thresholds = levelThresholds[Math.min(avgLevel - 1, levelThresholds.length - 1)] || levelThresholds[0];
    
    // Scale thresholds by party size
    const scaledThresholds = {
      easy: thresholds.easy * partySize,
      medium: thresholds.medium * partySize,
      hard: thresholds.hard * partySize,
      deadly: thresholds.deadly * partySize,
    };
    
    // Calculate total monster XP
    const totalXP = monsterCRs.reduce((sum, cr) => sum + this.getChallengeRatingXP(cr), 0);
    
    // Apply encounter multiplier based on number of monsters
    const monsterCount = monsterCRs.length;
    let multiplier = 1;
    if (monsterCount === 2) multiplier = 1.5;
    else if (monsterCount <= 6) multiplier = 2;
    else if (monsterCount <= 10) multiplier = 2.5;
    else if (monsterCount <= 14) multiplier = 3;
    else multiplier = 4;
    
    const adjustedXP = Math.floor(totalXP * multiplier);
    
    let difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
    if (adjustedXP < scaledThresholds.easy) difficulty = 'easy';
    else if (adjustedXP < scaledThresholds.medium) difficulty = 'medium';
    else if (adjustedXP < scaledThresholds.hard) difficulty = 'hard';
    else difficulty = 'deadly';
    
    return {
      adjustedXP,
      difficulty,
      thresholds: scaledThresholds,
    };
  },
};

// Dice calculation utilities
export const diceCalculations = {
  // Parse dice expression (e.g., "2d6+3")
  parseDiceExpression(expression: string): {
    numDice: number;
    sides: number;
    modifier: number;
    isValid: boolean;
  } {
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
      isValid: true,
    };
  },

  // Calculate average roll for dice expression
  calculateAverageRoll(expression: string): number {
    const parsed = this.parseDiceExpression(expression);
    if (!parsed.isValid) return 0;
    
    const avgPerDie = (parsed.sides + 1) / 2;
    return (parsed.numDice * avgPerDie) + parsed.modifier;
  },

  // Calculate minimum possible roll
  calculateMinRoll(expression: string): number {
    const parsed = this.parseDiceExpression(expression);
    if (!parsed.isValid) return 0;
    
    return parsed.numDice + parsed.modifier;
  },

  // Calculate maximum possible roll
  calculateMaxRoll(expression: string): number {
    const parsed = this.parseDiceExpression(expression);
    if (!parsed.isValid) return 0;
    
    return (parsed.numDice * parsed.sides) + parsed.modifier;
  },

  // Calculate probability of rolling exact value
  calculateProbability(expression: string, targetValue: number): number {
    const parsed = this.parseDiceExpression(expression);
    if (!parsed.isValid) return 0;
    
    // This is a simplified calculation for basic cases
    // For complex expressions, this would need dynamic programming
    const minRoll = this.calculateMinRoll(expression);
    const maxRoll = this.calculateMaxRoll(expression);
    
    if (targetValue < minRoll || targetValue > maxRoll) return 0;
    
    // Simplified uniform distribution assumption
    const totalOutcomes = Math.pow(parsed.sides, parsed.numDice);
    return 1 / totalOutcomes;
  },

  // Simulate dice rolls for statistics
  simulateRolls(expression: string, iterations = 10000): {
    average: number;
    distribution: Record<number, number>;
    min: number;
    max: number;
  } {
    const parsed = this.parseDiceExpression(expression);
    if (!parsed.isValid) {
      return { average: 0, distribution: {}, min: 0, max: 0 };
    }

    const results: number[] = [];
    const distribution: Record<number, number> = {};

    for (let i = 0; i < iterations; i++) {
      let total = 0;
      for (let j = 0; j < parsed.numDice; j++) {
        total += mathUtils.random(1, parsed.sides);
      }
      total += parsed.modifier;
      
      results.push(total);
      distribution[total] = (distribution[total] || 0) + 1;
    }

    return {
      average: mathUtils.average(results),
      distribution,
      min: Math.min(...results),
      max: Math.max(...results),
    };
  },
};