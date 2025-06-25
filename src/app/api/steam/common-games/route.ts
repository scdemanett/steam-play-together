import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { handleSteamApiError, logSteamApiError } from '@/lib/steam-api-errors';

interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  playtime_windows_forever: number;
  playtime_mac_forever: number;
  playtime_linux_forever: number;
  playtime_deck_forever: number;
  rtime_last_played: number;
}

export async function POST(request: NextRequest) {
  try {
    const { userSteamId, friendSteamIds, apiKey } = await request.json();

    if (!userSteamId || !friendSteamIds || !Array.isArray(friendSteamIds) || !apiKey) {
      return NextResponse.json({ 
        error: 'User Steam ID, friend Steam IDs array, and API key are required' 
      }, { status: 400 });
    }

    // Get user's owned games
    const userGamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${userSteamId}&format=json&include_appinfo=true`;
    
    let userGames: SteamGame[] = [];
    try {
      const userGamesResponse = await axios.get(userGamesUrl);
      userGames = userGamesResponse.data?.response?.games || [];
    } catch (error: unknown) {
      const steamError = handleSteamApiError(error);
      logSteamApiError('GetOwnedGames (user)', error);
      return NextResponse.json({ 
        error: steamError.userMessage,
        retryAfter: steamError.retryAfter 
      }, { status: steamError.statusCode });
    }

    if (userGames.length === 0) {
      return NextResponse.json({ commonGames: [] });
    }

    // Get friends' owned games
    const friendsGames: SteamGame[][] = [];
    const privateFriends: string[] = [];
    const publicFriends: string[] = [];
    
    for (const friendSteamId of friendSteamIds) {
      try {
        const friendGamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${friendSteamId}&format=json&include_appinfo=true`;
        const friendGamesResponse = await axios.get(friendGamesUrl);
        const games: SteamGame[] = friendGamesResponse.data?.response?.games || [];
        
        if (games.length > 0) {
          publicFriends.push(friendSteamId);
          friendsGames.push(games);
        } else {
          // Empty response usually means private profile
          privateFriends.push(friendSteamId);
          friendsGames.push([]);
        }
      } catch (error: unknown) {
        // Check if it's a rate limiting error - if so, fail fast
        const errorObj = error as { response?: { status?: number; data?: unknown } };
        if (errorObj.response?.status === 429 || 
            (typeof errorObj.response?.data === 'string' && errorObj.response?.data.includes('429'))) {
          const steamError = handleSteamApiError(error);
          logSteamApiError('GetOwnedGames (friend)', error);
          return NextResponse.json({ 
            error: steamError.userMessage,
            retryAfter: steamError.retryAfter 
          }, { status: steamError.statusCode });
        }
        
        // For other errors (likely private profile), skip the friend
        privateFriends.push(friendSteamId);
        friendsGames.push([]);
      }
    }

    // Find common games
    const commonGames: SteamGame[] = [];
    
    // Only compare with friends who have games (public profiles)
    const friendsWithGames = friendsGames.filter(games => games.length > 0);
    
    if (friendsWithGames.length === 0) {
      return NextResponse.json({ 
        commonGames: [],
        publicFriends: [],
        privateFriends,
        message: 'No friends with public profiles found'
      });
    }
    
    for (const userGame of userGames) {
      // Check if all friends with games have this game
      const isCommon = friendsWithGames.every(friendGameList => 
        friendGameList.some(friendGame => friendGame.appid === userGame.appid)
      );
      
      if (isCommon) {
        commonGames.push(userGame);
      }
    }

    // Sort by game name
    commonGames.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ 
      commonGames,
      publicFriends,
      privateFriends,
      message: `Found ${commonGames.length} common games with ${publicFriends.length} friends`
    });
  } catch (error: unknown) {
    const steamError = handleSteamApiError(error);
    logSteamApiError('CommonGames', error);
    return NextResponse.json({ 
      error: steamError.userMessage,
      retryAfter: steamError.retryAfter 
    }, { status: steamError.statusCode });
  }
} 