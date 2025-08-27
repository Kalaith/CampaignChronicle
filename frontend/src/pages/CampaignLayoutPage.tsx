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
  const { currentCampaign, currentView, setCurrentView, selectCampaign } = useCampaignStore();
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
    setCurrentView(view);
    navigate(`/campaign/${view}`);
  };

  return (
    <MainLayout
      campaign={currentCampaign}
      currentView={currentView}
      onViewChange={handleViewChange}
      onBackToCampaigns={handleBackToCampaigns}
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