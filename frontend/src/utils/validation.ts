// Comprehensive input validation system

import { APP_CONSTANTS } from '../constants/app';
import { ValidationError } from './errors';

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'number' | 'custom' | 'diceExpression';
  value?: string | number | RegExp;
  message: string;
  validator?: (value: unknown) => boolean;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export class Validator {
  /**
   * Validate a single value against rules
   */
  static validateField(value: unknown, rules: ValidationRule[]): string[] {
    const errors: string[] = [];

    for (const rule of rules) {
      const error = this.applyRule(value, rule);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  /**
   * Validate an object against a schema
   */
  static validate(data: Record<string, unknown>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = this.validateField(value, rules);
      
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  /**
   * Apply a single validation rule
   */
  private static applyRule(value: unknown, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'required':
        return this.validateRequired(value) ? null : rule.message;
      
      case 'minLength':
        return this.validateMinLength(value, rule.value as number) ? null : rule.message;
      
      case 'maxLength':
        return this.validateMaxLength(value, rule.value as number) ? null : rule.message;
      
      case 'pattern':
        return this.validatePattern(value, rule.value as RegExp) ? null : rule.message;
      
      case 'email':
        return this.validateEmail(value) ? null : rule.message;
      
      case 'url':
        return this.validateUrl(value) ? null : rule.message;
      
      case 'number':
        return this.validateNumber(value) ? null : rule.message;
      
      case 'diceExpression':
        return this.validateDiceExpression(value) ? null : rule.message;
      
      case 'custom':
        return rule.validator?.(value) ? null : rule.message;
      
      default:
        return null;
    }
  }

  // Individual validation methods
  private static validateRequired(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private static validateMinLength(value: unknown, minLength: number): boolean {
    if (typeof value !== 'string') return true; // Skip if not string
    return value.length >= minLength;
  }

  private static validateMaxLength(value: unknown, maxLength: number): boolean {
    if (typeof value !== 'string') return true; // Skip if not string
    return value.length <= maxLength;
  }

  private static validatePattern(value: unknown, pattern: RegExp): boolean {
    if (typeof value !== 'string') return true; // Skip if not string
    return pattern.test(value);
  }

  private static validateEmail(value: unknown): boolean {
    if (typeof value !== 'string') return true; // Skip if not string
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private static validateUrl(value: unknown): boolean {
    if (typeof value !== 'string') return true; // Skip if not string
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private static validateNumber(value: unknown): boolean {
    if (typeof value === 'number') return !isNaN(value) && isFinite(value);
    if (typeof value === 'string') {
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    }
    return false;
  }

  private static validateDiceExpression(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const diceRegex = /^\d+d\d+(?:\s*[+-]\s*\d+)?$/i;
    
    if (!diceRegex.test(value)) return false;
    
    // Additional validation for reasonable values
    const match = value.match(/^(\d+)d(\d+)(?:\s*[+-]\s*(\d+))?$/i);
    if (!match) return false;
    
    const numDice = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    return (
      numDice >= 1 && numDice <= APP_CONSTANTS.DICE.MAX_DICE_COUNT &&
      sides >= APP_CONSTANTS.DICE.MIN_SIDES && sides <= APP_CONSTANTS.DICE.MAX_SIDES &&
      Math.abs(modifier) <= 100
    );
  }
}

// Pre-defined validation schemas for common entities
export const ValidationSchemas = {
  campaign: {
    name: [
      { type: 'required', message: 'Campaign name is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Name must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Name must be less than 255 characters' }
    ],
    description: [
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH, message: 'Description must be less than 2000 characters' }
    ]
  } as ValidationSchema,

  character: {
    name: [
      { type: 'required', message: 'Character name is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Name must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Name must be less than 255 characters' }
    ],
    type: [
      { type: 'required', message: 'Character type is required' },
      { 
        type: 'custom', 
        message: 'Invalid character type',
        validator: (value) => ['PC', 'NPC', 'Villain', 'Ally'].includes(value as string)
      }
    ],
    level: [
      { 
        type: 'custom', 
        message: 'Level must be between 1 and 20',
        validator: (value) => {
          if (value === null || value === undefined || value === '') return true;
          const num = Number(value);
          return !isNaN(num) && num >= 1 && num <= 20;
        }
      }
    ],
    hp: [
      { 
        type: 'custom', 
        message: 'HP must be a positive number',
        validator: (value) => {
          if (value === null || value === undefined || value === '') return true;
          const num = Number(value);
          return !isNaN(num) && num >= 0;
        }
      }
    ],
    ac: [
      { 
        type: 'custom', 
        message: 'AC must be between 1 and 30',
        validator: (value) => {
          if (value === null || value === undefined || value === '') return true;
          const num = Number(value);
          return !isNaN(num) && num >= 1 && num <= 30;
        }
      }
    ]
  } as ValidationSchema,

  location: {
    name: [
      { type: 'required', message: 'Location name is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Name must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Name must be less than 255 characters' }
    ],
    type: [
      { type: 'required', message: 'Location type is required' },
      { 
        type: 'custom', 
        message: 'Invalid location type',
        validator: (value) => ['Continent', 'Region', 'City', 'Town', 'Village', 'Building', 'Room', 'Dungeon'].includes(value as string)
      }
    ]
  } as ValidationSchema,

  item: {
    name: [
      { type: 'required', message: 'Item name is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Name must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Name must be less than 255 characters' }
    ],
    type: [
      { type: 'required', message: 'Item type is required' },
      { 
        type: 'custom', 
        message: 'Invalid item type',
        validator: (value) => ['Weapon', 'Armor', 'Magic Item', 'Tool', 'Treasure', 'Document', 'Key Item'].includes(value as string)
      }
    ],
    quantity: [
      { 
        type: 'custom', 
        message: 'Quantity must be a positive number',
        validator: (value) => {
          if (value === null || value === undefined || value === '') return true;
          const num = Number(value);
          return !isNaN(num) && num > 0;
        }
      }
    ]
  } as ValidationSchema,

  note: {
    title: [
      { type: 'required', message: 'Note title is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Title must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Title must be less than 255 characters' }
    ],
    content: [
      { type: 'required', message: 'Note content is required' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH, message: 'Content must be less than 2000 characters' }
    ]
  } as ValidationSchema,

  quest: {
    title: [
      { type: 'required', message: 'Quest title is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Title must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Title must be less than 255 characters' }
    ],
    description: [
      { type: 'required', message: 'Quest description is required' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_DESCRIPTION_LENGTH, message: 'Description must be less than 2000 characters' }
    ],
    status: [
      { type: 'required', message: 'Quest status is required' },
      { 
        type: 'custom', 
        message: 'Invalid quest status',
        validator: (value) => ['active', 'completed', 'failed', 'on-hold'].includes(value as string)
      }
    ],
    priority: [
      { type: 'required', message: 'Quest priority is required' },
      { 
        type: 'custom', 
        message: 'Invalid quest priority',
        validator: (value) => ['low', 'medium', 'high', 'critical'].includes(value as string)
      }
    ]
  } as ValidationSchema,

  diceRoll: {
    expression: [
      { type: 'required', message: 'Dice expression is required' },
      { type: 'diceExpression', message: 'Invalid dice expression format (e.g., 1d20, 2d6+3)' }
    ]
  } as ValidationSchema,

  diceTemplate: {
    name: [
      { type: 'required', message: 'Template name is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Name must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Name must be less than 255 characters' }
    ],
    expression: [
      { type: 'required', message: 'Dice expression is required' },
      { type: 'diceExpression', message: 'Invalid dice expression format (e.g., 1d20, 2d6+3)' }
    ],
    category: [
      { type: 'required', message: 'Template category is required' },
      { 
        type: 'custom', 
        message: 'Invalid template category',
        validator: (value) => ['attack', 'damage', 'save', 'skill', 'custom'].includes(value as string)
      }
    ]
  } as ValidationSchema,

  playerAccess: {
    playerName: [
      { type: 'required', message: 'Player name is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Name must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Name must be less than 255 characters' }
    ]
  } as ValidationSchema,

  sharedResource: {
    name: [
      { type: 'required', message: 'Resource name is required' },
      { type: 'minLength', value: APP_CONSTANTS.VALIDATION.MIN_NAME_LENGTH, message: 'Name must be at least 1 character' },
      { type: 'maxLength', value: APP_CONSTANTS.VALIDATION.MAX_NAME_LENGTH, message: 'Name must be less than 255 characters' }
    ],
    type: [
      { type: 'required', message: 'Resource type is required' },
      { 
        type: 'custom', 
        message: 'Invalid resource type',
        validator: (value) => ['image', 'document', 'audio', 'video', 'other'].includes(value as string)
      }
    ],
    category: [
      { type: 'required', message: 'Resource category is required' },
      { 
        type: 'custom', 
        message: 'Invalid resource category',
        validator: (value) => ['maps', 'handouts', 'references', 'music', 'other'].includes(value as string)
      }
    ],
    accessLevel: [
      { type: 'required', message: 'Access level is required' },
      { 
        type: 'custom', 
        message: 'Invalid access level',
        validator: (value) => ['dm_only', 'players', 'public'].includes(value as string)
      }
    ]
  } as ValidationSchema
};

// Utility functions for common validations
export const ValidationUtils = {
  /**
   * Validate file upload
   */
  validateFile(file: File, maxSize?: number, allowedTypes?: string[]): string[] {
    const errors: string[] = [];
    
    const maxFileSize = maxSize || APP_CONSTANTS.FILE_UPLOAD.MAX_FILE_SIZE;
    if (file.size > maxFileSize) {
      errors.push(`File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    }
    
    if (allowedTypes && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    return errors;
  },

  /**
   * Validate tags array
   */
  validateTags(tags: string[]): string[] {
    const errors: string[] = [];
    
    if (tags.length > APP_CONSTANTS.VALIDATION.MAX_TAGS_COUNT) {
      errors.push(`Maximum ${APP_CONSTANTS.VALIDATION.MAX_TAGS_COUNT} tags allowed`);
    }
    
    for (const tag of tags) {
      if (tag.length > APP_CONSTANTS.VALIDATION.MAX_TAG_LENGTH) {
        errors.push(`Tag "${tag}" is too long (max ${APP_CONSTANTS.VALIDATION.MAX_TAG_LENGTH} characters)`);
      }
    }
    
    return errors;
  },

  /**
   * Validate form data with error throwing
   */
  validateAndThrow(data: Record<string, unknown>, schema: ValidationSchema): void {
    const result = Validator.validate(data, schema);
    if (!result.isValid) {
      throw new ValidationError('Validation failed', result.errors);
    }
  }
};