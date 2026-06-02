import { PlexisError } from './errors.js';
import { applyMerge } from './context.js';
import { withScope } from './helpers.js';
import { buildPipelineDescriptor } from '../graph/descriptor.js';
import { buildGraphAPI } from '../graph/paths.js';
import { inspectNode } from '../graph/inspection.js';
import type {
  Pipeline as PipelineInterface,
  PipelineSetupResult,
  DefinePipelineOptions,
  PipelineNodeDef,
  GraphDescriptor,
  GraphNodeRef,
  NodeInspection,
  PathQueryOptions,
  PipelineRunResult,
  PipelineGraph,
  TraceEvent,
} from '../types.js';
import type { Tracer } from './tracer.js';

type RunContext = { traceId?: string; parentId?: string };

interface BuiltPipeline<TContext extends object> {
  id: string;
  initial: string;
  nodes: Record<string, PipelineNodeDef<TContext>>;
  descriptor: GraphDescriptor;
  options: DefinePipelineOptions<TContext>;
}

function buildPipeline<TContext extends object>(
  id: string,
  setup: () => PipelineSetupResult,
  options: DefinePipelineOptions<TContext> = {}
): BuiltPipeline<TContext> {
  const scope = { kind: 'pipeline' as const, nodes: {} as Record<string, PipelineNodeDef<any>> };
  const setupResult = withScope(scope, () => setup());
  const { initial } = setupResult;
  const nodes = scope.nodes as Record<string, PipelineNodeDef<TContext>>;

  if (!nodes[initial]) {
    throw PlexisError.unknownInitialNode(id, initial);
  }

  for (const [nodeId, nodeDef] of Object.entries(nodes)) {
    for (const forkDef of (nodeDef.forks ?? [])) {
      if (typeof forkDef.target === 'string' && !nodes[forkDef.target]) {
        throw PlexisError.unknownTargetNode(id, nodeId, forkDef.target);
      }
    }
  }

  const descriptor = buildPipelineDescriptor(id, nodes, initial);
  return { id, initial, nodes, descriptor, options };
}

