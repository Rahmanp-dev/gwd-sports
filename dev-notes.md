# GWD Sports Ecosystem — Development Notes

Running engineering log. **Append new entries at the bottom.** Newest work is last.

**Conventions**
- Timestamps are IST (`+05:30`), format `YYYY-MM-DD HH:MM`.
- Times recorded here are **observed checkpoints** — actual test-run and build
  completion times — not per-file edit times. File mtimes are not a reliable
  record (a `git stash` round-trip rewrites them all), so verification runs are
  the timestamps worth trusting.
- Every entry should state: what was built, what was **verified and how**, what
  assumptions were made, and what is still blocked or undecided.
- Record bugs *found* as well as bugs *fixed* — a bug the tests caught before
  release is the most useful thing in this file six months from now.

---

## Session 1 — 2026-07-25 · Phase 0 (payment hardening) + Phase 1 (bulk onboarding)

**Branch:** `feat/onboarding-and-payment-hardening` (off `main`)
**State at end of session:** not committed, not pushed. 97 tests passing,
`tsc --noEmit` clean, `next build` compiles.

### 12:03 – 12:25 · Codebase inspection (no code written)

Audited the repo against the four-phase brief before building anything.

Key findings:

- **One codebase, not MERN.** Single Next.js 15 App Router app in `src/`. The
  Express `backend/` folder looks abandoned — separate `package.json`, its own
  `.env`, and several schema files are **0 bytes** (`attendanceSchema.ts`,
  `kitSchema.ts`, `performanceSchema.ts`). Treated as dead; all work went into
  `src/`. **Confirm before deleting.**
- **Did not exist at all** (grep-confirmed): Passport model, Batch/Session model,
  Attendance collection, any WhatsApp/Interakt code, any queue (no Redis, no
  Bull), OCR/vision, CSV import, QR codes, settlement abstraction,
  reconciliation job, **and no test runner**.
- **No parent identity anywhere.** Roles are `admin`/`trainer`/`student`. A
  parent's number lived only on the student's own `User.phone` or buried in
  `medicalInfo.emergencyContact`. Phases 2 and 3 both depend on
  parent-by-phone lookup, so this was the first thing to fix.
- `middleware.ts` already reserved `/passport` and `/rankings` paths — someone
  planned Passport; nothing was built.
- `npx tsc --noEmit` passed clean before any changes. Good baseline.

Ten payment defects found in code that is live and handling real money. The
three most serious became "Phase 0" below.

### 12:25 – 12:31 · Vitest + money math

Installed Vitest (`npm i -D vitest`), added `vitest.config.ts` with the `@/`
alias, and `test` / `test:watch` / `test:money` scripts.

Wrote `src/lib/payments/money.ts`. Two rules enforced in that file:

1. **Integer paise only.** No rupee floats in any money path.
2. **GWD's net is the residual**, defined as
   `parentTotal − academyAmount − gatewayFee`. This makes the balance invariant
   true *by construction* rather than by luck, and parks every rounding
   remainder in the only share we're entitled to touch. The academy's cut is
   never reduced by rounding.

Fixed the gross-up. The old formula levied Razorpay's 2.36% on the *pre-fee
subtotal*, but Razorpay charges on the **total captured**, so the shortfall was
eaten silently out of GWD's margin:

```
before:  parent ₹3,101.51 → academy ₹3,000 + Razorpay ₹73.20 + GWD ₹28.31   (₹1.69 short, 5.6% of margin)
after:   parent ₹3,104.00 → academy ₹3,000 + Razorpay ₹73.25 + GWD ₹30.75   (balances exactly)

correct formula:  total = (base + margin) / (1 − gatewayRate), rounded UP to whole rupee
```

**✅ 12:30:57 — 24/24 money tests passing.** Includes a dense sweep of 20,000
consecutive paise values at zero drift, and 7 margin rates × 5 gateway rates.

### 12:31 – 12:41 · Settlement path + webhook

- `settle.ts` — one idempotent `settlePayment()`. Atomic compare-and-set on
  `settledAt` is the lock; whichever caller wins does the crediting, the loser
  is a no-op. Credits **`payment.studentId`**, never the authenticated caller.
