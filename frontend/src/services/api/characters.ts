// Character API Module - Focused on character-related API operations

import { BaseApiClient } from './base';
import type { 
  CharacterResponse, 
  CreateCharacterRequest, 
  UpdateCharacterRequest,
  CharacterStatistics,
  PaginatedResponse 
} from '../../types/api';

export class CharacterApi {
  constructor(private client: BaseApiClient) {}

  // Get all characters for a campaign
  async list(campaignId: string, filters?: {
    type?: string;
    level?: number;
    alive?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<CharacterResponse>> {
    const params: Record<string, string | number | boolean> = {};
    
    if (filters) {
      if (filters.type) params.type = filters.type;
      if (filters.level) params.level = filters.level;
      if (filters.alive !== undefined) params.alive = filters.alive;
      if (filters.search) params.search = filters.search;
      if (filters.page) params.page = filters.page;
      if (filters.per_page) params.per_page = filters.per_page;
    }
    
    return this.client.get<PaginatedResponse<CharacterResponse>>(`/campaigns/${campaignId}/characters`, params);
  }

  // Get a specific character by ID
  async get(characterId: string): Promise<CharacterResponse> {
    return this.client.get<CharacterResponse>(`/characters/${characterId}`);
  }

  // Create a new character
  async create(campaignId: string, data: CreateCharacterRequest): Promise<CharacterResponse> {
    return this.client.post<CharacterResponse>(`/campaigns/${campaignId}/characters`, data);
  }

  // Update an existing character
  async update(characterId: string, data: UpdateCharacterRequest): Promise<CharacterResponse> {
    return this.client.put<CharacterResponse>(`/characters/${characterId}`, data);
  }

  // Delete a character
  async delete(characterId: string): Promise<void> {
    return this.client.delete<void>(`/characters/${characterId}`);
  }

  // Update character HP
  async updateHP(characterId: string, hp: number, maxHp?: number): Promise<CharacterResponse> {
    return this.client.patch<CharacterResponse>(`/characters/${characterId}/hp`, { 
      hp, 
      ...(maxHp !== undefined && { max_hp: maxHp }) 
    });
  }

  // Update character status
  async updateStatus(characterId: string, status: string): Promise<CharacterResponse> {
    return this.client.patch<CharacterResponse>(`/characters/${characterId}/status`, { status });
  }

  // Level up a character
  async levelUp(characterId: string, newLevel: number): Promise<CharacterResponse> {
    return this.client.post<CharacterResponse>(`/characters/${characterId}/level-up`, { level: newLevel });
  }

  // Get character statistics for a campaign
  async getStatistics(campaignId: string): Promise<CharacterStatistics> {
    return this.client.get<CharacterStatistics>(`/campaigns/${campaignId}/characters/statistics`);
  }

  // Upload character portrait
  async uploadPortrait(characterId: string, file: File): Promise<{ portrait_url: string }> {
    const formData = new FormData();
    formData.append('portrait', file);
    
    return this.client.post<{ portrait_url: string }>(`/characters/${characterId}/portrait`, formData);
  }

  // Remove character portrait
  async removePortrait(characterId: string): Promise<void> {
    return this.client.delete<void>(`/characters/${characterId}/portrait`);
  }

  // Get character relationships
  async getRelationships(characterId: string): Promise<{
    relationships: Array<{
      id: string;
      target_character_id: string;
      target_character_name: string;
      relationship_type: string;
      description?: string;
    }>;
  }> {
    return this.client.get<{
      relationships: Array<{
        id: string;
        target_character_id: string;
        target_character_name: string;
        relationship_type: string;
        description?: string;
      }>;
    }>(`/characters/${characterId}/relationships`);
  }

  // Add character relationship
  async addRelationship(characterId: string, data: {
    target_character_id: string;
    relationship_type: string;
    description?: string;
  }): Promise<void> {
    return this.client.post<void>(`/characters/${characterId}/relationships`, data);
  }

  // Remove character relationship
  async removeRelationship(characterId: string, relationshipId: string): Promise<void> {
    return this.client.delete<void>(`/characters/${characterId}/relationships/${relationshipId}`);
  }

  // Get character notes
  async getNotes(characterId: string): Promise<{
    notes: Array<{
      id: string;
      title: string;
      content: string;
      created_at: string;
      updated_at: string;
    }>;
  }> {
    return this.client.get<{
      notes: Array<{
        id: string;
        title: string;
        content: string;
        created_at: string;
        updated_at: string;
      }>;
    }>(`/characters/${characterId}/notes`);
  }

  // Add character note
  async addNote(characterId: string, data: {
    title: string;
    content: string;
  }): Promise<{
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
  }> {
    return this.client.post<{
      id: string;
      title: string;
      content: string;
      created_at: string;
      updated_at: string;
    }>(`/characters/${characterId}/notes`, data);
  }

  // Update character note
  async updateNote(characterId: string, noteId: string, data: {
    title?: string;
    content?: string;
  }): Promise<{
    id: string;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
  }> {
    return this.client.put<{
      id: string;
      title: string;
      content: string;
      created_at: string;
      updated_at: string;
    }>(`/characters/${characterId}/notes/${noteId}`, data);
  }

  // Delete character note
  async deleteNote(characterId: string, noteId: string): Promise<void> {
    return this.client.delete<void>(`/characters/${characterId}/notes/${noteId}`);
  }

  // Generate random character (NPC generator)
  async generateRandom(campaignId: string, options?: {
    race?: string;
    type?: 'NPC' | 'Villain' | 'Ally';
    level_range?: [number, number];
  }): Promise<CharacterResponse> {
    return this.client.post<CharacterResponse>(`/campaigns/${campaignId}/characters/generate`, options);
  }
}