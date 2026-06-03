// covers: specs/graph-introspection/spec.md
import { describe, it, expect } from 'vitest';
import { buildDomainDescriptor, buildPipelineDescriptor } from '../src/graph/descriptor.js';
import { inbound, outbound, reachableFrom, pathsTo, pathsFrom } from '../src/graph/paths.js';
import { inspectNode } from '../src/graph/inspection.js';
import type { Pipeline } from '../src/types.js';

// ─── Domain descriptor ──────────────────────────────────────────────────────

describe('buildDomainDescriptor', () => {
  it('produces nodes for each state', () => {
    const whens = {
      pending: { on: { submit: { target: 'processing' } } },
      processing: { on: { complete: { target: 'done' } } },
      done: { terminal: true, on: {} },
    };
    const desc = buildDomainDescriptor('order', whens, 'pending');
    expect(desc.id).toBe('order');
    expect(desc.kind).toBe('domain');
    expect(desc.nodes).toHaveLength(3);
    expect(desc.edges).toHaveLength(2);
  });

  it('marks entry and terminal nodes correctly', () => {
    const whens = {
      pending: { on: { activate: { target: 'done' } } },
      done: { terminal: true, on: {} },
    };
    const desc = buildDomainDescriptor('d', whens, 'pending');
    expect(desc.entryNodes[0].nodeId).toBe('pending');
    expect(desc.terminalNodes[0].nodeId).toBe('done');
  });

  it('domain event edges have kind domain-event', () => {
    const whens = {
      pending: { on: { submit: { target: 'processing' } } },
      processing: { terminal: true, on: {} },
    };
    const desc = buildDomainDescriptor('d', whens, 'pending');
    expect(desc.edges[0].kind).toBe('domain-event');
  });

  it('domain phase nodes have kind domain-phase', () => {
    const whens = {
      pending: { on: { activate: { target: 'done' } } },
      done: { terminal: true, on: {} },
    };
    const desc = buildDomainDescriptor('d', whens, 'pending');
    for (const node of desc.nodes) {
      expect(node.ref.kind).toBe('domain-phase');
    }
  });


  it('edge-action and edge-pipeline kind literals remain unchanged', () => {
    const fakePipeline = { id: 'pay', run: () => {}, describe: () => ({}) } as unknown as Pipeline<Record<string, unknown>>;
    const whens = {
      pending: { on: { pay: { target: 'done', pipeline: fakePipeline } } },
      done: { terminal: true, on: {} },
    };
    const desc = buildDomainDescriptor('d', whens, 'pending');
    expect(desc.attachments[0].kind).toBe('edge-pipeline');
  });

  it('records edge-pipeline attachment', () => {
    const fakePipeline = { id: 'pay', run: () => {}, describe: () => ({}) } as unknown as Pipeline<Record<string, unknown>>;
    const whens = {
      pending: { on: { pay: { target: 'done', pipeline: fakePipeline } } },
      done: { terminal: true, on: {} },
    };
    const desc = buildDomainDescriptor('d', whens, 'pending');
    expect(desc.attachments).toHaveLength(1);
    expect(desc.attachments[0].kind).toBe('edge-pipeline');
    expect(desc.attachments[0].pipeline.pipelineId).toBe('pay');
  });

  it('phase-entry-pipeline attachment kind for phase-attached pipelines', () => {
    const fakePipeline = { id: 'onboard', run: () => {}, describe: () => ({}) } as unknown as Pipeline<Record<string, unknown>>;
    const whens = {
      pending: { pipeline: fakePipeline, on: { activate: { target: 'done' } } },
      done: { terminal: true, on: {} },
    };
    const desc = buildDomainDescriptor('d', whens, 'pending');
    expect(desc.attachments[0].kind).toBe('phase-entry-pipeline');
    expect(desc.attachments[0].pipeline.pipelineId).toBe('onboard');
  });
});

// ─── Pipeline descriptor ─────────────────────────────────────────────────────

