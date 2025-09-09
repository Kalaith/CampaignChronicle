import type { Campaign, Character, Location, Item, Note, Relationship } from '../types';

export interface CampaignData {
  campaign: Campaign;
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  exportedAt: string;
  version: string;
}

export const exportCampaignData = (
  campaign: Campaign,
  characters: Character[],
  locations: Location[],
  items: Item[],
  notes: Note[],
  relationships: Relationship[]
): void => {
  const data: CampaignData = {
    campaign,
    characters: characters.filter(c => c.campaignId === campaign.id),
    locations: locations.filter(l => l.campaignId === campaign.id),
    items: items.filter(i => i.campaignId === campaign.id),
    notes: notes.filter(n => n.campaignId === campaign.id),
    relationships: relationships.filter(r => r.campaignId === campaign.id),
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${campaign.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

export const exportAllData = (): void => {
  try {
    const storageData = localStorage.getItem('campaign-chronicle-storage');
    if (!storageData) {
      throw new Error('No data found to export');
    }

    const data = JSON.parse(storageData);
    const exportData = {
      ...data.state,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      type: 'full_backup',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign_chronicle_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
    throw error;
  }
};

export const validateImportData = (data: unknown): boolean => {
  try {
    const dataObj = data as Record<string, unknown>;
    // Check if it's a campaign export or full backup
    if (dataObj.type === 'full_backup') {
      return (
        Array.isArray(dataObj.campaigns) &&
        Array.isArray(dataObj.characters) &&
        Array.isArray(dataObj.locations) &&
        Array.isArray(dataObj.items) &&
        Array.isArray(dataObj.notes) &&
        Array.isArray(dataObj.relationships)
      );
    } else {
      // Single campaign export
      const campaign = dataObj.campaign as Record<string, unknown> | undefined;
      return (
        campaign !== undefined &&
        typeof campaign.id === 'string' &&
        typeof campaign.name === 'string' &&
        Array.isArray(dataObj.characters) &&
        Array.isArray(dataObj.locations) &&
        Array.isArray(dataObj.items) &&
        Array.isArray(dataObj.notes) &&
        Array.isArray(dataObj.relationships)
      );
    }
  } catch {
    return false;
  }
};

export const importCampaignData = (
  file: File,
  onSuccess: (data: CampaignData | unknown) => void,
  onError: (error: string) => void
): void => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const result = e.target?.result as string;
      const data = JSON.parse(result);
      
      if (!validateImportData(data)) {
        throw new Error('Invalid file format. Please select a valid Campaign Chronicle export file.');
      }
      
      onSuccess(data);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to parse import file');
    }
  };
  
  reader.onerror = () => {
    onError('Failed to read file');
  };
  
  reader.readAsText(file);
};