import React from 'react';
import packageJson from '../../package.json';

interface VersionDisplayProps {
  className?: string;
}

export function VersionDisplay({ className = "mt-6 flex justify-between" }: VersionDisplayProps) {
  return (
    <div className={className}>
      <span className="text-xs text-muted-foreground">
        <a href="https://stevendemanett.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Made with ❤️ & 🤖 by Steven Demanett
        </a>
      </span>
      <span className="text-xs text-muted-foreground">
        v{packageJson.version}
      </span>
    </div>
  );
}