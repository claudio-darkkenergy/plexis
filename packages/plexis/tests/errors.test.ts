// covers: specs/error-handling/spec.md → PlexisError typed subclass, Documented error codes, BUILDER_CLOSED requirement
import { describe, it, expect } from 'vitest';
import { PlexisError } from '../src/core/errors.js';
import { withScope, when, on, guard, pipeline, action, target } from '../src/core/helpers.js';
import type { WhenDef } from '../src/types.js';

function domainScope() {
  return { kind: 'domain' as const, whens: {} as Record<string, WhenDef<any>> };
}

describe('PlexisError', () => {
  it('is instanceof Error and instanceof PlexisError', () => {
    const err = PlexisError.builderClosed('state');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PlexisError);
  });

  it('carries a non-empty code string', () => {
    const err = PlexisError.builderClosed('state');
    expect(typeof err.code).toBe('string');
    expect(err.code.length).toBeGreaterThan(0);
  });

  it('unknownEvent sets code UNKNOWN_EVENT and domainId', () => {
    const err = PlexisError.unknownEvent('order', 'pending', 'CANCEL');
    expect(err.code).toBe('UNKNOWN_EVENT');
    expect(err.domainId).toBe('order');
  });

  it('stateMismatch sets code STATE_MISMATCH and stores expected/actual', () => {
    const err = PlexisError.stateMismatch('order', 'processing', 'pending');
    expect(err.code).toBe('STATE_MISMATCH');
    expect(err.domainId).toBe('order');
    const ctx = err.context as { expected: string; actual: string };
    expect(ctx.expected).toBe('processing');
    expect(ctx.actual).toBe('pending');
  });

  it('unknownInitialState sets code UNKNOWN_INITIAL_STATE', () => {
    const err = PlexisError.unknownInitialState('order', 'missing');
    expect(err.code).toBe('UNKNOWN_INITIAL_STATE');
    expect(err.domainId).toBe('order');
  });

  it('unknownInitialNode sets code UNKNOWN_INITIAL_NODE and pipelineId', () => {
    const err = PlexisError.unknownInitialNode('payment', 'missing');
    expect(err.code).toBe('UNKNOWN_INITIAL_NODE');
    expect(err.pipelineId).toBe('payment');
  });

  it('unknownTargetState sets code UNKNOWN_TARGET_STATE', () => {
    const err = PlexisError.unknownTargetState('order', 'pending', 'PAY', 'gone');
    expect(err.code).toBe('UNKNOWN_TARGET_STATE');
    expect(err.domainId).toBe('order');
  });

  it('unknownTargetNode sets code UNKNOWN_TARGET_NODE with pipelineId and nodeId', () => {
    const err = PlexisError.unknownTargetNode('payment', 'validate', 'gone');
    expect(err.code).toBe('UNKNOWN_TARGET_NODE');
    expect(err.pipelineId).toBe('payment');
    expect(err.nodeId).toBe('validate');
  });

  it('unknownNode sets code UNKNOWN_NODE', () => {
    const err = PlexisError.unknownNode('payment', 'ghost');
    expect(err.code).toBe('UNKNOWN_NODE');
  });

  it('builderClosed names the offending helper', () => {
    const err = PlexisError.builderClosed('state');
    expect(err.code).toBe('BUILDER_CLOSED');
    expect(err.message).toContain('state');
  });

  it('duplicateRegistration sets code DUPLICATE_REGISTRATION and names event/helper', () => {
    const err = PlexisError.duplicateRegistration('submit', 'guard');
    expect(err.code).toBe('DUPLICATE_REGISTRATION');
    expect(err.message).toContain('submit');
    expect(err.message).toContain('guard');
  });

  it('missingTarget sets code MISSING_TARGET and names event', () => {
    const err = PlexisError.missingTarget('submit');
    expect(err.code).toBe('MISSING_TARGET');
    expect(err.message).toContain('submit');
    expect(err.message).toContain('target()');
  });
});

describe('DUPLICATE_REGISTRATION — single-slot on() helpers', () => {
  it('second guard() in one on throws DUPLICATE_REGISTRATION', () => {
    const scope = domainScope();
    const g = () => true;
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          on('submit', () => {
            guard(g);
            guard(g);
            return target('b');
          });
        });
      })
    ).toThrow(expect.objectContaining({ code: 'DUPLICATE_REGISTRATION' }));
  });

  it('second action() in one on throws DUPLICATE_REGISTRATION', () => {
    const scope = domainScope();
    const a = () => ({});
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          on('submit', () => {
            action(a);
            action(a);
            return target('b');
          });
        });
      })
    ).toThrow(expect.objectContaining({ code: 'DUPLICATE_REGISTRATION' }));
  });

  it('second pipeline() in one on throws DUPLICATE_REGISTRATION', () => {
    const scope = domainScope();
    const fakePipeline = { id: 'p', run: () => {}, describe: () => {}, graph: {} as any, trace: () => {}, inspectNode: () => {} } as any;
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          on('submit', () => {
            pipeline(fakePipeline);
            pipeline(fakePipeline);
            return target('b');
          });
        });
      })
    ).toThrow(expect.objectContaining({ code: 'DUPLICATE_REGISTRATION' }));
  });
});

describe('MISSING_TARGET — on() setup fn returns no target()', () => {
  it('throws MISSING_TARGET when setup fn returns undefined', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          on('submit', () => {
            action(() => ({}));
            return undefined as any;
          });
        });
      })
    ).toThrow(expect.objectContaining({ code: 'MISSING_TARGET' }));
  });

  it('throws MISSING_TARGET when setup fn returns plain object (not TargetDef)', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          on('submit', () => {
            return { target: 'processing' } as any;
          });
        });
      })
    ).toThrow(expect.objectContaining({ code: 'MISSING_TARGET' }));
  });

  it('MISSING_TARGET is not BUILDER_CLOSED', () => {
    const scope = domainScope();
    try {
      withScope(scope, () => {
        when('a', () => {
          on('submit', () => undefined as any);
        });
      });
    } catch (err: unknown) {
      expect((err as PlexisError).code).not.toBe('BUILDER_CLOSED');
      expect((err as PlexisError).code).toBe('MISSING_TARGET');
    }
  });
});

describe('BUILDER_CLOSED — scoped helpers called outside valid scope', () => {
  it('guard() throws BUILDER_CLOSED outside an on scope', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          guard(() => true);
        });
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('pipeline() throws BUILDER_CLOSED outside an on scope', () => {
    const scope = domainScope();
    const fakePipeline = { id: 'p' } as any;
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          pipeline(fakePipeline);
        });
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('action() throws BUILDER_CLOSED inside a when but outside any on', () => {
    const scope = domainScope();
    expect(() =>
      withScope(scope, () => {
        when('a', () => {
          action(() => ({}));
        });
      })
    ).toThrow(expect.objectContaining({ code: 'BUILDER_CLOSED' }));
  });

  it('on() throws BUILDER_CLOSED outside a when scope', () => {
    expect(() => on('submit', target('x'))).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });

  it('on() throws BUILDER_CLOSED from a deferred async callback', async () => {
    const scope = domainScope();
    let deferredError: unknown;
    withScope(scope, () => {
      setTimeout(() => {
        try {
          on('late', target('x'));
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
