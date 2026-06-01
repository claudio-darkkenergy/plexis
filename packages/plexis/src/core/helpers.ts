import { PlexisError } from './errors.js';
import type { WhenDef, OnDef, PipelineNodeDef, PipelineForkDef, Pipeline, StateHookInput, PatchLike, PipelineActionInput, PipelineConditionInput } from '../types.js';

// ─── Terminal sentinel ────────────────────────────────────────────────────────

const TERMINAL = Symbol('plexis.terminal');

type TerminalSentinel = {
  readonly [TERMINAL]: true;
  readonly action?: (...args: any[]) => any;
};

function isTerminal(x: unknown): x is TerminalSentinel {
  return typeof x === 'object' && x !== null && (x as any)[TERMINAL] === true;
}

export function terminal<TContext extends object>(
  fn?: (ctx: TContext, input: PipelineActionInput) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): TerminalSentinel {
  return fn
    ? { [TERMINAL]: true, action: fn }
    : { [TERMINAL]: true };
}

// ─── Scope types ─────────────────────────────────────────────────────────────

type DomainScope = {
  kind: 'domain';
  whens: Record<string, WhenDef<any>>;
};

type WhenScope = {
  kind: 'when';
  def: WhenDef<any>;
};

type PipelineScope = {
  kind: 'pipeline';
  nodes: Record<string, PipelineNodeDef<any>>;
};

type NodeScope = {
  kind: 'node';
  def: PipelineNodeDef<any>;
};

type BuilderScope = DomainScope | WhenScope | PipelineScope | NodeScope;

// ─── Scope stack ─────────────────────────────────────────────────────────────

let _scopeStack: BuilderScope[] = [];

function getCurrentScope(): BuilderScope | null {
  return _scopeStack.length > 0 ? _scopeStack[_scopeStack.length - 1] : null;
}

export function withScope<T>(scope: DomainScope | PipelineScope, fn: () => T): T {
  _scopeStack.push(scope);
  try {
    return fn();
  } finally {
    _scopeStack.pop();
  }
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export function when<TContext extends object>(
  id: string,
  x: (() => void) | TerminalSentinel
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'domain') {
    throw PlexisError.builderClosed('when');
  }

  if (isTerminal(x)) {
    scope.whens[id] = { terminal: true };
    return;
  }

  const whenDef: WhenDef<TContext> = { on: {} };
  const whenScope: WhenScope = { kind: 'when', def: whenDef };
  _scopeStack.push(whenScope);
  try {
    (x as () => void)();
  } finally {
    _scopeStack.pop();
  }
  scope.whens[id] = whenDef;
}

export function enter<TContext extends object>(
  fn: (
    ctx: TContext,
    input: StateHookInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'when') {
    throw PlexisError.builderClosed('enter');
  }
  scope.def.enter = fn as any;
}

export function exit<TContext extends object>(
  fn: (
    ctx: TContext,
    input: StateHookInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'when') {
    throw PlexisError.builderClosed('exit');
  }
  scope.def.exit = fn as any;
}

export function on<TContext extends object>(
  event: string,
  def: OnDef<TContext>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'when') {
    throw PlexisError.builderClosed('on');
  }
  if (!scope.def.on) scope.def.on = {};
  scope.def.on[event] = def as any;
}

// ─── Pipeline helpers ─────────────────────────────────────────────────────────

export function node<TContext extends object>(
  id: string,
  x: (() => void) | TerminalSentinel
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'pipeline') {
    throw PlexisError.builderClosed('node');
  }

  if (isTerminal(x)) {
    const nodeDef: PipelineNodeDef<TContext> = { terminal: true };
    if (x.action) nodeDef.action = x.action as any;
    scope.nodes[id] = nodeDef;
    return;
  }

  const nodeDef: PipelineNodeDef<TContext> = { forks: [] };
  const nodeScope: NodeScope = { kind: 'node', def: nodeDef };
  _scopeStack.push(nodeScope);
  try {
    (x as () => void)();
  } finally {
    _scopeStack.pop();
  }
  scope.nodes[id] = nodeDef;
}

export function action<TContext extends object>(
  fn: (
    ctx: TContext,
    input: PipelineActionInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'node') {
    throw PlexisError.builderClosed('action');
  }
  scope.def.action = fn as any;
}

export function fork<TContext extends object>(
  condition:
    | ((ctx: TContext, input: PipelineConditionInput) => boolean | Promise<boolean>)
    | undefined,
  target: string | Pipeline<TContext>,
  options: { label?: string; metadata?: Record<string, unknown> } = {}
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'node') {
    throw PlexisError.builderClosed('fork');
  }
  if (!scope.def.forks) scope.def.forks = [];
  const forkDef: PipelineForkDef<TContext> = {
    condition,
    target,
    label: options.label,
    metadata: options.metadata,
  };
  scope.def.forks.push(forkDef as any);
}