- `webhook.ts` + `webhookRoute.ts` + `POST /api/payments/webhook` — handles
  `payment.captured`, `order.paid`, `payment.failed`, `refund.*`, and all
  `subscription.*`. The legacy `/api/payments/subscription/webhook` path now
  delegates to the same handler, so the URL already registered in the Razorpay
  dashboard keeps working and can be retired whenever convenient.
- `DomainEvent` model + `events/emit.ts` — persisted event log, deliberately
  **not** an in-process EventEmitter (which would drop events on deploy, crash
  or cold start; a dropped welcome message means a parent silently never hears
  from us). Doubles as Phase 2's job queue via `status` + `availableAt`.
- `FeePayment` extended with exact paise fields alongside the legacy rupee
  fields, plus `gatewayFeeActualPaise` (Razorpay's *real* fee, not our
  estimate), `settledAt`, `settlementStrategy`, `refundedTotalPaise`.
  `paymentId` is now uniquely indexed.

**Webhook status-code policy changed deliberately.** Old handler returned 200
to everything, including signature failures and internal errors — so a missing
secret was invisible (dashboard showed 100% delivery success while every event
was dropped) and any transient DB error permanently lost a payment. Now:
`200` processed · `401` bad signature · `503` secret not configured ·
`500` processing failed so Razorpay retries. A retry storm is far cheaper than
a lost payment.

**✅ 12:40:39 — 34/34 passing** (money + settlement strategy).

### 12:41 – 12:50 · Remaining Phase 0 fixes + import parsers

Closed the amount-tampering and wrong-student bugs (see table below), then
built the three import pathways.

Extracted `recordOfflinePayment()` into `payments/offline.ts` because
`payments/pay` and `student/pay-fees` were two divergent implementations of the
same operation — one credited the wrong student, the other wrote no
`FeePayment` record at all, and neither checked tenant boundaries. One
implementation is easier to keep correct than two.

**✅ 12:49:30 — 85/85 passing.**

### 12:50 – 13:00 · Phase 1 data model + commit pipeline

`Passport` is global and permanent, with a header comment listing four rules for
anyone who edits it: no `academyId` scoping field, no tenant-filtered lookups,
never recreate on transfer, never regenerate `passportId`. `currentAcademyId` is
explicitly a *pointer*, not ownership.

Duplicate prevention is a **database guarantee**: unique index on
`identityKey = parentPhone::normalisedName`. Phone alone fails on siblings;
name alone fails on repeats. A concurrent-import race catches the duplicate-key
error and adopts the winner's document.

**✅ 12:59:56 — 97/97 passing.**

### 13:00 – 13:24 · UI, then full verification

Import wizard at **`/admin/import`** (wizard + activation dashboard, two tabs).
Review-table edits are debounced and **persisted server-side**, so a reload
part-way through reviewing 60 handwritten rows doesn't send the owner back to
the paper register. Exception rows sort to the top.

- **✅ 13:23:27 — 97/97 tests passing** (5 files).
- **✅ `npx tsc --noEmit` — clean.**
- **✅ `npx next build` — "Compiled successfully in 15.6s".** All six new routes
  registered: `/admin/import`, `/api/import/extract`,
  `/api/import/[jobId]`, `/api/import/[jobId]/commit`,
  `/api/payments/webhook`, `/api/academy/activation`.

---

### Phase 0 — what was fixed

