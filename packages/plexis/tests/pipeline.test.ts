// covers: specs/pipeline/spec.md
import { describe, it, expect, vi } from 'vitest';
import { Pipeline, definePipeline } from '../src/core/pipeline.js';
import { PlexisError } from '../src/core/errors.js';
import { node, action, fork, target, terminal } from '../src/core/helpers.js';
import { createTracer } from '../src/core/tracer.js';

// ─── Construction ──────────────────────────────────────────────────────────

describe('definePipeline and new Pipeline parity', () => {
  const setup = () => {
    node('validate', () => {
      action(async () => ({ checked: true }));
      fork('next', target('done'));
    });
    node('done', terminal());
    return { initial: 'validate' };
  };

  it('produce identical describe() output', () => {
    const p1 = definePipeline('pay', setup);
    const p2 = new Pipeline('pay', setup);
    expect(JSON.stringify(p1.describe())).toBe(JSON.stringify(p2.describe()));
  });

  it('produce identical run results for same input', async () => {
    const p1 = definePipeline('pay', setup);
    const p2 = new Pipeline('pay', setup);
    const r1 = await p1.run({});
    const r2 = await p2.run({});
    expect(r1.status).toBe(r2.status);
    expect(r1.context).toEqual(r2.context);
    expect(r1.finalNode).toBe(r2.finalNode);
  });
});

describe('construction validation', () => {
  it('throws UNKNOWN_INITIAL_NODE when initial references missing node', () => {
    expect(() =>
      definePipeline('p', () => {
        node('a', terminal());
        return { initial: 'missing' };
      })
    ).toThrow(expect.objectContaining({ code: 'UNKNOWN_INITIAL_NODE' }));
  });

  it('sets pipelineId on UNKNOWN_INITIAL_NODE error', () => {
    try {
      definePipeline('my-pipe', () => {
        node('a', terminal());
        return { initial: 'missing' };
      });
    } catch (err: unknown) {
      expect((err as PlexisError).pipelineId).toBe('my-pipe');
    }
  });

  it('throws UNKNOWN_TARGET_NODE when fork target is missing', () => {
    expect(() =>
      definePipeline('p', () => {
        node('a', () => { fork('next', target('gone')); });
        node('b', terminal());
        return { initial: 'a' };
      })
    ).toThrow(expect.objectContaining({ code: 'UNKNOWN_TARGET_NODE' }));
  });
});

describe('node() outside setup throws BUILDER_CLOSED', () => {
  it('throws when called at module level', () => {
    expect(() => node('orphan', terminal())).toThrow(
      expect.objectContaining({ code: 'BUILDER_CLOSED' })
    );
  });
});

// ─── Execution ──────────────────────────────────────────────────────────────

describe('pipeline.run() — execution flow', () => {
  it('starts at initial node and merges action patch', async () => {
    const p = definePipeline('p', () => {
      node('start', () => {
        action(async () => ({ started: true }));
        fork('next', target('end'));
      });
      node('end', terminal());
      return { initial: 'start' };
    });
    const result = await p.run({});
    expect(result.context).toMatchObject({ started: true });
  });

  it('first-match-wins fork evaluation', async () => {
    const p = definePipeline('p', () => {
      node('split', () => {
        fork('to-a', target('a'), async (ctx: Record<string, unknown>) => ctx.val === 'a');
        fork('to-b', target('b'), async (ctx: Record<string, unknown>) => ctx.val === 'b');
        fork('to-fallback', target('fallback'));
      });
      node('a', () => {
        action(async () => ({ chosen: 'a' }));
        fork('next', target('end'));
      });
      node('b', () => {
        action(async () => ({ chosen: 'b' }));
        fork('next', target('end'));
      });
      node('fallback', () => {
        action(async () => ({ chosen: 'fallback' }));
        fork('next', target('end'));
      });
      node('end', terminal());
      return { initial: 'split' };
    });
    const result = await p.run({ val: 'b' });
    expect(result.context).toMatchObject({ chosen: 'b' });
  });

  it('unconditional fork acts as catch-all', async () => {
    const p = definePipeline('p', () => {
      node('gate', () => {
        fork('to-yes', target('yes'), (ctx: Record<string, unknown>) => ctx.ok === true);
        fork('to-no', target('no'));
      });
      node('yes', () => {
        action(async () => ({ chosen: 'yes' }));
        fork('next', target('end'));
      });
      node('no', () => {
        action(async () => ({ chosen: 'no' }));
        fork('next', target('end'));
      });
      node('end', terminal());
      return { initial: 'gate' };
    });
    const result = await p.run({ ok: false });
    expect(result.context).toMatchObject({ chosen: 'no' });
  });

  it('no matching fork produces status: stopped', async () => {
    const p = definePipeline('p', () => {
      node('gate', () => {
        fork('to-end', target('end'), (ctx: Record<string, unknown>) => Boolean(ctx.never));
      });
      node('end', terminal());
      return { initial: 'gate' };
    });
    const result = await p.run({});
    expect(result.status).toBe('stopped');
    expect(result.finalNode).toBe('gate');
  });

  it('terminal node produces status: completed', async () => {
    const p = definePipeline('p', () => {
      node('only', terminal(async () => ({ done: true })));
      return { initial: 'only' };
    });
    const result = await p.run({});
    expect(result.status).toBe('completed');
    expect(result.finalNode).toBe('only');
    expect(result.context).toMatchObject({ done: true });
  });

  it('terminal node with final action merges patch before completion', async () => {
    const p = definePipeline('p', () => {
      node('start', () => { fork('next', target('end')); });
      node('end', terminal(async () => ({ finalized: true })));
      return { initial: 'start' };
    });
    const result = await p.run({});
    expect(result.status).toBe('completed');
    expect(result.context).toMatchObject({ finalized: true });
  });
});

