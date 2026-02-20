'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function GatePage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/gate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: pin }),
    });
    if (res.ok) {
      router.push('/');
      router.refresh();
    } else {
      setError('Incorrect code. Try again.');
      setPin('');
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">
          CHTI: AI Innovators Network
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Enter the 7-digit access code to continue
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={7}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, '').slice(0, 7));
              setError('');
            }}
            placeholder="•••••••"
            className="mb-2 w-full rounded border border-slate-300 px-4 py-3 text-center text-lg tracking-[0.25em] outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
          {error && (
            <p className="mb-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded bg-slate-800 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
