// covers: public API surface — all named exports present
import { describe, it, expect } from 'vitest';
import * as plexis from '../src/index.js';

describe('public API surface', () => {
  it('exports all documented names', () => {
    expect(typeof plexis.defineDomain).toBe('function');
    expect(typeof plexis.definePipeline).toBe('function');
    expect(typeof plexis.createTracer).toBe('function');
    expect(typeof plexis.when).toBe('function');
    expect(typeof plexis.enter).toBe('function');
    expect(typeof plexis.exit).toBe('function');
    expect(typeof plexis.on).toBe('function');
    expect(typeof plexis.target).toBe('function');
    expect(typeof plexis.guard).toBe('function');
    expect(typeof plexis.pipeline).toBe('function');
    expect(typeof plexis.node).toBe('function');
    expect(typeof plexis.action).toBe('function');
    expect(typeof plexis.fork).toBe('function');
    expect(typeof plexis.terminal).toBe('function');
    expect(typeof plexis.Domain).toBe('function');
    expect(typeof plexis.Pipeline).toBe('function');
    expect(typeof plexis.Tracer).toBe('function');
    expect(typeof plexis.PlexisError).toBe('function');
  });

});
