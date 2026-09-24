import type { GraphEdge } from './prompts';

/**
 * Returns a Set of node IDs representing all nodes that are reachable
 * by following edges backwards from the given startNodeId.
 */
export function traceUpstream(startNodeId: string, edges: GraphEdge[]): Set<string> {
  const upstream = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    upstream.add(current);

    // Find all edges that target the current node (i.e. incoming)
    for (const edge of edges) {
      if (edge.target === current && !upstream.has(edge.source)) {
        queue.push(edge.source);
      }
    }
  }

  return upstream;
}

/**
 * Returns a Set of node IDs representing all nodes that are reachable
 * by following edges forwards from the given startNodeId.
 */
export function traceDownstream(startNodeId: string, edges: GraphEdge[]): Set<string> {
  const downstream = new Set<string>();
  const queue = [startNodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    downstream.add(current);

    // Find all edges that source from the current node (i.e. outgoing)
    for (const edge of edges) {
      if (edge.source === current && !downstream.has(edge.target)) {
        queue.push(edge.target);
      }
    }
  }

  return downstream;
}

/**
 * Returns a Set of node IDs including the start node and all nodes connected
 * to it both upstream and downstream.
 */
export function getConnectedPaths(startNodeId: string, edges: GraphEdge[]): Set<string> {
  const up = traceUpstream(startNodeId, edges);
  const down = traceDownstream(startNodeId, edges);
  
  return new Set([...up, ...down]);
}
