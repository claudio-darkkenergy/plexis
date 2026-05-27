// covers: public API surface — all named exports present
import { describe, it, expect } from 'vitest';
import * as plexis from '../src/index.js';

describe('public API surface', () => {
  it('exports all documented names', () => {
    expect(typeof plexis.defineDomain).toBe('function');
    expect(typeof plexis.definePipeline).toBe('function');
    expect(typeof plexis.createTracer).toBe('function');
    expect(typeof plexis.state).toBe('function');
    expect(typeof plexis.edge).toBe('function');
    expect(typeof plexis.node).toBe('function');
    expect(typeof plexis.fork).toBe('function');
    expect(typeof plexis.terminal).toBe('function');
    expect(typeof plexis.Domain).toBe('function');
    expect(typeof plexis.Pipeline).toBe('function');
    expect(typeof plexis.Tracer).toBe('function');
    expect(typeof plexis.PlexisError).toBe('function');
  });
});
