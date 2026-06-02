/**
 * Order Domain Example
 *
 * Domain-level state machine for an e-commerce order lifecycle.
 * Demonstrates: defineDomain, definePipeline, when, on, enter, target, guard,
 * node, action, fork, terminal, createTracer, follow, can, snapshot/restore, history, trace.
 */
import {
  defineDomain,
  definePipeline,
  when,
  on,
  enter,
  target,
  guard,
  pipeline,
  node,
  action,
  fork,
  terminal,
  createTracer,
  PlexisError,
} from '../src/index.js';

interface OrderCtx {
  orderId: string;
  items: Array<{ sku: string; qty: number }>;
  submittedBy?: string;
  validOrder?: boolean;
  paymentReady?: boolean;
  rejected?: boolean;
  processingStartedAt?: number;
}

// ─── Edge pipeline: order validation ─────────────────────────────────────────

const tracer = createTracer({ captureContext: 'after' });

const validationPipeline = definePipeline<OrderCtx>('order-validation', () => {
  node('validate-order', () => {
    action(async (ctx: OrderCtx) => ({
      validOrder: Boolean(ctx.orderId && ctx.items?.length),
    }));
    fork('valid', target('check-payment'), (ctx: OrderCtx) => ctx.validOrder === true);
    fork('invalid', target('reject'));
  });

  node('check-payment', terminal(async () => ({ paymentReady: true })));
  node('reject',        terminal(async () => ({ rejected: true })));

  return { initial: 'validate-order' };
}, { tracer });

// ─── Domain: order lifecycle ──────────────────────────────────────────────────

const orderDomain = defineDomain<OrderCtx>('order', () => {
  when('pending', () => {
    on('submit', () => {
      guard((ctx: OrderCtx) => Boolean(ctx.orderId));
      action(async (_ctx, ev) => ({
        submittedBy: (ev.payload as { userId: string })?.userId,
      }));
      pipeline(validationPipeline);
      return target('processing');
    });
  });

  when('processing', () => {
    enter(async () => ({ processingStartedAt: Date.now() }));
    on('complete', target('done'));
  });

  when('done', terminal());

  return {
    context: { orderId: 'ORD-001', items: [{ sku: 'ABC', qty: 1 }] },
    initial: 'pending',
    strict: true,
  };
}, { tracer });

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Order Domain ===\n');
  console.log('Initial state:', orderDomain.state); // pending

  // Capture snapshot before SUBMIT for restore demo
  const snapBeforeSubmit = orderDomain.snapshot();

  // Follow SUBMIT
  const submitResult = await orderDomain.follow('submit', { userId: 'u_1' });
  console.log('\nAfter SUBMIT:');
  console.log('  follow result status:', submitResult.status);   // followed
  console.log('  current state:', orderDomain.state);            // processing
  console.log('  context:', orderDomain.context);

  // followFrom with wrong state → STATE_MISMATCH
  console.log('\n--- followFrom (wrong state) ---');
  try {
    await orderDomain.followFrom('pending', 'submit', { userId: 'u_2' });
  } catch (err) {
    if (err instanceof PlexisError) {
      console.log('Caught PlexisError code:', err.code); // STATE_MISMATCH
    }
  }

  // Use current proxy — can + follow
  console.log('\n--- current proxy ---');
  const canComplete = await orderDomain.current.can('complete');
  console.log('can COMPLETE:', canComplete); // true
  if (canComplete) {
    await orderDomain.current.follow('complete');
  }
  console.log('Final state:', orderDomain.state); // done

  // snapshot / restore
  console.log('\n--- snapshot / restore ---');
  const snapAfterDone = orderDomain.snapshot();
  console.log('Snapshot after done:', { state: snapAfterDone.state, historyLength: snapAfterDone.historyLength });
  orderDomain.restore(snapBeforeSubmit);
  console.log('Restored to:', orderDomain.state); // pending
  orderDomain.restore(snapAfterDone);
  console.log('Re-restored to:', orderDomain.state); // done

  // History
  console.log('\n--- History ---');
  for (const entry of orderDomain.history()) {
    console.log(`  ${entry.from} --${entry.event}--> ${entry.to}`);
  }

  // Trace
  console.log('\n--- Trace (tree, abbreviated) ---');
  type TreeNode = { type: string; domainId?: string; pipelineId?: string; stateId?: string; nodeId?: string; event?: string; children?: TreeNode[] };
  const tree = orderDomain.trace('tree') as TreeNode[];
  for (const root of (tree ?? []).slice(0, 5)) {
    const sub = root.stateId ?? root.nodeId;
    const scope = (root.domainId ?? root.pipelineId ?? '?') + (sub ? `/${sub}` : '');
    const ev = root.event ? ` ${root.event}` : '';
    console.log(`  [${scope}] ${root.type}${ev} (${(root.children ?? []).length} children)`);
  }
}

main().catch(console.error);
