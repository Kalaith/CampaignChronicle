import React, { useState, useEffect, useRef } from 'react';
import { useDiceStore } from '../stores/diceStore';
import { useCampaignStore } from '../stores/campaignStore';

interface DiceRollerProps {
  className?: string;
  compact?: boolean;
  showHistory?: boolean;
  context?: string;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  className = '',
  compact = false,
  showHistory = true,
  context
}) => {
  const { currentCampaign } = useCampaignStore();
  const {
    rolls,
    templates,
    currentExpression,
    rollDice,
    addTemplate,
    deleteTemplate,
    setCurrentExpression,
    clearHistory,
    calculateProbabilities,
    getRecentRolls
  } = useDiceStore();

  const [customExpression, setCustomExpression] = useState(currentExpression);
  const [rollOptions, setRollOptions] = useState({
    advantage: false,
    disadvantage: false,
    isPrivate: false
  });
  const [activeTab, setActiveTab] = useState('roller');
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    expression: '',
    description: '',
    category: 'custom' as const
  });
  const [showStatistics, setShowStatistics] = useState(false);
  
  const historyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest roll
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = 0;
    }
  }, [rolls]);

  const handleRoll = (expression?: string) => {
    const expr = expression || customExpression;
    if (!expr.trim()) return;

    const campaignId = currentCampaign?.id || '';
    const roll = rollDice(expr, context, {
      ...rollOptions,
      playerId: 'dm',
      playerName: 'Dungeon Master'
    });

    if (roll && currentCampaign) {
      roll.campaignId = campaignId;
    }

    // Reset advantage/disadvantage after roll
    setRollOptions(prev => ({ ...prev, advantage: false, disadvantage: false }));
  };

  const handleQuickRoll = (sides: number, count: number = 1) => {
    const expression = `${count}d${sides}`;
    setCustomExpression(expression);
    handleRoll(expression);
  };

  const handleTemplateRoll = (template: typeof templates[0]) => {
    setCustomExpression(template.expression);
    handleRoll(template.expression);
  };

  const handleSaveTemplate = () => {
    if (newTemplate.name && newTemplate.expression) {
      addTemplate({
        ...newTemplate,
        campaignId: currentCampaign?.id || '',
        tags: []
      });
      setNewTemplate({ name: '', expression: '', description: '', category: 'custom' });
    }
  };

  const formatRollResult = (roll: typeof rolls[0]) => {
    let result = '';
    
    if (roll.individualRolls.length > 1) {
      result += `[${roll.individualRolls.join(', ')}]`;
    } else {
      result += roll.individualRolls[0].toString();
    }
    
    if (roll.modifier !== 0) {
      result += ` ${roll.modifier > 0 ? '+' : ''}${roll.modifier}`;
    }
    
    result += ` = ${roll.result}`;
    
    if (roll.advantage) result += ' (Advantage)';
    if (roll.disadvantage) result += ' (Disadvantage)';
    if (roll.critical) result += ' ⚡';
    
    return result;
  };

  const statistics = showStatistics ? calculateProbabilities(customExpression) : null;

  if (compact) {
    return (
      <div className={`bg-white border rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="1d20"
            value={customExpression}
            onChange={(e) => setCustomExpression(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRoll()}
            className="w-24 px-2 py-1 border rounded text-sm"
          />
          <button 
            onClick={() => handleRoll()}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            🎲
          </button>
          {rolls[0] && (
            <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">
              {rolls[0].result}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Dice Roller */}
      <div className="bg-white border rounded-lg">
        <div className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🎲 Dice Roller
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStatistics(!showStatistics)}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                📊 Stats
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Tab Navigation */}
          <div className="border-b">
            <nav className="flex space-x-8">
              {['roller', 'templates', 'sets'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Roller Tab */}
          {activeTab === 'roller' && (
            <div className="space-y-4">
              {/* Quick Roll Buttons */}
              <div className="grid grid-cols-6 gap-2">
                {[4, 6, 8, 10, 12, 20].map((sides) => (
                  <button
                    key={sides}
                    onClick={() => handleQuickRoll(sides)}
                    className="h-16 flex flex-col items-center justify-center gap-1 border rounded hover:bg-gray-50"
                  >
                    <span className="text-lg">🎲</span>
                    <span className="text-xs">d{sides}</span>
                  </button>
                ))}
              </div>

              {/* Custom Expression */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Custom Roll</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., 2d6+3, 1d20"
                    value={customExpression}
                    onChange={(e) => {
                      setCustomExpression(e.target.value);
                      setCurrentExpression(e.target.value);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleRoll()}
                    className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={() => handleRoll()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Roll
                  </button>
                </div>
              </div>

              {/* Roll Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={rollOptions.advantage}
                    onChange={(e) => 
                      setRollOptions(prev => ({ 
                        ...prev, 
                        advantage: e.target.checked,
                        disadvantage: e.target.checked ? false : prev.disadvantage
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Advantage</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={rollOptions.disadvantage}
                    onChange={(e) => 
                      setRollOptions(prev => ({ 
                        ...prev, 
                        disadvantage: e.target.checked,
                        advantage: e.target.checked ? false : prev.advantage
                      }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Disadvantage</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={rollOptions.isPrivate}
                    onChange={(e) => 
                      setRollOptions(prev => ({ ...prev, isPrivate: e.target.checked }))
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Private Roll</span>
                </label>
              </div>

              {/* Statistics */}
              {showStatistics && statistics && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium mb-3">Probability Statistics</h3>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Min</div>
                      <div className="font-mono">{statistics.min}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Max</div>
                      <div className="font-mono">{statistics.max}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Average</div>
                      <div className="font-mono">{statistics.average.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Most Likely</div>
                      <div className="font-mono">{statistics.mostLikely}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Roll Templates</h3>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  + New Template
                </button>
              </div>

              <div className="space-y-2">
                {templates
                  .filter(t => !currentCampaign || t.campaignId === '' || t.campaignId === currentCampaign.id)
                  .map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">🎯</span>
                        <div>
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{template.expression}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleTemplateRoll(template)}
                          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                        >
                          Roll
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Sets Tab */}
          {activeTab === 'sets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Dice Sets</h3>
                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                  + New Set
                </button>
              </div>
              <div className="text-sm text-gray-500">
                Custom dice sets coming soon...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Roll History */}
      {showHistory && (
        <div className="bg-white border rounded-lg">
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Roll History</h2>
              <button 
                onClick={clearHistory}
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
          <div className="p-6">
            <div 
              ref={historyRef}
              className="space-y-2 max-h-96 overflow-y-auto"
            >
              {rolls.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No rolls yet. Start rolling some dice!
                </div>
              ) : (
                rolls.map((roll) => (
                  <div
                    key={roll.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      roll.critical ? 'border-yellow-500 bg-yellow-50' : ''
                    } ${roll.isPrivate ? 'border-dashed opacity-75' : ''}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{roll.expression}</span>
                        {roll.context && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {roll.context}
                          </span>
                        )}
                        {roll.isPrivate && (
                          <span className="text-gray-400">👁️</span>
                        )}
                      </div>
                      <div className="font-mono text-lg">
                        {formatRollResult(roll)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(roll.timestamp).toLocaleTimeString()}
                        {roll.playerName && ` • ${roll.playerName}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="px-2 py-1 text-gray-400 hover:text-gray-600">
                        📋
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};