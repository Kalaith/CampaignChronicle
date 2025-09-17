// Domain model for Dice Roll with business logic and validation

import { APP_CONSTANTS } from '../constants/app';
import { DomainError } from '../utils/errors';

export interface RollOptions {
  advantage?: boolean;
  disadvantage?: boolean;
  isPrivate?: boolean;
  context?: string;
  playerId?: string;
  playerName?: string;
}

export class DiceRoll {
  public readonly id: string;
  public readonly campaignId: string;
  public readonly expression: string;
  public readonly result: number;
  public readonly individualRolls: readonly number[];
  public readonly modifier: number;
  public readonly timestamp: Date;
  public readonly options: RollOptions;

  constructor(
    id: string,
    campaignId: string,
    expression: string,
    result: number,
    individualRolls: number[],
    modifier: number,
    timestamp: Date = new Date(),
    options: RollOptions = {}
  ) {
    this.id = id;
    this.campaignId = campaignId;
    this.expression = expression.trim();
    this.result = result;
    this.individualRolls = Object.freeze([...individualRolls]);
    this.modifier = modifier;
    this.timestamp = timestamp;
    this.options = { ...options };

    this.validate();
  }

  /**
   * Factory method to create a DiceRoll from an expression
   */
  static create(
    campaignId: string,
    expression: string,
    options: RollOptions = {}
  ): DiceRoll {
    const parsed = DiceRoll.parseExpression(expression);
    if (!parsed.isValid) {
      throw new DomainError(`Invalid dice expression: ${expression}`);
    }

    const { numDice, sides, modifier } = parsed;
    let individualRolls: number[] = [];

    // Handle advantage/disadvantage for d20 rolls
    if (sides === APP_CONSTANTS.DICE.D20_SIDES && numDice === 1 && (options.advantage || options.disadvantage)) {
      const roll1 = DiceRoll.rollSingleDie(sides);
      const roll2 = DiceRoll.rollSingleDie(sides);
      
      if (options.advantage) {
        individualRolls = [Math.max(roll1, roll2)];
      } else if (options.disadvantage) {
        individualRolls = [Math.min(roll1, roll2)];
      }
    } else {
      for (let i = 0; i < numDice; i++) {
        individualRolls.push(DiceRoll.rollSingleDie(sides));
      }
    }

    const result = individualRolls.reduce((sum, roll) => sum + roll, 0) + modifier;
    const id = crypto.randomUUID();

    return new DiceRoll(
      id,
      campaignId,
      expression,
      result,
      individualRolls,
      modifier,
      new Date(),
      options
    );
  }

  /**
   * Create a DiceRoll from API response data
   */
  static fromApiResponse(data: any): DiceRoll {
    return new DiceRoll(
      data.id,
      data.campaignId || data.campaign_id,
      data.expression,
      data.result,
      data.individualRolls || data.individual_rolls,
      data.modifier || 0,
      new Date(data.timestamp || data.created_at),
      {
        advantage: data.advantage,
        disadvantage: data.disadvantage,
        isPrivate: data.isPrivate || data.is_private,
        context: data.context,
        playerId: data.playerId || data.player_id,
        playerName: data.playerName || data.player_name
      }
    );
  }

  /**
   * Validate the dice roll data
   */
  private validate(): void {
    if (!this.id) {
      throw new DomainError('Dice roll ID is required');
    }

    if (!this.campaignId) {
      throw new DomainError('Campaign ID is required');
    }

    if (!DiceRoll.isValidExpression(this.expression)) {
      throw new DomainError(`Invalid dice expression format: ${this.expression}`);
    }

    if (this.individualRolls.length === 0) {
      throw new DomainError('Must have at least one die roll');
    }

    if (this.result !== this.calculateExpectedResult()) {
      throw new DomainError(
        `Result ${this.result} does not match expected result ${this.calculateExpectedResult()}`
      );
    }

    // Validate individual rolls against dice sides
    const parsed = DiceRoll.parseExpression(this.expression);
    if (parsed.isValid) {
      const { sides } = parsed;
      for (const roll of this.individualRolls) {
        if (roll < 1 || roll > sides) {
          throw new DomainError(`Invalid roll ${roll} for d${sides}`);
        }
      }
    }
  }

  /**
   * Calculate expected result from individual rolls and modifier
   */
  private calculateExpectedResult(): number {
    return this.individualRolls.reduce((sum, roll) => sum + roll, 0) + this.modifier;
  }

