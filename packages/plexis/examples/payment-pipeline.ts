/**
 * Payment Pipeline Example
 *
 * Standalone pipeline with branching logic using the composable API.
 * Demonstrates: definePipeline, node, action, fork, target, terminal, createTracer, run, trace.
 *
 * Flow: validate-card → (card-ok) fraud-check → (low-risk) charge
 *                    ↘ (card-invalid) decline    ↘ (high-risk) manual-review
 */
import { definePipeline, node, action, fork, target, terminal, createTracer } from '../src/index.js';

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
  node('validate-card', () => {
    action(async (ctx: PaymentCtx) => ({ cardValid: ctx.cardNumber.startsWith('4') }));
    fork('card-ok', target('fraud-check'), (ctx: PaymentCtx) => ctx.cardValid === true);
    fork('card-invalid', target('decline'));
  });

  node('fraud-check', () => {
    action(async () => ({ fraudScore: 0.12 }));
    fork('high-risk', target('manual-review'), (ctx: PaymentCtx) => (ctx.fraudScore ?? 0) > 0.5);
    fork('low-risk', target('charge'));
  });

  node('charge', terminal(async () => ({ charged: true })));
  node('manual-review', terminal(async () => ({ reviewRequired: true })));
  node('decline', terminal(async () => ({ charged: false })));

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
