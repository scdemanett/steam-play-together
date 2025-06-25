'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { SteamGame } from '@/lib/types';
import { SteamAPI } from '@/lib/steam-api';
import { useSettings } from './SettingsContext';

interface Friend {
  steamId: string;
  name: string;
  isPublic: boolean;
  avatar?: string;
}

interface CachedFriendsData {
  friends: Friend[];
  timestamp: number;
  steamId: string;
}

interface CachedCommonGamesData {
  commonGames: SteamGame[];
  friendIds: string[];
  timestamp: number;
  steamId: string;
}

interface FriendsContextType {
  friends: Friend[];
  steamFriends: Friend[];
  commonGames: SteamGame[];
  isLoadingFriends: boolean;
  isLoadingSteamFriends: boolean;
  isLoadingCommon: boolean;
  friendsLoaded: boolean;
  steamFriendsLoaded: boolean;
  commonGamesLoaded: boolean;
  lastFriendsUpdate: Date | null;
  lastSteamFriendsUpdate: Date | null;
  lastCommonGamesUpdate: Date | null;
  addFriend: (steamId: string, name?: string) => Promise<void>;
  addSelectedSteamFriends: (steamIds: string[]) => void;
  removeFriend: (steamId: string) => void;
  loadSteamFriends: () => Promise<number>;
  clearSteamFriends: () => void;
  findCommonGames: (friendsList?: Friend[]) => Promise<{ gamesCount: number; publicFriendsCount: number; privateFriendsCount: number; message: string }>;
  clearFriendsCache: () => void;
  clearCommonGamesCache: () => void;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

// Cache durations
const FRIENDS_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const COMMON_GAMES_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const FRIENDS_CACHE_KEY = 'steam-friends-cache';
const COMMON_GAMES_CACHE_KEY = 'steam-common-games-cache';

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [steamFriends, setSteamFriends] = useState<Friend[]>([]);
  const [commonGames, setCommonGames] = useState<SteamGame[]>([]);
  const [isLoadingFriends] = useState(false);
  const [isLoadingSteamFriends, setIsLoadingSteamFriends] = useState(false);
  const [isLoadingCommon, setIsLoadingCommon] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [steamFriendsLoaded, setSteamFriendsLoaded] = useState(false);
  const [commonGamesLoaded, setCommonGamesLoaded] = useState(false);
  const [lastFriendsUpdate, setLastFriendsUpdate] = useState<Date | null>(null);
  const [lastSteamFriendsUpdate, setLastSteamFriendsUpdate] = useState<Date | null>(null);
  const [lastCommonGamesUpdate, setLastCommonGamesUpdate] = useState<Date | null>(null);

  const loadFriendsFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(FRIENDS_CACHE_KEY);
      if (!cached) return;

      const cachedData: CachedFriendsData = JSON.parse(cached);
      
      const isExpired = Date.now() - cachedData.timestamp > FRIENDS_CACHE_DURATION;
      const isDifferentUser = settings?.steamId && cachedData.steamId !== settings.steamId;
      
