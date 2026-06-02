/**
 * Graph Inspection Example
 *
 * Static graph introspection over a pipeline and a domain.
 * Demonstrates: inspectNode, pathsTo, pathsFrom, reachableFrom,
 * inbound/outbound edges, describe(), cross-boundary GraphNodeRef inspection.
 */
import {
  defineDomain,
  definePipeline,
  when,
  on,
  target,
  pipeline,
  node,
  action,
  fork,
  terminal,
} from '../src/index.js';

// ─── Payment pipeline ─────────────────────────────────────────────────────────

interface PayCtx {
  cardNumber?: string;
  cardValid?: boolean;
  fraudScore?: number;
  charged?: boolean;
  reviewRequired?: boolean;
}

const paymentPipeline = definePipeline<PayCtx>('payment', () => {
  node('validate-card', () => {
    action(async (ctx: PayCtx) => ({ cardValid: ctx.cardNumber?.startsWith('4') }));
    fork('card-ok', target('fraud-check'), (ctx: PayCtx) => ctx.cardValid === true);
    fork('card-invalid', target('decline'));
  });

  node('fraud-check', () => {
    action(async () => ({ fraudScore: 0.12 }));
    fork('high-risk', target('manual-review'), (ctx: PayCtx) => (ctx.fraudScore ?? 0) > 0.5);
    fork('low-risk', target('charge'));
  });

  node('charge', terminal(async () => ({ charged: true })));
  node('manual-review', terminal(async () => ({ reviewRequired: true })));
  node('decline', terminal(async () => ({ charged: false })));

  return { initial: 'validate-card' };
});

// ─── Order domain ─────────────────────────────────────────────────────────────

interface OrderCtx { orderId?: string }

const orderDomain = defineDomain<OrderCtx>('order', () => {
  when('pending', () => {
    on('submit', () => {
      pipeline(paymentPipeline);
      return target('processing');
    });
  });
  when('processing', () => {
    on('complete', target('done'));
  });
  when('done', terminal());

  return { context: { orderId: 'ORD-001' }, initial: 'pending', strict: true };
});

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Pipeline introspection ──────────────────────────────────────────────────
  console.log('=== Pipeline: fraud-check node ===\n');

  const fraudInspection = paymentPipeline.inspectNode('fraud-check');

  console.log('Inbound edges:');
  for (const e of fraudInspection.inbound) {
    console.log(`  ${e.from.nodeId} --[${e.label ?? ''}]--> ${e.to.nodeId}`);
  }

  console.log('Outbound edges:');
  for (const e of fraudInspection.outbound) {
    console.log(`  ${e.from.nodeId} --[${e.label ?? ''}]--> ${e.to.nodeId ?? e.to.pipelineId}`);
  }

  console.log('Paths to fraud-check:');
  for (const p of fraudInspection.pathsTo) {
    const names = p.nodes.map(n => n.nodeId ?? n.pipelineId).join(' -> ');
    console.log('  ', names);
  }

  console.log('Reachable from fraud-check:');
  console.log('  ', fraudInspection.reachableNodes.map(n => n.id).join(', '));

  // ── Domain introspection ────────────────────────────────────────────────────
  console.log('\n=== Domain: processing state ===\n');

  const procInspection = orderDomain.inspectNode('processing');

  console.log('Inbound edges:');
  for (const e of procInspection.inbound) {
    console.log(`  ${e.from.nodeId} --${e.event ?? e.label}--> ${e.to.nodeId}`);
  }

  console.log('Outbound edges:');
  for (const e of procInspection.outbound) {
    console.log(`  ${e.from.nodeId} --${e.event ?? e.label}--> ${e.to.nodeId}`);
  }

  console.log('Reachable from pending:');
  const reachable = orderDomain.graph.reachableFrom('pending');
  console.log('  ', reachable.map(n => n.id).join(', '));

  // ── Descriptor ──────────────────────────────────────────────────────────────
  console.log('\n=== Domain describe() ===\n');

  const descriptor = orderDomain.describe();
  console.log('Nodes:', descriptor.nodes.map(n => n.id).join(', '));
  console.log('Attachments:', descriptor.attachments.map(a =>
    `${a.kind}:${a.pipeline.pipelineId}`
  ).join(', '));

  // ── Cross-boundary inspection ────────────────────────────────────────────────
  console.log('\n=== Cross-boundary: domain → pipeline node ===\n');

  try {
    const crossInspection = orderDomain.inspectNode({
      kind: 'pipeline-node',
      pipelineId: 'payment',
      nodeId: 'fraud-check',
    });
    console.log('fraud-check inbound (via domain):', crossInspection.inbound.map(e => e.from.nodeId).join(', '));
    console.log('fraud-check reachable (via domain):', crossInspection.reachableNodes.map(n => n.id).join(', '));
  } catch (err) {
    console.log('Cross-boundary note:', (err as Error).message);
  }
}

main().catch(console.error);
