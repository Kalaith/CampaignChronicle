import { useState, useRef, useEffect } from 'react';
import type { Character, Location, Item, Note, Relationship, TimelineEvent, Quest, CampaignMap } from '../types';

interface SearchResult {
  id: string;
  type: 'character' | 'location' | 'item' | 'note' | 'relationship' | 'timeline' | 'quest' | 'map';
  title: string;
  subtitle?: string;
  content: string;
  entity: Character | Location | Item | Note | Relationship | TimelineEvent | Quest | CampaignMap;
}

interface GlobalSearchProps {
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
  relationships: Relationship[];
  timelineEvents: TimelineEvent[];
  quests: Quest[];
  maps: CampaignMap[];
  onResultClick: (result: SearchResult) => void;
  onNavigateToView: (view: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  characters,
  locations,
  items,
  notes,
  relationships,
  timelineEvents,
  quests,
  maps,
  onResultClick,
  onNavigateToView,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    // Search characters
    characters.forEach(character => {
      if (
        character.name.toLowerCase().includes(searchTerm) ||
        character.description?.toLowerCase().includes(searchTerm) ||
        character.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        character.race?.toLowerCase().includes(searchTerm) ||
        character.class?.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          id: character.id,
          type: 'character',
          title: character.name,
          subtitle: `${character.type}${character.race ? ` • ${character.race}` : ''}${character.class ? ` ${character.class}` : ''}`,
          content: character.description || 'No description',
          entity: character,
        });
      }
    });

    // Search locations
    locations.forEach(location => {
      if (
        location.name.toLowerCase().includes(searchTerm) ||
        location.description?.toLowerCase().includes(searchTerm) ||
        location.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      ) {
        searchResults.push({
          id: location.id,
          type: 'location',
          title: location.name,
          subtitle: location.type,
          content: location.description || 'No description',
          entity: location,
        });
      }
    });

    // Search items
    items.forEach(item => {
      if (
        item.name.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      ) {
        searchResults.push({
          id: item.id,
          type: 'item',
          title: item.name,
          subtitle: item.type,
          content: item.description || 'No description',
          entity: item,
        });
      }
    });

    // Search notes
    notes.forEach(note => {
      if (
        note.title.toLowerCase().includes(searchTerm) ||
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      ) {
        searchResults.push({
          id: note.id,
          type: 'note',
          title: note.title,
          subtitle: new Date(note.createdAt).toLocaleDateString(),
          content: note.content,
          entity: note,
        });
      }
    });

    // Search relationships (by character names)
    relationships.forEach(relationship => {
      const fromChar = characters.find(c => c.id === relationship.from);
      const toChar = characters.find(c => c.id === relationship.to);
      
      if (fromChar && toChar) {
        const relationshipText = `${fromChar.name} ${relationship.type} ${toChar.name}`;
        if (relationshipText.toLowerCase().includes(searchTerm)) {
          searchResults.push({
            id: relationship.id,
            type: 'relationship',
            title: `${fromChar.name} ↔ ${toChar.name}`,
            subtitle: relationship.type,
            content: relationship.description || `${fromChar.name} has a ${relationship.type} relationship with ${toChar.name}`,
            entity: relationship,
          });
        }
      }
    });

    // Search timeline events
    timelineEvents.forEach(event => {
      if (
        event.title.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        event.date.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          id: event.id,
          type: 'timeline',
          title: event.title,
          subtitle: `${event.type} • ${event.date}${event.sessionNumber ? ` • Session ${event.sessionNumber}` : ''}`,
          content: event.description || 'No description',
          entity: event,
        });
      }
    });

    // Search quests
    quests.forEach(quest => {
      const objectivesText = quest.objectives.map(obj => obj.description).join(' ');
      if (
        quest.title.toLowerCase().includes(searchTerm) ||
        quest.description.toLowerCase().includes(searchTerm) ||
        quest.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        objectivesText.toLowerCase().includes(searchTerm) ||
        quest.rewards?.toLowerCase().includes(searchTerm)
      ) {
        const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
        const progressText = `${completedObjectives}/${quest.objectives.length} objectives`;
        
        searchResults.push({
          id: quest.id,
          type: 'quest',
          title: quest.title,
          subtitle: `${quest.status} • ${quest.priority} priority • ${progressText}`,
          content: quest.description,
          entity: quest,
        });
      }
    });

    // Search maps
    maps.forEach(map => {
      const pinsText = map.pins.map(pin => pin.name + ' ' + pin.description).join(' ');
      const routesText = map.routes.map(route => route.name + ' ' + route.description).join(' ');
      if (
        map.name.toLowerCase().includes(searchTerm) ||
        (map.description && map.description.toLowerCase().includes(searchTerm)) ||
        pinsText.toLowerCase().includes(searchTerm) ||
        routesText.toLowerCase().includes(searchTerm)
      ) {
        searchResults.push({
          id: map.id,
          type: 'map',
          title: map.name,
          subtitle: `${map.pins.length} pins • ${map.routes.length} routes • ${map.width}×${map.height}px`,
          content: map.description || 'Campaign map',
          entity: map,
        });
      }
    });

    setResults(searchResults.slice(0, 20)); // Limit to 20 results
    setSelectedIndex(0);
  }, [query, characters, locations, items, notes, relationships, timelineEvents, quests, maps]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    // Navigate to the appropriate view
    const viewMap = {
      character: 'characters',
      location: 'locations',
      item: 'items',
      note: 'notes',
      relationship: 'relationships',
      timeline: 'timeline',
      quest: 'quests',
      map: 'maps',
    };
    onNavigateToView(viewMap[result.type]);
    setIsOpen(false);
    setQuery('');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'character': return '👤';
      case 'location': return '🏰';
      case 'item': return '⚔️';
      case 'note': return '📝';
      case 'relationship': return '🔗';
      case 'timeline': return '📅';
      case 'quest': return '🎯';
      case 'map': return '🗺️';
      default: return '📄';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
      >
        <span>🔍</span>
        <span>Search...</span>
        <kbd className="px-2 py-1 text-xs bg-gray-200 rounded">⌘K</kbd>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Search Modal */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-lg shadow-2xl z-50 mx-4">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search characters, locations, items, notes..."
              className="w-full pl-10 pr-4 py-3 text-lg border-0 focus:ring-0 focus:outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div
          ref={resultsRef}
          className="max-h-96 overflow-y-auto"
        >
          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {query.trim() ? 'No results found' : 'Start typing to search...'}
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-xl">{getResultIcon(result.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {result.type}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 truncate">
                        {result.subtitle}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {result.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 rounded-b-lg text-xs text-gray-500 flex items-center justify-between">
          <div>
            {results.length > 0 && (
              <>
                <kbd className="px-1 py-0.5 bg-gray-200 rounded">↑</kbd>
                <kbd className="px-1 py-0.5 bg-gray-200 rounded ml-1">↓</kbd>
                <span className="ml-2">to navigate</span>
                <kbd className="px-1 py-0.5 bg-gray-200 rounded ml-3">Enter</kbd>
                <span className="ml-1">to select</span>
              </>
            )}
          </div>
          <div>
            <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd>
            <span className="ml-1">to close</span>
          </div>
        </div>
      </div>
    </>
  );
};