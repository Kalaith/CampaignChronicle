// Application-wide constants
export const APP_CONSTANTS = {
  // API Configuration
  API: {
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  
  // Dice Rolling
  DICE: {
    MAX_HISTORY_SIZE: 100,
    DEFAULT_EXPRESSION: '1d20',
    D20_SIDES: 20,
    CRITICAL_HIT: 20,
    CRITICAL_MISS: 1,
    MAX_DICE_COUNT: 10,
    MAX_SIDES: 100,
    MIN_SIDES: 2,
  },
  
  // UI Behavior
  UI: {
    AUTO_SCROLL_DELAY: 200,
    TOAST_DURATION: 5000,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 200,
    MODAL_Z_INDEX: 1000,
  },
  
  // Validation
  VALIDATION: {
    MIN_NAME_LENGTH: 1,
    MAX_NAME_LENGTH: 255,
    MIN_DESCRIPTION_LENGTH: 0,
    MAX_DESCRIPTION_LENGTH: 2000,
    MAX_TAG_LENGTH: 50,
    MAX_TAGS_COUNT: 10,
  },
  
  // Storage
  STORAGE: {
    CAMPAIGN_STORAGE_KEY: 'campaign-chronicle-storage',
    DICE_STORAGE_KEY: 'dice-rolling-storage',
    USER_PREFERENCES_KEY: 'user-preferences',
  },
  
  // Weather System
  WEATHER: {
    MONTHS: [
      'Midwinter', 'Late Winter', 'The Claw of Winter', 'The Claw of the Sunsets',
      'The Melting', 'The Time of Flowers', 'Flamerule', 'Eleasis',
      'Eleint', 'Marpenoth', 'Uktar', 'The Rotting'
    ],
    SEASONS: {
      Winter: [0, 1, 2],
      Spring: [3, 4, 5],
      Summer: [6, 7, 8],
      Autumn: [9, 10, 11]
    },
    TEMPERATURE_RANGES: {
      Freezing: { min: -20, max: 0 },
      Cold: { min: 0, max: 10 },
      Cool: { min: 10, max: 20 },
      Mild: { min: 20, max: 25 },
      Warm: { min: 25, max: 30 },
      Hot: { min: 30, max: 40 }
    }
  },
  
  // File Upload
  FILE_UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
    MAX_FILES_PER_UPLOAD: 5,
  }
} as const;

// Type exports for better intellisense
export type AppConstants = typeof APP_CONSTANTS;
export type DiceConstants = typeof APP_CONSTANTS.DICE;
export type UIConstants = typeof APP_CONSTANTS.UI;
export type ValidationConstants = typeof APP_CONSTANTS.VALIDATION;