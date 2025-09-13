import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { MainLayout } from '../components/MainLayout';
import DashboardPage from './DashboardPage';
import CharactersPage from './CharactersPage';
import LocationsPage from './LocationsPage';
import ItemsPage from './ItemsPage';
import NotesPage from './NotesPage';
import RelationshipsPage from './RelationshipsPage';
import TimelinePage from './TimelinePage';
import QuestsPage from './QuestsPage';
import MapsPage from './MapsPage';
import DiceRollerPage from './DiceRollerPage';

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
    relationships,
    timelineEvents,
    quests,
    maps
  } = useApiCampaignStore();
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
    const validViews = ['dashboard', 'characters', 'locations', 'items', 'relationships', 'notes', 'timeline', 'quests', 'maps', 'player-access', 'resources', 'dice-roller', 'mobile-companion'] as const;
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
    timelineEvents: timelineEvents.filter(e => e.campaignId === currentCampaign.id),
    quests: quests?.filter(q => q.campaignId === currentCampaign.id) || [],
    maps: maps?.filter(m => m.campaignId === currentCampaign.id) || [],
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
      timelineEvents={campaignData.timelineEvents}
      quests={campaignData.quests}
      maps={campaignData.maps}
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
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/quests" element={<QuestsPage />} />
        <Route path="/maps" element={<MapsPage />} />
        <Route path="/dice-roller" element={<DiceRollerPage />} />
      </Routes>
    </MainLayout>
  );
};

export default CampaignLayoutPage;