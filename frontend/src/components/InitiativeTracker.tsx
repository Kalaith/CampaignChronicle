import { useState, useEffect } from 'react';
import type { Character } from '../types';
import { Modal } from './Modal';

interface InitiativeEntry {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number;
  statusEffects: StatusEffect[];
  isPlayer: boolean;
  notes: string;
}

interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number; // -1 for permanent
  type: 'buff' | 'debuff' | 'neutral';
}

interface InitiativeTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
}

interface AddCombatantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (combatant: Omit<InitiativeEntry, 'id' | 'statusEffects'>) => void;
  characters: Character[];
}

const predefinedStatusEffects = [
  { name: 'Blessed', description: '+1d4 to attack rolls and saves', type: 'buff' as const },
  { name: 'Poisoned', description: 'Disadvantage on attack rolls and ability checks', type: 'debuff' as const },
  { name: 'Paralyzed', description: 'Cannot move or act', type: 'debuff' as const },
  { name: 'Stunned', description: 'Cannot move or act, fails Str/Dex saves', type: 'debuff' as const },
  { name: 'Charmed', description: 'Cannot attack charmer, charmer has advantage on social interactions', type: 'debuff' as const },
  { name: 'Frightened', description: 'Disadvantage on ability checks and attacks while source is in sight', type: 'debuff' as const },
  { name: 'Blinded', description: 'Cannot see, auto-fail sight checks, disadvantage on attacks', type: 'debuff' as const },
  { name: 'Deafened', description: 'Cannot hear, auto-fail hearing checks', type: 'debuff' as const },
  { name: 'Prone', description: 'Can only crawl, disadvantage on melee attacks', type: 'debuff' as const },
  { name: 'Restrained', description: 'Speed 0, disadvantage on attacks and Dex saves', type: 'debuff' as const },
  { name: 'Haste', description: 'Double speed, extra action, +2 AC', type: 'buff' as const },
  { name: 'Slow', description: 'Half speed, -2 AC, limited actions', type: 'debuff' as const },
  { name: 'Invisible', description: 'Cannot be seen, advantage on attacks', type: 'buff' as const },
  { name: 'Concentration', description: 'Maintaining a spell', type: 'neutral' as const },
];

