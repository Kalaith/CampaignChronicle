// API Client abstraction layer for repositories

import { appConfig } from '../config/appConfig';
import { ApiError, ErrorCode, errorHandler } from '../utils/errors';
import { apiLogger } from '../utils/logger';
import type { ApiResponse, ApiErrorResponse } from '../types/api';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
  retries?: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private getAccessToken?: () => Promise<string>;

  constructor(
    baseUrl: string = appConfig.api.baseUrl,
    timeout: number = appConfig.api.timeout,
    retries: number = appConfig.api.retryAttempts
  ) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = timeout;
    this.defaultRetries = retries;
  }

  setTokenProvider(provider: () => Promise<string>): void {
    this.getAccessToken = provider;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.getAccessToken) {
      apiLogger.warn('No token provider set for API client');
      return {};
    }

    try {
      const token = await this.getAccessToken();
      return { 'Authorization': `Bearer ${token}` };
    } catch (error) {
      apiLogger.error('Failed to get access token', error);
      throw new ApiError(
        'Authentication failed',
        401,
        undefined,
        'ApiClient.getAuthHeaders'
      );
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const retries = config.retries ?? this.defaultRetries;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.executeRequest<T>(url, config);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx) or auth errors
        if (error instanceof ApiError && (error.status < 500 || error.status === 401)) {
          throw error;
        }

        // Log retry attempt
        if (attempt < retries) {
          apiLogger.warn(`Request failed, retrying attempt ${attempt + 1}/${retries}`, {
            url,
            error: error instanceof Error ? error.message : error
          });
          
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw errorHandler.normalize(lastError!, 'ApiClient.makeRequest');
  }

  private async executeRequest<T>(url: string, config: RequestConfig): Promise<T> {
    const authHeaders = await this.getAuthHeaders();
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    // Don't set Content-Type for FormData
    if (config.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const requestConfig: RequestInit = {
      method: config.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...config.headers,
      },
      body: config.body,
      credentials: 'include',
    };

    const controller = new AbortController();
    const timeout = config.timeout ?? this.defaultTimeout;
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      apiLogger.debug(`Making ${config.method || 'GET'} request to ${url}`);
      
      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, undefined, 'ApiClient.executeRequest');
      }
      
      throw errorHandler.normalize(error, 'ApiClient.executeRequest');
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let responseData: any;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      apiLogger.error('Failed to parse response', error);
      throw new ApiError(
        'Invalid response format',
        response.status,
        undefined,
        'ApiClient.handleResponse'
      );
    }

    if (!response.ok) {
      const errorMessage = this.extractErrorMessage(responseData);
      apiLogger.error(`API Error ${response.status}`, {
        url: response.url,
        status: response.status,
        message: errorMessage,
        response: responseData
      });

      throw new ApiError(
        errorMessage,
        response.status,
        responseData,
        'ApiClient.handleResponse'
      );
    }

    // Handle API response wrapper format
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      const apiResponse = responseData as ApiResponse<T> | ApiErrorResponse;
      
      if (!apiResponse.success) {
        throw new ApiError(
          apiResponse.message,
          response.status,
          (apiResponse as ApiErrorResponse).errors,
          'ApiClient.handleResponse'
        );
      }
      
      return (apiResponse as ApiResponse<T>).data;
    }

    return responseData;
  }

  private extractErrorMessage(responseData: any): string {
    if (typeof responseData === 'string') {
      return responseData;
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.error) {
      return responseData.error;
    }

    if (responseData?.errors && Array.isArray(responseData.errors)) {
      return responseData.errors.join(', ');
    }

    return 'An unknown error occurred';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.makeRequest<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Utility methods
  buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    if (!params) return endpoint;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  // Download helper for files
  async downloadFile(endpoint: string, filename?: string): Promise<Blob> {
    const authHeaders = await this.getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: authHeaders,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new ApiError(
        'Download failed',
        response.status,
        undefined,
        'ApiClient.downloadFile'
      );
    }

    return response.blob();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export factory function for testing
export const createApiClient = (
  baseUrl?: string,
  timeout?: number,
  retries?: number
): ApiClient => {
  return new ApiClient(baseUrl, timeout, retries);
};