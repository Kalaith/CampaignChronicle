import { useState, useEffect } from 'react';
import { Modal } from './Modal';

interface WeatherData {
  condition: string;
  temperature: string;
  icon: string;
  description: string;
  effects: string[];
}

interface CalendarData {
  currentDate: {
    day: number;
    month: number;
    year: number;
    season: string;
  };
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  name: string;
  date: { day: number; month: number; year: number };
  description: string;
  type: 'holiday' | 'quest' | 'event' | 'session';
}

interface WeatherCalendarProps {
  isOpen: boolean;
  onClose: () => void;
}

const weatherConditions = [
  {
    condition: 'Clear',
    temperature: 'Mild',
    icon: '☀️',
    description: 'Clear skies with bright sunshine',
    effects: ['Good visibility', 'Normal travel conditions']
  },
  {
    condition: 'Partly Cloudy',
    temperature: 'Cool',
    icon: '⛅',
    description: 'Some clouds with occasional sunshine',
    effects: ['Good visibility', 'Pleasant traveling weather']
  },
  {
    condition: 'Overcast',
    temperature: 'Cool',
    icon: '☁️',
    description: 'Completely cloudy skies',
    effects: ['Reduced visibility', 'Gloomy atmosphere']
  },
  {
    condition: 'Light Rain',
    temperature: 'Cool',
    icon: '🌦️',
    description: 'Light rainfall with occasional breaks',
    effects: ['Wet roads', 'Disadvantage on tracking', 'Reduced visibility']
  },
  {
    condition: 'Heavy Rain',
    temperature: 'Cold',
    icon: '🌧️',
    description: 'Steady, heavy rainfall',
    effects: ['Flooded paths', 'Difficult travel', 'Poor visibility', 'Disadvantage on Perception (sight)']
  },
  {
    condition: 'Thunderstorm',
    temperature: 'Warm',
    icon: '⛈️',
    description: 'Heavy rain with thunder and lightning',
    effects: ['Dangerous travel', 'Loud thunder masks sounds', 'Risk of lightning strikes', 'Animals are skittish']
  },
  {
    condition: 'Snow',
    temperature: 'Cold',
    icon: '❄️',
    description: 'Falling snow',
    effects: ['Slippery surfaces', 'Tracks in snow', 'Reduced visibility', 'Cold weather effects']
  },
  {
    condition: 'Blizzard',
    temperature: 'Frigid',
    icon: '🌨️',
    description: 'Heavy snow with strong winds',
    effects: ['Extreme cold', 'Near zero visibility', 'Dangerous travel', 'Risk of exposure']
  },
  {
    condition: 'Fog',
    temperature: 'Cool',
    icon: '🌫️',
    description: 'Dense fog limiting visibility',
    effects: ['Heavily obscured area', 'Muffled sounds', 'Easy to get lost', 'Advantage on Stealth']
  },
  {
    condition: 'Windy',
    temperature: 'Cool',
    icon: '💨',
    description: 'Strong winds',
    effects: ['Difficult flight', 'Ranged attacks at disadvantage', 'Loud wind masks sounds']
  }
];

const months = [
  'Midwinter', 'Late Winter', 'The Claw of Winter', 'The Claw of the Sunsets',
  'The Melting', 'The Time of Flowers', 'Flamerule', 'Eleasis',
  'Eleint', 'Marpenoth', 'Uktar', 'The Rotting'
];

const seasons = {
  'Winter': [0, 1, 2],
  'Spring': [3, 4, 5],
  'Summer': [6, 7, 8],
  'Autumn': [9, 10, 11]
};

const generateWeather = (season: string): WeatherData => {
  let availableWeather = [...weatherConditions];
  
  // Adjust weather probabilities based on season
  if (season === 'Winter') {
    // More likely to have cold/snowy weather
    availableWeather = availableWeather.filter(w => 
      ['Clear', 'Overcast', 'Snow', 'Blizzard', 'Fog'].includes(w.condition)
    );
  } else if (season === 'Summer') {
    // More likely to have warm/stormy weather
    availableWeather = availableWeather.filter(w => 
      ['Clear', 'Partly Cloudy', 'Thunderstorm', 'Windy', 'Light Rain'].includes(w.condition)
    );
  } else if (season === 'Spring' || season === 'Autumn') {
    // More varied weather
    availableWeather = availableWeather.filter(w => 
      !['Blizzard', 'Snow'].includes(w.condition)
    );
  }
  
  return availableWeather[Math.floor(Math.random() * availableWeather.length)];
};

const getSeason = (month: number): string => {
  for (const [seasonName, monthIndices] of Object.entries(seasons)) {
    if (monthIndices.includes(month)) {
      return seasonName;
    }
  }
  return 'Spring';
};

