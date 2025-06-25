import type { Metadata } from "next";
import "./globals.css";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { GamesProvider } from "@/contexts/GamesContext";
import { FriendsProvider } from "@/contexts/FriendsContext";
import { Toaster } from "@/components/ui/sonner";

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
      <body
        className="antialiased font-sans"
      >
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
