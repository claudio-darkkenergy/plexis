// Public barrel — re-exports runtime values and types.
export { defineDomain, Domain } from './core/domain.js';
export { definePipeline, Pipeline } from './core/pipeline.js';
export { createTracer, Tracer } from './core/tracer.js';
export { PlexisError } from './core/errors.js';
export { when, enter, exit, on, node, action, fork, terminal } from './core/helpers.js';

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
  OnActionInput,
  OnDef,
  WhenDef,
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
  TerminalSentinel,
  InferEdges,
} from './types.js';
