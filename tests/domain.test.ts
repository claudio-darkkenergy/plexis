// covers: specs/domain/spec.md, specs/error-handling/spec.md
import { describe, it, expect, vi } from 'vitest';
import { Domain, defineDomain } from '../src/core/domain.js';
import { PlexisError } from '../src/core/errors.js';
import { state, edge } from '../src/core/helpers.js';
import { definePipeline } from '../src/core/pipeline.js';
import { node, fork, terminal } from '../src/core/helpers.js';

// ─── Construction ──────────────────────────────────────────────────────────

describe('defineDomain and new Domain parity', () => {
  const setup = () => {
    state('pending', { edges: { SUBMIT: edge({ target: 'done' }) } });
    state('done', { terminal: true, edges: {} });
    return { context: { x: 0 }, initial: 'pending' };
  };

  it('produce identical describe() output', () => {
    const d1 = defineDomain('order', setup);
    const d2 = new Domain('order', setup);
    expect(JSON.stringify(d1.describe())).toBe(JSON.stringify(d2.describe()));
  });

  it('start in the same initial state', () => {
    const d1 = defineDomain('order', setup);
    const d2 = new Domain('order', setup);
    expect(d1.state).toBe(d2.state);
    expect(d1.state).toBe('pending');
  });
});

describe('construction validation', () => {
  it('throws UNKNOWN_INITIAL_STATE for missing initial state', () => {
    expect(() =>
      defineDomain('d', () => {
        state('pending', { edges: {} });
        return { context: {}, initial: 'missing' };
      })
    ).toThrow(expect.objectContaining({ code: 'UNKNOWN_INITIAL_STATE' }));
  });

  it('throws UNKNOWN_TARGET_STATE for missing edge target in non-strict mode', () => {
    expect(() =>
      defineDomain('d', () => {
        state('pending', { edges: { GO: edge({ target: 'gone' }) } });
        return { context: {}, initial: 'pending', strict: false };
      })
    ).toThrow(expect.objectContaining({ code: 'UNKNOWN_TARGET_STATE' }));
  });
});

describe('state() outside setup throws BUILDER_CLOSED', () => {
  it('throws at module level', () => {
    expect(() => state('orphan', { edges: {} })).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });
});

// ─── follow() ───────────────────────────────────────────────────────────────

describe('follow() — state transitions', () => {
  function makeOrder() {
    return defineDomain('order', () => {
      state('pending', { edges: { SUBMIT: edge({ target: 'processing' }) } });
      state('processing', { edges: { COMPLETE: edge({ target: 'done' }) } });
      state('done', { terminal: true, edges: {} });
      return { context: {}, initial: 'pending' };
    });
  }

  it('successful follow returns status: followed and updates state', async () => {
    const d = makeOrder();
    const result = await d.follow('SUBMIT');
    expect(result.status).toBe('followed');
    expect(result.to).toBe('processing');
    expect(d.state).toBe('processing');
  });

  it('follow updates context via edge action', async () => {
    const d = defineDomain('d', () => {
      state('a', {
        edges: { GO: edge({ target: 'b', action: async () => ({ stepped: true }) }) },
      });
      state('b', { edges: {} });
      return { context: {}, initial: 'a' };
    });
    await d.follow('GO');
    expect(d.context).toMatchObject({ stepped: true });
  });

  it('unknown event in non-strict mode returns status: ignored', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: {} });
      return { context: {}, initial: 'a', strict: false };
    });
    const result = await d.follow('UNKNOWN');
    expect(result.status).toBe('ignored');
    expect(d.state).toBe('a');
  });

  it('unknown event in strict mode throws UNKNOWN_EVENT', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: {} });
      return { context: {}, initial: 'a', strict: true };
    });
    await expect(d.follow('UNKNOWN')).rejects.toThrow(
      expect.objectContaining({ code: 'UNKNOWN_EVENT' })
    );
  });

  it('terminal state ignores follow in non-strict mode', async () => {
    const d = defineDomain('d', () => {
      state('done', { terminal: true, edges: {} });
      return { context: {}, initial: 'done', strict: false };
    });
    const result = await d.follow('ANYTHING');
    expect(result.status).toBe('ignored');
  });
});

describe('guard evaluation', () => {
  it('failing guard blocks transition, no side effects', async () => {
    let sideEffect = false;
    const d = defineDomain('d', () => {
      state('a', {
        edges: {
          GO: edge({
            target: 'b',
            guard: async () => false,
            action: async () => { sideEffect = true; return {}; },
          }),
        },
      });
      state('b', { edges: {} });
      return { context: {}, initial: 'a' };
    });
    const result = await d.follow('GO');
    expect(result.status).toBe('blocked');
    expect(d.state).toBe('a');
    expect(sideEffect).toBe(false);
  });
});

describe('execution order', () => {
  it('patches applied: onExit → edge action → onEnter', async () => {
    const d = defineDomain('d', () => {
      state('a', {
        onExit: async () => ({ a: 1 }),
        edges: { GO: edge({ target: 'b', action: async () => ({ b: 2 }) }) },
      });
      state('b', {
        onEnter: async () => ({ a: 9 }),
        edges: {},
      });
      return { context: {}, initial: 'a' };
    });
    await d.follow('GO');
    expect(d.context).toMatchObject({ a: 9, b: 2 });
  });
});

