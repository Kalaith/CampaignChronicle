// Reusable hooks for common operations

import { useState, useCallback, useEffect, useRef } from 'react';
import { errorHandler, AppError } from '../utils/errors';
import { uiLogger } from '../utils/logger';

export interface UseApiResourceState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

export interface UseApiResourceOptions {
  immediate?: boolean;
  retryOnError?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

/**
 * Hook for managing API resource fetching with loading, error states, and retry logic
 */
export function useApiResource<T>(
  fetcher: () => Promise<T>,
  dependencies: React.DependencyList = [],
  options: UseApiResourceOptions = {}
) {
  const {
    immediate = true,
    retryOnError = false,
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  const [state, setState] = useState<UseApiResourceState<T>>({
    data: null,
    loading: immediate,
    error: null
  });

  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetch = useCallback(async () => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      uiLogger.debug('Fetching API resource');
      const result = await fetcher();
      
      if (!mountedRef.current) return;

      setState({
        data: result,
        loading: false,
        error: null
      });
      
      retryCountRef.current = 0;
      uiLogger.debug('API resource fetched successfully');
    } catch (error) {
      if (!mountedRef.current) return;

      const appError = errorHandler.normalize(error, 'useApiResource');
      uiLogger.error('Failed to fetch API resource', appError);

      setState(prev => ({
        ...prev,
        loading: false,
        error: appError
      }));

      // Retry logic
      if (retryOnError && retryCountRef.current < maxRetries && errorHandler.isRetryable(appError)) {
        retryCountRef.current++;
        uiLogger.info(`Retrying API call (${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          if (mountedRef.current) {
            fetch();
          }
        }, retryDelay * retryCountRef.current);
      }
    }
  }, [fetcher, retryOnError, retryDelay, maxRetries]);

  const refetch = useCallback(() => {
    retryCountRef.current = 0;
    return fetch();
  }, [fetch]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    });
    retryCountRef.current = 0;
  }, []);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetch();
    }
  }, dependencies);

  return {
    ...state,
    refetch,
    reset,
    isRetrying: retryCountRef.current > 0
  };
}

/**
 * Hook for managing form submission with validation and error handling
 */
export function useFormSubmission<T = any>(
  onSubmit: (data: T) => Promise<void>,
  options: {
    validate?: (data: T) => Record<string, string[]> | null;
    onSuccess?: () => void;
    onError?: (error: AppError) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [submitError, setSubmitError] = useState<AppError | null>(null);

  const submit = useCallback(async (data: T) => {
    setLoading(true);
    setErrors({});
    setSubmitError(null);

    try {
      // Validate if validator provided
      if (options.validate) {
        const validationErrors = options.validate(data);
        if (validationErrors) {
          setErrors(validationErrors);
          setLoading(false);
          return;
        }
      }

      await onSubmit(data);
      options.onSuccess?.();
      uiLogger.info('Form submitted successfully');
    } catch (error) {
      const appError = errorHandler.normalize(error, 'useFormSubmission');
      
      // Extract validation errors if available
      const validationErrors = errorHandler.extractValidationErrors(error);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
      } else {
        setSubmitError(appError);
      }

      options.onError?.(appError);
      uiLogger.error('Form submission failed', appError);
    } finally {
      setLoading(false);
    }
  }, [onSubmit, options]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setSubmitError(null);
  }, []);

  return {
    submit,
    loading,
    errors,
    submitError,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0 || submitError !== null
  };
}

/**
 * Hook for managing local storage with type safety
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      uiLogger.warn(`Failed to parse localStorage item ${key}`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      uiLogger.error(`Failed to set localStorage item ${key}`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      uiLogger.error(`Failed to remove localStorage item ${key}`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for debouncing values (useful for search inputs)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for managing async operations with cancellation
 */
export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [data, setData] = useState<T | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (operation: (signal: AbortSignal) => Promise<T>) => {
    // Cancel previous operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const result = await operation(controller.signal);
      
      if (!controller.signal.aborted) {
        setData(result);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        const appError = errorHandler.normalize(error, 'useAsyncOperation');
        setError(appError);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    execute,
    cancel,
    loading,
    error,
    data,
    isExecuting: loading
  };
}

/**
 * Hook for managing pagination
 */
export function usePagination(
  totalItems: number,
  itemsPerPage: number = 20,
  initialPage: number = 1
) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const goToPage = useCallback((page: number) => {
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(clampedPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToPage,
    nextPage,
    prevPage,
    reset,
    itemsOnCurrentPage: endIndex - startIndex
  };
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcut(
  shortcut: string,
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      const keys = shortcut.toLowerCase().split('+');
      let matches = true;

      // Check modifiers
      if (keys.includes('ctrl') && !event.ctrlKey) matches = false;
      if (keys.includes('shift') && !event.shiftKey) matches = false;
      if (keys.includes('alt') && !event.altKey) matches = false;
      if (keys.includes('meta') && !event.metaKey) matches = false;

      // Check main key
      const mainKey = keys[keys.length - 1];
      if (event.key.toLowerCase() !== mainKey) matches = false;

      if (matches) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [shortcut, callback, enabled]);
}