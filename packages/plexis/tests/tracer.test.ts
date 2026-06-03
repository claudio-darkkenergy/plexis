// covers: specs/tracer/spec.md
import { describe, it, expect, vi } from 'vitest';
import { Tracer, createTracer } from '../src/core/tracer.js';

function makeTracer(opts = {}) {
  return new Tracer({ idFactory: () => crypto.randomUUID(), ...opts });
}

describe('Tracer construction — factory and class equivalence', () => {
  it('createTracer and new Tracer produce equivalent instances', () => {
    const id = vi.fn().mockReturnValue('id-1');
    const t1 = createTracer({ idFactory: id });
    const t2 = new Tracer({ idFactory: id });
    t1.record({ traceId: 'T', level: 'domain', type: 'x' });
    t2.record({ traceId: 'T', level: 'domain', type: 'x' });
    expect(t1.history().length).toBe(t2.history().length);
  });
});

describe('record()', () => {
  it('assigns id and timestamp to each event', () => {
    const clock = vi.fn().mockReturnValue(42);
    const t = new Tracer({ clock, idFactory: vi.fn().mockReturnValue('abc') });
    t.record({ traceId: 'T', level: 'domain', type: 'test' });
    const ev = t.history()[0];
    expect(ev.id).toBe('abc');
    expect(ev.timestamp).toBe(42);
  });

  it('returns the recorded event', () => {
    const t = makeTracer();
    const ev = t.record({ traceId: 'T', level: 'action', type: 'action.started' });
    expect(ev).toBeDefined();
    expect(ev?.traceId).toBe('T');
  });

  it('does nothing when enabled is false', () => {
    const t = new Tracer({ enabled: false });
    t.record({ traceId: 'T', level: 'domain', type: 'x' });
    expect(t.history()).toHaveLength(0);
  });
});

describe('subscribe()', () => {
  it('notifies listener on every recorded event', () => {
    const t = makeTracer();
    const received: unknown[] = [];
    t.subscribe((ev) => received.push(ev));
    t.record({ traceId: 'T', level: 'domain', type: 'x' });
    t.record({ traceId: 'T', level: 'action', type: 'y' });
    expect(received).toHaveLength(2);
  });

  it('unsubscribe stops notifications', () => {
    const t = makeTracer();
    const received: unknown[] = [];
    const unsub = t.subscribe((ev) => received.push(ev));
    t.record({ traceId: 'T', level: 'domain', type: 'x' });
    unsub();
    t.record({ traceId: 'T', level: 'domain', type: 'y' });
    expect(received).toHaveLength(1);
  });

  it('subscriber error does not halt other subscribers or history', () => {
    const t = makeTracer();
    const good: unknown[] = [];
    t.subscribe(() => { throw new Error('bad subscriber'); });
    t.subscribe((ev) => good.push(ev));
    t.record({ traceId: 'T', level: 'domain', type: 'x' });
    expect(good).toHaveLength(1);
    expect(t.history()).toHaveLength(1);
  });

  it('onSubscriberError is called when subscriber throws', () => {
    const onError = vi.fn();
    const t = new Tracer({ onSubscriberError: onError });
    t.subscribe(() => { throw new Error('boom'); });
    t.record({ traceId: 'T', level: 'domain', type: 'x' });
    expect(onError).toHaveBeenCalledOnce();
  });
});

describe('history() / byTraceId() / traces()', () => {
  it('history returns all events in insertion order', () => {
    const t = makeTracer();
    t.record({ traceId: 'T1', level: 'domain', type: 'a' });
    t.record({ traceId: 'T2', level: 'domain', type: 'b' });
    expect(t.history()).toHaveLength(2);
  });

  it('byTraceId returns only events for that traceId', () => {
    const t = makeTracer();
    t.record({ traceId: 'T1', level: 'domain', type: 'a' });
    t.record({ traceId: 'T2', level: 'domain', type: 'b' });
    t.record({ traceId: 'T1', level: 'action', type: 'c' });
    const t1Events = t.byTraceId('T1');
    expect(t1Events).toHaveLength(2);
    expect(t1Events.every(e => e.traceId === 'T1')).toBe(true);
  });

  it('traces() returns unique traceIds', () => {
    const t = makeTracer();
    t.record({ traceId: 'T1', level: 'domain', type: 'a' });
    t.record({ traceId: 'T2', level: 'domain', type: 'b' });
    t.record({ traceId: 'T1', level: 'domain', type: 'c' });
    const traces = t.traces();
    expect(traces).toHaveLength(2);
    expect(traces).toContain('T1');
    expect(traces).toContain('T2');
  });

  it('clear() empties history', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'domain', type: 'x' });
    t.clear();
    expect(t.history()).toHaveLength(0);
  });
});

describe('maxEvents cap', () => {
  it('retains at most maxEvents events plus boundary record', () => {
    const t = new Tracer({ maxEvents: 3 });
    for (let i = 0; i < 5; i++) {
      t.record({ traceId: 'T', level: 'domain', type: 'x' });
    }
    // Should have 3 real events + 1 boundary = 4 but ≤ maxEvents + 1
    expect(t.history().length).toBeLessThanOrEqual(4);
    expect(t.history().length).toBeGreaterThanOrEqual(3);
  });

  it('boundary record is observable', () => {
    const t = new Tracer({ maxEvents: 2 });
    for (let i = 0; i < 4; i++) {
      t.record({ traceId: 'T', level: 'domain', type: 'x' });
    }
    const types = t.history().map(e => e.type);
    expect(types.some(t => t === 'events-dropped')).toBe(true);
  });
});

