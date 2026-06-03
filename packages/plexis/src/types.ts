// Plexis types — composable API aligned with finalized spec

// ─── Utility ────────────────────────────────────────────────────────────────

export type PatchLike<TContext extends object = Record<string, unknown>> =
  | Partial<TContext>
  | void
  | null
  | undefined;

export type ErrorPolicy = 'throw' | 'return' | 'trace-and-return';

export type MergeMetadata = {
  phase: string;
  domainId?: string;
  pipelineId?: string;
  nodeId?: string;
  phaseId?: string;
  event?: string;
};

// ─── Trace Types ────────────────────────────────────────────────────────────

export type TraceLevel =
  | 'domain'
  | 'phase'
  | 'edge'
  | 'pipeline'
  | 'pipeline-node'
  | 'fork'
  | 'action'
  | 'guard'
  | 'condition';

export type TraceStatus =
  | 'started'
  | 'completed'
  | 'blocked'
  | 'selected'
  | 'skipped'
  | 'failed';

export type TraceEvent = {
  id: string;
  traceId: string;
  parentId?: string;
  timestamp: number;
  level: TraceLevel;
  type: string;
  domainId?: string;
  pipelineId?: string;
  nodeId?: string;
  phaseId?: string;
  event?: string;
  label?: string;
  from?: string;
  to?: string;
  status?: TraceStatus;
  input?: unknown;
  outputPatch?: unknown;
  contextSnapshot?: unknown;
  error?: unknown;
  metadata?: Record<string, unknown>;
};

export type TracerOptions = {
  enabled?: boolean;
  captureContext?: boolean | 'before' | 'after' | 'both';
  maxEvents?: number;
  clock?: () => number;
  idFactory?: () => string;
  onSubscriberError?: (error: unknown) => void;
};

// ─── Graph Types ─────────────────────────────────────────────────────────────

export type GraphNodeKind =
  | 'domain-phase'
  | 'domain-event'
  | 'pipeline-node'
  | 'pipeline-fork'
  | 'pipeline';

export type GraphNodeRef = {
  kind: GraphNodeKind;
  domainId?: string;
  pipelineId?: string;
  nodeId?: string;
  edgeId?: string;
  forkId?: string;
};

export type GraphNode = {
  ref: GraphNodeRef;
  id: string;
  label?: string;
  terminal?: boolean;
  entry?: boolean;
  metadata?: Record<string, unknown>;
};

export type GraphEdgeKind =
  | 'domain-event'
  | 'phase-entry-pipeline'
  | 'phase-exit-hook'
  | 'phase-entry-hook'
  | 'edge-action'
  | 'edge-pipeline'
  | 'pipeline-fork'
  | 'subpipeline';

export type GraphEdge = {
  id: string;
  from: GraphNodeRef;
  to: GraphNodeRef;
  kind: GraphEdgeKind;
  label?: string;
  event?: string;
  guard?: string;
  condition?: string;
  metadata?: Record<string, unknown>;
};

export type GraphAttachmentKind =
  | 'phase-entry-pipeline'
  | 'edge-pipeline'
  | 'subpipeline';

export type GraphAttachment = {
  kind: GraphAttachmentKind;
  owner: GraphNodeRef;
  pipeline: GraphNodeRef;
};

export type GraphDescriptor = {
  id: string;
  kind: 'domain' | 'pipeline' | 'composed';
  nodes: GraphNode[];
  edges: GraphEdge[];
  entryNodes: GraphNodeRef[];
  terminalNodes: GraphNodeRef[];
  attachments: GraphAttachment[];
};

export type GraphPath = {
  id: string;
  from: GraphNodeRef;
  to: GraphNodeRef;
  nodes: GraphNodeRef[];
  edges: GraphEdge[];
  labels: string[];
  crossesBoundaries: boolean;
};

export type PathQueryOptions = {
  maxDepth?: number;
  includeCycles?: boolean;
  includeCrossBoundary?: boolean;
  direction?: 'inbound' | 'outbound';
};

