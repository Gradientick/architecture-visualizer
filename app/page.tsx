'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { type Node, type Edge, MarkerType } from 'reactflow';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import TechStackPanel from '@/components/TechStackPanel';
import TopNavBar from '@/components/TopNavBar';
import TagFilterBar from '@/components/TagFilterBar';
import RightPanel from '@/components/RightPanel';
import { useAppStore } from '@/lib/store';
import type { ArchitectureGraph } from '@/lib/prompts';
import type { ArchitectureNodeData } from '@/components/nodes/ArchitectureNode';
import { autoCluster, layoutWithGroups } from '@/lib/clustering';
import type { FileTreeNode } from '@/lib/analyzer';
import { loadSessions, saveSessions, loadSessionExtras, saveSessionExtras, type SessionExtra } from '@/lib/storage';

// Dynamically import ReactFlow-dependent components to avoid SSR issues
const DiagramCanvas = dynamic(() => import('@/components/DiagramCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-[var(--text-muted)] text-sm">Loading canvas...</div>
    </div>
  ),
});

type Phase =
  | { type: 'idle' }
  | { type: 'reading-tree' }
  | { type: 'detecting-stack' }
  | { type: 'generating-diagram' }
  | { type: 'done' }
  | { type: 'error'; message: string };

function HomePageInner() {
  const searchParams = useSearchParams();
  const initialPath = searchParams.get('path') ?? '';

  const [phase, setPhase] = useState<Phase>({ type: 'idle' });
  const [sessionExtras, setSessionExtras] = useState<Record<string, SessionExtra>>({});
  const [selectedNodeData, setSelectedNodeData] = useState<ArchitectureNodeData | null>(null);
  const [tourFocusIds, setTourFocusIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const {
    sessions,
    activeSessionId,
    addSession,
    removeSession,
    reorderSessions,
    setActiveSession,
    theme,
    setTheme,
    viewMode,
  } = useAppStore();

  // Load persisted sessions on mount
  useEffect(() => {
    async function loadData() {
      const storedSessions = await loadSessions();
      if (storedSessions.length > 0) {
        // Hydrate store directly
        useAppStore.setState({ 
          sessions: storedSessions, 
          activeSessionId: storedSessions[storedSessions.length - 1].id 
        });
        
        // Load extras (file trees)
        const extrasMap: Record<string, SessionExtra> = {};
        for (const s of storedSessions) {
          const e = await loadSessionExtras(s.id);
          if (e) extrasMap[s.id] = e;
        }
        setSessionExtras(extrasMap);
      }
      setIsLoaded(true);
    }
    loadData();
  }, []);

  // Save sessions when they change
  useEffect(() => {
    if (isLoaded) {
      saveSessions(sessions);
    }
  }, [sessions, isLoaded]);

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Check if setup is needed on first load
  useEffect(() => {
    fetch('/api/check-config')
      .then((res) => res.json())
      .then((data) => {
        if (!data.configured) {
          window.location.href = '/setup';
        }
      })
      .catch(() => {});
  }, []);

  const handleAnalysisComplete = useCallback(
    (newGraph: ArchitectureGraph, title: string, extras?: SessionExtra) => {
      const sessionId = Date.now().toString();
      addSession({ id: sessionId, title, graph: newGraph, createdAt: Date.now() });
      if (extras) {
        setSessionExtras((prev) => ({ ...prev, [sessionId]: extras }));
        saveSessionExtras(sessionId, extras);
      }
    },
    [addSession]
  );

  const closeSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSession(id);
    setSessionExtras((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Drag and drop for reordering tabs
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('tabIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    const dragIndexStr = e.dataTransfer.getData('tabIndex');
    if (!dragIndexStr) return;
    const dragIndex = parseInt(dragIndexStr, 10);
    if (dragIndex === dropIndex) return;
    reorderSessions(dragIndex, dropIndex);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const graph: ArchitectureGraph | null = activeSession?.graph ?? null;
  const activeExtras = activeSessionId ? sessionExtras[activeSessionId] : undefined;

  // Build React Flow nodes/edges — apply clustering if groups are present
  const { rfNodes, rfEdges } = (() => {
    if (!graph) return { rfNodes: [], rfEdges: [] };

    const groups = graph.groups && graph.groups.length > 0
      ? graph.groups
      : autoCluster(graph.nodes);

    const { groupNodes, updatedNodes } = layoutWithGroups(groups, graph.nodes);

    // Merge: group containers first, then children (React Flow renders in order)
    const allNodes: Node[] = [
      ...groupNodes.map((g) => ({
        id: g.id,
        type: 'groupNode',
        position: g.position,
        data: g.data,
        style: (g as any).style,
        selectable: false,
      })),
      ...updatedNodes.map((n) => ({
        ...n,
        type: 'architectureNode',
      })),
    ];

    const edges: Edge[] = graph.edges.map((e) => ({
      ...e,
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3f3f46' },
    }));

    return { rfNodes: allNodes, rfEdges: edges };
  })();

  const isLoading =
    phase.type === 'reading-tree' ||
    phase.type === 'detecting-stack' ||
    phase.type === 'generating-diagram';

  const activeTitle = activeSession?.title;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Top Navigation Bar */}
      <TopNavBar projectName={activeTitle} />

      {/* Tag Filter Bar — only show when a project is loaded */}
      {graph && <TagFilterBar />}

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar */}
        <Sidebar
          initialPath={initialPath}
          onAnalysisComplete={handleAnalysisComplete}
          phase={phase}
          setPhase={setPhase}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: 'var(--bg-primary)' }}>

          {/* Tab Bar */}
          {sessions.length > 0 && (
            <div
              className="h-10 border-b flex items-center overflow-x-auto select-none shrink-0 scrollbar-hide"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}
            >
              {sessions.map((s, index) => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => {
                      setActiveSession(s.id);
                      setSelectedNodeData(null);
                      useAppStore.getState().setSelectedNodeId(null);
                    }}
                    className={`
                      group flex items-center gap-3 px-4 h-full border-r cursor-pointer min-w-[120px] max-w-[200px] transition-colors relative
                    `}
                    style={{
                      borderColor: 'var(--border)',
                      background: isActive ? 'var(--bg-secondary)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: 'var(--accent)' }} />
                    )}
                    <span className="text-[12px] font-medium truncate flex-1">{s.title}</span>
                    <button
                      onClick={(e) => closeSession(s.id, e)}
                      className="w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--bg-card)]"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Canvas + right panel row */}
          <div className="flex-1 relative flex overflow-hidden">
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ background: 'var(--bg-primary)cc' }}>
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin h-8 w-8" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-[var(--text-muted)] text-sm">
                    {phase.type === 'reading-tree' && 'Reading file structure...'}
                    {phase.type === 'detecting-stack' && 'Detecting tech stack...'}
                    {phase.type === 'generating-diagram' && 'Generating architecture diagram...'}
                  </span>
                </div>
              </div>
            )}

            {/* Diagram canvas */}
            <div className="flex-1 relative flex flex-col overflow-hidden">
              {activeSessionId ? (
                <div className="flex-1 relative overflow-hidden" key={activeSessionId}>
                  <DiagramCanvas
                    nodes={rfNodes}
                    edges={rfEdges}
                    isLoading={isLoading}
                    rawNodes={graph?.nodes ?? []}
                    rawEdges={graph?.edges ?? []}
                    tourFocusIds={tourFocusIds}
                    onNodeSelect={(data, id) => {
                      setSelectedNodeData(data);
                      useAppStore.getState().setSelectedNodeId(id || null);
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
                    >
                      <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      No Projects Loaded
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      Analyze a local directory or website URL to begin.
                    </p>
                  </div>
                </div>
              )}

              {/* Tech stack panel */}
              {graph && (
                <TechStackPanel
                  techStack={graph.techStack ?? []}
                  summary={graph.summary}
                />
              )}
            </div>

            {/* Right Panel (INFO / FILES + Tour) */}
            <div className="relative flex-shrink-0">
              <RightPanel
                nodeData={selectedNodeData}
                onClose={() => {
                  setSelectedNodeData(null);
                  useAppStore.getState().setSelectedNodeId(null);
                }}
                tourSteps={graph?.tour}
                fileTree={activeExtras?.fileTree ?? null}
                onTourFocusNodes={setTourFocusIds}
                projectSummary={graph?.summary}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
          <div style={{ color: 'var(--text-muted)' }} className="text-sm">
            Loading...
          </div>
        </div>
      }
    >
      <HomePageInner />
    </Suspense>
  );
}
