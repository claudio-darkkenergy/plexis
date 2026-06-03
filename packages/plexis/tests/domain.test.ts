// covers: specs/domain/spec.md, specs/error-handling/spec.md
import { describe, it, expect } from 'vitest';
import { Domain, defineDomain } from '../src/core/domain.js';
import { when, enter, exit, on, target, guard, pipeline, terminal } from '../src/core/helpers.js';
import { definePipeline } from '../src/core/pipeline.js';
import { node, action } from '../src/core/helpers.js';
import type { ActionInput } from '../src/types.js';

// ─── Construction ──────────────────────────────────────────────────────────

describe('defineDomain and new Domain parity', () => {
  const setup = () => {
    when('pending', () => { on('submit', target('done')); });
    when('done', terminal());
    return { context: { x: 0 }, initial: 'pending' };
  };

  it('produce identical describe() output', () => {
    const d1 = defineDomain('order', setup);
    const d2 = new Domain('order', setup);
    expect(JSON.stringify(d1.describe())).toBe(JSON.stringify(d2.describe()));
  });

  it('start in the same initial phase', () => {
    const d1 = defineDomain('order', setup);
    const d2 = new Domain('order', setup);
    expect(d1.phase).toBe(d2.phase);
    expect(d1.phase).toBe('pending');
  });
});

describe('construction validation', () => {
  it('throws UNKNOWN_INITIAL_PHASE for missing initial phase', () => {
    expect(() =>
      defineDomain('d', () => {
        when('pending', () => {});
        return { context: {}, initial: 'missing' };
      })
    ).toThrow(expect.objectContaining({ code: 'UNKNOWN_INITIAL_PHASE' }));
  });

  it('throws UNKNOWN_TARGET_PHASE for missing event target in non-strict mode', () => {
    expect(() =>
      defineDomain('d', () => {
        when('pending', () => { on('go', target('gone')); });
        return { context: {}, initial: 'pending', strict: false };
      })
    ).toThrow(expect.objectContaining({ code: 'UNKNOWN_TARGET_PHASE' }));
  });
});

describe('when() outside setup throws BUILDER_CLOSED', () => {
  it('throws at module level', () => {
    expect(() => when('orphan', () => {})).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });
});

// ─── follow() ───────────────────────────────────────────────────────────────

describe('follow() — phase transitions', () => {
  function makeOrder() {
    return defineDomain('order', () => {
      when('pending', () => { on('submit', target('processing')); });
      when('processing', () => { on('complete', target('done')); });
      when('done', terminal());
      return { context: {}, initial: 'pending' };
    });
  }

  it('successful follow returns status: followed and updates phase', async () => {
    const d = makeOrder();
    const result = await d.follow('submit');
    expect(result.status).toBe('followed');
    expect(result.to).toBe('processing');
    expect(d.phase).toBe('processing');
  });

  it('follow updates context via flow action', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {
        on('go', () => {
          action(async () => ({ stepped: true }));
          return target('b');
        });
      });
      when('b', () => {});
      return { context: {}, initial: 'a' };
    });
    await d.follow('go');
    expect(d.context).toMatchObject({ stepped: true });
  });

  it('flow action receives ActionInput shape', async () => {
    let capturedInput: ActionInput | undefined;
    const d = defineDomain('d', () => {
      when('a', () => {
        on('go', () => {
          action(async (_ctx, input) => { capturedInput = input; return {}; });
          return target('b');
        });
      });
      when('b', () => {});
      return { context: {}, initial: 'a' };
    });
    await d.follow('go', 'myPayload');
    expect(capturedInput).toMatchObject({ source: 'go', scope: 'a', payload: 'myPayload', traceId: expect.any(String) });
  });

  it('unknown event in non-strict mode returns status: ignored', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {});
      return { context: {}, initial: 'a', strict: false };
    });
    const result = await d.follow('unknown');
    expect(result.status).toBe('ignored');
    expect(d.phase).toBe('a');
  });

  it('unknown event in strict mode throws UNKNOWN_EVENT', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {});
      return { context: {}, initial: 'a', strict: true };
    });
    await expect(d.follow('unknown')).rejects.toThrow(
      expect.objectContaining({ code: 'UNKNOWN_EVENT' })
    );
  });

  it('terminal state ignores follow in non-strict mode', async () => {
    const d = defineDomain('d', () => {
      when('done', terminal());
      return { context: {}, initial: 'done', strict: false };
    });
    const result = await d.follow('anything');
    expect(result.status).toBe('ignored');
  });
});

