// Campaign Repository Implementation

import type { ApiClient } from '../apiClient';
import type { ICampaignRepository } from '../interfaces';
import type { 
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  CampaignResponse 
} from '../../types';
import { apiLogger } from '../../utils/logger';
import { ServiceError } from '../../utils/errors';

export class CampaignRepository implements ICampaignRepository {
  constructor(private apiClient: ApiClient) {}

  async findAll(): Promise<Campaign[]> {
    try {
      apiLogger.debug('Fetching all campaigns');
      const response = await this.apiClient.get<{ data: CampaignResponse[] }>('/campaigns');
      return response.data.map(this.mapToDomainModel);
    } catch (error) {
      apiLogger.error('Failed to fetch campaigns', error);
      throw new ServiceError('Failed to load campaigns', error as Error, 'CampaignRepository.findAll');
    }
  }

  async findById(id: string): Promise<Campaign | null> {
    try {
      apiLogger.debug(`Fetching campaign ${id}`);
      const response = await this.apiClient.get<CampaignResponse>(`/campaigns/${id}`);
      return this.mapToDomainModel(response);
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as any).status === 404) {
        return null;
      }
      apiLogger.error(`Failed to fetch campaign ${id}`, error);
      throw new ServiceError(`Failed to load campaign ${id}`, error as Error, 'CampaignRepository.findById');
    }
  }

  async create(data: CreateCampaignRequest): Promise<Campaign> {
    try {
      apiLogger.debug('Creating new campaign', { name: data.name });
      const response = await this.apiClient.post<CampaignResponse>('/campaigns', data);
      const campaign = this.mapToDomainModel(response);
      apiLogger.info(`Campaign created: ${campaign.name} (ID: ${campaign.id})`);
      return campaign;
    } catch (error) {
      apiLogger.error('Failed to create campaign', error);
      throw new ServiceError('Failed to create campaign', error as Error, 'CampaignRepository.create');
    }
  }

  async update(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
    try {
      apiLogger.debug(`Updating campaign ${id}`, data);
      const response = await this.apiClient.put<CampaignResponse>(`/campaigns/${id}`, data);
      const campaign = this.mapToDomainModel(response);
      apiLogger.info(`Campaign updated: ${campaign.name} (ID: ${campaign.id})`);
      return campaign;
    } catch (error) {
      apiLogger.error(`Failed to update campaign ${id}`, error);
      throw new ServiceError(`Failed to update campaign`, error as Error, 'CampaignRepository.update');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      apiLogger.debug(`Deleting campaign ${id}`);
      await this.apiClient.delete<void>(`/campaigns/${id}`);
      apiLogger.info(`Campaign deleted: ${id}`);
    } catch (error) {
      apiLogger.error(`Failed to delete campaign ${id}`, error);
      throw new ServiceError(`Failed to delete campaign`, error as Error, 'CampaignRepository.delete');
    }
  }

  async search(campaignId: string, query: string, types?: string[]): Promise<any> {
    try {
      apiLogger.debug(`Searching in campaign ${campaignId}`, { query, types });
      const params = new URLSearchParams({ q: query });
      if (types && types.length > 0) {
        params.append('types', types.join(','));
      }
      
      const response = await this.apiClient.get<any>(`/campaigns/${campaignId}/search?${params.toString()}`);
      return response;
    } catch (error) {
      apiLogger.error(`Failed to search in campaign ${campaignId}`, error);
      throw new ServiceError('Failed to search campaign', error as Error, 'CampaignRepository.search');
    }
  }

  async export(campaignId: string, options?: { entities?: string[]; include_stats?: boolean }): Promise<any> {
    try {
      apiLogger.debug(`Exporting campaign ${campaignId}`, options);
      const params = new URLSearchParams();
      if (options?.entities) {
        params.append('entities', options.entities.join(','));
      }
      if (options?.include_stats) {
        params.append('include_stats', 'true');
      }
      
      const query = params.toString();
      const response = await this.apiClient.get<any>(
        `/campaigns/${campaignId}/export${query ? '?' + query : ''}`
      );
      
      apiLogger.info(`Campaign exported: ${campaignId}`);
      return response;
    } catch (error) {
      apiLogger.error(`Failed to export campaign ${campaignId}`, error);
      throw new ServiceError('Failed to export campaign', error as Error, 'CampaignRepository.export');
    }
  }

  async import(file: File, options?: { merge_duplicates?: boolean }): Promise<any> {
    try {
      apiLogger.debug('Importing campaign data', { filename: file.name, size: file.size });
      const formData = new FormData();
      formData.append('file', file);
      
      if (options?.merge_duplicates) {
        formData.append('merge_duplicates', 'true');
      }
      
      const response = await this.apiClient.post<any>('/import', formData);
      apiLogger.info('Campaign data imported successfully');
      return response;
    } catch (error) {
      apiLogger.error('Failed to import campaign data', error);
      throw new ServiceError('Failed to import campaign data', error as Error, 'CampaignRepository.import');
    }
  }

  async getAnalytics(campaignId: string): Promise<any> {
    try {
      apiLogger.debug(`Fetching analytics for campaign ${campaignId}`);
      const response = await this.apiClient.get<any>(`/campaigns/${campaignId}/analytics`);
      return response;
    } catch (error) {
      apiLogger.error(`Failed to fetch analytics for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to load campaign analytics', error as Error, 'CampaignRepository.getAnalytics');
    }
  }

  private mapToDomainModel(response: CampaignResponse): Campaign {
    return {
      id: response.id,
      name: response.name,
      description: response.description,
      createdAt: response.createdAt,
      lastModified: response.lastModified,
    };
  }
}