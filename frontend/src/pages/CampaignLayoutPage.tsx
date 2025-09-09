import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useCampaignStore } from '../stores/campaignStore';
import { MainLayout } from '../components/MainLayout';
import DashboardPage from './DashboardPage';
import CharactersPage from './CharactersPage';
import LocationsPage from './LocationsPage';
import ItemsPage from './ItemsPage';
import NotesPage from './NotesPage';
import RelationshipsPage from './RelationshipsPage';

const CampaignLayoutPage: React.FC = () => {
  const { 
    currentCampaign, 
    currentView, 
    setCurrentView, 
    selectCampaign,
    characters,
    locations,
    items,
    notes,
    relationships
  } = useCampaignStore();
  const navigate = useNavigate();

  if (!currentCampaign) {
    return null;
  }

  const handleBackToCampaigns = () => {
    selectCampaign(null);
    setCurrentView('dashboard');
    navigate('/');
  };

  const handleViewChange = (view: string) => {
    const validViews = ['dashboard', 'characters', 'locations', 'items', 'relationships', 'notes'] as const;
    type ValidView = typeof validViews[number];
    if (validViews.includes(view as ValidView)) {
      setCurrentView(view as ValidView);
      navigate(`/campaign/${view}`);
    }
  };

  const handleSearchResultClick = (result: any) => {
    console.log('Search result clicked:', result);
  };

  const handleNavigateToView = (view: string) => {
    handleViewChange(view);
  };

  // Filter data for current campaign
  const campaignData = {
    characters: characters.filter(c => c.campaignId === currentCampaign.id),
    locations: locations.filter(l => l.campaignId === currentCampaign.id),
    items: items.filter(i => i.campaignId === currentCampaign.id),
    notes: notes.filter(n => n.campaignId === currentCampaign.id),
    relationships: relationships.filter(r => r.campaignId === currentCampaign.id),
  };

  return (
    <MainLayout
      campaign={currentCampaign}
      currentView={currentView}
      onViewChange={handleViewChange}
      onBackToCampaigns={handleBackToCampaigns}
      characters={campaignData.characters}
      locations={campaignData.locations}
      items={campaignData.items}
      notes={campaignData.notes}
      relationships={campaignData.relationships}
      onSearchResultClick={handleSearchResultClick}
      onNavigateToView={handleNavigateToView}
    >
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/characters" element={<CharactersPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/relationships" element={<RelationshipsPage />} />
      </Routes>
    </MainLayout>
  );
};

export default CampaignLayoutPage;