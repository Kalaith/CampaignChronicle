import { useState, useRef, useEffect, useCallback } from 'react';
import type { CampaignMap, MapPin, MapRoute, Location } from '../types';
import { Modal } from './Modal';

interface MapViewerProps {
  map: CampaignMap;
  locations: Location[];
  onUpdateMap: (mapId: string, updates: Partial<CampaignMap>) => void;
  onDeleteMap: (mapId: string) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pin: Omit<MapPin, 'id'>) => void;
  locations: Location[];
  pin?: MapPin;
  x: number;
  y: number;
}

const pinTypes = [
  { type: 'location', label: 'Location', icon: '🏰', color: '#3B82F6' },
  { type: 'poi', label: 'Point of Interest', icon: '📍', color: '#EF4444' },
  { type: 'danger', label: 'Danger Zone', icon: '⚠️', color: '#DC2626' },
  { type: 'treasure', label: 'Treasure', icon: '💰', color: '#F59E0B' },
  { type: 'settlement', label: 'Settlement', icon: '🏘️', color: '#10B981' },
] as const;

const routeTypes = [
  { type: 'path', label: 'Path', color: '#8B5CF6' },
  { type: 'road', label: 'Road', color: '#6B7280' },
  { type: 'river', label: 'River', color: '#06B6D4' },
  { type: 'border', label: 'Border', color: '#EF4444' },
] as const;

