/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Settles payments that Razorpay captured but this database still shows as
 * pending.
 *
 * WHY THIS IS NEEDED. Settlement happens in two places — the client's
 * confirmation call and the `payment.captured` webhook — and both funnel
 * through the same idempotent path. If NEITHER lands, the money is taken and
 * the student stays marked unpaid. That happens whenever the webhook cannot
 * reach the server: local development, an unconfigured deployment, or a tab
 * closed before the confirmation call went out.
 *
 * This asks Razorpay what actually happened to each pending order and settles
 * the ones it confirms as captured. Razorpay is the authority here, not us.
 *
 *   node scripts/reconcile-pending-payments.js            # report only
 *   node scripts/reconcile-pending-payments.js --apply    # settle
 *
 * Requires MONGODB_URI, RAZORPAY_KEY_ID (or NEXT_PUBLIC_RAZORPAY_KEY_ID) and
 * RAZORPAY_KEY_SECRET.
 */
const mongoose = require('mongoose');
const Razorpay = require('razorpay');

/** Only look back this far; older pending orders were almost certainly abandoned. */
const LOOKBACK_DAYS = 30;

async function main() {
  const apply = process.argv.includes('--apply');

  const uri = process.env.MONGODB_URI;
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!uri || !keyId || !keySecret) {
    console.error('Need MONGODB_URI, RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    process.exit(1);
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  await mongoose.connect(uri);
  const payments = mongoose.connection.db.collection('feepayments');

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const pending = await payments
    .find({ status: 'pending', createdAt: { $gte: since } })
    .toArray();

  console.log(`${pending.length} pending order(s) in the last ${LOOKBACK_DAYS} days.\n`);

  let captured = 0;
  let settled = 0;

  for (const row of pending) {
    let entities;
    try {
      const res = await razorpay.orders.fetchPayments(row.orderId);
      entities = res.items ?? [];
    } catch (err) {
      console.warn(`? ${row.orderId}: could not query Razorpay — ${err?.message ?? err}`);
      continue;
    }

    const success = entities.find((p) => p.status === 'captured' || p.status === 'authorized');
    if (!success) {
      console.log(`- ${row.orderId}: nothing captured, leaving pending`);
      continue;
    }

    captured++;
    console.log(
      `${apply ? 'settling' : 'would settle'} ${row.orderId} -> payment ${success.id}, ` +
        `₹${(success.amount / 100).toFixed(2)}`
    );

    if (!apply) continue;

    /**
     * Writes the same fields `settlePayment()` does, and credits the student
     * ledger by the ORDER's own studentId — never anything inferred here.
     * `settledAt: null` in the filter is the same idempotency guard the
     * application path uses, so running this twice cannot double-credit.
     */
    const result = await payments.updateOne(
      { _id: row._id, $or: [{ settledAt: null }, { settledAt: { $exists: false } }] },
      {
        $set: {
          status: 'success',
          paymentId: success.id,
          settledAt: new Date(),
          ...(typeof success.fee === 'number' ? { gatewayFeeActualPaise: success.fee } : {}),
        },
      }
    );

    if (result.modifiedCount === 0) {
      console.log(`  (already settled by the app in the meantime — skipped)`);
      continue;
    }

    if (row.studentId) {
      const rupees = (row.parentTotalPaise ?? Math.round((row.amount ?? 0) * 100)) / 100;
      await mongoose.connection.db.collection('studentprofiles').updateOne(
        { userId: row.studentId },
        {
          $inc: { totalFeesPaid: rupees, outstandingFees: -rupees },
        }
      );
    }
    settled++;
  }

  console.log(
    `\n${captured} captured at Razorpay, ${settled} settled here.` +
      (!apply && captured ? '\nRe-run with --apply to write.' : '')
  );
  console.log(
    '\nNOTE: receipt numbers are allocated lazily — open the receipt page for any\n' +
      'settled payment and it will be assigned one.'
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
