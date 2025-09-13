const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Base API response structure
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Global token provider function that will be set by the auth context
let getAccessToken: (() => Promise<string>) | null = null;

// Set the token provider (called from auth context)
export function setTokenProvider(provider: () => Promise<string>) {
  getAccessToken = provider;
}

// Get auth headers using Auth0 access token
async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!getAccessToken) {
    throw new Error('Token provider not set. Make sure auth context is initialized.');
  }
  
  try {
    const token = await getAccessToken();
    return { 'Authorization': `Bearer ${token}` };
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw new Error('Failed to get authentication token');
  }
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const authHeaders = await getAuthHeaders();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...authHeaders,
  };

  const config: RequestInit = {
    ...options,
    credentials: 'include', // Include cookies for Auth0 session
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new ApiError(response.status, result.message);
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
  }
}

// Campaign API
export const campaignApi = {
  // Get all campaigns
  async list(): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>('/campaigns');
  },

  // Get campaign by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/campaigns/${id}`);
  },

  // Create new campaign
  async create(campaign: { name: string; description?: string }): Promise<any> {
    return apiRequest<any>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  },

  // Update campaign
  async update(id: string, updates: { name?: string; description?: string }): Promise<any> {
    return apiRequest<any>(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete campaign
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  // Search campaign entities
  async search(id: string, query: string, types?: string[]): Promise<any> {
    const params = new URLSearchParams({ q: query });
    if (types && types.length > 0) {
      params.append('types', types.join(','));
    }
    return apiRequest<any>(`/campaigns/${id}/search?${params.toString()}`);
  },

  // Export campaign
  async export(id: string, options?: { entities?: string[]; include_stats?: boolean }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.entities) {
      params.append('entities', options.entities.join(','));
    }
    if (options?.include_stats) {
      params.append('include_stats', 'true');
    }
    const query = params.toString();
    return apiRequest<any>(`/campaigns/${id}/export${query ? '?' + query : ''}`);
  },

  // Import campaign
  async import(data: any): Promise<any> {
    return apiRequest<any>('/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Character API
export const characterApi = {
  // Get characters for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/characters`);
  },

  // Get character by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/characters/${id}`);
  },

  // Create character in campaign
  async create(campaignId: string, character: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/characters`, {
      method: 'POST',
      body: JSON.stringify(character),
    });
  },

  // Update character
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete character
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/characters/${id}`, {
      method: 'DELETE',
    });
  },

  // Get character relationships
  async getRelationships(id: string): Promise<any[]> {
    return apiRequest<any[]>(`/characters/${id}/relationships`);
  },
};

// Location API
export const locationApi = {
  // Get locations for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/locations`);
  },

  // Get location by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/locations/${id}`);
  },

  // Create location in campaign
  async create(campaignId: string, location: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/locations`, {
      method: 'POST',
      body: JSON.stringify(location),
    });
  },

  // Update location
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete location
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/locations/${id}`, {
      method: 'DELETE',
    });
  },

  // Get location hierarchy
  async getHierarchy(campaignId: string): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/locations/hierarchy`);
  },
};

// Item API
export const itemApi = {
  // Get items for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/items`);
  },

  // Get item by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/items/${id}`);
  },

  // Create item in campaign
  async create(campaignId: string, item: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  // Update item
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete item
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/items/${id}`, {
      method: 'DELETE',
    });
  },

  // Transfer item
  async transfer(id: string, target: { to_character?: string; to_location?: string }): Promise<any> {
    return apiRequest<any>(`/items/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify(target),
    });
  },
};

// Note API
export const noteApi = {
  // Get notes for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/notes`);
  },

  // Get note by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/notes/${id}`);
  },

  // Create note in campaign
  async create(campaignId: string, note: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  // Update note
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete note
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/notes/${id}`, {
      method: 'DELETE',
    });
  },

  // Search notes
  async search(campaignId: string, query: string): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/notes/search?q=${encodeURIComponent(query)}`);
  },
};

