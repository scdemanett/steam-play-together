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
      </main>
    </div>
  );
} 