| Defect | Fix |
|---|---|
| Money taken but never recorded if the browser tab closed. `verify-payment` was the *only* settlement path. | `payment.captured` / `order.paid` webhook. Two independent paths through one idempotent `settlePayment()`. `verify-payment` demoted to a convenience path. |
| `RAZORPAY_WEBHOOK_SECRET` unset → secret was `''` → every webhook silently dropped with a `console.warn` and an HTTP 200. | Missing secret returns **503 with a loud log**. Added to `env.ts` and `.env.example` with the exact event list to subscribe to. |
| Fee amount taken straight from the request body — anyone could pay ₹1 for a ₹3,000 month. | `dues.ts` derives it server-side: outstanding balance → per-student fee → academy schedule → **throw**. Never invents a number. |
| Gateway fee levied on the pre-fee subtotal; split didn't balance. | Correct gross-up in `money.ts`. Invariant now exact. |
| Credit landed on `auth.user._id` instead of `payment.studentId` — payment could hit the wrong student's ledger. Also not idempotent (replay double-counted). | Always credits `payment.studentId`. Idempotent via `settledAt`. Authorisation check added on the endpoint. |
| `payments/pay` used `adminMiddleware` then resolved the student as `auth.user._id` — an owner recording a cash payment credited **their own** profile. | Shared `recordOfflinePayment()` with a `studentUserId` and a tenant check. |
| `GET /payments/outstanding` **wrote to the DB** — set `outstandingFees = 500` from a hardcoded constant, fabricating debts. | Read-only. Amount from `resolveAmountDue()`. Returns a clear "no fee configured" state instead of guessing. |
| `$inc` drove balances negative; negative balances silently dropped students out of the `outstandingFees > 0` defaulters report. | Clamped at zero. |
| `trainer/mark-attendance` looked up `StudentProfile` by `userId` alone — a coach at academy A could mark attendance for a student at academy B. | `academyId` filter added; 404 is indistinguishable from "not found" so it can't be used to probe other tenants' rosters. |
| Route auto-split was the only settlement path. | `settlement.ts` strategy interface. `razorpay_route_auto_split` and `collect_and_manual_payout`, resolved per academy. Turnover/legal caveat documented at the interface. |

### Phase 1 — what was built

**Models:** `Passport` (global, permanent), `Batch` (tenant-scoped, with
`qrToken` ready for Phase 3), `ImportJob` (staging), `DomainEvent` (event log +
queue). `StudentProfile` gained `passportId`, `parentName`/`parentPhone`/
`parentPhoneE164` (normalised, indexed), `batchId`, `importJobId`,
`feeAmount`/`feePeriod`/`feeDueDayOfMonth`. `User` gained
`isImportedPlaceholder`.

**Three pathways → one `ExtractedRow` shape:** GPT-4o Vision OCR (plain
`fetch`, no SDK dependency), WhatsApp text parser, CSV parser (no library —
hand-rolled RFC 4180 with flexible header aliasing).

**Nothing writes to student collections until confirm.** Extraction and edits
land on the `ImportJob`; only `POST /api/import/[jobId]/commit` creates records.
Rows commit **individually**, so row 43 failing still imports the other 59.

**Duplicates are flagged, never merged**, in plain language with names spelled
out — *"Shares number 9876543210 with Aditya Verma — siblings, or a copy-paste
error?"* A transfer is informational, not a blocker.

### `student.created` event payload — Phase 2's interface point

Carries everything needed to render a personalised message **without a database
round trip**, because a worker that re-reads four collections to fill a template
is exactly where "personalised per child" degrades into the same name on every
message.

```json
{
  "name": "student.created",
  "academyId": "665f...",
  "dedupeKey": "student.created:GWD-7K2M9X:665f...",
  "payload": {
    "eventVersion": 1,
    "passportId": "GWD-7K2M9X",
    "studentUserId": "...", "studentProfileId": "...",
    "studentName": "Rohan Sharma",
    "parentName": "Anil Sharma",
    "parentPhone": "+919876543210",
    "passportUrl": "https://gwd.in/passport/GWD-7K2M9X",
    "paymentUrl":  "https://gwd.in/pay/GWD-7K2M9X",
    "academyId": "...", "academyName": "MasterGrade Cricket", "academySlug": "mgfc",
    "sports": ["cricket"], "batchId": "...", "batchName": "Evening",
    "feeAmountPaise": 250000, "feePeriod": "monthly",
    "feeDueDayOfMonth": 5, "isFeeDue": true,
    "source": "import:register_ocr", "importJobId": "...",
    "passportReused": false, "transferredFrom": null,
    "createdAt": "2026-07-25T..."
  }
}
```

`dedupeKey` means re-importing a student can never send a second welcome
message. Money is integer paise — no template does float arithmetic on a fee.

