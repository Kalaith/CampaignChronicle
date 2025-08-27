import React from 'react';
import { useCampaignStore } from '../stores/campaignStore';
import { ItemsView } from '../components/ItemsView';

const ItemsPage: React.FC = () => {
  const {
    currentCampaign,
    characters,
    locations,
    items,
    addItem,
    updateItem,
    deleteItem
  } = useCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    characters: characters.filter(character => character.campaignId === currentCampaign.id),
    locations: locations.filter(location => location.campaignId === currentCampaign.id),
    items: items.filter(item => item.campaignId === currentCampaign.id),
  };

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
};

export default ItemsPage;