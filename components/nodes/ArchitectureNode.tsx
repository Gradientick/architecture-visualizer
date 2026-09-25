'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from 'reactflow';
import { useAppStore, type NodeCategory } from '@/lib/store';

export interface ArchitectureNodeData {
  label: string;
  subtitle: string;
  description: string;
  category: NodeCategory;
  tech: string;
  confidence: 'confirmed' | 'inferred';
  icon?: string;
  inputSchema?: string;
  outputSchema?: string;
}

const CATEGORY_STYLES: Record<NodeCategory, { border: string; accent: string; badge: string }> = {
  frontend:       { border: '#3b82f6', accent: '#3b82f61a', badge: '#3b82f633 text-blue-300' },
  backend:        { border: '#f97316', accent: '#f973161a', badge: '#f9731633 text-orange-300' },
  database:       { border: '#22c55e', accent: '#22c55e1a', badge: '#22c55e33 text-green-300' },
  infrastructure: { border: '#a855f7', accent: '#a855f71a', badge: '#a855f733 text-purple-300' },
  external:       { border: '#64748b', accent: '#64748b1a', badge: '#64748b33 text-slate-300' },
  mobile:         { border: '#ec4899', accent: '#ec48991a', badge: '#ec489933 text-pink-300' },
  user:           { border: '#06b6d4', accent: '#06b6d41a', badge: '#06b6d433 text-cyan-300' },
  process:        { border: '#f59e0b', accent: '#f59e0b1a', badge: '#f59e0b33 text-amber-300' },
  mockup:         { border: '#6366f1', accent: '#6366f11a', badge: '#6366f133 text-indigo-300' },
};

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  frontend:       'Frontend',
  backend:        'Backend',
  database:       'Database',
  infrastructure: 'Infrastructure',
  external:       'External',
  mobile:         'Mobile',
  user:           'User / Actor',
  process:        'Process / Step',
  mockup:         'UI / Screen',
};

function ArchitectureNode({ id, data, selected }: NodeProps<ArchitectureNodeData>) {
  const { viewMode } = useAppStore();
  const { getEdges } = useReactFlow();
  
  const styles = CATEGORY_STYLES[data.category] ?? CATEGORY_STYLES.external;
  const isInferred = data.confidence === 'inferred';
  const isDeepDive = viewMode === 'deep-dive';

  // Calculate connection count (optional extra detail for deep dive)
  const connectionCount = isDeepDive
    ? getEdges().filter(e => e.source === id || e.target === id).length
    : 0;

  return (
    <div
      className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
        selected ? 'scale-[1.02] shadow-lg shadow-black/50 z-10' : 'z-0'
      }`}
      style={{
        background: 'var(--bg-card)',
        border: `1px ${isInferred ? 'dashed' : 'solid'} ${styles.border}`,
        boxShadow: selected
          ? `0 0 0 2px ${styles.border}40, 0 8px 32px rgba(0,0,0,0.5)`
          : '0 2px 8px rgba(0,0,0,0.4)',
        width: isDeepDive ? 280 : 220,
        minWidth: isDeepDive ? 280 : 180,
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: styles.border }}
      />

      {/* Card content */}
      <div className="p-3" style={{ background: styles.accent }}>
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {data.icon && (
            <span className="text-xl leading-none mt-0.5 flex-shrink-0">{data.icon}</span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
              {data.label}
            </p>
            <p className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
              {data.subtitle}
            </p>
          </div>
          {isDeepDive && (
            <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5 -mt-1 -mr-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>

        {/* Deep Dive extended info */}
        {isDeepDive && data.description && (
          <div className="mt-3 mb-3 pb-3 border-b border-[var(--border)] border-opacity-50">
            <p className="text-[11px] leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
              {data.description}
            </p>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md mix-blend-lighten" style={{ background: styles.badge.split(' ')[0], color: styles.border }}>
            {CATEGORY_LABELS[data.category]}
          </span>
          <div className="flex items-center gap-2">
            {isDeepDive && connectionCount > 0 && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {connectionCount} {connectionCount === 1 ? 'link' : 'links'}
              </span>
            )}
            {isInferred && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <span>~</span>
                <span>inferred</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* React Flow handles — invisible but functional */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[var(--text-muted)] !border-[var(--border)]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[var(--text-muted)] !border-[var(--border)]"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !bg-[var(--text-muted)] !border-[var(--border)]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !bg-[var(--text-muted)] !border-[var(--border)]"
      />
    </div>
  );
}

export default memo(ArchitectureNode);
