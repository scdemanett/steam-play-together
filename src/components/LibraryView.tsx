'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Clock, ChevronLeft, ChevronRight, Users, ListRestart, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useGames } from '@/contexts/GamesContext';
import { SortColumn } from '@/lib/types';
import { useSettings } from '@/contexts/SettingsContext';
import { useFriends } from '@/contexts/FriendsContext';
import { formatPlaytime, formatLastPlayed, getSteamIconUrl } from '@/lib/steam-api';
import { SteamAPI } from '@/lib/steam-api';
import { SteamGame } from '@/lib/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function LibraryView() {
  const { settings } = useSettings();
  const { 
    games, 
    gameCount, 
    isLoading, 
    isLoaded, 
    error, 
    lastUpdated, 
    viewingUser,
    profileVisibility,
    refreshLibrary,
    loadUserLibrary,
    resetToOwnLibrary,
    clearProfileVisibility,
    // Table view state from context
    currentPage,
    itemsPerPage,
    sortBy,
    sortOrder,
    searchTerm,
    // Table view functions from context
    setCurrentPage,
    setItemsPerPage,
    setSortBy,
    setSortOrder,
    setSearchTerm,
    resetTableView,
  } = useGames();

  const {
    steamFriends,
    publicFriends,
    privateFriends,
    isLoadingSteamFriends,
    steamFriendsLoaded,
    lastSteamFriendsUpdate,
    loadSteamFriends,
    updateProfileVisibility,
  } = useFriends();

  // Local state for user selection
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [newUserInput, setNewUserInput] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  
  // Track processed profile visibility updates to prevent infinite loops
  const processedVisibilityRef = useRef<Set<string>>(new Set());

  // Filter Steam friends to exclude current user
  const availableSteamFriends = steamFriends
    .filter(steamFriend => steamFriend.steamId !== settings?.steamId)
    .sort((a, b) => a.name.localeCompare(b.name));

  // Memoized filtered and sorted games
  const filteredAndSortedGames = useMemo(() => {
    const filtered = games.filter((game) =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.appid.toString().includes(searchTerm)
    );

    // Sort games
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'appid':
          aValue = a.appid;
          bValue = b.appid;
          break;
        case 'playtime':
          aValue = a.playtime_forever;
          bValue = b.playtime_forever;
          break;
        case 'playtime_windows':
          aValue = a.playtime_windows_forever ?? 0;
          bValue = b.playtime_windows_forever ?? 0;
          break;
        case 'playtime_mac':
          aValue = a.playtime_mac_forever ?? 0;
          bValue = b.playtime_mac_forever ?? 0;
          break;
        case 'playtime_linux':
          aValue = a.playtime_linux_forever ?? 0;
          bValue = b.playtime_linux_forever ?? 0;
          break;
        case 'playtime_deck':
          aValue = a.playtime_deck_forever ?? 0;
          bValue = b.playtime_deck_forever ?? 0;
          break;
        case 'last_played':
          aValue = a.rtime_last_played ?? 0;
          bValue = b.rtime_last_played ?? 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [games, searchTerm, sortBy, sortOrder]);

  // Memoized pagination calculations
  const paginationData = useMemo(() => {
    const totalItems = filteredAndSortedGames.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageGames = filteredAndSortedGames.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      currentPageGames,
      startIndex,
      endIndex: Math.min(endIndex, totalItems)
    };
  }, [filteredAndSortedGames, currentPage, itemsPerPage]);

  // Handle successful load with toast notification
  useEffect(() => {
    if (isLoaded && gameCount > 0 && !error) {
      // Only show toast on fresh loads, not cached loads
      if (lastUpdated && Date.now() - lastUpdated.getTime() < 10000) {
        const userDisplay = viewingUser?.isOwnLibrary ? 'your library' : `${viewingUser?.name || 'user'}'s library`;
        toast.success(`Loaded ${gameCount} games from ${userDisplay}`);
      }
    }
    if (error) {
      toast.error(error);
    }
  }, [isLoaded, gameCount, error, lastUpdated, viewingUser]);

  // Update profile visibility when detected from library loading
  useEffect(() => {
    if (profileVisibility) {
      const updateKey = `${profileVisibility.steamId}-${profileVisibility.isPublic}`;
      
      // Check if we've already processed this update
      if (!processedVisibilityRef.current.has(updateKey)) {
        // Process the profile visibility update
        updateProfileVisibility(profileVisibility.steamId, profileVisibility.isPublic);
        
        // Mark as processed
        processedVisibilityRef.current.add(updateKey);
        
        // Clear the state to prevent reprocessing
        clearProfileVisibility();
        
        // Clean up old entries (keep only last 10 to prevent memory leaks)
        if (processedVisibilityRef.current.size > 10) {
          const entries = Array.from(processedVisibilityRef.current);
          processedVisibilityRef.current = new Set(entries.slice(-5));
        }
      } else {
        // Already processed, just clear the state
        clearProfileVisibility();
      }
    }
  }, [profileVisibility, updateProfileVisibility, clearProfileVisibility]);

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
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

  // Handle viewing a friend's library
  const handleViewFriendLibrary = async (friendSteamId: string, friendName: string) => {
    setIsLoadingUser(true);
    try {
      await loadUserLibrary(friendSteamId, friendName);
      setShowUserSelection(false);
      toast.success(`Now viewing ${friendName}'s library`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to load ${friendName}'s library`;
      toast.error(errorMessage);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Handle viewing a user's library by ID/username
  const handleViewUserLibrary = async () => {
    if (!newUserInput.trim()) return;

    setIsLoadingUser(true);
    try {
      if (!settings?.steamApiKey) {
        throw new Error('Steam API key is required');
      }

      let resolvedSteamId = newUserInput.trim();
      let userName = newUserInput.trim();

      // If input looks like a username, resolve it to Steam ID
      if (!/^\d+$/.test(newUserInput.trim())) {
        const resolvedId = await SteamAPI.resolveSteamId(newUserInput.trim(), settings.steamApiKey);
        if (!resolvedId) {
          throw new Error('Could not find Steam ID for this username');
        }
        resolvedSteamId = resolvedId;
      }

      // Always fetch player summary to get name
      const playerInfo = await SteamAPI.getPlayerSummaries([resolvedSteamId], settings.steamApiKey);
      const playerSummary = playerInfo[0];
      
      if (playerSummary?.personaname) {
        userName = playerSummary.personaname;
      }

      await loadUserLibrary(resolvedSteamId, userName);
      setNewUserInput('');
      setShowUserSelection(false);
      toast.success(`Now viewing ${userName}'s library`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load user library';
      toast.error(errorMessage);
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Handle returning to own library
  const handleReturnToOwnLibrary = async () => {
    try {
      await resetToOwnLibrary();
      toast.success('Returned to your library');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load your library';
      toast.error(errorMessage);
    }
  };

  // Check if we have detailed playtime data (own library vs other user's library)
  const hasDetailedData = viewingUser?.isOwnLibrary ?? true;

  return (
    <div className="space-y-6">
      {/* User Selection Section - Only show when enabled */}
      {showUserSelection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              View Another User&apos;s Library
            </CardTitle>
            <CardDescription>
              Enter a Steam ID or username or load your Steam friends to view their games library
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Steam ID or username..."
                value={newUserInput}
                onChange={(e) => setNewUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleViewUserLibrary()}
                className="flex-1"
              />
              <Button 
                onClick={handleViewUserLibrary}
                disabled={isLoadingUser || !newUserInput.trim()}
              >
                {isLoadingUser ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    View
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

            {/* Steam Friends List */}
            {(steamFriendsLoaded && availableSteamFriends.length > 0) && (
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Steam Friends ({availableSteamFriends.length})
                  {lastSteamFriendsUpdate && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      Updated: {lastSteamFriendsUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableSteamFriends.map((friend) => {
                    const isPublic = publicFriends.includes(friend.steamId);
                    const isPrivate = privateFriends.includes(friend.steamId);
                    const hasProfileData = isPublic || isPrivate;
                    
                    return (
                      <div 
                        key={friend.steamId} 
                        className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${isPrivate ? 'opacity-75' : ''} ${isLoadingUser ? 'pointer-events-none' : ''}`}
                        onClick={() => !isLoadingUser && handleViewFriendLibrary(friend.steamId, friend.name)}
                      >
                        <div className="flex items-center justify-between">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewFriendLibrary(friend.steamId, friend.name);
                            }}
                            disabled={isLoadingUser}
                            size="sm"
                          >
                            {isLoadingUser ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => setShowUserSelection(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Library Card */}
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="space-y-2">
            {/* Desktop layout - title with timestamp and buttons on same row */}
            <div className="hidden lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <span>
                  {viewingUser?.isOwnLibrary 
                    ? 'Steam Games Library' 
                    : viewingUser?.name 
                      ? `${viewingUser.name}'s Steam Games Library`
                      : 'Steam Games Library'
                  }
                </span>
                {lastUpdated && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {new Date(lastUpdated).toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                {!viewingUser?.isOwnLibrary && (
                  <Button
                    onClick={handleReturnToOwnLibrary}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Your Library
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowUserSelection(true)}
                  variant="outline"
                  size="sm"
                >
                  <Users className="h-4 w-4" />
                  Other Library
                </Button>
                
                <Button
                  onClick={resetTableView}
                  variant="outline"
                  size="sm"
                >
                  <ListRestart className="h-4 w-4" />
                  Reset View
                </Button>
                <Button
                  onClick={refreshLibrary}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Mobile layout - title, timestamp, then buttons in separate rows */}
            <div className="lg:hidden space-y-2">
              {/* Row 1: Title */}
              <div>
                <span>
                  {viewingUser?.isOwnLibrary 
                    ? 'Steam Games Library' 
                    : viewingUser?.name 
                      ? `${viewingUser.name}'s Steam Games Library`
                      : 'Steam Games Library'
                  }
                </span>
              </div>
              
              {/* Row 2: Timestamp */}
              {lastUpdated && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                  <Clock className="h-3 w-3" />
                  {new Date(lastUpdated).toLocaleTimeString()}
                </div>
              )}
              
              {/* Row 3: Buttons */}
              <div className="flex gap-2 flex-wrap">
                {!viewingUser?.isOwnLibrary && (
                  <Button
                    onClick={handleReturnToOwnLibrary}
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Your Library
                  </Button>
                )}
                
                <Button
                  onClick={() => setShowUserSelection(true)}
                  variant="outline"
                  size="sm"
                >
                  <Users className="h-4 w-4" />
                  Other Library
                </Button>
                
                <Button
                  onClick={resetTableView}
                  variant="outline"
                  size="sm"
                >
                  <ListRestart className="h-4 w-4" />
                  Reset View
                </Button>
                <Button
                  onClick={refreshLibrary}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardTitle>
          
          {/* Stats and cached data */}
          <CardDescription className="space-y-1">
            {/* Total, filtered, showing line */}
            {gameCount > 0 && (
              <div className="text-sm text-muted-foreground">
                Total: {gameCount} | Filtered: {paginationData.totalItems} | Showing: {paginationData.currentPageGames.length}
              </div>
            )}
            
            {/* Limited data warning for other users */}
            {!hasDetailedData && gameCount > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-400">
                ⚠️ Viewing another user&apos;s library - only basic game info and total playtime are available
              </div>
            )}
            
            {/* Cached data line */}
            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Cached data • Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Error banner when viewing cached data */}
          {error && games.length > 0 && (
            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-orange-600 dark:text-orange-400">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Refresh failed - showing cached data
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    {error}
                  </p>
                  {lastUpdated && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Data from: {lastUpdated.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by game name or App ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span>Loading library...</span>
              </div>
            </div>
          ) : games.length > 0 ? (
            <>
              {/* Pagination Controls - Top */}
              {paginationData.totalPages > 1 && (
                <div className="mb-4">
                  {/* Responsive pagination layout */}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Showing X to Y of Z games */}
                    <div className="text-sm text-muted-foreground">
                      Showing {paginationData.startIndex + 1} to {paginationData.endIndex} of {paginationData.totalItems} games
                    </div>
                    
                    {/* Items per page and pagination controls */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                      {/* Items per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Items per page:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                          }}
                        >
                          <SelectTrigger className="w-20 h-8" aria-label="Select number of items per page">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          aria-label="Go to previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                            let pageNum;
                            if (paginationData.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= paginationData.totalPages - 2) {
                              pageNum = paginationData.totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                          disabled={currentPage === paginationData.totalPages}
                          aria-label="Go to next page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Icon</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('appid')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSort('appid')}
                        aria-label="Sort by App ID"
                      >
                        App ID {getSortIcon('appid')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSort('name')}
                        aria-label="Sort by game name"
                      >
                        Name {getSortIcon('name')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('playtime')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleSort('playtime')}
                        aria-label="Sort by total playtime"
                      >
                        Total Playtime {getSortIcon('playtime')}
                      </TableHead>
                      {hasDetailedData && (
                        <>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('playtime_windows')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleSort('playtime_windows')}
                            aria-label="Sort by Windows playtime"
                          >
                            Windows {getSortIcon('playtime_windows')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('playtime_mac')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleSort('playtime_mac')}
                            aria-label="Sort by Mac playtime"
                          >
                            Mac {getSortIcon('playtime_mac')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('playtime_linux')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleSort('playtime_linux')}
                            aria-label="Sort by Linux playtime"
                          >
                            Linux {getSortIcon('playtime_linux')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('playtime_deck')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleSort('playtime_deck')}
                            aria-label="Sort by Steam Deck playtime"
                          >
                            Steam Deck {getSortIcon('playtime_deck')}
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleSort('last_played')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleSort('last_played')}
                            aria-label="Sort by last played date"
                          >
                            Last Played {getSortIcon('last_played')}
                          </TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginationData.currentPageGames.map((game: SteamGame) => (
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
                        <TableCell>{formatPlaytime(game.playtime_forever)}</TableCell>
                        {hasDetailedData && (
                          <>
                            <TableCell>{formatPlaytime(game.playtime_windows_forever)}</TableCell>
                            <TableCell>{formatPlaytime(game.playtime_mac_forever)}</TableCell>
                            <TableCell>{formatPlaytime(game.playtime_linux_forever)}</TableCell>
                            <TableCell>{formatPlaytime(game.playtime_deck_forever)}</TableCell>
                            <TableCell>{formatLastPlayed(game.rtime_last_played)}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls - Bottom */}
              {paginationData.totalPages > 1 && (
                <div className="mt-4">
                  {/* Responsive pagination layout */}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Showing X to Y of Z games */}
                    <div className="text-sm text-muted-foreground">
                      Showing {paginationData.startIndex + 1} to {paginationData.endIndex} of {paginationData.totalItems} games
                    </div>
                    
                    {/* Items per page and pagination controls */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                      {/* Items per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Items per page:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                          }}
                        >
                          <SelectTrigger className="w-20 h-8" aria-label="Select number of items per page">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Pagination */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          aria-label="Go to previous page"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                            let pageNum;
                            if (paginationData.totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= paginationData.totalPages - 2) {
                              pageNum = paginationData.totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-8 h-8 p-0"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(paginationData.totalPages, currentPage + 1))}
                          disabled={currentPage === paginationData.totalPages}
                          aria-label="Go to next page"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="space-y-4">
                {error && error.includes('private') ? (
                  <>
                    <div className="text-6xl">🔒</div>
                    <div>
                      <p className="text-lg font-medium text-muted-foreground mb-2">
                        Private Profile
                      </p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {error}
                      </p>
                      {!viewingUser?.isOwnLibrary && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Ask them to make their game details public to view their library.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    {!settings?.steamApiKey || !settings?.steamId
                      ? "Please configure your Steam API key and Steam ID in settings"
                      : isLoading
                      ? "Loading Steam library..."
                      : error
                      ? `Error: ${error}. Click 'Refresh' to try again.`
                      : viewingUser?.isOwnLibrary
                      ? "Your library will load automatically when your settings are configured"
                      : `${viewingUser?.name || 'User'}'s library is empty or private`}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 