  /**
   * Check if this roll is a critical hit/miss (for d20 rolls)
   */
  isCritical(): boolean {
    const parsed = DiceRoll.parseExpression(this.expression);
    if (!parsed.isValid || parsed.sides !== APP_CONSTANTS.DICE.D20_SIDES) {
      return false;
    }

    // Only check critical for single d20 rolls
    if (this.individualRolls.length === 1) {
      const roll = this.individualRolls[0];
      return roll === APP_CONSTANTS.DICE.CRITICAL_HIT || roll === APP_CONSTANTS.DICE.CRITICAL_MISS;
    }

    return false;
  }

  /**
   * Check if this is a critical hit (natural 20)
   */
  isCriticalHit(): boolean {
    return this.isCritical() && this.individualRolls[0] === APP_CONSTANTS.DICE.CRITICAL_HIT;
  }

  /**
   * Check if this is a critical miss (natural 1)
   */
  isCriticalMiss(): boolean {
    return this.isCritical() && this.individualRolls[0] === APP_CONSTANTS.DICE.CRITICAL_MISS;
  }

  /**
   * Get formatted result string
   */
  getFormattedResult(): string {
    let result = '';
    
    if (this.individualRolls.length > 1) {
      result += `[${this.individualRolls.join(', ')}]`;
    } else {
      result += this.individualRolls[0].toString();
    }
    
    if (this.modifier !== 0) {
      result += ` ${this.modifier > 0 ? '+' : ''}${this.modifier}`;
    }
    
    result += ` = ${this.result}`;
    
    if (this.options.advantage) result += ' (Advantage)';
    if (this.options.disadvantage) result += ' (Disadvantage)';
    if (this.isCritical()) result += ' ⚡';
    
    return result;
  }

  /**
   * Get dice sides from expression
   */
  getDiceSides(): number {
    const parsed = DiceRoll.parseExpression(this.expression);
    return parsed.isValid ? parsed.sides : 0;
  }

  /**
   * Get number of dice from expression
   */
  getNumDice(): number {
    const parsed = DiceRoll.parseExpression(this.expression);
    return parsed.isValid ? parsed.numDice : 0;
  }

  /**
   * Convert to API format
   */
  toApiFormat(): any {
    return {
      id: this.id,
      campaign_id: this.campaignId,
      expression: this.expression,
      result: this.result,
      individual_rolls: [...this.individualRolls],
      modifier: this.modifier,
      context: this.options.context,
      advantage: this.options.advantage || false,
      disadvantage: this.options.disadvantage || false,
      critical: this.isCritical(),
      tags: [],
      is_private: this.options.isPrivate || false,
      player_id: this.options.playerId,
      player_name: this.options.playerName,
      created_at: this.timestamp.toISOString()
    };
  }

  /**
   * Parse dice expression (e.g., "2d6+3")
   */
  static parseExpression(expression: string): {
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
    const numDiceInt = parseInt(numDice);
    const sidesInt = parseInt(sides);
    const modifier = operation && modValue 
      ? (operation === '+' ? parseInt(modValue) : -parseInt(modValue))
      : 0;

    // Validate reasonable ranges
    const isValid = (
      numDiceInt >= 1 && numDiceInt <= APP_CONSTANTS.DICE.MAX_DICE_COUNT &&
      sidesInt >= APP_CONSTANTS.DICE.MIN_SIDES && sidesInt <= APP_CONSTANTS.DICE.MAX_SIDES &&
      Math.abs(modifier) <= 100
    );

    return {
      numDice: numDiceInt,
      sides: sidesInt,
      modifier,
      isValid
    };
  }

  /**
   * Check if expression is valid
   */
  static isValidExpression(expression: string): boolean {
    return DiceRoll.parseExpression(expression).isValid;
  }

  /**
   * Roll a single die
   */
  private static rollSingleDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Generate dice expression suggestions
   */
  static getCommonExpressions(): { name: string; expression: string; description: string }[] {
    return [
      { name: 'D4', expression: '1d4', description: 'Four-sided die' },
      { name: 'D6', expression: '1d6', description: 'Six-sided die' },
      { name: 'D8', expression: '1d8', description: 'Eight-sided die' },
      { name: 'D10', expression: '1d10', description: 'Ten-sided die' },
      { name: 'D12', expression: '1d12', description: 'Twelve-sided die' },
      { name: 'D20', expression: '1d20', description: 'Twenty-sided die' },
      { name: '2D6', expression: '2d6', description: 'Two six-sided dice' },
      { name: '3D6', expression: '3d6', description: 'Three six-sided dice' },
      { name: 'D20+5', expression: '1d20+5', description: 'D20 with +5 modifier' },
      { name: '1D8+3', expression: '1d8+3', description: 'D8 with +3 modifier' },
    ];
  }
}