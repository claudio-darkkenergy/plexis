import { PlexisError } from './errors.js';
import { applyMerge } from './context.js';
import { withScope } from './helpers.js';
import { buildDomainDescriptor } from '../graph/descriptor.js';
import { buildGraphAPI } from '../graph/paths.js';
import { inspectNode } from '../graph/inspection.js';
import type {
  Domain as DomainInterface,
  DomainSetupResult,
  DefineDomainOptions,
  WhenDef,
  OnDef,
  GraphDescriptor,
  GraphNodeRef,
  NodeInspection,
  PathQueryOptions,
  DomainFollowResult,
  DomainSnapshot,
  DomainHistoryEntry,
  CurrentStateNode,
  DomainGraph,
  Pipeline,
} from '../types.js';
import type { Tracer } from './tracer.js';

interface BuiltDomain<TContext extends object> {
  id: string;
  whens: Record<string, WhenDef<TContext>>;
  initial: string;
  context: TContext;
  strict: boolean;
  errorPolicy: string;
  descriptor: GraphDescriptor;
  options: DefineDomainOptions<TContext>;
}

function buildDomain<TContext extends object>(
  id: string,
  setup: () => DomainSetupResult<TContext>,
  options: DefineDomainOptions<TContext> = {}
): BuiltDomain<TContext> {
  const scope = { kind: 'domain' as const, whens: {} as Record<string, WhenDef<any>> };
  const setupResult = withScope(scope, () => setup());
  const { context: initialContext, initial, strict = false, errorPolicy = 'throw' } = setupResult;
  const whens = scope.whens as Record<string, WhenDef<TContext>>;

  if (!whens[initial]) {
    throw PlexisError.unknownInitialState(id, initial);
  }

  for (const [stateId, whenDef] of Object.entries(whens)) {
    for (const [event, onDef] of Object.entries((whenDef.on ?? {}) as Record<string, OnDef<TContext>>)) {
      if (!whens[onDef.target]) {
        throw PlexisError.unknownTargetState(id, stateId, event, onDef.target);
      }
    }
  }

  const descriptor = buildDomainDescriptor(id, whens, initial);
  return { id, whens, initial, context: initialContext, strict, errorPolicy, descriptor, options };
}

