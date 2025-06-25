import SteamAuth from 'node-steam-openid';

// Function to create steam instance with user's API key
export const createSteamAuth = (apiKey: string) => {
  return new SteamAuth({
    realm: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/steam/return`,
    apiKey: apiKey,
  });
};

export interface SteamUser {
  steamid: string;
  username: string;
  name: string;
  avatar: {
    small: string;
    medium: string;
    large: string;
  };
  profile: {
    url: string;
  };
} 