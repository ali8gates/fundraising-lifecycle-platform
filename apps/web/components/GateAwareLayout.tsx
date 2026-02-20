'use client';

import { usePathname, useRouter } from 'next/navigation';

export function GateAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isGatePage = pathname === '/gate';

  const handleSignOut = async () => {
    await fetch('/api/gate/signout', { method: 'POST' });
    router.push('/gate');
    router.refresh();
  };

  if (isGatePage) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="shrink-0 text-sm font-bold text-[#a6192e]">American Heart Association</a>
          <h1 className="text-xl font-semibold">CHTI Business Scouting Tool</h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            <a href="/" className="hover:underline">Dashboard</a>
            <a href="/companies" className="hover:underline">Companies</a>
            <a href="/settings" className="hover:underline">Settings</a>
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
