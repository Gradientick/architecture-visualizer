/**
 * lib/store.ts
 * Global Zustand store — single source of truth for UI state that would
 * otherwise be prop-drilled across 10+ components.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ArchitectureGraph, GraphNode, GraphEdge } from './prompts';

// ── Types ──────────────────────────────────────────────────────────────────

export type ViewMode = 'overview' | 'learn' | 'deep-dive' | 'diff';

export type ThemeId = 'midnight' | 'warm-dark' | 'light';

export type NodeCategory =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'infrastructure'
  | 'external'
  | 'mobile'
  | 'user'
  | 'process'
  | 'mockup';

export interface ArchSession {
  id: string;
  title: string;
  graph: ArchitectureGraph;
  createdAt: number;
}

// ── Store interface ────────────────────────────────────────────────────────

interface AppStore {
  // Sessions / tabs
  sessions: ArchSession[];
  activeSessionId: string | null;
  addSession: (session: ArchSession) => void;
  removeSession: (id: string) => void;
  reorderSessions: (from: number, to: number) => void;
  setActiveSession: (id: string | null) => void;

  // Graph editing actions
  createBlankSession: (title: string) => void;
  addNodeToActiveSession: (node: GraphNode) => void;
  updateNodeInActiveSession: (id: string, data: Partial<GraphNode['data']>) => void;
  addEdgeToActiveSession: (edge: GraphEdge) => void;
  removeNodeFromActiveSession: (id: string) => void;
  removeEdgeFromActiveSession: (id: string) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Theme
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;

  // Active tag filters (empty = show all)
  activeFilters: NodeCategory[];
  toggleFilter: (cat: NodeCategory) => void;
  clearFilters: () => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Selected node id (for highlighting path tracing)
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // Tour mode
  tourActive: boolean;
  tourStepIndex: number;
  setTourActive: (active: boolean) => void;
  setTourStepIndex: (i: number) => void;

  // Right panel
  rightPanelTab: 'info' | 'files';
  setRightPanelTab: (tab: 'info' | 'files') => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;

  // Node Editing
  isEditingNode: boolean;
  setIsEditingNode: (editing: boolean) => void;
}

// ── Store implementation ───────────────────────────────────────────────────

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Sessions
      sessions: [],
      activeSessionId: null,
      addSession: (session) => {
        set((s) => ({
          sessions: [...s.sessions, session],
          activeSessionId: session.id,
        }));
      },
      removeSession: (id) => {
        set((s) => {
          const filtered = s.sessions.filter((sess) => sess.id !== id);
          const newActive =
            s.activeSessionId === id
              ? filtered.length > 0
                ? filtered[filtered.length - 1].id
                : null
              : s.activeSessionId;
          return { sessions: filtered, activeSessionId: newActive };
        });
      },
      reorderSessions: (from, to) => {
        set((s) => {
          const next = [...s.sessions];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved);
          return { sessions: next };
        });
      },
      setActiveSession: (id) => set({ activeSessionId: id }),

      // Graph editing actions
      createBlankSession: (title) => {
        const id = crypto.randomUUID();
        const newSession: ArchSession = {
          id,
          title,
          createdAt: Date.now(),
          graph: { nodes: [], edges: [], techStack: [], summary: 'Manually created architecture' },
        };
        set((s) => ({
          sessions: [...s.sessions, newSession],
          activeSessionId: id,
        }));
      },
      addNodeToActiveSession: (node) => {
        set((s) => {
          if (!s.activeSessionId) return s;
          const session = s.sessions.find((sess) => sess.id === s.activeSessionId);
          if (!session) return s;
          const newGraph = { ...session.graph, nodes: [...session.graph.nodes, node] };
          return {
            sessions: s.sessions.map((sess) =>
              sess.id === s.activeSessionId ? { ...sess, graph: newGraph } : sess
            ),
          };
        });
      },
      updateNodeInActiveSession: (id, data) => {
        set((s) => {
          if (!s.activeSessionId) return s;
          const session = s.sessions.find((sess) => sess.id === s.activeSessionId);
          if (!session) return s;
          const newNodes = session.graph.nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, ...data } } : n
          );
          const newGraph = { ...session.graph, nodes: newNodes };
          return {
            sessions: s.sessions.map((sess) =>
              sess.id === s.activeSessionId ? { ...sess, graph: newGraph } : sess
            ),
          };
        });
      },
      addEdgeToActiveSession: (edge) => {
        set((s) => {
          if (!s.activeSessionId) return s;
          const session = s.sessions.find((sess) => sess.id === s.activeSessionId);
          if (!session) return s;
          // Avoid duplicate edges
          if (session.graph.edges.find((e) => e.source === edge.source && e.target === edge.target)) return s;
          const newGraph = { ...session.graph, edges: [...session.graph.edges, edge] };
          return {
            sessions: s.sessions.map((sess) =>
              sess.id === s.activeSessionId ? { ...sess, graph: newGraph } : sess
            ),
          };
        });
      },
      removeNodeFromActiveSession: (id) => {
        set((s) => {
          if (!s.activeSessionId) return s;
          const session = s.sessions.find((sess) => sess.id === s.activeSessionId);
          if (!session) return s;
          const newNodes = session.graph.nodes.filter((n) => n.id !== id);
          // Also remove edges connected to this node
          const newEdges = session.graph.edges.filter((e) => e.source !== id && e.target !== id);
          const newGraph = { ...session.graph, nodes: newNodes, edges: newEdges };
          return {
            sessions: s.sessions.map((sess) =>
              sess.id === s.activeSessionId ? { ...sess, graph: newGraph } : sess
            ),
          };
        });
      },
      removeEdgeFromActiveSession: (id) => {
        set((s) => {
          if (!s.activeSessionId) return s;
          const session = s.sessions.find((sess) => sess.id === s.activeSessionId);
          if (!session) return s;
          const newEdges = session.graph.edges.filter((e) => e.id !== id);
          const newGraph = { ...session.graph, edges: newEdges };
          return {
            sessions: s.sessions.map((sess) =>
              sess.id === s.activeSessionId ? { ...sess, graph: newGraph } : sess
            ),
          };
        });
      },

      // View mode
      viewMode: 'overview',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Theme — persisted
      theme: 'midnight',
      setTheme: (theme) => {
        set({ theme });
        // Apply to document for CSS variable overrides
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', theme);
        }
      },

      // Filters
      activeFilters: [],
      toggleFilter: (cat) => {
        set((s) => ({
          activeFilters: s.activeFilters.includes(cat)
            ? s.activeFilters.filter((c) => c !== cat)
            : [...s.activeFilters, cat],
        }));
      },
      clearFilters: () => set({ activeFilters: [] }),

      // Search
      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      // Selected node
      selectedNodeId: null,
      setSelectedNodeId: (id) => set({ selectedNodeId: id }),

      // Tour
      tourActive: false,
      tourStepIndex: 0,
      setTourActive: (active) => set({ tourActive: active, tourStepIndex: 0 }),
      setTourStepIndex: (i) => set({ tourStepIndex: i }),

      // Right panel
      rightPanelTab: 'info',
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      rightPanelOpen: true,
      setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

      // Node Editing
      isEditingNode: false,
      setIsEditingNode: (editing) => set({ isEditingNode: editing, rightPanelOpen: true }),
    }),
    {
      name: 'arch-viz-store',
      // Only persist theme; sessions are large and have their own storage path
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);
