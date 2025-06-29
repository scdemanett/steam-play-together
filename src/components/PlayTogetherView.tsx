'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, UserPlus, Play, Users, Trash2, Clock, Check, ListCheck, ListRestart, Eye, EyeOff, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFriends } from '@/contexts/FriendsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { getSteamIconUrl, launchSteamGame } from '@/lib/steam-api';
import { SteamGame } from '@/lib/types';
import { toast } from 'sonner';
import useLocalStorage from '@/hooks/useLocalStorage';

export function PlayTogetherView() {
  const { settings } = useSettings();
  const {
    friends,
    steamFriends,
    commonGames,
    publicFriends,
    privateFriends,
    isLoadingFriends,
    isLoadingSteamFriends,
    isLoadingCommon,
    steamFriendsLoaded,
    lastFriendsUpdate,
    lastSteamFriendsUpdate,
    lastCommonGamesUpdate,
    addFriend,
    addSelectedSteamFriends,
    removeFriend,
    removeAllFriends,
    loadSteamFriends,
    findCommonGames,
  } = useFriends();
  
  const [filteredGames, setFilteredGames] = useState<SteamGame[]>([]);
  const [searchTerm, setSearchTerm] = useLocalStorage('play-together-search', '', settings?.steamId);
  const [newFriendInput, setNewFriendInput] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedSteamFriendsArray, setSelectedSteamFriendsArray] = useLocalStorage<string[]>('play-together-selected', [], settings?.steamId);
  
  // Convert array to Set for easier manipulation
  const selectedSteamFriends = new Set(selectedSteamFriendsArray);
  const setSelectedSteamFriends = (newSet: Set<string>) => {
    setSelectedSteamFriendsArray(Array.from(newSet));
  };

  // Filter Steam friends to exclude those already in the main friends list
  const availableSteamFriends = steamFriends
    .filter(steamFriend => 
      !friends.some(friend => friend.steamId === steamFriend.steamId)
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Sort friends alphabetically by name
  const sortedFriends = [...friends].sort((a, b) => a.name.localeCompare(b.name));

  // Clear selected friends that are no longer available
  useEffect(() => {
    const availableIds = new Set(availableSteamFriends.map(f => f.steamId));
    const filteredSelected = selectedSteamFriendsArray.filter(id => availableIds.has(id));
    if (filteredSelected.length !== selectedSteamFriendsArray.length) {
      setSelectedSteamFriendsArray(filteredSelected);
    }
  }, [availableSteamFriends, selectedSteamFriendsArray, setSelectedSteamFriendsArray]);

  // Filter games
  useEffect(() => {
    const filtered = commonGames.filter((game) =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.appid.toString().includes(searchTerm)
    );
    setFilteredGames(filtered);
  }, [commonGames, searchTerm]);

  // Handle adding a friend
  const handleAddFriend = async () => {
    if (!newFriendInput.trim()) return;

    try {
      await addFriend(newFriendInput.trim());
      setNewFriendInput('');
      setSearchPerformed(false); // Reset search state when friends are added
      toast.success('Friend added successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add friend';
      toast.error(errorMessage);
    }
  };

  // Handle loading Steam friends
  const handleLoadSteamFriends = async () => {
    try {
      const friendsCount = await loadSteamFriends();
      toast.success(`Loaded ${friendsCount} friends from Steam`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load Steam friends';
      toast.error(errorMessage);
    }
  };

  const handleSteamFriendToggle = (steamId: string) => {
    const newSelected = new Set(selectedSteamFriends);
    if (newSelected.has(steamId)) {
      newSelected.delete(steamId);
    } else {
      newSelected.add(steamId);
    }
    setSelectedSteamFriends(newSelected);
  };

  const handleSelectAllSteamFriends = () => {
    if (selectedSteamFriends.size === availableSteamFriends.length) {
      setSelectedSteamFriends(new Set());
    } else {
      setSelectedSteamFriends(new Set(availableSteamFriends.map(f => f.steamId)));
    }
  };

  const handleAddSelectedFriends = () => {
    if (selectedSteamFriends.size === 0) {
      toast.error('Please select at least one friend to add');
      return;
    }
    
    const selectedCount = selectedSteamFriends.size;
    addSelectedSteamFriends(Array.from(selectedSteamFriends));
    setSelectedSteamFriends(new Set());
    setSearchPerformed(false); // Reset search state when friends are added
    toast.success(`Added ${selectedCount} friend(s) to Play Together list`);
  };

  // Handle finding common games
  const handleFindCommonGames = async () => {
    try {
      const result = await findCommonGames();
      setSearchPerformed(true);
      
      if (result.gamesCount > 0) {
        // Games found - show success message with optional note about private friends
        if (result.privateFriendsCount > 0) {
          toast.success(`Found ${result.gamesCount} games you can play together with ${result.publicFriendsCount} friend${result.publicFriendsCount !== 1 ? 's' : ''}! Note: ${result.privateFriendsCount} friend${result.privateFriendsCount !== 1 ? 's have' : ' has'} private profiles and couldn't be included.`, {
            duration: 6000
          });
        } else {
          toast.success(`Found ${result.gamesCount} games you can play together with ${result.publicFriendsCount} friend${result.publicFriendsCount !== 1 ? 's' : ''}!`);
        }
      } else {
        // No games found - consolidate messages based on scenarios
        if (result.privateFriendsCount > 0 && result.publicFriendsCount === 0) {
          toast.warning(`All ${result.privateFriendsCount} friend${result.privateFriendsCount !== 1 ? 's have' : ' has'} private Steam profiles. Ask them to make their game details public to find common games.`, {
            duration: 6000
          });
        } else if (result.publicFriendsCount > 0 && result.privateFriendsCount > 0) {
          toast.info(`No common games found with ${result.publicFriendsCount} public friend${result.publicFriendsCount !== 1 ? 's' : ''}. ${result.privateFriendsCount} friend${result.privateFriendsCount !== 1 ? 's have' : ' has'} private profiles and couldn't be included.`, {
            duration: 6000
          });
        } else if (result.publicFriendsCount > 0) {
          toast.info(`No common games found with ${result.publicFriendsCount} friend${result.publicFriendsCount !== 1 ? 's' : ''}.`, {
            duration: 5000
          });
        } else {
          toast.info('No common games found.', {
            duration: 5000
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to find common games';
      toast.error(errorMessage);
      setSearchPerformed(true);
    }
  };

  // Handle removing a friend
  const handleRemoveFriend = (steamId: string) => {
    const friendToRemove = friends.find(f => f.steamId === steamId);
    removeFriend(steamId);
    setSearchPerformed(false); // Reset search state when friends are removed
    toast.success(`${friendToRemove?.name || 'Friend'} removed`);
    // Note: The FriendsContext automatically clears common games cache when friends are removed
  };

  // Handle removing all friends
  const handleRemoveAllFriends = () => {
    const friendCount = friends.length;
    removeAllFriends(); // Use the context function that handles this in a single state update
    setSearchPerformed(false); // Reset search state when all friends are removed
    toast.success(`Removed all ${friendCount} friends from comparison list`);
  };

  const handleLaunchGame = (appId: number, gameName: string) => {
    launchSteamGame(appId);
    toast.success(`Launching ${gameName}...`, {
      description: `If Steam doesn't open, you may need to allow the browser to open Steam links.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Friends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Friends
          </CardTitle>
          <CardDescription>
            Add friends from your friends list or by Steam ID or username to find games you can play together
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Steam ID or username..."
              value={newFriendInput}
              onChange={(e) => setNewFriendInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddFriend}
              disabled={isLoadingFriends || !newFriendInput.trim()}
            >
              {isLoadingFriends ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add
                </>
              )}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 border-t" />
          </div>

          <Button 
            onClick={handleLoadSteamFriends}
            disabled={isLoadingSteamFriends}
            variant="outline"
            className="w-full"
          >
            {isLoadingSteamFriends ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <ListRestart className="h-4 w-4" />
            )}
            Load Friends from Steam
          </Button>
        </CardContent>
      </Card>

      {/* Steam Friends Selection */}
      {steamFriendsLoaded && availableSteamFriends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="space-y-2">
              {/* Desktop layout - title with timestamp and buttons on same row */}
              <div className="hidden lg:flex lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <ListCheck className="h-5 w-5" />
                  <span>Select Steam Friends ({availableSteamFriends.length})</span>
                  {lastSteamFriendsUpdate && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                      <Clock className="h-3 w-3" />
                      {lastSteamFriendsUpdate.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleSelectAllSteamFriends}
                    variant="outline"
                    size="sm"
                  >
                    {selectedSteamFriends.size === availableSteamFriends.length ? (
                      <>
                        <X className="h-4 w-4" />
                        Unselect All
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Select All
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddSelectedFriends}
                    disabled={selectedSteamFriends.size === 0}
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Selected ({selectedSteamFriends.size})
                  </Button>
                </div>
              </div>
              
              {/* Mobile layout - title, timestamp, then buttons in separate rows */}
              <div className="lg:hidden space-y-2">
                {/* Row 1: Title */}
                <div className="flex items-center gap-2">
                  <ListCheck className="h-5 w-5" />
                  <span>Select Steam Friends ({availableSteamFriends.length})</span>
                </div>
                
                {/* Row 2: Timestamp */}
                {lastSteamFriendsUpdate && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                    <Clock className="h-3 w-3" />
                    {lastSteamFriendsUpdate.toLocaleTimeString()}
                  </div>
                )}
                
                {/* Row 3: Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSelectAllSteamFriends}
                    variant="outline"
                    size="sm"
                  >
                    {selectedSteamFriends.size === availableSteamFriends.length ? (
                      <>
                        <X className="h-4 w-4" />
                        Unselect All
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Select All
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAddSelectedFriends}
                    disabled={selectedSteamFriends.size === 0}
                    size="sm"
                  >
                    Add Selected ({selectedSteamFriends.size})
                  </Button>
                </div>
              </div>
            </CardTitle>
            <CardDescription>
              Select which friends you want to compare games with, then click &quot;Add Selected&quot;
              <br />
              <span className="text-xs text-muted-foreground">Friends with Private badges have profiles that won&apos;t contribute to common games</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableSteamFriends.map((friend) => {
                const isPublic = publicFriends.includes(friend.steamId);
                const isPrivate = privateFriends.includes(friend.steamId);
                const hasProfileData = isPublic || isPrivate;
                
                return (
                  <div 
                    key={friend.steamId} 
                    className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${isPrivate ? 'opacity-60' : ''}`}
                    onClick={() => handleSteamFriendToggle(friend.steamId)}
                  >
                    {/* Main content row */}
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedSteamFriends.has(friend.steamId)}
                        onCheckedChange={() => handleSteamFriendToggle(friend.steamId)}
                      />
                      {friend.avatar && (
                        <Image 
                          src={friend.avatar} 
                          alt={`${friend.name} avatar`} 
                          width={32}
                          height={32}
                          className="rounded-full flex-shrink-0"
                          unoptimized
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 lg:justify-between">
                          <div className="font-medium truncate">{friend.name}</div>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">{friend.steamId}</div>
                        <div className="flex gap-2 mt-1">
                          {hasProfileData && (
                            <Badge 
                              variant={isPublic ? "default" : "secondary"} 
                              className="text-xs"
                            >
                              {isPublic ? (
                                <><Eye className="h-3 w-3 mr-1" />Public</>
                              ) : (
                                <><EyeOff className="h-3 w-3 mr-1" />Private</>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message when all Steam friends are already added */}
      {steamFriendsLoaded && steamFriends.length > 0 && availableSteamFriends.length === 0 && (
        <Card>
          <CardContent className="text-center py-6">
            <p className="text-muted-foreground">
              All your Steam friends ({steamFriends.length}) are already in your Play Together list!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      {friends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="space-y-2">
              {/* Desktop layout - title with timestamp and buttons on same row */}
              <div className="hidden lg:flex lg:items-center lg:justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Friends ({friends.length})</span>
                  {lastFriendsUpdate && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                      <Clock className="h-3 w-3" />
                      {lastFriendsUpdate.toLocaleTimeString()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleRemoveAllFriends}
                    disabled={friends.length === 0}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove All
                  </Button>
                  <Button
                    onClick={handleFindCommonGames}
                    disabled={isLoadingCommon || friends.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingCommon ? 'animate-spin' : ''}`} />
                    Find Common Games
                  </Button>
                </div>
              </div>
              
              {/* Mobile layout - title, timestamp, then button in separate rows */}
              <div className="lg:hidden space-y-2">
                {/* Row 1: Title */}
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Friends ({friends.length})</span>
                </div>
                
                {/* Row 2: Timestamp */}
                {lastFriendsUpdate && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                    <Clock className="h-3 w-3" />
                    {lastFriendsUpdate.toLocaleTimeString()}
                  </div>
                )}
                
                {/* Row 3: Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleFindCommonGames}
                    disabled={isLoadingCommon || friends.length === 0}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingCommon ? 'animate-spin' : ''}`} />
                    Find Common Games
                  </Button>
                  <Button
                    onClick={handleRemoveAllFriends}
                    disabled={friends.length === 0}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove All
                  </Button>
                </div>
              </div>
            </CardTitle>
            <CardDescription className="space-y-1">
              <div>Click &quot;Find Common Games&quot; to discover what you can play together</div>
              {/* Row 3: Cached info */}
              {lastFriendsUpdate && (
                <div className="text-xs">
                  Cached • Last updated: {lastFriendsUpdate.toLocaleString()}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sortedFriends.map((friend) => {
                const isPublic = publicFriends.includes(friend.steamId);
                const isPrivate = privateFriends.includes(friend.steamId);
                const hasProfileData = isPublic || isPrivate;
                
                return (
                  <div key={friend.steamId} className="p-3 border rounded-lg">
                    {/* Main content row */}
                    <div className="flex items-center gap-3 lg:justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {friend.avatar && (
                          <Image 
                            src={friend.avatar} 
                            alt={`${friend.name} avatar`} 
                            width={32}
                            height={32}
                            className="rounded-full flex-shrink-0"
                            unoptimized
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{friend.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{friend.steamId}</div>
                          <div className="flex gap-2 mt-1">
                            {hasProfileData && (
                              <Badge 
                                variant={isPublic ? "default" : "secondary"} 
                                className="text-xs"
                              >
                                {isPublic ? (
                                  <><Eye className="h-3 w-3 mr-1" />Public</>
                                ) : (
                                  <><EyeOff className="h-3 w-3 mr-1" />Private</>
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveFriend(friend.steamId)}
                        variant="ghost"
                        size="sm"
                        aria-label={`Remove ${friend.name} from friends list`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Games */}
      <Card>
        <CardHeader>
          <CardTitle className="space-y-2">
            {/* Desktop layout - title with timestamp inline */}
            <div className="hidden lg:flex lg:items-center lg:gap-2">
              <Play className="h-5 w-5" />
              <span>Steam Games You Can Play Together</span>
              {lastCommonGamesUpdate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                  <Clock className="h-3 w-3" />
                  {lastCommonGamesUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            {/* Mobile layout - title, then timestamp in separate rows */}
            <div className="lg:hidden space-y-2">
              {/* Row 1: Title */}
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                <span>Steam Games You Can Play Together</span>
              </div>
              
              {/* Row 2: Timestamp */}
              {lastCommonGamesUpdate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                  <Clock className="h-3 w-3" />
                  {lastCommonGamesUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardTitle>
          <CardDescription className="space-y-2">
            {commonGames.length > 0 && (
              <div className="space-y-1">
                <div>Found {commonGames.length} common games | Showing: {filteredGames.length}</div>
                {(() => {
                  // Only show visibility info for friends that are currently in the comparison list
                  const currentFriendIds = friends.map(f => f.steamId);
                  const currentPublicFriends = publicFriends.filter(id => currentFriendIds.includes(id));
                  const currentPrivateFriends = privateFriends.filter(id => currentFriendIds.includes(id));
                  
                  if (currentPublicFriends.length === 0 && currentPrivateFriends.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div className="text-sm">
                      {currentPublicFriends.length > 0 && (
                        <div className="text-green-600 dark:text-green-400">
                          Games found with {currentPublicFriends.length} friend{currentPublicFriends.length !== 1 ? 's' : ''}: {currentPublicFriends.map(id => friends.find(f => f.steamId === id)?.name || id).join(', ')}
                        </div>
                      )}
                      {currentPrivateFriends.length > 0 && (
                        <div className="text-orange-600 dark:text-orange-400">
                          {`${currentPrivateFriends.length} friend${currentPrivateFriends.length !== 1 ? 's' : ''} couldn't be included (private profile${currentPrivateFriends.length !== 1 ? 's' : ''}): ${currentPrivateFriends.map(id => friends.find(f => f.steamId === id)?.name || id).join(', ')}`}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Row 3: Cached info */}
            {lastCommonGamesUpdate && (
              <div className="text-xs">
                Cached • Last updated: {lastCommonGamesUpdate.toLocaleString()}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {commonGames.length > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search common games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {isLoadingCommon ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>Finding common games...</span>
              </div>
            </div>
          ) : commonGames.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Icon</TableHead>
                    <TableHead>App ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Play</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGames.map((game) => (
                    <TableRow key={game.appid}>
                      <TableCell>
                        <Image
                          src={getSteamIconUrl(game.appid, game.img_icon_url)}
                          alt={`${game.name} icon`}
                          width={32}
                          height={32}
                          className="rounded"
                          unoptimized
                        />
                      </TableCell>
                      <TableCell className="text-sm">{game.appid}</TableCell>
                      <TableCell className="font-medium">{game.name}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleLaunchGame(game.appid, game.name)}
                          size="sm"
                          variant="outline"
                        >
                          <Play className="h-4 w-4" />
                          Launch
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {friends.length === 0
                  ? "Add friends to find games you can play together"
                  : searchPerformed && commonGames.length === 0
                    ? "No common games found."
                    : `Click "Find Common Games" to see what you can play together`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 