// Relationship API
export const relationshipApi = {
  // Get relationships for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/relationships`);
  },

  // Get relationship by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/relationships/${id}`);
  },

  // Create relationship in campaign
  async create(campaignId: string, relationship: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/relationships`, {
      method: 'POST',
      body: JSON.stringify(relationship),
    });
  },

  // Update relationship
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/relationships/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete relationship
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/relationships/${id}`, {
      method: 'DELETE',
    });
  },

  // Get network data
  async getNetwork(campaignId: string): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/relationships/network`);
  },
};

// Timeline API
export const timelineApi = {
  // Get timeline events for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/timeline`);
  },

  // Get timeline event by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/timeline/${id}`);
  },

  // Create timeline event in campaign
  async create(campaignId: string, event: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  // Update timeline event
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/timeline/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete timeline event
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/timeline/${id}`, {
      method: 'DELETE',
    });
  },

  // Get grouped by sessions
  async getGroupedBySessions(campaignId: string): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/timeline/grouped`);
  },
};

// Quest API
export const questApi = {
  // Get quests for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/quests`);
  },

  // Get quest by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/quests/${id}`);
  },

  // Create quest in campaign
  async create(campaignId: string, quest: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/quests`, {
      method: 'POST',
      body: JSON.stringify(quest),
    });
  },

  // Update quest
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/quests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete quest
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/quests/${id}`, {
      method: 'DELETE',
    });
  },
};

// Map API
export const mapApi = {
  // Get maps for campaign
  async list(campaignId: string): Promise<PaginatedResponse<any>> {
    return apiRequest<PaginatedResponse<any>>(`/campaigns/${campaignId}/maps`);
  },

  // Get map by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/maps/${id}`);
  },

  // Create map in campaign with image upload
  async create(campaignId: string, mapData: { name: string; description?: string; imageFile: File }): Promise<any> {
    const authHeaders = await getAuthHeaders();
    
    const formData = new FormData();
    formData.append('name', mapData.name);
    if (mapData.description) {
      formData.append('description', mapData.description);
    }
    formData.append('image', mapData.imageFile);

    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/maps`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...authHeaders,
      },
      body: formData,
    });

    const result: ApiResponse<any> = await response.json();

    if (!result.success) {
      throw new ApiError(response.status, result.message);
    }

    return result.data;
  },

  // Update map
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/maps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete map
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/maps/${id}`, {
      method: 'DELETE',
    });
  },

  // Add pin to map
  async addPin(id: string, pin: any): Promise<any> {
    return apiRequest<any>(`/maps/${id}/pins`, {
      method: 'POST',
      body: JSON.stringify(pin),
    });
  },

  // Update pin on map
  async updatePin(mapId: string, pinId: string, updates: any): Promise<any> {
    return apiRequest<any>(`/maps/${mapId}/pins/${pinId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete pin from map
  async deletePin(mapId: string, pinId: string): Promise<void> {
    return apiRequest<void>(`/maps/${mapId}/pins/${pinId}`, {
      method: 'DELETE',
    });
  },

  // Add route to map
  async addRoute(id: string, route: any): Promise<any> {
    return apiRequest<any>(`/maps/${id}/routes`, {
      method: 'POST',
      body: JSON.stringify(route),
    });
  },

  // Update route on map
  async updateRoute(mapId: string, routeId: string, updates: any): Promise<any> {
    return apiRequest<any>(`/maps/${mapId}/routes/${routeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete route from map
  async deleteRoute(mapId: string, routeId: string): Promise<void> {
    return apiRequest<void>(`/maps/${mapId}/routes/${routeId}`, {
      method: 'DELETE',
    });
  },
};

// Player Access API
export const playerAccessApi = {
  // Get player access grants for campaign
  async list(campaignId: string, status?: string): Promise<any[]> {
    const params = status ? `?status=${status}` : '';
    return apiRequest<any[]>(`/campaigns/${campaignId}/players${params}`);
  },

  // Get player access by ID
  async get(campaignId: string, accessId: string): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/players/${accessId}`);
  },

  // Invite player (create access grant)
  async invite(campaignId: string, playerData: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/players`, {
      method: 'POST',
      body: JSON.stringify(playerData),
    });
  },

  // Update player access
  async update(campaignId: string, accessId: string, updates: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/players/${accessId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Revoke player access
  async revoke(campaignId: string, accessId: string): Promise<void> {
    return apiRequest<void>(`/campaigns/${campaignId}/players/${accessId}`, {
      method: 'DELETE',
    });
  },

  // Regenerate access token
  async regenerateToken(campaignId: string, accessId: string): Promise<{ access_token: string }> {
    return apiRequest<{ access_token: string }>(`/campaigns/${campaignId}/players/${accessId}/regenerate-token`, {
      method: 'POST',
    });
  },

  // Get available permissions
  async getPermissions(): Promise<any> {
    return apiRequest<any>('/players/permissions');
  },

  // Player portal access (public)
  async portalAccess(token: string): Promise<any> {
    return apiRequest<any>(`/player-portal/${token}`);
  },

  // Get campaign data for player portal (public)
  async getCampaignData(token: string): Promise<any> {
    return apiRequest<any>(`/player-portal/${token}/campaign`);
  },
};

// Shared Resource API
export const sharedResourceApi = {
  // Get shared resources for campaign
  async list(campaignId: string, filters?: { type?: string; category?: string; access_level?: string; tag?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/campaigns/${campaignId}/resources${query}`);
  },

  // Get resource by ID
  async get(id: string): Promise<any> {
    return apiRequest<any>(`/resources/${id}`);
  },

  // Upload resource
  async upload(campaignId: string, formData: FormData): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/resources`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it for FormData
      headers: {},
    });
  },

  // Update resource
  async update(id: string, updates: any): Promise<any> {
    return apiRequest<any>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete resource
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/resources/${id}`, {
      method: 'DELETE',
    });
  },

  // Download resource
  async download(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/resources/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new ApiError('Download failed', response.status, await response.text());
    }

    return response.blob();
  },

  // Get resource info (types, categories, etc.)
  async getResourceInfo(): Promise<any> {
    return apiRequest<any>('/resources/info');
  },

  // Player portal resource access (public)
  async playerList(token: string, filters?: { type?: string; category?: string }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/player-portal/${token}/resources${query}`);
  },
};

