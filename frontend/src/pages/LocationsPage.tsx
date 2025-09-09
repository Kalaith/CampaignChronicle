import React from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { LocationsView } from '../components/LocationsView';

const LocationsPage: React.FC = () => {
  const {
    currentCampaign,
    locations,
    addLocation,
    updateLocation,
    deleteLocation
  } = useApiCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    locations: locations.filter(location => location.campaignId === currentCampaign.id),
  };

  return (
    <LocationsView
      locations={currentCampaignData.locations}
      onAddLocation={addLocation}
      onUpdateLocation={updateLocation}
      onDeleteLocation={deleteLocation}
      campaignId={currentCampaign.id}
    />
  );
};

export default LocationsPage;