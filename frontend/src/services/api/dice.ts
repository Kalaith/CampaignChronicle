// Dice API Module - Focused on dice rolling and template operations

import { BaseApiClient } from './base';
import type { 
  DiceRollResponse, 
  DiceTemplateResponse,
  CreateDiceTemplateRequest,
  UpdateDiceTemplateRequest,
  DiceStatistics,
  PaginatedResponse 
} from '../../types/api';

export class DiceApi {
  constructor(private client: BaseApiClient) {}

  // Roll dice
  async roll(campaignId: string, data: {
    expression: string;
    context?: string;
    advantage?: boolean;
    disadvantage?: boolean;
    is_private?: boolean;
    player_id?: string;
    player_name?: string;
  }): Promise<DiceRollResponse> {
    return this.client.post<DiceRollResponse>(`/campaigns/${campaignId}/dice/roll`, data);
  }

  // Get dice roll history
  async getHistory(campaignId: string, options?: {
    limit?: number;
    offset?: number;
    player_id?: string;
    is_private?: boolean;
    expression_filter?: string;
  }): Promise<PaginatedResponse<DiceRollResponse>> {
    const params: Record<string, string | number | boolean> = {};
    
    if (options) {
      if (options.limit) params.limit = options.limit;
      if (options.offset) params.offset = options.offset;
      if (options.player_id) params.player_id = options.player_id;
      if (options.is_private !== undefined) params.is_private = options.is_private;
      if (options.expression_filter) params.expression_filter = options.expression_filter;
    }
    
    return this.client.get<PaginatedResponse<DiceRollResponse>>(`/campaigns/${campaignId}/dice/history`, params);
  }

  // Delete a dice roll
  async deleteRoll(rollId: string): Promise<void> {
    return this.client.delete<void>(`/dice/rolls/${rollId}`);
  }

  // Clear dice history for a campaign
  async clearHistory(campaignId: string): Promise<void> {
    return this.client.delete<void>(`/campaigns/${campaignId}/dice/history`);
  }

  // Get dice statistics
  async getStatistics(campaignId: string, options?: {
    player_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<DiceStatistics> {
    const params: Record<string, string> = {};
    
    if (options) {
      if (options.player_id) params.player_id = options.player_id;
      if (options.date_from) params.date_from = options.date_from;
      if (options.date_to) params.date_to = options.date_to;
    }
    
    return this.client.get<DiceStatistics>(`/campaigns/${campaignId}/dice/statistics`, params);
  }

  // Get dice templates for a campaign
  async getTemplates(campaignId: string): Promise<{
    templates: DiceTemplateResponse[];
  }> {
    return this.client.get<{
      templates: DiceTemplateResponse[];
    }>(`/campaigns/${campaignId}/dice/templates`);
  }

  // Create a new dice template
  async createTemplate(campaignId: string, data: CreateDiceTemplateRequest): Promise<DiceTemplateResponse> {
    return this.client.post<DiceTemplateResponse>(`/campaigns/${campaignId}/dice/templates`, data);
  }

  // Update a dice template
  async updateTemplate(templateId: string, data: UpdateDiceTemplateRequest): Promise<DiceTemplateResponse> {
    return this.client.put<DiceTemplateResponse>(`/dice/templates/${templateId}`, data);
  }

  // Delete a dice template
  async deleteTemplate(templateId: string): Promise<void> {
    return this.client.delete<void>(`/dice/templates/${templateId}`);
  }

  // Use a dice template (roll with template)
  async useTemplate(templateId: string, options?: {
    advantage?: boolean;
    disadvantage?: boolean;
    is_private?: boolean;
    context?: string;
  }): Promise<DiceRollResponse> {
    return this.client.post<DiceRollResponse>(`/dice/templates/${templateId}/roll`, options);
  }

  // Get common dice expressions
  async getCommonExpressions(): Promise<{
    expressions: Array<{
      name: string;
      expression: string;
      description: string;
      category: string;
    }>;
  }> {
    return this.client.get<{
      expressions: Array<{
        name: string;
        expression: string;
        description: string;
        category: string;
      }>;
    }>('/dice/common-expressions');
  }

  // Validate dice expression
  async validateExpression(expression: string): Promise<{
    is_valid: boolean;
    message?: string;
    parsed?: {
      num_dice: number;
      sides: number;
      modifier: number;
    };
  }> {
    return this.client.post<{
      is_valid: boolean;
      message?: string;
      parsed?: {
        num_dice: number;
        sides: number;
        modifier: number;
      };
    }>('/dice/validate', { expression });
  }

  // Roll multiple dice at once
  async rollMultiple(campaignId: string, rolls: Array<{
    expression: string;
    context?: string;
    advantage?: boolean;
    disadvantage?: boolean;
  }>): Promise<{
    rolls: DiceRollResponse[];
    total?: number;
  }> {
    return this.client.post<{
      rolls: DiceRollResponse[];
      total?: number;
    }>(`/campaigns/${campaignId}/dice/roll-multiple`, { rolls });
  }

  // Get dice leaderboard
  async getLeaderboard(campaignId: string, type: 'highest' | 'critical_hits' | 'most_rolls' = 'highest'): Promise<{
    leaderboard: Array<{
      player_id?: string;
      player_name?: string;
      value: number;
      rank: number;
    }>;
  }> {
    return this.client.get<{
      leaderboard: Array<{
        player_id?: string;
        player_name?: string;
        value: number;
        rank: number;
      }>;
    }>(`/campaigns/${campaignId}/dice/leaderboard`, { type });
  }
}