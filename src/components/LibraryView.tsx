'use client';

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGames, SortColumn } from '@/contexts/GamesContext';
import { useSettings } from '@/contexts/SettingsContext';
import { formatPlaytime, formatLastPlayed, getSteamIconUrl } from '@/lib/steam-api';
import { SteamGame } from '@/lib/types';
import { toast } from 'sonner';

export function LibraryView() {
  const { settings } = useSettings();
  const { 
    games, 
    gameCount, 
    isLoading, 
    isLoaded, 
    error, 
    lastUpdated, 
    refreshLibrary,
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
          aValue = a.playtime_windows_forever;
          bValue = b.playtime_windows_forever;
          break;
        case 'playtime_mac':
          aValue = a.playtime_mac_forever;
          bValue = b.playtime_mac_forever;
          break;
        case 'playtime_linux':
          aValue = a.playtime_linux_forever;
          bValue = b.playtime_linux_forever;
          break;
        case 'playtime_deck':
          aValue = a.playtime_deck_forever;
          bValue = b.playtime_deck_forever;
          break;
        case 'last_played':
          aValue = a.rtime_last_played || 0;
          bValue = b.rtime_last_played || 0;
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
        toast.success(`Loaded ${gameCount} games from your library`);
      }
    }
    if (error) {
      toast.error(error);
    }
  }, [isLoaded, gameCount, error, lastUpdated]);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="space-y-2">
            {/* Desktop layout - title with timestamp and buttons on same row */}
            <div className="hidden lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <span>Steam Games Library</span>
                {lastUpdated && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                    <Clock className="h-3 w-3" />
                    {new Date(lastUpdated).toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={resetTableView}
                  variant="outline"
                  size="sm"
                >
                  Reset View
                </Button>
                <Button
                  onClick={refreshLibrary}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Mobile layout - title, timestamp, then buttons in separate rows */}
            <div className="lg:hidden space-y-2">
              {/* Row 1: Title */}
              <div>
                <span>Steam Games Library</span>
              </div>
              
              {/* Row 2: Timestamp */}
              {lastUpdated && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground font-normal">
                  <Clock className="h-3 w-3" />
                  {new Date(lastUpdated).toLocaleTimeString()}
                </div>
              )}
              
              {/* Row 3: Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={resetTableView}
                  variant="outline"
                  size="sm"
                >
                  Reset View
                </Button>
                <Button
                  onClick={refreshLibrary}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
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
            
            {/* Cached data line */}
            {lastUpdated && (
              <div className="text-xs text-muted-foreground">
                Cached data • Last updated: {lastUpdated.toLocaleString()}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
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
                <span>Loading your library...</span>
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
                          <SelectTrigger className="w-20 h-8">
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
                      >
                        App ID {getSortIcon('appid')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('name')}
                      >
                        Name {getSortIcon('name')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('playtime')}
                      >
                        Total Playtime {getSortIcon('playtime')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('playtime_windows')}
                      >
                        Windows {getSortIcon('playtime_windows')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('playtime_mac')}
                      >
                        Mac {getSortIcon('playtime_mac')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('playtime_linux')}
                      >
                        Linux {getSortIcon('playtime_linux')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('playtime_deck')}
                      >
                        Steam Deck {getSortIcon('playtime_deck')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort('last_played')}
                      >
                        Last Played {getSortIcon('last_played')}
                      </TableHead>
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
                        <TableCell>{formatPlaytime(game.playtime_windows_forever)}</TableCell>
                        <TableCell>{formatPlaytime(game.playtime_mac_forever)}</TableCell>
                        <TableCell>{formatPlaytime(game.playtime_linux_forever)}</TableCell>
                        <TableCell>{formatPlaytime(game.playtime_deck_forever)}</TableCell>
                        <TableCell>{formatLastPlayed(game.rtime_last_played)}</TableCell>
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
                          <SelectTrigger className="w-20 h-8">
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
              <p className="text-muted-foreground">
                {!settings?.steamApiKey || !settings?.steamId
                  ? "Please configure your Steam API key and Steam ID in settings"
                  : isLoading
                  ? "Loading your Steam library..."
                  : error
                  ? `Error: ${error}. Click 'Refresh' to try again.`
                  : "Your library will load automatically when your settings are configured"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 