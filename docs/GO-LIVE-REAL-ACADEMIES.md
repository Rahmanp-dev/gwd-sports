# Going live with real academies

Written for the first real, fee-paying deployment. Ordered by what breaks worst
if you get it wrong.

---

## 1. MONEY — Razorpay Route

### How it actually works

There are two settlement strategies (`lib/payments/settlement.ts`), and which
one an academy gets is decided by **one field**: `academy.rzp_account`.

| `rzp_account` | Strategy | What happens |
|---|---|---|
| Set (`acc_…`) | `razorpay_route_auto_split` | `createOrder` puts a `transfers[]` array on the order. Razorpay splits **at capture** — the academy's share goes to their linked account, GWD's stays in ours. Nobody has to remember anything. |
| Empty | `collect_and_manual_payout` | Every rupee lands in the GWD account. **GWD then owes the academy their share** and a human must transfer it. |

The second is not "Route off" — it creates a real liability. The obligation is
recorded on every payment, but discharging it is not automated.

### Per academy, before they take a single payment

1. In the **Razorpay dashboard** → *Route → Linked Accounts*, create a linked
   account for the academy. Their bank details live on Razorpay's side; we never
   store an account number.
2. Copy the account id — it looks like `acc_MnO1p2Q3r4S5t6`.
3. In GWD → **Super admin → Revenue → Settlement accounts**, pick the academy
   and paste it. The panel tells you live, before you save, whether the result
   is *Automatic*, *Manual payout required*, or *Route selected but no account
   linked*.
4. The dropdown marks every academy `✓ linked` or `— manual payout`, so you can
   see at a glance which ones are accruing a debt.

> `rzp_account` is deliberately **not** owner-writable (`updateGuard.ts`). An
> academy owner must never be able to point settlement at another account.

### Verify with one real payment

Do this once per academy, with a real small payment, before onboarding parents:

1. Use the academy's `/pay/<passportId>` link.
2. Complete it with a real method (UPI is cheapest).
3. In Razorpay → *Transactions → Orders*, open the order and confirm:
   - `notes.settlementStrategy` reads `razorpay_route_auto_split`
   - a **Transfer** exists, to the academy's `acc_…`, for the academy's share
4. In GWD → Fees & payments, confirm the row appears with the student's name.

If it says `collect_and_manual_payout`, the account was not linked when the
order was created. **Orders keep the strategy they were built with** — that is
deliberate; a payment must settle the way it was described when the parent
authorised it. Fix the account and take a new test payment. Do not expect the
old one to re-route.

### Switch keys to live

`.env.local` currently holds `rzp_test_…`. For production set:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_…
RAZORPAY_KEY_SECRET=…
```

**Also point the webhook** at `POST /api/webhooks/razorpay` for
`payment.captured`, with the matching `RAZORPAY_WEBHOOK_SECRET`. Without it a
payment still settles — the client confirmation call covers the common case —
but a parent who closes the tab mid-payment leaves a row stuck `pending`.
`scripts/reconcile-pending-payments.js` exists for exactly that: it asks
Razorpay what really happened and settles what was captured.

### The platform fee

1% by default (`DEFAULT_MARGIN_RATE_BPS = 100`), overridable per academy via
`platformFeePercent`. It is **added to the parent's total**, never deducted from
the academy's fee. `pricing.test.ts` pins the worked example — if you change the
rate that test fails on purpose, and the partner booklet must be corrected with
it.

---

## 2. SCHEDULED JOBS — reminders, digests, outbound messages

Everything runs through one endpoint: `POST /api/jobs/tick`, bearer-authed with
`CRON_SECRET`. It does dispatch → reminders → digest → send, and **every stage
guards itself against running twice**, so it is safe to call often and safe to
call from two places at once.

### Locally

```bash
npm run cron:local
npm run cron:once
node scripts/local-cron.js --every 5m
```

Run it on anything always-on. Stopping it loses nothing — events and queued
messages sit in the database until something ticks, and a machine that was off
for the weekend catches up on Monday without firing three days of backlog at a
parent, because the reminder cadence self-guards per student, stage and cycle.

### On Vercel

`vercel.json` already declares a daily cron at 03:00 UTC. That is enough for the
fee sweep but **not** for outbound messages: a parent who pays at 9am should get
their receipt at 9am, not at 3am tomorrow. Either run `local-cron` alongside it,
or host somewhere with a real scheduler.

**Set `CRON_SECRET` in the deployment environment**, not only in `.env.local`.
Verified: the endpoint returns **401** without it.

---

## 3. IMPORTING REAL STUDENTS

The wizard stages everything before writing — CSV, a photo of a register, or
pasted text. Review the staged table, fix numbers, then commit.

**Phone numbers are the thing to get right.** A number that will not normalise
to a valid Indian mobile means no Passport can be issued (it is part of the
identity key), and therefore no welcome message, no fee reminders and no
attendance confirmations.

`GET /api/admin/backfill-passports` reports exactly which students are stuck and
why, without writing anything. `POST` repairs the ones it can. Run the GET after
every import.

Correcting a number afterwards is safe: `applyIdentityChange.ts` cascades it
across the account, the enrolment record and every Sports Passport that number
is the parent on, rebuilding the identity key — or refuses with a clear message
if it would collide with an existing record.

---

## 4. WHAT AN OWNER CAN AND CANNOT DO

**Owner-writable** (`lib/academy/updateGuard.ts`): name, description, location,
contact, sports, facilities, timings, images, theme, fees, achievements, star
players, registered teams, attendance geofence.

**Platform-admin only**: `rzp_account`, `settlementStrategy`,
`platformFeePercent`, `verificationStatus`, `ecosystemScore`, `ownerId`, and
`coordinates` (the public map pin).

Renaming an academy cascades. `PUT /api/academy/[id]` detects the rename and
rewrites every denormalised copy across passports and achievements, matching on
`academyId` and never on the name string. **Verified against the live
database** — the rename, its reversal, and that other academies are untouched.

---

## 5. BEFORE THE FIRST PARENT PAYS — checklist

- [ ] Razorpay **live** keys in the deployment environment
- [ ] Webhook configured and `RAZORPAY_WEBHOOK_SECRET` set
- [ ] Every academy has `rzp_account` linked — or you have **deliberately**
      accepted the manual-payout liability for them
- [ ] One real end-to-end test payment per academy, order inspected in Razorpay
- [ ] `CRON_SECRET` set in the deployment environment
- [ ] A scheduler actually running (`npm run cron:local` counts)
- [ ] `DB_URI` points at production **and the deployment IP is on the Atlas
      whitelist** — this silently broke mid-development, and when it happens
      every route returns 500
- [ ] WhatsApp templates approved in Meta (`npm run whatsapp:doctor`)
- [ ] Import run, then `GET /api/admin/backfill-passports` shows 0 blocked
- [ ] Each academy's fee plan set — **without it parents cannot pay at all**
- [ ] Each academy has at least one batch, or QR check-in cannot work

---

## 6. KNOWN GAPS — deliberately not built

- **Kit requests and payment for items.** Not started. Needs a request model, an
  approval lifecycle, a payments path and a WhatsApp template.
- **Automated payout for `collect_and_manual_payout`.** The liability is
  recorded per payment; transferring it is a human job.
- **Per-sport performance metrics.** The taxonomy is four generic categories.
  Making it credible needs real input from your coaches, not invention.
- **Content Engine and school campaigns.** Roadmap. Marked "In build" everywhere
  they appear.
