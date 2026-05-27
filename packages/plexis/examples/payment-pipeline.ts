/**
 * Payment Pipeline Example
 *
 * Standalone pipeline with branching logic using the composable API.
 * Demonstrates: definePipeline, node, fork, terminal, createTracer, run, trace.
 *
 * Flow: validate-card → (card-ok) fraud-check → (low-risk) charge
 *                    ↘ (card-invalid) decline    ↘ (high-risk) manual-review
 */
import { definePipeline, node, fork, terminal, createTracer } from '../src/index.js';

interface PaymentCtx {
  cardNumber: string;
  amount: number;
  cardValid?: boolean;
  fraudScore?: number;
  charged?: boolean;
  reviewRequired?: boolean;
}

const tracer = createTracer({ captureContext: 'after' });

const paymentPipeline = definePipeline<PaymentCtx>('payment', () => {
  node('validate-card', {
    action: async (ctx) => ({
      cardValid: ctx.cardNumber.startsWith('4'),
    }),
    forks: [
      fork((ctx) => ctx.cardValid === true, 'fraud-check', { label: 'card-ok' }),
      fork(undefined, 'decline', { label: 'card-invalid' }),
    ],
  });

  node('fraud-check', {
    action: async () => ({ fraudScore: 0.12 }),
    forks: [
      fork((ctx) => (ctx.fraudScore ?? 0) > 0.5, 'manual-review', { label: 'high-risk' }),
      fork(undefined, 'charge', { label: 'low-risk' }),
    ],
  });

  node('charge', terminal({
    action: async () => ({ charged: true, txId: 'tx_123' }),
  }));

  node('manual-review', terminal({
    action: async () => ({ reviewRequired: true }),
  }));

  node('decline', terminal({
    action: async () => ({ charged: false }),
  }));

  return { initial: 'validate-card' };
}, { tracer });

async function main() {
  console.log('=== Payment Pipeline ===\n');

  // Run 1: valid Visa card → charge path
  const validResult = await paymentPipeline.run({
    cardNumber: '4242424242424242',
    amount: 99,
  });
  console.log('--- Valid card ---');
  console.log('Final node:', validResult.finalNode);  // charge
  console.log('Context:', validResult.context);
  console.log('Status:', validResult.status);

  tracer.clear();

  // Run 2: invalid card → decline path
  const invalidResult = await paymentPipeline.run({
    cardNumber: '9999999999999999',
    amount: 49,
  });
  console.log('\n--- Invalid card ---');
  console.log('Final node:', invalidResult.finalNode); // decline
  console.log('Context:', invalidResult.context);
  console.log('Status:', invalidResult.status);

  console.log('\n--- Trace (text) ---');
  console.log(paymentPipeline.trace('text'));
}

main().catch(console.error);
