import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { steamId, apiKey } = await request.json();

    if (!steamId || !apiKey) {
      return NextResponse.json({ error: 'Steam ID and API key are required' }, { status: 400 });
    }

    // Try to get the user's owned games - if this works, profile is public
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json`;

    try {
      const response = await axios.get(url);
      // Public if we get a response object with either games or game_count property
      // Private profiles return {"response": {}} - empty response object
      const isPublic = response.data?.response && 
                       (response.data.response.games !== undefined || 
                        response.data.response.game_count !== undefined);
      return NextResponse.json({ isPublic });
    } catch (error: unknown) {
      // If we get a 403, the profile is private
      const errorObj = error as { response?: { status?: number } };
      if (errorObj.response?.status === 403) {
        return NextResponse.json({ isPublic: false });
      }
      throw error;
    }
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: unknown }; message?: string };
    console.error('Steam profile visibility error:', errorObj.response?.data || errorObj.message);
    return NextResponse.json({ error: 'Failed to check profile visibility' }, { status: 500 });
  }
} 