### Bugs the tests caught before release

All three would have hit real data:

1. **Phone parser sliced across a `+91` prefix.** `"+91 98765 43210 2500"`
   yielded `9198765432` — a valid-looking, completely wrong number. Fixed by
   trying the longest valid reading first (12-digit `91`-prefixed before
   10-digit bare).
2. **Greedy match swallowed `phone - fee`.** `"Rohan - 9876543210 - 2500"`
   returned *no* phone at all, because space and dash are both intra-number
   separators *and* field separators. That is the shape of every real WhatsApp
   roster. Fixed by interpreting each candidate run as a whole first, then
   scanning for an embedded mobile.
3. **`"Rohan-Sharma"` ≠ `"Rohan Sharma"`** in name normalisation — punctuation
   was being deleted rather than replaced with a space, so the same child
   imported once from a register and once from a spreadsheet would have got
   **two passports**. Fixed; punctuation now becomes a space.

**Documented known limitation** (as a test, not papered over): dotted initials
(`"S.K. Sharma"` vs `"SK Sharma"`) still produce different identity keys.
Fixing it would merge `"A Kumar"` with `"Anil Kumar"`, which is worse. The
duplicate-phone flag catches it in review anyway.

---

### Assumptions taken (were not confirmed — revisit)

1. **Gateway rate defaults to 2.36%** (Razorpay 2% + 18% GST, **no input tax
   credit claimed**) — the conservative choice. **If GWD is GST-registered and
   reclaims that GST, set `GWD_GATEWAY_RATE_BPS=200`; net margin roughly
   quintuples.** Still a finance decision.
2. **Convenience rate model:** kept per-academy `platformFeePercent` as GWD's
   *target net margin* rather than switching to a flat 2.5%. Rates are
   env-configurable, so switching is config, not code.
   ⚠️ Three documents still disagree: `gwd_platform_edge_cases.html` says 2.5%
   (₹3,075 on ₹3,000), the code now charges ₹3,104, the Phase 4 brief says
   2.5–3%. **Needs one canonical answer.**
3. **`backend/` is dead.** Not touched.
4. **Queue is MongoDB-backed**, not Redis/Bull — no new infrastructure, and it
   gives durable per-message delivery tracking that Phase 2 needs anyway.
5. **OCR is GPT-4o Vision.** Degrades cleanly: without `OPENAI_API_KEY` the
   photo path returns a clear 503 and CSV/text import keep working.
6. **Test runner is Vitest.**

### Open items / gaps flagged rather than guessed

- **Activation dashboard reads 0% engaged until Phase 2 ships.** The counter is
  wired to real data (`Passport.parentFirstEngagedAt`), but nothing drives
  parents to their links yet. The UI says so explicitly rather than looking
  broken.
- **Subscription charges carry no GWD margin** (`gwdNetPaise: 0`). Fixing this
  needs the Razorpay *plan amounts* created with the convenience fee baked in —
  a plan-configuration decision that can't be back-derived without inventing
  numbers. Commented at the code site. Phase 4.
- **Imported students get a synthetic email** (`gwd-7k2m9x@import.gwd.in`)
  because `User.email` is required and uniquely indexed. Marked
  `isImportedPlaceholder: true`. The cleaner fix — making email sparse —
  requires dropping and rebuilding a unique index on a live collection, not done
  silently two days before customer onboarding.
  ⚠️ **Login and forgot-password should skip these accounts. Not yet changed.**
- **Refund gateway-fee reversal** assumes Razorpay returns its own fee. Whether
  it does is a term of the merchant agreement, not math. If it doesn't, most
  refunds become a net loss — a pricing decision, documented at
  `computeRefundSplit`.
- **Pre-existing, not introduced here:** duplicate Mongoose index warnings from
  `Subscription.ts` (`razorpaySubscriptionId`) and `Settings.ts` (`academyId`) —
  field-level `unique: true` plus an explicit `schema.index()` on the same path.
  Two-line fix, left alone as out of scope.

### 🚨 Blocker for launch (unchanged, time-sensitive)