const AddCombatantModal = ({ isOpen, onClose, onAdd, characters }: AddCombatantModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    initiative: '',
    hp: '',
    maxHp: '',
    ac: '',
    isPlayer: false,
    notes: '',
    useExistingCharacter: false,
    selectedCharacterId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.initiative && formData.hp && formData.maxHp) {
      onAdd({
        name: formData.name.trim(),
        initiative: parseInt(formData.initiative),
        hp: parseInt(formData.hp),
        maxHp: parseInt(formData.maxHp),
        ac: parseInt(formData.ac) || 10,
        isPlayer: formData.isPlayer,
        notes: formData.notes,
      });
      setFormData({
        name: '',
        initiative: '',
        hp: '',
        maxHp: '',
        ac: '',
        isPlayer: false,
        notes: '',
        useExistingCharacter: false,
        selectedCharacterId: '',
      });
      onClose();
    }
  };

  const handleCharacterSelect = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (character) {
      setFormData(prev => ({
        ...prev,
        name: character.name,
        hp: character.hp?.toString() || '',
        maxHp: character.hp?.toString() || '',
        ac: character.ac?.toString() || '',
        isPlayer: character.type === 'PC',
        selectedCharacterId: characterId,
      }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Combatant">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.useExistingCharacter}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                useExistingCharacter: e.target.checked,
                selectedCharacterId: '',
                name: '',
                hp: '',
                maxHp: '',
                ac: ''
              }))}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Use existing character</span>
          </label>
        </div>

        {formData.useExistingCharacter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Character
            </label>
            <select
              value={formData.selectedCharacterId}
              onChange={(e) => handleCharacterSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a character...</option>
              {characters.map(character => (
                <option key={character.id} value={character.id}>
                  {character.name} ({character.type})
                </option>
              ))}
            </select>
          </div>
        )}

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
              disabled={formData.useExistingCharacter && !formData.selectedCharacterId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initiative *
            </label>
            <input
              type="number"
              value={formData.initiative}
              onChange={(e) => setFormData({ ...formData, initiative: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current HP *
            </label>
            <input
              type="number"
              value={formData.hp}
              onChange={(e) => setFormData({ ...formData, hp: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={formData.useExistingCharacter && !formData.selectedCharacterId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max HP *
            </label>
            <input
              type="number"
              value={formData.maxHp}
              onChange={(e) => setFormData({ ...formData, maxHp: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={formData.useExistingCharacter && !formData.selectedCharacterId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AC
            </label>
            <input
              type="number"
              value={formData.ac}
              onChange={(e) => setFormData({ ...formData, ac: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
              disabled={formData.useExistingCharacter && !formData.selectedCharacterId}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isPlayer}
              onChange={(e) => setFormData({ ...formData, isPlayer: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Player Character</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Special abilities, resistances, etc."
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
            Add Combatant
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const InitiativeTracker = ({ isOpen, onClose, characters }: InitiativeTrackerProps) => {
  const [combatants, setCombatants] = useState<InitiativeEntry[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [round, setRound] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCombatStarted, setIsCombatStarted] = useState(false);

  const sortedCombatants = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const addCombatant = (combatantData: Omit<InitiativeEntry, 'id' | 'statusEffects'>) => {
    const newCombatant: InitiativeEntry = {
      ...combatantData,
      id: crypto.randomUUID(),
      statusEffects: [],
    };
    setCombatants(prev => [...prev, newCombatant]);
  };

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
    // Adjust current turn if necessary
    const removedIndex = sortedCombatants.findIndex(c => c.id === id);
    if (removedIndex < currentTurn) {
      setCurrentTurn(prev => prev - 1);
    }
  };

  const updateCombatant = (id: string, updates: Partial<InitiativeEntry>) => {
    setCombatants(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const nextTurn = () => {
    if (sortedCombatants.length === 0) return;
    
    if (currentTurn >= sortedCombatants.length - 1) {
      setCurrentTurn(0);
      setRound(prev => prev + 1);
      // Decrease status effect durations
      setCombatants(prev => prev.map(combatant => ({
        ...combatant,
        statusEffects: combatant.statusEffects.map(effect => ({
          ...effect,
          duration: effect.duration > 0 ? effect.duration - 1 : effect.duration
        })).filter(effect => effect.duration !== 0)
      })));
    } else {
      setCurrentTurn(prev => prev + 1);
    }
  };

  const previousTurn = () => {
    if (sortedCombatants.length === 0) return;
    
    if (currentTurn <= 0) {
      setCurrentTurn(sortedCombatants.length - 1);
      setRound(prev => Math.max(1, prev - 1));
    } else {
      setCurrentTurn(prev => prev - 1);
    }
  };

  const startCombat = () => {
    if (combatants.length > 0) {
      setIsCombatStarted(true);
      setCurrentTurn(0);
      setRound(1);
    }
  };

  const endCombat = () => {
    setIsCombatStarted(false);
    setCombatants([]);
    setCurrentTurn(0);
    setRound(1);
  };

  const addStatusEffect = (combatantId: string) => {
    const effect = prompt('Status effect name:');
    const description = prompt('Description:');
    const durationStr = prompt('Duration (rounds, -1 for permanent):');
    const typeStr = prompt('Type (buff/debuff/neutral):') as 'buff' | 'debuff' | 'neutral' || 'neutral';
    
    if (effect && description && durationStr !== null) {
      const duration = parseInt(durationStr);
      const newEffect: StatusEffect = {
        id: crypto.randomUUID(),
        name: effect,
        description,
        duration: isNaN(duration) ? -1 : duration,
        type: typeStr,
      };
      
      updateCombatant(combatantId, {
        statusEffects: [...(combatants.find(c => c.id === combatantId)?.statusEffects || []), newEffect]
      });
    }
  };

  const removeStatusEffect = (combatantId: string, effectId: string) => {
    const combatant = combatants.find(c => c.id === combatantId);
    if (combatant) {
      updateCombatant(combatantId, {
        statusEffects: combatant.statusEffects.filter(e => e.id !== effectId)
      });
    }
  };

  const getStatusEffectColor = (type: StatusEffect['type']) => {
    switch (type) {
      case 'buff': return 'bg-green-100 text-green-800 border-green-200';
      case 'debuff': return 'bg-red-100 text-red-800 border-red-200';
      case 'neutral': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getHPColor = (hp: number, maxHp: number) => {
    const percentage = (hp / maxHp) * 100;
    if (percentage <= 25) return 'text-red-600';
    if (percentage <= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Initiative Tracker Modal */}
      <div className="fixed inset-4 bg-white rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Initiative Tracker</h2>
              {isCombatStarted && (
                <p className="text-sm text-gray-600">
                  Round {round} • {sortedCombatants[currentTurn]?.name}'s Turn
                </p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {!isCombatStarted ? (
                <>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    + Add Combatant
                  </button>
                  <button
                    onClick={startCombat}
                    disabled={combatants.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    Start Combat
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={previousTurn}
                    className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={nextTurn}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Next →
                  </button>
                  <button
                    onClick={endCombat}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    End Combat
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Combatants List */}
        <div className="flex-1 overflow-auto p-6">
          {sortedCombatants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No combatants added yet.</p>
              <p className="text-sm text-gray-400 mt-2">Add combatants to start tracking initiative.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCombatants.map((combatant, index) => (
                <div
                  key={combatant.id}
                  className={`bg-white border rounded-lg p-4 ${
                    isCombatStarted && index === currentTurn
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-700">
                          {combatant.initiative}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{combatant.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            combatant.isPlayer
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {combatant.isPlayer ? 'PC' : 'NPC'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">HP:</span>
                          <input
                            type="number"
                            value={combatant.hp}
                            onChange={(e) => updateCombatant(combatant.id, { hp: parseInt(e.target.value) || 0 })}
                            className={`w-16 px-2 py-1 text-sm border border-gray-300 rounded text-center ${getHPColor(combatant.hp, combatant.maxHp)}`}
                          />
                          <span className="text-sm text-gray-600">/ {combatant.maxHp}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          AC: {combatant.ac}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => addStatusEffect(combatant.id)}
                          className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                        >
                          +Effect
                        </button>
                        <button
                          onClick={() => removeCombatant(combatant.id)}
                          disabled={isCombatStarted}
                          className="text-sm px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Effects */}
                  {combatant.statusEffects.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {combatant.statusEffects.map((effect) => (
                          <div
                            key={effect.id}
                            className={`inline-flex items-center space-x-2 px-2 py-1 rounded border text-xs ${getStatusEffectColor(effect.type)}`}
                          >
                            <span>{effect.name}</span>
                            {effect.duration > 0 && (
                              <span className="bg-white bg-opacity-50 px-1 rounded">
                                {effect.duration}
                              </span>
                            )}
                            <button
                              onClick={() => removeStatusEffect(combatant.id, effect.id)}
                              className="text-current opacity-60 hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {combatant.notes && (
                    <div className="mt-2 text-xs text-gray-600">
                      {combatant.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddCombatantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addCombatant}
        characters={characters}
      />
    </>
  );
};