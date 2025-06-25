import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { handleSteamApiError, logSteamApiError } from '@/lib/steam-api-errors';

export async function POST(request: NextRequest) {
  try {
    const { steamId, apiKey } = await request.json();

    if (!steamId || !apiKey) {
      return NextResponse.json({ error: 'Steam ID and API key are required' }, { status: 400 });
    }

    const url = `https://api.steampowered.com/ISteamUser/GetFriendList/v0001/?key=${apiKey}&steamid=${steamId}&relationship=friend`;

        const response = await axios.get(url);
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const steamError = handleSteamApiError(error);
    logSteamApiError('GetFriendsList', error);
    return NextResponse.json({ 
      error: steamError.userMessage,
      retryAfter: steamError.retryAfter 
    }, { status: steamError.statusCode });
  }
} 