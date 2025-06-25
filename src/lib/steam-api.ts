import axios from 'axios';
import { SteamOwnedGamesResponse, SteamAppDetails, SteamFriend, SteamGame } from './types';



// These functions will call our Next.js API routes which act as proxies
export class SteamAPI {
  
  // Validate API key by testing a known public profile
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await axios.post('/api/steam/validate', { apiKey });
      return response.data.valid;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }

  // Resolve vanity URL to Steam ID
  static async resolveSteamId(vanityUrl: string, apiKey: string): Promise<string | null> {
    try {
      const response = await axios.post('/api/steam/resolve-vanity', { 
        vanityUrl, 
        apiKey 
      });
      return response.data.steamId || null;
    } catch (error) {
      console.error('Failed to resolve Steam ID:', error);
      return null;
    }
  }

  // Get user's owned games
  static async getOwnedGames(steamId: string, apiKey: string): Promise<SteamOwnedGamesResponse> {
    try {
      const response = await axios.post('/api/steam/owned-games', {
        steamId,
        apiKey
      });
      return response.data;
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { error?: string; retryAfter?: number } } };
      const errorMessage = errorObj.response?.data?.error || 'Failed to fetch owned games';
      const retryAfter = errorObj.response?.data?.retryAfter;
      
      if (retryAfter) {
        const waitMinutes = Math.ceil(retryAfter / 60);
        throw new Error(`${errorMessage} Please wait ${waitMinutes} minutes before trying again.`);
      }
      
      throw new Error(errorMessage);
    }
  }

  // Get game details from Steam store API
  static async getGameDetails(appId: number): Promise<SteamAppDetails | null> {
    try {
      const response = await axios.get(`/api/steam/app-details?appId=${appId}`);
      return response.data[appId] || null;
    } catch (error) {
      console.error('Failed to fetch game details:', error);
      return null;
    }
  }

  // Get user's friends list
  static async getFriendsList(steamId: string, apiKey: string): Promise<SteamFriend[]> {
    try {
      const response = await axios.post('/api/steam/friends-list', {
        steamId,
        apiKey
      });
      return response.data.friendslist?.friends || [];
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { error?: string; retryAfter?: number } } };
      const errorMessage = errorObj.response?.data?.error || 'Failed to fetch friends list';
      const retryAfter = errorObj.response?.data?.retryAfter;
      
      if (retryAfter) {
        const waitMinutes = Math.ceil(retryAfter / 60);
        throw new Error(`${errorMessage} Please wait ${waitMinutes} minutes before trying again.`);
      }
      
      throw new Error(errorMessage);
    }
  }

  // Get player summaries for multiple Steam IDs
  static async getPlayerSummaries(steamIds: string[], apiKey: string): Promise<Array<{ steamid: string; personaname?: string; avatar?: string }>> {
    try {
      const response = await axios.post('/api/steam/player-summaries', {
        steamIds,
        apiKey
      });
      return response.data.response?.players || [];
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { error?: string; retryAfter?: number } } };
      const errorMessage = errorObj.response?.data?.error || 'Failed to fetch player summaries';
      const retryAfter = errorObj.response?.data?.retryAfter;
      
      if (retryAfter) {
        const waitMinutes = Math.ceil(retryAfter / 60);
        throw new Error(`${errorMessage} Please wait ${waitMinutes} minutes before trying again.`);
      }
      
      throw new Error(errorMessage);
    }
  }

  // Check if a profile is public
  static async isProfilePublic(steamId: string, apiKey: string): Promise<boolean> {
    try {
      const response = await axios.post('/api/steam/profile-visibility', {
        steamId,
        apiKey
      });
      return response.data.isPublic;
    } catch (error) {
      console.error('Failed to check profile visibility:', error);
      return false;
    }
  }

  // Find common games between users
  static async findCommonGames(userSteamId: string, friendSteamIds: string[], apiKey: string): Promise<{ commonGames: SteamGame[]; publicFriends: string[]; privateFriends: string[]; message: string }> {
    try {
      const response = await axios.post('/api/steam/common-games', {
        userSteamId,
        friendSteamIds,
        apiKey
      });
      return response.data;
    } catch (error: unknown) {
      const errorObj = error as { response?: { data?: { error?: string; retryAfter?: number } } };
      const errorMessage = errorObj.response?.data?.error || 'Failed to find common games';
      const retryAfter = errorObj.response?.data?.retryAfter;
      
      if (retryAfter) {
        const waitMinutes = Math.ceil(retryAfter / 60);
        throw new Error(`${errorMessage} Please wait ${waitMinutes} minutes before trying again.`);
      }
      
      throw new Error(errorMessage);
    }
  }
}

// Utility functions
export const formatPlaytime = (minutes: number): string => {
  if (minutes === 0) return 'Never played';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

export const formatLastPlayed = (timestamp: number): string => {
  if (timestamp === 0) return 'Never';
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  
  return date.toLocaleDateString();
};

export const getSteamIconUrl = (appId: number, iconHash: string): string => {
  if (!iconHash) return '/placeholder-game-icon.svg';
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
};

export const launchSteamGame = (appId: number): void => {
  window.open(`steam://run/${appId}`, '_self');
}; 