// covers: specs/error-handling/spec.md → BUILDER_CLOSED requirement
// covers: pipeline spec → Pipeline helpers called outside setup throw BUILDER_CLOSED
// covers: domain spec → Helpers called outside setup throw BUILDER_CLOSED
import { describe, it, expect, vi } from 'vitest';
import { PlexisError } from '../src/core/errors.js';
import {
  withScope,
  when,
  enter,
  exit,
  on,
  node,
  action,
  fork,
  terminal,
} from '../src/core/helpers.js';
import type { WhenDef, PipelineNodeDef } from '../src/types.js';

function domainScope() {
  return { kind: 'domain' as const, whens: {} as Record<string, WhenDef<any>> };
}

function pipelineScope() {
  return { kind: 'pipeline' as const, nodes: {} as Record<string, PipelineNodeDef<any>> };
}

describe('when()', () => {
  it('throws BUILDER_CLOSED outside any scope', () => {
    expect(() => when('orphan', () => {})).toThrow(PlexisError);
    expect(() => when('orphan', () => {})).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('names "when" in the error message', () => {
    try {
      when('orphan', () => {});
    } catch (err: unknown) {
      expect((err as Error).message).toContain('when');
    }
  });

  it('throws BUILDER_CLOSED inside a pipeline scope', () => {
    const scope = pipelineScope();
    expect(() =>
      withScope(scope, () => {
        when('x', () => {});
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('registers in active domain scope', () => {
    const scope = domainScope();
    withScope(scope, () => {
      when('pending', () => {});
    });
    expect(scope.whens['pending']).toBeDefined();
  });

  it('registers terminal state from terminal() sentinel', () => {
    const scope = domainScope();
    withScope(scope, () => {
      when('done', terminal());
    });
    expect((scope.whens['done'] as any).terminal).toBe(true);
  });
});

describe('enter(), exit(), on()', () => {
  it('enter() throws BUILDER_CLOSED outside any scope', () => {
    expect(() => enter(() => {})).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('exit() throws BUILDER_CLOSED outside any scope', () => {
    expect(() => exit(() => {})).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('on() throws BUILDER_CLOSED outside any scope', () => {
    expect(() => on('submit', { target: 'x' })).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('enter() throws BUILDER_CLOSED when called in domain body (not in when)', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        enter(() => {});
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('exit() throws BUILDER_CLOSED when called in domain body (not in when)', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        exit(() => {});
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('on() throws BUILDER_CLOSED when called in domain body (not in when)', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        on('submit', { target: 'x' });
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('enter(), exit(), on() write to the when scope', () => {
    const scope = domainScope();
    const enterFn = vi.fn();
    const exitFn = vi.fn();
    withScope(scope, () => {
      when('active', () => {
        enter(enterFn);
        exit(exitFn);
        on('stop', { target: 'done' });
      });
    });
    const def = scope.whens['active'] as any;
    expect(def.enter).toBe(enterFn);
    expect(def.exit).toBe(exitFn);
    expect(def.on['stop']).toMatchObject({ target: 'done' });
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

  it('registers terminal node from terminal() sentinel', () => {
    const scope = pipelineScope();
    withScope(scope, () => {
      node('done', terminal());
    });
    expect((scope.nodes['done'] as any).terminal).toBe(true);
  });

  it('registers terminal node with final action from terminal(fn)', () => {
    const scope = pipelineScope();
    const finalAction = vi.fn();
    withScope(scope, () => {
      node('done', terminal(finalAction));
    });
    const def = scope.nodes['done'] as any;
    expect(def.terminal).toBe(true);
    expect(def.action).toBe(finalAction);
  });
});

describe('action(), fork()', () => {
  it('action() throws BUILDER_CLOSED outside any scope', () => {
    expect(() => action(() => {})).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('fork() throws BUILDER_CLOSED outside any scope', () => {
    expect(() => fork(undefined, 'x')).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('action() throws BUILDER_CLOSED when called in pipeline body (not in node)', () => {
    const scope = pipelineScope();
    expect(() =>
      withScope(scope, () => {
        action(() => {});
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('fork() throws BUILDER_CLOSED when called in pipeline body (not in node)', () => {
    const scope = pipelineScope();
    expect(() =>
      withScope(scope, () => {
        fork(undefined, 'x');
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('action() and fork() write to the node scope in declaration order', () => {
    const scope = pipelineScope();
    const actionFn = vi.fn();
    const cond = vi.fn();
    withScope(scope, () => {
      node('process', () => {
        action(actionFn);
        fork(cond, 'next', { label: 'ok' });
        fork(undefined, 'fallback');
      });
      node('next', terminal());
      node('fallback', terminal());
    });
    const def = scope.nodes['process'] as any;
    expect(def.action).toBe(actionFn);
    expect(def.forks).toHaveLength(2);
    expect(def.forks[0].condition).toBe(cond);
    expect(def.forks[0].target).toBe('next');
    expect(def.forks[0].label).toBe('ok');
    expect(def.forks[1].target).toBe('fallback');
  });
});

describe('terminal() — scope-independent sentinel', () => {
  it('does not throw outside any scope', () => {
    expect(() => terminal()).not.toThrow();
  });

  it('does not throw outside any scope when called with action fn', () => {
    expect(() => terminal(() => {})).not.toThrow();
  });

  it('returns a branded sentinel (truthy object)', () => {
    const t = terminal();
    expect(t).toBeDefined();
    expect(typeof t).toBe('object');
  });

  it('sentinel accepted by when() as terminal state', () => {
    const scope = domainScope();
    withScope(scope, () => {
      when('done', terminal());
    });
    expect((scope.whens['done'] as any).terminal).toBe(true);
  });

  it('sentinel accepted by node() as terminal node', () => {
    const scope = pipelineScope();
    withScope(scope, () => {
      node('end', terminal());
    });
    expect((scope.nodes['end'] as any).terminal).toBe(true);
  });
});

describe('withScope() scope hygiene', () => {
  it('clears scope after setup returns normally', () => {
    const scope = domainScope();
    withScope(scope, () => {});
    expect(() => when('late', () => {})).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('clears scope even when setup throws', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        when('a', () => {});
        throw new Error('setup error');
      })
    ).toThrow('setup error');
    expect(() => when('late', () => {})).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('deferred async when() call throws BUILDER_CLOSED', async () => {
    const scope = domainScope();
    let deferredError: unknown;
    withScope(scope, () => {
      setTimeout(() => {
        try {
          when('late', () => {});
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