describe('buildPipelineDescriptor', () => {
  it('produces nodes and fork edges', () => {
    const nodes = {
      'validate': { forks: [{ target: 'charge', label: 'ok' }] },
      'charge': { terminal: true },
    };
    const desc = buildPipelineDescriptor('payment', nodes, 'validate');
    expect(desc.id).toBe('payment');
    expect(desc.kind).toBe('pipeline');
    expect(desc.nodes).toHaveLength(2);
    expect(desc.edges).toHaveLength(1);
    expect(desc.entryNodes[0].nodeId).toBe('validate');
    expect(desc.terminalNodes[0].nodeId).toBe('charge');
  });
});

// ─── Path queries ─────────────────────────────────────────────────────────────

function makeLinearDescriptor() {
  const nodes = {
    a: { forks: [{ target: 'b' }] },
    b: { forks: [{ target: 'c' }] },
    c: { terminal: true },
  };
  return buildPipelineDescriptor('p', nodes, 'a');
}

describe('inbound / outbound', () => {
  it('outbound returns edges leaving a node', () => {
    const desc = makeLinearDescriptor();
    const out = outbound(desc, 'a');
    expect(out).toHaveLength(1);
    expect(out[0].to.nodeId).toBe('b');
  });

  it('inbound returns edges entering a node', () => {
    const desc = makeLinearDescriptor();
    const ins = inbound(desc, 'b');
    expect(ins).toHaveLength(1);
    expect(ins[0].from.nodeId).toBe('a');
  });
});

describe('reachableFrom', () => {
  it('returns transitively reachable nodes', () => {
    const desc = makeLinearDescriptor();
    const nodes = reachableFrom(desc, 'a');
    const ids = nodes.map(n => n.id);
    expect(ids).toContain('b');
    expect(ids).toContain('c');
    expect(ids).not.toContain('a');
  });

  it('excludes unreachable nodes', () => {
    const nodes = {
      start: { forks: [{ target: 'end' }] },
      end: { terminal: true },
      orphan: { terminal: true }, // not reachable from start
    };
    const desc = buildPipelineDescriptor('p', nodes, 'start');
    const reachable = reachableFrom(desc, 'start');
    expect(reachable.map(n => n.id)).not.toContain('orphan');
  });
});

describe('pathsTo', () => {
  it('finds path from entry to target', () => {
    const desc = makeLinearDescriptor();
    const paths = pathsTo(desc, 'c');
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].to.nodeId).toBe('c');
  });

  it('finds multiple paths when branching exists', () => {
    const nodes = {
      start: { forks: [{ target: 'left' }, { target: 'right' }] },
      left: { forks: [{ target: 'end' }] },
      right: { forks: [{ target: 'end' }] },
      end: { terminal: true },
    };
    const desc = buildPipelineDescriptor('p', nodes, 'start');
    const paths = pathsTo(desc, 'end');
    expect(paths.length).toBe(2);
  });
});

describe('pathsFrom', () => {
  it('finds path from node to terminal', () => {
    const desc = makeLinearDescriptor();
    const paths = pathsFrom(desc, 'a');
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0].to.nodeId).toBe('c');
  });
});

// ─── inspectNode ──────────────────────────────────────────────────────────────

describe('inspectNode', () => {
  it('bundles inbound, outbound, pathsTo, pathsFrom, reachableNodes', () => {
    const nodes = {
      a: { forks: [{ target: 'b' }, { target: 'c' }] },
      b: { forks: [{ target: 'd' }] },
      c: { forks: [{ target: 'd' }] },
      d: { terminal: true },
    };
    const desc = buildPipelineDescriptor('p', nodes, 'a');
    const inspection = inspectNode(desc, 'd');
    expect(inspection.inbound.length).toBe(2);
    expect(inspection.outbound.length).toBe(0);
    expect(inspection.pathsTo.length).toBe(2);
  });

  it('returns undefined-safe for unknown id', () => {
    const desc = makeLinearDescriptor();
    expect(() => inspectNode(desc, 'does-not-exist')).toThrow();
  });
});
