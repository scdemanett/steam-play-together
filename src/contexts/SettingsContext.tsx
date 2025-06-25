'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserSettings } from '@/lib/types';

interface SettingsContextType {
  settings: UserSettings | null;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  clearSettings: () => void;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  steamApiKey: '',
  steamId: '',
  theme: 'system',
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('steam-play-together-settings');
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
    setIsLoaded(true);
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!settings || !isLoaded) return;

    const applyTheme = (theme: string) => {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // system theme
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(settings.theme);

    // Listen for system theme changes if using system theme
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings, isLoaded]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings } as UserSettings;
    setSettings(updatedSettings);
    localStorage.setItem('steam-play-together-settings', JSON.stringify(updatedSettings));
  };

  const clearSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('steam-play-together-settings');
  };

  const isConfigured = Boolean(settings?.steamApiKey && settings?.steamId);

  if (!isLoaded) {
    return null; // or a loading spinner
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        clearSettings,
        isConfigured,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 