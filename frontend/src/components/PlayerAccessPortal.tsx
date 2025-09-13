import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Key, 
  Settings, 
  Eye, 
  EyeOff,
  Copy,
  Trash2,
  RefreshCw,
  Calendar,
  Shield
} from 'lucide-react';
import { playerAccessApi } from '@/services/api';
import { useCampaignStore } from '@/stores/campaignStore';

interface PlayerAccess {
  id: string;
  player_name: string;
  player_email: string;
  access_token: string;
  permissions: Record<string, boolean>;
  character_ids: string[];
  status: 'invited' | 'active' | 'suspended' | 'revoked';
  invited_at: string;
  joined_at?: string;
  last_accessed_at?: string;
  notes: string;
  accessible_characters?: any[];
}

interface PlayerAccessPortalProps {
  campaignId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerAccessPortal: React.FC<PlayerAccessPortalProps> = ({
  campaignId,
  isOpen,
  onClose,
}) => {
  const { characters } = useCampaignStore();
  const [playerAccess, setPlayerAccess] = useState<PlayerAccess[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, string>>({});
  const [defaultPermissions, setDefaultPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [selectedAccess, setSelectedAccess] = useState<PlayerAccess | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});

  // New player form
  const [newPlayer, setNewPlayer] = useState({
    player_name: '',
    player_email: '',
    permissions: {} as Record<string, boolean>,
    character_ids: [] as string[],
    notes: '',
  });

  useEffect(() => {
    if (isOpen && campaignId) {
      loadPlayerAccess();
      loadPermissions();
    }
  }, [isOpen, campaignId]);

  const loadPlayerAccess = async () => {
    try {
      setLoading(true);
      const data = await playerAccessApi.list(campaignId);
      setPlayerAccess(data);
    } catch (error) {
      console.error('Failed to load player access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
      const data = await playerAccessApi.getPermissions();
      setAvailablePermissions(data.available_permissions);
      setDefaultPermissions(data.default_permissions);
      setNewPlayer(prev => ({ ...prev, permissions: { ...data.default_permissions } }));
    } catch (error) {
      console.error('Failed to load permissions:', error);
    }
  };

  const handleInvitePlayer = async () => {
    try {
      await playerAccessApi.invite(campaignId, newPlayer);
      setShowInviteDialog(false);
      resetNewPlayerForm();
      loadPlayerAccess();
    } catch (error) {
      console.error('Failed to invite player:', error);
    }
  };

  const handleUpdateAccess = async (accessId: string, updates: any) => {
    try {
      await playerAccessApi.update(campaignId, accessId, updates);
      loadPlayerAccess();
    } catch (error) {
      console.error('Failed to update access:', error);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (window.confirm('Are you sure you want to revoke this player\'s access?')) {
      try {
        await playerAccessApi.revoke(campaignId, accessId);
        loadPlayerAccess();
      } catch (error) {
        console.error('Failed to revoke access:', error);
      }
    }
  };

  const handleRegenerateToken = async (accessId: string) => {
    try {
      await playerAccessApi.regenerateToken(campaignId, accessId);
      loadPlayerAccess();
    } catch (error) {
      console.error('Failed to regenerate token:', error);
    }
  };

  const resetNewPlayerForm = () => {
    setNewPlayer({
      player_name: '',
      player_email: '',
      permissions: { ...defaultPermissions },
      character_ids: [],
      notes: '',
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleTokenVisibility = (accessId: string) => {
    setShowTokens(prev => ({ ...prev, [accessId]: !prev[accessId] }));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'invited': return 'bg-yellow-500';
      case 'suspended': return 'bg-orange-500';
      case 'revoked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Player Access Portal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Manage player access to your campaign
            </div>
            <Button onClick={() => setShowInviteDialog(true)} className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Invite Player
            </Button>
          </div>

          {/* Player Access List */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="space-y-4">
              {playerAccess.map((access) => (
                <Card key={access.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {access.player_name}
                          <Badge className={getStatusBadgeColor(access.status)}>
                            {access.status}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {access.player_email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegenerateToken(access.id)}
                          title="Regenerate Token"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeAccess(access.id)}
                          title="Revoke Access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="overview">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        <TabsTrigger value="characters">Characters</TabsTrigger>
                        <TabsTrigger value="access">Access</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Invited</Label>
                            <div className="font-medium">{formatDate(access.invited_at)}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Joined</Label>
                            <div className="font-medium">{formatDate(access.joined_at)}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Last Active</Label>
                            <div className="font-medium">{formatDate(access.last_accessed_at)}</div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Characters</Label>
                            <div className="font-medium">{access.character_ids?.length || 0}</div>
                          </div>
                        </div>
                        {access.notes && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Notes</Label>
                            <div className="text-sm bg-muted p-2 rounded">{access.notes}</div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="permissions" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(availablePermissions).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between">
                              <Label htmlFor={`${access.id}-${key}`} className="text-sm">{label}</Label>
                              <Switch
                                id={`${access.id}-${key}`}
                                checked={access.permissions?.[key] || false}
                                onCheckedChange={(checked) => {
                                  const newPermissions = { ...access.permissions, [key]: checked };
                                  handleUpdateAccess(access.id, { permissions: newPermissions });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="characters" className="space-y-4">
                        <div className="space-y-2">
                          {characters.map((character) => (
                            <div key={character.id} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{character.name}</div>
                                <div className="text-sm text-muted-foreground">{character.class} {character.level}</div>
                              </div>
                              <Switch
                                checked={access.character_ids?.includes(character.id) || false}
                                onCheckedChange={(checked) => {
                                  let newCharacterIds = access.character_ids || [];
                                  if (checked) {
                                    if (!newCharacterIds.includes(character.id)) {
                                      newCharacterIds = [...newCharacterIds, character.id];
                                    }
                                  } else {
                                    newCharacterIds = newCharacterIds.filter(id => id !== character.id);
                                  }
                                  handleUpdateAccess(access.id, { character_ids: newCharacterIds });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="access" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <Key className="w-4 h-4" />
                              Access Token
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type={showTokens[access.id] ? 'text' : 'password'}
                                value={access.access_token}
                                readOnly
                                className="font-mono text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleTokenVisibility(access.id)}
                                title={showTokens[access.id] ? 'Hide Token' : 'Show Token'}
                              >
                                {showTokens[access.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(access.access_token)}
                                title="Copy Token"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Player Portal URL</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                value={`${window.location.origin}/player-portal/${access.access_token}`}
                                readOnly
                                className="text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(`${window.location.origin}/player-portal/${access.access_token}`)}
                                title="Copy URL"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Share this URL with the player to give them access to the portal.
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ))}

              {playerAccess.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No players have been invited to this campaign yet.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invite Player Dialog */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Invite Player</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="player_name">Player Name</Label>
                <Input
                  id="player_name"
                  value={newPlayer.player_name}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, player_name: e.target.value }))}
                  placeholder="Enter player name"
                />
              </div>
              <div>
                <Label htmlFor="player_email">Player Email</Label>
                <Input
                  id="player_email"
                  type="email"
                  value={newPlayer.player_email}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, player_email: e.target.value }))}
                  placeholder="Enter player email"
                />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {Object.entries(availablePermissions).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`new-${key}`} className="text-sm">{label}</Label>
                      <Switch
                        id={`new-${key}`}
                        checked={newPlayer.permissions[key] || false}
                        onCheckedChange={(checked) => {
                          setNewPlayer(prev => ({
                            ...prev,
                            permissions: { ...prev.permissions, [key]: checked }
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Character Access</Label>
                <div className="space-y-2 mt-2">
                  {characters.map((character) => (
                    <div key={character.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{character.name}</div>
                        <div className="text-sm text-muted-foreground">{character.class} {character.level}</div>
                      </div>
                      <Switch
                        checked={newPlayer.character_ids.includes(character.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewPlayer(prev => ({
                              ...prev,
                              character_ids: [...prev.character_ids, character.id]
                            }));
                          } else {
                            setNewPlayer(prev => ({
                              ...prev,
                              character_ids: prev.character_ids.filter(id => id !== character.id)
                            }));
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newPlayer.notes}
                  onChange={(e) => setNewPlayer(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes about this player..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvitePlayer}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};