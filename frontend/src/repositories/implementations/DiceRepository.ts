import type { ApiClient } from '../apiClient';
import type { IDiceRepository } from '../interfaces';
import type { DiceRoll, DiceTemplate } from '../../types';
import type { CreateDiceRollRequest, CreateDiceTemplateRequest, DiceStatisticsResponse } from '../../types/api';
import { apiLogger } from '../../utils/logger';
import { ServiceError } from '../../utils/errors';

export class DiceRepository implements IDiceRepository {
  constructor(private apiClient: ApiClient) {}

  async getRolls(campaignId: string, params?: {
    limit?: number;
    includePrivate?: boolean;
    since?: string;
    playerId?: string;
    context?: string;
  }): Promise<DiceRoll[]> {
    try {
      const endpoint = this.apiClient.buildUrl(`/campaigns/${campaignId}/dice/rolls`, params as Record<string, string | number | boolean> | undefined);
      return await this.apiClient.get<DiceRoll[]>(endpoint);
    } catch (error) {
      apiLogger.error(`Failed to get dice rolls for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to load dice rolls', error as Error, 'DiceRepository.getRolls');
    }
  }

  async createRoll(campaignId: string, rollData: CreateDiceRollRequest): Promise<DiceRoll> {
    try {
      return await this.apiClient.post<DiceRoll>(`/campaigns/${campaignId}/dice/rolls`, rollData);
    } catch (error) {
      apiLogger.error(`Failed to create dice roll for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to create dice roll', error as Error, 'DiceRepository.createRoll');
    }
  }

  async deleteRoll(campaignId: string, rollId: string): Promise<void> {
    try {
      await this.apiClient.delete<void>(`/campaigns/${campaignId}/dice/rolls/${rollId}`);
    } catch (error) {
      apiLogger.error(`Failed to delete dice roll ${rollId}`, error);
      throw new ServiceError('Failed to delete dice roll', error as Error, 'DiceRepository.deleteRoll');
    }
  }

  async clearRollHistory(campaignId: string, playerId?: string): Promise<unknown> {
    try {
      const endpoint = playerId
        ? this.apiClient.buildUrl(`/campaigns/${campaignId}/dice/rolls`, { player_id: playerId })
        : `/campaigns/${campaignId}/dice/rolls`;
      return await this.apiClient.delete<unknown>(endpoint);
    } catch (error) {
      apiLogger.error(`Failed to clear dice history for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to clear dice history', error as Error, 'DiceRepository.clearRollHistory');
    }
  }

  async getRecentRolls(campaignId: string, params?: { since?: string; limit?: number }): Promise<DiceRoll[]> {
    try {
      const endpoint = this.apiClient.buildUrl(`/campaigns/${campaignId}/dice/recent`, params as Record<string, string | number | boolean> | undefined);
      return await this.apiClient.get<DiceRoll[]>(endpoint);
    } catch (error) {
      apiLogger.error(`Failed to get recent dice rolls for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to load recent dice rolls', error as Error, 'DiceRepository.getRecentRolls');
    }
  }

  async getTemplates(campaignId: string): Promise<DiceTemplate[]> {
    try {
      const response = await this.apiClient.get<DiceTemplate[] | { templates: DiceTemplate[] }>(`/campaigns/${campaignId}/dice/templates`);
      if (Array.isArray(response)) {
        return response;
      }
      return response.templates || [];
    } catch (error) {
      apiLogger.error(`Failed to get dice templates for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to load dice templates', error as Error, 'DiceRepository.getTemplates');
    }
  }

  async createTemplate(campaignId: string, templateData: CreateDiceTemplateRequest): Promise<DiceTemplate> {
    try {
      return await this.apiClient.post<DiceTemplate>(`/campaigns/${campaignId}/dice/templates`, templateData);
    } catch (error) {
      apiLogger.error(`Failed to create dice template for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to create dice template', error as Error, 'DiceRepository.createTemplate');
    }
  }

  async updateTemplate(campaignId: string, templateId: string, updates: Partial<DiceTemplate>): Promise<DiceTemplate> {
    try {
      return await this.apiClient.put<DiceTemplate>(`/campaigns/${campaignId}/dice/templates/${templateId}`, updates);
    } catch (error) {
      apiLogger.error(`Failed to update dice template ${templateId}`, error);
      throw new ServiceError('Failed to update dice template', error as Error, 'DiceRepository.updateTemplate');
    }
  }

  async deleteTemplate(campaignId: string, templateId: string): Promise<void> {
    try {
      await this.apiClient.delete<void>(`/campaigns/${campaignId}/dice/templates/${templateId}`);
    } catch (error) {
      apiLogger.error(`Failed to delete dice template ${templateId}`, error);
      throw new ServiceError('Failed to delete dice template', error as Error, 'DiceRepository.deleteTemplate');
    }
  }

  async getStatistics(campaignId: string, params?: {
    player_id?: string;
    days?: number;
    context?: string;
  }): Promise<DiceStatisticsResponse> {
    try {
      const endpoint = this.apiClient.buildUrl(`/campaigns/${campaignId}/dice/statistics`, params as Record<string, string | number | boolean> | undefined);
      return await this.apiClient.get<DiceStatisticsResponse>(endpoint);
    } catch (error) {
      apiLogger.error(`Failed to get dice statistics for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to load dice statistics', error as Error, 'DiceRepository.getStatistics');
    }
  }
}