export const WeatherCalendar = ({ isOpen, onClose }: WeatherCalendarProps) => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData>(weatherConditions[0]);
  const [calendar, setCalendar] = useState<CalendarData>({
    currentDate: {
      day: 1,
      month: 0,
      year: 1492,
      season: 'Winter'
    },
    events: []
  });
  const [newEvent, setNewEvent] = useState({
    name: '',
    day: 1,
    month: 0,
    year: 1492,
    description: '',
    type: 'event' as CalendarEvent['type']
  });
  const [showAddEvent, setShowAddEvent] = useState(false);

  useEffect(() => {
    const season = getSeason(calendar.currentDate.month);
    setCalendar(prev => ({
      ...prev,
      currentDate: { ...prev.currentDate, season }
    }));
  }, [calendar.currentDate.month]);

  const generateNewWeather = () => {
    const weather = generateWeather(calendar.currentDate.season);
    setCurrentWeather(weather);
  };

  const advanceDay = () => {
    setCalendar(prev => {
      let newDay = prev.currentDate.day + 1;
      let newMonth = prev.currentDate.month;
      let newYear = prev.currentDate.year;

      if (newDay > 30) { // Assuming 30 days per month for simplicity
        newDay = 1;
        newMonth += 1;
        if (newMonth > 11) {
          newMonth = 0;
          newYear += 1;
        }
      }

      return {
        ...prev,
        currentDate: {
          day: newDay,
          month: newMonth,
          year: newYear,
          season: getSeason(newMonth)
        }
      };
    });
    
    // Generate new weather for the new day
    generateNewWeather();
  };

  const addEvent = () => {
    if (newEvent.name.trim()) {
      const event: CalendarEvent = {
        id: crypto.randomUUID(),
        name: newEvent.name.trim(),
        date: {
          day: newEvent.day,
          month: newEvent.month,
          year: newEvent.year
        },
        description: newEvent.description.trim(),
        type: newEvent.type
      };

      setCalendar(prev => ({
        ...prev,
        events: [...prev.events, event].sort((a, b) => {
          if (a.date.year !== b.date.year) return a.date.year - b.date.year;
          if (a.date.month !== b.date.month) return a.date.month - b.date.month;
          return a.date.day - b.date.day;
        })
      }));

      setNewEvent({
        name: '',
        day: 1,
        month: 0,
        year: calendar.currentDate.year,
        description: '',
        type: 'event'
      });
      setShowAddEvent(false);
    }
  };

  const removeEvent = (eventId: string) => {
    setCalendar(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== eventId)
    }));
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'holiday': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'quest': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'session': return 'bg-green-100 text-green-800 border-green-200';
      case 'event': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const upcomingEvents = calendar.events.filter(event => {
    const currentDateValue = calendar.currentDate.year * 1000 + calendar.currentDate.month * 100 + calendar.currentDate.day;
    const eventDateValue = event.date.year * 1000 + event.date.month * 100 + event.date.day;
    return eventDateValue >= currentDateValue;
  }).slice(0, 5);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Weather & Calendar Modal */}
      <div className="fixed inset-4 bg-white rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Weather & Calendar</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Date & Weather */}
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Current Date</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-800">
                    {calendar.currentDate.day}
                  </div>
                  <div className="text-lg text-blue-700">
                    {months[calendar.currentDate.month]}
                  </div>
                  <div className="text-sm text-blue-600">
                    {calendar.currentDate.year} • {calendar.currentDate.season}
                  </div>
                </div>
                <button
                  onClick={advanceDay}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Advance to Next Day
                </button>
              </div>

              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-900">Current Weather</h3>
                  <button
                    onClick={generateNewWeather}
                    className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    🎲 New Weather
                  </button>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{currentWeather.icon}</div>
                  <div className="text-xl font-semibold text-green-800">
                    {currentWeather.condition}
                  </div>
                  <div className="text-sm text-green-600">
                    {currentWeather.temperature} • {currentWeather.description}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-green-800 mb-2">Effects:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {currentWeather.effects.map((effect, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {effect}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Calendar Events */}
            <div className="space-y-6">
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-yellow-900">Upcoming Events</h3>
                  <button
                    onClick={() => setShowAddEvent(true)}
                    className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                  >
                    + Add Event
                  </button>
                </div>

                {upcomingEvents.length === 0 ? (
                  <p className="text-yellow-600 text-center py-4">No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded border ${getEventTypeColor(event.type)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{event.name}</h4>
                            <p className="text-xs opacity-75">
                              {event.date.day} {months[event.date.month]} {event.date.year}
                            </p>
                            {event.description && (
                              <p className="text-sm mt-1 opacity-90">{event.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-3">
                            <span className="text-xs font-medium px-2 py-1 bg-white bg-opacity-50 rounded">
                              {event.type}
                            </span>
                            <button
                              onClick={() => removeEvent(event.id)}
                              className="text-xs opacity-60 hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Calendar Reference */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3">Calendar Reference</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {months.map((month, index) => (
                    <div
                      key={month}
                      className={`p-2 rounded text-center ${
                        index === calendar.currentDate.month
                          ? 'bg-blue-100 text-blue-800 font-medium'
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      {month}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p><strong>30 days per month</strong> • Current season: <strong>{calendar.currentDate.season}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal
        isOpen={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        title="Add Calendar Event"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name *
            </label>
            <input
              type="text"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Festival of the Moon"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={newEvent.day}
                onChange={(e) => setNewEvent({ ...newEvent, day: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={newEvent.month}
                onChange={(e) => setNewEvent({ ...newEvent, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="number"
                value={newEvent.year}
                onChange={(e) => setNewEvent({ ...newEvent, year: parseInt(e.target.value) || calendar.currentDate.year })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="event">Event</option>
              <option value="holiday">Holiday</option>
              <option value="quest">Quest</option>
              <option value="session">Session</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Annual celebration with feasts and competitions"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowAddEvent(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={addEvent}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Event
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};