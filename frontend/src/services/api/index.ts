// API Module Index - Centralized exports and client setup

import { BaseApiClient, apiClient, setTokenProvider } from './base';
import { CampaignApi } from './campaigns';
import { CharacterApi } from './characters';
import { DiceApi } from './dice';

// Create API instances using the shared client
export const campaignApi = new CampaignApi(apiClient);
export const characterApi = new CharacterApi(apiClient);
export const diceApi = new DiceApi(apiClient);

// Export the base client and utilities
export { apiClient, setTokenProvider, BaseApiClient };

// Export all API classes for custom instantiation
export { CampaignApi, CharacterApi, DiceApi };

// Legacy compatibility exports (for gradual migration)
export const legacyApi = {
  campaigns: campaignApi,
  characters: characterApi,
  dice: diceApi,
};

// Factory function to create API instances with custom client
export const createApiServices = (client: BaseApiClient) => ({
  campaigns: new CampaignApi(client),
  characters: new CharacterApi(client),
  dice: new DiceApi(client),
});

// Health check for all services
export const healthCheck = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, boolean>;
}> => {
  const results = {
    api: false,
  };

  try {
    await apiClient.healthCheck();
    results.api = true;
  } catch (error) {
    console.warn('API health check failed:', error);
  }

  const healthyServices = Object.values(results).filter(Boolean).length;
  const totalServices = Object.keys(results).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyServices === totalServices) {
    status = 'healthy';
  } else if (healthyServices > 0) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    services: results,
  };
};