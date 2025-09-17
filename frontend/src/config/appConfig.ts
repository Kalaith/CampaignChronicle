// Environment-based configuration
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  dice: {
    maxHistorySize: number;
    defaultExpression: string;
    criticalSides: number;
  };
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
  ui: {
    autoScrollDelay: number;
    toastDuration: number;
    theme: 'light' | 'dark' | 'auto';
  };
  features: {
    enableAdvancedDiceRolling: boolean;
    enableWeatherSystem: boolean;
    enablePlayerPortal: boolean;
    enableMobileCompanion: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsoleOutput: boolean;
    enableRemoteLogging: boolean;
  };
  development: {
    enableDebugMode: boolean;
    mockApiCalls: boolean;
    showPerformanceMetrics: boolean;
  };
}

// Load configuration from environment variables with fallbacks
const loadConfig = (): AppConfig => {
  const isDevelopment = import.meta.env.DEV;
  
  return {
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || (isDevelopment ? 'http://localhost:8000' : ''),
      timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
      retryAttempts: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
    },
    dice: {
      maxHistorySize: Number(import.meta.env.VITE_DICE_MAX_HISTORY) || 100,
      defaultExpression: import.meta.env.VITE_DICE_DEFAULT_EXPRESSION || '1d20',
      criticalSides: Number(import.meta.env.VITE_DICE_CRITICAL_SIDES) || 20,
    },
    pagination: {
      defaultPageSize: Number(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,
      maxPageSize: Number(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,
    },
    ui: {
      autoScrollDelay: Number(import.meta.env.VITE_AUTO_SCROLL_DELAY) || 200,
      toastDuration: Number(import.meta.env.VITE_TOAST_DURATION) || 5000,
      theme: (import.meta.env.VITE_DEFAULT_THEME as 'light' | 'dark' | 'auto') || 'light',
    },
    features: {
      enableAdvancedDiceRolling: import.meta.env.VITE_ENABLE_ADVANCED_DICE === 'true',
      enableWeatherSystem: import.meta.env.VITE_ENABLE_WEATHER !== 'false',
      enablePlayerPortal: import.meta.env.VITE_ENABLE_PLAYER_PORTAL !== 'false',
      enableMobileCompanion: import.meta.env.VITE_ENABLE_MOBILE_COMPANION !== 'false',
    },
    logging: {
      level: (import.meta.env.VITE_LOG_LEVEL as any) || (isDevelopment ? 'debug' : 'info'),
      enableConsoleOutput: import.meta.env.VITE_ENABLE_CONSOLE_LOGGING !== 'false',
      enableRemoteLogging: import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true',
    },
    development: {
      enableDebugMode: isDevelopment && import.meta.env.VITE_ENABLE_DEBUG !== 'false',
      mockApiCalls: isDevelopment && import.meta.env.VITE_MOCK_API === 'true',
      showPerformanceMetrics: isDevelopment && import.meta.env.VITE_SHOW_PERFORMANCE === 'true',
    },
  };
};

// Validate configuration
const validateConfig = (config: AppConfig): void => {
  if (!config.api.baseUrl && !config.development.mockApiCalls) {
    throw new Error('VITE_API_BASE_URL is required in production mode');
  }
  
  if (config.api.timeout < 1000) {
    console.warn('API timeout is very low, this may cause issues');
  }
  
  if (config.dice.maxHistorySize > 1000) {
    console.warn('Dice history size is very high, this may impact performance');
  }
};

// Export singleton configuration
export const appConfig = loadConfig();

// Validate on load
try {
  validateConfig(appConfig);
} catch (error) {
  console.error('Configuration validation failed:', error);
  throw error;
}

// Development helper
if (appConfig.development.enableDebugMode) {
  console.log('App Configuration:', appConfig);
}

export default appConfig;