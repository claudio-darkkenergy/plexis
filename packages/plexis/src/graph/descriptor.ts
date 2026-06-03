import type {
  GraphDescriptor, GraphNode, GraphEdge, GraphNodeRef,
  GraphAttachment, WhenDef, OnDef, PipelineNodeDef, PipelineForkDef,
} from '../types.js';

export function buildDomainDescriptor(
  domainId: string,
  whens: Record<string, WhenDef<any>>,
  initial: string
): GraphDescriptor {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const entryNodes: GraphNodeRef[] = [];
  const terminalNodes: GraphNodeRef[] = [];
  const attachments: GraphAttachment[] = [];

  for (const [phaseId, whenDef] of Object.entries(whens)) {
    const ref: GraphNodeRef = { kind: 'domain-phase', domainId, nodeId: phaseId };
    nodes.push({
      ref,
      id: phaseId,
      terminal: whenDef.terminal ?? false,
      entry: phaseId === initial,
      metadata: whenDef.metadata,
    });
    if (phaseId === initial) entryNodes.push(ref);
    if (whenDef.terminal) terminalNodes.push(ref);

    if (whenDef.pipeline) {
      attachments.push({
        kind: 'phase-entry-pipeline',
        owner: ref,
        pipeline: { kind: 'pipeline', pipelineId: whenDef.pipeline.id },
      });
    }

    for (const [event, onDef] of Object.entries((whenDef.on ?? {}) as Record<string, OnDef<any>>)) {
      const edgeId = `${phaseId}:${event}`;
      const flowRef: GraphNodeRef = { kind: 'domain-event', domainId, edgeId };
      edges.push({
        id: edgeId,
        from: ref,
        to: { kind: 'domain-phase', domainId, nodeId: onDef.target },
        kind: 'domain-event',
        event,
        label: (onDef.metadata as Record<string, string> | undefined)?.label,
        guard: onDef.guard ? 'guard' : undefined,
        metadata: onDef.metadata,
      });

      if (onDef.pipeline) {
        attachments.push({
          kind: 'edge-pipeline',
          owner: flowRef,
          pipeline: { kind: 'pipeline', pipelineId: onDef.pipeline.id },
        });
      }
    }
  }

  return { id: domainId, kind: 'domain', nodes, edges, entryNodes, terminalNodes, attachments };
}

export function buildPipelineDescriptor(
  pipelineId: string,
  nodes: Record<string, PipelineNodeDef<any>>,
  initial: string
): GraphDescriptor {
  const graphNodes: GraphNode[] = [];
  const graphEdges: GraphEdge[] = [];
  const entryNodes: GraphNodeRef[] = [];
  const terminalNodes: GraphNodeRef[] = [];
  const attachments: GraphAttachment[] = [];

  for (const [nodeId, nodeDef] of Object.entries(nodes)) {
    const ref: GraphNodeRef = { kind: 'pipeline-node', pipelineId, nodeId };
    graphNodes.push({
      ref,
      id: nodeId,
      terminal: nodeDef.terminal ?? false,
      entry: nodeId === initial,
      metadata: nodeDef.metadata,
    });
    if (nodeId === initial) entryNodes.push(ref);
    if (nodeDef.terminal) terminalNodes.push(ref);

    for (let i = 0; i < (nodeDef.forks ?? []).length; i++) {
      const forkDef = nodeDef.forks![i] as PipelineForkDef<any>;
      const forkId = `${nodeId}:fork:${i}`;
      const forkRef: GraphNodeRef = { kind: 'pipeline-fork', pipelineId, forkId };

      let toRef: GraphNodeRef;
      if (typeof forkDef.target === 'string') {
        toRef = { kind: 'pipeline-node', pipelineId, nodeId: forkDef.target };
      } else {
        toRef = { kind: 'pipeline', pipelineId: forkDef.target.id };
        attachments.push({
          kind: 'subpipeline',
          owner: forkRef,
          pipeline: { kind: 'pipeline', pipelineId: forkDef.target.id },
        });
      }

      graphEdges.push({
        id: forkId,
        from: ref,
        to: toRef,
        kind: 'pipeline-fork',
        label: forkDef.label,
        condition: forkDef.condition ? 'condition' : undefined,
        metadata: forkDef.metadata,
      });
    }
  }

  return { id: pipelineId, kind: 'pipeline', nodes: graphNodes, edges: graphEdges, entryNodes, terminalNodes, attachments };
}
