'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Eye, EyeOff, Trash2, Moon, Sun, Monitor } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';

export function SettingsView() {
  const { settings, updateSettings, clearSettings } = useSettings();
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(settings?.steamApiKey || '');
  const [steamIdInput, setSteamIdInput] = useState(settings?.steamId || '');

  const handleSaveSettings = () => {
    if (!apiKeyInput.trim() || !steamIdInput.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    updateSettings({
      steamApiKey: apiKeyInput.trim(),
      steamId: steamIdInput.trim(),
    });
    
    toast.success('Settings saved successfully!');
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    updateSettings({ theme });
    toast.success(`Theme changed to ${theme}`);
  };

  const handleClearAllData = () => {
    clearSettings();
    toast.success('All data cleared successfully');
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '•'.repeat(key.length);
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Steam Settings
          </CardTitle>
          <CardDescription>
            Manage your Steam API key and Steam ID
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Steam API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter your Steam API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {settings?.steamApiKey && (
              <p className="text-sm text-muted-foreground">
                Current: {maskApiKey(settings.steamApiKey)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="steamId">Steam ID</Label>
            <Input
              id="steamId"
              placeholder="Enter your Steam ID"
              value={steamIdInput}
              onChange={(e) => setSteamIdInput(e.target.value)}
            />
            {settings?.steamId && (
              <p className="text-sm text-muted-foreground">
                Current: {settings.steamId}
              </p>
            )}
          </div>

          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>
            Choose your preferred theme
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={settings?.theme === 'light' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('light')}
              className="flex flex-col gap-2 h-20"
            >
              <Sun className="h-6 w-6" />
              Light
            </Button>
            <Button
              variant={settings?.theme === 'dark' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('dark')}
              className="flex flex-col gap-2 h-20"
            >
              <Moon className="h-6 w-6" />
              Dark
            </Button>
            <Button
              variant={settings?.theme === 'system' ? 'default' : 'outline'}
              onClick={() => handleThemeChange('system')}
              className="flex flex-col gap-2 h-20"
            >
              <Monitor className="h-6 w-6" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div>
                    <p>This action cannot be undone. This will permanently delete your:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Steam API key</li>
                      <li>Steam ID</li>
                      <li>Theme preferences</li>
                      <li>All cached data</li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAllData}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, clear all data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
} 