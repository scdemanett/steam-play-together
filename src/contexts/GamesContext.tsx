'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { SteamGame } from '@/lib/types';
import { SteamAPI } from '@/lib/steam-api';
import { useSettings } from './SettingsContext';

export type SortColumn = 'name' | 'appid' | 'playtime' | 'playtime_windows' | 'playtime_mac' | 'playtime_linux' | 'playtime_deck' | 'last_played';

interface TableViewState {
  currentPage: number;
  itemsPerPage: number;
  sortBy: SortColumn;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
}

interface CachedGamesData {
  games: SteamGame[];
  gameCount: number;
  timestamp: number;
  steamId: string;
  tableViewState: TableViewState;
}

interface GamesContextType {
  games: SteamGame[];
  gameCount: number;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  lastUpdated: Date | null;
  // Table view state
  currentPage: number;
  itemsPerPage: number;
  sortBy: SortColumn;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  // Functions
  loadLibrary: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  clearCache: () => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setSortBy: (column: SortColumn) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchTerm: (term: string) => void;
  resetTableView: () => void;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;
const CACHE_KEY = 'steam-library-cache';

// Default table view state
const DEFAULT_TABLE_VIEW: TableViewState = {
  currentPage: 1,
  itemsPerPage: 25,
  sortBy: 'name',
  sortOrder: 'asc',
  searchTerm: '',
};

export function GamesProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [games, setGames] = useState<SteamGame[]>([]);
  const [gameCount, setGameCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cacheChecked, setCacheChecked] = useState(false);
  
