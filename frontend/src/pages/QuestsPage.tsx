import React from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { QuestsView } from '../components/QuestsView';

const QuestsPage: React.FC = () => {
  const {
    currentCampaign,
    quests,
    characters,
    locations,
    addQuest,
    updateQuest,
    deleteQuest
  } = useApiCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    quests: quests?.filter(quest => quest.campaignId === currentCampaign.id) || [],
    characters: characters.filter(character => character.campaignId === currentCampaign.id),
    locations: locations.filter(location => location.campaignId === currentCampaign.id),
  };

  return (
    <QuestsView
      quests={currentCampaignData.quests}
      characters={currentCampaignData.characters}
      locations={currentCampaignData.locations}
      onAddQuest={addQuest}
      onUpdateQuest={updateQuest}
      onDeleteQuest={deleteQuest}
      campaignId={currentCampaign.id}
    />
  );
};

export default QuestsPage;