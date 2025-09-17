// Character Service - Business logic for character management

import type { ICharacterRepository } from '../repositories/interfaces';
import type { 
  Character, 
  CreateCharacterRequest, 
  UpdateCharacterRequest,
  CharacterStatistics 
} from '../types';
import { ValidationUtils, ValidationSchemas } from '../utils/validation';
import { ServiceError } from '../utils/errors';
import { serviceLogger } from '../utils/logger';

export interface CharacterFilterOptions {
  type?: 'PC' | 'NPC' | 'Villain' | 'Ally';
  level?: number;
  alive?: boolean;
  search?: string;
}

export class CharacterService {
  constructor(private characterRepository: ICharacterRepository) {}

  /**
   * Get all characters for a campaign
   */
  async getCharacters(campaignId: string, filters?: CharacterFilterOptions): Promise<Character[]> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'CharacterService.getCharacters');
    }

    try {
      serviceLogger.debug(`Fetching characters for campaign ${campaignId}`, filters);
      const characters = await this.characterRepository.findByCampaign(campaignId, filters);
      
      serviceLogger.info(`Loaded ${characters.length} characters for campaign ${campaignId}`);
      return characters;
    } catch (error) {
      serviceLogger.error('Failed to get characters', error);
      throw new ServiceError('Unable to load characters', error as Error, 'CharacterService.getCharacters');
    }
  }

  /**
   * Get a single character by ID
   */
  async getCharacter(id: string): Promise<Character | null> {
    if (!id) {
      throw new ServiceError('Character ID is required', undefined, 'CharacterService.getCharacter');
    }

    try {
      serviceLogger.debug(`Fetching character ${id}`);
      return await this.characterRepository.findById(id);
    } catch (error) {
      serviceLogger.error(`Failed to get character ${id}`, error);
      throw new ServiceError('Unable to load character', error as Error, 'CharacterService.getCharacter');
    }
  }

  /**
   * Create a new character
   */
  async createCharacter(data: CreateCharacterRequest): Promise<Character> {
    // Validate input
    ValidationUtils.validateAndThrow(data, ValidationSchemas.character);

    // Business validation
    const nameValidation = this.validateCharacterName(data.name);
    if (!nameValidation.isValid) {
      throw new ServiceError(nameValidation.message!, undefined, 'CharacterService.createCharacter');
    }

    try {
      serviceLogger.debug('Creating new character', { name: data.name, type: data.type });
      const character = await this.characterRepository.create(data);
      serviceLogger.info(`Character created: ${character.name} (${character.id})`);
      return character;
    } catch (error) {
      serviceLogger.error('Failed to create character', error);
      throw new ServiceError('Unable to create character', error as Error, 'CharacterService.createCharacter');
    }
  }

  /**
   * Update an existing character
   */
  async updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
    if (!id) {
      throw new ServiceError('Character ID is required', undefined, 'CharacterService.updateCharacter');
    }

    // Validate input
    ValidationUtils.validateAndThrow(data, ValidationSchemas.character);

    // Business validation
    if (data.name) {
      const nameValidation = this.validateCharacterName(data.name);
      if (!nameValidation.isValid) {
        throw new ServiceError(nameValidation.message!, undefined, 'CharacterService.updateCharacter');
      }
    }

    try {
      serviceLogger.debug(`Updating character ${id}`, data);
      const character = await this.characterRepository.update(id, data);
      serviceLogger.info(`Character updated: ${character.name} (${character.id})`);
      return character;
    } catch (error) {
      serviceLogger.error(`Failed to update character ${id}`, error);
      throw new ServiceError('Unable to update character', error as Error, 'CharacterService.updateCharacter');
    }
  }

  /**
   * Delete a character
   */
  async deleteCharacter(id: string): Promise<void> {
    if (!id) {
      throw new ServiceError('Character ID is required', undefined, 'CharacterService.deleteCharacter');
    }

    try {
      serviceLogger.debug(`Deleting character ${id}`);
      await this.characterRepository.delete(id);
      serviceLogger.info(`Character deleted: ${id}`);
    } catch (error) {
      serviceLogger.error(`Failed to delete character ${id}`, error);
      throw new ServiceError('Unable to delete character', error as Error, 'CharacterService.deleteCharacter');
    }
  }

  /**
   * Get character statistics for a campaign
   */
  async getCharacterStatistics(campaignId: string): Promise<CharacterStatistics> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'CharacterService.getCharacterStatistics');
    }

    try {
      serviceLogger.debug(`Fetching character statistics for campaign ${campaignId}`);
      const stats = await this.characterRepository.getStatistics(campaignId);
      serviceLogger.info(`Character statistics loaded for campaign ${campaignId}`);
      return stats;
    } catch (error) {
      serviceLogger.error('Failed to get character statistics', error);
      throw new ServiceError('Unable to load character statistics', error as Error, 'CharacterService.getCharacterStatistics');
    }
  }

  /**
   * Business logic: Validate character name
   */
  validateCharacterName(name: string): { isValid: boolean; message?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: 'Character name is required' };
    }

    if (name.length > 255) {
      return { isValid: false, message: 'Character name must be less than 255 characters' };
    }

    if (!/^[a-zA-Z0-9\s\-_'.]+$/.test(name)) {
      return { isValid: false, message: 'Character name contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Business logic: Calculate character level progression
   */
  calculateLevelProgression(currentLevel: number, experience: number): {
    level: number;
    experienceToNext: number;
    progressPercent: number;
  } {
    // Standard D&D 5e experience table (simplified)
    const experienceTable = [
      0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
      85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000
    ];

    let level = 1;
    for (let i = 0; i < experienceTable.length; i++) {
      if (experience >= experienceTable[i]) {
        level = i + 1;
      } else {
        break;
      }
    }

    const currentLevelExp = experienceTable[level - 1] || 0;
    const nextLevelExp = experienceTable[level] || experienceTable[experienceTable.length - 1];
    const experienceToNext = Math.max(0, nextLevelExp - experience);
    const progressPercent = level >= 20 ? 100 : 
      Math.round(((experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100);

    return {
      level: Math.min(level, 20),
      experienceToNext,
      progressPercent
    };
  }

  /**
   * Business logic: Calculate ability score modifier
   */
  calculateAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Business logic: Calculate armor class
   */
  calculateArmorClass(baseAC: number, dexModifier: number, armorType?: string): number {
    switch (armorType) {
      case 'leather':
        return 11 + dexModifier;
      case 'studded_leather':
        return 12 + dexModifier;
      case 'chain_mail':
        return 16;
      case 'plate':
        return 18;
      default:
        return Math.max(baseAC, 10 + dexModifier);
    }
  }

  /**
   * Business logic: Validate character level
   */
  validateCharacterLevel(level: number, type: string): { isValid: boolean; message?: string } {
    if (level < 1 || level > 20) {
      return { isValid: false, message: 'Character level must be between 1 and 20' };
    }

    // NPCs can be higher level in some cases
    if (type === 'NPC' && level > 30) {
      return { isValid: false, message: 'NPC level cannot exceed 30' };
    }

    return { isValid: true };
  }

  /**
   * Business logic: Generate character summary
   */
  generateCharacterSummary(characters: Character[]): {
    totalCharacters: number;
    byType: Record<string, number>;
    averageLevel: number;
    aliveCharacters: number;
    levelDistribution: Record<string, number>;
  } {
    const summary = {
      totalCharacters: characters.length,
      byType: {} as Record<string, number>,
      averageLevel: 0,
      aliveCharacters: 0,
      levelDistribution: {} as Record<string, number>
    };

    if (characters.length === 0) {
      return summary;
    }

    // Count by type
    characters.forEach(char => {
      summary.byType[char.type] = (summary.byType[char.type] || 0) + 1;
      
      if (char.hp > 0) {
        summary.aliveCharacters++;
      }

      if (char.level) {
        const levelRange = char.level <= 5 ? '1-5' : 
                          char.level <= 10 ? '6-10' : 
                          char.level <= 15 ? '11-15' : '16-20';
        summary.levelDistribution[levelRange] = (summary.levelDistribution[levelRange] || 0) + 1;
      }
    });

    // Calculate average level
    const totalLevel = characters
      .filter(char => char.level)
      .reduce((sum, char) => sum + (char.level || 0), 0);
    const charactersWithLevel = characters.filter(char => char.level).length;
    
    summary.averageLevel = charactersWithLevel > 0 ? 
      Math.round((totalLevel / charactersWithLevel) * 10) / 10 : 0;

    return summary;
  }

  /**
   * Business logic: Check if character can perform action
   */
  canCharacterPerformAction(character: Character, action: string): { canPerform: boolean; reason?: string } {
    if (character.hp <= 0) {
      return { canPerform: false, reason: 'Character is unconscious or dead' };
    }

    switch (action) {
      case 'cast_spell':
        if ((character.level || 1) < 1) {
          return { canPerform: false, reason: 'Character level too low to cast spells' };
        }
        break;
      case 'use_magic_item':
        if ((character.level || 1) < 3) {
          return { canPerform: false, reason: 'Character level too low to use magic items' };
        }
        break;
    }

    return { canPerform: true };
  }

  /**
   * Business logic: Sort characters by criteria
   */
  sortCharacters(characters: Character[], criteria: 'name' | 'level' | 'type' | 'hp'): Character[] {
    return [...characters].sort((a, b) => {
      switch (criteria) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return (b.level || 0) - (a.level || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'hp':
          return (b.hp || 0) - (a.hp || 0);
        default:
          return 0;
      }
    });
  }
}