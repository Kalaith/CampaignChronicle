// Utility Module Index - Centralized exports for all utility modules

// Core utilities
export * from './errors';
export * from './logger';
export * from './validation';

// Data utilities
export * from './localStorage';
export * from './dataExport';

// Browser and DOM utilities
export * from './browser';

// Formatting utilities
export * from './formatting';

// Mathematical utilities
export * from './calculations';

// Re-export commonly used utilities for convenience
export { errorHandler, AppError, ValidationError, ServiceError, ApiError } from './errors';
export { uiLogger, apiLogger, storeLogger, serviceLogger } from './logger';
export { Validator, ValidationSchemas, ValidationUtils } from './validation';
export { deviceDetection, screenUtils, clipboard, fileUtils, urlUtils, focusUtils, performance } from './browser';
export { textUtils, numberUtils, dateUtils, campaignUtils } from './formatting';
export { mathUtils, dndCalculations, diceCalculations } from './calculations';

// Utility type definitions
export type { ValidationRule, ValidationSchema, ValidationResult } from './validation';
export type { LogLevel, LogEntry, LogTransport } from './logger';
export type { ErrorSeverity, ErrorCode } from './errors';