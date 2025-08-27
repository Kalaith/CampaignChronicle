import React, { useState, useEffect } from 'react';
import { useCampaignStore } from '../stores/campaignStore';
import { migrateLegacyData } from '../utils/localStorage';
import { CampaignSelection } from '../components/CampaignSelection';
import { NewCampaignModal } from '../components/Modal';

interface CampaignSelectionPageProps {
  onCampaignSelected: () => void;
}

const CampaignSelectionPage: React.FC<CampaignSelectionPageProps> = ({ onCampaignSelected }) => {
  const { campaigns, createCampaign, selectCampaign, deleteCampaign } = useCampaignStore();
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);

  // Migrate legacy localStorage data on app start
  useEffect(() => {
    migrateLegacyData();
  }, []);

  const handleCreateCampaign = (name: string, description: string) => {
    const newCampaign = createCampaign({ name, description });
    selectCampaign(newCampaign);
    onCampaignSelected();
  };

  const handleSelectCampaign = (campaign: any) => {
    selectCampaign(campaign);
    onCampaignSelected();
  };

  return (
    <>
      <CampaignSelection
        campaigns={campaigns}
        onSelectCampaign={handleSelectCampaign}
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
};

export default CampaignSelectionPage;