// Dice Rolling API
export const diceApi = {
  // Get roll history for campaign
  async getRolls(campaignId: string, params?: { 
    limit?: number; 
    includePrivate?: boolean;
    since?: string;
    playerId?: string;
    context?: string;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<any[]>(`/campaigns/${campaignId}/dice/rolls${query}`);
  },

  // Create a new roll
  async createRoll(campaignId: string, rollData: {
    expression: string;
    result: number;
    individual_rolls: number[];
    modifier?: number;
    context?: string;
    advantage?: boolean;
    disadvantage?: boolean;
    critical?: boolean;
    tags?: string[];
    is_private?: boolean;
    player_id?: string;
    player_name?: string;
  }): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/dice/rolls`, {
      method: 'POST',
      body: JSON.stringify(rollData),
    });
  },

  // Delete a specific roll
  async deleteRoll(campaignId: string, rollId: string): Promise<void> {
    return apiRequest<void>(`/campaigns/${campaignId}/dice/rolls/${rollId}`, {
      method: 'DELETE',
    });
  },

  // Clear roll history
  async clearRollHistory(campaignId: string, playerId?: string): Promise<any> {
    const body = playerId ? JSON.stringify({ player_id: playerId }) : undefined;
    return apiRequest<any>(`/campaigns/${campaignId}/dice/rolls`, {
      method: 'DELETE',
      body,
    });
  },

  // Get roll templates
  async getTemplates(campaignId: string): Promise<any[]> {
    return apiRequest<any[]>(`/campaigns/${campaignId}/dice/templates`);
  },

  // Create a new template
  async createTemplate(campaignId: string, templateData: {
    name: string;
    expression: string;
    description?: string;
    category: 'attack' | 'damage' | 'save' | 'skill' | 'custom';
    tags?: string[];
  }): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/dice/templates`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },

  // Update a template
  async updateTemplate(campaignId: string, templateId: string, updates: any): Promise<any> {
    return apiRequest<any>(`/campaigns/${campaignId}/dice/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete a template
  async deleteTemplate(campaignId: string, templateId: string): Promise<void> {
    return apiRequest<void>(`/campaigns/${campaignId}/dice/templates/${templateId}`, {
      method: 'DELETE',
    });
  },

  // Get roll statistics
  async getStatistics(campaignId: string, params?: {
    player_id?: string;
    days?: number;
    context?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<any>(`/campaigns/${campaignId}/dice/statistics${query}`);
  },

  // Get recent rolls (for real-time updates)
  async getRecentRolls(campaignId: string, params?: {
    since?: string;
    limit?: number;
  }): Promise<any[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return apiRequest<any[]>(`/campaigns/${campaignId}/dice/recent${query}`);
  },
};

export { ApiError };