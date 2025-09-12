import React from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { MapsView } from '../components/MapsView';

const MapsPage: React.FC = () => {
  const {
    currentCampaign,
    maps,
    locations,
    addMap,
    updateMap,
    deleteMap
  } = useApiCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    maps: maps?.filter(map => map.campaignId === currentCampaign.id) || [],
    locations: locations.filter(location => location.campaignId === currentCampaign.id),
  };

  return (
    <MapsView
      maps={currentCampaignData.maps}
      locations={currentCampaignData.locations}
      onAddMap={addMap}
      onUpdateMap={updateMap}
      onDeleteMap={deleteMap}
      campaignId={currentCampaign.id}
    />
  );
};

export default MapsPage;