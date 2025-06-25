'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Library, Users } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { LibraryView } from '@/components/LibraryView';
import { PlayTogetherView } from '@/components/PlayTogetherView';
import { SettingsView } from '@/components/SettingsView';

export function MainApp() {
  const { settings } = useSettings();
  const [currentTab, setCurrentTab] = useState('library');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              <h1 className="text-xl font-bold">Steam Play Together</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {settings?.steamAvatar && (
                <Image
                  src={settings.steamAvatar}
                  alt="Steam Avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                  unoptimized
                />
              )}
              <div className="flex flex-col items-end">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Library className="h-4 w-4" />
              Games Library
            </TabsTrigger>
            <TabsTrigger value="play-together" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Play Together
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-6">
            <LibraryView />
          </TabsContent>

          <TabsContent value="play-together" className="space-y-6">
            <PlayTogetherView />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
} 