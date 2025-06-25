import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { vanityUrl, apiKey } = await request.json();

    if (!vanityUrl || !apiKey) {
      return NextResponse.json({ error: 'Vanity URL and API key are required' }, { status: 400 });
    }

    // Clean the vanity URL (remove any URL parts, just get the username)
    const cleanVanityUrl = vanityUrl.replace(/.*\/id\//, '').replace(/\/$/, '');

    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${apiKey}&vanityurl=${cleanVanityUrl}`;

    const response = await axios.get(url);
    
    if (response.data?.response?.success === 1) {
      return NextResponse.json({ steamId: response.data.response.steamid });
    } else {
      return NextResponse.json({ error: 'Steam ID not found for this vanity URL' }, { status: 404 });
    }
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: unknown }; message?: string };
    console.error('Steam vanity URL resolution error:', errorObj.response?.data || errorObj.message);
    return NextResponse.json({ error: 'Failed to resolve vanity URL' }, { status: 500 });
  }
} 