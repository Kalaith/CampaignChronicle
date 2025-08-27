import React from 'react';
import { useCampaignStore } from '../stores/campaignStore';
import { Dashboard } from '../components/Dashboard';

const DashboardPage: React.FC = () => {
  const {
    currentCampaign,
    characters,
    locations,
    items,
    notes
  } = useCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    characters: characters.filter(character => character.campaignId === currentCampaign.id),
    locations: locations.filter(location => location.campaignId === currentCampaign.id),
    items: items.filter(item => item.campaignId === currentCampaign.id),
    notes: notes.filter(note => note.campaignId === currentCampaign.id),
  };

  return (
    <Dashboard
      characters={currentCampaignData.characters}
      locations={currentCampaignData.locations}
      items={currentCampaignData.items}
      notes={currentCampaignData.notes}
    />
  );
};

export default DashboardPage;