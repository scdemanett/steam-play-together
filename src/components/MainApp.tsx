'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Library, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/contexts/SettingsContext';
import { LibraryView } from '@/components/LibraryView';
import { PlayTogetherView } from '@/components/PlayTogetherView';
import { SettingsView } from '@/components/SettingsView';
import { UserSettings } from '@/lib/types';
import packageJson from '../../package.json';

// Component for displaying Steam avatars with animated support
function AvatarDisplay({ 
  avatar, 
  alt, 
  width = 36, 
  height = 36, 
  className = "rounded-full" 
}: { 
  avatar: UserSettings['steamAvatar'];
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (!avatar) return null;

  let avatarSrc: string;

  // Handle both old string format and new object format for backwards compatibility
  if (typeof avatar === 'string') {
    avatarSrc = avatar;
  } else {
    // Prefer animated avatar if available, fall back to static versions
    avatarSrc = avatar.animated?.movie || avatar.large || avatar.medium || avatar.small;
  }

  if (!avatarSrc) return null;

  return (
    <Image
      src={avatarSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized
    />
  );
}

export function MainApp() {
  const { settings } = useSettings();
  const [currentTab, setCurrentTab] = useState('library');
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎮</span>
                <h1 className="text-xl font-bold">Steam Play Together</h1>
              </div>
              
              <div className="flex items-center justify-between lg:justify-end gap-3">
                <div className="flex items-center gap-3">
                  <AvatarDisplay
                    avatar={settings?.steamAvatar}
                    alt="Steam Avatar"
                  />
                  <div className="flex flex-col">
                    {settings?.steamUsername && (
                      <span className="text-sm font-medium">
                        {settings.steamUsername}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      ID: {settings?.steamId}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <main className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Main
            </Button>
          </div>
          <SettingsView />

          {/* Version Display */}
          <div className="mt-6 text-right">
            <span className="text-xs text-muted-foreground">
              v{packageJson.version}
            </span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <h1 className="text-xl font-bold">Steam Play Together</h1>
            </div>
            
            <div className="flex items-center justify-between lg:justify-end gap-3">
              <div className="flex items-center gap-3">
                <AvatarDisplay
                  avatar={settings?.steamAvatar}
                  alt="Steam Avatar"
                />
                <div className="flex flex-col">
                  {settings?.steamUsername && (
                    <span className="text-sm font-medium">
                      {settings.steamUsername}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ID: {settings?.steamId}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library" className="flex items-center gap-2 text-sm lg:text-base">
              <Library className="h-4 w-4" />
              Games Library
            </TabsTrigger>
            <TabsTrigger value="play-together" className="flex items-center gap-2 text-sm lg:text-base">
              <Users className="h-4 w-4" />
              Play Together
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <LibraryView />
          </TabsContent>

          <TabsContent value="play-together" className="space-y-6">
            <PlayTogetherView />
          </TabsContent>
        </Tabs>

        {/* Version Display */}
        <div className="text-right">
          <span className="text-xs text-muted-foreground">
            v{packageJson.version}
          </span>
        </div>
      </main>
    </div>
  );
} 