import { useState } from 'react';
import type { Character, Location } from '../types';
import { Modal } from './Modal';

interface CharactersViewProps {
  characters: Character[];
  locations: Location[];
  onAddCharacter: (character: Omit<Character, 'id'>) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
  onDeleteCharacter: (id: string) => void;
  campaignId: string;
}

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (character: Omit<Character, 'id'>) => void;
  character?: Character;
  locations: Location[];
  campaignId: string;
}

const CharacterModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  character, 
  locations,
  campaignId 
}: CharacterModalProps) => {
  const [formData, setFormData] = useState({
    name: character?.name || '',
    type: character?.type || 'NPC' as Character['type'],
    race: character?.race || '',
    class: character?.class || '',
    location: character?.location || '',
    description: character?.description || '',
    tags: character?.tags.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        campaignId,
        name: formData.name.trim(),
        type: formData.type,
        race: formData.race.trim() || undefined,
        class: formData.class.trim() || undefined,
        location: formData.location || undefined,
        description: formData.description.trim() || undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={character ? 'Edit Character' : 'Add Character'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Character['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PC">Player Character</option>
              <option value="NPC">NPC</option>
              <option value="Villain">Villain</option>
              <option value="Ally">Ally</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Race
            </label>
            <input
              type="text"
              value={formData.race}
              onChange={(e) => setFormData({ ...formData, race: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <input
              type="text"
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a location</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="important, quest-giver, dwarf"
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
            {character ? 'Update' : 'Add'} Character
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const CharactersView = ({ 
  characters, 
  locations, 
  onAddCharacter, 
  onUpdateCharacter, 
  onDeleteCharacter,
  campaignId 
}: CharactersViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>();

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         character.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || character.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (characterData: Omit<Character, 'id'>) => {
    if (editingCharacter) {
      onUpdateCharacter(editingCharacter.id, characterData);
    } else {
      onAddCharacter(characterData);
    }
    setEditingCharacter(undefined);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCharacter(undefined);
  };

  const getTypeColor = (type: Character['type']) => {
    switch (type) {
      case 'PC': return 'bg-blue-100 text-blue-800';
      case 'NPC': return 'bg-gray-100 text-gray-800';
      case 'Villain': return 'bg-red-100 text-red-800';
      case 'Ally': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Characters</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Character
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search characters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="PC">Player Characters</option>
          <option value="NPC">NPCs</option>
          <option value="Villain">Villains</option>
          <option value="Ally">Allies</option>
        </select>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCharacters.map((character) => {
          const location = locations.find(l => l.id === character.location);
          return (
            <div key={character.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{character.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(character.type)}`}>
                    {character.type}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(character)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete character "${character.name}"?`)) {
                        onDeleteCharacter(character.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm ml-2"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {(character.race || character.class) && (
                <p className="text-sm text-gray-600 mb-2">
                  {[character.race, character.class].filter(Boolean).join(' ')}
                </p>
              )}

              {location && (
                <p className="text-sm text-gray-600 mb-2">
                  📍 {location.name}
                </p>
              )}

              {character.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                  {character.description}
                </p>
              )}

              {character.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {character.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {characters.length === 0 ? 'No characters yet. Create your first character!' : 'No characters match your search.'}
          </p>
        </div>
      )}

      <CharacterModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        character={editingCharacter}
        locations={locations}
        campaignId={campaignId}
      />
    </div>
  );
};
