import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import type { Character, Location, Item, Note } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface DashboardChartsProps {
  characters: Character[];
  locations: Location[];
  items: Item[];
  notes: Note[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  characters,
  locations,
  items,
  notes,
}) => {
  // Character type distribution
  const characterTypeData = characters.reduce((acc, char) => {
    acc[char.type] = (acc[char.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const characterChart = {
    labels: Object.keys(characterTypeData),
    datasets: [
      {
        label: 'Characters by Type',
        data: Object.values(characterTypeData),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // Blue for PC
          'rgba(107, 114, 128, 0.8)', // Gray for NPC
          'rgba(239, 68, 68, 0.8)', // Red for Villain
          'rgba(34, 197, 94, 0.8)', // Green for Ally
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(107, 114, 128, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Location hierarchy
  const locationTypeData = locations.reduce((acc, loc) => {
    acc[loc.type] = (acc[loc.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationChart = {
    labels: Object.keys(locationTypeData),
    datasets: [
      {
        label: 'Locations by Type',
        data: Object.values(locationTypeData),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Item distribution
  const itemTypeData = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const itemChart = {
    labels: Object.keys(itemTypeData),
    datasets: [
      {
        label: 'Items by Type',
        data: Object.values(itemTypeData),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Notes activity over time (last 30 days)
  const notesOverTime = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailyNotes: Record<string, number> = {};
    
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyNotes[dateStr] = 0;
    }

    notes.forEach(note => {
      const noteDate = new Date(note.createdAt).toISOString().split('T')[0];
      if (dailyNotes[noteDate] !== undefined) {
        dailyNotes[noteDate]++;
      }
    });

    return {
      labels: Object.keys(dailyNotes).slice(-7), // Last 7 days
      datasets: [
        {
          label: 'Notes Created',
          data: Object.values(dailyNotes).slice(-7),
          fill: false,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  if (characters.length === 0 && locations.length === 0 && items.length === 0 && notes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Analytics</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">Start adding characters, locations, items, and notes to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Campaign Analytics</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Character Distribution */}
        {Object.keys(characterTypeData).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Character Types</h4>
            <div className="h-64">
              <Pie data={characterChart} options={pieOptions} />
            </div>
          </div>
        )}

        {/* Location Distribution */}
        {Object.keys(locationTypeData).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Location Types</h4>
            <div className="h-64">
              <Bar data={locationChart} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Item Distribution */}
        {Object.keys(itemTypeData).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Item Types</h4>
            <div className="h-64">
              <Bar data={itemChart} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Notes Activity */}
        {notes.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-800 mb-4">Recent Notes Activity</h4>
            <div className="h-64">
              <Line data={notesOverTime()} options={chartOptions} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">Campaign Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{characters.length}</div>
            <div className="text-sm text-gray-600">Total Characters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{locations.length}</div>
            <div className="text-sm text-gray-600">Total Locations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{items.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{notes.length}</div>
            <div className="text-sm text-gray-600">Total Notes</div>
          </div>
        </div>
        
        {characters.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-blue-500">
                  {characters.filter(c => c.type === 'PC').length}
                </div>
                <div className="text-xs text-gray-500">Player Characters</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-500">
                  {characters.filter(c => c.type === 'NPC').length}
                </div>
                <div className="text-xs text-gray-500">NPCs</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-500">
                  {characters.filter(c => c.type === 'Villain').length}
                </div>
                <div className="text-xs text-gray-500">Villains</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-500">
                  {characters.filter(c => c.type === 'Ally').length}
                </div>
                <div className="text-xs text-gray-500">Allies</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};