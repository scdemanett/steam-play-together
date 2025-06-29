'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  SteamGame, 
  SortColumn, 
  TableViewState, 
  CachedGamesData, 
  ViewingUser, 
  GamesContextType 
} from '@/lib/types';
import { SteamAPI } from '@/lib/steam-api';
import { useSettings } from '@/contexts/SettingsContext';

const GamesContext = createContext<GamesContextType | undefined>(undefined);

// Cache duration: 1 hour
const CACHE_DURATION = 60 * 60 * 1000;
const CACHE_KEY_PREFIX = 'steam-library-cache';

// Function to get cache key for a specific user
const getCacheKey = (steamId: string) => `${CACHE_KEY_PREFIX}-${steamId}`;

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
  const [viewingUser, setViewingUser] = useState<ViewingUser | null>(null);
  const [profileVisibility, setProfileVisibility] = useState<{ steamId: string; isPublic: boolean } | null>(null);
  
  // Table view state
  const [currentPage, setCurrentPageState] = useState(DEFAULT_TABLE_VIEW.currentPage);
  const [itemsPerPage, setItemsPerPageState] = useState(DEFAULT_TABLE_VIEW.itemsPerPage);
  const [sortBy, setSortByState] = useState<SortColumn>(DEFAULT_TABLE_VIEW.sortBy);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(DEFAULT_TABLE_VIEW.sortOrder);
  const [searchTerm, setSearchTermState] = useState(DEFAULT_TABLE_VIEW.searchTerm);

  const loadFromCache = useCallback((targetSteamId?: string) => {
    try {
      const steamId = targetSteamId || settings?.steamId;
      if (!steamId) {
        setCacheChecked(true);
        return;
      }

      const cacheKey = getCacheKey(steamId);
      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        setCacheChecked(true);
        return;
      }

      const cachedData: CachedGamesData = JSON.parse(cached);
      
      // Check if cache is valid (not expired)
      const isExpired = Date.now() - cachedData.timestamp > CACHE_DURATION;
      
      if (!isExpired) {
        setGames(cachedData.games);
        setGameCount(cachedData.gameCount);
        setLastUpdated(new Date(cachedData.timestamp));
        setIsLoaded(true);
        setError(null);
        
        // Set viewing user info
        const isOwnLibrary = steamId === settings?.steamId;
        setViewingUser({
          steamId: cachedData.steamId,
          name: cachedData.userName || (isOwnLibrary ? 'Steam Games Library' : `User ${cachedData.steamId}`),
          isOwnLibrary
        });
        
        // Load table view state (with fallbacks for backward compatibility)
        const tableState = cachedData.tableViewState || DEFAULT_TABLE_VIEW;
        setCurrentPageState(tableState.currentPage);
        setItemsPerPageState(tableState.itemsPerPage);
        setSortByState(tableState.sortBy);
        setSortOrderState(tableState.sortOrder);
        setSearchTermState(tableState.searchTerm);
      } else {
        // Clear expired cache
        localStorage.removeItem(cacheKey);
        setIsLoaded(false);
        setGames([]);
        setGameCount(0);
        setLastUpdated(null);
        setViewingUser(null);
      }
    } catch (error) {
      console.error('Failed to load games from cache:', error);
      const steamId = targetSteamId || settings?.steamId;
      if (steamId) {
        localStorage.removeItem(getCacheKey(steamId));
      }
    } finally {
      setCacheChecked(true);
    }
  }, [settings?.steamId]);

  const saveToCache = useCallback((gamesData: SteamGame[], count: number, targetSteamId?: string, userName?: string) => {
    const steamId = targetSteamId || settings?.steamId;
    if (!steamId) return;

    try {
      const cacheData: CachedGamesData = {
        games: gamesData,
        gameCount: count,
        timestamp: Date.now(),
        steamId,
        userName,
        tableViewState: {
          currentPage,
          itemsPerPage,
          sortBy,
          sortOrder,
          searchTerm,
        },
      };
      localStorage.setItem(getCacheKey(steamId), JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save games to cache:', error);
    }
  }, [settings?.steamId, currentPage, itemsPerPage, sortBy, sortOrder, searchTerm]);

  const loadLibraryForUser = useCallback(async (targetSteamId: string, userName?: string, forceRefresh = false) => {
    if (!settings?.steamApiKey) {
      setError('Steam API key is required');
      return;
    }

    // Check if we have fresh cached data for this user, unless forcing refresh
    if (!forceRefresh) {
      const cacheKey = getCacheKey(targetSteamId);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedData: CachedGamesData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          if (cacheAge < CACHE_DURATION && cachedData.steamId === targetSteamId) {
            // Load from cache and update UI
            loadFromCache(targetSteamId);
            return;
          }
        } catch (error) {
          console.error('Failed to parse cached data:', error);
          localStorage.removeItem(cacheKey);
        }
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await SteamAPI.getOwnedGames(targetSteamId, settings.steamApiKey);
      
      // Check if response indicates a private profile
      if (!response?.response || Object.keys(response.response).length === 0) {
        // Private profile - set appropriate state
        setGames([]);
        setGameCount(0);
        setLastUpdated(new Date());
        setIsLoaded(true);
        
        // Set viewing user info with private profile indicator
        const isOwnLibrary = targetSteamId === settings?.steamId;
        const displayName = userName || (isOwnLibrary ? 'Steam Games Library' : `User ${targetSteamId}`);
        setViewingUser({
          steamId: targetSteamId,
          name: displayName,
          isOwnLibrary
        });
        
        // Set profile visibility info for LibraryView to handle
        if (!isOwnLibrary) {
          setProfileVisibility({ steamId: targetSteamId, isPublic: false });
        }
        
        // Don't save empty private profile data to cache
        const privateProfileMessage = isOwnLibrary 
          ? 'Your profile appears to be private or there was an issue loading your games'
          : `${displayName}'s profile is private - no games visible`;
        setError(privateProfileMessage);
        return;
      }
      
      if (response?.response?.games) {
        const fetchedGames = response.response.games;
        const fetchedCount = response.response.game_count;
        
        setGames(fetchedGames);
        setGameCount(fetchedCount);
        setLastUpdated(new Date());
        setIsLoaded(true);
        setError(null); // Clear any previous errors
        
        // Set viewing user info
        const isOwnLibrary = targetSteamId === settings?.steamId;
        const displayName = userName || (isOwnLibrary ? 'Steam Games Library' : `User ${targetSteamId}`);
        setViewingUser({
          steamId: targetSteamId,
          name: displayName,
          isOwnLibrary
        });
        
        // Set profile visibility info for LibraryView to handle
        if (!isOwnLibrary) {
          setProfileVisibility({ steamId: targetSteamId, isPublic: true });
        }
        
        // Save to cache
        saveToCache(fetchedGames, fetchedCount, targetSteamId, displayName);
      } else {
        throw new Error('Failed to load games from Steam API');
      }
    } catch (error: unknown) {
      console.error('Error loading Steam library:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load Steam library';
      setError(errorMessage);
      
      // Still set viewing user info even on error to maintain context
      const isOwnLibrary = targetSteamId === settings?.steamId;
      const displayName = userName || (isOwnLibrary ? 'Steam Games Library' : `User ${targetSteamId}`);
      
      setViewingUser({
        steamId: targetSteamId,
        name: displayName,
        isOwnLibrary
      });
      
      // Try to load cached data if available, otherwise clear games data
      const cacheKey = getCacheKey(targetSteamId);
      const cached = localStorage.getItem(cacheKey);
      let loadedFromCache = false;
      
      if (cached) {
        try {
          const cachedData: CachedGamesData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          
          // Load cached data even if slightly expired (better than empty)
          if (cacheAge < CACHE_DURATION * 2 && cachedData.steamId === targetSteamId) {
            setGames(cachedData.games);
            setGameCount(cachedData.gameCount);
            setLastUpdated(new Date(cachedData.timestamp));
            loadedFromCache = true;
            
            // Load table view state too
            const tableState = cachedData.tableViewState || DEFAULT_TABLE_VIEW;
            setCurrentPageState(tableState.currentPage);
            setItemsPerPageState(tableState.itemsPerPage);
            setSortByState(tableState.sortBy);
            setSortOrderState(tableState.sortOrder);
            setSearchTermState(tableState.searchTerm);
          }
        } catch (cacheError) {
          console.error('Failed to load cached data on error:', cacheError);
        }
      }
      
      // If no cached data available, clear games data
      if (!loadedFromCache) {
        setGames([]);
        setGameCount(0);
        setLastUpdated(null);
      }
      
      // Keep isLoaded as true for other users' libraries to prevent auto-loading own library
      setIsLoaded(!isOwnLibrary);
    } finally {
      setIsLoading(false);
    }
  }, [settings?.steamApiKey, settings?.steamId, saveToCache, loadFromCache]);

  const loadLibrary = useCallback(async () => {
    if (!settings?.steamId) {
      setError('Steam ID is required');
      return;
    }
    
    await loadLibraryForUser(settings.steamId, 'Steam Games Library');
  }, [settings?.steamId, loadLibraryForUser]);

  const loadUserLibrary = useCallback(async (steamId: string, userName?: string) => {
    // Reset table view when switching users
    setCurrentPageState(DEFAULT_TABLE_VIEW.currentPage);
    setItemsPerPageState(DEFAULT_TABLE_VIEW.itemsPerPage);
    setSortByState(DEFAULT_TABLE_VIEW.sortBy);
    setSortOrderState(DEFAULT_TABLE_VIEW.sortOrder);
    setSearchTermState(DEFAULT_TABLE_VIEW.searchTerm);
    
    // Check if we have valid cached data for this user first
    const cacheKey = getCacheKey(steamId);
    const cached = localStorage.getItem(cacheKey);
    let hasValidCache = false;
    
    if (cached) {
      try {
        const cachedData: CachedGamesData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;
        hasValidCache = cacheAge < CACHE_DURATION && cachedData.steamId === steamId;
      } catch (error) {
        console.error('Failed to parse cached data:', error);
        localStorage.removeItem(cacheKey);
      }
    }
    
    // Only force refresh if we don't have valid cached data
    const shouldForceRefresh = !hasValidCache;
    await loadLibraryForUser(steamId, userName, shouldForceRefresh);
  }, [loadLibraryForUser]);

  const resetToOwnLibrary = useCallback(async () => {
    if (!settings?.steamId) {
      setError('Steam ID is required');
      return;
    }
    
    // Reset table view when switching back to own library
    setCurrentPageState(DEFAULT_TABLE_VIEW.currentPage);
    setItemsPerPageState(DEFAULT_TABLE_VIEW.itemsPerPage);
    setSortByState(DEFAULT_TABLE_VIEW.sortBy);
    setSortOrderState(DEFAULT_TABLE_VIEW.sortOrder);
    setSearchTermState(DEFAULT_TABLE_VIEW.searchTerm);
    
    // Check if we're already viewing own library
    if (viewingUser?.isOwnLibrary) {
      return; // Already viewing own library, no need to reload
    }
    
    // Use cache when returning to own library (don't force refresh)
    await loadLibraryForUser(settings.steamId, 'Steam Games Library', false);
  }, [settings?.steamId, loadLibraryForUser, viewingUser?.isOwnLibrary]);

  // Load cached data on mount and when settings change
  useEffect(() => {
    loadFromCache();
  }, [loadFromCache]);

  // Auto-load own library when settings are available, cache has been checked, and no cached data
  // BUT don't auto-load if we're currently viewing another user's library (even with errors)
  useEffect(() => {
    const shouldAutoLoad = settings?.steamApiKey && 
                          settings?.steamId && 
                          cacheChecked && 
                          !isLoaded && 
                          !isLoading &&
                          (!viewingUser || viewingUser.isOwnLibrary); // Only auto-load if not viewing another user
    
    if (shouldAutoLoad) {
      loadLibrary();
    }
  }, [settings?.steamApiKey, settings?.steamId, cacheChecked, isLoaded, isLoading, loadLibrary, viewingUser]);

  // Auto-save table view state when it changes (debounced)
  useEffect(() => {
    if (!isLoaded || !viewingUser?.steamId) return;

    const timeoutId = setTimeout(() => {
      // Only save if we have games data to avoid corrupting cache
      if (games.length > 0) {
        saveToCache(games, gameCount, viewingUser.steamId, viewingUser.name);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchTerm, games, gameCount, isLoaded, viewingUser, saveToCache]);

  const refreshLibrary = async () => {
    setIsLoaded(false); // Force refresh even if cache is valid
    
    // Always refresh the currently viewed user's library
    const currentSteamId = viewingUser?.steamId || settings?.steamId;
    const currentUserName = viewingUser?.name || 'Steam Games Library';
    
    if (currentSteamId) {
      await loadLibraryForUser(currentSteamId, currentUserName, true);
    } else {
      setError('No user library to refresh');
    }
  };

  const clearCache = () => {
    // Clear cache for current user
    if (viewingUser?.steamId) {
      localStorage.removeItem(getCacheKey(viewingUser.steamId));
    }
    // Also clear cache for own library if different
    if (settings?.steamId && settings.steamId !== viewingUser?.steamId) {
      localStorage.removeItem(getCacheKey(settings.steamId));
    }
    
    setGames([]);
    setGameCount(0);
    setIsLoaded(false);
    setLastUpdated(null);
    setError(null);
    setCacheChecked(false);
    setViewingUser(null);
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

  const clearProfileVisibility = () => {
    setProfileVisibility(null);
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
        viewingUser,
        profileVisibility,
        // Table view state
        currentPage,
        itemsPerPage,
        sortBy,
        sortOrder,
        searchTerm,
        // Functions
        loadLibrary,
        loadUserLibrary,
        resetToOwnLibrary,
        refreshLibrary,
        clearProfileVisibility,
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