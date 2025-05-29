import './globals.css';
import React from 'react';

export const metadata = {
  title: 'CHTI: AI Innovators Network',
  description: 'Healthcare startup scouting tool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl p-4">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-xl font-semibold">CHTI: AI Innovators Network</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:underline">Dashboard</a>
              <a href="/companies" className="hover:underline">Companies</a>
              <a href="/settings" className="hover:underline">Settings</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

