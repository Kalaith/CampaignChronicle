// Base API Client - Core API functionality with proper error handling

import { appConfig } from '../../config/appConfig';
import { ApiError, errorHandler } from '../../utils/errors';
import { apiLogger } from '../../utils/logger';
import type { ApiResponse, ApiErrorResponse, PaginatedResponse } from '../../types/api';

// Global token provider function that will be set by the auth context
let getAccessToken: (() => Promise<string>) | null = null;

// Set the token provider (called from auth context)
export function setTokenProvider(provider: () => Promise<string>) {
  getAccessToken = provider;
  apiLogger.info('Token provider set for API client');
}

// Get auth headers using access token
async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!getAccessToken) {
    throw new ApiError('Token provider not set', 401, undefined, 'getAuthHeaders');
  }
  
  try {
    const token = await getAccessToken();
    return { 'Authorization': `Bearer ${token}` };
  } catch (error) {
    apiLogger.error('Failed to get access token', error);
    throw new ApiError('Authentication failed', 401, error, 'getAuthHeaders');
  }
}

// Core API client class
export class BaseApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;

  constructor(
    baseUrl: string = appConfig.api.baseUrl,
    timeout: number = appConfig.api.timeout,
    retryAttempts: number = appConfig.api.retryAttempts
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retryAttempts = retryAttempts;
  }

  // Generic request method with retry logic
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const authHeaders = await getAuthHeaders();
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeaders,
      };

      // Don't set Content-Type for FormData
      if (options.body instanceof FormData) {
        delete defaultHeaders['Content-Type'];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      apiLogger.debug(`API ${options.method || 'GET'} ${url}`, {
        attempt,
        headers: { ...defaultHeaders, Authorization: '[REDACTED]' }
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return await this.handleResponse<T>(response, url);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, undefined, 'BaseApiClient.request');
      }

      // Retry on network errors (but not on 4xx client errors)
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        apiLogger.warn(`Request failed, retrying attempt ${attempt + 1}/${this.retryAttempts}`, {
          url,
          error: error instanceof Error ? error.message : error
        });
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
        return this.request<T>(endpoint, options, attempt + 1);
      }

      throw errorHandler.normalize(error, 'BaseApiClient.request');
    }
  }

  // Handle and parse response
  private async handleResponse<T>(response: Response, url: string): Promise<T> {
    let responseData: unknown;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (error) {
      apiLogger.error('Failed to parse response', { url, error });
      throw new ApiError('Invalid response format', response.status, undefined, 'BaseApiClient.handleResponse');
    }

    if (!response.ok) {
      const errorMessage = this.extractErrorMessage(responseData);
      apiLogger.error(`API Error ${response.status}`, {
        url,
        status: response.status,
        message: errorMessage,
        response: responseData
      });

      throw new ApiError(errorMessage, response.status, responseData, 'BaseApiClient.handleResponse');
    }

    // Handle wrapped API response format
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      const apiResponse = responseData as ApiResponse<T> | ApiErrorResponse;
      
      if (!apiResponse.success) {
        throw new ApiError(
          apiResponse.message,
          response.status,
          (apiResponse as ApiErrorResponse).errors,
          'BaseApiClient.handleResponse'
        );
      }
      
      return (apiResponse as ApiResponse<T>).data;
    }

    return responseData as T;
  }

  // Extract error message from response
  private extractErrorMessage(responseData: unknown): string {
    if (typeof responseData === 'string') {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const data = responseData as Record<string, unknown>;
      
      if (data.message && typeof data.message === 'string') {
        return data.message;
      }
      
      if (data.error && typeof data.error === 'string') {
        return data.error;
      }
      
      if (Array.isArray(data.errors)) {
        return data.errors.join(', ');
      }
    }

    return 'An unknown error occurred';
  }

  // Determine if request should be retried
  private shouldRetry(error: unknown): boolean {
    // Don't retry on client errors (4xx) or auth errors
    if (error instanceof ApiError && (error.status < 500 || error.status === 401)) {
      return false;
    }
    return true;
  }

  // Delay utility for retries
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public HTTP methods
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = params ? this.buildUrl(endpoint, params) : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { method: 'POST', body });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { method: 'PUT', body });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);
    return this.request<T>(endpoint, { method: 'PATCH', body });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Utility methods
  buildUrl(endpoint: string, params: Record<string, string | number | boolean>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  // File download helper
  async downloadFile(endpoint: string, filename?: string): Promise<Blob> {
    const authHeaders = await getAuthHeaders();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: authHeaders,
    });

    if (!response.ok) {
      throw new ApiError('Download failed', response.status, undefined, 'BaseApiClient.downloadFile');
    }

    return response.blob();
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const apiClient = new BaseApiClient();

// Export factory for testing
export const createApiClient = (baseUrl?: string, timeout?: number, retryAttempts?: number): BaseApiClient => {
  return new BaseApiClient(baseUrl, timeout, retryAttempts);
};