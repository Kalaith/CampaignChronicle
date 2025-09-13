import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  QrCode, 
  Eye, 
  RefreshCw,
  Users,
  Scroll,
  MapPin,
  Swords,
  Clock,
  Book,
  Dice6,
  Heart,
  Shield,
  Zap,
  Star,
  Plus,
  Minus,
  Volume2,
  VolumeX
} from 'lucide-react';
import { playerAccessApi, characterApi, noteApi } from '@/services/api';
import { useCampaignStore } from '@/stores/campaignStore';
import { useDiceStore } from '@/stores/diceStore';
import { DiceRoller } from './DiceRoller';

interface MobileSession {
  characters: any[];
  quickNotes: string[];
  initiativeTracker: { name: string; initiative: number; hp?: number; maxHp?: number }[];
  soundscape: {
    currentTrack?: string;
    volume: number;
    isPlaying: boolean;
  };
}

interface MobileCompanionAppProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MobileCompanionApp: React.FC<MobileCompanionAppProps> = ({
  campaignId,
  isOpen,
  onClose,
}) => {
  const { campaign, characters } = useCampaignStore();
  const [mobileSession, setMobileSession] = useState<MobileSession>({
    characters: [],
    quickNotes: [],
    initiativeTracker: [],
    soundscape: {
      volume: 50,
      isPlaying: false,
    },
  });
  
  const [qrCode, setQrCode] = useState<string>('');
  const [mobileUrl, setMobileUrl] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [newInitiative, setNewInitiative] = useState({ name: '', initiative: 0 });

  useEffect(() => {
    if (isOpen && campaignId) {
      generateMobileUrl();
      loadSessionData();
    }
  }, [isOpen, campaignId]);

  const generateMobileUrl = () => {
    // Generate a simple mobile-friendly URL
    const baseUrl = window.location.origin;
    const mobileUrl = `${baseUrl}/mobile/${campaignId}`;
    setMobileUrl(mobileUrl);
    
    // Generate QR code URL (using a service or would need QR library)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}`;
    setQrCode(qrUrl);
  };

  const loadSessionData = () => {
    // Load characters
    setMobileSession(prev => ({
      ...prev,
      characters: characters.slice(0, 6), // Limit for mobile view
    }));
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Mobile Companion App
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mobile Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Mobile Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Mobile URL</Label>
                  <div className="flex items-center gap-2">
                    <Input value={mobileUrl} readOnly className="text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(mobileUrl)}
                    >
                      Copy
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Share this URL to access the mobile companion on phones/tablets
                  </div>
                </div>
                <div className="text-center">
                  <Label>QR Code</Label>
                  <div className="mt-2">
                    <img
                      src={qrCode}
                      alt="QR Code for Mobile Access"
                      className="mx-auto border rounded"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Scan to access on mobile device
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Interface Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile Interface Preview</CardTitle>
              <div className="text-sm text-muted-foreground">
                Preview of the mobile companion interface
              </div>
            </CardHeader>
            <CardContent>
              {/* Mobile Frame */}
              <div className="mx-auto max-w-sm border-4 border-gray-800 rounded-3xl bg-black p-2">
                <div className="bg-white rounded-2xl h-[600px] overflow-y-auto">
                  
                  <Tabs defaultValue="characters" className="h-full">
                    {/* Mobile Tab Bar */}
                    <div className="border-b">
                      <TabsList className="grid w-full grid-cols-5 h-12">
                        <TabsTrigger value="characters" className="p-1">
                          <Users className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="notes" className="p-1">
                          <Scroll className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="dice" className="p-1">
                          <Dice6 className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="initiative" className="p-1">
                          <Swords className="w-4 h-4" />
                        </TabsTrigger>
                        <TabsTrigger value="soundscape" className="p-1">
                          <Volume2 className="w-4 h-4" />
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Characters Tab */}
                    <TabsContent value="characters" className="p-4 space-y-3">
                      <h3 className="font-bold text-lg">Characters</h3>
                      {mobileSession.characters.map((character) => (
                        <Card key={character.id} className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{character.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Level {character.level} {character.class}
                              </div>
                            </div>
                            <div className="text-right text-xs">
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500" />
                                {character.hp || '—'}/{character.max_hp || '—'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Shield className="w-3 h-3 text-blue-500" />
                                AC {character.ac || '—'}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </TabsContent>

                    {/* Quick Notes Tab */}
                    <TabsContent value="notes" className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Quick Notes</h3>
                        <Button size="sm" onClick={addQuickNote} disabled={!newNote.trim()}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add quick note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addQuickNote()}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        {mobileSession.quickNotes.map((note, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                            <span>{note}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeQuickNote(index)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Dice Roller Tab */}
                    <TabsContent value="dice" className="p-4 space-y-3">
                      <div className="h-[480px] overflow-y-auto">
                        <DiceRoller 
                          compact={true}
                          showHistory={true}
                          context="Mobile Session"
                          className="space-y-3"
                        />
                      </div>
                    </TabsContent>

                    {/* Initiative Tracker Tab */}
                    <TabsContent value="initiative" className="p-4 space-y-3">
                      <h3 className="font-bold text-lg">Initiative</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Name"
                          value={newInitiative.name}
                          onChange={(e) => setNewInitiative(prev => ({ ...prev, name: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="Init"
                          value={newInitiative.initiative || ''}
                          onChange={(e) => setNewInitiative(prev => ({ ...prev, initiative: parseInt(e.target.value) || 0 }))}
                          className="text-sm w-20"
                        />
                        <Button size="sm" onClick={addToInitiative}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {mobileSession.initiativeTracker.map((item, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-muted-foreground">Init: {item.initiative}</div>
                            </div>
                            {item.hp !== undefined && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateHP(index, -1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="text-xs min-w-[40px] text-center">
                                  {item.hp}/{item.maxHp}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateHP(index, 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Soundscape Tab */}
                    <TabsContent value="soundscape" className="p-4 space-y-3">
                      <h3 className="font-bold text-lg">Soundscape</h3>
                      <div className="text-center space-y-4">
                        <Button
                          variant={mobileSession.soundscape.isPlaying ? "secondary" : "outline"}
                          onClick={toggleSoundscape}
                          className="w-full"
                        >
                          {mobileSession.soundscape.isPlaying ? (
                            <>
                              <VolumeX className="w-4 h-4 mr-2" />
                              Stop Audio
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-4 h-4 mr-2" />
                              Start Audio
                            </>
                          )}
                        </Button>
                        <div className="space-y-2">
                          <Label>Volume: {mobileSession.soundscape.volume}%</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustVolume(-10)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <div className="flex-1 bg-muted h-2 rounded">
                              <div
                                className="bg-blue-500 h-full rounded"
                                style={{ width: `${mobileSession.soundscape.volume}%` }}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustVolume(10)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Currently: {mobileSession.soundscape.currentTrack || 'No track selected'}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features List */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Quick Reference</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Character stats and status</li>
                    <li>• Quick note-taking during sessions</li>
                    <li>• Fast dice rolling with history</li>
                    <li>• Initiative order tracking</li>
                    <li>• Health/resource management</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Session Tools</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Ambient soundscape control</li>
                    <li>• Combat encounter tools</li>
                    <li>• Real-time sync with campaign</li>
                    <li>• Offline functionality</li>
                    <li>• Touch-optimized interface</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="prose prose-sm">
                <ol className="text-sm space-y-2">
                  <li>
                    <strong>Share the URL:</strong> Copy the mobile URL or have players scan the QR code
                  </li>
                  <li>
                    <strong>Quick Access:</strong> Players can bookmark the URL for easy session access
                  </li>
                  <li>
                    <strong>During Sessions:</strong> Use the mobile interface for quick reference and note-taking
                  </li>
                  <li>
                    <strong>Touch Optimized:</strong> All controls are designed for finger-friendly interaction
                  </li>
                  <li>
                    <strong>Offline Ready:</strong> Basic features work without internet connection
                  </li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};