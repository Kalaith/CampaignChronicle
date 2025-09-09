import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { Dashboard } from '../components/Dashboard';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentCampaign,
    characters,
    locations,
    items,
    notes,
    setCurrentView
  } = useApiCampaignStore();

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

  const handleNavigateToView = (view: string) => {
    const validViews = ['dashboard', 'characters', 'locations', 'items', 'relationships', 'notes'] as const;
    type ValidView = typeof validViews[number];
    if (validViews.includes(view as ValidView)) {
      setCurrentView(view as ValidView);
      navigate(`/campaign/${view}`);
    }
  };

  return (
    <Dashboard
      characters={currentCampaignData.characters}
      locations={currentCampaignData.locations}
      items={currentCampaignData.items}
      notes={currentCampaignData.notes}
      onNavigateToView={handleNavigateToView}
    />
  );
};

export default DashboardPage;