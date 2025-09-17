// Dice Service - Business logic for dice rolling and management

import { DiceRoll, type RollOptions } from '../models/DiceRoll';
import type { IDiceRepository } from '../repositories/interfaces';
import type { 
  DiceTemplate, 
  CreateDiceTemplateRequest, 
  UpdateDiceTemplateRequest,
  DiceStatistics 
} from '../types';
import { ValidationUtils, ValidationSchemas } from '../utils/validation';
import { ServiceError } from '../utils/errors';
import { serviceLogger } from '../utils/logger';
import { APP_CONSTANTS } from '../constants/app';

export interface DiceRollHistoryOptions {
  limit?: number;
  offset?: number;
  playerId?: string;
  isPrivate?: boolean;
}

export class DiceService {
  constructor(private diceRepository: IDiceRepository) {}

  /**
   * Roll dice with expression and options
   */
  async rollDice(
    campaignId: string,
    expression: string,
    options: RollOptions = {}
  ): Promise<DiceRoll> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'DiceService.rollDice');
    }

    // Validate dice expression
    ValidationUtils.validateAndThrow({ expression }, ValidationSchemas.diceRoll);

    try {
      serviceLogger.debug('Rolling dice', { campaignId, expression, options });
      
      // Create dice roll with business logic
      const diceRoll = DiceRoll.create(campaignId, expression, options);
      
      // Save to repository
      const savedRoll = await this.diceRepository.saveDiceRoll(diceRoll.toApiFormat());
      
      serviceLogger.info(`Dice rolled: ${expression} = ${diceRoll.result}`, {
        campaignId,
        rollId: diceRoll.id,
        result: diceRoll.result,
        isCritical: diceRoll.isCritical()
      });

      return DiceRoll.fromApiResponse(savedRoll);
    } catch (error) {
      serviceLogger.error('Failed to roll dice', error);
      throw new ServiceError('Dice roll failed', error as Error, 'DiceService.rollDice');
    }
  }

  /**
   * Get dice roll history for a campaign
   */
  async getDiceHistory(
    campaignId: string,
    options: DiceRollHistoryOptions = {}
  ): Promise<DiceRoll[]> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'DiceService.getDiceHistory');
    }

    try {
      const limit = Math.min(options.limit || APP_CONSTANTS.DICE.MAX_HISTORY_SIZE, 1000);
      const offset = Math.max(options.offset || 0, 0);

      serviceLogger.debug(`Fetching dice history for campaign ${campaignId}`, {
        limit,
        offset,
        playerId: options.playerId
      });

      const rolls = await this.diceRepository.getDiceHistory(campaignId, {
        limit,
        offset,
        playerId: options.playerId,
        isPrivate: options.isPrivate
      });

      return rolls.map(roll => DiceRoll.fromApiResponse(roll));
    } catch (error) {
      serviceLogger.error('Failed to get dice history', error);
      throw new ServiceError('Unable to load dice history', error as Error, 'DiceService.getDiceHistory');
    }
  }

  /**
   * Delete a dice roll
   */
  async deleteDiceRoll(rollId: string): Promise<void> {
    if (!rollId) {
      throw new ServiceError('Roll ID is required', undefined, 'DiceService.deleteDiceRoll');
    }

    try {
      serviceLogger.debug(`Deleting dice roll ${rollId}`);
      await this.diceRepository.deleteDiceRoll(rollId);
      serviceLogger.info(`Dice roll deleted: ${rollId}`);
    } catch (error) {
      serviceLogger.error(`Failed to delete dice roll ${rollId}`, error);
      throw new ServiceError('Unable to delete dice roll', error as Error, 'DiceService.deleteDiceRoll');
    }
  }

  /**
   * Get dice statistics for a campaign
   */
  async getDiceStatistics(campaignId: string): Promise<DiceStatistics> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'DiceService.getDiceStatistics');
    }

    try {
      serviceLogger.debug(`Fetching dice statistics for campaign ${campaignId}`);
      const stats = await this.diceRepository.getDiceStatistics(campaignId);
      serviceLogger.info(`Dice statistics loaded for campaign ${campaignId}`);
      return stats;
    } catch (error) {
      serviceLogger.error('Failed to get dice statistics', error);
      throw new ServiceError('Unable to load dice statistics', error as Error, 'DiceService.getDiceStatistics');
    }
  }

  /**
   * Create a dice template
   */
  async createDiceTemplate(data: CreateDiceTemplateRequest): Promise<DiceTemplate> {
    // Validate input
    ValidationUtils.validateAndThrow(data, ValidationSchemas.diceTemplate);

    try {
      serviceLogger.debug('Creating dice template', { name: data.name, expression: data.expression });
      const template = await this.diceRepository.createTemplate(data);
      serviceLogger.info(`Dice template created: ${template.name} (${template.id})`);
      return template;
    } catch (error) {
      serviceLogger.error('Failed to create dice template', error);
      throw new ServiceError('Unable to create dice template', error as Error, 'DiceService.createDiceTemplate');
    }
  }

  /**
   * Get dice templates for a campaign
   */
  async getDiceTemplates(campaignId: string): Promise<DiceTemplate[]> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'DiceService.getDiceTemplates');
    }

    try {
      serviceLogger.debug(`Fetching dice templates for campaign ${campaignId}`);
      return await this.diceRepository.getTemplates(campaignId);
    } catch (error) {
      serviceLogger.error('Failed to get dice templates', error);
      throw new ServiceError('Unable to load dice templates', error as Error, 'DiceService.getDiceTemplates');
    }
  }

  /**
   * Update a dice template
   */
  async updateDiceTemplate(id: string, data: UpdateDiceTemplateRequest): Promise<DiceTemplate> {
    if (!id) {
      throw new ServiceError('Template ID is required', undefined, 'DiceService.updateDiceTemplate');
    }

    // Validate input
    ValidationUtils.validateAndThrow(data, ValidationSchemas.diceTemplate);

    try {
      serviceLogger.debug(`Updating dice template ${id}`, data);
      const template = await this.diceRepository.updateTemplate(id, data);
      serviceLogger.info(`Dice template updated: ${template.name} (${template.id})`);
      return template;
    } catch (error) {
      serviceLogger.error(`Failed to update dice template ${id}`, error);
      throw new ServiceError('Unable to update dice template', error as Error, 'DiceService.updateDiceTemplate');
    }
  }

  /**
   * Delete a dice template
   */
  async deleteDiceTemplate(id: string): Promise<void> {
    if (!id) {
      throw new ServiceError('Template ID is required', undefined, 'DiceService.deleteDiceTemplate');
    }

    try {
      serviceLogger.debug(`Deleting dice template ${id}`);
      await this.diceRepository.deleteTemplate(id);
      serviceLogger.info(`Dice template deleted: ${id}`);
    } catch (error) {
      serviceLogger.error(`Failed to delete dice template ${id}`, error);
      throw new ServiceError('Unable to delete dice template', error as Error, 'DiceService.deleteDiceTemplate');
    }
  }

  /**
   * Business logic: Validate dice expression
   */
  validateDiceExpression(expression: string): { isValid: boolean; message?: string } {
    if (!expression || expression.trim().length === 0) {
      return { isValid: false, message: 'Dice expression is required' };
    }

    const trimmed = expression.trim();
    
    if (!DiceRoll.isValidExpression(trimmed)) {
      return { isValid: false, message: 'Invalid dice expression format (e.g., 1d20, 2d6+3)' };
    }

    const parsed = DiceRoll.parseExpression(trimmed);
    if (!parsed.isValid) {
      return { isValid: false, message: 'Dice expression values are out of range' };
    }

    return { isValid: true };
  }

  /**
   * Business logic: Get suggested dice expressions based on context
   */
  getDiceExpressionSuggestions(context?: string): Array<{ name: string; expression: string; description: string }> {
    const commonExpressions = DiceRoll.getCommonExpressions();

    // Add context-specific suggestions
    if (context) {
      switch (context.toLowerCase()) {
        case 'attack':
          return [
            { name: 'Attack Roll', expression: '1d20', description: 'Standard attack roll' },
            { name: 'Attack + Modifier', expression: '1d20+5', description: 'Attack with +5 modifier' },
            ...commonExpressions.slice(0, 3)
          ];
        case 'damage':
          return [
            { name: 'Sword Damage', expression: '1d8+3', description: 'Longsword damage' },
            { name: 'Dagger Damage', expression: '1d4+1', description: 'Dagger damage' },
            { name: 'Fireball', expression: '8d6', description: 'Fireball spell damage' },
            ...commonExpressions.slice(0, 2)
          ];
        case 'save':
          return [
            { name: 'Saving Throw', expression: '1d20', description: 'Standard saving throw' },
            { name: 'Save + Modifier', expression: '1d20+3', description: 'Save with +3 modifier' },
            ...commonExpressions.slice(0, 3)
          ];
        default:
          return commonExpressions;
      }
    }

    return commonExpressions;
  }

  /**
   * Business logic: Calculate roll statistics
   */
  calculateRollStatistics(rolls: DiceRoll[]): {
    totalRolls: number;
    averageResult: number;
    criticalHits: number;
    criticalMisses: number;
    highestRoll: number;
    lowestRoll: number;
    commonExpressions: Record<string, number>;
  } {
    if (rolls.length === 0) {
      return {
        totalRolls: 0,
        averageResult: 0,
        criticalHits: 0,
        criticalMisses: 0,
        highestRoll: 0,
        lowestRoll: 0,
        commonExpressions: {}
      };
    }

    const totalResult = rolls.reduce((sum, roll) => sum + roll.result, 0);
    const criticalHits = rolls.filter(roll => roll.isCriticalHit()).length;
    const criticalMisses = rolls.filter(roll => roll.isCriticalMiss()).length;
    const results = rolls.map(roll => roll.result);
    const expressions = rolls.reduce((acc, roll) => {
      acc[roll.expression] = (acc[roll.expression] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRolls: rolls.length,
      averageResult: Math.round((totalResult / rolls.length) * 100) / 100,
      criticalHits,
      criticalMisses,
      highestRoll: Math.max(...results),
      lowestRoll: Math.min(...results),
      commonExpressions: expressions
    };
  }

  /**
   * Business logic: Check if roll should be auto-scrolled
   */
  shouldAutoScroll(rolls: DiceRoll[], maxVisible: number = 10): boolean {
    return rolls.length <= maxVisible;
  }

  /**
   * Business logic: Format roll for display
   */
  formatRollForDisplay(roll: DiceRoll): {
    expression: string;
    result: string;
    formattedResult: string;
    timestamp: string;
    badges: string[];
  } {
    const badges: string[] = [];
    
    if (roll.isCriticalHit()) badges.push('Critical Hit');
    if (roll.isCriticalMiss()) badges.push('Critical Miss');
    if (roll.options.advantage) badges.push('Advantage');
    if (roll.options.disadvantage) badges.push('Disadvantage');
    if (roll.options.isPrivate) badges.push('Private');

    return {
      expression: roll.expression,
      result: roll.result.toString(),
      formattedResult: roll.getFormattedResult(),
      timestamp: roll.timestamp.toLocaleTimeString(),
      badges
    };
  }
}