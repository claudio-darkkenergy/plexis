import { PlexisError } from './errors.js';
import type {
  WhenDef,
  OnDef,
  PipelineNodeDef,
  PipelineForkDef,
  Pipeline as PipelineType,
  PhaseHookInput,
  PatchLike,
  ActionInput,
  PipelineConditionInput,
  GuardInput,
  TargetDef,
} from '../types.js';

// ─── Terminal sentinel ────────────────────────────────────────────────────────

const TERMINAL = Symbol('plexis.terminal');

type TerminalSentinel = {
  readonly [TERMINAL]: true;
  // ctx typed as `any` — stored for any TContext, consumed by the node that owns it
  readonly action?: (ctx: any, input: ActionInput) => PatchLike<any> | Promise<PatchLike<any>>;
};

function isTerminal(x: unknown): x is TerminalSentinel {
  return typeof x === 'object' && x !== null
    && (x as Record<typeof TERMINAL, unknown>)[TERMINAL] === true;
}

export function terminal<TContext extends object>(
  fn?: (ctx: TContext, input: ActionInput) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): TerminalSentinel {
  return fn ? { [TERMINAL]: true, action: fn } : { [TERMINAL]: true };
}

// ─── Target sentinel ─────────────────────────────────────────────────────────

function isTargetDef(x: unknown): x is TargetDef {
  return typeof x === 'object' && x !== null
    && (x as Record<string, unknown>).__type === 'TargetDef';
}

export function target<TContext extends object>(idOrPipeline: string | PipelineType<TContext>): TargetDef {
  if (typeof idOrPipeline === 'string') {
    return { __type: 'TargetDef', id: idOrPipeline };
  }
  return { __type: 'TargetDef', pipeline: idOrPipeline };
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

// ctx slots use `any` — the scope holds a single handler regardless of TContext
type OnScope = {
  kind: 'on';
  event: string;
  guard: ((ctx: any, input: GuardInput) => boolean | Promise<boolean>) | null;
  action: ((ctx: any, input: ActionInput) => PatchLike<any> | Promise<PatchLike<any>>) | null;
  pipeline: PipelineType<any> | null;
};

type PipelineScope = {
  kind: 'pipeline';
  nodes: Record<string, PipelineNodeDef<any>>;
};

type NodeScope = {
  kind: 'node';
  def: PipelineNodeDef<any>;
};

type BuilderScope = DomainScope | WhenScope | OnScope | PipelineScope | NodeScope;

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
    x();
  } finally {
    _scopeStack.pop();
  }
  scope.whens[id] = whenDef;
}

export function enter<TContext extends object>(
  fn: (ctx: TContext, input: PhaseHookInput) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'when') {
    throw PlexisError.builderClosed('enter');
  }
  scope.def.enter = fn;
}

export function exit<TContext extends object>(
  fn: (ctx: TContext, input: PhaseHookInput) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'when') {
    throw PlexisError.builderClosed('exit');
  }
  scope.def.exit = fn;
}

export function on(
  event: string,
  def: TargetDef | (() => TargetDef)
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'when') {
    throw PlexisError.builderClosed('on');
  }
  if (!scope.def.on) scope.def.on = {};

  if (isTargetDef(def)) {
    if (!('id' in def)) {
      throw PlexisError.invalidTarget('on', 'pipeline targets are not valid for domain flows; use target(\'phase-id\')');
    }
    scope.def.on[event] = { target: def.id };
    return;
  }

  const onScope: OnScope = { kind: 'on', event, guard: null, action: null, pipeline: null };
  _scopeStack.push(onScope);
  let result: unknown;
  try {
    result = def();
  } finally {
    _scopeStack.pop();
  }

  if (!isTargetDef(result)) {
    throw PlexisError.missingTarget(event);
  }

  if (!('id' in result)) {
    throw PlexisError.invalidTarget('on', 'pipeline targets are not valid for domain flows; use target(\'phase-id\')');
  }
  const onDef: OnDef<any> = { target: result.id };
  if (onScope.guard !== null) onDef.guard = onScope.guard;
  if (onScope.action !== null) onDef.action = onScope.action;
  if (onScope.pipeline !== null) onDef.pipeline = onScope.pipeline;

  scope.def.on[event] = onDef;
}

export function guard<TContext extends object>(
  fn: (ctx: TContext, input: GuardInput) => boolean | Promise<boolean>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'on') {
    throw PlexisError.builderClosed('guard');
  }
  if (scope.guard !== null) {
    throw PlexisError.duplicateRegistration(scope.event, 'guard');
  }
  scope.guard = fn;
}

export function pipeline<TContext extends object>(p: PipelineType<TContext>): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'on') {
    throw PlexisError.builderClosed('pipeline');
  }
  if (scope.pipeline !== null) {
    throw PlexisError.duplicateRegistration(scope.event, 'pipeline');
  }
  scope.pipeline = p;
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
    if (x.action) nodeDef.action = x.action;
    scope.nodes[id] = nodeDef;
    return;
  }

  const nodeDef: PipelineNodeDef<TContext> = { forks: [] };
  const nodeScope: NodeScope = { kind: 'node', def: nodeDef };
  _scopeStack.push(nodeScope);
  try {
    x();
  } finally {
    _scopeStack.pop();
  }
  scope.nodes[id] = nodeDef;
}

export function action<TContext extends object>(
  fn: (
    ctx: TContext,
    input: ActionInput
  ) => PatchLike<TContext> | Promise<PatchLike<TContext>>
): void {
  const scope = getCurrentScope();
  if (scope?.kind === 'node') {
    scope.def.action = fn;
    return;
  }
  if (scope?.kind === 'on') {
    if (scope.action !== null) {
      throw PlexisError.duplicateRegistration(scope.event, 'action');
    }
    scope.action = fn;
    return;
  }
  throw PlexisError.builderClosed('action');
}

export function fork<TContext extends object>(
  label: string,
  targetSentinel: TargetDef,
  condition?: (ctx: TContext, input: PipelineConditionInput) => boolean | Promise<boolean>
): void {
  const scope = getCurrentScope();
  if (!scope || scope.kind !== 'node') {
    throw PlexisError.builderClosed('fork');
  }
  if (!isTargetDef(targetSentinel)) {
    throw PlexisError.invalidTarget('fork', 'second argument must be a target(...) sentinel; use target(\'node-id\') or target(pipeline)');
  }
  if (!scope.def.forks) scope.def.forks = [];
  const forkTarget = 'id' in targetSentinel ? targetSentinel.id : targetSentinel.pipeline;
  const forkDef: PipelineForkDef<TContext> = { target: forkTarget, label };
  if (condition !== undefined) forkDef.condition = condition;
  scope.def.forks.push(forkDef);
}