describe('guard evaluation', () => {
  it('failing guard blocks transition, no side effects', async () => {
    let sideEffect = false;
    const d = defineDomain('d', () => {
      when('a', () => {
        on('go', () => {
          guard(async () => false);
          action(async () => { sideEffect = true; return {}; });
          return target('b');
        });
      });
      when('b', () => {});
      return { context: {}, initial: 'a' };
    });
    const result = await d.follow('go');
    expect(result.status).toBe('blocked');
    expect(d.phase).toBe('a');
    expect(sideEffect).toBe(false);
  });
});

describe('execution order', () => {
  it('patches applied: exit → flow action → enter', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {
        exit(async () => ({ a: 1 }));
        on('go', () => {
          action(async () => ({ b: 2 }));
          return target('b');
        });
      });
      when('b', () => {
        enter(async () => ({ a: 9 }));
      });
      return { context: {}, initial: 'a' };
    });
    await d.follow('go');
    expect(d.context).toMatchObject({ a: 9, b: 2 });
  });
});

describe('lifecycle hooks', () => {
  it('enter runs on initial state at construction', async () => {
    const d = defineDomain('d', () => {
      when('pending', () => {
        enter(async () => ({ initialized: true }));
      });
      return { context: {}, initial: 'pending' };
    });
    await Promise.resolve();
    expect(d.context).toMatchObject({ initialized: true });
  });
});

// ─── can() ───────────────────────────────────────────────────────────────────

describe('can()', () => {
  it('returns false when no flow for event', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {});
      return { context: {}, initial: 'a' };
    });
    expect(await d.can('unknown')).toBe(false);
  });

  it('returns true when flow exists and guard passes', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {
        on('go', () => {
          guard(async () => true);
          return target('b');
        });
      });
      when('b', () => {});
      return { context: {}, initial: 'a' };
    });
    expect(await d.can('go')).toBe(true);
  });

  it('returns false when guard fails, no state change', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {
        on('go', () => {
          guard(async () => false);
          return target('b');
        });
      });
      when('b', () => {});
      return { context: {}, initial: 'a' };
    });
    const canResult = await d.can('go');
    expect(canResult).toBe(false);
    expect(d.phase).toBe('a');
  });
});

// ─── followFrom() ────────────────────────────────────────────────────────────

describe('followFrom()', () => {
  it('throws PHASE_MISMATCH when current phase differs from expected', async () => {
    const d = defineDomain('order', () => {
      when('pending', () => { on('go', target('done')); });
      when('done', terminal());
      return { context: {}, initial: 'pending' };
    });
    await expect(d.followFrom('processing', 'go')).rejects.toThrow(
      expect.objectContaining({ code: 'PHASE_MISMATCH', domainId: 'order' })
    );
  });

  it('delegates to follow when state matches', async () => {
    const d = defineDomain('order', () => {
      when('pending', () => { on('go', target('done')); });
      when('done', terminal());
      return { context: {}, initial: 'pending' };
    });
    const result = await d.followFrom('pending', 'go');
    expect(result.status).toBe('followed');
  });
});

// ─── snapshot / restore ───────────────────────────────────────────────────────

describe('snapshot() / restore()', () => {
  it('snapshot.phase equals domain.phase', () => {
    const d = defineDomain('d', () => {
      when('a', () => {});
      return { context: {}, initial: 'a' };
    });
    const snap = d.snapshot();
    expect(snap.phase).toBe('a');
    expect(snap.phase).toBe(d.phase);
  });

  it('restore returns domain to captured phase', async () => {
    const d = defineDomain('d', () => {
      when('a', () => { on('go', target('b')); });
      when('b', () => {});
      return { context: { x: 0 }, initial: 'a' };
    });
    const snap = d.snapshot();
    await d.follow('go');
    expect(d.phase).toBe('b');
    d.restore(snap);
    expect(d.phase).toBe('a');
    expect(d.context).toEqual({ x: 0 });
  });
});

// ─── subscribe() ──────────────────────────────────────────────────────────────

