import { useState } from 'react';
import { useCampaignData } from './hooks/useCampaignData';
import { CampaignSelection } from './components/CampaignSelection';
import { NewCampaignModal } from './components/Modal';
import { MainLayout } from './components/MainLayout';
import { Dashboard } from './components/Dashboard';
import { CharactersView } from './components/CharactersView';
import { LocationsView } from './components/LocationsView';
import { ItemsView } from './components/ItemsView';
import { RelationshipsView } from './components/RelationshipsView';
import { NotesView } from './components/NotesView';

import './styles/App.css';

function App() {
  const {
    campaigns,
    currentCampaign,
    currentView,
    currentCampaignData,
    isLoaded,
    setCurrentView,
    createCampaign,
    selectCampaign,
    deleteCampaign,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addLocation,
    updateLocation,
    deleteLocation,
    addItem,
    updateItem,
    deleteItem,
    addNote,
    updateNote,
    deleteNote,
    addRelationship,
    deleteRelationship,
  } = useCampaignData();

  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  const handleCreateCampaign = (name: string, description: string) => {
    const newCampaign = createCampaign(name, description);
    selectCampaign(newCampaign);
  };

  const handleBackToCampaigns = () => {
    selectCampaign(null);
    setCurrentView('dashboard');
  };

  const renderCurrentView = () => {
    if (!currentCampaignData || !currentCampaign) return null;

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            characters={currentCampaignData.characters}
            locations={currentCampaignData.locations}
            items={currentCampaignData.items}
            notes={currentCampaignData.notes}
          />
        );
      case 'characters':
        return (
          <CharactersView
            characters={currentCampaignData.characters}
            locations={currentCampaignData.locations}
            onAddCharacter={addCharacter}
            onUpdateCharacter={updateCharacter}
            onDeleteCharacter={deleteCharacter}
            campaignId={currentCampaign.id}
          />
        );
      case 'notes':
        return (
          <NotesView
            notes={currentCampaignData.notes}
            onAddNote={addNote}
            onUpdateNote={updateNote}
            onDeleteNote={deleteNote}
            campaignId={currentCampaign.id}
          />
        );
      case 'locations':
        return (
          <LocationsView
            locations={currentCampaignData.locations}
            onAddLocation={addLocation}
            onUpdateLocation={updateLocation}
            onDeleteLocation={deleteLocation}
            campaignId={currentCampaign.id}
          />
        );
      case 'items':
        return (
          <ItemsView
            items={currentCampaignData.items}
            characters={currentCampaignData.characters}
            locations={currentCampaignData.locations}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
            campaignId={currentCampaign.id}
          />
        );
      case 'relationships':
        return (
          <RelationshipsView
            relationships={currentCampaignData.relationships}
            characters={currentCampaignData.characters}
            onAddRelationship={addRelationship}
            onDeleteRelationship={deleteRelationship}
            campaignId={currentCampaign.id}
          />
        );
      default:
        return <Dashboard
          characters={currentCampaignData.characters}
          locations={currentCampaignData.locations}
          items={currentCampaignData.items}
          notes={currentCampaignData.notes}
        />;
    }
  };

  // Show loading screen while data is being loaded from localStorage
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎲</div>
          <div className="text-xl text-gray-600">Loading Campaign Chronicle...</div>
        </div>
      </div>
    );
  }

  if (!currentCampaign) {
    return (
      <>
        <CampaignSelection
          campaigns={campaigns}
          onSelectCampaign={selectCampaign}
          onCreateCampaign={() => setIsNewCampaignModalOpen(true)}
          onDeleteCampaign={deleteCampaign}
        />
        <NewCampaignModal
          isOpen={isNewCampaignModalOpen}
          onClose={() => setIsNewCampaignModalOpen(false)}
          onSubmit={handleCreateCampaign}
        />
      </>
    );
  }

  return (
    <MainLayout
      campaign={currentCampaign}
      currentView={currentView}
      onViewChange={setCurrentView}
      onBackToCampaigns={handleBackToCampaigns}
    >
      {renderCurrentView()}
    </MainLayout>
  );
}

export default App;
