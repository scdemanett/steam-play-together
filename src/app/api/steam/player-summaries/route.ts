import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { handleSteamApiError, logSteamApiError } from '@/lib/steam-api-errors';

export async function POST(request: NextRequest) {
  try {
    const { steamIds, apiKey } = await request.json();

    if (!steamIds || !Array.isArray(steamIds) || !apiKey) {
      return NextResponse.json({ error: 'Steam IDs array and API key are required' }, { status: 400 });
    }

    const steamIdString = steamIds.join(',');
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${steamIdString}`;

    const response = await axios.get(url);
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const steamError = handleSteamApiError(error);
    logSteamApiError('GetPlayerSummaries', error);
    return NextResponse.json({ 
      error: steamError.userMessage,
      retryAfter: steamError.retryAfter 
    }, { status: steamError.statusCode });
  }
} 