export type NodeInspection = {
  node: GraphNode;
  inbound: GraphEdge[];
  outbound: GraphEdge[];
  pathsTo: GraphPath[];
  pathsFrom: GraphPath[];
  reachableNodes: GraphNode[];
  attachedPipelines: GraphAttachment[];
  runtimeStats?: {
    visits: number;
    lastVisitedAt?: number;
    observedLabels: string[];
    recentTraceIds: string[];
  };
};

// ─── Tracer ─────────────────────────────────────────────────────────────────

export interface Tracer {
  captureContext: boolean | 'before' | 'after' | 'both';
  record(partial: Partial<TraceEvent> & Pick<TraceEvent, 'traceId' | 'level' | 'type'>): TraceEvent | undefined;
  export(format: 'json' | 'text' | 'tree'): unknown;
  subscribe(listener: (event: TraceEvent) => void): () => void;
  history(): TraceEvent[];
  traces(): string[];
  byTraceId(id: string): TraceEvent[];
  clear(): void;
}

export declare class Tracer implements Tracer {
  constructor(options?: TracerOptions);
}

export declare function createTracer(options?: TracerOptions): Tracer;

// ─── Handler Inputs ──────────────────────────────────────────────────────────

/**
 * Unified input received by every `action(fn)` handler, regardless of scope.
 *
 * Field semantics by scope:
 * - **`source`**: `nodeId` in a `node` scope; event name in an `on` scope.
 * - **`scope`**: `pipelineId` in a `node` scope; `whenId` (originating state id) in an `on` scope.
 * - **`payload`**: pipeline run input in a `node` scope; event payload in an `on` scope. Always present; may be `undefined`.
 * - **`traceId`**: correlation id for the current trace.
 */
export type ActionInput = {
  source: string;
  scope: string;
  payload: unknown;
  traceId: string;
};

// ─── Pipeline Runtime Types ─────────────────────────────────────────────────

export type PipelineConditionInput = {
  payload?: unknown;
  nodeId: string;
  pipelineId: string;
  traceId: string;
};


export interface Pipeline<TContext extends object = Record<string, unknown>> {
  id: string;
  run(context: TContext, input?: unknown): Promise<PipelineRunResult<TContext>>;
  describe(): GraphDescriptor;
  trace(format?: 'json' | 'text' | 'tree'): unknown;
  inspectNode(
    node: string | GraphNodeRef,
    options?: PathQueryOptions
  ): NodeInspection;
  graph: PipelineGraph;
}

export type PipelineForkDef<
  TContext extends object = Record<string, unknown>
> = {
  target: string | Pipeline<TContext>;
  condition?: (
    ctx: TContext,
    input: PipelineConditionInput
  ) => boolean | Promise<boolean>;
  label?: string;
  metadata?: Record<string, unknown>;
};

export type PipelineNodeDef<
  TContext extends object = Record<string, unknown>