**WhatsApp templates need Meta pre-approval via Interakt, and there are no
Interakt credentials in `.env`.** Every Phase 2 trigger is a separate template
(welcome, attendance, weekly digest, four payment reminders = 7). Approval takes
hours to days, longer with rejections.

**Phase 2 cannot deliver a single message on launch day without these approved,
however correct the code is.** Template submission can start immediately, in
parallel with development.

### Next up

Phase 2 — communication engine. Awaiting confirmation to start. Consumers to
build against the event log: `student.created` (welcome),
`attendance.created` (Phase 3 produces it), weekly digest scheduler, and the
four-stage payment reminder cadence with per-parent frequency capping and
priority ordering.

---

## Session 2 — 2026-07-25 · Phase 2 (WhatsApp communication engine)

**Branch:** `feat/onboarding-and-payment-hardening` (continued)
**State at end of session:** not committed, not pushed. **202 tests passing**
(up from 97), `tsc --noEmit` clean, `next build` compiles in 29.7s.

### 13:30 – 13:53 · Models + the pure scheduling core

Built `OutboundMessage` (queue + scheduler + delivery ledger in one collection)
and `OwnerAlert` (dashboard-only notifications, never sent to a parent).

One collection serves as queue *and* delivery ledger deliberately: per-message
sent/delivered/read/failed tracking was a hard requirement, so a durable row per
message had to exist regardless. A separate queue would just be a second source
of truth to keep in sync.

Then `scheduling.ts` — **pure functions, no database, no clock of its own**.
`now`, the candidates and the already-sent counts are all inputs. That was the
key architectural choice: "a parent mutes us because we sent five messages in one
day" cannot be reproduced by clicking around staging. It needs a simulated day,
and only pure logic can be simulated.

Rules implemented:
1. Lower priority number wins: payment(1) > attendance(2) > achievement(3) >
   broadcast(4).
2. Daily budget per parent. Once spent, messages are **deferred — never dropped,
   never sent anyway.**
3. Budget buckets by the **parent's local day**, not UTC. A cap rolling over at
   05:30 IST would hand every parent a double dose each morning.
4. **Payment reminders get one reserved slot** on top of the shared budget.
   Priority ordering alone cannot fix starvation, because the earlier
   lower-priority messages were already sent before the reminder existed.
5. Nothing sends during quiet hours (21:00–08:00 IST). A fee reminder at 03:00 is
   a complaint, not a nudge.

**✅ 13:53:54 — 29/29 scheduling tests passing.**

### 13:53 – 13:56 · Template registry + variable validation

Six Meta templates, with the **exact submission body text in comments** so they
can be filed with Interakt immediately (this is the launch blocker).

`gwd_fee_reminder_v1` serves all three parent-facing fee stages via a
stage-specific opening line. Three near-identical templates would mean three Meta
approvals and three chances of one stage silently breaking while the others pass.

Validation hard-fails rather than sending on: a missing required variable, an
unrendered `{{1}}`, and the literals `undefined` / `null` / `NaN` /
`Invalid Date` / `[object Object]`. "Hi undefined, Rohan's fee of ₹NaN is due on
Invalid Date" destroys trust in one message.

**Cross-contamination guard** (`assertVariablesBelongTo`) — the requirement that
a variable must never resolve to another student's data. Two independent
assertions: any name variable must match this passport's student name, and
**every** passport id appearing anywhere in any variable, including inside URLs,
must be this passport's. The realistic bug it catches is an off-by-one in a bulk
loop where sixty parents get sixty messages and one carries another child's
payment link — money into the wrong ledger, and a parent who now knows we mix
children up.

**✅ 13:56:21 — 64/64 (scheduling + templates).**

### 13:56 – 14:04 · Providers, worker, four triggers

- `providers.ts` — `WhatsAppProvider` interface, `InteraktProvider`,
  `NoopProvider`, `Msg91SmsProvider`. **Nothing outside that file may reference
  Interakt.** BSPs are interchangeable resellers of the same Meta Cloud API;
  switching should cost one file.
- `enqueue.ts` / `send.ts` — validation runs at **both** enqueue and send time.
  Enqueue-time fails loudly next to the offending code; send-time is the actual
  gate, because a message can sit queued for hours while a student transfers or a
  name is corrected.
