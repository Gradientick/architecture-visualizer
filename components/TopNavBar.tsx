'use client';

import { useAppStore, type ViewMode, type ThemeId } from '@/lib/store';

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'overview',   label: 'Overview' },
  { id: 'learn',      label: 'Learn' },
  { id: 'deep-dive',  label: 'Deep Dive' },
  { id: 'diff',       label: 'Diff' },
];

const THEMES: { id: ThemeId; label: string; dot: string }[] = [
  { id: 'midnight',  label: 'Midnight',  dot: '#6366f1' },
  { id: 'warm-dark', label: 'Warm',      dot: '#d97706' },
  { id: 'light',     label: 'Light',     dot: '#f4f4f5' },
];

interface TopNavBarProps {
  projectName?: string;
}

export default function TopNavBar({ projectName }: TopNavBarProps) {
  const { viewMode, setViewMode, theme, setTheme } = useAppStore();
  const isDiff = viewMode === 'diff';

  return (
    <div className="h-11 flex items-center border-b border-[var(--border)] bg-[var(--bg-primary)] px-4 gap-6 flex-shrink-0 select-none z-30">
      {/* Logo / Project name */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <span className="text-base leading-none">🔍</span>
        <span className="text-white font-semibold text-sm tracking-tight truncate max-w-[180px]">
          {projectName ?? 'Architecture Visualizer'}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--border)] flex-shrink-0" />

      {/* View mode tabs */}
      <nav className="flex items-center gap-0.5">
        {VIEW_MODES.map((mode) => {
          const isActive = viewMode === mode.id;
          const isDiffMode = mode.id === 'diff';
          return (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`
                relative px-3 py-1 rounded-md text-[13px] font-medium transition-all duration-150
                ${isActive
                  ? 'text-white bg-[var(--bg-card)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }
              `}
            >
              {isDiffMode ? (
                <span className="flex items-center gap-1.5">
                  Diff
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isDiff
                        ? 'bg-[#6366f120] text-[#6366f1]'
                        : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                    }`}
                  >
                    {isDiff ? 'ON' : 'OFF'}
                  </span>
                </span>
              ) : (
                mode.label
              )}
              {/* Active underline */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--accent)] rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme selector */}
      <div className="flex items-center gap-1">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            title={t.label}
            className={`
              w-6 h-6 rounded-full border-2 transition-all duration-150
              ${theme === t.id ? 'border-[var(--accent)] scale-110' : 'border-transparent hover:border-[var(--border)]'}
            `}
            style={{ background: t.dot }}
          />
        ))}
        <span className="text-[11px] text-[var(--text-muted)] ml-1 hidden lg:block">Theme</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--border)] flex-shrink-0" />

      {/* Keyboard shortcut hint */}
      <span className="text-[11px] text-[var(--text-muted)] hidden xl:block">
        Press <kbd className="font-mono text-[10px] bg-[var(--bg-card)] border border-[var(--border)] rounded px-1 py-0.5">?</kbd> for shortcuts
      </span>
    </div>
  );
}
