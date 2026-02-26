// Custom error classes with proper typing and context
export enum ErrorCode {
  // API Errors
  ApiError = 'API_ERROR',
  NetworkError = 'NETWORK_ERROR',
  AuthenticationError = 'AUTHENTICATION_ERROR',
  AuthorizationError = 'AUTHORIZATION_ERROR',
  ValidationError = 'VALIDATION_ERROR',
  NotFoundError = 'NOT_FOUND_ERROR',
  
  // Business Logic Errors
  DiceExpressionError = 'DICE_EXPRESSION_ERROR',
  CampaignAccessError = 'CAMPAIGN_ACCESS_ERROR',
  CharacterValidationError = 'CHARACTER_VALIDATION_ERROR',
  
  // System Errors
  StorageError = 'STORAGE_ERROR',
  ConfigurationError = 'CONFIGURATION_ERROR',
  UnknownError = 'UNKNOWN_ERROR'
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
    code: ErrorCode = ErrorCode.UnknownError,
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
      case ErrorCode.ApiError:
        return 'Unable to connect to the server. Please try again.';
      case ErrorCode.NetworkError:
        return 'Network connection error. Please check your internet connection.';
      case ErrorCode.AuthenticationError:
        return 'Authentication failed. Please log in again.';
      case ErrorCode.AuthorizationError:
        return 'You do not have permission to perform this action.';
      case ErrorCode.ValidationError:
        return 'Please check your input and try again.';
      case ErrorCode.NotFoundError:
        return 'The requested resource was not found.';
      case ErrorCode.DiceExpressionError:
        return 'Invalid dice expression. Please use format like "1d20" or "2d6+3".';
      case ErrorCode.CampaignAccessError:
        return 'Unable to access this campaign. Please check your permissions.';
      case ErrorCode.StorageError:
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
  public readonly response?: unknown;

  constructor(
    message: string,
    status: number,
    response?: unknown,
    context?: string
  ) {
    const severity = status >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    const code = status === 401 ? ErrorCode.AuthenticationError
                : status === 403 ? ErrorCode.AuthorizationError
                : status === 404 ? ErrorCode.NotFoundError
                : status === 422 ? ErrorCode.ValidationError
                : ErrorCode.ApiError;
    
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
    super(message, ErrorCode.ValidationError, ErrorSeverity.LOW, context);
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
    super(message, ErrorCode.DiceExpressionError, ErrorSeverity.MEDIUM, context, originalError);
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
    super(message, ErrorCode.ApiError, severity, context, originalError);
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
      return new AppError(error.message, ErrorCode.UnknownError, ErrorSeverity.MEDIUM, context, error);
    }
    
    return new AppError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      ErrorCode.UnknownError,
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
           error.code !== ErrorCode.AuthenticationError;
  },

  /**
   * Check if error should be reported to user
   */
  shouldReportToUser(error: AppError): boolean {
    return error.severity !== ErrorSeverity.LOW || 
           error.code === ErrorCode.ValidationError;
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