- `consumers.ts` — drains the event log. **`student.created` finally has its
  consumer**, closing the Phase 1 interface. Also `attendance.created` (Phase 3
  will produce it) and `payment.settled`.
- `reminders.ts` — the T-5 / due / T+3 / T+7 / T+15 cadence.
- `digest.ts` — Sunday weekly digest.
- `/api/jobs/tick` — one cron entry point, secret-protected. Order is deliberate:
  dispatch → reminders → digest → **send last**, so anything queued in this tick
  goes out in the same tick rather than waiting 15 minutes.
- `/api/webhooks/interakt` — delivery status callbacks, with monotonic status
  (a late "sent" cannot overwrite a "read").

**✅ 14:04:49 — 105/105 messaging tests.**
**✅ 14:05:44 — 202/202 total, `tsc` clean.**
**✅ `next build` — compiled successfully in 29.7s.** New routes:
`/api/jobs/tick`, `/api/webhooks/interakt`, `/api/academy/alerts`.

---

### 🐞 Bug the tests caught — would have shifted the entire fee cadence by a day

`daysBetween()` normalised both dates to **UTC** midnight. But due dates are
constructed at **IST** local midnight, which is 18:30 UTC on the *previous* day.
So every date boundary in the cadence was off by one: the "payment due today"
message would have gone out **the day before the fee was actually due**, and
every overdue stage with it.

Ten reminder tests failed on this at 14:03:50. Fixed by normalising to local
midnight with an explicit offset, threaded through `stageFor`,
`currentCycleDueDate` and the alert `daysOverdue`. This is exactly the class of
bug that is invisible in manual testing — everything looks plausible, just one
day early, forever.

---

### The four triggers, as built

| Trigger | Fires on | Priority | Notes |
|---|---|---|---|
| Welcome | `student.created` | 2 (attendance tier) | Intro + passport link + first payment link if a fee is due. Deliberately NOT payment tier, so it cannot consume the payment reserve. |
| Attendance confirmation | `attendance.created` | 2 | "[Child] checked in at 5:02 PM ✅". Producer is Phase 3. Absences are **not** announced — that's a coach conversation. |
| Weekly digest | Sunday, local | 3 | Attendance %, achievement, next fee date, passport link. Skipped entirely for a student with zero sessions: "0 of 0 sessions" reads worse than silence. |
| Fee cadence | Daily sweep | 1 | T-5, due, T+3 to parent. T+3, T+7, T+15 to owner dashboard. |

**Personalisation in bulk** is structural, not careful coding: each message's
variables come from its own event payload (which Phase 1 denormalised for exactly
this reason), and are then re-checked against the passport. Two siblings imported
in one batch produce two events and two independent messages with no shared
mutable state.

**A payment cancels pending reminders.** `payment.settled` cancels queued
`fee_*` messages for that student. Without it, a parent who pays on the due date
still gets chased three days later — they have a receipt and we look broken.

### The two rules that must not be "improved" later

Both are commented at the code site in `reminders.ts`:

1. **After T+3 the platform stops messaging the parent.** T+7 and T+15 have *no
   parent-facing template at all* — a test asserts their absence. A fourth
   automated chase is how a number gets blocked.
2. **The system never restricts a student's access, attendance or passport for
   non-payment.** T+15 raises a decision point and stops. `requiresOwnerDecision`
   surfaces it; nothing acts on it. Any code that reads `OwnerAlert` to gate
   access is a bug.

### Frequency cap — the simulated day, as tested

One parent, two children (siblings share one phone, so one budget), seven
triggers across sequential cron ticks. Budget 3 + 1 payment reserve:

| Tick | Trigger | Outcome |
|---|---|---|
| 07:30 | weekly digest | **deferred** — quiet hours → 08:00 |
| 08:05 | weekly digest | **sent** (1/3) |
| 10:00 | fee due today | **sent** (2/3) |
| 17:00 | attendance ×2 (both kids) | one **sent** (3/3), one **deferred** → tomorrow 10:00 |
| 18:00 | achievement badge | **deferred** — budget spent |
| 19:00 | fee overdue T+3 | **sent** — uses the payment reserve (4/4) |
| 19:30 | second payment message | **deferred** — reserve is finite, not a bypass |

