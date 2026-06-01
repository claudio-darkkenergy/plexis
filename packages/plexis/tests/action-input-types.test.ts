// covers: tighten-action-input-typing — type-level assertions
// Tasks 2.1: action's input resolves to ActionInput in every scope.
// Task 2.2: removed names (OnActionInput, PipelineActionInput) are no longer exported.
import { describe, it, expectTypeOf } from 'vitest';
import type { ActionInput } from '../src/types.js';
import { definePipeline } from '../src/core/pipeline.js';
import { defineDomain } from '../src/core/domain.js';
import { node, action, fork, on, target, terminal, when } from '../src/core/helpers.js';

// ─── Negative: removed type names must not be exported ───────────────────────

// @ts-expect-error — OnActionInput must not be exported from index
type _OnActionInputGone = import('../src/index.js').OnActionInput;

// @ts-expect-error — PipelineActionInput must not be exported from index
type _PipelineActionInputGone = import('../src/index.js').PipelineActionInput;

// ─── Positive: action input is ActionInput in every scope ─────────────────────

describe('ActionInput type-level assertions', () => {
  it('action input in `node` scope is ActionInput with all four fields readable', () => {
    definePipeline('p-type-test', () => {
      node('x', () => {
        action((_ctx, input) => {
          expectTypeOf(input).toEqualTypeOf<ActionInput>();
          expectTypeOf(input.source).toEqualTypeOf<string>();
          expectTypeOf(input.scope).toEqualTypeOf<string>();
          expectTypeOf(input.payload).toEqualTypeOf<unknown>();
          expectTypeOf(input.traceId).toEqualTypeOf<string>();
          return {};
        });
        fork(undefined, 'x');
      });
      return { initial: 'x' };
    });
  });

  it('action input in `on` scope is ActionInput with all four fields readable', () => {
    defineDomain('d-type-test', () => {
      when('a', () => {
        on('go', () => {
          action((_ctx, input) => {
            expectTypeOf(input).toEqualTypeOf<ActionInput>();
            expectTypeOf(input.source).toEqualTypeOf<string>();
            expectTypeOf(input.scope).toEqualTypeOf<string>();
            expectTypeOf(input.payload).toEqualTypeOf<unknown>();
            expectTypeOf(input.traceId).toEqualTypeOf<string>();
            return {};
          });
          return target('a');
        });
      });
      return { context: {}, initial: 'a' };
    });
  });

  it('terminal(fn) action input is ActionInput with all four fields readable', () => {
    definePipeline('p-terminal-type-test', () => {
      node('end', terminal((_ctx, input) => {
        expectTypeOf(input).toEqualTypeOf<ActionInput>();
        expectTypeOf(input.source).toEqualTypeOf<string>();
        expectTypeOf(input.scope).toEqualTypeOf<string>();
        expectTypeOf(input.payload).toEqualTypeOf<unknown>();
        expectTypeOf(input.traceId).toEqualTypeOf<string>();
        return {};
      }));
      return { initial: 'end' };
    });
  });
});
