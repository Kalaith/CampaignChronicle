import { useState } from 'react';
import type { Quest, QuestObjective, Character, Location } from '../types';
import { Modal } from './Modal';

interface QuestsViewProps {
  quests: Quest[];
  characters: Character[];
  locations: Location[];
  onAddQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'lastModified'>) => void;
  onUpdateQuest: (id: string, updates: Partial<Quest>) => void;
  onDeleteQuest: (id: string) => void;
  campaignId: string;
}

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quest: Omit<Quest, 'id' | 'createdAt' | 'lastModified'>) => void;
  characters: Character[];
  locations: Location[];
  campaignId: string;
  quest?: Quest;
}

const QuestModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  characters,
  locations,
  campaignId,
  quest
}: QuestModalProps) => {
  const [formData, setFormData] = useState({
    title: quest?.title || '',
    description: quest?.description || '',
    status: quest?.status || 'active' as Quest['status'],
    priority: quest?.priority || 'medium' as Quest['priority'],
    questGiver: quest?.questGiver || '',
    rewards: quest?.rewards || '',
    objectives: quest?.objectives || [{ id: crypto.randomUUID(), description: '', completed: false }],
    relatedCharacters: quest?.relatedCharacters || [],
    relatedLocations: quest?.relatedLocations || [],
    tags: quest?.tags.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim() && formData.description.trim() && formData.objectives.some(obj => obj.description.trim())) {
      onSubmit({
        campaignId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        questGiver: formData.questGiver || undefined,
        rewards: formData.rewards || undefined,
        objectives: formData.objectives.filter(obj => obj.description.trim()),
        relatedCharacters: formData.relatedCharacters.length > 0 ? formData.relatedCharacters : undefined,
        relatedLocations: formData.relatedLocations.length > 0 ? formData.relatedLocations : undefined,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        completedAt: formData.status === 'completed' && !quest?.completedAt ? new Date().toISOString() : quest?.completedAt,
      });
      onClose();
    }
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      objectives: [...prev.objectives, { id: crypto.randomUUID(), description: '', completed: false }]
    }));
  };

  const updateObjective = (index: number, description: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.map((obj, i) => 
        i === index ? { ...obj, description } : obj
      )
    }));
  };

  const removeObjective = (index: number) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.filter((_, i) => i !== index)
    }));
  };

  const handleCharacterToggle = (characterId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedCharacters: prev.relatedCharacters.includes(characterId)
        ? prev.relatedCharacters.filter(id => id !== characterId)
        : [...prev.relatedCharacters, characterId]
    }));
  };

  const handleLocationToggle = (locationId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedLocations: prev.relatedLocations.includes(locationId)
        ? prev.relatedLocations.filter(id => id !== locationId)
        : [...prev.relatedLocations, locationId]
    }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={quest ? 'Edit Quest' : 'Add Quest'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quest Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Quest['status'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as Quest['priority'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quest Giver
            </label>
            <select
              value={formData.questGiver}
              onChange={(e) => setFormData({ ...formData, questGiver: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select character...</option>
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
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
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rewards
          </label>
          <input
            type="text"
            value={formData.rewards}
            onChange={(e) => setFormData({ ...formData, rewards: e.target.value })}
            placeholder="Gold, experience, items, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Objectives
            </label>
            <button
              type="button"
              onClick={addObjective}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              + Add Objective
            </button>
          </div>
          <div className="space-y-2">
            {formData.objectives.map((objective, index) => (
              <div key={objective.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={objective.description}
                  onChange={(e) => updateObjective(index, e.target.value)}
                  placeholder="Objective description..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeObjective(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  disabled={formData.objectives.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="main-quest, urgent, faction-related"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {characters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Characters
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {characters.map((character) => (
                <label key={character.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.relatedCharacters.includes(character.id)}
                    onChange={() => handleCharacterToggle(character.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm">{character.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {locations.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Related Locations
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {locations.map((location) => (
                <label key={location.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.relatedLocations.includes(location.id)}
                    onChange={() => handleLocationToggle(location.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="text-sm">{location.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

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
            {quest ? 'Update' : 'Add'} Quest
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const QuestsView = ({ 
  quests, 
  characters, 
  locations, 
  onAddQuest, 
  onUpdateQuest, 
  onDeleteQuest,
  campaignId 
}: QuestsViewProps) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'priority' | 'status' | 'created'>('priority');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | undefined>();

  const filteredQuests = quests
    .filter(quest => {
      const matchesSearch = quest.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quest.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quest.objectives.some(obj => obj.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           quest.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = !statusFilter || quest.status === statusFilter;
      const matchesPriority = !priorityFilter || quest.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'priority':
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'created':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleEdit = (quest: Quest) => {
    setEditingQuest(quest);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (questData: Omit<Quest, 'id' | 'createdAt' | 'lastModified'>) => {
    if (editingQuest) {
      onUpdateQuest(editingQuest.id, { ...questData, lastModified: new Date().toISOString() });
    } else {
      onAddQuest(questData);
    }
    setEditingQuest(undefined);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingQuest(undefined);
  };

  const toggleObjectiveComplete = (questId: string, objectiveId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const updatedObjectives = quest.objectives.map(obj => 
      obj.id === objectiveId 
        ? { 
            ...obj, 
            completed: !obj.completed,
            completedAt: !obj.completed ? new Date().toISOString() : undefined
          }
        : obj
    );

    const allCompleted = updatedObjectives.every(obj => obj.completed);
    const updates: Partial<Quest> = {
      objectives: updatedObjectives,
      lastModified: new Date().toISOString()
    };

    if (allCompleted && quest.status === 'active') {
      updates.status = 'completed';
      updates.completedAt = new Date().toISOString();
    }

    onUpdateQuest(questId, updates);
  };

  const getStatusIcon = (status: Quest['status']) => {
    switch (status) {
      case 'active': return '🎯';
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'on-hold': return '⏸️';
      default: return '📋';
    }
  };

  const getStatusColor = (status: Quest['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: Quest['priority']) => {
    switch (priority) {
      case 'critical': return '🔥';
      case 'high': return '❗';
      case 'medium': return '📌';
      case 'low': return '📝';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority: Quest['priority']) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Quest Journal</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Quest
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search quests..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="on-hold">On Hold</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="priority">Sort by Priority</option>
          <option value="title">Sort by Title</option>
          <option value="status">Sort by Status</option>
          <option value="created">Sort by Created</option>
        </select>
      </div>

      {/* Quest Cards */}
      <div className="grid gap-6">
        {filteredQuests.map((quest) => {
          const questGiver = quest.questGiver ? characters.find(c => c.id === quest.questGiver) : null;
          const completedObjectives = quest.objectives.filter(obj => obj.completed).length;
          const progressPercentage = quest.objectives.length > 0 
            ? Math.round((completedObjectives / quest.objectives.length) * 100) 
            : 0;

          return (
            <div 
              key={quest.id} 
              className={`bg-white rounded-lg shadow border-l-4 ${getPriorityColor(quest.priority)} p-6`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-xl">{getPriorityIcon(quest.priority)}</span>
                    <h3 className="text-lg font-semibold text-gray-900">{quest.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quest.status)}`}>
                      {getStatusIcon(quest.status)} {quest.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(quest.priority)}`}>
                      {quest.priority}
                    </span>
                  </div>
                  
                  {questGiver && (
                    <div className="text-sm text-gray-600 mb-2">
                      🎭 Quest Giver: <span className="font-medium">{questGiver.name}</span>
                    </div>
                  )}

                  <p className="text-gray-700 mb-4">{quest.description}</p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{completedObjectives}/{quest.objectives.length} objectives ({progressPercentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Objectives */}
                  <div className="space-y-2 mb-4">
                    {quest.objectives.map((objective) => (
                      <div 
                        key={objective.id} 
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={objective.completed}
                          onChange={() => toggleObjectiveComplete(quest.id, objective.id)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span 
                          className={`text-sm ${
                            objective.completed 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-700'
                          }`}
                        >
                          {objective.description}
                        </span>
                        {objective.completed && objective.completedAt && (
                          <span className="text-xs text-gray-400">
                            ✓ {new Date(objective.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {quest.rewards && (
                    <div className="text-sm text-gray-600 mb-3">
                      🎁 <span className="font-medium">Rewards:</span> {quest.rewards}
                    </div>
                  )}

                  {/* Related Characters and Locations */}
                  {(quest.relatedCharacters?.length || quest.relatedLocations?.length) && (
                    <div className="space-y-2 mb-3">
                      {quest.relatedCharacters?.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">Characters:</span>
                          <div className="flex flex-wrap gap-1">
                            {quest.relatedCharacters.map(characterId => {
                              const character = characters.find(c => c.id === characterId);
                              return character ? (
                                <span key={characterId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {character.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                      
                      {quest.relatedLocations?.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-600">Locations:</span>
                          <div className="flex flex-wrap gap-1">
                            {quest.relatedLocations.map(locationId => {
                              const location = locations.find(l => l.id === locationId);
                              return location ? (
                                <span key={locationId} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                  {location.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {quest.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {quest.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(quest)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete quest "${quest.title}"?`)) {
                        onDeleteQuest(quest.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {quests.length === 0 ? 'No quests yet. Add your first quest!' : 'No quests match your search and filters.'}
          </p>
        </div>
      )}

      <QuestModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        characters={characters}
        locations={locations}
        campaignId={campaignId}
        quest={editingQuest}
      />
    </div>
  );
};