**7 triggers → 4 sends, 0 drops.** Every deferral carries a concrete future slot
that is itself outside quiet hours.

### Assumptions taken

1. **Welcome message is priority 2, not 1.** It carries a payment link, which
   argues for payment tier, but it is sent once per student in bulk on import day
   when little competes — and putting it in payment tier would let it consume the
   reserve meant for fee reminders. Revisit if welcomes start getting deferred.
2. **Daily budget default 3 + 1 payment reserve.** Env-configurable. Chosen for a
   realistic day: one attendance confirmation, one fee message, one digest.
3. **Quiet hours 21:00–08:00 IST**, fixed +05:30 offset, no timezone library
   (India has no DST, so a minute offset is exact).
4. **One cron entry point at 15-minute cadence.** Every stage is individually
   idempotent, so overlapping or retried ticks cannot double-message.
5. **Absences are not messaged to parents.** Not in the brief either way; chose
   silence because an automated "Rohan was marked absent" causes more arguments
   than it resolves.

### Open items / gaps flagged

- **SMS fallback is interface-complete but cannot deliver.** MSG91 needs a
  **DLT-registered template id** per message type under TRAI rules, and free-text
  SMS is not deliverable to Indian numbers. No amount of code here fixes that —
  it needs DLT registration first. The trigger path is complete and the fallback
  row is created even with no provider, recorded as `skipped`, so the gap is
  visible in the message log rather than silent.
- **No Interakt credentials yet**, so the engine runs in no-op mode: everything
  queues and schedules correctly, sends record as `skipped` with a reason (never
  as failures, so dev doesn't see fake delivery errors).
- **Interakt webhook auth is a shared URL token, not HMAC** — Interakt does not
  sign payloads, so there is nothing to verify. **The webhook URL is therefore a
  credential** and must not be logged or committed.
- **Vercel Cron caveat:** `x-vercel-cron` is only trustworthy because Vercel
  strips client-supplied copies at the edge. Behind any other proxy, use the
  bearer secret. Noted at `lib/jobs/auth.ts`.
- **No owner-facing UI for the alert feed yet** — `/api/academy/alerts` is built
  and tenant-scoped, but nothing renders it. The T+7/T+15 nudges exist and are
  queryable; the owner cannot see them in the dashboard until that's built.
- **Message log UI** likewise not built. Delivery status is tracked per message
  and queryable, but there's no screen for "why didn't this send?" beyond
  `explainDecision()`.

### 🚨 Blocker — now the ONLY thing between this code and working messages

**Six WhatsApp templates need Meta approval via Interakt.** The exact body text
to submit is in `src/lib/messaging/templates.ts`, and the list is asserted by a
test so it cannot drift:

```
gwd_welcome_v1
gwd_attendance_confirmation_v1
gwd_weekly_digest_v1
gwd_fee_reminder_v1          (serves T-5, due date and T+3)
gwd_achievement_v1
gwd_broadcast_v1
```

Plus `INTERAKT_API_KEY`, `INTERAKT_WEBHOOK_SECRET` and `CRON_SECRET` in the
deployment environment. All three are documented in `.env.example`.

The engine is otherwise complete and tested. Nothing further in the codebase
gates delivery.

### Next up

Phase 3 — dual-mode attendance (parent QR self-check-in + coach one-click
checklist), which produces the `attendance.created` event the consumer built here
is already waiting on. `Batch.qrToken` was added in Phase 1 for this.

---

## Entry template — copy for the next session

```markdown
## Session N — YYYY-MM-DD · <what this session covered>

**Branch:** `...`
**State at end of session:** committed? pushed? tests passing?

### HH:MM – HH:MM · <workstream>
What was built and *why the approach was chosen*.

**✅ HH:MM — N/N tests passing.** / **❌ what failed and why**

### Assumptions taken
### Open items / gaps flagged
### Blockers
### Next up
```
