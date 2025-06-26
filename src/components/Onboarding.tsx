'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckCircle, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { SteamAPI } from '@/lib/steam-api';
import { toast } from 'sonner';
import axios from 'axios';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const { updateSettings } = useSettings();
  const [step, setStep] = useState(1);
  const [apiKey, setApiKey] = useState('');
  const [steamIdInput, setSteamIdInput] = useState('');
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false);
  const [isValidatingSteamId, setIsValidatingSteamId] = useState(false);
  const [isSteamAuthenticating, setIsSteamAuthenticating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Handle Steam authentication callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('steam_auth_success') === 'true') {
      const steamId = urlParams.get('steam_id');
      const steamName = urlParams.get('steam_name');
      const steamAvatar = urlParams.get('steam_avatar');
      const apiKeyFromUrl = urlParams.get('api_key');
      
      if (steamId && apiKeyFromUrl) {
        // Complete setup with Steam data
        updateSettings({
          steamApiKey: apiKeyFromUrl,
          steamId: steamId,
          steamUsername: steamName || undefined,
          steamAvatar: steamAvatar || undefined,
        });
        
        toast.success(`Welcome ${steamName}! Your Steam account has been linked.`);
        
        // Clean up URL parameters
        window.history.replaceState({}, '', window.location.pathname);
        
        onComplete();
      }
    } else if (urlParams.get('error')) {
      const error = urlParams.get('error');
      if (error === 'steam_auth_expired') {
        toast.error('Steam authentication expired. Please try again.');
      } else if (error === 'steam_auth_failed') {
        toast.error('Steam authentication failed. Please try again.');
      }
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [updateSettings, onComplete]);

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Steam API key');
      return;
    }

    setIsValidatingApiKey(true);
    try {
      const isValid = await SteamAPI.validateApiKey(apiKey.trim());
      
      if (isValid) {
        toast.success('API key validated successfully!');
        setStep(2);
      } else {
        toast.error('Invalid API key. Please check and try again.');
      }
    } catch {
      toast.error('Failed to validate API key. Please try again.');
    } finally {
      setIsValidatingApiKey(false);
    }
  };

  const validateSteamId = async () => {
    if (!steamIdInput.trim()) {
      toast.error('Please enter your Steam ID or username');
      return;
    }

    setIsValidatingSteamId(true);
    let finalSteamId = steamIdInput.trim();

    try {
      // If input looks like a username (not all numbers), try to resolve it
      if (!/^\d+$/.test(finalSteamId)) {
        toast.info('Resolving Steam username...');
        const resolvedId = await SteamAPI.resolveSteamId(finalSteamId, apiKey);
        
        if (resolvedId) {
          finalSteamId = resolvedId;
          toast.success(`Found Steam ID: ${finalSteamId}`);
        } else {
          toast.error('Could not find Steam ID for this username. Please check the username or use your Steam ID directly.');
          setIsValidatingSteamId(false);
          return;
        }
      }

      // Test if we can fetch the user's profile to ensure it's public
      const testGames = await SteamAPI.getOwnedGames(finalSteamId, apiKey);
      
      if (testGames) {
        toast.success('Steam profile validated successfully!');
        
        // Fetch user's profile info (username and avatar)
        let steamUsername: string | undefined;
        let steamAvatar: string | undefined;
        
        try {
          const playerInfo = await SteamAPI.getPlayerSummaries([finalSteamId], apiKey);
          if (playerInfo.length > 0) {
            steamUsername = playerInfo[0].personaname;
            steamAvatar = playerInfo[0].avatar;
          }
        } catch (error) {
          console.warn('Failed to fetch player info:', error);
          // Continue without player info - not a critical error
        }
        
        // Save settings and complete onboarding
        updateSettings({
          steamApiKey: apiKey,
          steamId: finalSteamId,
          steamUsername,
          steamAvatar,
        });
        
        onComplete();
      } else {
        toast.error('Unable to access your Steam profile. Please ensure your profile is public and the Steam ID is correct.');
      }
    } catch {
      toast.error('Failed to validate Steam ID. Please try again.');
    } finally {
      setIsValidatingSteamId(false);
    }
  };

  const handleSteamLogin = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Steam API key first');
      return;
    }

    setIsSteamAuthenticating(true);
    try {
      const response = await axios.post('/api/auth/steam', { apiKey: apiKey.trim() });
      
      if (response.data.redirectUrl) {
        // Redirect to Steam for authentication
        window.location.href = response.data.redirectUrl;
      }
    } catch (error) {
      console.error('Steam auth error:', error);
      toast.error('Failed to initiate Steam authentication. Please try again.');
      setIsSteamAuthenticating(false);
    }
  };

  const progress = (step / 2) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Steam Play Together
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Find games to play with your friends
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              Setup Your Steam Connection
            </CardTitle>
            <CardDescription>
              We need your Steam API key and Steam ID to get started
            </CardDescription>
            <Progress value={progress} className="mt-2" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="apiKey">Steam API Key</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowInstructions(true)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      How to get API key
                    </Button>
                  </div>
                  
                  <div className="relative">
                    <Input
                      id="apiKey"
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="Enter your Steam API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && validateApiKey()}
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
                </div>

                <Button 
                  onClick={validateApiKey} 
                  disabled={isValidatingApiKey || !apiKey.trim()}
                  className="w-full"
                >
                  {isValidatingApiKey ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Validating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Validate API Key
                    </div>
                  )}
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">API Key Validated</span>
                </div>

                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Link Your Steam Account</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Choose how you&apos;d like to connect your Steam account
                    </p>
                  </div>

                  {/* Steam Login Option */}
                  <div className="space-y-3">
                    <div className="relative">
                      <button
                        onClick={handleSteamLogin}
                        disabled={isSteamAuthenticating}
                        className="block mx-auto hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <img
                          src="/sign-in-through-steam_01.png"
                          alt="Sign in through Steam"
                          className="h-auto max-w-full"
                        />
                      </button>
                      {isSteamAuthenticating && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black rounded">
                          <div className="flex items-center gap-2 text-white font-medium">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Redirecting to Steam...
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-center text-gray-500">
                      Secure login through Steam - automatically gets your Steam ID
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 border-t" />
                    <span className="text-sm text-muted-foreground">or</span>
                    <div className="flex-1 border-t" />
                  </div>

                                     {/* Manual Steam ID Entry */}
                   <div className="space-y-3">
                     <div>
                       <Label htmlFor="steamId" className="block mb-3">Manual Steam ID Entry</Label>
                       <Input
                        id="steamId"
                        placeholder="Enter your Steam ID or username"
                        value={steamIdInput}
                        onChange={(e) => setSteamIdInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && validateSteamId()}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Enter your Steam ID (numbers) or Steam username
                      </p>
                    </div>

                    <Button 
                      onClick={validateSteamId} 
                      disabled={isValidatingSteamId || !steamIdInput.trim()}
                      variant="outline"
                      className="w-full"
                    >
                      {isValidatingSteamId ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Validating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Complete Setup Manually
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={showInstructions} onOpenChange={setShowInstructions}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>How to Get Your Steam API Key</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-4">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Visit the Steam Web API Key page</li>
                    <li>Log in with your Steam account</li>
                    <li>Fill in a domain name (you can use &quot;localhost&quot;)</li>
                    <li>Click &quot;Register&quot; to get your API key</li>
                    <li>Copy the API key and paste it above</li>
                  </ol>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => window.open('https://steamcommunity.com/dev/apikey', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Get API Key
                    </Button>
                    <Button onClick={() => setShowInstructions(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 