/**
 * lib/search.ts
 * Client-side fuzzy search and tag filter engine using Fuse.js.
 */

import Fuse, { IFuseOptions } from 'fuse.js';
import type { GraphNode } from './prompts';
import type { NodeCategory } from './store';

// ── Fuzzy search ──────────────────────────────────────────────────────────

let fuseInstance: Fuse<GraphNode> | null = null;

const FUSE_OPTIONS: IFuseOptions<GraphNode> = {
  keys: [
    { name: 'data.label', weight: 0.5 },
    { name: 'data.tech', weight: 0.3 },
    { name: 'data.subtitle', weight: 0.15 },
    { name: 'data.description', weight: 0.05 },
  ],
  threshold: 0.35,       // 0 = perfect match only, 1 = match anything
  includeScore: true,
  minMatchCharLength: 2,
};

/** Build (or rebuild) the Fuse index from a node array. */
export function buildSearchIndex(nodes: GraphNode[]): void {
  fuseInstance = new Fuse(nodes, FUSE_OPTIONS);
}

/**
 * Fuzzy-search nodes. Returns a Set of matching node IDs.
 * Empty query → all nodes match.
 */
export function fuzzySearch(query: string, nodes: GraphNode[]): Set<string> {
  if (!query.trim()) return new Set(nodes.map((n) => n.id));

  if (!fuseInstance) buildSearchIndex(nodes);

  const results = fuseInstance!.search(query);
  return new Set(results.map((r) => r.item.id));
}

// ── Tag filter ─────────────────────────────────────────────────────────────

/**
 * Filter nodes by active category tags.
 * Empty activeFilters → all nodes pass.
 */
export function filterByTags(
  activeTags: NodeCategory[],
  nodes: GraphNode[]
): Set<string> {
  if (activeTags.length === 0) return new Set(nodes.map((n) => n.id));
  return new Set(
    nodes
      .filter((n) => activeTags.includes(n.data.category as NodeCategory))
      .map((n) => n.id)
  );
}

/**
 * Combined filter: a node must pass BOTH tag filter and fuzzy search.
 * Returns a Set of visible node IDs.
 */
export function getVisibleNodeIds(
  nodes: GraphNode[],
  activeTags: NodeCategory[],
  searchQuery: string
): Set<string> {
  const byTag = filterByTags(activeTags, nodes);
  const bySearch = fuzzySearch(searchQuery, nodes);

  // Intersection
  return new Set([...byTag].filter((id) => bySearch.has(id)));
}