  // Table view state
  const [currentPage, setCurrentPageState] = useState(DEFAULT_TABLE_VIEW.currentPage);
  const [itemsPerPage, setItemsPerPageState] = useState(DEFAULT_TABLE_VIEW.itemsPerPage);
  const [sortBy, setSortByState] = useState<SortColumn>(DEFAULT_TABLE_VIEW.sortBy);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(DEFAULT_TABLE_VIEW.sortOrder);
  const [searchTerm, setSearchTermState] = useState(DEFAULT_TABLE_VIEW.searchTerm);

  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        setCacheChecked(true);
        return;
      }

      const cachedData: CachedGamesData = JSON.parse(cached);
      
      // Check if cache is valid (not expired)
      const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
      
      // Check if different user (only if settings are available)
      const isDifferentUser = settings?.steamId && cachedData.steamId !== settings.steamId;
      
      if (!isExpired && !isDifferentUser) {
        setGames(cachedData.games);
        setGameCount(cachedData.gameCount);
        setLastUpdated(new Date(cachedData.timestamp));
        setIsLoaded(true);
        setError(null);
        
        // Load table view state (with fallbacks for backward compatibility)
        const tableState = cachedData.tableViewState || DEFAULT_TABLE_VIEW;
        setCurrentPageState(tableState.currentPage);
        setItemsPerPageState(tableState.itemsPerPage);
        setSortByState(tableState.sortBy);
        setSortOrderState(tableState.sortOrder);
        setSearchTermState(tableState.searchTerm);
      } else {
        // Clear expired or invalid cache
        localStorage.removeItem(CACHE_KEY);
        setIsLoaded(false);
        setGames([]);
        setGameCount(0);
        setLastUpdated(null);
      }
    } catch (error) {
      console.error('Failed to load games from cache:', error);
      localStorage.removeItem(CACHE_KEY);
    } finally {
      setCacheChecked(true);
    }
  }, [settings?.steamId]);

  const saveToCache = useCallback((gamesData: SteamGame[], count: number) => {
    if (!settings?.steamId) return;

    try {
      const cacheData: CachedGamesData = {
        games: gamesData,
        gameCount: count,
        timestamp: Date.now(),
        steamId: settings.steamId,
        tableViewState: {
          currentPage,
          itemsPerPage,
          sortBy,
          sortOrder,
          searchTerm,
        },
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save games to cache:', error);
    }
  }, [settings?.steamId, currentPage, itemsPerPage, sortBy, sortOrder, searchTerm]);

  const loadLibrary = useCallback(async () => {
    if (!settings?.steamApiKey || !settings?.steamId) {
      setError('Steam API key and Steam ID are required');
      return;
    }

    // If we have fresh cached data, don't reload
    if (isLoaded && lastUpdated) {
      const cacheAge = Date.now() - lastUpdated.getTime();
      if (cacheAge < CACHE_DURATION) {
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await SteamAPI.getOwnedGames(settings.steamId, settings.steamApiKey);
      
      if (response?.response?.games) {
        const fetchedGames = response.response.games;
        const fetchedCount = response.response.game_count;
        
        setGames(fetchedGames);
        setGameCount(fetchedCount);
        setLastUpdated(new Date());
        setIsLoaded(true);
        
        // Save to cache
        saveToCache(fetchedGames, fetchedCount);
      } else {
        throw new Error('Failed to load games from Steam API');
      }
    } catch (error: unknown) {
      console.error('Error loading Steam library:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load your Steam library';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [settings?.steamApiKey, settings?.steamId, isLoaded, lastUpdated, saveToCache]);

  // Load cached data on mount and when settings change
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  // Auto-load library when settings are available, cache has been checked, and no cached data
  useEffect(() => {
    if (settings?.steamApiKey && settings?.steamId && cacheChecked && !isLoaded && !isLoading) {
      loadLibrary();
    }
  }, [settings?.steamApiKey, settings?.steamId, cacheChecked, isLoaded, isLoading, loadLibrary]);

  // Auto-save table view state when it changes (debounced)
  useEffect(() => {
    if (!isLoaded || !settings?.steamId) return;

    const timeoutId = setTimeout(() => {
      // Only save if we have games data to avoid corrupting cache
      if (games.length > 0) {
        saveToCache(games, gameCount);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchTerm, games, gameCount, isLoaded, settings?.steamId, saveToCache]);

  const refreshLibrary = async () => {
    setIsLoaded(false); // Force refresh even if cache is valid
    await loadLibrary();
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setGames([]);
    setGameCount(0);
    setIsLoaded(false);
    setLastUpdated(null);
    setError(null);
    setCacheChecked(false);
    resetTableView();
  };

  // Table view setter functions with auto-save
  const setCurrentPage = (page: number) => {
    setCurrentPageState(page);
    // Auto-save will happen through useEffect or next cache save
  };

  const setItemsPerPage = (items: number) => {
    setItemsPerPageState(items);
    setCurrentPageState(1); // Reset to first page when items per page changes
  };

  const setSortBy = (column: SortColumn) => {
    setSortByState(column);
    setCurrentPageState(1); // Reset to first page when sorting changes
  };

  const setSortOrder = (order: 'asc' | 'desc') => {
    setSortOrderState(order);
    setCurrentPageState(1); // Reset to first page when sorting changes
  };

  const setSearchTerm = (term: string) => {
    setSearchTermState(term);
    setCurrentPageState(1); // Reset to first page when search changes
  };

  const resetTableView = () => {
    setCurrentPageState(DEFAULT_TABLE_VIEW.currentPage);
    setItemsPerPageState(DEFAULT_TABLE_VIEW.itemsPerPage);
    setSortByState(DEFAULT_TABLE_VIEW.sortBy);
    setSortOrderState(DEFAULT_TABLE_VIEW.sortOrder);
    setSearchTermState(DEFAULT_TABLE_VIEW.searchTerm);
  };

  return (
    <GamesContext.Provider
      value={{
        games,
        gameCount,
        isLoading,
        isLoaded,
        error,
        lastUpdated,
        // Table view state
        currentPage,
        itemsPerPage,
        sortBy,
        sortOrder,
        searchTerm,
        // Functions
        loadLibrary,
        refreshLibrary,
        clearCache,
        setCurrentPage,
        setItemsPerPage,
        setSortBy,
        setSortOrder,
        setSearchTerm,
        resetTableView,
      }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GamesProvider');
  }
  return context;
} 