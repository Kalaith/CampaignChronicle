import React from 'react';
import { useApiCampaignStore } from '../stores/apiCampaignStore';
import { NotesView } from '../components/NotesView';

const NotesPage: React.FC = () => {
  const {
    currentCampaign,
    notes,
    addNote,
    updateNote,
    deleteNote
  } = useApiCampaignStore();

  if (!currentCampaign) {
    return null;
  }

  // Filter data for current campaign
  const currentCampaignData = {
    notes: notes.filter(note => note.campaignId === currentCampaign.id),
  };

  return (
    <NotesView
      notes={currentCampaignData.notes}
      onAddNote={addNote}
      onUpdateNote={updateNote}
      onDeleteNote={deleteNote}
      campaignId={currentCampaign.id}
    />
  );
};

export default NotesPage;