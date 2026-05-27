import type { MergeMetadata } from '../types.js';

export function mergePatch<TContext extends object>(
  previous: TContext,
  patch: Partial<TContext> | null | undefined | void
): TContext {
  if (patch == null) return previous;
  return { ...previous, ...patch };
}

export function applyMerge<TContext extends object>(
  previous: TContext,
  patch: Partial<TContext> | null | undefined | void,
  customMerge: ((prev: TContext, patch: Partial<TContext>, meta: MergeMetadata) => TContext) | undefined,
  metadata: MergeMetadata
): TContext {
  if (patch == null) return previous;
  if (customMerge) return customMerge(previous, patch, metadata);
  return mergePatch(previous, patch);
}
