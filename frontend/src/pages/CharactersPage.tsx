import React from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { CharactersView } from '../components/CharactersView';

const CharactersPage: React.FC = () => {
  const {
    currentCampaign,
    characters,
    locations,
    addCharacter,
    updateCharacter,
    deleteCharacter
  } = useApiCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    characters: characters.filter(character => character.campaignId === currentCampaign.id),
    locations: locations.filter(location => location.campaignId === currentCampaign.id),
  };

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
};

export default CharactersPage;