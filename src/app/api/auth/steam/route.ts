import { NextRequest, NextResponse } from 'next/server';
import { createSteamAuth } from '@/lib/steam-auth';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, popup } = await request.json();

    if (!apiKey) {
      return NextResponse.json({ error: 'Steam API key is required' }, { status: 400 });
    }

    // Create Steam auth instance with user's API key and popup flag
    const steamAuth = createSteamAuth(apiKey, popup);
    
    // Get the redirect URL to Steam
    const redirectUrl = await steamAuth.getRedirectUrl();
    
    // Store the API key in a cookie for the return callback
    const response = NextResponse.json({ redirectUrl });
    response.cookies.set('steam_api_key', apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    console.error('Steam auth initiation error:', errorObj.message);
    return NextResponse.json({ error: 'Failed to initiate Steam authentication' }, { status: 500 });
  }
} 