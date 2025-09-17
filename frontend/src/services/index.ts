// Service Layer Export - Centralized service exports

export { CampaignService } from './CampaignService';
export { DiceService } from './DiceService';
export { CharacterService } from './CharacterService';

// Service factory to create service instances with dependency injection
import { apiClient } from '../repositories/apiClient';
import { CampaignRepository } from '../repositories/implementations/CampaignRepository';
import { DiceRepository } from '../repositories/implementations/DiceRepository';
import { CharacterRepository } from '../repositories/implementations/CharacterRepository';

// Create repository instances
const campaignRepository = new CampaignRepository(apiClient);
const diceRepository = new DiceRepository(apiClient);
const characterRepository = new CharacterRepository(apiClient);

// Create service instances
export const campaignService = new CampaignService(campaignRepository);
export const diceService = new DiceService(diceRepository);
export const characterService = new CharacterService(characterRepository);

// Service factory for testing or custom configurations
export const createServices = (customApiClient?: typeof apiClient) => {
  const client = customApiClient || apiClient;
  
  const repositories = {
    campaign: new CampaignRepository(client),
    dice: new DiceRepository(client),
    character: new CharacterRepository(client)
  };

  return {
    campaign: new CampaignService(repositories.campaign),
    dice: new DiceService(repositories.dice),
    character: new CharacterService(repositories.character)
  };
};

// Type exports for service interfaces
export type { DiceRollHistoryOptions } from './DiceService';
export type { CharacterFilterOptions } from './CharacterService';