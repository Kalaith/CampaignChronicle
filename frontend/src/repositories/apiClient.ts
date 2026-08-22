import {
  ApiError as SharedApiError,
  buildApiUrl as buildSharedApiUrl,
  createApiClient as createSharedApiClient,
} from '@webhatchery/api-client';
import { appConfig } from '../config/appConfig';
import { ApiError } from '../utils/errors';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
  retries?: number;
}

export class ApiClient {
  private getAccessToken?: () => Promise<string>;
  private readonly client;

  constructor(
    baseUrl: string = appConfig.api.baseUrl,
    timeout: number = appConfig.api.timeout,
    _retries: number = appConfig.api.retryAttempts,
  ) {
    this.client = createSharedApiClient({
      baseURL: baseUrl,
      timeoutMs: timeout,
      tokenProvider: async () => {
        if (!this.getAccessToken) {
          return null;
        }
        try {
          return await this.getAccessToken();
        } catch {
          return null;
        }
      },
    });
  }

  setTokenProvider(provider: () => Promise<string>): void {
    this.getAccessToken = provider;
  }

  private async makeRequest<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    try {
      return await this.client.request<T>(endpoint, {
        method: config.method ?? 'GET',
        headers: config.headers,
        body: config.body,
      });
    } catch (error) {
      if (error instanceof SharedApiError) {
        throw new ApiError(error.message, error.status, error.payload, 'ApiClient.makeRequest');
      }
      throw error instanceof Error
        ? new ApiError(error.message, 0, undefined, 'ApiClient.makeRequest')
        : new ApiError('The API request failed.', 0, undefined, 'ApiClient.makeRequest');
    }
  }

  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    const body = data instanceof FormData ? data : data === undefined ? undefined : JSON.stringify(data);
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    const body = data instanceof FormData ? data : data === undefined ? undefined : JSON.stringify(data);
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    const body = data instanceof FormData ? data : data === undefined ? undefined : JSON.stringify(data);
    return this.makeRequest<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }

  buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    if (!params) {
      return endpoint;
    }

    const queryString = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ).toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  async downloadFile(endpoint: string, _filename?: string): Promise<Blob> {
    try {
      return await this.client.request<Blob>(endpoint, { method: 'GET', responseType: 'blob' });
    } catch (error) {
      if (error instanceof SharedApiError) {
        throw new ApiError('Download failed', error.status, error.payload, 'ApiClient.downloadFile');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();

export const createApiClient = (
  baseUrl?: string,
  timeout?: number,
  retries?: number,
): ApiClient => new ApiClient(baseUrl, timeout, retries);

export function buildApiUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
  const query = params
    ? new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)])).toString()
    : '';
  return `${buildSharedApiUrl(appConfig.api.baseUrl, '', endpoint)}${query ? `?${query}` : ''}`;
}
