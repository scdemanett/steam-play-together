import SteamAuth from 'node-steam-openid';

// Function to create steam instance with user's API key
export const createSteamAuth = (apiKey: string, popup = false) => {
  const baseReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/steam/return`;
  const returnUrl = popup ? `${baseReturnUrl}?popup=true` : baseReturnUrl;
  
  return new SteamAuth({
    realm: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    returnUrl: returnUrl,
    apiKey: apiKey,
  });
}; 