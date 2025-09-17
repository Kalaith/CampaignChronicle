// Custom error classes with proper typing and context
export enum ErrorCode {
  // API Errors
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  
  // Business Logic Errors
  DICE_EXPRESSION_ERROR = 'DICE_EXPRESSION_ERROR',
  CAMPAIGN_ACCESS_ERROR = 'CAMPAIGN_ACCESS_ERROR',
  CHARACTER_VALIDATION_ERROR = 'CHARACTER_VALIDATION_ERROR',
  
  // System Errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: string;
  public readonly originalError?: Error;
  public readonly timestamp: Date;
  public readonly userMessage: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date();
    this.userMessage = this.generateUserMessage();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
  
  private generateUserMessage(): string {
    switch (this.code) {
      case ErrorCode.API_ERROR:
        return 'Unable to connect to the server. Please try again.';
      case ErrorCode.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection.';
      case ErrorCode.AUTHENTICATION_ERROR:
        return 'Authentication failed. Please log in again.';
      case ErrorCode.AUTHORIZATION_ERROR:
        return 'You do not have permission to perform this action.';
      case ErrorCode.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorCode.NOT_FOUND_ERROR:
        return 'The requested resource was not found.';
      case ErrorCode.DICE_EXPRESSION_ERROR:
        return 'Invalid dice expression. Please use format like "1d20" or "2d6+3".';
      case ErrorCode.CAMPAIGN_ACCESS_ERROR:
        return 'Unable to access this campaign. Please check your permissions.';
      case ErrorCode.STORAGE_ERROR:
        return 'Unable to save data locally. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      userMessage: this.userMessage,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

// Specialized error classes
export class ApiError extends AppError {
  public readonly status: number;
  public readonly response?: any;

  constructor(
    message: string,
    status: number,
    response?: any,
    context?: string
  ) {
    const severity = status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    const code = status === 401 ? ErrorCode.AUTHENTICATION_ERROR 
                : status === 403 ? ErrorCode.AUTHORIZATION_ERROR
                : status === 404 ? ErrorCode.NOT_FOUND_ERROR
                : status === 422 ? ErrorCode.VALIDATION_ERROR
                : ErrorCode.API_ERROR;
    
    super(message, code, severity, context);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly validationErrors: Record<string, string[]>;

  constructor(
    message: string,
    validationErrors: Record<string, string[]> = {},
    field?: string,
    context?: string
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, ErrorSeverity.LOW, context);
    this.name = 'ValidationError';
    this.field = field;
    this.validationErrors = validationErrors;
  }
}

export class DomainError extends AppError {
  constructor(
    message: string,
    context?: string,
    originalError?: Error
  ) {
    super(message, ErrorCode.DICE_EXPRESSION_ERROR, ErrorSeverity.MEDIUM, context, originalError);
    this.name = 'DomainError';
  }
}

export class ServiceError extends AppError {
  constructor(
    message: string,
    originalError?: Error,
    context?: string
  ) {
    const severity = originalError instanceof AppError ? originalError.severity : ErrorSeverity.HIGH;
    super(message, ErrorCode.API_ERROR, severity, context, originalError);
    this.name = 'ServiceError';
  }
}

// Error handler utilities
export const errorHandler = {
  /**
   * Convert unknown error to AppError
   */
  normalize(error: unknown, context?: string): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(error.message, ErrorCode.UNKNOWN_ERROR, ErrorSeverity.MEDIUM, context, error);
    }
    
    return new AppError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      ErrorCode.UNKNOWN_ERROR,
      ErrorSeverity.MEDIUM,
      context
    );
  },

  /**
   * Check if error should be retried
   */
  isRetryable(error: AppError): boolean {
    return error instanceof ApiError && 
           error.status >= 500 && 
           error.code !== ErrorCode.AUTHENTICATION_ERROR;
  },

  /**
   * Check if error should be reported to user
   */
  shouldReportToUser(error: AppError): boolean {
    return error.severity !== ErrorSeverity.LOW || 
           error.code === ErrorCode.VALIDATION_ERROR;
  },

  /**
   * Extract validation errors from error response
   */
  extractValidationErrors(error: unknown): Record<string, string[]> {
    if (error instanceof ValidationError) {
      return error.validationErrors;
    }
    
    if (error instanceof ApiError && error.response?.errors) {
      return error.response.errors;
    }
    
    return {};
  }
};

// Error reporting (for external services)
export interface ErrorReporter {
  report(error: AppError): Promise<void>;
}

export class ConsoleErrorReporter implements ErrorReporter {
  async report(error: AppError): Promise<void> {
    console.group(`[${error.severity.toUpperCase()}] ${error.code}`);
    console.error('Message:', error.message);
    console.error('Context:', error.context);
    console.error('Timestamp:', error.timestamp);
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
    console.groupEnd();
  }
}

export class RemoteErrorReporter implements ErrorReporter {
  constructor(private endpoint: string) {}

  async report(error: AppError): Promise<void> {
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error.toJSON())
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }
}