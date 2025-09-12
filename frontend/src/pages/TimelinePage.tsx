import React from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { TimelineView } from '../components/TimelineView';

const TimelinePage: React.FC = () => {
  const {
    currentCampaign,
    timelineEvents,
    characters,
    locations,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent
  } = useApiCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    timelineEvents: timelineEvents.filter(event => event.campaignId === currentCampaign.id),
    characters: characters.filter(character => character.campaignId === currentCampaign.id),
    locations: locations.filter(location => location.campaignId === currentCampaign.id),
  };

  return (
    <TimelineView
      timelineEvents={currentCampaignData.timelineEvents}
      characters={currentCampaignData.characters}
      locations={currentCampaignData.locations}
      onAddEvent={addTimelineEvent}
      onUpdateEvent={updateTimelineEvent}
      onDeleteEvent={deleteTimelineEvent}
      campaignId={currentCampaign.id}
    />
  );
};

export default TimelinePage;