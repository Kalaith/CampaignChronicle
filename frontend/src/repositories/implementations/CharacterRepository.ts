import type { ApiClient } from '../apiClient';
import type { ICharacterRepository } from '../interfaces';
import type { Character, Relationship } from '../../types';
import type { CreateCharacterRequest, PaginatedResponse, SearchFilters, UpdateCharacterRequest } from '../../types/api';
import { apiLogger } from '../../utils/logger';
import { ServiceError } from '../../utils/errors';

export class CharacterRepository implements ICharacterRepository {
  constructor(private apiClient: ApiClient) {}

  async findAll(): Promise<Character[]> {
    try {
      return await this.apiClient.get<Character[]>('/characters');
    } catch (error) {
      apiLogger.error('Failed to fetch all characters', error);
      throw new ServiceError('Failed to load characters', error as Error, 'CharacterRepository.findAll');
    }
  }

  async findById(id: string): Promise<Character | null> {
    try {
      return await this.apiClient.get<Character>(`/characters/${id}`);
    } catch (error) {
      if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) {
        return null;
      }
      apiLogger.error(`Failed to fetch character ${id}`, error);
      throw new ServiceError('Failed to load character', error as Error, 'CharacterRepository.findById');
    }
  }

  async create(data: CreateCharacterRequest): Promise<Character> {
    try {
      return await this.apiClient.post<Character>(`/campaigns/${data.campaignId}/characters`, data);
    } catch (error) {
      apiLogger.error('Failed to create character', error);
      throw new ServiceError('Failed to create character', error as Error, 'CharacterRepository.create');
    }
  }

  async update(id: string, data: UpdateCharacterRequest): Promise<Character> {
    try {
      return await this.apiClient.put<Character>(`/characters/${id}`, data);
    } catch (error) {
      apiLogger.error(`Failed to update character ${id}`, error);
      throw new ServiceError('Failed to update character', error as Error, 'CharacterRepository.update');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.apiClient.delete<void>(`/characters/${id}`);
    } catch (error) {
      apiLogger.error(`Failed to delete character ${id}`, error);
      throw new ServiceError('Failed to delete character', error as Error, 'CharacterRepository.delete');
    }
  }

  async findByCampaign(campaignId: string, filters?: SearchFilters): Promise<PaginatedResponse<Character>> {
    try {
      const endpoint = this.apiClient.buildUrl(`/campaigns/${campaignId}/characters`, filters as Record<string, string | number | boolean> | undefined);
      return await this.apiClient.get<PaginatedResponse<Character>>(endpoint);
    } catch (error) {
      apiLogger.error(`Failed to fetch characters for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to load campaign characters', error as Error, 'CharacterRepository.findByCampaign');
    }
  }

  async findByLocation(locationId: string): Promise<Character[]> {
    try {
      return await this.apiClient.get<Character[]>(`/locations/${locationId}/characters`);
    } catch (error) {
      apiLogger.error(`Failed to fetch characters for location ${locationId}`, error);
      throw new ServiceError('Failed to load location characters', error as Error, 'CharacterRepository.findByLocation');
    }
  }

  async getRelationships(characterId: string): Promise<Relationship[]> {
    try {
      const response = await this.apiClient.get<Relationship[] | { relationships: Relationship[] }>(`/characters/${characterId}/relationships`);
      if (Array.isArray(response)) {
        return response;
      }
      return response.relationships || [];
    } catch (error) {
      apiLogger.error(`Failed to fetch relationships for character ${characterId}`, error);
      throw new ServiceError('Failed to load character relationships', error as Error, 'CharacterRepository.getRelationships');
    }
  }

  async getStatistics(campaignId: string): Promise<unknown> {
    try {
      return await this.apiClient.get<unknown>(`/campaigns/${campaignId}/characters/statistics`);
    } catch (error) {
      apiLogger.error(`Failed to fetch character statistics for campaign ${campaignId}`, error);
      throw new ServiceError('Failed to load character statistics', error as Error, 'CharacterRepository.getStatistics');
    }
  }

  async updateStats(characterId: string, stats: { hp?: number; max_hp?: number; ac?: number }): Promise<Character> {
    try {
      return await this.apiClient.patch<Character>(`/characters/${characterId}/stats`, stats);
    } catch (error) {
      apiLogger.error(`Failed to update stats for character ${characterId}`, error);
      throw new ServiceError('Failed to update character stats', error as Error, 'CharacterRepository.updateStats');
    }
  }
}

