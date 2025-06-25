export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  playtime_windows_forever: number;
  playtime_mac_forever: number;
  playtime_linux_forever: number;
  playtime_deck_forever: number;
  rtime_last_played: number;
  content_descriptorids?: number[];
  playtime_disconnected?: number;
}

export interface SteamOwnedGamesResponse {
  response: {
    game_count: number;
    games: SteamGame[];
  };
}

export interface SteamAppDetails {
  success: boolean;
  data?: {
    name: string;
    steam_appid: number;
    short_description: string;
    header_image: string;
    platforms: {
      windows: boolean;
      mac: boolean;
      linux: boolean;
    };
  };
}

export interface SteamFriend {
  steamid: string;
  relationship: string;
  friend_since: number;
  personaname?: string;
  avatar?: string;
  personastate?: number;
}

export interface UserSettings {
  steamApiKey: string;
  steamId: string;
  theme: 'light' | 'dark' | 'system';
}

export interface GameWithDetails extends SteamGame {
  short_description?: string;
  header_image?: string;
} 