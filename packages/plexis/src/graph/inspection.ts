import { PlexisError } from '../core/errors.js';
import { inbound, outbound, pathsTo, pathsFrom, reachableFrom } from './paths.js';
import type { GraphDescriptor, GraphNodeRef, NodeInspection, PathQueryOptions, Pipeline } from '../types.js';

export function inspectNode(
  descriptor: GraphDescriptor,
  idOrRef: string | GraphNodeRef,
  options?: PathQueryOptions,
  attachedPipelines: Record<string, Pipeline<any>> = {}
): NodeInspection {
  let resolvedId: string | undefined;

  if (typeof idOrRef === 'string') {
    resolvedId = idOrRef;
  } else {
    // Cross-boundary ref — look up in attached pipeline
    if (idOrRef.kind === 'pipeline-node' && idOrRef.pipelineId !== descriptor.id) {
      const pipeline = attachedPipelines[idOrRef.pipelineId!];
      if (pipeline) {
        return inspectNode(pipeline.describe(), idOrRef.nodeId!, options, {});
      }
    }
    resolvedId = idOrRef.nodeId ?? idOrRef.edgeId ?? idOrRef.forkId;
  }

  const graphNode = descriptor.nodes.find(n => n.id === resolvedId);
  if (!graphNode) {
    throw PlexisError.unknownNode(descriptor.id, resolvedId ?? '');
  }

  const nodeInbound = inbound(descriptor, resolvedId!);
  const nodeOutbound = outbound(descriptor, resolvedId!);
  const nodePaths = pathsTo(descriptor, resolvedId!, options);
  const nodePathsFrom = pathsFrom(descriptor, resolvedId!, options);
  const reachable = reachableFrom(descriptor, resolvedId!, options);
  const attachedPipelinesList = descriptor.attachments.filter(
    a => a.owner.nodeId === resolvedId || a.owner.edgeId?.startsWith(resolvedId!)
  );

  return {
    node: graphNode,
    inbound: nodeInbound,
    outbound: nodeOutbound,
    pathsTo: nodePaths,
    pathsFrom: nodePathsFrom,
    reachableNodes: reachable,
    attachedPipelines: attachedPipelinesList,
  };
}
