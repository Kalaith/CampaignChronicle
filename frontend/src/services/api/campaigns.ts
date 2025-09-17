// Campaign API Module - Focused on campaign-related API operations

import { BaseApiClient } from './base';
import type { 
  CampaignResponse, 
  CreateCampaignRequest, 
  UpdateCampaignRequest,
  CampaignAnalytics,
  CampaignSearchResult,
  PaginatedResponse 
} from '../../types/api';

export class CampaignApi {
  constructor(private client: BaseApiClient) {}

  // Get all campaigns for the current user
  async list(): Promise<PaginatedResponse<CampaignResponse>> {
    return this.client.get<PaginatedResponse<CampaignResponse>>('/campaigns');
  }

  // Get a specific campaign by ID
  async get(id: string): Promise<CampaignResponse> {
    return this.client.get<CampaignResponse>(`/campaigns/${id}`);
  }

  // Create a new campaign
  async create(data: CreateCampaignRequest): Promise<CampaignResponse> {
    return this.client.post<CampaignResponse>('/campaigns', data);
  }

  // Update an existing campaign
  async update(id: string, data: UpdateCampaignRequest): Promise<CampaignResponse> {
    return this.client.put<CampaignResponse>(`/campaigns/${id}`, data);
  }

  // Delete a campaign
  async delete(id: string): Promise<void> {
    return this.client.delete<void>(`/campaigns/${id}`);
  }

  // Search within a campaign
  async search(campaignId: string, query: string, types?: string[]): Promise<CampaignSearchResult> {
    const params: Record<string, string> = { q: query };
    if (types && types.length > 0) {
      params.types = types.join(',');
    }
    
    return this.client.get<CampaignSearchResult>(`/campaigns/${campaignId}/search`, params);
  }

  // Export campaign data
  async export(
    campaignId: string, 
    options?: { entities?: string[]; include_stats?: boolean }
  ): Promise<unknown> {
    const params: Record<string, string | boolean> = {};
    
    if (options?.entities) {
      params.entities = options.entities.join(',');
    }
    if (options?.include_stats) {
      params.include_stats = true;
    }
    
    return this.client.get<unknown>(`/campaigns/${campaignId}/export`, params);
  }

  // Import campaign data
  async import(file: File, options?: { merge_duplicates?: boolean }): Promise<{
    success: boolean;
    imported_count: number;
    campaigns: CampaignResponse[];
  }> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options?.merge_duplicates) {
      formData.append('merge_duplicates', 'true');
    }
    
    return this.client.post<{
      success: boolean;
      imported_count: number;
      campaigns: CampaignResponse[];
    }>('/campaigns/import', formData);
  }

  // Get campaign analytics
  async getAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    return this.client.get<CampaignAnalytics>(`/campaigns/${campaignId}/analytics`);
  }

  // Duplicate a campaign
  async duplicate(campaignId: string, name: string): Promise<CampaignResponse> {
    return this.client.post<CampaignResponse>(`/campaigns/${campaignId}/duplicate`, { name });
  }

  // Archive/unarchive a campaign
  async archive(campaignId: string): Promise<void> {
    return this.client.patch<void>(`/campaigns/${campaignId}/archive`);
  }

  async unarchive(campaignId: string): Promise<void> {
    return this.client.patch<void>(`/campaigns/${campaignId}/unarchive`);
  }

  // Get campaign activity feed
  async getActivity(campaignId: string, limit?: number): Promise<{
    activities: Array<{
      id: string;
      type: string;
      description: string;
      user: string;
      timestamp: string;
      metadata?: Record<string, unknown>;
    }>;
  }> {
    const params = limit ? { limit } : {};
    return this.client.get<{
      activities: Array<{
        id: string;
        type: string;
        description: string;
        user: string;
        timestamp: string;
        metadata?: Record<string, unknown>;
      }>;
    }>(`/campaigns/${campaignId}/activity`, params);
  }
}