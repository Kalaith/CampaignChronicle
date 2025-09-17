// Campaign Service - Business logic for campaign management

import type { ICampaignRepository } from '../repositories/interfaces';
import type { 
  Campaign, 
  CreateCampaignRequest, 
  UpdateCampaignRequest,
  CampaignAnalytics,
  CampaignSearchResult 
} from '../types';
import { ValidationUtils, ValidationSchemas } from '../utils/validation';
import { ServiceError } from '../utils/errors';
import { serviceLogger } from '../utils/logger';

export class CampaignService {
  constructor(private campaignRepository: ICampaignRepository) {}

  async getAllCampaigns(): Promise<Campaign[]> {
    try {
      serviceLogger.debug('Fetching all campaigns');
      const campaigns = await this.campaignRepository.findAll();
      serviceLogger.info(`Loaded ${campaigns.length} campaigns`);
      return campaigns;
    } catch (error) {
      serviceLogger.error('Failed to get campaigns', error);
      throw new ServiceError('Unable to load campaigns', error as Error, 'CampaignService.getAllCampaigns');
    }
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    if (!id) {
      throw new ServiceError('Campaign ID is required', undefined, 'CampaignService.getCampaign');
    }

    try {
      serviceLogger.debug(`Fetching campaign ${id}`);
      return await this.campaignRepository.findById(id);
    } catch (error) {
      serviceLogger.error(`Failed to get campaign ${id}`, error);
      throw new ServiceError(`Unable to load campaign`, error as Error, 'CampaignService.getCampaign');
    }
  }

  async createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
    // Validate input
    ValidationUtils.validateAndThrow(data, ValidationSchemas.campaign);

    try {
      serviceLogger.debug('Creating new campaign', { name: data.name });
      const campaign = await this.campaignRepository.create(data);
      serviceLogger.info(`Campaign created: ${campaign.name} (${campaign.id})`);
      return campaign;
    } catch (error) {
      serviceLogger.error('Failed to create campaign', error);
      throw new ServiceError('Unable to create campaign', error as Error, 'CampaignService.createCampaign');
    }
  }

  async updateCampaign(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
    if (!id) {
      throw new ServiceError('Campaign ID is required', undefined, 'CampaignService.updateCampaign');
    }

    // Validate input
    ValidationUtils.validateAndThrow(data, ValidationSchemas.campaign);

    try {
      serviceLogger.debug(`Updating campaign ${id}`, data);
      const campaign = await this.campaignRepository.update(id, data);
      serviceLogger.info(`Campaign updated: ${campaign.name} (${campaign.id})`);
      return campaign;
    } catch (error) {
      serviceLogger.error(`Failed to update campaign ${id}`, error);
      throw new ServiceError('Unable to update campaign', error as Error, 'CampaignService.updateCampaign');
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    if (!id) {
      throw new ServiceError('Campaign ID is required', undefined, 'CampaignService.deleteCampaign');
    }

    try {
      serviceLogger.debug(`Deleting campaign ${id}`);
      await this.campaignRepository.delete(id);
      serviceLogger.info(`Campaign deleted: ${id}`);
    } catch (error) {
      serviceLogger.error(`Failed to delete campaign ${id}`, error);
      throw new ServiceError('Unable to delete campaign', error as Error, 'CampaignService.deleteCampaign');
    }
  }

  async searchCampaign(
    campaignId: string, 
    query: string, 
    types?: string[]
  ): Promise<CampaignSearchResult> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'CampaignService.searchCampaign');
    }

    if (!query || query.trim().length === 0) {
      throw new ServiceError('Search query is required', undefined, 'CampaignService.searchCampaign');
    }

    try {
      serviceLogger.debug(`Searching campaign ${campaignId}`, { query, types });
      const results = await this.campaignRepository.search(campaignId, query.trim(), types);
      serviceLogger.info(`Search completed: ${results.total || 0} results found`);
      return results;
    } catch (error) {
      serviceLogger.error('Campaign search failed', error);
      throw new ServiceError('Search failed', error as Error, 'CampaignService.searchCampaign');
    }
  }

  async exportCampaign(
    campaignId: string,
    options?: { entities?: string[]; include_stats?: boolean }
  ): Promise<Blob> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'CampaignService.exportCampaign');
    }

    try {
      serviceLogger.debug(`Exporting campaign ${campaignId}`, options);
      const exportData = await this.campaignRepository.export(campaignId, options);
      serviceLogger.info(`Campaign exported successfully: ${campaignId}`);
      
      // Convert to blob for download
      return new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
    } catch (error) {
      serviceLogger.error('Campaign export failed', error);
      throw new ServiceError('Export failed', error as Error, 'CampaignService.exportCampaign');
    }
  }

  async importCampaign(
    file: File,
    options?: { merge_duplicates?: boolean }
  ): Promise<Campaign[]> {
    if (!file) {
      throw new ServiceError('Import file is required', undefined, 'CampaignService.importCampaign');
    }

    // Validate file
    const fileErrors = ValidationUtils.validateFile(file, undefined, ['application/json']);
    if (fileErrors.length > 0) {
      throw new ServiceError(fileErrors.join(', '), undefined, 'CampaignService.importCampaign');
    }

    try {
      serviceLogger.debug('Importing campaign data', { filename: file.name });
      const result = await this.campaignRepository.import(file, options);
      serviceLogger.info(`Campaign import completed: ${result.imported_count || 0} campaigns`);
      return result.campaigns || [];
    } catch (error) {
      serviceLogger.error('Campaign import failed', error);
      throw new ServiceError('Import failed', error as Error, 'CampaignService.importCampaign');
    }
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    if (!campaignId) {
      throw new ServiceError('Campaign ID is required', undefined, 'CampaignService.getCampaignAnalytics');
    }

    try {
      serviceLogger.debug(`Fetching analytics for campaign ${campaignId}`);
      const analytics = await this.campaignRepository.getAnalytics(campaignId);
      serviceLogger.info(`Analytics loaded for campaign ${campaignId}`);
      return analytics;
    } catch (error) {
      serviceLogger.error('Failed to get campaign analytics', error);
      throw new ServiceError('Unable to load analytics', error as Error, 'CampaignService.getCampaignAnalytics');
    }
  }

  /**
   * Business logic for campaign validation
   */
  validateCampaignName(name: string): { isValid: boolean; message?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: 'Campaign name is required' };
    }

    if (name.length > 255) {
      return { isValid: false, message: 'Campaign name must be less than 255 characters' };
    }

    if (!/^[a-zA-Z0-9\s\-_'.]+$/.test(name)) {
      return { isValid: false, message: 'Campaign name contains invalid characters' };
    }

    return { isValid: true };
  }

  /**
   * Business logic for campaign status management
   */
  canDeleteCampaign(campaign: Campaign): { canDelete: boolean; reason?: string } {
    // Add business rules here
    return { canDelete: true };
  }

  /**
   * Generate campaign summary statistics
   */
  generateCampaignSummary(campaigns: Campaign[]): {
    total: number;
    recentlyActive: number;
    averageAge: number;
  } {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const recentlyActive = campaigns.filter(campaign => 
      new Date(campaign.lastModified) > thirtyDaysAgo
    ).length;

    const totalAge = campaigns.reduce((sum, campaign) => {
      const age = now.getTime() - new Date(campaign.createdAt).getTime();
      return sum + age;
    }, 0);

    const averageAge = campaigns.length > 0 ? totalAge / campaigns.length / (24 * 60 * 60 * 1000) : 0;

    return {
      total: campaigns.length,
      recentlyActive,
      averageAge: Math.round(averageAge)
    };
  }
}