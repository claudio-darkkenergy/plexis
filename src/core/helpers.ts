import { PlexisError } from './errors.js';
import type { StateNodeDef, EdgeDef, PipelineNodeDef, PipelineForkDef, Pipeline } from '../types.js';

type DomainScope = {
  kind: 'domain';
  states: Record<string, StateNodeDef<any>>;
};

type PipelineScope = {
  kind: 'pipeline';
  nodes: Record<string, PipelineNodeDef<any>>;
};

type BuilderScope = DomainScope | PipelineScope;

// Module-level builder scope cell. Single scope at a time — setup functions are
// synchronous, so nested or concurrent scopes cannot exist in normal usage.
// Callers that call state()/node() from async callbacks after setup returns will
// find the scope null and receive BUILDER_CLOSED, which is the documented behavior.
let _currentScope: BuilderScope | null = null;

export function pushScope(scope: BuilderScope): void {
  _currentScope = scope;
}

export function popScope(): void {
  _currentScope = null;
}

export function withScope<T>(scope: BuilderScope, fn: () => T): T {
  pushScope(scope);
  try {
    return fn();
  } finally {
    popScope();
  }
}

export function getCurrentScope(): BuilderScope | null {
  return _currentScope;
}

// ─── Registration helpers ────────────────────────────────────────────────────

export function state<TContext extends object>(id: string, def: StateNodeDef<TContext>): void {
  const scope = _currentScope;
  if (!scope || scope.kind !== 'domain') {
    throw PlexisError.builderClosed('state');
  }
  scope.states[id] = def;
}

export function node<TContext extends object>(id: string, def: PipelineNodeDef<TContext>): void {
  const scope = _currentScope;
  if (!scope || scope.kind !== 'pipeline') {
    throw PlexisError.builderClosed('node');
  }
  scope.nodes[id] = def;
}

// ─── Pure builder helpers — no scope dependency ──────────────────────────────

export function edge<TContext extends object>(def: EdgeDef<TContext>): EdgeDef<TContext> {
  return { ...def };
}

export function fork<TContext extends object>(
  condition: ((ctx: TContext, input: import('../types.js').PipelineConditionInput) => boolean | Promise<boolean>) | undefined,
  target: string | Pipeline<TContext>,
  options: { label?: string; metadata?: Record<string, unknown> } = {}
): PipelineForkDef<TContext> {
  return {
    condition,
    target,
    label: options.label,
    metadata: options.metadata,
  };
}

export function terminal<TContext extends object>(
  def: Omit<PipelineNodeDef<TContext>, 'terminal'> = {}
): PipelineNodeDef<TContext> {
  return { ...def, terminal: true };
}
