// covers: specs/error-handling/spec.md → BUILDER_CLOSED requirement
// covers: pipeline spec → Pipeline helpers called outside setup throw BUILDER_CLOSED
// covers: domain spec → Helpers called outside setup throw BUILDER_CLOSED
import { describe, it, expect, vi } from 'vitest';
import { PlexisError } from '../src/core/errors.js';
import {
  withScope,
  state,
  node,
  edge,
  fork,
  terminal,
} from '../src/core/helpers.js';

function domainScope() {
  return { kind: 'domain' as const, states: {} as Record<string, unknown> };
}

function pipelineScope() {
  return { kind: 'pipeline' as const, nodes: {} as Record<string, unknown> };
}

describe('state()', () => {
  it('throws BUILDER_CLOSED outside any scope', () => {
    expect(() => state('orphan', { edges: {} })).toThrow(PlexisError);
    expect(() => state('orphan', { edges: {} })).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('names "state" in the error message', () => {
    try {
      state('orphan', { edges: {} });
    } catch (err: unknown) {
      expect((err as Error).message).toContain('state');
    }
  });

  it('throws BUILDER_CLOSED inside a pipeline scope', () => {
    const scope = pipelineScope();
    expect(() =>
      withScope(scope, () => {
        state('x', { edges: {} });
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('registers in active domain scope', () => {
    const scope = domainScope();
    withScope(scope, () => {
      state('pending', { edges: {} });
    });
    expect(scope.states['pending']).toBeDefined();
  });
});

describe('node()', () => {
  it('throws BUILDER_CLOSED outside any scope', () => {
    expect(() => node('orphan', terminal())).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('names "node" in the error message', () => {
    try {
      node('orphan', terminal());
    } catch (err: unknown) {
      expect((err as Error).message).toContain('node');
    }
  });

  it('throws BUILDER_CLOSED inside a domain scope', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        node('x', terminal());
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('registers in active pipeline scope', () => {
    const scope = pipelineScope();
    withScope(scope, () => {
      node('charge', terminal());
    });
    expect(scope.nodes['charge']).toBeDefined();
  });
});

describe('edge(), fork(), terminal() — pure builders with no scope dependency', () => {
  it('edge() returns a normalized EdgeDef', () => {
    const def = edge({ target: 'processing' });
    expect(def).toMatchObject({ target: 'processing' });
  });

  it('edge() works outside any scope', () => {
    expect(() => edge({ target: 'x' })).not.toThrow();
  });

  it('fork() returns a PipelineForkDef', () => {
    const cond = vi.fn();
    const def = fork(cond, 'charge', { label: 'ok' });
    expect(def.condition).toBe(cond);
    expect(def.target).toBe('charge');
    expect(def.label).toBe('ok');
  });

  it('terminal() returns a node def with terminal: true', () => {
    const def = terminal();
    expect(def.terminal).toBe(true);
  });

  it('terminal() passes through action and forks', () => {
    const action = vi.fn();
    const def = terminal({ action });
    expect(def.terminal).toBe(true);
    expect(def.action).toBe(action);
  });
});

describe('withScope() scope hygiene', () => {
  it('clears scope after setup returns normally', () => {
    const scope = domainScope();
    withScope(scope, () => {});
    expect(() => state('late', { edges: {} })).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('clears scope even when setup throws', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        state('a', { edges: {} });
        throw new Error('setup error');
      })
    ).toThrow('setup error');
    // Scope should be cleared now
    expect(() => state('late', { edges: {} })).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('deferred async state() call throws BUILDER_CLOSED', async () => {
    const scope = domainScope();
    let deferredError: unknown;
    withScope(scope, () => {
      setTimeout(() => {
        try {
          state('late', { edges: {} });
        } catch (err) {
          deferredError = err;
        }
      }, 0);
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(deferredError).toBeInstanceOf(PlexisError);
    expect((deferredError as PlexisError).code).toBe('BUILDER_CLOSED');
  });
});