describe('subscribe()', () => {
  it('listener receives snapshot after successful follow', async () => {
    const d = defineDomain('d', () => {
      when('a', () => { on('go', target('b')); });
      when('b', () => {});
      return { context: {}, initial: 'a' };
    });
    const snapshots: unknown[] = [];
    d.subscribe((snap) => snapshots.push(snap));
    await d.follow('go');
    expect(snapshots).toHaveLength(1);
    expect((snapshots[0] as { phase: string }).phase).toBe('b');
  });

  it('throwing listener does not break subsequent listeners', async () => {
    const d = defineDomain('d', () => {
      when('a', () => { on('go', target('b')); });
      when('b', () => {});
      return { context: {}, initial: 'a' };
    });
    const received: unknown[] = [];
    d.subscribe(() => { throw new Error('bad listener'); });
    d.subscribe((snap) => received.push(snap));
    await d.follow('go');
    expect(received).toHaveLength(1);
    expect(d.phase).toBe('b');
  });

  it('unsubscribe stops future notifications', async () => {
    const d = defineDomain('d', () => {
      when('a', () => {
        on('go', target('b'));
        on('back', target('a'));
      });
      when('b', () => { on('back', target('a')); });
      return { context: {}, initial: 'a', strict: false };
    });
    const received: unknown[] = [];
    const unsub = d.subscribe((snap) => received.push(snap));
    await d.follow('go');
    unsub();
    await d.follow('back');
    expect(received).toHaveLength(1);
  });
});

// ─── history() ────────────────────────────────────────────────────────────────

describe('history()', () => {
  it('records each successful transition', async () => {
    const d = defineDomain('d', () => {
      when('a', () => { on('toB', target('b')); });
      when('b', () => { on('toC', target('c')); });
      when('c', () => { on('toA', target('a')); });
      return { context: {}, initial: 'a' };
    });
    await d.follow('toB');
    await d.follow('toC');
    await d.follow('toA');
    const hist = d.history();
    expect(hist).toHaveLength(3);
    expect(hist[0].from).toBe('a');
    expect(hist[0].to).toBe('b');
  });
});

// ─── Flow pipeline integration ────────────────────────────────────────────────

describe('flow pipeline integration', () => {
  it('flow pipeline context merges into domain context', async () => {
    const payPipeline = definePipeline('pay', () => {
      node('charge', terminal(async () => ({ charged: true })));
      return { initial: 'charge' };
    });
    const d = defineDomain('d', () => {
      when('pending', () => {
        on('pay', () => {
          pipeline(payPipeline);
          return target('done');
        });
      });
      when('done', terminal());
      return { context: {}, initial: 'pending' };
    });
    await d.follow('pay');
    expect(d.context).toMatchObject({ charged: true });
    expect(d.phase).toBe('done');
  });
});

describe('ActionInput — on-action input shape', () => {
  it('scope is the originating from-state, not the transition target', async () => {
    let capturedInput: ActionInput | undefined;
    const d = defineDomain('d', () => {
      when('pending', () => {
        on('submit', () => {
          action(async (_ctx, input) => { capturedInput = input; return {}; });
          return target('processing');
        });
      });
      when('processing', () => {});
      return { context: {}, initial: 'pending' };
    });
    await d.follow('submit', 'myPayload');
    // scope must be 'pending' (from-state), not 'processing' (target)
    expect(capturedInput?.scope).toBe('pending');
    expect(capturedInput?.source).toBe('submit');
    expect(capturedInput?.payload).toBe('myPayload');
    expect(capturedInput?.traceId).toBeTruthy();
  });
});

describe('on() setup-function form — guard and pipeline drive follow correctly', () => {
  it('on action receives ActionInput; guard and pipeline work via setup fn', async () => {
    let capturedInput: ActionInput | undefined;
    const p = definePipeline('pay', () => {
      node('charge', terminal(async () => ({ charged: true })));
      return { initial: 'charge' };
    });
    const d = defineDomain('d', () => {
      when('pending', () => {
        on('submit', () => {
          guard(async () => true);
          action(async (_ctx, input) => { capturedInput = input; return {}; });
          pipeline(p);
          return target('done');
        });
      });
      when('done', terminal());
      return { context: {}, initial: 'pending' };
    });
    await d.follow('submit', { orderId: 'abc' });
    expect(d.phase).toBe('done');
    expect(d.context).toMatchObject({ charged: true });
    expect(capturedInput).toMatchObject({ source: 'submit', scope: 'pending', payload: { orderId: 'abc' }, traceId: expect.any(String) });
  });
});