describe('pipeline run result shape', () => {
  it('completed result includes all required fields', async () => {
    const p = definePipeline('my-pipe', () => {
      node('end', terminal());
      return { initial: 'end' };
    });
    const result = await p.run({ x: 1 });
    expect(result.status).toBe('completed');
    expect(result.pipelineId).toBe('my-pipe');
    expect(typeof result.finalNode).toBe('string');
    expect(typeof result.traceId).toBe('string');
    expect(result.traceId.length).toBeGreaterThan(0);
    expect(Array.isArray(result.localTrace)).toBe(true);
    expect(result.localTrace.length).toBeGreaterThan(0);
  });
});

describe('sub-pipeline embedding', () => {
  it('sub-pipeline context merges into parent', async () => {
    const sub = definePipeline('sub', () => {
      node('work', terminal(async () => ({ charged: true })));
      return { initial: 'work' };
    });
    const parent = definePipeline('parent', () => {
      node('start', () => { fork('to-sub', target(sub)); });
      return { initial: 'start' };
    });
    const result = await parent.run({});
    expect(result.context).toMatchObject({ charged: true });
  });
});

describe('ActionInput — node action and terminal action input shape', () => {
  it('node action receives ActionInput with source=nodeId, scope=pipelineId, payload=runInput, traceId', async () => {
    let capturedInput: unknown;
    const p = definePipeline('my-pipeline', () => {
      node('validate-card', () => {
        action(async (_ctx, input) => { capturedInput = input; return { seen: input.source }; });
        fork('next', target('done'));
      });
      node('done', terminal());
      return { initial: 'validate-card' };
    });
    const runInput = { amount: 100 };
    await p.run({}, runInput);
    expect(capturedInput).toMatchObject({
      source: 'validate-card',
      scope: 'my-pipeline',
      payload: runInput,
      traceId: expect.any(String),
    });
  });

  it('terminal(fn) final action receives ActionInput and merges patch before completed', async () => {
    let capturedInput: unknown;
    const p = definePipeline('my-pipeline', () => {
      node('start', () => { fork('next', target('charge')); });
      node('charge', terminal(async (_ctx, input) => {
        capturedInput = input;
        return { at: input.source };
      }));
      return { initial: 'start' };
    });
    const result = await p.run({});
    expect(result.status).toBe('completed');
    expect(result.context).toMatchObject({ at: 'charge' });
    expect(capturedInput).toMatchObject({
      source: 'charge',
      scope: 'my-pipeline',
      traceId: expect.any(String),
    });
  });

  it('payload key is always present (value is undefined) when pipeline is run with no input', async () => {
    let capturedInput: unknown;
    const p = definePipeline('p-no-input', () => {
      node('only', () => {
        action(async (_ctx, input) => { capturedInput = input; return {}; });
        fork('next', target('done'));
      });
      node('done', terminal());
      return { initial: 'only' };
    });
    await p.run({});
    expect('payload' in (capturedInput as object)).toBe(true);
    expect((capturedInput as any).payload).toBeUndefined();
  });
});

describe('errorPolicy', () => {
  it('default (throw) propagates errors', async () => {
    const p = definePipeline('p', () => {
      node('boom', () => { action(async () => { throw new Error('boom'); }); });
      return { initial: 'boom' };
    });
    await expect(p.run({})).rejects.toThrow('boom');
  });

  it('return policy captures error in result', async () => {
    const p = definePipeline<Record<string, unknown>>('p', () => {
      node('boom', () => { action(async () => { throw new Error('boom'); }); });
      return { initial: 'boom' };
    }, { errorPolicy: 'return' });
    const result = await p.run({});
    expect(result.status).toBe('error');
    expect((result.error as Error).message).toBe('boom');
  });

  it('trace-and-return records failed event and returns result', async () => {
    const tracer = createTracer();
    const p = definePipeline<Record<string, unknown>>('p', () => {
      node('boom', () => { action(async () => { throw new Error('boom'); }); });
      return { initial: 'boom' };
    }, { errorPolicy: 'trace-and-return', tracer });
    const result = await p.run({});
    expect(result.status).toBe('error');
    const failedEvents = tracer.history().filter(e => e.status === 'failed');
    expect(failedEvents.length).toBeGreaterThan(0);
  });
});
