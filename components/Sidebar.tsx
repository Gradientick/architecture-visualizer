'use client';

import { useState } from 'react';
import type { ArchitectureGraph } from '@/lib/prompts';
import type { FileTreeNode } from '@/lib/analyzer';

type Tab = 'local' | 'url';

type Phase =
  | { type: 'idle' }
  | { type: 'reading-tree' }
  | { type: 'detecting-stack' }
  | { type: 'generating-diagram' }
  | { type: 'done' }
  | { type: 'error'; message: string };

interface SidebarProps {
  initialPath?: string;
  onAnalysisComplete: (graph: ArchitectureGraph, title: string, extras?: { fileTree?: FileTreeNode }) => void;
  phase: Phase;
  setPhase: (phase: Phase) => void;
}

const PHASE_MESSAGES: Record<string, string> = {
  'reading-tree': 'Reading file structure...',
  'detecting-stack': 'Detecting tech stack...',
  'generating-diagram': 'Generating architecture diagram...',
};

export default function Sidebar({
  initialPath,
  onAnalysisComplete,
  phase,
  setPhase,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>('local');
  const [localPath, setLocalPath] = useState(initialPath ?? '');
  const [url, setUrl] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');

  const isLoading =
    phase.type === 'reading-tree' ||
    phase.type === 'detecting-stack' ||
    phase.type === 'generating-diagram';

  const analyzeLocal = async () => {
    if (!localPath.trim()) return;
    setPhase({ type: 'reading-tree' });

    await new Promise((r) => setTimeout(r, 500));
    setPhase({ type: 'detecting-stack' });
    await new Promise((r) => setTimeout(r, 500));
    setPhase({ type: 'generating-diagram' });

    try {
      const res = await fetch('/api/analyze-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: localPath.trim(), customInstructions: customInstructions.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPhase({ type: 'error', message: data.error ?? 'Analysis failed' });
        return;
      }

      setPhase({ type: 'done' });
      // Use the last folder name as the title
      const title = localPath.split('/').filter(Boolean).pop() || localPath;
      onAnalysisComplete(data.graph, title, { fileTree: data.tree });
    } catch {
      setPhase({ type: 'error', message: 'Network error — is the server running?' });
    }
  };

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setPhase({ type: 'reading-tree' });
    await new Promise((r) => setTimeout(r, 300));
    setPhase({ type: 'generating-diagram' });

    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), customInstructions: customInstructions.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPhase({ type: 'error', message: data.error ?? 'Analysis failed' });
        return;
      }

      setPhase({ type: 'done' });
      let title = url;
      try { title = new URL(url).hostname; } catch {}
      onAnalysisComplete(data.graph, title);
    } catch {
      setPhase({ type: 'error', message: 'Network error — is the server running?' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (tab === 'local') analyzeLocal();
      else analyzeUrl();
    }
  };

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-[#0d0d0d] border-r border-[#1a1a1a] h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="text-white font-semibold text-sm tracking-tight">
            Arch Visualizer
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {(['local', 'url'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'text-white border-b-2 border-[#6366f1]'
                : 'text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            {t === 'local' ? '📁 Local Directory' : '🌐 Website URL'}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 flex-1">
        {tab === 'local' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[#52525b] text-xs uppercase tracking-wider">
                Directory Path
              </label>
              <input
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="/path/to/your/project"
                className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-xs font-mono placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1] transition-colors"
                disabled={isLoading}
              />
              <p className="text-[#3f3f46] text-[10px]">
                Tip: run <code className="text-[#52525b]">npx architecture-visualizer ./my-app</code> to auto-fill this.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[#52525b] text-[10px] uppercase tracking-wider">
                Custom Instructions <span className="opacity-60">(Optional)</span>
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. 'Note: the MQ dashboard is for dev purposes only...'"
                className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#a1a1aa] text-[11px] placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1] transition-colors resize-none h-16"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={analyzeLocal}
              disabled={isLoading || !localPath.trim()}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#1a1a1a] disabled:text-[#3f3f46] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Codebase'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[#52525b] text-xs uppercase tracking-wider">
                Website URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white text-xs font-mono placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1] transition-colors"
                disabled={isLoading}
              />
              <p className="text-[#3f3f46] text-[10px]">
                Backend components will be marked as "inferred" (dashed border).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[#52525b] text-[10px] uppercase tracking-wider">
                Custom Instructions <span className="opacity-60">(Optional)</span>
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. 'Note: this site uses a headless CMS...'"
                className="w-full bg-[#111111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[#a1a1aa] text-[11px] placeholder-[#3f3f46] focus:outline-none focus:border-[#6366f1] transition-colors resize-none h-16"
                disabled={isLoading}
              />
            </div>

            <button
              onClick={analyzeUrl}
              disabled={isLoading || !url.trim()}
              className="w-full bg-[#6366f1] hover:bg-[#4f46e5] disabled:bg-[#1a1a1a] disabled:text-[#3f3f46] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Website'}
            </button>
          </div>
        )}

        {/* Phase progress indicator */}
        {isLoading && (
          <div className="mt-6 space-y-2">
            {(['reading-tree', 'detecting-stack', 'generating-diagram'] as const).map((p, i) => {
              const phases = ['reading-tree', 'detecting-stack', 'generating-diagram'];
              const currentIndex = phases.indexOf(phase.type as typeof p);
              const thisIndex = i;
              const isDone = currentIndex > thisIndex;
              const isCurrent = currentIndex === thisIndex;

              return (
                <div key={p} className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                      isDone
                        ? 'bg-[#22c55e] text-white'
                        : isCurrent
                        ? 'bg-[#6366f1] text-white animate-pulse'
                        : 'bg-[#1a1a1a] text-[#3f3f46]'
                    }`}
                  >
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span
                    className={`text-xs ${
                      isCurrent ? 'text-[#a1a1aa]' : isDone ? 'text-[#52525b] line-through' : 'text-[#3f3f46]'
                    }`}
                  >
                    {PHASE_MESSAGES[p]}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Error state */}
        {phase.type === 'error' && (
          <div className="mt-4 bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2.5">
            <p className="text-red-400 text-xs">{phase.message}</p>
            <button
              onClick={() => setPhase({ type: 'idle' })}
              className="text-red-600 hover:text-red-400 text-[10px] mt-1 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success state */}
        {phase.type === 'done' && (
          <div className="mt-4 bg-green-950/30 border border-green-800/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-green-500 text-sm">✓</span>
            <span className="text-green-400 text-xs">Analysis complete</span>
          </div>
        )}

        <div className="mt-8 border-t border-[#1a1a1a] pt-6">
          <button
            onClick={() => {
              onAnalysisComplete(
                { nodes: [], edges: [], techStack: [], summary: 'Manually created architecture' },
                'Blank Architecture'
              );
            }}
            className="w-full bg-[#111111] border border-[#2a2a2a] hover:bg-[#1a1a1a] hover:border-[#3f3f46] text-[#a1a1aa] hover:text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>+</span> Start Blank Architecture
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1a1a1a] flex flex-col gap-2">
        <a
          href="/setup"
          className="text-[#3f3f46] hover:text-[#71717a] text-[10px] transition-colors"
        >
          ⚙ Update API key
        </a>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              const { exportWorkEnvironment } = await import('@/lib/export');
              await exportWorkEnvironment();
            }}
            className="text-[#3f3f46] hover:text-[#71717a] text-[10px] transition-colors"
          >
            ↓ Export Workspace
          </button>
          <label className="text-[#3f3f46] hover:text-[#71717a] text-[10px] transition-colors cursor-pointer">
            ↑ Import Workspace
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const { importWorkEnvironment } = await import('@/lib/export');
                  await importWorkEnvironment(file);
                  // Reload the page to load new sessions from DB
                  window.location.reload();
                }
              }} 
            />
          </label>
        </div>
      </div>
    </aside>
  );
}
