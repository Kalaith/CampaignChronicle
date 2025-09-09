import { useState } from 'react';
import type { TimelineEvent, Character, Location } from '../types';
import { Modal } from './Modal';

interface TimelineViewProps {
  timelineEvents: TimelineEvent[];
  characters: Character[];
  locations: Location[];
  onAddEvent: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'lastModified'>) => void;
  onUpdateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  onDeleteEvent: (id: string) => void;
  campaignId: string;
}

interface TimelineEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: Omit<TimelineEvent, 'id' | 'createdAt' | 'lastModified'>) => void;
  characters: Character[];
  locations: Location[];
  campaignId: string;
  event?: TimelineEvent;
}

const TimelineEventModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  characters,
  locations,
  campaignId,
  event
}: TimelineEventModalProps) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: event?.date || '',
    sessionNumber: event?.sessionNumber?.toString() || '',
    type: event?.type || 'story' as TimelineEvent['type'],
    tags: event?.tags.join(', ') || '',
    relatedCharacters: event?.relatedCharacters || [],
    relatedLocations: event?.relatedLocations || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.date.trim()) {
      onSubmit({
        campaignId,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        date: formData.date.trim(),
        sessionNumber: formData.sessionNumber ? parseInt(formData.sessionNumber) : undefined,
        type: formData.type,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        relatedCharacters: formData.relatedCharacters.length > 0 ? formData.relatedCharacters : undefined,
        relatedLocations: formData.relatedLocations.length > 0 ? formData.relatedLocations : undefined,
      });
      onClose();
    }
  };

  const handleCharacterToggle = (characterId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedCharacters: prev.relatedCharacters.includes(characterId)
        ? prev.relatedCharacters.filter(id => id !== characterId)
        : [...prev.relatedCharacters, characterId]
    }));
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedLocations: prev.relatedLocations.includes(locationId)
        ? prev.relatedLocations.filter(id => id !== locationId)
        : [...prev.relatedLocations, locationId]
    }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={event ? 'Edit Timeline Event' : 'Add Timeline Event'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as TimelineEvent['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="session">Session</option>
              <option value="story">Story Event</option>
              <option value="character">Character Event</option>
              <option value="location">Location Event</option>
              <option value="combat">Combat</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date/Time
            </label>
            <input
              type="text"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              placeholder="Session 1, Day 15, Winter 1485..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Number
            </label>
            <input
              type="number"
              value={formData.sessionNumber}
              onChange={(e) => setFormData({ ...formData, sessionNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="important, boss-fight, revelation"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {characters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Characters
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {characters.map((character) => (
                <label key={character.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.relatedCharacters.includes(character.id)}
                    onChange={() => handleCharacterToggle(character.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm">{character.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {locations.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Locations
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {locations.map((location) => (
                <label key={location.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.relatedLocations.includes(location.id)}
                    onChange={() => handleLocationToggle(location.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm">{location.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {event ? 'Update' : 'Add'} Event
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const TimelineView = ({ 
  timelineEvents, 
  characters, 
  locations, 
  onAddEvent, 
  onUpdateEvent, 
  onDeleteEvent,
  campaignId 
}: TimelineViewProps) => {
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'session' | 'created'>('date');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | undefined>();

  const filteredEvents = timelineEvents
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = !typeFilter || event.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'session':
          return (b.sessionNumber || 0) - (a.sessionNumber || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date':
        default:
          return a.date.localeCompare(b.date);
      }
    });

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (eventData: Omit<TimelineEvent, 'id' | 'createdAt' | 'lastModified'>) => {
    if (editingEvent) {
      onUpdateEvent(editingEvent.id, eventData);
    } else {
      onAddEvent(eventData);
    }
    setEditingEvent(undefined);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingEvent(undefined);
  };

  const getTypeIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'session': return '📅';
      case 'story': return '📖';
      case 'character': return '👤';
      case 'location': return '🏰';
      case 'combat': return '⚔️';
      case 'milestone': return '🏆';
      default: return '📍';
    }
  };

  const getTypeColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'session': return 'bg-blue-100 text-blue-800';
      case 'story': return 'bg-purple-100 text-purple-800';
      case 'character': return 'bg-green-100 text-green-800';
      case 'location': return 'bg-orange-100 text-orange-800';
      case 'combat': return 'bg-red-100 text-red-800';
      case 'milestone': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Campaign Timeline</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Event
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="session">Sessions</option>
          <option value="story">Story Events</option>
          <option value="character">Character Events</option>
          <option value="location">Location Events</option>
          <option value="combat">Combat</option>
          <option value="milestone">Milestones</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="session">Sort by Session</option>
          <option value="created">Sort by Created</option>
        </select>
      </div>

      {/* Timeline */}
      <div className="relative">
        {filteredEvents.length > 0 && (
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        )}
        
        <div className="space-y-6">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative flex">
              <div className="absolute left-2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full -ml-2"></div>
              
              <div className="ml-10 flex-1 bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">{getTypeIcon(event.type)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(event.type)}`}>
                        {event.type}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3 space-x-4">
                      <span>📅 {event.date}</span>
                      {event.sessionNumber && <span>🎲 Session {event.sessionNumber}</span>}
                    </div>
                    
                    {event.description && (
                      <p className="text-gray-700 mb-3">{event.description}</p>
                    )}
                    
                    {/* Related Characters and Locations */}
                    {(event.relatedCharacters?.length || event.relatedLocations?.length) && (
                      <div className="space-y-2 mb-3">
                        {event.relatedCharacters?.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">Characters:</span>
                            <div className="flex flex-wrap gap-1">
                              {event.relatedCharacters.map(characterId => {
                                const character = characters.find(c => c.id === characterId);
                                return character ? (
                                  <span key={characterId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {character.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                        
                        {event.relatedLocations?.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-600">Locations:</span>
                            <div className="flex flex-wrap gap-1">
                              {event.relatedLocations.map(locationId => {
                                const location = locations.find(l => l.id === locationId);
                                return location ? (
                                  <span key={locationId} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                    {location.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(event)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete event "${event.title}"?`)) {
                          onDeleteEvent(event.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {timelineEvents.length === 0 ? 'No timeline events yet. Add your first campaign event!' : 'No events match your search.'}
          </p>
        </div>
      )}

      <TimelineEventModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        characters={characters}
        locations={locations}
        campaignId={campaignId}
        event={editingEvent}
      />
    </div>
  );
};