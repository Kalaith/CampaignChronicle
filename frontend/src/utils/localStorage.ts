// Utility functions for localStorage management

const OLD_STORAGE_KEY = 'campaign-chronicle';
const NEW_STORAGE_KEY = 'campaign-chronicle-storage';

export const migrateLegacyData = () => {
  try {
    // Check if we have legacy data
    const legacyData = localStorage.getItem(OLD_STORAGE_KEY);
    const newData = localStorage.getItem(NEW_STORAGE_KEY);
    
    // Only migrate if we have legacy data and no new data
    if (legacyData && !newData) {
      console.log('Migrating legacy campaign data...');
      const parsed = JSON.parse(legacyData);
      
      // Transform the data to match Zustand store format
      const migratedData = {
        state: {
          campaigns: parsed.campaigns || [],
          currentCampaign: parsed.currentCampaign || null,
          characters: parsed.characters || [],
          locations: parsed.locations || [],
          items: parsed.items || [],
          notes: parsed.notes || [],
          relationships: parsed.relationships || [],
          currentView: 'dashboard',
        },
        version: 0, // Zustand persist version
      };
      
      localStorage.setItem(NEW_STORAGE_KEY, JSON.stringify(migratedData));
      
      // Remove legacy data
      localStorage.removeItem(OLD_STORAGE_KEY);
      
      console.log('Legacy data migration completed');
      return true;
    }
  } catch (error) {
    console.error('Failed to migrate legacy data:', error);
  }
  
  return false;
};

export const clearAllCampaignData = () => {
  localStorage.removeItem(OLD_STORAGE_KEY);
  localStorage.removeItem(NEW_STORAGE_KEY);
};