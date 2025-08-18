import { useState } from 'react';
import type { Relationship, Character } from '../types';
import { Modal } from './Modal';

interface RelationshipsViewProps {
  relationships: Relationship[];
  characters: Character[];
  onAddRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  onDeleteRelationship: (id: string) => void;
  campaignId: string;
}

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (relationship: Omit<Relationship, 'id'>) => void;
  characters: Character[];
  campaignId: string;
}

const RelationshipModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  characters,
  campaignId 
}: RelationshipModalProps) => {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    type: 'neutral' as Relationship['type'],
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.from && formData.to && formData.from !== formData.to) {
      onSubmit({
        campaignId,
        from: formData.from,
        to: formData.to,
        type: formData.type,
        description: formData.description.trim() || undefined,
      });
      setFormData({
        from: '',
        to: '',
        type: 'neutral',
        description: '',
      });
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Add Relationship"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Character
            </label>
            <select
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select character</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Character
            </label>
            <select
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select character</option>
              {characters.filter(c => c.id !== formData.from).map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Relationship['type'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ally">Ally</option>
            <option value="enemy">Enemy</option>
            <option value="family">Family</option>
            <option value="mentor">Mentor</option>
            <option value="neutral">Neutral</option>
          </select>
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
            placeholder="Describe the relationship..."
          />
        </div>

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
            Add Relationship
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const RelationshipsView = ({ 
  relationships, 
  characters, 
  onAddRelationship, 
  onDeleteRelationship,
  campaignId 
}: RelationshipsViewProps) => {
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRelationships = relationships.filter(relationship => 
    !typeFilter || relationship.type === typeFilter
  );

  const getCharacterName = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character?.name || 'Unknown Character';
  };

  const getTypeIcon = (type: Relationship['type']) => {
    switch (type) {
      case 'ally': return '🤝';
      case 'enemy': return '⚔️';
      case 'family': return '👨‍👩‍👧‍👦';
      case 'mentor': return '👨‍🏫';
      case 'neutral': return '🤷';
      default: return '👥';
    }
  };

  const getTypeColor = (type: Relationship['type']) => {
    switch (type) {
      case 'ally': return 'bg-green-100 text-green-800';
      case 'enemy': return 'bg-red-100 text-red-800';
      case 'family': return 'bg-purple-100 text-purple-800';
      case 'mentor': return 'bg-blue-100 text-blue-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Relationship Network</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Relationship
        </button>
      </div>

      {/* Filter */}
      <div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Relationships</option>
          <option value="ally">Allies</option>
          <option value="enemy">Enemies</option>
          <option value="family">Family</option>
          <option value="mentor">Mentors</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>

      {/* Relationships List */}
      <div className="space-y-4">
        {filteredRelationships.map((relationship) => (
          <div key={relationship.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{getTypeIcon(relationship.type)}</span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">
                      {getCharacterName(relationship.from)}
                    </span>
                    <span className="text-gray-500">→</span>
                    <span className="font-semibold text-gray-900">
                      {getCharacterName(relationship.to)}
                    </span>
                  </div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(relationship.type)}`}>
                    {relationship.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Delete this relationship?')) {
                    onDeleteRelationship(relationship.id);
                  }
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>

            {relationship.description && (
              <p className="text-gray-700 ml-10">
                {relationship.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {filteredRelationships.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {relationships.length === 0 ? 'No relationships yet. Add character relationships!' : 'No relationships match your filter.'}
          </p>
        </div>
      )}

      <RelationshipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onAddRelationship}
        characters={characters}
        campaignId={campaignId}
      />
    </div>
  );
};
