// =============================================================================
// STEAM PLAY TOGETHER - CONSOLIDATED TYPES
// =============================================================================

// =============================================================================
// STEAM API TYPES
// =============================================================================

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

export interface GameWithDetails extends SteamGame {
  short_description?: string;
  header_image?: string;
}

// =============================================================================
// STEAM AUTHENTICATION TYPES
// =============================================================================

export interface SteamUser {
  _json?: unknown;
  steamid: string;
  username: string;
  name: string;
  avatar: {
    small: string;
    medium: string;
    large: string;
    animated?: {
      static: string | null;
      movie: string | null;
    };
    frame?: {
      static: string | null;
      movie: string | null;
    };
  };
  profile: {
    url: string;
    background?: {
      static: string | null;
      movie: string | null;
    };
    background_mini?: {
      static: string | null;
      movie: string | null;
    };
  };
}

// =============================================================================
// APPLICATION TYPES
// =============================================================================

export interface UserSettings {
  steamApiKey: string;
  steamId: string;
  steamUsername?: string;
  steamAvatar?: string | {
    small: string;
    medium: string;
    large: string;
    animated?: {
      static: string | null;
      movie: string | null;
    };
    frame?: {
      static: string | null;
      movie: string | null;
    };
  };
  theme: 'light' | 'dark' | 'system';
}

export interface Friend {
  steamId: string;
  name: string;
  isPublic: boolean;
  avatar?: string;
}

// =============================================================================
// GAMES CONTEXT TYPES
// =============================================================================

export type SortColumn = 'name' | 'appid' | 'playtime' | 'playtime_windows' | 'playtime_mac' | 'playtime_linux' | 'playtime_deck' | 'last_played';

export interface TableViewState {
  currentPage: number;
  itemsPerPage: number;
  sortBy: SortColumn;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
}

export interface CachedGamesData {
  games: SteamGame[];
  gameCount: number;
  timestamp: number;
  steamId: string;
  tableViewState: TableViewState;
  userName?: string;
}

export interface ViewingUser {
  steamId: string;
  name: string;
  isOwnLibrary: boolean;
}

export interface GamesContextType {
  games: SteamGame[];
  gameCount: number;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  lastUpdated: Date | null;
  viewingUser: ViewingUser | null;
  profileVisibility: { steamId: string; isPublic: boolean } | null;
  // Table view state
  currentPage: number;
  itemsPerPage: number;
  sortBy: SortColumn;
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
  // Functions
  loadLibrary: () => Promise<void>;
  loadUserLibrary: (steamId: string, userName?: string) => Promise<void>;
  resetToOwnLibrary: () => Promise<void>;
  refreshLibrary: () => Promise<void>;
  clearProfileVisibility: () => void;
  clearCache: () => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  setSortBy: (column: SortColumn) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setSearchTerm: (term: string) => void;
  resetTableView: () => void;
}

// =============================================================================
// FRIENDS CONTEXT TYPES
// =============================================================================

export interface CachedFriendsData {
  friends: Friend[];
  timestamp: number;
  steamId: string;
}

export interface CachedCommonGamesData {
  commonGames: SteamGame[];
  friendIds: string[];
  publicFriends: string[];
  privateFriends: string[];
  timestamp: number;
  steamId: string;
}

export interface FriendsContextType {
  friends: Friend[];
  steamFriends: Friend[];
  commonGames: SteamGame[];
  publicFriends: string[];
  privateFriends: string[];
  isLoadingFriends: boolean;
  isLoadingSteamFriends: boolean;
  isLoadingCommon: boolean;
  friendsLoaded: boolean;
  steamFriendsLoaded: boolean;
  commonGamesLoaded: boolean;
  lastFriendsUpdate: Date | null;
  lastSteamFriendsUpdate: Date | null;
  lastCommonGamesUpdate: Date | null;
  addFriend: (steamId: string, name?: string) => Promise<void>;
  addSelectedSteamFriends: (steamIds: string[]) => void;
  removeFriend: (steamId: string) => void;
  removeAllFriends: () => void;
  loadSteamFriends: () => Promise<number>;
  clearSteamFriends: () => void;
  findCommonGames: (friendsList?: Friend[]) => Promise<{ gamesCount: number; publicFriendsCount: number; privateFriendsCount: number; message: string }>;
  updateProfileVisibility: (steamId: string, isPublic: boolean) => void;
  clearFriendsCache: () => void;
  clearCommonGamesCache: () => void;
}

// =============================================================================
// SETTINGS CONTEXT TYPES
// =============================================================================

export interface SettingsContextType {
  settings: UserSettings | null;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  clearSettings: () => void;
  isConfigured: boolean;
}

// =============================================================================
// COMPONENT PROP TYPES
// =============================================================================

export interface OnboardingProps {
  onComplete: () => void;
}

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

export interface SteamApiError {
  message: string;
  userMessage: string;
  statusCode: number;
  retryAfter?: number;
} 