// Public barrel — re-exports runtime values and types.
export { defineDomain, Domain } from './core/domain.js';
export { definePipeline, Pipeline } from './core/pipeline.js';
export { createTracer, Tracer } from './core/tracer.js';
export { PlexisError } from './core/errors.js';
export { state, edge, node, fork, terminal } from './core/helpers.js';

// Type-only re-exports for consumers
export type {
  PatchLike,
  ErrorPolicy,
  MergeMetadata,
  TraceLevel,
  TraceStatus,
  TraceEvent,
  TracerOptions,
  GraphNodeKind,
  GraphNodeRef,
  GraphNode,
  GraphEdgeKind,
  GraphEdge,
  GraphAttachmentKind,
  GraphAttachment,
  GraphDescriptor,
  GraphPath,
  PathQueryOptions,
  NodeInspection,
  PipelineActionInput,
  PipelineConditionInput,
  PipelineForkDef,
  PipelineNodeDef,
  PipelineConfig,
  PipelineOptions,
  PipelineRunResult,
  PipelineGraph,
  StateHookInput,
  GuardInput,
  TransitionActionInput,
  EdgeDef,
  StateNodeDef,
  DomainConfig,
  DomainFollowResult,
  DomainSnapshot,
  DomainHistoryEntry,
  CurrentStateNode,
  DomainGraph,
  DomainSetupResult,
  DefineDomainOptions,
  PipelineSetupResult,
  DefinePipelineOptions,
  InferEdges,
} from './types.js';