> = {
  action?: (
    ctx: TContext,
    input: ActionInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>;
  forks?: PipelineForkDef<TContext>[];
  terminal?: boolean;
  metadata?: Record<string, unknown>;
};

export type PipelineConfig<
  TContext extends object = Record<string, unknown>
> = {
  initial: string;
  nodes: Record<string, PipelineNodeDef<TContext>>;
};

export type PipelineOptions<TContext extends object = Record<string, unknown>> = {
  tracer?: Tracer;
  errorPolicy?: ErrorPolicy;
  merge?: (
    previous: TContext,
    patch: Partial<TContext>,
    metadata: MergeMetadata
  ) => TContext;
};

export type PipelineRunResult<
  TContext extends object = Record<string, unknown>
> = {
  status: 'completed' | 'stopped' | 'error';
  pipelineId: string;
  finalNode: string;
  context: TContext;
  traceId: string;
  localTrace: TraceEvent[];
  error?: unknown;
};

export type PipelineGraph = {
  describe(): GraphDescriptor;
  node(id: string): GraphNode | undefined;
  inbound(id: string): GraphEdge[];
  outbound(id: string): GraphEdge[];
  pathsTo(id: string, options?: PathQueryOptions): GraphPath[];
  pathsFrom(id: string, options?: PathQueryOptions): GraphPath[];
  reachableFrom(id: string, options?: PathQueryOptions): GraphNode[];
};

// ─── Domain Runtime Types ───────────────────────────────────────────────────

export type PhaseHookInput = {
  event?: string;
  payload?: unknown;
  traceId: string;
};

export type GuardInput = {
  event: string;
  payload?: unknown;
  traceId: string;
};

export type OnDef<TContext extends object = Record<string, unknown>> = {
  target: string;
  guard?: (ctx: TContext, input: GuardInput) => boolean | Promise<boolean>;
  action?: (
    ctx: TContext,
    input: ActionInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>;
  pipeline?: Pipeline<TContext>;
  metadata?: Record<string, unknown>;
};

export type WhenDef<TContext extends object = Record<string, unknown>> = {
  enter?: (
    ctx: TContext,
    input: PhaseHookInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>;
  exit?: (
    ctx: TContext,
    input: PhaseHookInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>;
  pipeline?: Pipeline<TContext>;
  on?: Record<string, OnDef<TContext>>;
  terminal?: boolean;
  metadata?: Record<string, unknown>;
};

export type DomainConfig<
  TContext extends object = Record<string, unknown>,
  TWhens extends Record<string, WhenDef<TContext>> = Record<
    string,
    WhenDef<TContext>
  >
> = {
  context: TContext;
  initial: string;
  strict?: boolean;
  whens: TWhens;
  errorPolicy?: ErrorPolicy;
  merge?: (
    previous: TContext,
    patch: Partial<TContext>,
    metadata: MergeMetadata
  ) => TContext;
};

export type DomainFollowResult<
  TContext extends object = Record<string, unknown>
> = {
  status: 'followed' | 'blocked' | 'ignored' | 'error';
  event: string;
  from: string;
  to?: string;
  context: TContext;
  traceId: string;
  error?: unknown;
};

export type DomainSnapshot<
  TContext extends object = Record<string, unknown>
> = {
  phase: string;
  context: TContext;
  historyLength: number;
};

export type DomainHistoryEntry<
  TContext extends object = Record<string, unknown>
> = {
  from: string;
  to: string;
  event: string;
  payload?: unknown;
  context: TContext;
  timestamp: number;
  traceId: string;
};

export type CurrentPhaseNode<
  TContext extends object = Record<string, unknown>,
  TEdges extends string = string
> = {
  phase: string;
  context: TContext;
  can(event: TEdges, payload?: unknown): boolean | Promise<boolean>;
  follow(event: TEdges, payload?: unknown): Promise<DomainFollowResult<TContext>>;
};

export type DomainGraph = {
  describe(): GraphDescriptor;
  node(id: string): GraphNode | undefined;
  inbound(id: string): GraphEdge[];
  outbound(id: string): GraphEdge[];
  pathsTo(id: string, options?: PathQueryOptions): GraphPath[];
  pathsFrom(id: string, options?: PathQueryOptions): GraphPath[];
  reachableFrom(id: string, options?: PathQueryOptions): GraphNode[];
  observedPathsTo(id: string): GraphPath[];
  observedPathsFrom(id: string): GraphPath[];
};

export interface Domain<
  TContext extends object = Record<string, unknown>,
  TEdges extends string = string
> {
  id: string;
  phase: string;
  context: TContext;
  current: CurrentPhaseNode<TContext, TEdges>;

  follow(event: TEdges, payload?: unknown): Promise<DomainFollowResult<TContext>>;
  followFrom(
    expectedPhase: string,
    event: TEdges,
    payload?: unknown
  ): Promise<DomainFollowResult<TContext>>;
  can(event: TEdges, payload?: unknown): boolean | Promise<boolean>;
  subscribe(listener: (snapshot: DomainSnapshot<TContext>) => void): () => void;
  snapshot(): DomainSnapshot<TContext>;
  restore(snapshot: DomainSnapshot<TContext>): void;
  history(): DomainHistoryEntry<TContext>[];
  describe(): GraphDescriptor;
  trace(format?: 'json' | 'text' | 'tree'): unknown;
  inspectNode(
    node: string | GraphNodeRef,
    options?: PathQueryOptions
  ): NodeInspection;
  graph: DomainGraph;
}

// ─── Composable Definition Types ────────────────────────────────────────────

export type DomainSetupResult<TContext extends object = Record<string, unknown>> = {
  context: TContext;
  initial: string;
  strict?: boolean;
  errorPolicy?: ErrorPolicy;
};

export type DefineDomainOptions<
  TContext extends object = Record<string, unknown>
> = {
  tracer?: Tracer;
  merge?: (
    previous: TContext,
    patch: Partial<TContext>,
    metadata: MergeMetadata
  ) => TContext;
};

export type PipelineSetupResult = {
  initial: string;
};

export type DefinePipelineOptions<
  TContext extends object = Record<string, unknown>
> = {
  tracer?: Tracer;
  errorPolicy?: ErrorPolicy;
  merge?: (
    previous: TContext,
    patch: Partial<TContext>,
    metadata: MergeMetadata
  ) => TContext;
};

// ─── Target Sentinel ─────────────────────────────────────────────────────────

export type TargetDef =
  | { __type: 'TargetDef'; id: string }
  // pipeline: Pipeline<any> — intentional type erasure; the sentinel carries a reference only
  | { __type: 'TargetDef'; pipeline: Pipeline<any> };
export type OnSetupFn = () => TargetDef;
export type OnGuardInput = { event: string; payload?: unknown; traceId: string };

// ─── Error Codes ─────────────────────────────────────────────────────────────

export type PlexisErrorCode =
  | 'UNKNOWN_EVENT'
  | 'PHASE_MISMATCH'
  | 'UNKNOWN_INITIAL_PHASE'
  | 'UNKNOWN_INITIAL_NODE'
  | 'UNKNOWN_TARGET_PHASE'
  | 'UNKNOWN_TARGET_NODE'
  | 'UNKNOWN_NODE'
  | 'BUILDER_CLOSED'
  | 'DUPLICATE_REGISTRATION'
  | 'MISSING_TARGET'
  | 'INVALID_TARGET';

// ─── Terminal Sentinel ───────────────────────────────────────────────────────

declare const TERMINAL_BRAND: unique symbol;
export type TerminalSentinel = { readonly [TERMINAL_BRAND]: true };

// ─── Composable Helper Declarations ─────────────────────────────────────────

export declare function defineDomain<
  TContext extends object,
  TEdges extends string = string
>(
  id: string,
  setup: () => DomainSetupResult<TContext>,
  options?: DefineDomainOptions<TContext>
): Domain<TContext, TEdges>;

export declare function definePipeline<TContext extends object>(
  id: string,
  setup: () => PipelineSetupResult,
  options?: DefinePipelineOptions<TContext>
): Pipeline<TContext>;

export declare function when(
  id: string,
  x: (() => void) | TerminalSentinel
): void;

export declare function enter<TContext extends object>(
  fn: (
    ctx: TContext,
    input: PhaseHookInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void;

export declare function exit<TContext extends object>(
  fn: (
    ctx: TContext,
    input: PhaseHookInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void;

export declare function on(
  event: string,
  def: TargetDef | OnSetupFn
): void;

export declare function target<TContext extends object>(idOrPipeline: string | Pipeline<TContext>): TargetDef;

export declare function guard<TContext extends object>(
  fn: (ctx: TContext, input: OnGuardInput) => boolean | Promise<boolean>
): void;

export declare function pipeline<TContext extends object>(
  p: Pipeline<TContext>
): void;

export declare function node(
  id: string,
  x: (() => void) | TerminalSentinel
): void;

export declare function action<TContext extends object>(
  fn: (
    ctx: TContext,
    input: ActionInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void;

export declare function fork<TContext extends object>(
  label: string,
  target: TargetDef,
  condition?: (ctx: TContext, input: PipelineConditionInput) => boolean | Promise<boolean>
): void;

export declare function terminal<TContext extends object>(
  fn?: (
    ctx: TContext,
    input: ActionInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): TerminalSentinel;

// ─── TypeScript Edge Inference Helpers ──────────────────────────────────────

type ExtractEdges<TWhens> = TWhens extends Record<string, { on?: infer E }>
  ? E extends Record<string, unknown>
    ? keyof E
    : never
  : never;

export type InferEdges<TConfig> = TConfig extends { whens: infer TWhens }
  ? [ExtractEdges<TWhens>] extends [never]
    ? string
    : ExtractEdges<TWhens> extends string
      ? ExtractEdges<TWhens>
      : string
  : string;

// ─── Class constructors ──────────────────────────────────────────────────────

export declare class DomainClass<
  TContext extends object = Record<string, unknown>,
  TEdges extends string = string
> implements Domain<TContext, TEdges> {
  id: string;
  phase: string;
  context: TContext;
  current: CurrentPhaseNode<TContext, TEdges>;
  graph: DomainGraph;

  constructor(
    id: string,
    setup: () => DomainSetupResult<TContext>,
    options?: DefineDomainOptions<TContext>
  );

  follow(event: TEdges, payload?: unknown): Promise<DomainFollowResult<TContext>>;
  followFrom(expectedPhase: string, event: TEdges, payload?: unknown): Promise<DomainFollowResult<TContext>>;
  can(event: TEdges, payload?: unknown): boolean | Promise<boolean>;
  subscribe(listener: (snapshot: DomainSnapshot<TContext>) => void): () => void;
  snapshot(): DomainSnapshot<TContext>;
  restore(snapshot: DomainSnapshot<TContext>): void;
  history(): DomainHistoryEntry<TContext>[];
  describe(): GraphDescriptor;
  trace(format?: 'json' | 'text' | 'tree'): unknown;
  inspectNode(node: string | GraphNodeRef, options?: PathQueryOptions): NodeInspection;
}

export declare class PipelineClass<TContext extends object = Record<string, unknown>>
  implements Pipeline<TContext> {
  id: string;
  graph: PipelineGraph;

  constructor(
    id: string,
    setup: () => PipelineSetupResult,
    options?: DefinePipelineOptions<TContext>
  );

  run(context: TContext, input?: unknown): Promise<PipelineRunResult<TContext>>;
  describe(): GraphDescriptor;
  trace(format?: 'json' | 'text' | 'tree'): unknown;
  inspectNode(node: string | GraphNodeRef, options?: PathQueryOptions): NodeInspection;
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export declare class PlexisError extends Error {
  code: PlexisErrorCode;
  domainId?: string;
  pipelineId?: string;
  nodeId?: string;
  context?: unknown;

  constructor(message: string, options?: {
    code?: PlexisErrorCode;
    domainId?: string;
    pipelineId?: string;
    nodeId?: string;
    context?: unknown;
  });

  static unknownEvent(domainId: string, phase: string, event: string): PlexisError;
  static phaseMismatch(domainId: string, expected: string, actual: string): PlexisError;
  static unknownInitialPhase(domainId: string, phase: string): PlexisError;
  static unknownInitialNode(pipelineId: string, node: string): PlexisError;
  static unknownTargetPhase(domainId: string, fromPhase: string, event: string, target: string): PlexisError;
  static unknownTargetNode(pipelineId: string, fromNode: string, target: string): PlexisError;
  static unknownNode(id: string, node: string): PlexisError;
  static builderClosed(helperName: string): PlexisError;
  static duplicateRegistration(event: string, helper: string): PlexisError;
  static missingTarget(event: string): PlexisError;
  static invalidTarget(helperName: string, detail: string): PlexisError;
}
