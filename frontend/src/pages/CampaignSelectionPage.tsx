import React, { useState, useEffect } from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { migrateLegacyData } from '../utils/localStorage';
import { CampaignSelection } from '../components/CampaignSelection';
import { NewCampaignModal } from '../components/Modal';
import type { Campaign } from '../types';

interface CampaignSelectionPageProps {
  onCampaignSelected: () => void;
}

const CampaignSelectionPage: React.FC<CampaignSelectionPageProps> = ({ onCampaignSelected }) => {
  const { campaigns, createCampaign, selectCampaign, deleteCampaign, loadCampaigns, isLoading, error } = useApiCampaignStore();
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Load campaigns on mount
  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleCreateCampaign = async (name: string, description: string) => {
    try {
      const newCampaign = await createCampaign({ name, description });
      await selectCampaign(newCampaign);
      onCampaignSelected();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleSelectCampaign = async (campaign: Campaign) => {
    try {
      await selectCampaign(campaign);
      onCampaignSelected();
    } catch (error) {
      console.error('Failed to select campaign:', error);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => loadCampaigns()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <CampaignSelection
        campaigns={campaigns}
        onSelectCampaign={handleSelectCampaign}
        onCreateCampaign={() => setIsNewCampaignModalOpen(true)}
        onDeleteCampaign={deleteCampaign}
        isLoading={isLoading}
      />
      <NewCampaignModal
        isOpen={isNewCampaignModalOpen}
        onClose={() => setIsNewCampaignModalOpen(false)}
        onSubmit={handleCreateCampaign}
      />
    </>
  );
};

export default CampaignSelectionPage;