'use client';

import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Onboarding } from '@/components/Onboarding';
import { MainApp } from '@/components/MainApp';

export default function Home() {
  const { isConfigured } = useSettings();
  const [forceShowApp, setForceShowApp] = useState(false);

  // Show onboarding if user isn't configured and we're not forcing the app view
  if (!isConfigured && !forceShowApp) {
    return <Onboarding onComplete={() => setForceShowApp(true)} />;
  }

  // Show main app
  return <MainApp />;
}