describe('lifecycle hooks', () => {
  it('onEnter runs on initial state at construction', async () => {
    const d = defineDomain('d', () => {
      state('pending', {
        onEnter: async () => ({ initialized: true }),
        edges: {},
      });
      return { context: {}, initial: 'pending' };
    });
    // Async onEnter resolves in the first microtask after construction
    await Promise.resolve();
    expect(d.context).toMatchObject({ initialized: true });
  });
});

// ─── can() ───────────────────────────────────────────────────────────────────

describe('can()', () => {
  it('returns false when no edge for event', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: {} });
      return { context: {}, initial: 'a' };
    });
    expect(await d.can('UNKNOWN')).toBe(false);
  });

  it('returns true when edge exists and guard passes', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: { GO: edge({ target: 'b', guard: async () => true }) } });
      state('b', { edges: {} });
      return { context: {}, initial: 'a' };
    });
    expect(await d.can('GO')).toBe(true);
  });

  it('returns false when guard fails, no state change', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: { GO: edge({ target: 'b', guard: async () => false }) } });
      state('b', { edges: {} });
      return { context: {}, initial: 'a' };
    });
    const canResult = await d.can('GO');
    expect(canResult).toBe(false);
    expect(d.state).toBe('a');
  });
});

// ─── followFrom() ────────────────────────────────────────────────────────────

describe('followFrom()', () => {
  it('throws STATE_MISMATCH when current state differs from expected', async () => {
    const d = defineDomain('order', () => {
      state('pending', { edges: { GO: edge({ target: 'done' }) } });
      state('done', { terminal: true, edges: {} });
      return { context: {}, initial: 'pending' };
    });
    await expect(d.followFrom('processing', 'GO')).rejects.toThrow(
      expect.objectContaining({ code: 'STATE_MISMATCH', domainId: 'order' })
    );
  });

  it('delegates to follow when state matches', async () => {
    const d = defineDomain('order', () => {
      state('pending', { edges: { GO: edge({ target: 'done' }) } });
      state('done', { terminal: true, edges: {} });
      return { context: {}, initial: 'pending' };
    });
    const result = await d.followFrom('pending', 'GO');
    expect(result.status).toBe('followed');
  });
});

// ─── snapshot / restore ───────────────────────────────────────────────────────

describe('snapshot() / restore()', () => {
  it('restore returns domain to captured state', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: { GO: edge({ target: 'b' }) } });
      state('b', { edges: {} });
      return { context: { x: 0 }, initial: 'a' };
    });
    const snap = d.snapshot();
    await d.follow('GO');
    expect(d.state).toBe('b');
    d.restore(snap);
    expect(d.state).toBe('a');
    expect(d.context).toEqual({ x: 0 });
  });
});

// ─── subscribe() ──────────────────────────────────────────────────────────────

describe('subscribe()', () => {
  it('listener receives snapshot after successful follow', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: { GO: edge({ target: 'b' }) } });
      state('b', { edges: {} });
      return { context: {}, initial: 'a' };
    });
    const snapshots: unknown[] = [];
    d.subscribe((snap) => snapshots.push(snap));
    await d.follow('GO');
    expect(snapshots).toHaveLength(1);
    expect((snapshots[0] as { state: string }).state).toBe('b');
  });

  it('throwing listener does not break subsequent listeners', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: { GO: edge({ target: 'b' }) } });
      state('b', { edges: {} });
      return { context: {}, initial: 'a' };
    });
    const received: unknown[] = [];
    d.subscribe(() => { throw new Error('bad listener'); });
    d.subscribe((snap) => received.push(snap));
    await d.follow('GO');
    expect(received).toHaveLength(1);
    expect(d.state).toBe('b');
  });

  it('unsubscribe stops future notifications', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: { GO: edge({ target: 'b' }), BACK: edge({ target: 'a' }) } });
      state('b', { edges: { BACK: edge({ target: 'a' }) } });
      return { context: {}, initial: 'a', strict: false };
    });
    const received: unknown[] = [];
    const unsub = d.subscribe((snap) => received.push(snap));
    await d.follow('GO');
    unsub();
    await d.follow('BACK');
    expect(received).toHaveLength(1);
  });
});

// ─── history() ────────────────────────────────────────────────────────────────

describe('history()', () => {
  it('records each successful transition', async () => {
    const d = defineDomain('d', () => {
      state('a', { edges: { TO_B: edge({ target: 'b' }) } });
      state('b', { edges: { TO_C: edge({ target: 'c' }) } });
      state('c', { edges: { TO_A: edge({ target: 'a' }) } });
      return { context: {}, initial: 'a' };
    });
    await d.follow('TO_B');
    await d.follow('TO_C');
    await d.follow('TO_A');
    const hist = d.history();
    expect(hist).toHaveLength(3);
    expect(hist[0].from).toBe('a');
    expect(hist[0].to).toBe('b');
  });
});

// ─── Edge pipeline integration ────────────────────────────────────────────────

describe('edge pipeline integration', () => {
  it('edge pipeline context merges into domain context', async () => {
    const payPipeline = definePipeline('pay', () => {
      node('charge', terminal({ action: async () => ({ charged: true }) }));
      return { initial: 'charge' };
    });
    const d = defineDomain('d', () => {
      state('pending', {
        edges: { PAY: edge({ target: 'done', pipeline: payPipeline }) },
      });
      state('done', { terminal: true, edges: {} });
      return { context: {}, initial: 'pending' };
    });
    await d.follow('PAY');
    expect(d.context).toMatchObject({ charged: true });
    expect(d.state).toBe('done');
  });
});
