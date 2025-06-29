import SteamAuth from 'node-steam-openid';

// Function to create steam instance with user's API key
export const createSteamAuth = (apiKey: string) => {
  return new SteamAuth({
    realm: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/steam/return`,
    apiKey: apiKey,
  });
}; 