      if (!isExpired && !isDifferentUser) {
        setFriends(cachedData.friends);
        setLastFriendsUpdate(new Date(cachedData.timestamp));
        setFriendsLoaded(true);
      } else {
        localStorage.removeItem(FRIENDS_CACHE_KEY);
        setFriends([]);
        setFriendsLoaded(false);
        setLastFriendsUpdate(null);
      }
    } catch (error) {
      console.error('Failed to load friends from cache:', error);
      localStorage.removeItem(FRIENDS_CACHE_KEY);
    }
  }, [settings?.steamId]);

  const loadCommonGamesFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(COMMON_GAMES_CACHE_KEY);
      if (!cached) return;

      const cachedData: CachedCommonGamesData = JSON.parse(cached);
      
      const isExpired = Date.now() - cachedData.timestamp > COMMON_GAMES_CACHE_DURATION;
      const isDifferentUser = settings?.steamId && cachedData.steamId !== settings.steamId;
      
      if (!isExpired && !isDifferentUser) {
        setCommonGames(cachedData.commonGames);
        setLastCommonGamesUpdate(new Date(cachedData.timestamp));
        setCommonGamesLoaded(true);
      } else {
        localStorage.removeItem(COMMON_GAMES_CACHE_KEY);
        setCommonGames([]);
        setCommonGamesLoaded(false);
        setLastCommonGamesUpdate(null);
      }
    } catch (error) {
      console.error('Failed to load common games from cache:', error);
      localStorage.removeItem(COMMON_GAMES_CACHE_KEY);
    }
  }, [settings?.steamId]);

  // Load cached data on mount and when settings change
  useEffect(() => {
    loadFriendsFromCache();
    loadCommonGamesFromCache();
  }, [loadFriendsFromCache, loadCommonGamesFromCache]);

  const saveFriendsToCache = (friendsData: Friend[]) => {
    if (!settings?.steamId) return;

    try {
      const cacheData: CachedFriendsData = {
        friends: friendsData,
        timestamp: Date.now(),
        steamId: settings.steamId,
      };
      localStorage.setItem(FRIENDS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save friends to cache:', error);
    }
  };

  const saveCommonGamesToCache = (gamesData: SteamGame[], friendIds: string[]) => {
    if (!settings?.steamId) return;

    try {
      const cacheData: CachedCommonGamesData = {
        commonGames: gamesData,
        friendIds,
        timestamp: Date.now(),
        steamId: settings.steamId,
      };
      localStorage.setItem(COMMON_GAMES_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to save common games to cache:', error);
    }
  };

  const addFriend = async (steamId: string, name?: string) => {
    if (!settings?.steamApiKey) {
      throw new Error('Steam API key is required');
    }

    // Check if friend already exists
    if (friends.some(f => f.steamId === steamId)) {
      throw new Error('This friend is already in your list');
    }

    let resolvedSteamId = steamId;

    // If input looks like a username, resolve it to Steam ID
    if (!/^\d+$/.test(steamId)) {
      const resolvedId = await SteamAPI.resolveSteamId(steamId, settings.steamApiKey);
      if (!resolvedId) {
        throw new Error('Could not find Steam ID for this username');
      }
      resolvedSteamId = resolvedId;
    }

    // Always fetch player summary to get name and avatar
    const playerInfo = await SteamAPI.getPlayerSummaries([resolvedSteamId], settings.steamApiKey);
    const playerSummary = playerInfo[0];
    
    const friendName = name || playerSummary?.personaname || `User ${resolvedSteamId}`;
    const friendAvatar = playerSummary?.avatar;

    const newFriend: Friend = {
      steamId: resolvedSteamId,
      name: friendName,
      isPublic: true, // We'll verify this when needed
      avatar: friendAvatar
    };

    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);
    saveFriendsToCache(updatedFriends);
    setLastFriendsUpdate(new Date());
    
    // Clear common games cache since friends list changed
    clearCommonGamesCache();
  };

  const removeFriend = (steamId: string) => {
    const updatedFriends = friends.filter(f => f.steamId !== steamId);
    setFriends(updatedFriends);
    saveFriendsToCache(updatedFriends);
    setLastFriendsUpdate(new Date());
    
    // Clear common games cache since friends list changed
    clearCommonGamesCache();
  };

  const loadSteamFriends = async () => {
    if (!settings?.steamApiKey || !settings?.steamId) {
      throw new Error('Please configure your Steam settings first');
    }

    setIsLoadingSteamFriends(true);
    try {
      const friendsList = await SteamAPI.getFriendsList(settings.steamId, settings.steamApiKey);
      
      if (friendsList.length === 0) {
        throw new Error('No friends found on your Steam friends list');
      }

      // Get friend details in batches (limit to first 20 friends)
      const friendSteamIds = friendsList.slice(0, 20).map(f => f.steamid);
      const playerSummaries = await SteamAPI.getPlayerSummaries(friendSteamIds, settings.steamApiKey);
      
      const loadedSteamFriends: Friend[] = [];
      
      for (const player of playerSummaries) {
        loadedSteamFriends.push({
          steamId: player.steamid,
          name: player.personaname || `User ${player.steamid}`,
          isPublic: true, // We'll verify this later when needed
          avatar: player.avatar
        });
      }

      // Just store the Steam friends for selection, don't add to main friends list yet
      setSteamFriends(loadedSteamFriends);
      setLastSteamFriendsUpdate(new Date());
      setSteamFriendsLoaded(true);
      
      return loadedSteamFriends.length;
    } finally {
      setIsLoadingSteamFriends(false);
    }
  };

  const addSelectedSteamFriends = (steamIds: string[]) => {
    const selectedFriends = steamFriends.filter(f => steamIds.includes(f.steamId));
    
    // Merge with existing friends, avoiding duplicates
    const existingSteamIds = new Set(friends.map(f => f.steamId));
    const newFriends = selectedFriends.filter(f => !existingSteamIds.has(f.steamId));
    const updatedFriends = [...friends, ...newFriends];
    
    setFriends(updatedFriends);
    saveFriendsToCache(updatedFriends);
    setLastFriendsUpdate(new Date());
    setFriendsLoaded(true);
    
    // Clear common games cache since friends list changed
    clearCommonGamesCache();
  };

  const clearSteamFriends = () => {
    setSteamFriends([]);
    setSteamFriendsLoaded(false);
    setLastSteamFriendsUpdate(null);
  };

  const findCommonGames = async (friendsList?: Friend[]) => {
    if (!settings?.steamApiKey || !settings?.steamId) {
      throw new Error('Steam API key and Steam ID are required');
    }
    
    const currentFriends = friendsList || friends;
    
    if (currentFriends.length === 0) {
      throw new Error('Add some friends first to find common games');
    }

    setIsLoadingCommon(true);
    try {
      const friendSteamIds = currentFriends.map(f => f.steamId);
      
      const response = await SteamAPI.findCommonGames(
        settings.steamId,
        friendSteamIds,
        settings.steamApiKey
      );
      
      const { commonGames: commonGamesData, publicFriends, privateFriends, message } = response;
      
      setCommonGames(commonGamesData);
      saveCommonGamesToCache(commonGamesData, friendSteamIds);
      setLastCommonGamesUpdate(new Date());
      setCommonGamesLoaded(true);
      
      return {
        gamesCount: commonGamesData.length,
        publicFriendsCount: publicFriends.length,
        privateFriendsCount: privateFriends.length,
        message
      };
    } finally {
      setIsLoadingCommon(false);
    }
  };

  const clearFriendsCache = () => {
    localStorage.removeItem(FRIENDS_CACHE_KEY);
    // Also clear PlayTogetherView specific state
    if (settings?.steamId) {
      localStorage.removeItem(`play-together-search-${settings.steamId}`);
      localStorage.removeItem(`play-together-selected-${settings.steamId}`);
    }
    setFriends([]);
    setFriendsLoaded(false);
    setLastFriendsUpdate(null);
  };

  const clearCommonGamesCache = () => {
    localStorage.removeItem(COMMON_GAMES_CACHE_KEY);
    setCommonGames([]);
    setCommonGamesLoaded(false);
    setLastCommonGamesUpdate(null);
  };

      return (
      <FriendsContext.Provider
        value={{
          friends,
          steamFriends,
          commonGames,
          isLoadingFriends,
          isLoadingSteamFriends,
          isLoadingCommon,
          friendsLoaded,
          steamFriendsLoaded,
          commonGamesLoaded,
          lastFriendsUpdate,
          lastSteamFriendsUpdate,
          lastCommonGamesUpdate,
          addFriend,
          addSelectedSteamFriends,
          removeFriend,
          loadSteamFriends,
          clearSteamFriends,
          findCommonGames,
          clearFriendsCache,
          clearCommonGamesCache,
        }}
      >
        {children}
      </FriendsContext.Provider>
    );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return context;
} 