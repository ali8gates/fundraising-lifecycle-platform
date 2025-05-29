import './globals.css';
import React from 'react';
import { GateAwareLayout } from '../components/GateAwareLayout';

export const metadata = {
  title: 'CHTI Business Scouting Tool',
  description: 'Healthcare startup scouting tool',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <GateAwareLayout>{children}</GateAwareLayout>
      </body>
    </html>
  );
}

