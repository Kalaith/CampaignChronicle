import { useState } from 'react';
import type { CampaignMap, Location } from '../types';
import { Modal } from './Modal';
import { MapViewer } from './MapViewer';

interface MapsViewProps {
  maps: CampaignMap[];
  locations: Location[];
  onAddMap: (map: Omit<CampaignMap, 'id' | 'createdAt' | 'lastModified'>) => void;
  onUpdateMap: (id: string, updates: Partial<CampaignMap>) => void;
  onDeleteMap: (id: string) => void;
  campaignId: string;
}

interface MapUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (map: Omit<CampaignMap, 'id' | 'createdAt' | 'lastModified'>) => void;
  campaignId: string;
  map?: CampaignMap;
}

const MapUploadModal = ({ isOpen, onClose, onSubmit, campaignId, map }: MapUploadModalProps) => {
  const [formData, setFormData] = useState({
    name: map?.name || '',
    description: map?.description || '',
    imageUrl: map?.imageUrl || '',
    width: map?.width || 1024,
    height: map?.height || 768,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(map?.imageUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Create an image to get dimensions
      const img = new Image();
      img.onload = () => {
        setFormData(prev => ({
          ...prev,
          width: img.width,
          height: img.height
        }));
      };
      img.src = url;
    }
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    // This is a placeholder for image upload functionality
    // In a real implementation, you would upload to a service like Cloudinary, AWS S3, etc.
    // For now, we'll create a local blob URL (note: this won't persist)
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || (!formData.imageUrl && !imageFile)) return;

    setIsLoading(true);
    
    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        // In a real implementation, upload to a cloud service
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      onSubmit({
        campaignId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        imageUrl,
        width: formData.width,
        height: formData.height,
        pins: map?.pins || [],
        routes: map?.routes || [],
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        width: 1024,
        height: 768,
      });
      setImageFile(null);
      setPreviewUrl('');
      onClose();
    } catch (error) {
      console.error('Failed to upload map:', error);
      alert('Failed to upload map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={map ? 'Edit Map' : 'Upload New Map'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Map Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            placeholder="World Map, City of Waterdeep, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Regional map showing major cities and landmarks..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Map Image
          </label>
          <div className="space-y-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="text-center text-sm text-gray-500">or</div>
            
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => {
                setFormData({ ...formData, imageUrl: e.target.value });
                setPreviewUrl(e.target.value);
              }}
              placeholder="https://example.com/map-image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {previewUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preview
            </label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <img
                src={previewUrl}
                alt="Map preview"
                className="w-full h-48 object-contain bg-gray-50"
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Dimensions: {formData.width} × {formData.height}px
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width (px)
            </label>
            <input
              type="number"
              value={formData.width}
              onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) || 1024 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (px)
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || 768 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            disabled={isLoading || !formData.name.trim() || (!formData.imageUrl && !imageFile)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Uploading...' : map ? 'Update Map' : 'Upload Map'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const MapsView = ({ 
  maps, 
  locations, 
  onAddMap, 
  onUpdateMap, 
  onDeleteMap, 
  campaignId 
}: MapsViewProps) => {
  const [selectedMap, setSelectedMap] = useState<CampaignMap | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<CampaignMap | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaps = maps.filter(map =>
    map.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (map.description && map.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditMap = (map: CampaignMap) => {
    setEditingMap(map);
    setIsUploadModalOpen(true);
  };

  const handleModalSubmit = (mapData: Omit<CampaignMap, 'id' | 'createdAt' | 'lastModified'>) => {
    if (editingMap) {
      onUpdateMap(editingMap.id, { ...mapData, lastModified: new Date().toISOString() });
    } else {
      onAddMap(mapData);
    }
    setEditingMap(undefined);
  };

  const handleModalClose = () => {
    setIsUploadModalOpen(false);
    setEditingMap(undefined);
  };

  const handleDeleteMap = (mapId: string, mapName: string) => {
    if (confirm(`Delete map "${mapName}"? This will also remove all pins and routes.`)) {
      onDeleteMap(mapId);
      if (selectedMap?.id === mapId) {
        setSelectedMap(null);
      }
    }
  };

  if (selectedMap) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedMap.name}</h2>
              {selectedMap.description && (
                <p className="text-sm text-gray-600">{selectedMap.description}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedMap(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              ← Back to Maps
            </button>
          </div>
        </div>
        
        <div className="flex-1">
          <MapViewer
            map={selectedMap}
            locations={locations}
            onUpdateMap={onUpdateMap}
            onDeleteMap={onDeleteMap}
            isEditMode={isEditMode}
            onToggleEditMode={() => setIsEditMode(!isEditMode)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Campaign Maps</h2>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          📁 Upload Map
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search maps..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Maps Grid */}
      {filteredMaps.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl text-gray-300 mb-4">🗺️</div>
          <p className="text-gray-500 text-lg">
            {maps.length === 0 ? 'No maps uploaded yet.' : 'No maps match your search.'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {maps.length === 0 ? 'Upload your first campaign map to get started!' : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaps.map((map) => (
            <div
              key={map.id}
              className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img
                  src={map.imageUrl}
                  alt={map.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedMap(map)}
                />
                <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded px-2 py-1 text-xs">
                  {map.pins.length} pins
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{map.name}</h3>
                
                {map.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {map.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{map.width} × {map.height}px</span>
                  <span>
                    {map.routes.length} route{map.routes.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMap(map)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Open Map
                  </button>
                  <button
                    onClick={() => handleEditMap(map)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMap(map.id, map.name)}
                    className="px-3 py-2 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div className="text-xs text-gray-400 mt-2">
                  Updated {new Date(map.lastModified).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <MapUploadModal
        isOpen={isUploadModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        campaignId={campaignId}
        map={editingMap}
      />
    </div>
  );
};