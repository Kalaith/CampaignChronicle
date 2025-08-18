import type { Character, Location, Item, Note } from '../types';

interface DashboardProps {
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
}

export const Dashboard = ({ characters, locations, items, notes }: DashboardProps) => {
  const stats = [
    { label: 'Characters', count: characters.length, icon: '👥' },
    { label: 'Locations', count: locations.length, icon: '🏰' },
    { label: 'Items', count: items.length, icon: '⚔️' },
    { label: 'Notes', count: notes.length, icon: '📝' },
  ];

  const recentNotes = notes
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 5);

  const charactersByType = characters.reduce((acc, char) => {
    acc[char.type] = (acc[char.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Campaign Dashboard</h2>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-2xl mr-3">{stat.icon}</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notes</h3>
          </div>
          <div className="p-6">
            {recentNotes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notes yet</p>
            ) : (
              <div className="space-y-3">
                {recentNotes.map((note) => (
                  <div key={note.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">{note.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(note.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Character Breakdown */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Character Types</h3>
          </div>
          <div className="p-6">
            {Object.keys(charactersByType).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No characters yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(charactersByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-gray-700 capitalize">{type}s</span>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">👤</div>
            <div className="text-sm font-medium">Add Character</div>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">🏰</div>
            <div className="text-sm font-medium">Add Location</div>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">⚔️</div>
            <div className="text-sm font-medium">Add Item</div>
          </button>
          <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-sm font-medium">Add Note</div>
          </button>
        </div>
      </div>
    </div>
  );
};
