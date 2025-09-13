import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Scroll, 
  Dice6, 
  Swords, 
  Volume2,
  VolumeX,
  Heart,
  Shield,
  Plus,
  Minus,
  Home,
  RefreshCw,
  WifiOff,
  Wifi
} from 'lucide-react';
import { campaignApi, characterApi, noteApi } from '@/services/api';

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  hp?: number;
  max_hp?: number;
  ac?: number;
  status?: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
}

interface MobileSession {
  quickNotes: string[];
  diceHistory: { roll: string; result: number; timestamp: number }[];
  initiativeTracker: { name: string; initiative: number; hp?: number; maxHp?: number }[];
  soundscape: {
    currentTrack?: string;
    volume: number;
    isPlaying: boolean;
  };
}

export const MobilePage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [error, setError] = useState<string | null>(null);

  // Session state
  const [mobileSession, setMobileSession] = useState<MobileSession>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem(`mobile-session-${campaignId}`);
    return saved ? JSON.parse(saved) : {
      quickNotes: [],
      diceHistory: [],
      initiativeTracker: [],
      soundscape: {
        volume: 50,
        isPlaying: false,
      },
    };
  });

  const [newNote, setNewNote] = useState('');
  const [diceRoll, setDiceRoll] = useState('1d20');
  const [newInitiative, setNewInitiative] = useState({ name: '', initiative: 0 });

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (campaignId) {
      localStorage.setItem(`mobile-session-${campaignId}`, JSON.stringify(mobileSession));
    }
  }, [mobileSession, campaignId]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (campaignId) {
      loadCampaignData();
    }
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load campaign info
      const campaignData = await campaignApi.get(campaignId!);
      setCampaign(campaignData);

      // Load characters
      const charactersData = await characterApi.list(campaignId!);
      setCharacters(charactersData.data || []);

    } catch (error) {
      console.error('Failed to load campaign data:', error);
      setError('Failed to load campaign data. You may be offline.');
      
      // Try to load from cache
      const cachedCampaign = localStorage.getItem(`campaign-${campaignId}`);
      const cachedCharacters = localStorage.getItem(`characters-${campaignId}`);
      
      if (cachedCampaign) setCampaign(JSON.parse(cachedCampaign));
      if (cachedCharacters) setCharacters(JSON.parse(cachedCharacters));
    } finally {
      setLoading(false);
    }
  };

  // Cache data when online
  useEffect(() => {
    if (isOnline && campaign) {
      localStorage.setItem(`campaign-${campaignId}`, JSON.stringify(campaign));
    }
  }, [campaign, campaignId, isOnline]);

  useEffect(() => {
    if (isOnline && characters.length > 0) {
      localStorage.setItem(`characters-${campaignId}`, JSON.stringify(characters));
    }
  }, [characters, campaignId, isOnline]);

  const addQuickNote = () => {
    if (newNote.trim()) {
      setMobileSession(prev => ({
        ...prev,
        quickNotes: [...prev.quickNotes, newNote.trim()],
      }));
      setNewNote('');
    }
  };

  const removeQuickNote = (index: number) => {
    setMobileSession(prev => ({
      ...prev,
      quickNotes: prev.quickNotes.filter((_, i) => i !== index),
    }));
  };

  const rollDice = () => {
    try {
      // Simple dice parsing (1d20, 2d6, etc.)
      const match = diceRoll.match(/^(\d+)d(\d+)(?:\+(\d+))?(?:\-(\d+))?$/i);
      if (!match) return;

      const [, numDice, sides, addMod, subMod] = match;
      const num = parseInt(numDice);
      const die = parseInt(sides);
      const modifier = (parseInt(addMod || '0')) - (parseInt(subMod || '0'));

      let total = 0;
      const rolls = [];
      
      for (let i = 0; i < num; i++) {
        const roll = Math.floor(Math.random() * die) + 1;
        rolls.push(roll);
        total += roll;
      }
      
      total += modifier;
      
      const rollResult = {
        roll: `${diceRoll} → [${rolls.join(', ')}]${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''}`,
        result: total,
        timestamp: Date.now(),
      };

      setMobileSession(prev => ({
        ...prev,
        diceHistory: [rollResult, ...prev.diceHistory.slice(0, 9)], // Keep last 10
      }));
    } catch (error) {
      console.error('Invalid dice format');
    }
  };

  const addToInitiative = () => {
    if (newInitiative.name.trim()) {
      setMobileSession(prev => ({
        ...prev,
        initiativeTracker: [...prev.initiativeTracker, { ...newInitiative }]
          .sort((a, b) => b.initiative - a.initiative),
      }));
      setNewInitiative({ name: '', initiative: 0 });
    }
  };

  const removeFromInitiative = (index: number) => {
    setMobileSession(prev => ({
      ...prev,
      initiativeTracker: prev.initiativeTracker.filter((_, i) => i !== index),
    }));
  };

  const updateHP = (index: number, change: number) => {
    setMobileSession(prev => ({
      ...prev,
      initiativeTracker: prev.initiativeTracker.map((item, i) => {
        if (i === index && item.hp !== undefined) {
          const newHp = Math.max(0, Math.min(item.maxHp || 100, (item.hp || 0) + change));
          return { ...item, hp: newHp };
        }
        return item;
      }),
    }));
  };

  const toggleSoundscape = () => {
    setMobileSession(prev => ({
      ...prev,
      soundscape: {
        ...prev.soundscape,
        isPlaying: !prev.soundscape.isPlaying,
      },
    }));
  };

  const adjustVolume = (change: number) => {
    setMobileSession(prev => ({
      ...prev,
      soundscape: {
        ...prev.soundscape,
        volume: Math.max(0, Math.min(100, prev.soundscape.volume + change)),
      },
    }));
  };

  const quickDiceButtons = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '2d6', '1d20+5'];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <div>Loading campaign data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{campaign?.name || 'Campaign'}</h1>
            <div className="text-xs opacity-75">Mobile Companion</div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-300" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-300" />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/', '_blank')}
              className="text-primary-foreground hover:bg-primary/20"
            >
              <Home className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <Tabs defaultValue="characters" className="w-full">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="characters" className="flex flex-col gap-1 py-3">
              <Users className="w-4 h-4" />
              <span className="text-xs">Party</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex flex-col gap-1 py-3">
              <Scroll className="w-4 h-4" />
              <span className="text-xs">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="dice" className="flex flex-col gap-1 py-3">
              <Dice6 className="w-4 h-4" />
              <span className="text-xs">Dice</span>
            </TabsTrigger>
            <TabsTrigger value="initiative" className="flex flex-col gap-1 py-3">
              <Swords className="w-4 h-4" />
              <span className="text-xs">Init</span>
            </TabsTrigger>
            <TabsTrigger value="soundscape" className="flex flex-col gap-1 py-3">
              <Volume2 className="w-4 h-4" />
              <span className="text-xs">Audio</span>
            </TabsTrigger>
          </TabsList>

          {/* Characters Tab */}
          <TabsContent value="characters" className="space-y-3">
            {characters.map((character) => (
              <Card key={character.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{character.name}</h3>
                      <div className="text-sm text-muted-foreground">
                        Level {character.level} {character.class}
                      </div>
                    </div>
                    {character.status && (
                      <Badge variant="secondary">{character.status}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>HP: {character.hp || '—'}/{character.max_hp || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span>AC: {character.ac || '—'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {characters.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No characters found
              </div>
            )}
          </TabsContent>

          {/* Quick Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="sticky top-0 bg-background p-2 -m-2 border-b">
              <div className="flex gap-2">
                <Input
                  placeholder="Add quick note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addQuickNote()}
                />
                <Button onClick={addQuickNote} disabled={!newNote.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {mobileSession.quickNotes.map((note, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm flex-1">{note}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuickNote(index)}
                        className="text-destructive"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {mobileSession.quickNotes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No quick notes yet
                </div>
              )}
            </div>
          </TabsContent>

          {/* Dice Roller Tab */}
          <TabsContent value="dice" className="space-y-4">
            <div className="sticky top-0 bg-background p-2 -m-2 border-b">
              <div className="flex gap-2 mb-3">
                <Input
                  placeholder="1d20, 2d6+3, etc."
                  value={diceRoll}
                  onChange={(e) => setDiceRoll(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && rollDice()}
                />
                <Button onClick={rollDice}>
                  <Dice6 className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {quickDiceButtons.map((dice) => (
                  <Button
                    key={dice}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDiceRoll(dice);
                      // Auto-roll for quick buttons
                      setTimeout(() => {
                        const event = { target: { value: dice } };
                        setDiceRoll(dice);
                        rollDice();
                      }, 100);
                    }}
                  >
                    {dice}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {mobileSession.diceHistory.map((roll, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="font-mono text-sm text-muted-foreground mb-1">
                      {roll.roll}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold">
                        = {roll.result}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(roll.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {mobileSession.diceHistory.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Roll some dice to see history
                </div>
              )}
            </div>
          </TabsContent>

          {/* Initiative Tracker Tab */}
          <TabsContent value="initiative" className="space-y-4">
            <div className="sticky top-0 bg-background p-2 -m-2 border-b">
              <div className="flex gap-2">
                <Input
                  placeholder="Name"
                  value={newInitiative.name}
                  onChange={(e) => setNewInitiative(prev => ({ ...prev, name: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Initiative"
                  value={newInitiative.initiative || ''}
                  onChange={(e) => setNewInitiative(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                  className="w-24"
                />
                <Button onClick={addToInitiative} disabled={!newInitiative.name.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {mobileSession.initiativeTracker.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Initiative: {item.initiative}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.hp !== undefined && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateHP(index, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <div className="text-sm min-w-[50px] text-center">
                              {item.hp}/{item.maxHp}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateHP(index, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromInitiative(index)}
                          className="text-destructive"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {mobileSession.initiativeTracker.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No initiative order yet
                </div>
              )}
            </div>
          </TabsContent>

          {/* Soundscape Tab */}
          <TabsContent value="soundscape" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Ambient Audio</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <Button
                  variant={mobileSession.soundscape.isPlaying ? "secondary" : "outline"}
                  onClick={toggleSoundscape}
                  className="w-full py-6"
                  size="lg"
                >
                  {mobileSession.soundscape.isPlaying ? (
                    <>
                      <VolumeX className="w-6 h-6 mr-2" />
                      Stop Audio
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-6 h-6 mr-2" />
                      Start Audio
                    </>
                  )}
                </Button>
                
                <div className="space-y-3">
                  <Label>Volume: {mobileSession.soundscape.volume}%</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => adjustVolume(-10)}
                      disabled={mobileSession.soundscape.volume <= 0}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 bg-muted h-3 rounded-full">
                      <div
                        className="bg-primary h-full rounded-full transition-all"
                        style={{ width: `${mobileSession.soundscape.volume}%` }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => adjustVolume(10)}
                      disabled={mobileSession.soundscape.volume >= 100}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Current: {mobileSession.soundscape.currentTrack || 'No track selected'}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};