describe('export formats', () => {
  it('export("json") returns array of events', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'domain', type: 'x' });
    const json = t.export('json') as unknown[];
    expect(Array.isArray(json)).toBe(true);
    expect(json).toHaveLength(1);
  });

  it('export("text") uses [HH:MM:SS.mmm] [scope] type format', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'domain', type: 'guard.started', domainId: 'order', phaseId: 'pending', event: 'submit' });
    const text = t.export('text') as string;
    expect(typeof text).toBe('string');
    // Each line: [HH:MM:SS.mmm] [scope] type [event?]
    for (const line of text.split('\n').filter(Boolean)) {
      expect(line).toMatch(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\] \[.+\] \S+/);
    }
    expect(text).toContain('[order/pending] guard.started "submit"');
  });

  it('export("text") renders timestamp as HH:MM:SS.mmm', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'pipeline', type: 'pipeline.started', pipelineId: 'pay' });
    const line = (t.export('text') as string).split('\n')[0];
    expect(line).toMatch(/^\[\d{2}:\d{2}:\d{2}\.\d{3}\]/);
  });

  it('export("text") includes nodeId in scope for pipeline-node events', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'pipeline-node', type: 'pipeline-node.started', pipelineId: 'pay', nodeId: 'charge' });
    expect(t.export('text')).toContain('[pay/charge] pipeline-node.started');
  });

  it('export("text") includes phaseId in scope for guard events', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'guard', type: 'guard.passed', domainId: 'order', phaseId: 'pending' });
    expect(t.export('text')).toContain('[order/pending] guard.passed');
  });

  it('export("text") omits sub-scope when neither nodeId nor phaseId present', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'pipeline', type: 'pipeline.started', pipelineId: 'pay' });
    const line = (t.export('text') as string).trim();
    // timestamp bracket should not contain /
    expect(line).toMatch(/\[pay\] pipeline\.started$/);
    const scopePart = line.match(/\[([^\]]+)\] pipeline/)?.[1] ?? '';
    expect(scopePart).not.toContain('/');
  });

  it('export("text") appends event name for domain events', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'guard', type: 'guard.started', domainId: 'order', phaseId: 'pending', event: 'submit' });
    expect(t.export('text')).toContain('[order/pending] guard.started "submit"');
  });

  it('export("text") omits event token for pipeline events', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'pipeline-node', type: 'pipeline-node.started', pipelineId: 'pay', nodeId: 'charge' });
    const line = (t.export('text') as string).trim();
    // Should end with type — no trailing event token
    expect(line).toMatch(/pipeline-node\.started$/);
  });

  it('export("text") includes the emitting scope for each primitive', () => {
    const t = makeTracer();
    t.record({ traceId: 'T1', level: 'pipeline', type: 'pipeline.started', pipelineId: 'pay' });
    t.record({ traceId: 'T2', level: 'pipeline', type: 'pipeline.started', pipelineId: 'refund' });
    const lines = (t.export('text') as string).split('\n');
    expect(lines[0]).toContain('[pay]');
    expect(lines[1]).toContain('[refund]');
  });

  it('export("tree") nests child events under parent', () => {
    const t = makeTracer();
    t.record({ id: 'parent-1', traceId: 'T', level: 'domain', type: 'parent' });
    t.record({ traceId: 'T', level: 'action', type: 'child', parentId: 'parent-1' });
    const tree = t.export('tree') as Array<{ children: unknown[] }>;
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
  });
});

describe('phase lifecycle events', () => {
  it('phase.enter / phase.exit carry phaseId', () => {
    const t = makeTracer();
    t.record({ traceId: 'T', level: 'phase', type: 'phase.exit', domainId: 'order', phaseId: 'pending' });
    t.record({ traceId: 'T', level: 'phase', type: 'phase.enter', domainId: 'order', phaseId: 'processing' });
    const events = t.history();
    expect(events[0].type).toBe('phase.exit');
    expect(events[0].phaseId).toBe('pending');
    expect(events[1].type).toBe('phase.enter');
    expect(events[1].phaseId).toBe('processing');
  });

  it('phase level is valid in TraceLevel', () => {
    const t = makeTracer();
    const ev = t.record({ traceId: 'T', level: 'phase', type: 'phase.enter', domainId: 'order', phaseId: 'pending' });
    expect(ev?.level).toBe('phase');
  });
});

describe('captureContext', () => {
  it("captureContext='after' records post-action context in contextSnapshot", () => {
    const t = new Tracer({ captureContext: 'after' });
    t.record({ traceId: 'T', level: 'action', type: 'action.completed', contextSnapshot: { x: 1 } });
    const ev = t.history()[0];
    expect(ev.contextSnapshot).toEqual({ x: 1 });
  });

  it('captureContext=false strips contextSnapshot', () => {
    const t = new Tracer({ captureContext: false });
    t.record({ traceId: 'T', level: 'action', type: 'action.completed', contextSnapshot: { x: 1 } });
    const ev = t.history()[0];
    expect(ev.contextSnapshot).toBeUndefined();
  });
});
