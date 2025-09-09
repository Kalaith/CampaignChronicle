import React from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { RelationshipsView } from '../components/RelationshipsView';

const RelationshipsPage: React.FC = () => {
  const {
    currentCampaign,
    characters,
    relationships,
    addRelationship,
    deleteRelationship
  } = useApiCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    characters: characters.filter(character => character.campaignId === currentCampaign.id),
    relationships: relationships.filter(relationship => relationship.campaignId === currentCampaign.id),
  };

  return (
    <RelationshipsView
      relationships={currentCampaignData.relationships}
      characters={currentCampaignData.characters}
      onAddRelationship={addRelationship}
      onDeleteRelationship={deleteRelationship}
      campaignId={currentCampaign.id}
    />
  );
};

export default RelationshipsPage;