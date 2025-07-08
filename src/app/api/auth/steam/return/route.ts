import { NextRequest, NextResponse } from 'next/server';
import { createSteamAuth } from '@/lib/steam-auth';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  try {
    // Get the API key from the cookie
    const apiKey = request.cookies.get('steam_api_key')?.value;

    if (!apiKey) {
      // Check if this is a popup window (from URL parameter)
      const url = new URL(request.url);
      const isPopup = url.searchParams.get('popup') === 'true';
      
      if (isPopup) {
        // Return HTML that sends message to parent window
        const html = `
          <html>
            <head><title>Steam Authentication</title></head>
            <body>
              <script>
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'STEAM_AUTH_ERROR',
                    error: 'steam_auth_expired'
                  }, window.location.origin);
                  window.close();
                } else {
                  window.location.href = '/?error=steam_auth_expired';
                }
              </script>
              <p>Authentication expired. This window should close automatically.</p>
            </body>
          </html>
        `;
        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      // Redirect to onboarding with error (fallback for non-popup)
      return redirect('/?error=steam_auth_expired');
    }

    // Check if this is a popup window (from URL parameter)
    const url = new URL(request.url);
    const isPopup = url.searchParams.get('popup') === 'true';
    
    // Create Steam auth instance with the API key and popup flag
    const steamAuth = createSteamAuth(apiKey, isPopup);
    
    // Authenticate the user with Steam
    const user = await steamAuth.authenticate(request);
    
    if (isPopup) {
      // Return HTML that sends success message to parent window
      const html = `
        <html>
          <head><title>Steam Authentication Success</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'STEAM_AUTH_SUCCESS',
                  steamId: '${user.steamid}',
                  steamName: '${user.username.replace(/'/g, "\\'")}',
                  steamAvatar: ${JSON.stringify(user.avatar)},
                  apiKey: '${apiKey}'
                }, window.location.origin);
                window.close();
              } else {
                // Fallback: redirect with URL params
                const url = new URL('/', window.location.origin);
                url.searchParams.set('steam_auth_success', 'true');
                url.searchParams.set('steam_id', '${user.steamid}');
                url.searchParams.set('steam_name', '${user.username}');
                url.searchParams.set('steam_avatar', '${JSON.stringify(user.avatar).replace(/'/g, "\\'")}');
                url.searchParams.set('api_key', '${apiKey}');
                window.location.href = url.toString();
              }
            </script>
            <p>Authentication successful! This window should close automatically.</p>
          </body>
        </html>
      `;
      
      const response = new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
      
      // Clear the API key cookie
      response.cookies.delete('steam_api_key');
      
      return response;
    }
    
    // Original redirect behavior for non-popup (fallback)
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('steam_auth_success', 'true');
    redirectUrl.searchParams.set('steam_id', user.steamid);
    redirectUrl.searchParams.set('steam_name', user.username);
    redirectUrl.searchParams.set('steam_avatar', JSON.stringify(user.avatar));
    redirectUrl.searchParams.set('api_key', apiKey);
    
    // Clear the API key cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('steam_api_key');
    
    return response;
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    console.error('Steam auth callback error:', errorObj.message);
    
    // Check if this is a popup window (from URL parameter)
    const url = new URL(request.url);
    const isPopup = url.searchParams.get('popup') === 'true';
    
    if (isPopup) {
      // Return HTML that sends error message to parent window
      const html = `
        <html>
          <head><title>Steam Authentication Failed</title></head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'STEAM_AUTH_ERROR',
                  error: 'steam_auth_failed'
                }, window.location.origin);
                window.close();
              } else {
                window.location.href = '/?error=steam_auth_failed';
              }
            </script>
            <p>Authentication failed. This window should close automatically.</p>
          </body>
        </html>
      `;
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    // Redirect to onboarding with error (fallback for non-popup)
    return redirect('/?error=steam_auth_failed');
  }
} 