import {
  ApiError as SharedApiError,
  buildApiUrl as buildSharedApiUrl,
  createApiClient as createSharedApiClient,
} from '@webhatchery/api-client';
import { appConfig } from '../../config/appConfig';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
    public readonly source?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type TokenProvider = () => Promise<string>;

export class BaseApiClient {
  private tokenProvider: TokenProvider | undefined;
  private readonly retryAttempts: number;
  private readonly client;

  constructor(
    baseUrl: string = appConfig.api.baseUrl,
    timeout: number = appConfig.api.timeout,
    retryAttempts: number = appConfig.api.retryAttempts,
  ) {
    this.retryAttempts = retryAttempts;
    this.client = createSharedApiClient({
      baseURL: baseUrl,
      timeoutMs: timeout,
      tokenProvider: async () => {
        if (!this.tokenProvider) {
          return null;
        }
        try {
          return await this.tokenProvider();
        } catch {
          return null;
        }
      },
    });
  }

  setTokenProvider(provider: TokenProvider): void {
    this.tokenProvider = provider;
  }

  private async request<T>(endpoint: string, method: string, body?: unknown, query?: Record<string, string | number | boolean>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retryAttempts; attempt += 1) {
      try {
        return await this.client.request<T>(endpoint, { method, body, query });
      } catch (error) {
        lastError = error;
        if (error instanceof SharedApiError && (error.status < 500 || error.status === 401)) {
          throw new ApiError(error.message, error.status, error.payload, 'BaseApiClient.request');
        }
        if (attempt < this.retryAttempts) {
          await new Promise<void>((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
        }
      }
    }

    if (lastError instanceof SharedApiError) {
      throw new ApiError(lastError.message, lastError.status, lastError.payload, 'BaseApiClient.request');
    }
    throw lastError instanceof Error
      ? new ApiError(lastError.message, 0, undefined, 'BaseApiClient.request')
      : new ApiError('The API request failed.', 0, undefined, 'BaseApiClient.request');
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, params);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'POST', data);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', data);
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'DELETE');
  }

  buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const query = params
      ? Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))
      : undefined;
    return buildSharedApiUrl(appConfig.api.baseUrl, '', endpoint) + (query
      ? `?${new URLSearchParams(query).toString()}`
      : '');
  }

  async downloadFile(endpoint: string, _filename?: string): Promise<Blob> {
    try {
      return await this.client.request<Blob>(endpoint, { method: 'GET', responseType: 'blob' });
    } catch (error) {
      if (error instanceof SharedApiError) {
        throw new ApiError('Download failed', error.status, error.payload, 'BaseApiClient.downloadFile');
      }
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new BaseApiClient();

export const createApiClient = (
  baseUrl?: string,
  timeout?: number,
  retryAttempts?: number,
): BaseApiClient => new BaseApiClient(baseUrl, timeout, retryAttempts);

export function setTokenProvider(provider: TokenProvider | null): void {
  apiClient.setTokenProvider(provider ?? (async () => ''));
}