const PinModal = ({ isOpen, onClose, onSubmit, locations, pin, x, y }: PinModalProps) => {
  const [formData, setFormData] = useState({
    x: pin?.x || x,
    y: pin?.y || y,
    type: pin?.type || 'location' as MapPin['type'],
    name: pin?.name || '',
    description: pin?.description || '',
    locationId: pin?.locationId || '',
    icon: pin?.icon || '🏰',
    color: pin?.color || '#3B82F6',
  });

  useEffect(() => {
    if (pin) {
      setFormData({
        x: pin.x,
        y: pin.y,
        type: pin.type,
        name: pin.name,
        description: pin.description || '',
        locationId: pin.locationId || '',
        icon: pin.icon,
        color: pin.color,
      });
    } else {
      const selectedType = pinTypes.find(t => t.type === formData.type);
      setFormData(prev => ({
        ...prev,
        x,
        y,
        icon: selectedType?.icon || '🏰',
        color: selectedType?.color || '#3B82F6',
      }));
    }
  }, [pin, x, y]);

  const handleTypeChange = (newType: MapPin['type']) => {
    const selectedType = pinTypes.find(t => t.type === newType);
    setFormData(prev => ({
      ...prev,
      type: newType,
      icon: selectedType?.icon || prev.icon,
      color: selectedType?.color || prev.color,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit({
        x: formData.x,
        y: formData.y,
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        locationId: formData.locationId || undefined,
        icon: formData.icon,
        color: formData.color,
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pin ? 'Edit Map Pin' : 'Add Map Pin'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
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
              onChange={(e) => handleTypeChange(e.target.value as MapPin['type'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pinTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.icon} {type.label}
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

        {formData.type === 'location' && locations.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Link to Location
            </label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No linked location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position X (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.x}
              onChange={(e) => setFormData({ ...formData, x: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position Y (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.y}
              onChange={(e) => setFormData({ ...formData, y: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              readOnly
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
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {pin ? 'Update' : 'Add'} Pin
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const MapViewer = ({ 
  map, 
  locations, 
  onUpdateMap, 
  onDeleteMap, 
  isEditMode, 
  onToggleEditMode 
}: MapViewerProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [isDrawingRoute, setIsDrawingRoute] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<{ name: string; points: Array<{ x: number; y: number }> } | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<MapPin | undefined>();
  const [clickPosition, setClickPosition] = useState({ x: 0, y: 0 });

  const mapRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * delta)));
  }, []);

  useEffect(() => {
    const mapElement = mapRef.current;
    if (mapElement) {
      mapElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        mapElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, [handleWheel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isEditMode) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isEditMode || isDragging) return;

    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDrawingRoute) {
      setCurrentRoute(prev => prev ? {
        ...prev,
        points: [...prev.points, { x, y }]
      } : null);
    } else {
      setClickPosition({ x, y });
      setEditingPin(undefined);
      setIsPinModalOpen(true);
    }
  };

  const addPin = (pinData: Omit<MapPin, 'id'>) => {
    const newPin: MapPin = {
      ...pinData,
      id: crypto.randomUUID(),
    };
    
    onUpdateMap(map.id, {
      pins: [...map.pins, newPin],
      lastModified: new Date().toISOString(),
    });
  };

  const editPin = (pin: MapPin) => {
    setEditingPin(pin);
    setClickPosition({ x: pin.x, y: pin.y });
    setIsPinModalOpen(true);
  };

  const updatePin = (pinData: Omit<MapPin, 'id'>) => {
    if (!editingPin) return;
    
    onUpdateMap(map.id, {
      pins: map.pins.map(p => p.id === editingPin.id ? { ...pinData, id: editingPin.id } : p),
      lastModified: new Date().toISOString(),
    });
  };

  const deletePin = (pinId: string) => {
    if (confirm('Delete this pin?')) {
      onUpdateMap(map.id, {
        pins: map.pins.filter(p => p.id !== pinId),
        lastModified: new Date().toISOString(),
      });
    }
  };

  const startRoute = () => {
    const routeName = prompt('Route name:');
    if (routeName) {
      setCurrentRoute({ name: routeName, points: [] });
      setIsDrawingRoute(true);
    }
  };

  const finishRoute = () => {
    if (currentRoute && currentRoute.points.length >= 2) {
      const routeType = prompt('Route type (path/road/river/border):') as MapRoute['type'] || 'path';
      const routeColor = routeTypes.find(r => r.type === routeType)?.color || '#8B5CF6';
      
      const newRoute: MapRoute = {
        id: crypto.randomUUID(),
        name: currentRoute.name,
        points: currentRoute.points,
        color: routeColor,
        type: routeType,
        isVisible: true,
      };

      onUpdateMap(map.id, {
        routes: [...map.routes, newRoute],
        lastModified: new Date().toISOString(),
      });
    }
    
    setCurrentRoute(null);
    setIsDrawingRoute(false);
  };

  const toggleRoute = (routeId: string) => {
    onUpdateMap(map.id, {
      routes: map.routes.map(r => 
        r.id === routeId ? { ...r, isVisible: !r.isVisible } : r
      ),
      lastModified: new Date().toISOString(),
    });
  };

  const deleteRoute = (routeId: string) => {
    if (confirm('Delete this route?')) {
      onUpdateMap(map.id, {
        routes: map.routes.filter(r => r.id !== routeId),
        lastModified: new Date().toISOString(),
      });
    }
  };

  const renderRoute = (route: MapRoute) => {
    if (!route.isVisible || route.points.length < 2) return null;

    const pathData = route.points
      .map((point, index) => {
        const x = (point.x / 100) * (imageRef.current?.clientWidth || 0);
        const y = (point.y / 100) * (imageRef.current?.clientHeight || 0);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <path
        key={route.id}
        d={pathData}
        stroke={route.color}
        strokeWidth={route.type === 'river' ? '3' : '2'}
        strokeDasharray={route.type === 'border' ? '5,5' : 'none'}
        fill="none"
        opacity={0.8}
      />
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleEditMode}
            className={`px-3 py-1 rounded text-sm ${
              isEditMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEditMode ? '✏️ Editing' : '👁️ Viewing'}
          </button>
          
          {isEditMode && (
            <>
              <button
                onClick={startRoute}
                disabled={isDrawingRoute}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                🛤️ Route
              </button>
              
              {isDrawingRoute && (
                <button
                  onClick={finishRoute}
                  className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                >
                  ✓ Finish
                </button>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Route Legend */}
      {map.routes.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="font-medium text-sm mb-2">Routes</h4>
          <div className="space-y-1 text-xs">
            {map.routes.map((route) => (
              <div key={route.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: route.color }}
                  />
                  <span className={route.isVisible ? '' : 'line-through opacity-50'}>
                    {route.name}
                  </span>
                </div>
                {isEditMode && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleRoute(route.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {route.isVisible ? '👁️' : '🙈'}
                    </button>
                    <button
                      onClick={() => deleteRoute(route.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="flex-1 relative overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="relative"
        >
          <img
            ref={imageRef}
            src={map.imageUrl}
            alt={map.name}
            className="block max-w-none select-none"
            draggable={false}
            onClick={handleMapClick}
            style={{
              width: `${map.width}px`,
              height: `${map.height}px`,
            }}
          />

          {/* SVG Overlay for Routes */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{
              width: `${map.width}px`,
              height: `${map.height}px`,
            }}
          >
            {map.routes.map(renderRoute)}
            
            {/* Current route being drawn */}
            {currentRoute && currentRoute.points.length > 1 && (
              <path
                d={currentRoute.points
                  .map((point, index) => {
                    const x = (point.x / 100) * (imageRef.current?.clientWidth || 0);
                    const y = (point.y / 100) * (imageRef.current?.clientHeight || 0);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  })
                  .join(' ')}
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="3,3"
                fill="none"
                opacity={0.8}
              />
            )}
          </svg>

          {/* Map Pins */}
          {map.pins.map((pin) => (
            <div
              key={pin.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${pin.x}%`,
                top: `${pin.y}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isEditMode) {
                  editPin(pin);
                } else {
                  setSelectedPin(selectedPin?.id === pin.id ? null : pin);
                }
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg border-2 border-white hover:scale-110 transition-transform"
                style={{ backgroundColor: pin.color }}
              >
                {pin.icon}
              </div>
              
              {isEditMode && (
                <button
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePin(pin.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* Current route points */}
          {currentRoute && currentRoute.points.map((point, index) => (
            <div
              key={index}
              className="absolute w-2 h-2 bg-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Selected Pin Info */}
      {selectedPin && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{selectedPin.icon}</span>
            <h3 className="font-semibold">{selectedPin.name}</h3>
          </div>
          {selectedPin.description && (
            <p className="text-sm text-gray-600 mb-2">{selectedPin.description}</p>
          )}
          <div className="text-xs text-gray-500">
            Type: {pinTypes.find(t => t.type === selectedPin.type)?.label}
          </div>
          <button
            onClick={() => setSelectedPin(null)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Close
          </button>
        </div>
      )}

      {/* Pin Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setEditingPin(undefined);
        }}
        onSubmit={editingPin ? updatePin : addPin}
        locations={locations}
        pin={editingPin}
        x={clickPosition.x}
        y={clickPosition.y}
      />
    </div>
  );
};