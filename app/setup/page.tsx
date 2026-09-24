'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Validation failed');
        return;
      }

      // Success — redirect to main app
      router.push('/');
    } catch {
      setStatus('error');
      setErrorMsg('Network error — is the server running?');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md px-4">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Architecture Visualizer
          </h1>
          <p className="text-[#71717a] mt-2 text-sm">
            Generate interactive architecture diagrams from any codebase.
          </p>
        </div>

        {/* Setup Card */}
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-8">
          <h2 className="text-white font-semibold text-lg mb-1">Welcome — Let&apos;s get set up</h2>
          <p className="text-[#71717a] text-sm mb-6">
            We need your Gemini API key to analyze codebases. It&apos;s stored locally on your machine only.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#a1a1aa] text-xs font-medium mb-2 uppercase tracking-wider">
                Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm font-mono placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1] transition-colors"
                required
                autoFocus
              />
            </div>

            {status === 'error' && (
              <div className="bg-red-950/50 border border-red-800/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !apiKey.trim()}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#2a2a2a] disabled:text-[#52525b] text-white font-medium py-3 rounded-lg transition-colors text-sm"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validating...
                </span>
              ) : (
                'Validate & Save Key'
              )}
            </button>
          </form>

          <p className="text-[#52525b] text-xs mt-6 text-center">
            Need a key?{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6366f1] hover:underline"
            >
              Get one free from Google AI Studio →
            </a>
          </p>
        </div>

        <p className="text-[#3f3f46] text-xs text-center mt-4">
          Key is stored locally in ~/.arch-viz/config.json — never sent anywhere except Google&apos;s API.
        </p>
      </div>
    </div>
  );
}
