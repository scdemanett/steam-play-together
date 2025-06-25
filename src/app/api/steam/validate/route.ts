import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: 'API key is required' }, { status: 400 });
    }

    // Test the API key by fetching a known public profile (Gabe Newell's profile)
    const testSteamId = '76561197960287930';
    const testUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${apiKey}&steamids=${testSteamId}`;

    const response = await axios.get(testUrl);
    
    // If we get a valid response with player data, the API key is valid
    const isValid = response.data?.response?.players?.length > 0;

    return NextResponse.json({ valid: isValid });
  } catch (error: unknown) {
    const errorObj = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.error('Steam API validation error:', errorObj.response?.data || errorObj.message);
    
    // Check if it's an authentication error
    if (errorObj.response?.status === 403 || errorObj.response?.status === 401) {
      return NextResponse.json({ valid: false, error: 'Invalid API key' });
    }

    return NextResponse.json({ valid: false, error: 'Failed to validate API key' }, { status: 500 });
  }
} 