// covers: specs/error-handling/spec.md → PlexisError typed subclass, Documented error codes, BUILDER_CLOSED requirement
import { describe, it, expect } from 'vitest';
import { PlexisError } from '../src/core/errors.js';

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
});
