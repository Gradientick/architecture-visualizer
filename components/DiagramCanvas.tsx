'use client';

import { useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  MarkerType,
} from 'reactflow';
import ArchitectureNode, { type ArchitectureNodeData } from './nodes/ArchitectureNode';
import GroupNode from './nodes/GroupNode';
import ExportButton from './ExportButton';
import { useAppStore } from '@/lib/store';
import { getVisibleNodeIds } from '@/lib/search';
import { getConnectedPaths } from '@/lib/graph-utils';
import type { GraphNode, GraphEdge } from '@/lib/prompts';

// Register custom node types
const nodeTypes = {
  architectureNode: ArchitectureNode,
  groupNode: GroupNode,
};

interface DiagramCanvasProps {
  nodes: Node[];
  edges: Edge[];
  isLoading?: boolean;
  rawNodes?: GraphNode[];
  rawEdges?: GraphEdge[];
  tourFocusIds?: string[];
  onNodeSelect: (data: ArchitectureNodeData | null, id?: string) => void;
}

export default function DiagramCanvas({
  nodes,
  edges,
  isLoading,
  rawNodes = [],
  rawEdges = [],
  tourFocusIds = [],
  onNodeSelect,
}: DiagramCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { activeFilters, searchQuery, viewMode, tourActive, selectedNodeId } = useAppStore();

  // 1. Tag & Search filtering
  const visibleIds = useMemo(() => {
    const base = rawNodes.filter((n) => n.type === 'architectureNode');
    return getVisibleNodeIds(base as any, activeFilters, searchQuery);
  }, [rawNodes, activeFilters, searchQuery]);

  // 2. Path tracing (upstream/downstream of selected node)
  const pathIds = useMemo<Set<string> | null>(() => {
    if (!selectedNodeId) return null;
    return getConnectedPaths(selectedNodeId, rawEdges);
  }, [selectedNodeId, rawEdges]);

  // 3. Tour focusing
  const tourFocusedIds = useMemo<Set<string>>(() => {
    if (tourActive && tourFocusIds.length > 0) return new Set(tourFocusIds);
    return new Set();
  }, [tourActive, tourFocusIds]);

  const hasActiveFilter = activeFilters.length > 0 || searchQuery.length > 0;
  const hasTourFocus = tourFocusedIds.size > 0;
  const hasPathFocus = pathIds !== null;

  // Apply dim/focus CSS classes based on state
  const enrichedNodes: Node[] = useMemo(() => {
    return nodes.map((node) => {
      const isGroup = node.type === 'groupNode';
      const id = node.id;

      if (isGroup) {
        return { ...node, className: '' };
      }

      let className = '';

      if (hasTourFocus) {
        className = tourFocusedIds.has(id) ? 'rf-node-focused' : 'rf-node-dimmed';
      } else if (hasPathFocus) {
        className = pathIds.has(id) ? 'rf-node-focused' : 'rf-node-dimmed';
      } else if (hasActiveFilter) {
        className = visibleIds.has(id) ? '' : 'rf-node-dimmed';
      }

      return { ...node, className };
    });
  }, [nodes, hasTourFocus, hasPathFocus, hasActiveFilter, tourFocusedIds, pathIds, visibleIds]);

  // Edge dimming and dynamic styling
  const enrichedEdges: Edge[] = useMemo(() => {
    const edgeColor = viewMode === 'deep-dive' ? '#6366f1' : 'var(--border)';
    const edgeLabelBg = 'var(--bg-card)';

    return edges.map((edge) => {
      let isDimmed = false;

      if (hasTourFocus) {
        isDimmed = !tourFocusedIds.has(edge.source) || !tourFocusedIds.has(edge.target);
      } else if (hasPathFocus) {
        // Only show edges that connect nodes within the path
        isDimmed = !pathIds.has(edge.source) || !pathIds.has(edge.target);
      } else if (hasActiveFilter) {
        isDimmed = !visibleIds.has(edge.source) || !visibleIds.has(edge.target);
      }

      return {
        ...edge,
        markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        style: {
          ...edge.style,
          stroke: edgeColor,
          strokeWidth: viewMode === 'deep-dive' ? 2 : 1.5,
          opacity: isDimmed ? 0.05 : 1,
          transition: 'opacity 0.25s ease, stroke 0.25s ease',
        },
        labelStyle: { fill: 'var(--text-muted)', fontSize: 10 },
        labelBgStyle: { fill: edgeLabelBg, fillOpacity: 0.85 },
      };
    });
  }, [edges, hasTourFocus, hasPathFocus, hasActiveFilter, tourFocusedIds, pathIds, visibleIds, viewMode]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'groupNode') return;
      onNodeSelect(node.data as ArchitectureNodeData, node.id);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const hasContent = nodes.length > 0;

  return (
    <div ref={canvasRef} className="relative w-full h-full" style={{ background: 'var(--bg-primary)' }}>
      <ReactFlow
        nodes={enrichedNodes}
        edges={enrichedEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        panOnScroll
        zoomOnScroll
        minZoom={0.1}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'default' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="var(--border)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const cat = node.data?.category;
            const map: Record<string, string> = {
              frontend: '#3b82f6',
              backend: '#f97316',
              database: '#22c55e',
              infrastructure: '#a855f7',
              external: '#64748b',
              mobile: '#ec4899',
            };
            return map[cat] ?? '#3f3f46';
          }}
          maskColor="rgba(0,0,0,0.55)"
        />
      </ReactFlow>

      {/* Export button — top right */}
      {hasContent && canvasRef && (
        <div className="absolute top-3 right-3 z-10">
          <ExportButton canvasRef={canvasRef} />
        </div>
      )}

      {/* Empty state */}
      {!hasContent && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-6xl mb-4 opacity-20">🏗️</div>
          <p className="text-[var(--text-muted)] text-sm">
            Enter a path or URL in the sidebar to get started
          </p>
        </div>
      )}
    </div>
  );
}