export class Pipeline<TContext extends object = Record<string, unknown>>
  implements PipelineInterface<TContext> {
  readonly id: string;
  readonly graph: PipelineGraph;

  private readonly _initial: string;
  private readonly _nodes: Record<string, PipelineNodeDef<TContext>>;
  private readonly _descriptor: GraphDescriptor;
  private readonly _options: DefinePipelineOptions<TContext>;

  constructor(id: string, setup: () => PipelineSetupResult, options?: DefinePipelineOptions<TContext>) {
    const built = buildPipeline<TContext>(id, setup, options ?? {});
    this.id = built.id;
    this._initial = built.initial;
    this._nodes = built.nodes;
    this._descriptor = built.descriptor;
    this._options = built.options;
    this.graph = buildGraphAPI(built.descriptor);
  }

  async run(context: TContext, payload?: unknown, _runCtx?: RunContext): Promise<PipelineRunResult<TContext>> {
    const tracer = this._options.tracer as Tracer | undefined;
    const { errorPolicy = 'throw', merge } = this._options;
    const traceId = _runCtx?.traceId ?? (tracer?._idFactory?.() ?? crypto.randomUUID());
    const localTrace: TraceEvent[] = [];

    const record = (partial: Record<string, unknown>): TraceEvent | undefined => {
      const full = { ...partial, traceId };
      const event = tracer
        ? tracer.record(full as Parameters<Tracer['record']>[0])
        : Object.assign({ id: crypto.randomUUID(), timestamp: Date.now() }, full as TraceEvent) as TraceEvent;
      if (event) localTrace.push(event as TraceEvent);
      return event as TraceEvent | undefined;
    };

    record({ level: 'pipeline', type: 'pipeline.started', status: 'started', pipelineId: this.id });

    let currentContext = context;
    let currentNodeId: string | null = this._initial;

    try {
      while (currentNodeId) {
        const nodeDef: PipelineNodeDef<TContext> | undefined = this._nodes[currentNodeId];
        if (!nodeDef) throw PlexisError.unknownNode(this.id, currentNodeId);

        const nodeStartEvent = record({
          level: 'pipeline-node', type: 'pipeline-node.started', status: 'started',
          pipelineId: this.id, nodeId: currentNodeId,
          parentId: _runCtx?.parentId,
        });

        if (nodeDef.action) {
          const beforeCtx = currentContext;
          const actionStartEvent = record({
            level: 'action', type: 'action.started', status: 'started',
            pipelineId: this.id, nodeId: currentNodeId,
            parentId: nodeStartEvent?.id,
            contextSnapshot: tracer?.captureContext === 'before' || tracer?.captureContext === 'both' ? beforeCtx : undefined,
          });
          const patch = await nodeDef.action(currentContext, { source: currentNodeId, scope: this.id, payload, traceId });
          currentContext = applyMerge(currentContext, patch, merge, {
            phase: 'pipeline-action', pipelineId: this.id, nodeId: currentNodeId,
          });
          record({
            level: 'action', type: 'action.completed', status: 'completed',
            pipelineId: this.id, nodeId: currentNodeId,
            parentId: actionStartEvent?.id,
            outputPatch: patch,
            contextSnapshot: tracer?.captureContext === 'after' || tracer?.captureContext === 'both' ? currentContext : undefined,
          });
        }

        record({
          level: 'pipeline-node', type: 'pipeline-node.completed', status: 'completed',
          pipelineId: this.id, nodeId: currentNodeId, parentId: nodeStartEvent?.id,
        });

        if (nodeDef.terminal) {
          record({ level: 'pipeline', type: 'pipeline.completed', status: 'completed', pipelineId: this.id });
          return { status: 'completed', pipelineId: this.id, finalNode: currentNodeId, context: currentContext, traceId, localTrace };
        }

        let nextNodeId: string | null = null;
        for (const forkDef of (nodeDef.forks ?? [] as import('../types.js').PipelineForkDef<TContext>[])) {
          let matches = true;
          if (forkDef.condition) {
            const condEvent = record({
              level: 'condition', type: 'condition.started', status: 'started',
              pipelineId: this.id, nodeId: currentNodeId, label: forkDef.label,
            });
            matches = await forkDef.condition(currentContext, { payload, nodeId: currentNodeId, pipelineId: this.id, traceId });
            record({
              level: 'condition', type: matches ? 'condition.selected' : 'condition.skipped',
              status: matches ? 'selected' : 'skipped',
              pipelineId: this.id, nodeId: currentNodeId, label: forkDef.label,
              parentId: condEvent?.id,
            });
          } else {
            record({
              level: 'fork', type: 'fork.selected', status: 'selected',
              pipelineId: this.id, nodeId: currentNodeId, label: forkDef.label,
            });
          }

          if (matches) {
            if (typeof forkDef.target === 'string') {
              nextNodeId = forkDef.target;
            } else {
              // Sub-pipeline: share traceId, link via parentId
              const subPipeline = forkDef.target as Pipeline<TContext>;
              const subResult = await subPipeline.run(currentContext, payload, {
                traceId,
                parentId: nodeStartEvent?.id,
              });
              currentContext = applyMerge(currentContext, subResult.context as Partial<TContext>, merge, {
                phase: 'sub-pipeline', pipelineId: this.id,
              });
            }
            break;
          }
        }

        if (!nextNodeId) {
          const hasForks = (nodeDef.forks ?? []).length > 0;
          if (hasForks) {
            record({ level: 'pipeline', type: 'pipeline.stopped', status: 'completed', pipelineId: this.id });
            return { status: 'stopped', pipelineId: this.id, finalNode: currentNodeId, context: currentContext, traceId, localTrace };
          }
        }

        currentNodeId = nextNodeId;
      }

      record({ level: 'pipeline', type: 'pipeline.stopped', status: 'completed', pipelineId: this.id });
      return { status: 'stopped', pipelineId: this.id, finalNode: currentNodeId ?? this._initial, context: currentContext, traceId, localTrace };
    } catch (err) {
      if (errorPolicy === 'trace-and-return') {
        tracer?.record({ traceId, level: 'pipeline', type: 'pipeline.failed', status: 'failed', pipelineId: this.id, error: err } as Parameters<Tracer['record']>[0]);
      }
      if (errorPolicy === 'return' || errorPolicy === 'trace-and-return') {
        return { status: 'error', pipelineId: this.id, finalNode: currentNodeId ?? this._initial, context: currentContext, traceId, localTrace, error: err };
      }
      throw err;
    }
  }

  describe(): GraphDescriptor {
    return this._descriptor;
  }

  trace(format: 'json' | 'text' | 'tree' = 'json'): unknown {
    return (this._options.tracer as Tracer | undefined)?.export(format) ?? null;
  }

  inspectNode(idOrRef: string | GraphNodeRef, options?: PathQueryOptions): NodeInspection {
    return inspectNode(this._descriptor, idOrRef, options);
  }
}

export function definePipeline<TContext extends object>(
  id: string,
  setup: () => PipelineSetupResult,
  options?: DefinePipelineOptions<TContext>
): Pipeline<TContext> {
  return new Pipeline<TContext>(id, setup, options);
}
