import type {
  GraphDescriptor, GraphEdge, GraphNode, GraphNodeRef,
  GraphPath, PathQueryOptions, DomainGraph, PipelineGraph,
} from '../types.js';

export function inbound(descriptor: GraphDescriptor, id: string): GraphEdge[] {
  return descriptor.edges.filter(e => e.to.nodeId === id);
}

export function outbound(descriptor: GraphDescriptor, id: string): GraphEdge[] {
  return descriptor.edges.filter(e => e.from.nodeId === id);
}

export function reachableFrom(descriptor: GraphDescriptor, startId: string, options: PathQueryOptions = {}): GraphNode[] {
  const { maxDepth = Infinity } = options;
  const visited = new Set<string>();
  const result: GraphNode[] = [];
  const queue: Array<{ id: string; depth: number }> = [{ id: startId, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    if (id !== startId) {
      const found = descriptor.nodes.find(n => n.id === id);
      if (found) result.push(found);
    }

    if (depth < maxDepth) {
      for (const edge of outbound(descriptor, id)) {
        if (edge.to.nodeId && !visited.has(edge.to.nodeId)) {
          queue.push({ id: edge.to.nodeId, depth: depth + 1 });
        }
      }
    }
  }

  return result;
}

export function pathsFrom(descriptor: GraphDescriptor, startId: string, options: PathQueryOptions = {}): GraphPath[] {
  const { maxDepth = Infinity } = options;
  const terminalIds = new Set(descriptor.terminalNodes.map(r => r.nodeId));
  const paths: GraphPath[] = [];

  function dfs(currentId: string, visited: Set<string>, pathNodes: string[], pathEdges: GraphEdge[]): void {
    if (visited.size > maxDepth + 1) return;
    if (terminalIds.has(currentId) && currentId !== startId) {
      const fromRef = descriptor.nodes.find(n => n.id === startId)?.ref;
      const toRef = descriptor.nodes.find(n => n.id === currentId)?.ref;
      paths.push({
        id: `${startId}->${currentId}:${paths.length}`,
        from: fromRef as GraphNodeRef,
        to: toRef as GraphNodeRef,
        nodes: pathNodes.map(id => descriptor.nodes.find(n => n.id === id)?.ref).filter((r): r is GraphNodeRef => r !== undefined),
        edges: [...pathEdges],
        labels: pathEdges.map(e => e.label).filter((l): l is string => l !== undefined),
        crossesBoundaries: false,
      });
      return;
    }
    for (const edge of outbound(descriptor, currentId)) {
      if (edge.to.nodeId && !visited.has(edge.to.nodeId)) {
        const nextVisited = new Set(visited);
        nextVisited.add(edge.to.nodeId);
        dfs(edge.to.nodeId, nextVisited, [...pathNodes, edge.to.nodeId], [...pathEdges, edge]);
      }
    }
  }

  dfs(startId, new Set([startId]), [startId], []);
  return paths;
}

export function pathsTo(descriptor: GraphDescriptor, targetId: string, options: PathQueryOptions = {}): GraphPath[] {
  const { maxDepth = Infinity } = options;
  const entryIds = new Set(descriptor.entryNodes.map(r => r.nodeId));
  const paths: GraphPath[] = [];

  function dfs(currentId: string, visited: Set<string>, pathNodes: string[], pathEdges: GraphEdge[]): void {
    if (visited.size > maxDepth + 1) return;
    if (entryIds.has(currentId) && currentId !== targetId) {
      const fromRef = descriptor.nodes.find(n => n.id === currentId)?.ref;
      const toRef = descriptor.nodes.find(n => n.id === targetId)?.ref;
      const reversed = [...pathNodes].reverse();
      const reversedEdges = [...pathEdges].reverse();
      paths.push({
        id: `${currentId}->${targetId}:${paths.length}`,
        from: fromRef as GraphNodeRef,
        to: toRef as GraphNodeRef,
        nodes: reversed.map(id => descriptor.nodes.find(n => n.id === id)?.ref).filter((r): r is GraphNodeRef => r !== undefined),
        edges: reversedEdges,
        labels: reversedEdges.map(e => e.label).filter((l): l is string => l !== undefined),
        crossesBoundaries: false,
      });
      return;
    }
    for (const edge of inbound(descriptor, currentId)) {
      if (edge.from.nodeId && !visited.has(edge.from.nodeId)) {
        const nextVisited = new Set(visited);
        nextVisited.add(edge.from.nodeId);
        dfs(edge.from.nodeId, nextVisited, [...pathNodes, edge.from.nodeId], [...pathEdges, edge]);
      }
    }
  }

  dfs(targetId, new Set([targetId]), [targetId], []);
  return paths;
}

export function buildGraphAPI(descriptor: GraphDescriptor): DomainGraph & PipelineGraph {
  return {
    describe: () => descriptor,
    node: (id: string) => descriptor.nodes.find(n => n.id === id),
    inbound: (id: string) => inbound(descriptor, id),
    outbound: (id: string) => outbound(descriptor, id),
    pathsTo: (id: string, opts?: PathQueryOptions) => pathsTo(descriptor, id, opts),
    pathsFrom: (id: string, opts?: PathQueryOptions) => pathsFrom(descriptor, id, opts),
    reachableFrom: (id: string, opts?: PathQueryOptions) => reachableFrom(descriptor, id, opts),
    observedPathsTo: () => [],
    observedPathsFrom: () => [],
  };
}
