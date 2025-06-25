'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, RefreshCw, UserPlus, Play, Users, Trash2, Clock, ListCheck, ListRestart } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
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
    loadSteamFriends,
    findCommonGames,
  } = useFriends();
  
  const [filteredGames, setFilteredGames] = useState<SteamGame[]>([]);
  const [searchTerm, setSearchTerm] = useLocalStorage('play-together-search', '', settings?.steamId);
  const [newFriendInput, setNewFriendInput] = useState('');
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
    toast.success(`Added ${selectedCount} friend(s) to Play Together list`);
  };

  // Handle finding common games
  const handleFindCommonGames = async () => {
    try {
      const result = await findCommonGames();
      
      if (result.gamesCount > 0) {
        toast.success(`Found ${result.gamesCount} games you can play together with ${result.publicFriendsCount} friend${result.publicFriendsCount !== 1 ? 's' : ''}!`);
      } else if (result.privateFriendsCount > 0 && result.publicFriendsCount === 0) {
        toast.warning(`All ${result.privateFriendsCount} friend${result.privateFriendsCount !== 1 ? 's have' : ' has'} private Steam profiles. Ask them to make their game details public to find common games.`);
      } else if (result.publicFriendsCount > 0) {
        toast.info(`No common games found with ${result.publicFriendsCount} friend${result.publicFriendsCount !== 1 ? 's' : ''}.`);
      } else {
        toast.info('No common games found.');
      }
      
      if (result.privateFriendsCount > 0 && result.publicFriendsCount > 0) {
        toast.info(`Note: ${result.privateFriendsCount} friend${result.privateFriendsCount !== 1 ? 's have' : ' has'} private profiles and couldn't be included.`, {
          duration: 5000
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to find common games';
      toast.error(errorMessage);
    }
  };

  // Handle removing a friend
  const handleRemoveFriend = (steamId: string) => {
    const friendToRemove = friends.find(f => f.steamId === steamId);
    removeFriend(steamId);
    toast.success(`${friendToRemove?.name || 'Friend'} removed`);
    
    // If we still have friends, refresh common games
    if (friends.length > 1) {
      const remainingFriends = friends.filter(f => f.steamId !== steamId);
      findCommonGames(remainingFriends).catch(error => {
        console.error('Error refreshing common games after friend removal:', error);
      });
    }
  };

  const handleLaunchGame = (appId: number, gameName: string) => {
    launchSteamGame(appId);
    toast.success(`Launching ${gameName}...`, {
      description: 'If Steam doesn&apos;t open, you may need to allow the browser to open Steam links.'
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
            Add friends by Steam ID or username to find games you can play together
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
                  <UserPlus className="h-4 w-4 mr-2" />
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
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ListRestart className="h-4 w-4 mr-2" />
            )}
            Load Friends from Steam
          </Button>
        </CardContent>
      </Card>

      {/* Steam Friends Selection */}
      {steamFriendsLoaded && availableSteamFriends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
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
                  {selectedSteamFriends.size === availableSteamFriends.length ? 'Unselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={handleAddSelectedFriends}
                  disabled={selectedSteamFriends.size === 0}
                  size="sm"
                >
                  Add Selected ({selectedSteamFriends.size})
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Select which friends you want to compare games with, then click &quot;Add Selected&quot;
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableSteamFriends.map((friend) => (
                <div 
                  key={friend.steamId} 
                  className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleSteamFriendToggle(friend.steamId)}
                >
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
                      className="rounded-full"
                      unoptimized
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{friend.name}</div>
                    <div className="text-sm text-muted-foreground">{friend.steamId}</div>
                  </div>
                </div>
              ))}
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
            <CardTitle className="flex items-center justify-between">
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
              <Button
                onClick={handleFindCommonGames}
                disabled={isLoadingCommon || friends.length === 0}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCommon ? 'animate-spin' : ''}`} />
                Find Common Games
              </Button>
            </CardTitle>
            <CardDescription>
              Click &quot;Find Common Games&quot; to discover what you can play together
              {lastFriendsUpdate && (
                <span className="ml-4 text-xs">
                  Cached • Last updated: {lastFriendsUpdate.toLocaleString()}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {sortedFriends.map((friend) => (
                <div key={friend.steamId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {friend.avatar && (
                      <Image 
                        src={friend.avatar} 
                        alt={`${friend.name} avatar`} 
                        width={32}
                        height={32}
                        className="rounded-full"
                        unoptimized
                      />
                    )}
                    <div>
                      <div className="font-medium">{friend.name}</div>
                      <div className="text-sm text-muted-foreground">{friend.steamId}</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveFriend(friend.steamId)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Common Games */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              <span>Games You Can Play Together</span>
              {lastCommonGamesUpdate && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                  <Clock className="h-3 w-3" />
                  {lastCommonGamesUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </CardTitle>
          <CardDescription>
            {commonGames.length > 0 && (
              <span>Found {commonGames.length} common games | Showing: {filteredGames.length}</span>
            )}
            {lastCommonGamesUpdate && (
              <span className="ml-4 text-xs">
                Cached • Last updated: {lastCommonGamesUpdate.toLocaleString()}
              </span>
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
                          <Play className="h-4 w-4 mr-2" />
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
                  : "Click &apos;Find Common Games&apos; to see what you can play together"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 