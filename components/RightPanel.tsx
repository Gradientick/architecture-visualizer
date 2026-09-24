'use client';

import { useAppStore } from '@/lib/store';
import type { ArchitectureNodeData } from './nodes/ArchitectureNode';
import type { TourStep } from '@/lib/prompts';
import type { FileTreeNode } from '@/lib/analyzer';
import TourPanel from './TourPanel';

interface RightPanelProps {
  nodeData: ArchitectureNodeData | null;
  onClose: () => void;
  tourSteps?: TourStep[];
  fileTree?: FileTreeNode | null;
  onTourFocusNodes: (nodeIds: string[]) => void;
  projectSummary?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  frontend: '#3b82f6',
  backend: '#f97316',
  database: '#22c55e',
  infrastructure: '#a855f7',
  external: '#64748b',
  mobile: '#ec4899',
};

const CATEGORY_LABELS: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  infrastructure: 'Infrastructure',
  external: 'External',
  mobile: 'Mobile',
};

function FileTreeItem({ node, depth = 0 }: { node: FileTreeNode; depth?: number }) {
  const isDir = node.type === 'directory';
  const icon = isDir ? '📁' : '📄';
  const indent = depth * 14;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 rounded px-1 hover:bg-[var(--bg-card)] cursor-default"
        style={{ paddingLeft: `${4 + indent}px` }}
      >
        <span className="text-[11px] leading-none">{icon}</span>
        <span className={`text-[11px] ${isDir ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
          {node.name}
        </span>
      </div>
      {node.children?.map((child) => (
        <FileTreeItem key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function RightPanel({
  nodeData,
  onClose,
  tourSteps,
  fileTree,
  onTourFocusNodes,
  projectSummary,
}: RightPanelProps) {
  const { rightPanelTab, setRightPanelTab, rightPanelOpen, setRightPanelOpen, viewMode } = useAppStore();

  // Auto-switch to INFO when a node is selected
  const effectiveTab = rightPanelOpen ? rightPanelTab : null;

  return (
    <>
      {/* Toggle button (always visible) */}
      <button
        onClick={() => setRightPanelOpen(!rightPanelOpen)}
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 z-20
          w-5 h-10 flex items-center justify-center
          bg-[var(--bg-secondary)] border-l border-t border-b border-[var(--border)]
          rounded-l-md text-[var(--text-muted)] hover:text-white transition-all
          ${rightPanelOpen ? '' : 'translate-x-0'}
        `}
        title={rightPanelOpen ? 'Collapse panel' : 'Expand panel'}
      >
        <svg
          className={`w-3 h-3 transition-transform ${rightPanelOpen ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel */}
      {rightPanelOpen && (
        <div className="w-[300px] flex-shrink-0 flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border)] h-full overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--border)] flex-shrink-0">
            {(['info', 'files'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanelTab(tab)}
                className={`
                  flex-1 py-2.5 text-[12px] font-medium uppercase tracking-wider transition-colors
                  ${rightPanelTab === tab
                    ? 'text-white border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* ── INFO TAB ── */}
            {rightPanelTab === 'info' && (
              <>
                {/* Tour panel — show in learn mode or if there are tour steps */}
                {(viewMode === 'learn' || viewMode === 'overview') && tourSteps && tourSteps.length > 0 && (
                  <div className="mb-4">
                    <TourPanel steps={tourSteps} onFocusNodes={onTourFocusNodes} />
                  </div>
                )}

                {/* Node details — show when a node is selected */}
                {nodeData && (
                  <div className={tourSteps && tourSteps.length > 0 ? 'border-t border-[var(--border)] pt-4' : ''}>
                    {/* Accent bar */}
                    <div
                      className="h-1 w-full rounded-full mb-4"
                      style={{ background: CATEGORY_COLORS[nodeData.category] ?? '#64748b' }}
                    />

                    {/* Title area */}
                    <div className="flex items-start gap-3 mb-4">
                      {nodeData.icon && (
                        <div className="text-2xl leading-none flex-shrink-0">{nodeData.icon}</div>
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-base leading-tight">
                          {nodeData.label}
                        </h3>
                        <p className="text-[var(--text-muted)] text-[12px] mt-0.5">{nodeData.tech}</p>
                      </div>
                      <button
                        onClick={onClose}
                        className="ml-auto text-[var(--text-muted)] hover:text-white transition-colors p-1 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <h4 className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
                        Purpose & Responsibilities
                      </h4>
                      <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed">
                        {nodeData.description || 'No description available.'}
                      </p>
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 gap-3 bg-[var(--bg-card)] rounded-lg p-3 border border-[var(--border)]">
                      <div>
                        <span className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Category</span>
                        <span
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md"
                          style={{
                            background: `${CATEGORY_COLORS[nodeData.category]}20`,
                            color: CATEGORY_COLORS[nodeData.category],
                          }}
                        >
                          {CATEGORY_LABELS[nodeData.category]}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Confidence</span>
                        <span className={`text-[11px] font-medium ${nodeData.confidence === 'inferred' ? 'text-yellow-500' : 'text-green-500'}`}>
                          {nodeData.confidence === 'inferred' ? '~ Inferred' : '✓ Confirmed'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Role</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">{nodeData.subtitle}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty info state */}
                {!nodeData && (!tourSteps || tourSteps.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <span className="text-3xl mb-3 opacity-30">🖱️</span>
                    <p className="text-[var(--text-muted)] text-[12px]">
                      Click any node to see details
                    </p>
                    {projectSummary && (
                      <p className="text-[var(--text-muted)] text-[11px] mt-3 leading-relaxed">
                        {projectSummary}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── FILES TAB ── */}
            {rightPanelTab === 'files' && (
              <>
                {fileTree ? (
                  <div>
                    <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider mb-3">
                      Analyzed File Tree
                    </p>
                    <FileTreeItem node={fileTree} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <span className="text-3xl mb-3 opacity-30">📂</span>
                    <p className="text-[var(--text-muted)] text-[12px]">
                      Analyze a local directory to see the file tree
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
