import { NextRequest, NextResponse } from 'next/server';
import { createSteamAuth } from '@/lib/steam-auth';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    // Get the API key from the cookie
    const apiKey = request.cookies.get('steam_api_key')?.value;

    if (!apiKey) {
      // Redirect to onboarding with error
      return redirect('/?error=steam_auth_expired');
    }

    // Create Steam auth instance with the stored API key
    const steamAuth = createSteamAuth(apiKey);
    
    // Authenticate the user with Steam
    const user = await steamAuth.authenticate(request);
    
    // Create the redirect URL with user data
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('steam_auth_success', 'true');
    redirectUrl.searchParams.set('steam_id', user.steamid);
    redirectUrl.searchParams.set('steam_name', user.username);
    redirectUrl.searchParams.set('steam_avatar', user.avatar.large);
    redirectUrl.searchParams.set('api_key', apiKey);
    
    // Clear the API key cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('steam_api_key');
    
    return response;
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    console.error('Steam auth callback error:', errorObj.message);
    
    // Redirect to onboarding with error
    return redirect('/?error=steam_auth_failed');
  }
} 