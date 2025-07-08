import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { GamesProvider } from "@/contexts/GamesContext";
import { FriendsProvider } from "@/contexts/FriendsContext";
import { Toaster } from "@/components/ui/sonner";
import { GoogleTagManager } from '@next/third-parties/google';

export const metadata: Metadata = {
  title: "Steam Play Together",
  description: "Find games to play with your friends on Steam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="Steam Play Together" />
        <link href="https://fonts.cdnfonts.com/css/motiva-sans" rel="stylesheet" />
      </head>
      {process.env.NEXT_PUBLIC_GTM_ID && (
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
      )}
      <body
        className="antialiased font-sans"
      >
        {/* GTM noscript fallback */}
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        
        <SettingsProvider>
          <GamesProvider>
            <FriendsProvider>
              {children}
              <Toaster />
            </FriendsProvider>
          </GamesProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