export class Domain<TContext extends object = Record<string, unknown>, TEdges extends string = string>
  implements DomainInterface<TContext, TEdges> {
  readonly id: string;
  state: string;
  context: TContext;
  graph: DomainGraph;

  private readonly _whens: Record<string, WhenDef<TContext>>;
  private readonly _strict: boolean;
  private readonly _errorPolicy: string;
  private readonly _descriptor: GraphDescriptor;
  private readonly _options: DefineDomainOptions<TContext>;
  private readonly _subscribers: Set<(snapshot: DomainSnapshot<TContext>) => void>;
  private readonly _history: DomainHistoryEntry<TContext>[];
  private readonly _attachedPipelines: Record<string, Pipeline<TContext>>;

  constructor(id: string, setup: () => DomainSetupResult<TContext>, options?: DefineDomainOptions<TContext>) {
    const built = buildDomain<TContext>(id, setup, options ?? {});
    this.id = built.id;
    this._whens = built.whens;
    this._strict = built.strict;
    this._errorPolicy = built.errorPolicy;
    this._descriptor = built.descriptor;
    this._options = built.options;
    this._subscribers = new Set();
    this._history = [];
    this._attachedPipelines = {};

    // Build attached pipelines map for cross-boundary inspection
    for (const attachment of built.descriptor.attachments) {
      if (attachment.pipeline?.pipelineId) {
        const pipelineId = attachment.pipeline.pipelineId;
        for (const whenDef of Object.values(built.whens)) {
          if (whenDef.pipeline?.id === pipelineId) {
            this._attachedPipelines[pipelineId] = whenDef.pipeline as Pipeline<TContext>;
          }
          for (const onDef of Object.values((whenDef.on ?? {}) as Record<string, OnDef<TContext>>)) {
            if (onDef.pipeline?.id === pipelineId) {
              this._attachedPipelines[pipelineId] = onDef.pipeline as Pipeline<TContext>;
            }
          }
        }
      }
    }

    this.graph = {
      ...buildGraphAPI(built.descriptor),
      observedPathsTo: () => [],
      observedPathsFrom: () => [],
    };

    this.state = built.initial;
    this.context = built.context;
    this._runInitialEnter(built);
  }

  private _runInitialEnter(built: BuiltDomain<TContext>): void {
    const initialWhen = built.whens[built.initial];
    if (initialWhen?.enter) {
      const traceId = crypto.randomUUID();
      const patchOrPromise = initialWhen.enter(this.context, { traceId });
      if (patchOrPromise && typeof (patchOrPromise as Promise<unknown>).then === 'function') {
        (patchOrPromise as Promise<Partial<TContext> | null | undefined>).then((patch) => {
          this.context = applyMerge(this.context, patch, this._options.merge, {
            phase: 'enter-initial', domainId: this.id, stateId: built.initial,
          });
        }).catch(() => {});
      } else {
        this.context = applyMerge(this.context, patchOrPromise as Partial<TContext> | null | undefined, this._options.merge, {
          phase: 'enter-initial', domainId: this.id, stateId: built.initial,
        });
      }
    }
  }

  get current(): CurrentStateNode<TContext, TEdges> {
    return {
      state: this.state,
      context: this.context,
      can: (event: TEdges, payload?: unknown) => this.can(event, payload),
      follow: (event: TEdges, payload?: unknown) => this.follow(event, payload),
    };
  }

  async follow(event: TEdges, payload?: unknown): Promise<DomainFollowResult<TContext>> {
    const tracer = this._options.tracer as Tracer | undefined;
    const { merge } = this._options;
    const traceId = tracer?._idFactory?.() ?? crypto.randomUUID();

    const whenDef = this._whens[this.state];

    if (!whenDef?.on?.[event as string]) {
      if (this._strict) {
        throw PlexisError.unknownEvent(this.id, this.state, event as string);
      }
      return { status: 'ignored', event: event as string, from: this.state, context: this.context, traceId };
    }

    const onDef = (whenDef.on as Record<string, OnDef<TContext>>)[event as string];
    const fromState = this.state;
    const input = { event: event as string, payload, traceId };

    // Guard check
    if (onDef.guard) {
      tracer?.record({ traceId, level: 'guard', type: 'guard.started', status: 'started', domainId: this.id, stateId: this.state, event: event as string });
      const guardResult = await onDef.guard(this.context, input);
      if (!guardResult) {
        tracer?.record({ traceId, level: 'guard', type: 'guard.blocked', status: 'blocked', domainId: this.id, stateId: this.state, event: event as string });
        return { status: 'blocked', event: event as string, from: fromState, context: this.context, traceId };
      }
      tracer?.record({ traceId, level: 'guard', type: 'guard.passed', status: 'completed', domainId: this.id, stateId: this.state, event: event as string });
    }

    tracer?.record({ traceId, level: 'domain', type: 'domain.follow.started', status: 'started', domainId: this.id, event: event as string, from: fromState });

    let ctx = this.context;

    // 1. exit
    if (whenDef.exit) {
      const patch = await whenDef.exit(ctx, input);
      ctx = applyMerge(ctx, patch, merge, { phase: 'exit', domainId: this.id, stateId: fromState, event: event as string });
      tracer?.record({ traceId, level: 'state', type: 'state.exit', status: 'completed', domainId: this.id, stateId: fromState, event: event as string });
    }

    // 2. Flow action
    if (onDef.action) {
      tracer?.record({ traceId, level: 'action', type: 'action.started', status: 'started', domainId: this.id, event: event as string });
      const patch = await onDef.action(ctx, input);
      ctx = applyMerge(ctx, patch, merge, { phase: 'flow-action', domainId: this.id, event: event as string });
      tracer?.record({ traceId, level: 'action', type: 'action.completed', status: 'completed', domainId: this.id, event: event as string, outputPatch: patch });
    }

    // 3. Flow pipeline
    if (onDef.pipeline) {
      const pipelineResult = await (onDef.pipeline as any).run(ctx, payload, { traceId });
      ctx = applyMerge(ctx, pipelineResult.context as Partial<TContext>, merge, { phase: 'flow-pipeline', domainId: this.id, event: event as string });
    }

    // 4. Transition state
    this.state = onDef.target;
    this.context = ctx;
    tracer?.record({ traceId, level: 'domain', type: 'domain.transitioned', status: 'completed', domainId: this.id, from: fromState, to: this.state });

    const targetWhenDef = this._whens[this.state];

    // 5. enter
    if (targetWhenDef?.enter) {
      const patch = await targetWhenDef.enter(ctx, input);
      ctx = applyMerge(ctx, patch, merge, { phase: 'enter', domainId: this.id, stateId: this.state, event: event as string });
      this.context = ctx;
      tracer?.record({ traceId, level: 'state', type: 'state.enter', status: 'completed', domainId: this.id, stateId: this.state, event: event as string });
    }

    // 6. State entry pipeline
    if (targetWhenDef?.pipeline) {
      const pipelineResult = await (targetWhenDef.pipeline as any).run(ctx, payload, { traceId });
      ctx = applyMerge(ctx, pipelineResult.context as Partial<TContext>, merge, { phase: 'state-pipeline', domainId: this.id });
      this.context = ctx;
    }

    // 7. History
    this._history.push({
      from: fromState,
      to: this.state,
      event: event as string,
      payload,
      context: this.context,
      timestamp: Date.now(),
      traceId,
    });

    // 8. Notify subscribers
    const snap = this.snapshot();
    for (const listener of this._subscribers) {
      try { listener(snap); } catch {}
    }

    tracer?.record({ traceId, level: 'domain', type: 'domain.follow.completed', status: 'completed', domainId: this.id, from: fromState, to: this.state });

    return { status: 'followed', event: event as string, from: fromState, to: this.state, context: this.context, traceId };
  }

  async followFrom(expectedState: string, event: TEdges, payload?: unknown): Promise<DomainFollowResult<TContext>> {
    if (this.state !== expectedState) {
      throw PlexisError.stateMismatch(this.id, expectedState, this.state);
    }
    return this.follow(event, payload);
  }

  async can(event: TEdges, payload?: unknown): Promise<boolean> {
    const whenDef = this._whens[this.state];
    if (!whenDef?.on?.[event as string]) return false;
    const onDef = (whenDef.on as Record<string, OnDef<TContext>>)[event as string];
    if (!onDef.guard) return true;
    const traceId = crypto.randomUUID();
    const result = await onDef.guard(this.context, { event: event as string, payload, traceId });
    return Boolean(result);
  }

  subscribe(listener: (snapshot: DomainSnapshot<TContext>) => void): () => void {
    this._subscribers.add(listener);
    return () => this._subscribers.delete(listener);
  }

  snapshot(): DomainSnapshot<TContext> {
    return { state: this.state, context: this.context, historyLength: this._history.length };
  }

  restore(snapshot: DomainSnapshot<TContext>): void {
    this.state = snapshot.state;
    this.context = snapshot.context;
  }

  history(): DomainHistoryEntry<TContext>[] {
    return [...this._history];
  }

  describe(): GraphDescriptor {
    return this._descriptor;
  }

  trace(format: 'json' | 'text' | 'tree' = 'json'): unknown {
    return (this._options.tracer as Tracer | undefined)?.export(format) ?? null;
  }

  inspectNode(idOrRef: string | GraphNodeRef, options?: PathQueryOptions): NodeInspection {
    return inspectNode(this._descriptor, idOrRef, options, this._attachedPipelines);
  }
}

export function defineDomain<TContext extends object, TEdges extends string = string>(
  id: string,
  setup: () => DomainSetupResult<TContext>,
  options?: DefineDomainOptions<TContext>
): Domain<TContext, TEdges> {
  return new Domain<TContext, TEdges>(id, setup, options);
}
