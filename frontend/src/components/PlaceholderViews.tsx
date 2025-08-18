import { useState } from 'react';
import type { Location, Item, Character } from '../types';
import { Modal } from './Modal';

interface LocationsViewProps {
  locations: Location[];
  onAddLocation: (location: Omit<Location, 'id'>) => void;
  onUpdateLocation: (id: string, updates: Partial<Location>) => void;
  onDeleteLocation: (id: string) => void;
  campaignId: string;
}

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (location: Omit<Location, 'id'>) => void;
  location?: Location;
  locations: Location[];
  campaignId: string;
}

const LocationModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  location, 
  locations,
  campaignId 
}: LocationModalProps) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    type: location?.type || 'City' as Location['type'],
    parentId: location?.parentId || '',
    description: location?.description || '',
    tags: location?.tags.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        campaignId,
        name: formData.name.trim(),
        type: formData.type,
        parentId: formData.parentId || undefined,
        description: formData.description.trim() || undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      onClose();
    }
  };

  const availableParents = locations.filter(l => l.id !== location?.id);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={location ? 'Edit Location' : 'Add Location'}
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Location['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Continent">Continent</option>
              <option value="Region">Region</option>
              <option value="City">City</option>
              <option value="Town">Town</option>
              <option value="Village">Village</option>
              <option value="Building">Building</option>
              <option value="Room">Room</option>
              <option value="Dungeon">Dungeon</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parent Location
          </label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None (Top Level)</option>
            {availableParents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name} ({parent.type})
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
            placeholder="major-city, port, sword-coast"
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
            {location ? 'Update' : 'Add'} Location
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const LocationsView = ({ 
  locations, 
  onAddLocation, 
  onUpdateLocation, 
  onDeleteLocation,
  campaignId 
}: LocationsViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();

  const filteredLocations = locations.filter(location => 
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (locationData: Omit<Location, 'id'>) => {
    if (editingLocation) {
      onUpdateLocation(editingLocation.id, locationData);
    } else {
      onAddLocation(locationData);
    }
    setEditingLocation(undefined);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingLocation(undefined);
  };

  const getTypeIcon = (type: Location['type']) => {
    switch (type) {
      case 'Continent': return '🌍';
      case 'Region': return '🗺️';
      case 'City': return '🏙️';
      case 'Town': return '🏘️';
      case 'Village': return '🏡';
      case 'Building': return '🏢';
      case 'Room': return '🚪';
      case 'Dungeon': return '⚔️';
      default: return '📍';
    }
  };

  const getTypeColor = (type: Location['type']) => {
    switch (type) {
      case 'Continent': return 'bg-purple-100 text-purple-800';
      case 'Region': return 'bg-blue-100 text-blue-800';
      case 'City': return 'bg-green-100 text-green-800';
      case 'Town': return 'bg-yellow-100 text-yellow-800';
      case 'Village': return 'bg-orange-100 text-orange-800';
      case 'Building': return 'bg-gray-100 text-gray-800';
      case 'Room': return 'bg-pink-100 text-pink-800';
      case 'Dungeon': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getParentLocation = (parentId?: string) => {
    return parentId ? locations.find(l => l.id === parentId) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Location
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.map((location) => {
          const parentLocation = getParentLocation(location.parentId);
          return (
            <div key={location.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(location.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(location.type)}`}>
                      {location.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(location)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete location "${location.name}"?`)) {
                        onDeleteLocation(location.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm ml-2"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {parentLocation && (
                <p className="text-sm text-gray-600 mb-2">
                  📍 In {parentLocation.name}
                </p>
              )}

              {location.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                  {location.description}
                </p>
              )}

              {location.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {location.tags.map((tag, index) => (
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

      {filteredLocations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {locations.length === 0 ? 'No locations yet. Create your first location!' : 'No locations match your search.'}
          </p>
        </div>
      )}

      <LocationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        location={editingLocation}
        locations={locations}
        campaignId={campaignId}
      />
    </div>
  );
};

interface ItemsViewProps {
  items: Item[];
  characters: Character[];
  locations: Location[];
  onAddItem: (item: Omit<Item, 'id'>) => void;
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onDeleteItem: (id: string) => void;
  campaignId: string;
}

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<Item, 'id'>) => void;
  item?: Item;
  characters: Character[];
  locations: Location[];
  campaignId: string;
}

const ItemModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  item, 
  characters,
  locations,
  campaignId 
}: ItemModalProps) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    type: item?.type || 'Weapon' as Item['type'],
    owner: item?.owner || '',
    location: item?.location || '',
    description: item?.description || '',
    tags: item?.tags.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        campaignId,
        name: formData.name.trim(),
        type: formData.type,
        owner: formData.owner || undefined,
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
      title={item ? 'Edit Item' : 'Add Item'}
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
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Item['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Weapon">Weapon</option>
              <option value="Armor">Armor</option>
              <option value="Magic Item">Magic Item</option>
              <option value="Tool">Tool</option>
              <option value="Treasure">Treasure</option>
              <option value="Document">Document</option>
              <option value="Key Item">Key Item</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner
            </label>
            <select
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
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
            placeholder="important, quest-item, magical"
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
            {item ? 'Update' : 'Add'} Item
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const ItemsView = ({ 
  items, 
  characters, 
  locations, 
  onAddItem, 
  onUpdateItem, 
  onDeleteItem,
  campaignId 
}: ItemsViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>();

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (itemData: Omit<Item, 'id'>) => {
    if (editingItem) {
      onUpdateItem(editingItem.id, itemData);
    } else {
      onAddItem(itemData);
    }
    setEditingItem(undefined);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(undefined);
  };

  const getTypeIcon = (type: Item['type']) => {
    switch (type) {
      case 'Weapon': return '⚔️';
      case 'Armor': return '🛡️';
      case 'Magic Item': return '✨';
      case 'Tool': return '🔧';
      case 'Treasure': return '💎';
      case 'Document': return '📜';
      case 'Key Item': return '🗝️';
      default: return '📦';
    }
  };

  const getTypeColor = (type: Item['type']) => {
    switch (type) {
      case 'Weapon': return 'bg-red-100 text-red-800';
      case 'Armor': return 'bg-blue-100 text-blue-800';
      case 'Magic Item': return 'bg-purple-100 text-purple-800';
      case 'Tool': return 'bg-gray-100 text-gray-800';
      case 'Treasure': return 'bg-yellow-100 text-yellow-800';
      case 'Document': return 'bg-green-100 text-green-800';
      case 'Key Item': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOwner = (ownerId?: string) => {
    return ownerId ? characters.find(c => c.id === ownerId) : null;
  };

  const getLocation = (locationId?: string) => {
    return locationId ? locations.find(l => l.id === locationId) : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Items</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Item
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search items..."
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
          <option value="Weapon">Weapons</option>
          <option value="Armor">Armor</option>
          <option value="Magic Item">Magic Items</option>
          <option value="Tool">Tools</option>
          <option value="Treasure">Treasure</option>
          <option value="Document">Documents</option>
          <option value="Key Item">Key Items</option>
        </select>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const owner = getOwner(item.owner);
          const location = getLocation(item.location);
          return (
            <div key={item.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(item.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete item "${item.name}"?`)) {
                        onDeleteItem(item.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm ml-2"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {owner && (
                <p className="text-sm text-gray-600 mb-2">
                  👤 Owned by {owner.name}
                </p>
              )}

              {location && (
                <p className="text-sm text-gray-600 mb-2">
                  📍 Located in {location.name}
                </p>
              )}

              {item.description && (
                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                  {item.description}
                </p>
              )}

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, index) => (
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

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {items.length === 0 ? 'No items yet. Create your first item!' : 'No items match your search.'}
          </p>
        </div>
      )}

      <ItemModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        item={editingItem}
        characters={characters}
        locations={locations}
        campaignId={campaignId}
      />
    </div>
  );
};

export const RelationshipsView = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Relationship Network</h2>
    <div className="bg-white rounded-lg shadow p-8 text-center">
      <p className="text-gray-500">Relationship network coming soon...</p>
    </div>
  </div>
);
