// covers: specs/context-patches/spec.md
import { describe, it, expect, vi } from 'vitest';
import { mergePatch, applyMerge } from '../src/core/context.js';

describe('mergePatch', () => {
  it('shallow-merges patch over previous', () => {
    const prev = { a: 1, b: 2 };
    const next = mergePatch(prev, { b: 9, c: 3 });
    expect(next).toEqual({ a: 1, b: 9, c: 3 });
    expect(prev).toEqual({ a: 1, b: 2 });
  });

  it('returns new object reference', () => {
    const prev = { a: 1 };
    const next = mergePatch(prev, { b: 2 });
    expect(next).not.toBe(prev);
  });

  it('returns reference-equal previous for undefined patch', () => {
    const prev = { a: 1 };
    expect(mergePatch(prev, undefined)).toBe(prev);
  });

  it('returns reference-equal previous for null patch', () => {
    const prev = { a: 1 };
    expect(mergePatch(prev, null as unknown as undefined)).toBe(prev);
  });

  it('returns reference-equal previous for void patch', () => {
    const prev = { a: 1 };
    const voidVal: void = undefined;
    expect(mergePatch(prev, voidVal as unknown as undefined)).toBe(prev);
  });
});

describe('applyMerge', () => {
  it('uses default mergePatch when no customMerge provided', () => {
    const prev = { a: 1 };
    const result = applyMerge(prev, { b: 2 }, undefined, { phase: 'test' });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('invokes customMerge when provided', () => {
    const customMerge = vi.fn((_prev, _patch) => ({ deepMerged: true }));
    const prev = { a: 1 };
    const result = applyMerge(prev, { b: 2 }, customMerge, { phase: 'test' });
    expect(customMerge).toHaveBeenCalledOnce();
    expect(result).toEqual({ deepMerged: true });
  });

  it('passes metadata to customMerge', () => {
    const calls: unknown[] = [];
    const customMerge = (prev: object, patch: object, meta: object) => {
      calls.push(meta);
      return { ...prev, ...patch };
    };
    const meta = { phase: 'pipeline-action', pipelineId: 'pay', nodeId: 'charge' };
    applyMerge({ a: 1 }, { b: 2 }, customMerge, meta);
    expect(calls[0]).toMatchObject(meta);
  });

  it('returns reference-equal previous for null/undefined patch even with customMerge', () => {
    const customMerge = vi.fn();
    const prev = { a: 1 };
    expect(applyMerge(prev, undefined, customMerge, { phase: 'test' })).toBe(prev);
    expect(customMerge).not.toHaveBeenCalled();
  });
});
