import { appConfig } from '../config/appConfig';
import type { AppError } from './errors';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export interface LogTransport {
  log(entry: LogEntry): Promise<void>;
}

export class ConsoleTransport implements LogTransport {
  async log(entry: LogEntry): Promise<void> {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${LogLevel[entry.level]}]${entry.context ? ` [${entry.context}]` : ''}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.data);
        break;
    }
  }
}

export class RemoteTransport implements LogTransport {
  private buffer: LogEntry[] = [];
  private flushInterval: number;

  constructor(
    private endpoint: string,
    private batchSize: number = 10,
    flushIntervalMs: number = 5000
  ) {
    this.flushInterval = window.setInterval(() => {
      this.flush();
    }, flushIntervalMs);
  }

  async log(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send logs to remote endpoint:', error);
      logs.forEach(entry => console.log('Buffered log:', entry));
    }
  }

  destroy(): void {
    clearInterval(this.flushInterval);
    this.flush().catch(console.error);
  }
}

export class Logger {
  private transports: LogTransport[] = [];
  private context?: string;
  private minLevel: LogLevel;
  private sessionId: string;

  constructor(
    context?: string,
    minLevel?: LogLevel
  ) {
    this.context = context;
    this.minLevel = minLevel ?? this.parseLogLevel(appConfig.logging.level);
    this.sessionId = this.generateSessionId();
    
    // Setup default transports based on configuration
    if (appConfig.logging.enableConsoleOutput) {
      this.transports.push(new ConsoleTransport());
    }
    
    if (appConfig.logging.enableRemoteLogging) {
      // Add remote transport if endpoint is configured
      const endpoint = import.meta.env.VITE_LOGGING_ENDPOINT;
      if (endpoint) {
        this.transports.push(new RemoteTransport(endpoint));
      }
    }
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }

  setContext(context: string): Logger {
    return new Logger(context, this.minLevel);
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: unknown): void {
    let data = error;
    
    // Enhanced error logging for AppError instances
    if (error && typeof error === 'object' && 'toJSON' in error) {
      data = (error as AppError).toJSON();
    }
    
    this.log(LogLevel.ERROR, message, data);
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      level,
      message,
      context: this.context,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Try to get user ID from authentication context
    try {
      const userContext = this.getUserContext();
      if (userContext?.userId) {
        entry.userId = userContext.userId;
      }
    } catch {
      // Ignore errors getting user context
    }

    // Send to all transports
    this.transports.forEach(transport => {
      transport.log(entry).catch(err => {
        console.error('Transport failed to log entry:', err);
      });
    });
  }

  private getUserContext(): { userId?: string } | null {
    // This would integrate with your auth system
    try {
      const authState = localStorage.getItem('auth-state');
      if (authState) {
        const parsed = JSON.parse(authState);
        return { userId: parsed.user?.id };
      }
    } catch {
      // Ignore parsing errors
    }
    return null;
  }

  // Performance logging helpers
  time(label: string): void {
    if (appConfig.development.showPerformanceMetrics) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (appConfig.development.showPerformanceMetrics) {
      console.timeEnd(label);
    }
  }

  // Group logging for complex operations
  group(title: string): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.group(title);
    }
  }

  groupEnd(): void {
    if (this.minLevel <= LogLevel.DEBUG) {
      console.groupEnd();
    }
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Create context-specific loggers
export const createLogger = (context: string): Logger => {
  return logger.setContext(context);
};

// Export commonly used loggers
export const apiLogger = createLogger('API');
export const uiLogger = createLogger('UI');
export const diceLogger = createLogger('DICE');
export const storeLogger = createLogger('STORE');

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Global error caught', {
    message: event.error?.message || event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', {
    reason: event.reason,
    promise: event.promise
  });
});

export default logger;