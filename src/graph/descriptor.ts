import type {
  GraphDescriptor, GraphNode, GraphEdge, GraphNodeRef,
  GraphAttachment, StateNodeDef, EdgeDef, PipelineNodeDef, PipelineForkDef,
} from '../types.js';

export function buildDomainDescriptor(
  domainId: string,
  states: Record<string, StateNodeDef<any>>,
  initial: string
): GraphDescriptor {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const entryNodes: GraphNodeRef[] = [];
  const terminalNodes: GraphNodeRef[] = [];
  const attachments: GraphAttachment[] = [];

  for (const [stateId, stateDef] of Object.entries(states)) {
    const ref: GraphNodeRef = { kind: 'domain-state', domainId, nodeId: stateId };
    nodes.push({
      ref,
      id: stateId,
      terminal: stateDef.terminal ?? false,
      entry: stateId === initial,
      metadata: stateDef.metadata,
    });
    if (stateId === initial) entryNodes.push(ref);
    if (stateDef.terminal) terminalNodes.push(ref);

    if (stateDef.pipeline) {
      attachments.push({
        kind: 'state-entry-pipeline',
        owner: ref,
        pipeline: { kind: 'pipeline', pipelineId: stateDef.pipeline.id },
      });
    }

    for (const [event, edgeDef] of Object.entries((stateDef.edges ?? {}) as Record<string, EdgeDef<any>>)) {
      const edgeId = `${stateId}:${event}`;
      const edgeRef: GraphNodeRef = { kind: 'domain-edge', domainId, edgeId };
      edges.push({
        id: edgeId,
        from: ref,
        to: { kind: 'domain-state', domainId, nodeId: edgeDef.target },
        kind: 'domain-edge',
        event,
        label: (edgeDef.metadata as Record<string, string> | undefined)?.label,
        guard: edgeDef.guard ? 'guard' : undefined,
        metadata: edgeDef.metadata,
      });

      if (edgeDef.pipeline) {
        attachments.push({
          kind: 'edge-pipeline',
          owner: edgeRef,
          pipeline: { kind: 'pipeline', pipelineId: edgeDef.pipeline.id },
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
