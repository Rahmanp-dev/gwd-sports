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

## Session 3 — 2026-07-25 · Phase 2 loose ends (owner-facing comms UI)

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **231 tests
passing** (up from 202), `tsc --noEmit` clean, `next build` compiles in 16.3s.

Session 2 closed with two gaps flagged: the alert feed was queryable but nothing
rendered it, and delivery status was tracked per message but "why didn't this
send?" was only answerable by reading code. Both are now screens.

### 21:45 – 21:52 · `explainMessage()` — the row-level explanation

New `src/lib/messaging/explain.ts`. Pure function, no database, no clock of its
own.

**Why a second explain function rather than extending `explainDecision()`:**
they explain different objects. `explainDecision` explains a *plan* — a decision
held in memory with the live config and the decision object in hand.
`explainMessage` explains a *row* — a message that went through the queue and
now sits in Mongo with a status, some timestamps, and a free-text error string
written by whichever code path last touched it. Reconstructing the sentence from
that is a different problem, and folding it in would have meant passing
half-populated decision objects around to satisfy a UI.

The interesting case is `queued`, which four unrelated situations share:

| Situation | Reads as | Why it matters |
|---|---|---|
| deferred by cap/quiet hours | **Held back** + the exact future slot | the owner must not think it was dropped |
| retryable provider error | **Retrying** + raw error | this one *is* a problem |
| `scheduledFor` in the future | **Scheduled**, "queued and healthy" | not stuck |
| due, awaiting a tick | **Due now** | clears within 15 min |

Deferral outranks attempt count when both are present — a message that failed
once and was *later* deferred is being held, and that is the live reason.

**Load-bearing distinction:** a `skipped` row whose error matches
`/not configured|no whatsapp provider|no sms provider|dlt/i` is rendered as an
**activation gap**, not a delivery failure — "Nothing is wrong with this
message: it was built, validated and rendered correctly, and there was simply
nowhere to send it." With no BSP credentials *every* message skips, and an owner
seeing a screen of red would reasonably conclude the system is broken when in
fact it just hasn't been switched on. A test asserts a policy skip is not dressed
up the same way.

**✅ 21:53 — 29/29 new tests passing.**

### 21:52 – 21:55 · `GET /api/academy/messages`

Tenant-scoped exactly like the alerts route — a parent's phone number and a
rendered message body are both personal data, so super admin sees everything,
an academy admin sees only their own.

Two decisions worth keeping:

1. **The explanation is computed server-side and shipped per row.** The wording
   *is* policy. Policy stated in a React component drifts the first time someone
   restyles the table.
2. **Status counts ignore the active status filter.** Selecting "Failed" must not
   zero out the other chips — that hides the evidence you are filtering against.
   Implemented by stripping `status` from the filter before the count aggregate.

Also returns the live `schedulingConfig`, so the UI states the actual cap rather
than hardcoding "3 a day" and being wrong the moment the env var changes. The
template dropdown is sourced from the `TEMPLATES` registry rather than a
`distinct()` over the collection, so a template that has never been used is still
filterable. Search input is regex-escaped.

### 21:55 – 21:57 · The two screens

`AlertFeed.tsx`, `MessageLog.tsx`, `CommunicationCenter.tsx` under
`components/admin/messaging/`, wired into `AdminPage` as one **Comms** tab with
two sub-tabs. One tab rather than two because they answer the same question from
opposite ends — "what needs me to decide" vs "what did the system actually do" —
and an owner chasing an overdue fee moves between them constantly.

The alert feed repeats the T+7/T+15 rule in the UI on purpose: an owner who does
not know the platform stopped messaging will assume it is still chasing on their
behalf. The banner states plainly that automated reminders have stopped and that
the system will never restrict a student's attendance or Passport over an unpaid
fee. Acknowledge/resolve trigger nothing beyond marking the row.

**✅ 21:57 — 231/231 tests passing, `tsc --noEmit` clean, `next build` clean,
`/api/academy/messages` registered.**

### Assumptions taken

1. **Comms is one tab with sub-tabs, not two top-level tabs.** The tab bar
   already carries ten entries; two more would wrap on a laptop.
2. **No retry button on a failed message.** The row explains itself and stops
   there. A re-send needs to decide whether it re-renders variables against
   current data or replays the stored ones, and getting that wrong sends a stale
   fee amount to a parent. Deliberately deferred until someone actually needs it.
3. **Message log page size 25, alert feed unpaginated** (the API caps at 200).
   An academy with more than 200 *open* alerts has a different problem.
4. **`variableMap` is excluded from the log response** — it duplicates
   `bodyPreview` for display purposes and is debugging data.

### Open items / gaps flagged

- **Both screens are untested end-to-end against real data**, because there is
  none: with no Interakt credentials every row would render as the activation-gap
  variant. The explanation logic is unit-tested across all eight statuses, but
  nobody has seen this screen with a genuinely delivered message on it.
- **No CSV export from the message log.** Asked for eventually, not now.
- **`fallbackMessageId` is shown as "an SMS fallback was raised" but does not
  link** to the fallback row. Needs a lookup the current query does not do.
- **Pre-existing `next build` noise, untouched:** duplicate Mongoose index
  warnings on `academyId` and `razorpaySubscriptionId`, and a Sentry deprecation
  about `sentry.client.config.ts` vs `instrumentation-client.ts`.

### Blockers

Unchanged from Session 2 and still the only thing between this code and working
messages: **six WhatsApp templates need Meta approval via Interakt**, plus
`INTERAKT_API_KEY`, `INTERAKT_WEBHOOK_SECRET`, `CRON_SECRET` in the environment.
Nothing built this session moves that.

### Next up

Phase 3 — dual-mode attendance (parent QR self-check-in + coach one-click
checklist), which produces the `attendance.created` event the Phase 2 consumer is
already waiting on. `Batch.qrToken` was added in Phase 1 for this.

---

## Session 4 — 2026-07-25 · Import in the dashboard + full comms surface for both roles

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **249 tests
passing** (up from 231), `tsc --noEmit` clean, `next build` compiles in 25.1s.

Session 3 built the two screens Session 2 flagged as missing. This session made
them reachable and complete: bulk onboarding was only ever at a standalone URL,
the comms center was admin-only, and two things the engine supports had no UI at
all.

### 22:00 – 22:03 · Import, reachable from the dashboard

`ImportWizard` + `ActivationDashboard` were only mounted at `/admin/import` —
an owner living in the dashboard would never find them. Extracted the tab shell
into `components/admin/import/OnboardingCenter` and mounted the same component
both places: `views/admin/ImportPage` is now a thin wrapper for the shareable
link, and AdminPage has an **Import** tab next to Students. Deliberately next to
Students, not under Settings — importing a roster is student management.

### 22:03 – 22:06 · `GET /api/academy/messages/health` + Delivery Status panel

**The gap this closes:** with no BSP credentials the engine builds, validates and
queues everything correctly, then records each send as `skipped`. That is the
design. From the message log alone it is indistinguishable from a system quietly
failing, and there was no screen anywhere that said "nothing has gone out yet,
and the reason is not in the code".

The panel leads with one verdict — connected or not — then lists blockers, none
of which are code: the missing `INTERAKT_API_KEY`, the six template names to
submit, and any messages stuck in `sending` for over 30 minutes (a dispatch run
that died after claiming them).

Template approval status **cannot be read back through the Interakt API**, so
the list is what must be submitted, not what has been accepted. Said explicitly
on the panel so nobody reads a green screen as "approved".

The connected check keys off `resolveWhatsAppProvider().name !== 'noop'` rather
than reading `INTERAKT_API_KEY` directly, so it stays honest if a second BSP is
added.

### 22:06 – 22:09 · Broadcast composer — the risky one

`gwd_broadcast_v1` existed in the registry with nothing able to send it. This is
the only message an owner types themselves and the only one that reaches every
parent at once, so the guards are stricter than the template validator and live
in `lib/messaging/broadcast.ts` as pure functions.

**The passport-id guard is the one that matters.** Every other template runs
`assertVariablesBelongTo`, which refuses to send if a variable references a
passport other than the message's own. A broadcast has no passport — it is about
nobody in particular — so that check cannot run. Without a replacement, a pasted
`"GWD-4P8QRT hasn't paid"` goes to every parent in the academy carrying one
family's identifier. Rejected outright; there is no correct way to send that.

The alphabet matters here: passport ids exclude `0/1/I/L/O/U`, so `GWD-101ILO` is
not a passport and must not be rejected. A test pins that.

**Two-step flow enforced by the API, not just the UI.** A POST without
`confirm: true` validates, resolves the audience and returns the count plus the
exact rendered text, queueing nothing. The UI is not the only caller a route ever
gets.

**`dedupeByPhone` is not cosmetic.** Siblings share a parent's mobile, and the
frequency cap is applied per phone number. Without it a family with three
children gets the announcement three times *and* burns that parent's entire
daily budget, silently deferring the fee reminder meant for the same evening.

One `broadcastId` seeds every message's `dedupeKey`, so a double-clicked send
collides on the unique index and returns `duplicate` per recipient rather than
messaging anyone twice.

### 22:09 – 22:12 · Super admin parity

The alerts and messages APIs already widened to every tenant for
`gwd_super_admin`, but the rows came back with no academy attribution — a
platform-wide feed was a list of student names with no way to tell which academy
was being asked to act. Added `populate('academyId', 'name')` for that role only,
plus an `academyId` query filter **honoured only for a super admin** (an academy
admin's scope is fixed server-side and must not be overridable from a query
string), and an academies list in the response. The client keys its filter and
badge off that list being non-null rather than doing its own role check.

`CommunicationCenter` is mounted unchanged in `SuperAdminDashboard` as a
**Communications** tab. Same components, no second implementation.

**Broadcast is hidden for super admin, and 403s server-side.** A platform-wide
message to every parent of every tenant is not a feature anyone asked for, and
should not fall out of a role check.

**✅ 22:12 — 249/249 tests passing, `tsc --noEmit` clean, `next build` clean.
`/api/academy/broadcast` and `/api/academy/messages/health` both registered.**

### Assumptions taken

1. **Broadcast audience is "everyone in the academy" in the UI.** The API also
   accepts `audience: 'batch'` with a `batchId`, but no batch picker is wired up
   — nothing in the UI can send one yet.
2. **`BROADCAST_MAX_LENGTH` 600, min 10.** Editorial, not a Meta limit: a
   WhatsApp message long enough to be truncated in the notification shade gets
   ignored.
3. **Whitespace is collapsed before the length check**, so an owner is never told
   they are over the limit by characters that will be removed, and the preview
   they approve is character-for-character what sends.
4. **Stuck-send threshold 30 minutes**, against a 15-minute cron. One missed tick
   is not an incident; two is.
5. **Super admin gets no Import tab.** They have no `academyId`, so
   `/api/academy/activation` 403s for them by design.

### Open items / gaps flagged

- **Nothing here has been exercised against a live provider.** Every new screen
  renders the not-connected path in this environment. The pure logic is tested;
  the connected path is not, and cannot be until credentials exist.
- **No batch picker for broadcasts** — the API supports it, the UI does not.
- **No broadcast history view.** Sent announcements are in the message log like
  everything else, but there is no "what have I announced" screen, and no way to
  cancel a queued broadcast from the UI (`cancelQueuedMessages` exists in
  `enqueue.ts` and is unused by any route).
- **The health panel's "stuck" count has no recovery action** — it reports, it
  does not requeue.
- **`OnboardingCenter` renders inside a `Card` in the dashboard tab and inside a
  page wrapper at `/admin/import`.** Slight double padding on the standalone
  route; cosmetic, not fixed.

### Blockers

Unchanged and still the only thing between this code and working messages: **six
WhatsApp templates need Meta approval via Interakt**, plus `INTERAKT_API_KEY`,
`INTERAKT_WEBHOOK_SECRET`, `CRON_SECRET` in the environment. The new Delivery
Status panel now states this in-product instead of it living only in these notes.

### Next up

Phase 3 — dual-mode attendance (parent QR self-check-in + coach one-click
checklist), which produces the `attendance.created` event the Phase 2 consumer is
already waiting on. `Batch.qrToken` was added in Phase 1 for this.

---

## Session 5 — 2026-07-25 · Phase 3 (dual-mode attendance)

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **280 tests
passing** (up from 249), `tsc --noEmit` clean, `next build` compiles in 22.2s.
New dependency: `qrcode` + `@types/qrcode`.

### The bug that set the agenda

`consumers.ts:113` has handled `attendance.created` since Phase 2. Nothing in
the codebase emitted it. The attendance confirmation — the message parents would
notice daily — could never fire, and `trainer/mark-attendance` wrote straight to
the array and told nobody. That framed the whole session: the producer was the
missing half.

### 22:15 – 22:18 · Dated sessions, pure

`lib/attendance/session.ts`. A session is one batch on one calendar day, and both
modes must agree on which one they are marking or the same child is recorded
twice and their parent gets two messages for one evening.

**No `Session` collection.** A session is entirely determined by (batch, local
date), so `sessionId = "<batchId>:<YYYY-MM-DD>"` is derived, not stored.
Materialising a row per batch per day means a second source of truth to keep in
sync with the recurring schedule, and the failure mode of that drift is a coach
opening tonight's register to find it empty because nobody generated it. A
derived id is correct the moment the batch exists, needs no backfill when a
schedule changes, and two independent writers compute the same string.

**IST throughout** — a 9pm Saturday practice must not file under Sunday.

`isScheduledDay` is deliberately **separate** from `resolveSession`: a coach
running a one-off extra practice on an unscheduled Wednesday must not be
blocked, while a parent's unattended scan that day should be.

**Fail open on configuration, closed on time.** A batch with no `daysOfWeek`
meets any day; no times falls back to 06:00–21:00; an end before its start
becomes start+1h. An unconfigured batch that rejects every scan presents to a
parent as "the QR code is broken" when the real problem is an unfilled schedule.

**✅ 22:17 — 20/20 tests.**

### 22:18 – 22:21 · One write path for both modes

`lib/attendance/record.ts`. Separate write paths would drift — one emits the
event, the other does not; one dedupes, the other double-messages. Everything
goes through `recordAttendance`.

Two precedence rules, both tested:

1. **The coach's mark wins.** A coach tick overwrites a parent's self-check-in,
   because the coach can see the child. The reverse is *refused* — a parent
   cannot quietly flip an absence the coach recorded.
2. **One event per student per session, and only for `present`.** Absences are
   never messaged, and — the subtle part — an absence must not consume the
   dedupe key, or a coach correcting a mistake to "present" would silently never
   send the confirmation.

Extended `StudentProfile.attendance` with `sessionId`, `batchId`, `source`,
`checkedInAt`, all optional so pre-Phase-3 rows keep loading. The recorder
matches an existing row by session first, then falls back to same-calendar-day
with no session — which upgrades a legacy row in place rather than creating a
second one for the same day.

### 22:21 – 22:22 · The producer, finally

`trainer/mark-attendance` now routes through the recorder. Contract unchanged;
it emits `attendance.created` and resolves the student's own batch so a single
mark lands on the same session the checklist and a QR scan would.

### 22:22 – 22:24 · Coach checklist

`GET/POST /api/trainer/batch-attendance` + `GET /api/trainer/batches` +
`BatchRegister.tsx`, mounted as a **Register** tab on the trainer page (second,
after Overview — it is what a coach opens the page to do).

**Everyone defaults to present.** Registers are overwhelmingly "everyone came",
and a UI charging twenty taps for the common case gets filled in from memory on
the drive home, if at all. The coach marks the exceptions.

**Whole roster in one POST**, not one request per child: twenty requests on
academy wifi with a partial failure halfway leaves a register that is neither
marked nor unmarked, with no way to tell which.

Children whose parent already scanned arrive pre-ticked and labelled — the coach
confirms a list instead of building one.

Admins can mark any batch in their academy; trainers only their own. An admin
covering for an ill coach is exactly when the register would otherwise go
unmarked.

### 22:24 – 22:28 · Parent QR self-check-in

`GET/POST /api/attendance/check-in`, `GET/POST /api/academy/batches/qr`,
`/check-in/[token]` page, `BatchQrCodes.tsx` in a new admin **Check-in** tab.

**One code per batch, not per student.** A per-student code would need
distributing to sixty parents and reprinting whenever a child joined. The code
says *which batch*; the login says *which child* — so a photographed code cannot
check in anybody else.

**The window is the security model.** The code is on a wall, so it *will* be
photographed — that is its lifecycle, not a breach. It only means something from
60 min before a scheduled session to 120 min after, and only on training days.
Rotation invalidates a leaked code by reprinting rather than rebuilding a roster,
and the rotate button says plainly that there is no undo.

**Accepted exposure:** a parent marking their child present from the car park
during a real session. The coach's checklist overwrites it. Chasing further means
geofencing every academy, which costs more than the fraud it prevents.

QR renders client-side to a data URI — the token never travels through a
third-party QR service.

**✅ 22:28 — 280/280 tests, `tsc` clean, `next build` clean, all four new routes
plus `/check-in/[token]` registered.**

### Assumptions taken

1. **Check-in window 60 min before / 120 min after.** Generous both ways:
   families arrive early, and a coach who forgets until the drive home should
   still be able to mark.
2. **The check-in page is not route-guarded.** A parent scanning at a gate must
   reach a page that explains itself and offers sign-in, not a bare login
   redirect — the scan would be wasted. The API enforces auth.
3. **A student with no batch can still be marked**; the record just dedupes on
   the calendar date. Refusing would block attendance for anyone not yet
   assigned to a batch.
4. **`markedBy` on a self-check-in is the student's own account**, with `source`
   telling the two apart. Avoids making a required field optional.
5. **QR token is 32 hex chars from `crypto.randomBytes`**, minted lazily on first
   view — most batches come from the bulk import and never have a code printed.

### Open items / gaps flagged

- **Nothing here has been exercised against a real database.** The pure logic and
  the recorder are unit-tested (`DomainEvent` mocked); no route has been hit with
  a live Mongo, and no QR has been scanned by an actual phone.
- **The `Batch.qrToken` unique index is sparse** — fine, but two batches can
  never share a token, and nothing tests the collision path on regeneration.
- **No attendance history view for parents.** They get the check-in message and
  nothing else; `student/attendance` predates this and does not know about
  sessions.
- **`check-in` GET's "already checked in" only matches by `sessionId`**, so a
  legacy same-day row shows as not-yet-checked-in in the preview. The POST then
  correctly updates it. Cosmetic inconsistency, not fixed.
- **No way to un-mark a session** — a coach who saves the wrong batch must
  re-save with corrected values.
- **The batch schedule has no UI.** `daysOfWeek`/`startTime`/`endTime` drive the
  check-in window but can only be set by import or directly in the database, so
  in practice most batches will fall through to the fail-open defaults.

### Blockers

Unchanged: **six WhatsApp templates need Meta approval via Interakt**, plus
`INTERAKT_API_KEY`, `INTERAKT_WEBHOOK_SECRET`, `CRON_SECRET`. Phase 3 now
produces the event, so the attendance message is queued correctly — it still
cannot be delivered.

### Next up

- Batch schedule editing UI, without which the check-in window is guesswork.
- The TODO.MD P0 list: performance metrics (tactical/technical/SSG/match play),
  trainer-page views for performance/fees/kits/attendance, dynamic academy names,
  fee and event invoices.

---

## Session 6 — 2026-07-25 · Batch schedules (closing the Phase 3 hole)

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **296 tests
passing** (up from 280), `tsc --noEmit` clean, `next build` compiles in 19.4s.

### The hole this closes

`lib/import/commit.ts:288` creates a batch with `{ academyId, name, sport,
isActive }` — no days, no times, no coaches. That was harmless until Phase 3,
because nothing read those fields. Now they compute the QR check-in window, so
**every batch created by the student import has a printed code accepted on any
day of the week from 05:00 to 23:00** — which is not what an owner taping a code
to a wall believes they are doing. There was no way to fix it outside the
database.

### 22:30 – 22:34 · `validateSchedule`, and why a bad time is worse than none

`lib/attendance/schedule.ts`, pure. The rule that shaped it: a malformed time
does not fail loudly at the check-in endpoint — `session.ts` ignores it and falls
back to the wide default. So the batch *looks* configured while behaving as if it
is not, which is worse than either state on its own. Validation therefore happens
at the point of writing, not reading.

Three rejections, each for that reason:

- **Malformed clock** (`5pm`, `17:60`, `7:00`) — would silently fall through.
- **One time without the other** — the missing half falls back to a default hours
  away from the real session.
- **End at or before start** — `session.ts` rescues this to start+1h, so it would
  save and quietly produce a window nobody chose.

Empty *is* allowed, because that is what the import creates and refusing it here
would make every imported batch uneditable.

Days are stored in **week order rather than click order**, so the UI never sorts
and two batches with the same days compare equal.

`scheduleGaps()` produces the warning text, and **a test pins that text to the
behaviour it describes** — asserting `validateCheckIn` really does accept 05:00
and 22:59 on a Sunday for an unscheduled batch, and really does reject 04:00 and
23:30. A warning that drifts from the enforced window is worse than no warning.

**✅ 22:33 — 16/16 tests.**

### 22:34 – 22:36 · `/api/academy/batches` + `BatchManagement`

GET returns batches with student counts, coach names, `hasQrCode` and computed
`scheduleGaps`, **plus the assignable coach list in the same response** — an
admin opening a batch to fix its schedule should not wait on a second round trip
to populate a dropdown.

PATCH changes **only the supplied fields**. An admin setting `daysOfWeek` alone
must not clear the times, or fixing one half of a schedule silently destroys the
other. The schedule is still validated as a unit, because its rules are
relational — an end time is only wrong relative to a start time — so a partial
patch is merged onto the stored values before validating.

Coach assignment is **tenant-scoped on write**: a coach id from another academy
is rejected rather than stored, since assignment is what grants the right to mark
that batch's register.

Deactivation is a **soft delete and stops there**. Students keep their `batchId`
and their attendance history keeps its `sessionId`s; a hard delete would orphan
every past register. The intended side effect is that the QR code stops
resolving.

The UI leads with a count of unscheduled batches and repeats the exact window
those codes accept, because an owner who imported their roster has *every* batch
in that state and no reason to suspect it. Day buttons are two letters, not one —
single initials collide on Tue/Thu and Sat/Sun, and mis-setting a training day is
exactly the error that makes a code refuse scans on the evening it matters.

### 22:36 · Restructure

`AttendanceCenter` puts **Batches & schedule** and **Check-in codes** side by side
as sub-tabs of the admin Check-in tab, schedule first — it is the step people
skip, and the code's window is computed entirely from it.

**✅ 22:37 — 296/296 tests, `tsc` clean, `next build` clean,
`/api/academy/batches` registered.**

### Assumptions taken

1. **Batch name max 80 chars**, matching the model. Names are printed on posters.
2. **`BatchQrCodes` still reads `/trainer/batches`** rather than the new richer
   endpoint. Both return the same active-batch set for an admin; switching adds
   risk without benefit.
3. **No batch delete, only deactivate.** Nothing in the UI can destroy
   attendance history.
4. **Sport is a free-text field**, consistent with how the import creates it.
   A dropdown would need a canonical sport list that does not exist yet.

### Open items / gaps flagged

- **Still untested against a real database.** All 296 tests are pure or mocked;
  no route in Sessions 3–6 has been hit with live Mongo.
- **No bulk schedule editing.** An academy with twelve imported batches sets
  twelve schedules by hand.
- **Changing a batch's schedule does not re-validate past attendance.** Sessions
  already recorded keep their `sessionId`s, which is correct, but a batch moved
  from Monday to Tuesday leaves Monday sessions in the history with no
  explanation.
- **Nothing warns when a batch has no coach assigned** — its register can then
  only be marked by an admin. Visible in the list, not flagged.
- **Super admin has no academy**, so `POST /api/academy/batches` 403s for them.
  Consistent with broadcast, but it means a super admin can edit schedules and
  not create batches.

### Blockers

Unchanged: **six WhatsApp templates need Meta approval via Interakt**, plus
`INTERAKT_API_KEY`, `INTERAKT_WEBHOOK_SECRET`, `CRON_SECRET`.

### Next up

The TODO.MD P0 list — performance metrics (tactical/technical/SSG/match play),
trainer-page views for performance/fees/kits/attendance, dynamic academy names,
fee and event invoices.

---

## Session 7 — 2026-07-25 · Phase 4 (the parent-facing surface)

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **325 tests
passing** (up from 296), `tsc --noEmit` clean, `next build` compiles in 21.9s.

### The bug that defined the phase

Four of the six WhatsApp templates link to `/passport/<id>` or `/pay/<id>`:
welcome, weekly digest, achievement, fee reminder. **Neither route existed.**
Every one of those messages sent a parent to a 404.

Corroborating it: `recordParentEngagement()` at `lib/passport.ts:245`, documented
since Phase 1 as *"drives the activation dashboard's engaged count"*, had **zero
callers**. Session 1 predicted the dashboard would read 0% "until Phase 2 ships".
Phase 2 shipped and it still read 0, because the thing that sets engagement was a
page nobody had built. Everything Phases 1–3 produced terminated in a dead link.

### 22:45 – 22:50 · The public passport, and its whitelist

`/passport/<id>` is **deliberately unauthenticated**. It goes over WhatsApp to a
parent with no account and, on onboarding day, no reason to make one — a login
wall would defeat the activation funnel Phase 1 measures and make the welcome
message's central promise a dead end.

The cost of that is handled in `lib/passport-public.ts`. The link IS the
audience: 31^6 ≈ 887M ids means no enumeration, but the URL gets forwarded,
screenshotted and pasted into family group chats. So the projection is an
**explicit whitelist, not a delete-list** — a blacklist starts leaking the day
someone adds a field to the model.

Withheld regardless of what the caller asks for: parent phone and name (also the
QR check-in identity key), fee amounts and dues, medical info, email, internal
ids, `identityKey` (which would reconstruct the phone), siblings. Age is shown,
**date of birth is not** — a birth date is an identity-document field.

**Coach remarks are dropped from attendance.** A coach's "distracted today, sent
home early" is written in the expectation that the academy reads it. On a
forwardable public page it changes what coaches are willing to write down, and
the register stops being honest.

The test asserting no leak runs against a fixture carrying *every* sensitive
field the model can hold, plus a key-set assertion so a new model field cannot
silently appear in the output.

**✅ 22:49 — 22/22 tests.**

### 22:50 – 22:53 · Paying without an account

`/pay/<id>` is the link in every fee reminder, also with no login. Safe for three
specific reasons, all of them structural:

1. **The amount is never an input** — resolved server-side by `dues.ts` from the
   student's own ledger. A caller says who to pay for, never how much.
2. **Settlement does not depend on the browser.** The `payment.captured` webhook
   is authoritative and verifies Razorpay's signature. A parent who loses signal
   mid-checkout is still recorded as paid — so the page makes no verify call at
   all.
3. **Paying someone else's fee is not an attack.**

What the link discloses — first name and amount owed — is strictly less than the
fee reminder message that carried it, and that message went to the parent's
phone. This is why the *passport* page withholds fee data: that link gets
forwarded; this one is sent only to the payer.

**Refactor, done reluctantly but necessary:** order creation was ~100 lines
inside `create-order/route.ts`. Rather than copy it, extracted
`lib/payments/createOrder.ts` and pointed both routes at it. Two copies of the
code that decides what a parent is charged, what the academy receives and what
GWD keeps *will* drift, and the drift is money. `create-order` now owns only
authorisation; its behaviour is unchanged, including the 400 (not 409) on
"nothing currently due".

### 22:53 – 22:55 · Pricing, pinned rather than decided

Could not resolve the rate — that is a finance decision and picking one would be
inventing an answer. What was wrong was that the number sat three calls deep
behind two env vars and could move without anyone noticing.

`lib/payments/pricing.test.ts` now pins it. The finding worth recording: the
three sources are not three roundings of one rate, they are **two different
models**.

| Source | ₹3,000 fee | Model |
|---|---|---|
| `gwd_platform_edge_cases.html` | ₹3,075 | flat 2.5% |
| this codebase | **₹3,104** | gateway cost + 1% margin |
| Phase 4 brief | "2.5–3%" | a range |

A ₹29 gap on the worked example that **widens with the fee**, because the
gateway's cut is computed on the captured total rather than the base. A test
asserts the codebase is measurably not a flat 2.5% at either ₹1,000 or ₹10,000,
so the two models cannot be reconciled by adjusting a rate.

**✅ 22:55 — 325/325 tests, `tsc` clean, `next build` clean.
`/passport/[passportId]` and `/pay/[passportId]` both register.**

### Assumptions taken

1. **Attendance summary window is 90 days; streak runs over all history.** A
   four-month perfect streak must not reset because the window moved.
2. **Both pages are `robots: noindex`.** They name a child; the pay page names an
   amount owed.
3. **No student name in the passport's page metadata** — WhatsApp unfurls the
   link into a thumbnail seen by everyone in a group before anyone opens it.
4. **`/pay` shows an itemised breakdown, always.** A parent seeing a total larger
   than the fee their academy quoted, unexplained, does not pay — they phone the
   academy, and the academy phones us.
5. **Engagement recording is fire-and-forget** on both routes. It is a metric; it
   must never delay or break the page a parent is trying to read.

### Open items / gaps flagged

- **Still nothing run against a real database or a real Razorpay account.** Five
  sessions now. The public payment path in particular has never taken a rupee.
- **`create-order` was refactored without an integration test to catch a
  regression.** Behaviour is preserved by inspection and by `tsc`, not by a test
  that exercises the route. This is the riskiest change in the staged diff.
- **The passport page shows no achievements or performance** — the model has no
  achievement records yet, and `gwd_achievement_v1` has no producer. A template
  therefore still links to a page that will not show what the message promised.
- **No receipt after payment.** The success screen says one will follow; nothing
  sends it.
- **Subscription charges still carry no GWD margin** (`gwdNetPaise: 0`) — needs
  Razorpay plan amounts with the fee baked in. Unchanged from Session 1, and
  blocked on the same pricing decision.
- **`/pay` does not handle a part-payment or a parent who wants to pay a
  different amount.** It is the full outstanding figure or nothing.

### Blockers

1. **Six WhatsApp templates need Meta approval** — unchanged, and now the only
   thing between a working funnel and a parent actually receiving these links.
2. **The convenience-rate decision.** Three documents, two models. Needs one
   canonical answer before any of this bills a real parent.

### Next up

- The Phase 4 brief itself has not been seen — scoping here was inferred from the
  code. Worth checking this against it.
- TODO.MD P0: performance metrics (tactical/technical/SSG/match play), which
  would also give the passport page something to show.

---

## Session 8 — 2026-07-25 · Phase 5 (performance taxonomy + achievements)

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **380 tests
passing** (up from 325), `tsc --noEmit` clean, `next build` compiles in 20.4s.

Three things converged on one piece of work: the next phase, the top P0 item,
and the trainer UI gap were all the same missing feature.

### The bug in the old model

`Performance.category` was free text, and `Settings.performanceMetrics` a flat
`string[]` defaulting to `["dribble","running","defending","strike","stamina"]`.

The leaderboard averages `score/maxScore` across every record a student has. So
a 7/10 for stamina in a fitness drill and a 7/10 for decision-making in a match
were added together as if they measured the same thing. **A coach who runs more
fitness tests than match play changes a child's headline number without anything
about the child changing** — and a parent reads that as progress or decline.

### 23:00 – 23:05 · The taxonomy

`lib/performance/taxonomy.ts`. A metric now belongs to a category; scores are
only averaged within one.

**Categories are fixed in code, metrics are not.** The four — tactical,
technical, SSG, match play — are the assessment framework, a coaching decision
that predates this software and is the same at every academy. Metric vocabulary
is local and academies genuinely differ. Fixed categories are what make one
academy's report comparable with another's, which a Passport that survives a
transfer depends on.

Three decisions worth keeping:

- **Legacy rows are mapped, not dropped.** Every existing record has free text
  and no `categoryKey`; without mapping, a child's history would appear to
  restart on the day this shipped. The mapping is conservative — anything
  unrecognised becomes `technical`, never `match_play`, because match play is the
  number a parent cares about and inventing scores in it is the worse error.
- **Records are normalised to a percentage before averaging.** `maxScore` varies
  between records, so averaging raw scores weights a drill marked out of 100
  forty times more heavily than one out of 5 — purely because of how a coach
  wrote it down.
- **`overallScore` averages the CATEGORY averages, not the raw records.**
  Otherwise twenty technical drills drown out one match assessment. Unassessed
  categories are excluded rather than counted as zero: a child never assessed on
  match play has not scored badly at it.

`score > maxScore` is now rejected. Without it a coach fat-fingers 70 out of 10
and that student tops the leaderboard forever — the aggregate cannot notice,
because every value in it is individually plausible.

**✅ 23:04 — 28/28 tests.**

### 23:05 – 23:08 · Achievements, and the third dead template

`gwd_achievement_v1` had **no producer** — the third dead path found in this
codebase after `attendance.created` and the passport 404. `lib/performance/award.ts`
is its producer.

`Achievement` is keyed on **`passportId`, not academyId**, and is a collection
rather than a subdocument on StudentProfile. A child who earned a hundred-session
badge and transfers has still attended a hundred sessions; StudentProfile is the
academy's enrolment record and is created afresh each enrolment, so an
achievement has to outlive it.

The rules are strict on purpose. The template notes call this message
"distribution and retention in one motion" — it is built to be forwarded. **A
badge every child earns in a fortnight is forwarded by nobody**, and still spends
the parent's daily message budget, starving a fee reminder. So:

- Mastery needs 80% over **at least three** evaluations. Without the minimum, a
  coach's first generous 9/10 mints a "mastery" badge and the parent gets
  congratulated about one drill.
- The all-round award is **blocked by an unassessed category** rather than
  skipping it — claiming all-round ability nobody measured is worse than
  withholding the badge.
- Evidence is frozen at the moment of earning, and **badges are never revoked**.
  A ten-session streak stays earned after the streak breaks.
- Coach awards are a **fixed list, not free text**. These land on a public
  Passport that outlives the academy and get forwarded into family group chats —
  a free-text field there is an inside joke waiting to become permanent.

Idempotency is at two levels: `Achievement.dedupeKey` stops a badge being stored
twice, `DomainEvent.dedupeKey` stops a second message if the row was written but
the event write failed and the whole thing retried.

**✅ 23:06 — 22/22 tests.**

### 23:08 – 23:14 · Trainer panels

`GET/POST /api/trainer/student-detail` + `StudentDetail.tsx`, wired to the
previously-dead "View Profile" menu item. One endpoint, not four — a coach opens
a student to look at all of it, and four round trips on academy wifi is four
chances to see a spinner. Closes four P0 items at once.

Records that predate the taxonomy are marked **"inferred"** in the UI rather than
presenting a mapped category as fact.

Both write paths (`add-performance`, `batch-attendance`) now re-run the
achievement rules, wrapped so a failure never fails the underlying save — the
score or the register is already recorded, and a missed badge is picked up next
session.

### 23:14 – 23:16 · Passport page

Achievements are placed **above** attendance: a parent arriving from the
achievement message is looking for the badge they were just told about.

**Category percentages are published; individual evaluations are not.** A "3/10
for composure under pressure" attached to a named child on a forwardable page is
something a parent would rightly object to — and a coach who knows raw scores go
public stops recording honest ones. A test asserts remarks, metric names and
`maxScore` never reach the output, and that the achievement `evidence` blob
(which can hold a coach's private note) is dropped.

**✅ 23:16 — 380/380 tests, `tsc` clean, `next build` clean.**

### Assumptions taken

1. **Mastery threshold 80% / 3 evaluations; all-round 70% across all four.**
   Judgement, not science. Stated in the module so they can be argued with.
2. **`achievementsAwarded` is surfaced to the coach in a toast** — they caused a
   parent to get a message and should know.
3. **The legacy `category` field is still written**, from the taxonomy label, so
   older dashboards reading it keep working.
4. **`Settings.performanceMetrics` is repurposed as metric SUGGESTIONS**, not
   categories. Existing academy values still appear, now in the datalist.
5. **Streak and total counts for achievements use all-time attendance**, not the
   90-day window the passport page displays.

### Open items / gaps flagged

- **Six sessions now with no live database.** `evaluateAndAward` and both
  student-detail routes have never run against real data; the pure logic beneath
  them is well covered, the wiring is not.
- **No backfill for `categoryKey`.** Legacy rows are mapped on every read
  instead. Correct, but it means the mapping runs forever rather than once, and
  `inferredCategory` will show on old records indefinitely.
- **Achievements are evaluated only on write.** A student whose data changes by
  any other path (admin edit, import) will not be re-evaluated until their next
  session or assessment.
- **No way to revoke a coach award**, deliberately — but a genuine mis-click is
  therefore permanent and public.
- **The academy has no UI to configure metric suggestions** now that Settings'
  meaning has changed; the admin settings screen still labels them
  "performance metrics".
- **`gwd_achievement_v1` still cannot deliver** — same Meta approval blocker.
  The producer exists now, so the message queues correctly and stops there.

### Blockers

Unchanged: **six WhatsApp templates need Meta approval**, and **the
convenience-rate decision** (three documents, two models — see Session 7).

### Next up

- Remaining P0: dynamic academy names, fee and event invoices.
- The Phase 4 brief still has not been seen; Sessions 7–8 were scoped from the
  code.

---

## Session 9 — 2026-07-25 · Receipts, dynamic academy names, settings fix

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **396 tests
passing** (up from 380), `tsc --noEmit` clean, `next build` compiles in 26.6s.

### 23:20 – 23:26 · Payment receipts

**The document is a RECEIPT, not a GST tax invoice, and that is deliberate.**

A single payment here is really *two supplies*: the academy supplies coaching
(`academyAmountPaise`) and GWD supplies payment processing (`gwdNetPaise`). A GST
tax invoice must be issued by each supplier for their own portion, carrying their
own GSTIN and HSN/SAC. Issuing one combined document under the academy's name for
the full amount would misstate who supplied what — and neither party's tax
registration is held anywhere in this system. So the document itemises both
components with "Supplied by" against each, and calls itself a receipt. A
compliant tax invoice needs the same finance conversation the pricing question is
already blocked on.

**Numbering is the part with real constraints.** Indian practice expects a series
that is unique, sequential, **gapless**, restarted each financial year, and
scoped to the issuer. Gapless is what shapes the implementation:

- **Numbers are allocated at settlement, never at order creation.** Most orders
  are never paid; numbering them would leave permanent holes.
- **Allocated after the ledger credit succeeds**, because the settlement path
  releases its claim and retries on failure — a number burned on a failed attempt
  is a gap.
- **`Counter` uses `$inc` + `upsert`**, which is the one operation Mongo
  guarantees atomic here. A read-then-write lets two concurrent settlements both
  write 42, and a duplicate receipt number is something a parent could reasonably
  read as a double charge.
- **Lazy allocation on first view** if numbering failed after settlement. The
  alternative — failing the settlement — means taking money and marking the
  student a defaulter over a document-numbering error.

The financial year is **April–March, evaluated in IST**. A server thinking in UTC
puts a 1 April 04:00 IST payment (22:30 UTC on 31 March) in the wrong year. Tests
pin both sides of that boundary.

### 23:26 – 23:29 · Dynamic academy names

`BRAND_NAME` is a build-time env var. Fine for one academy; wrong the moment five
branches run under one domain, which is the stated plan — one deployment cannot
have five values of one variable.

Added `useBrand()`, resolving from the signed-in user's academy with `BRAND_NAME`
as the fallback for genuinely platform-level surfaces. Cached per academy at
module level: a page header must not cost a request per tab switch.

A hook rather than a context provider because the landing components already
take an `academy` prop and resolve it themselves — rewiring working code for no
behavioural gain. This filled the screens that had no way to know: admin header
and footer, and the **Razorpay checkout modal**, which was showing the platform
name to a parent paying their academy. An unfamiliar name on a payment screen is
where people abandon a checkout.

**Bug found in the testimonials carousel:** the quotes were built at *module
load* with the platform name baked in, so on an academy's public page they named
the wrong organisation entirely. Now built per render from the academy prop.

⚠️ **But see the flag below** — fixing that has a consequence worth a decision.

Audited every remaining `BRAND_NAME`: all correct, either `academy?.name ||
BRAND_NAME` or genuinely platform-level (the About page, the logged-out auth
screen, a placeholder for creating a new academy).

### 23:29 – 23:31 · Settings screen was telling owners something untrue

Phase 5 changed `Settings.performanceMetrics` from *categories* to *metric
suggestions*, and the admin card still said "Performance Metrics — define the
metrics trainers will use". An owner adding "match play" there would have been
quietly wrong.

Relabelled, and the card now shows the four fixed areas as read-only chips with
the reason they cannot be edited: they are the same at every academy so a
student's record still means something after a transfer.

**✅ 23:31 — 396/396 tests, `tsc` clean, `next build` clean.**

### Assumptions taken

1. **Receipt number format `ISSUER/FYCODE/NNNNN`** e.g. `MGFC/2627/00042`.
   Issuer derived from the academy *slug*, not the display name — a name can be
   edited and a series must not change identity mid-year.
2. **Sequence padded to 5 digits** so the series sorts lexicographically too;
   it does not truncate past that.
3. **The receipt page is authenticated**, unlike the passport and pay links. It
   names an amount already paid by a specific family and has no onboarding
   reason to be open.
4. **One acceptable gap**: if two callers race to allocate, the loser's sequence
   is discarded rather than reused. Two payments sharing a number is worse.

### Open items / gaps flagged

- **⚠️ The testimonials are fabricated.** Invented quotes, invented people, stock
  photos — pre-existing demo content, not written this session. They previously
  named the platform; they now name whichever academy's page they appear on,
  which on a live site makes them **fabricated endorsements of a real, named
  business**. Either replace them with real testimonials or gate the section
  behind academies that have supplied some. Flagged at the code site. **This is a
  decision for whoever owns the marketing site.**
- **Event payment invoices are NOT done.** `Event.entryFee` exists but there is
  no event payment flow at all — no routes, no orders, nothing collecting it.
  There is no payment to receipt. The receipt engine covers events the moment
  those payments route through `FeePayment`, which they would have to.
- **No backfill of receipt numbers** for payments settled before this session.
  They allocate lazily on first view, which means an old payment viewed today
  gets a number in *today's* financial-year series.
- **Still no live database.** Seven sessions. The `Counter` atomicity argument is
  sound in principle and has never been exercised under real concurrency.
- **Remaining P0, untouched:** "student/trainer/admin interactions — check the
  flow", and "too many authentication attempts on first login" — both need a
  running system to reproduce.

### Blockers

1. **Six WhatsApp templates need Meta approval.**
2. **The convenience-rate decision** — three documents, two models.
3. **NEW: who issues a tax invoice for which component**, and under which GSTIN.
   Same conversation as (2).

### Next up

Nothing in the P0 list can be completed without a running system. The remaining
items are reproduction tasks, not build tasks.

---

## Session 10 — 2026-07-25 · Per-academy branding

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed. **425 tests
passing** (up from 396), `tsc --noEmit` clean, `next build` compiles in 20.8s.

### What was actually broken

`Academy.theme` already had `primaryColor` and `accentColor`, and there was
already a branding form to set them. **Two of nine landing components read the
colour. The other seven rendered the platform's blue** — 87 hardcoded
`blue-*`/`indigo-*` classes across the section files. `accentColor` was read
nowhere at all.

So an owner could pick a colour, save it, and see almost nothing change. The
feature looked shipped and was decorative.

The cause is architectural: colour was passed down as a prop and applied with
`style={{ color }}` at each use site, which means every new section has to
remember to opt in — and none of them did.

### 23:36 – 23:39 · The palette engine

`lib/branding/palette.ts`, pure. Derives everything from one or two colours an
owner picks: hover shade, surface tint, border, and — the one that matters — the
**readable foreground**.

**The bug this prevents:** the old code hardcoded white text on `primaryColor`.
An academy whose brand is yellow, lime or pale cyan got white-on-yellow. Nobody
catches it in review because the reviewer's academy is blue. The foreground is
now computed from WCAG relative luminance, choosing whichever of white or ink
has the higher contrast.

Gamma linearisation matters here and is easy to skip — the raw sRGB channel
gives confidently wrong answers right in the mid-range where brand colours live.
A test pins mid-grey at ~0.216 luminance rather than 0.502.

**A useful finding while testing:** the band where a colour fails AA against
*both* white and ink is narrow — roughly luminance 0.18–0.21, e.g. `#7d7d7d` at
4.34:1. That narrowness is exactly why the missing check survived: almost
everything anyone tries does pass, so nobody discovers the gap until an academy
picks a mid grey.

Contrast is **reported, not enforced**. It is the owner's brand; refusing to
save it would be the wrong trade. Shipping it unknowingly is the thing to stop.

**"Feel" is three presets, not sliders.** Exposing radius, shadow, spacing and
saturation individually guarantees broken-looking pages; exposing nothing was
the status quo. Bold / Classic / Minimal are each a coherent set.

**✅ 23:39 — 29/29 tests.**

### 23:39 – 23:43 · CSS variables, and the sweep

`<AcademyTheme>` sets the variables once at the page root. `display: contents`
so the wrapper carries properties without introducing a box that changes
stacking.

Then the mechanical part: **87 colour classes rewritten** to
`bg-[var(--brand)]`, `text-[color:var(--brand-soft)]` and so on, by shade —
50/100 → soft, 200/300 → border, 400–600 → brand, 700+ → strong.

Two things the sweep got wrong on the first pass, both caught by reading the
output rather than by a test:

1. **Gradients collapsed.** `from-blue-600 via-indigo-600 to-blue-600` all
   mapped to `--brand`, turning every gradient into a flat colour. Fixed by
   giving later stops somewhere to travel: brand → accent → brand-strong.
2. **My first regex was too narrow** — it only matched the shades I had
   enumerated by hand and missed 57 of the 87. Replaced with a generic
   `(utility)-(blue|indigo)-(\d+)` sweep.

`rounded-2xl/3xl` → `rounded-[var(--brand-radius)]` on large surfaces only.
Small chrome keeps its own radius: a 1.25rem radius on a 24px badge is a circle.

### 23:43 – 23:46 · The branding studio

Preset palettes, colour pickers, feel selector, tagline, and a live preview.

**The preview renders through `buildThemeVariables` — the same function the real
page uses.** A preview built from a separate mock is a preview that lies, and the
first time it lies the owner stops trusting the screen.

**Caught before shipping:** my first version sent `{ theme: { ... } }` to the
generic `PUT /api/academy/[id]`, which does a plain `findByIdAndUpdate` — that
would have replaced the whole subdocument and silently wiped `logoUrl` and
`heroImages`, which are edited on a different screen. Looks like unexplained data
loss. The existing branding form already used dot-notation for this reason;
matched it.

**✅ 23:46 — 425/425 tests, `tsc` clean, `next build` clean. 70 brand-variable
usages across the landing components, up from 3.**

### Assumptions taken

1. **Six curated presets** as starting points, because nobody arrives with a hex
   code.
2. **`--brand-strong` is darkened, not opacity-shifted** — the hero is full of
   photographs and a translucent hover would show them through the button.
3. **Ink is `#0f172a`, not pure black** — reads as intentional rather than as a
   default.
4. **Style defaults to `classic`** for existing academies and unknown values.

### Open items / gaps flagged

- **Nothing has been looked at in a browser.** The sweep is mechanical and the
  build passes, but 87 class rewrites across seven files have not been visually
  checked. This is the most likely place for a cosmetic regression in the whole
  staged diff.
- **The admin dashboard itself is not branded** — only the public page. An owner
  sees their colours on the site and the platform's violet in their console.
- **`heroImages` and `logoUrl` are still on the old form**, separate from the
  studio. Two screens for one job.
- **Dark backgrounds were swept too.** `from-blue-900 to-indigo-900` on the
  sports grid became brand-strong, which is correct in principle but will look
  different from before for every existing academy.
- **No per-academy font choice.** "Feel" is radius, shadow and tint only.

### Blockers

Unchanged: Meta template approval; the convenience-rate decision; who issues a
tax invoice for which component.

### Next up

Look at the public page in a browser — this session's work is the least
verifiable so far by tests alone.

---

## Session 11 — 2026-07-26 · Production hardening + performance

**Branch:** `main`
**State at end of session:** staged, not committed, not pushed (as instructed).
**434 tests passing** (up from 425), `tsc --noEmit` clean, `next build` clean.

### 00:00 – 00:05 · The cron was never scheduled

`/api/jobs/tick` has existed since Phase 2 as the single entry point for
dispatch, reminders, digest and send. **There was no `vercel.json`.** Nothing
scheduled it. Even with Meta approval, no message would have gone out, no fee
reminder fired, no digest sent — the engine would have sat idle looking broken.

Added `vercel.json` with the 15-minute cadence the design calls for, and a
300-second `maxDuration` since a tick drains a queue.

I expected to also need a GET handler — Vercel Cron issues GET, and I
remembered the route as POST-only. It already delegates GET to POST. No change
needed there.

### 00:05 – 00:10 · Placeholder accounts (open since Session 1)

Bulk import creates a User per student because StudentProfile needs one.
`User.email` is required and unique, so imported students get
`gwd-7k2m9x@import.gwd.in` and `isImportedPlaceholder: true`.

**Why this mattered more than it looked.** That address is derived from the
PASSPORT ID, which is public — printed in URLs, texted to parents, forwarded
into group chats. Anyone holding a passport id could construct the account's
email. Login was never the main risk (no password was ever set); **the reset
flow was**: `forgot-password` would happily mint and store a reset token for an
account nobody owns.

Guarded at three entry points via `lib/auth/placeholder.ts`:

- **login** — returns `Invalid credentials`, deliberately identical to "no such
  account". Any other message would confirm that a given passport id maps to a
  real student.
- **forgot-password** — returns the same success message as every other branch,
  so it stays non-enumerable, but mints nothing.
- **check-email** — returns a registration prompt rather than the user record it
  previously handed back. Different trade-off on purpose: this caller is most
  likely a parent holding their own child's details.

The check tests the flag AND the domain suffix, because getting it wrong fails
open. A test pins the domain against `lib/import/commit.ts:273`, and another
asserts a real address merely *containing* the domain is not caught — locking a
genuine parent out is the failure on the other side.

**Pre-existing and NOT fixed:** `check-email` still returns a full user record
for any real email. That is an enumeration/disclosure issue of its own, outside
this change.

### 00:10 – 00:14 · Logging and CI

`compiler.removeConsole` in production, **excluding `error` and `warn`**. Around
thirty `console.log` calls remain, several in payment and messaging paths whose
arguments include a parent's phone number and a rendered message body. But every
catch block in the payment and job code reports through `error`/`warn` — silencing
those would mean a failed settlement leaves no trace at all.

Added `.github/workflows/ci.yml`: typecheck → test → build, ordered cheapest
first so an obvious break fails in seconds rather than after a three-minute
build. Build env vars are deliberately dummy values; CI must never hold
credentials that can message a real parent or move real money.

### 00:14 – 00:30 · Performance

**Dependencies.** Found `mapbox-gl`, `react-router-dom`, `multer` and
`next-connect` with **zero references** — Express-era and pre-Next leftovers. Also
found `motion` AND `framer-motion` both installed: 40 files used framer-motion,
one file used `motion/react`. Two copies of the same animation runtime for the
sake of one import. Consolidated and removed all five.

Worth being precise about the benefit: **the shared bundle did not move**. Unused
packages were already tree-shaken out of it. The win is install size, build time
and attack surface — not runtime bytes. Claiming otherwise would be wrong.

**The real win was the admin dashboard.** `AdminPage` statically imported all
fifteen tab panels, so an admin opening it downloaded the student table, event
manager, fee ledger, branding studio and the entire super-admin console to look
at one tab. Radix already unmounts inactive content — nothing was *rendering* —
but a static import puts the module in the entry bundle whether it runs or not.

| | Before | After |
|---|---|---|
| `/admin/dashboard` page | 114 kB | **14.7 kB** |
| First Load JS | 511 kB | **309 kB** |

`ssr: false` on each, because every panel is a client-only screen that fetches on
mount — server-rendering a spinner then hydrating it is work with no output, and
the page is behind a login so there is no crawler to serve.

The overview panel is deliberately **not** split: it is the default tab, so
splitting the one thing that always renders would only add a round trip and a
spinner to first paint.

Also enabled `optimizePackageImports` for the barrel-heavy packages
(lucide-react, framer-motion, date-fns, the Radix primitives), AVIF/WebP image
formats, and turned off `poweredByHeader`.

### Assumptions taken

1. **Cron at 15 minutes**, matching the Phase 2 design note. Every stage is
   individually idempotent, so an overlapping tick cannot double-message.
2. **`error` and `warn` survive production**, everything else is stripped.
3. **Placeholder login returns the generic message**; registration paths get a
   helpful one. Different audiences, different right answer.

### Deliberately NOT done, with reasons

- **Did not remove `@tanstack/react-query` from the root Providers.** It is the
  largest remaining item in the 227 kB shared bundle, but it is used by eight
  real components across events, landing and admin. Rewrapping each is a genuine
  refactor on code that has never been run against a database — the wrong risk
  to take blind.
- **Did not add `revalidate` caching to `/[slug]`.** It would cut the per-request
  Mongo query on public academy pages, but the branding studio I just built
  promises changes "go live when you save". A five-minute cache would make that
  promise false.
- **Did not convert the three raw `<img>` tags** to `next/image`: one is a QR
  data URI and the others are remote CDN images where the gain is marginal.

### Open items / gaps flagged

- **227 kB shared bundle remains the floor** for every route. react-query is the
  main lever; see above for why it was left.
- **Still nothing run against a live database or a browser.** Nine sessions.
- **`check-email` still discloses user records** for real addresses.
- The heaviest pages are now `/user/profile` (387 kB) and `/mgfc/trainer`
  (380 kB) — both candidates for the same tab-splitting treatment.

### Blockers

Unchanged and all external: Meta template approval; the convenience-rate
decision; who issues a tax invoice for which component.

---

## Session 12 — 2026-07-26 · First real run: four bugs from actual usage

**Branch:** `main`
**State at end of session:** staged, not committed. **439 tests passing**,
`tsc --noEmit` clean, `next build` clean.

The app was run against a real database for the first time. Every bug below came
from that, and none of them were reachable by the test suite.

### 1. Student import 500'd on `Academy validation failed`

```
timings.workingDays.0: `Mon` is not a valid enum value
```

`commit.ts` finished writing every student, then called `academy.save()` purely
to append ids to the roster array. **Mongoose validates the ENTIRE document on
save**, and academies created before the weekday enum existed hold `"Mon"`,
`"Tue"`, `"Wed"`. A field the import never touches failed validation and 500'd
the whole commit *after* the students had already been created.

Two fixes:

- **`academy.save()` → atomic `$addToSet`.** The only mutation was appending to
  `students`, so that is all it should write. This also fixes a bug that was
  always there: two concurrent imports each held a stale copy of the array, and
  the second save silently discarded the first one's additions.
- **A normalising setter on `workingDays`**, so any future save coerces rather
  than rejects. It maps `Mon` → `monday` but deliberately does NOT accept
  `sunflower` → `sunday`; this normalises, it does not silence.

`scripts/normalize-working-days.js` repairs existing documents (dry-run by
default). Raw collection access on purpose — loading through the model would run
the very validation these documents fail.

### 2. A failed import wedged the job forever

`commitImportJob` sets `status = 'committing'` before doing any work and only
clears it on success. Any throw in between left it stuck, so every retry answered
**409 "currently being committed"** and the only recovery was editing the
database by hand. Visible in the log as the 500 followed by two 409s.

Added `releaseStuckCommit`, called from the route's catch. Safe after a partial
run: rows already written are marked `created` and the commit loop skips them, so
a retry finishes rather than duplicates.

### 3. A completed payment stayed `pending` forever — no invoice

The one that matters most. Session 7's note said:

> *"No verify call afterwards, on purpose. The `payment.captured` webhook is the
> authoritative settlement path."*

That reasoning is still right, and the webhook is still authoritative. But it left
`/pay/<passportId>` with **no settlement path at all** whenever the webhook cannot
arrive — local development, an unconfigured deployment, or simply the delivery
delay. Money taken, student shown as unpaid, no receipt number, no invoice.

Added `POST /api/passport/[passportId]/pay/verify`, called from the checkout
handler. **No login, and that is correct**: the Razorpay signature is an HMAC over
`order_id|payment_id` keyed with a secret only Razorpay and this server hold, so a
valid triple cannot be forged. That is a stronger proof than a session cookie,
which only says who is asking. It cannot misdirect money either — `settlePayment`
credits `payment.studentId` from the server-created order and ignores the caller
entirely.

Both paths share the same idempotent `settlePayment()`, so whichever lands second
is a no-op. The success screen now links to the receipt, but only once the server
has confirmed — a receipt link that 404s is worse than none.

`scripts/reconcile-pending-payments.js` recovers payments already stuck this way:
it asks Razorpay what actually happened and settles what Razorpay confirms as
captured.

### 4. `[ERROR] API Request Failed {}`

The logger passed its wrapper object to `console.error`, and Next's dev overlay
renders that as `{}` — so the status code, endpoint and server message were all
present in the payload and all invisible. A log line that hides the one fact you
opened it for is worse than none. Scalars are now folded into the message string.

### Also fixed

- **`summarise` was exported from `app/api/import/extract/route.ts`** and imported
  by two sibling routes. Next 15 permits route modules to export only handlers and
  config, so this failed typegen the moment `.next/types` regenerated. Moved to
  `lib/import/summarise.ts`. A route file is an endpoint, not a utility module.
- The `/pay` GET route's 500 now logs which passport and which error, and returns
  a message a parent can act on rather than "Server error".

### Not a bug

`SyntaxError: Unexpected end of JSON input` on `/api/passport/.../pay`: there is
no `JSON.parse` or `req.json()` anywhere in that route or page. It came from the
dev server tripping over a truncated response mid-HMR — note the interleaved
"✓ Compiled" lines — and cleared on its own.

### Open

- **Razorpay webhook is still not configured for local development.** The verify
  call now covers it, but production needs the webhook pointed at
  `/api/payments/webhook` regardless — it is the path that survives a closed tab.
- Dev-server response times of 4–7 s per API call are cold-compile artifacts, not
  a production signal.

---

## Session 13 — 2026-07-26 · Live-run round two: auth, imports, check-in

**Branch:** `main`
**State at end of session:** staged, not committed. **448 tests passing**,
`tsc --noEmit` clean, `next build` clean.

### Two 500s, both hiding their own cause

**`PUT /api/admin/students/[id]`** passed the request body straight into
`findByIdAndUpdate`. Wrong twice over:

- **It threw.** The edit form sends `StudentUpdateData` — `sport` (singular) and
  a nested `fees` object — against a schema with `sports: string[]` and flat
  `feeAmount`/`feePeriod`. Casting a string into a string[] path threw a
  CastError, and the catch reported it as the literal word `"Error"` with no
  logging, which is what surfaced as `errorMessage=Error`.
- **Worse: when it did not throw, it silently dropped the edit.** Mongoose
  ignores unknown paths in strict mode, so `sport` and `fees` were accepted,
  discarded, and reported as a successful save. An owner changing a fee saw
  "updated successfully" and nothing changed.

Now maps fields explicitly, which also closes a mass-assignment hole — the body
could previously set `passportId`, `attendance`, `feePayments` or `academyId` on
any student — and adds the tenant filter that was missing.

**`POST /api/user/logout`** was the same empty-body `req.json()` bug as the
earlier import one. Harmless in appearance, because the client clears
localStorage regardless — but **the refresh token was never revoked**. A logout
that leaves a valid refresh token behind is not a logout.

### Imported students can now log in

Session 11 blocked these accounts entirely. That was right when they had no
password anyone chose; it is wrong now that the import issues one.

`isImportedPlaceholder` was carrying two meanings and has been split:

- **It now means only "the address is synthetic and cannot receive mail."** That
  still gates forgot-password — minting a reset token for a mailbox that does not
  exist protects nothing and leaks a token.
- **Login is no longer blocked.** It is protected by the password, like any
  account. `mustChangePassword` is the new flag for "issued, not chosen".

### Two decisions taken against the literal request, both stated

**1. Email is `<passport>@<academy-slug>.gwd.in`, not `<academy>.com`.**

Asked for `.com`. Not done, because the slug is whatever someone typed —
`gmail`, `outlook`, `yahoo`. Minting `gwd-sggddf@gmail.com` creates accounts on
a domain GWD does not control, at addresses that may belong to real strangers,
and any future reset mail goes to them. A subdomain of a domain GWD owns reads
the same to a parent and cannot collide.

**2. Password is random per student, not a shared `password123`.**

The login address is derived from the passport id, and a passport id is PUBLIC —
printed on the passport page, texted, forwarded into family group chats. One
shared password would mean anyone who saw any passport id could sign in as that
child and read attendance, medical information and fee history, and start a
payment.

The stated goal — "parents know the credentials through messages" — is met
identically either way, because the message carries whatever the import
generates. Flipping to a fixed string is one line in `generateImportPassword` if
that trade is still wanted.

### The welcome message now carries the credentials

`gwd_welcome_v1` gained a sixth parameter, `loginLine`. ⚠️ **A parameter-count
change means resubmitting to Meta** — rejected at send time, not approval time.
Doing it now, before submission, is the cheap moment.

The password is only knowable at import: it is hashed on save and cannot be
recovered afterwards. So it travels on the `student.created` event rather than
being looked up by the consumer.

### Student check-in existed but was unreachable

Phase 3 built the whole QR flow — wall code, `/check-in/<token>` page, scan
window, idempotent recorder — with **no entry point inside the app**. The only
way in was a phone's native camera, which works but which nobody would guess.

Added `CheckInCard` to the student Attendance tab. Uses the browser's built-in
`BarcodeDetector` rather than adding a dependency; where it is missing (iOS
Safari, older Android) the card says so plainly and offers the two things that
always work — the phone's own camera, and typing the code. A scanner that
silently fails on iPhone would be worse than none.

`extractToken` lives in `lib/attendance/checkInToken.ts`, not beside the
component: the test runner is a node environment with no JSX transform, so a
pure helper inside a `.tsx` is untestable here.

### My CI workflow was broken

`npm run build` failed with a ZodError: `JWT_SECRET must be at least 32
characters`. The placeholder I wrote in Session 11 was 20. These are validated by
schema at module load, so they have to satisfy the RULES, not merely exist.
Fixed, and verified by running the build with those exact values.

### Cron on a free plan

Vercel Hobby allows **one cron run per day**, so `*/15 * * * *` was rejected.
A daily cadence is not a smaller version of the design — it is a broken one: an
attendance confirmation could reach a parent a full day after their child
trained, which is worse than not sending it.

Split into two:

- **`vercel.json` → `0 3 * * *`**, a daily safety net that is valid on Hobby.
- **`.github/workflows/cron.yml` → `*/15 * * * *`**, the real tick. Free, and
  `lib/jobs/auth.ts` already accepted a bearer secret for exactly this — the
  header path was written for "external cron, Railway, GitHub Actions", so no
  application change was needed.

Running both is safe: every stage self-guards, so an overlapping tick cannot
double-message.

**Honest limits of the GitHub Actions arrangement**, documented in the workflow:
its scheduler is best-effort and routinely runs 5–15 minutes late, occasionally
skips, and disables itself after 60 days without a commit. Fine for testing,
not something to run a business on.

**GCP migration** is a Cloud Scheduler job (free tier: 3 jobs) hitting the same
endpoint with the same header — the exact command is in the workflow header.
Nothing in the application changes.

Also dropped `maxDuration` from 300 to 60: Hobby caps Node functions there. And
removed a `//` comment key from inside the `functions` block — Vercel validates
that object against a strict schema and an unknown key would have failed the
deploy.

**Needs setting before the tick works:** repository secrets `APP_URL` and
`CRON_SECRET`, and the same `CRON_SECRET` in the Vercel environment.

### Open

- **`check-email` still returns a full user record** for any real address.
- The `jose` Edge Runtime warnings in the build are pre-existing and are
  warnings, not errors.

---

## Session — 2026-07-26 03:40 IST · Prod outage, superadmin creds, trainer/branding audit

**State at end of session:** not committed. Tests 448/448 passing, `tsc --noEmit` clean.

### 03:40 · Prod-breaking bug: winston tried to `mkdir logs/` on Vercel

`src/lib/logger.ts` constructed `winston.transports.File` at **module load
time**, and Vercel's filesystem is read-only outside `/tmp`. `src/lib/db.ts`
imports this logger and is itself imported by nearly every API route and the
`[slug]` academy page, so the throw took down `/api/user/login`,
`/api/academy/discover`, and page rendering sitewide — this is what the user
saw as `ENOENT: no such file or directory, mkdir 'logs'` on every route.

**Fix:** file transports now only attach when `!process.env.VERCEL` (Vercel
sets this automatically). Production keeps the Console transport only, which
is exactly what Vercel's Logs tab was already showing. Nothing reads the log
files back anywhere in the codebase, so this loses no functionality in prod.

### 03:40 · Superadmin credentials hardcoded and inconsistent across two scripts

`scripts/seed.ts` and root `seed_superadmin.js` both hardcoded
`superadmin@gwd.in`, but with **different passwords** (`GwdAdmin123!` vs
`password123`) — whichever script ran most recently silently won, which is
the likely explanation for login attempts failing with credentials that
"should" have worked.

**Fix:** added `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` to
`src/lib/env.ts` (defaults preserve current behavior). Both scripts now read
from env instead of literals; `seed_superadmin.js` also now loads
`.env.local` and respects `DB_URI` instead of a hardcoded
`mongodb://localhost:27017`. `scripts/seed.ts`'s superadmin branch now
**resets** the password on re-run instead of no-op'ing when the account
already exists, so re-running seed after changing the env var actually takes
effect.

**Important:** setting `SUPER_ADMIN_PASSWORD` in Vercel's env does **not**
change an existing account's password by itself — a seed script must be run
against that database with the new value for it to take effect. Prod DB
credential rotation is still a manual step.

### 03:40 · Architecture audit (Explore agent) ahead of the branding/UX overhaul ask

Dispatched a read-only research pass to ground a large incoming feature list
before touching anything. Findings, since they'll shape that work:

- **No per-academy trainer/student routing exists.** Every trainer/student,
  regardless of academy, lands on the same hardcoded `/mgfc/trainer` /
  `/mgfc/student` URLs (`RoleProtectedRoute.tsx` `ROLE_HOME` map). The
  components underneath are **not** hardcoded to MGFC data — they correctly
  fetch and scope to the signed-in user's real academy via JWT — but the URL
  and the fixed blue/green gradient chrome around it is a branding artifact
  that reads as "wrong academy" even though the data isn't leaking.
- **Bug fixed:** `TrainerPage.tsx` derived its academy-name badge from the
  raw populated `academyId` object instead of `.name`, so
  `typeof academyName === "string"` was always false and the badge never
  rendered for any trainer, ever. Also found the `TrainerProfile` interface
  mistyped `academyId` as `string | null` when the API actually populates it.
- **Bug fixed:** `useBrand.ts` read `academy.branding?.logoUrl`, a field that
  doesn't exist on the schema (it's `academy.theme.logoUrl`) — the admin
  dashboard header logo was always blank regardless of what an owner
  uploaded.
- **QR/attendance is not missing code** — `BatchRegister.tsx` (trainer
  one-tap register) and the batch-attendance API are generic, tenant-scoped,
  and complete. If a trainer sees no attendance option, the actual cause is
  no `Batch` document exists yet for their academy, or they were never added
  to a batch's `coaches[]` — not a broken feature. Worth improving the empty
  state to say this explicitly instead of a bare "not assigned" message.
- **Fee structure is correctly wired end-to-end**, contrary to the worry it
  might not reflect: `Academy.fees.*` → `resolveAmountDue()` →
  `createFeeOrder()` is one shared path used by both authenticated and
  passport-link payments. It only fails (409 `NoFeeConfiguredError`) if a
  newly onboarded academy hasn't filled in Fee Structure yet, which is
  intentional per the code's own comments (previously it fabricated ₹500).
- **Cash/offline "mark paid" already has a backend** —
  `recordOfflinePayment()` in `src/lib/payments/offline.ts`, wired to
  `/api/payments/pay` and `/api/student/pay-fees` — but **no UI anywhere
  calls it**. This is the actual gap for the "let an owner mark cash
  received" ask: build the button/form, not the backend.
- **Branding/theming is three diverged surfaces**, not one: the superadmin's
  academy onboarding/edit form (`AcademyForm.tsx`) has **no branding fields
  at all** (no logo, color, tagline, style); the owner's own dashboard has
  two separate components (`BrandingStudio.tsx` and
  `AcademyBrandingSettings.tsx`) stacked in the same tab, overlapping on
  `theme.primaryColor`/`theme.tagline`. Also: `Academy.theme` and the
  separate `GlobalSettings` model both store an overlapping-but-different set
  of branding fields (two logo URLs, two theme colors, stored separately).
- **Theme does not cascade past the public `[slug]` page** — the logged-in
  student/trainer dashboards use fixed Tailwind gradients regardless of the
  academy's configured `theme.primaryColor`/`accentColor`. This is why the
  trainer view reads as "bland"/generic rather than the academy's own brand.
- **The "Disciplines" homepage grid (Football Academy/Basketball/Racing
  League/Model UN/Galaxy Events) is hardcoded demo content**
  (`SportsGrid.tsx` `defaultSports`), unrelated to any real academy's actual
  `sports[]` array, and shown on every `[slug]` page regardless of what that
  academy offers. The `academy.theme.programs` field it checks for an
  override doesn't exist on the schema and nothing writes to it — the
  fallback is always taken. No section-toggle mechanism exists yet.
- **GWD platform logo (`public/gwdlogo.png`) is not referenced anywhere in
  code** — not on invoices, not on the passport page. Needs wiring in
  wherever the platform (not the academy) should be branded.
- **Payments subsystem reads as deliberately hardened**, not incomplete —
  extensive inline comments document past incidents it was fixing
  (client-trusted amounts, wrong-student credit, fabricated dues, webhook
  200-on-failure). Real-money readiness is gated on **environment
  configuration, not code**: `RAZORPAY_WEBHOOK_SECRET` is unset in
  `.env.local` (without it, every webhook 503s and settlement relies solely
  on the client-side verify call, which the code's own comment calls "a
  convenience path, not the source of truth"), and the live-vs-test key
  prefix needs manual confirmation before a real transaction.
- **Global font**: body is `"Plus Jakarta Sans"` (`globals.css:147`),
  headings are separately pinned to `"Playfair Display"` (`globals.css:163`),
  loaded via `@import` in `globals.css` plus unrelated `<link>` tags for
  Bebas Neue/Inter in `layout.tsx`. No `next/font` usage — plain CDN
  `@import`/`<link>`. Switching to DM Sans is a small, contained change;
  open question is whether "primary font" means body only or headings too.

### Assumptions taken
- `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` defaults were set to match the
  values already in `scripts/seed.ts` (not `seed_superadmin.js`'s), since
  that's the more complete/canonical seed path.

### Open items / gaps flagged
See findings above — branding unification, theme cascade to dashboards,
homepage section toggles, cash-payment UI, and the trainer/student UX pass
are all still to be scoped and built; none of the code for those exists yet.

### Blockers
None for what was done this session. The branding/onboarding rebuild needs
priority/sequencing input before starting (see chat).

### Next up
Awaiting the user's priority order on: (1) DM Sans font swap, (2) unified
branding/onboarding system + theme cascade, (3) cash-payment UI, (4)
trainer/student mobile UX pass, (5) real-money payment config checklist.

---

## Session — 2026-07-26 04:28 IST · Branding unification, theme cascade, cash payments

**State at end of session:** not committed. 448/448 tests, `tsc --noEmit` clean,
`next build` compiles successfully. User approved the full plan ("all"
workstreams, DM Sans on body **and** headings, one shared branding component).

### Phase 0 · DM Sans everywhere
`globals.css` body + `h1`–`h6` now DM Sans; Playfair Display dropped as the
default heading face. Seven files hardcoded `'Playfair Display'` /
`'Plus Jakarta Sans'` in inline `style` attributes (the legal/static pages,
`LegalFooter`, `DiscoverPage`) and were swapped too — a global CSS change alone
would have left those visibly on the old fonts.

Playfair Display and Poppins are still loaded, because they now back the
opt-in `editorial` / `rounded` font presets. Declaring extra families in the
Google Fonts `@import` costs one stylesheet request; woff2 files are only
fetched for families that rendered text actually uses.

**Verified in-browser:** `getComputedStyle` on body and `h1` both report
`"DM Sans"`.

### Phase 1 · One branding model on `Academy.theme`
Added, all additive with defaults reproducing current behaviour so no existing
academy changes appearance on deploy: `fontPreset`, `programs[]`,
`testimonials[]`, `gallery[]`, `sections{}` (5 booleans, all default true).

`buildThemeVariables()` now also emits `--font-heading` / `--font-body` from
the preset, and `globals.css` reads `var(--font-heading, <DM Sans fallback>)`
— so an academy's typeface applies inside its own themed subtree and the
platform default holds everywhere else.

**Two bugs fixed here:** the super admin's `AcademyForm` zod schema omitted
`halfYearly` (every academy it created silently got 0), and
`AcademyManagement` called `updateAcademy` without `{superAdmin:true}`,
routing edits through the route with **no `runValidators`**.

### Phase 2 · `AcademyBrandingEditor` — the actual fix for the divergence
One **controlled** component, used by both the super admin's onboarding form
and the owner's settings tab. Controlled on purpose: onboarding needs the draft
inside react-hook-form, settings needs it in a self-loading panel; owning state
internally would have forced one of them to be a special case, which is how the
previous three diverged.

`BrandingStudio.tsx` and `AcademyBrandingSettings.tsx` are **deleted**, not left
dormant — both were verified unreferenced first. Leaving them would invite
someone to wire one back up and re-split the tagline field.

`AcademyBrandingPanel` wraps the editor with load/dirty/save for owners.
`AcademyForm` embeds the editor directly and spreads `...(academy?.theme ?? {})`
before its own fields, so `heroImages` (edited nowhere on this screen) survives
the super admin's `$set`-wholesale update path.

### Phase 2b · Image upload was broken three ways — found while wiring the editor
`settingsService.uploadLogo`/`uploadHeroImages` posted to
`/admin/settings/upload-{logo,hero}`, which:

1. **write to `public/uploads` with `fs.writeFile`** — impossible on Vercel
   (read-only outside `/tmp`, and per-invocation storage is never served).
   Same class of bug as the winston logger that took the site down.
2. **read form fields `file`/`files` while the service sent `logo`/`images`** —
   a guaranteed 400 even locally.
3. **set `Content-Type: multipart/form-data` by hand**, omitting the boundary,
   so `req.formData()` cannot parse the body at all.

Proper Cloudinary-backed routes already existed at `/api/upload/image` and
`/api/upload/hero` (auth, size caps, MIME allowlist, per-academy folders, 503
when unconfigured). Repointed the service at those, correct field name, and
let axios set the multipart header itself. This fixes logo upload for
`SettingsManagement` too, which was equally broken.

**Requires `CLOUDINARY_*` env vars to be set** or uploads return 503 by design.

### Phase 3 · Theme reaches the coach and the student
`/api/trainer/profile` and `/api/student/profile` populated `academyId` with
only `name location` — the theme was never fetched, so it could not have
cascaded regardless of UI. Added `theme` to both.

Both dashboards now wrap in `<AcademyTheme>` and the fixed
`from-blue-600 via-green-600` chrome is driven by `var(--brand)`. The trainer's
four stat cards (previously four unrelated hardcoded hues) are now tints of the
academy's own two colours, using the computed `--brand-on` / `--accent-on` so
they stay readable whether the brand is navy or lime.

**`BatchRegister` empty state rewritten.** This is the actual answer to "I see
no QR scanner / attendance option": the feature is complete and generic, but no
`Batch` exists for that academy or the coach is not in its `coaches[]`. It now
names the exact screen an admin must visit instead of dead-ending.

### Phase 4 · The homepage stops making things up
`SportsGrid` fell back to five hardcoded demo cards (Football Academy,
Basketball, Racing League, Model UN, Galaxy Events) whose override key
(`theme.programs`) did not exist on the schema — so the fallback was **always**
taken. Every academy advertised Formula racing and Model UN, and "Explore
Program" sent their own visitors to a *different* academy's page. Resolution is
now `theme.programs` → derived from real `sports[]` → render nothing. No demo
fallback: a page listing disciplines an academy does not teach is worse than no
disciplines section.

**`TestimonialsCarousel` no longer fabricates endorsements.** It rendered three
invented people over stock headshots with the academy's real name interpolated
into the quotes — fabricated endorsements of a real business shown to parents
choosing where to send their child. The previous author flagged this in a
comment and could not close it because there was nowhere to store a real
testimonial. There is now, so the placeholders are gone: real ones or no
section.

New `GallerySection` renders `theme.gallery`. Every section self-hides on its
`sections.*` flag — the decision lives in each section, so none can be rendered
into a state it has nothing to fill.

### Phase 5 · Cash / "mark paid"
`recordOfflinePayment()` was correct and complete but **no screen called it**.
Added `RecordCashPaymentDialog`, reachable from each row of the Fee Defaulters
list, pre-filled with the outstanding amount.

**Bug found doing this:** the defaulters payload exposed `studentId` = the
*StudentProfile* `_id`, while `/api/payments/pay` resolves students by
`userId`. Passing the former would have failed with "Student profile not
found" every time. Added `userId` to the payload.

### Phase 6 · GWD mark
Receipt: footer, beside the existing "convenience fee supplied by GWD Sports"
note — deliberately **not** the header, which belongs to the academy as the
primary supplier. Putting the platform logo on top would misstate who the
parent bought coaching from. Passport: top of the identity header, since that
page is most parents' first contact with GWD.

Neither touches an academy's own `/[slug]` page.

### Phase 7 · Code-level responsive pass (user chose this over visual)

**Already correct, left alone:** every `<table>` in the app is already wrapped
in `overflow-x-auto`, and the admin's main tab bar already uses the right
mobile pattern (`overflow-x-auto` + `h-auto justify-start`). The oversized
`w-[700px]`–`w-[1000px]` elements are decorative blur circles inside
`overflow-hidden` sections, so they cannot cause page scroll.

**Real bug fixed — clipped tab rows.** `TabsList` is `h-10` by default. Any
grid whose item count exceeds its column count wraps to a second row that is
then *clipped out of view*. `StudentPage` had five triggers at
`grid-cols-3` — the Kits and Fees tabs were invisible on every phone. Fixed
with `h-auto` there, and applied the same fix wherever a wrap can occur:
`TrainerPage` (now `grid-cols-2 sm:grid-cols-4`), trainer `StudentDetail`
(`grid-cols-3 sm:grid-cols-5`), plus `AcademyDetails` / `StudentDetails`
(`grid-cols-2 sm:grid-cols-4`, which were 4 slivers inside a dialog).

### Font sweep, round two — the first pass missed six files

The Phase 0 sweep matched `'Playfair Display', Georgia, serif` with spaces. It
did **not** match Tailwind's arbitrary-value syntax, which uses underscores:
`font-['Playfair_Display',Georgia,serif]`. Six files were still on the old
fonts, including `LandingPage.tsx` and the whole `components/ecosystem/*` set —
i.e. the dark "Hyderabad's Sports Grid" page, one of the most visible surfaces
in the app. All converted.

Also found and fixed:
- **Five `font-family: 'Inter'` rules deep in `globals.css`** styling the
  Leaflet map labels. Since Inter's `<link>` was being dropped, these would
  have silently fallen back to generic sans. Converted to DM Sans.
- **Clash Display was loaded twice** (once in `layout.tsx`, once in
  `globals.css`) for exactly **one** `<h2>`. Converted that heading and removed
  both imports.
- **Inter had a single remaining use** (`WhyChooseUs.tsx`); DM Sans covers it,
  so it was dropped from the `layout.tsx` import too.
- **Five static/legal pages each carried their own inline `@import`** for
  Playfair + Plus Jakarta inside a `<style>` block — dead requests once their
  `font-family` declarations were converted. Removed.

Net effect: three fewer webfont families fetched on every page load.

**Bebas Neue deliberately kept.** It is a condensed poster face used only by
`components/shared/ProgramsSection` (the platform's own program showcase
pages), narrowed to its own `<link>`. It is a display accent, not a competitor
for the site's primary font — flattening it to DM Sans would remove an
intentional design choice rather than fix an inconsistency. Say the word if it
should go too.

### Open items / gaps flagged

- **This deploy changes what existing academies' public pages say.** Every
  current academy has `programs: []`, so their disciplines grid switches from
  the five demo cards to cards derived from their real `sports[]` — and any
  academy with no sports listed loses the section entirely. User explicitly
  confirmed this is wanted (asked and answered), but it is a live content
  change, not a silent refactor, so it is worth eyeballing before it ships.
- Academies with no `theme.testimonials` now show **no** testimonials section
  at all, where previously they showed three fabricated ones. Also intended.
- `next lint` could not be run: the project has no ESLint config and the
  command drops into an interactive setup prompt. Gates used instead were
  `tsc --noEmit`, 448 unit tests, and a full `next build`.

### Assumptions taken
- Font presets ship three curated pairings rather than free font choice,
  matching the existing `BRAND_STYLES` "presets not sliders" reasoning.
- `GlobalSettings` left alone: despite overlapping field names it is
  **platform-wide** (`findOne()` with no academy filter) and drives the root
  marketing site, not per-academy branding.
- Bebas Neue retained as a display accent (above).

### Blockers
None outstanding. Visual confirmation still owed — see below.

### Next up
1. **Someone still needs to look at this.** Verification was `tsc`, 448 tests,
   `next build`, and computed-style checks — not eyes on a screen. The branding
   editor, the themed dashboards, and the public page have not been viewed.
2. Real-money payment checklist with the user: `RAZORPAY_WEBHOOK_SECRET` (unset
   in `.env.local`; without it every webhook 503s and settlement depends
   entirely on the browser returning to `/verify-payment`), live-vs-test key
   prefix, and registering the webhook URL in the Razorpay dashboard.
3. `CLOUDINARY_*` must be set before any image upload works — the branding
   editor's logo and gallery uploads depend on it.

---

## Session — 2026-07-26 05:21 IST · Pre-launch blockers from real usage

**State at end of session:** not committed. 448/448 tests, `tsc` clean,
`next build` compiles. Driven by bugs the user hit in the live app.

### Logout 500 — and the same latent bug on login

`removeRefreshToken` did `filter()` + `this.save()`. **`save()` revalidates the
entire document**, so any legacy value anywhere on a user made logout throw a
500 — the token was then never revoked, which means it was not really a logout.
Exactly the failure mode already documented for `timings.workingDays`.

Replaced with an atomic `$pull`. **`addRefreshToken` had the identical bug and
runs on every login** — one bad legacy field would have locked that user out
entirely. Also switched to `$push`. Neither now triggers document validation.

### The trainer account: users were being created half-formed

`POST /api/admin/users` created a `User` and **nothing else**. Every trainer
surface reads the *profile*, not the user, so a coach added from the Users tab:

- saw "No Trainer Profile Found" instead of a dashboard;
- could never be added to a batch (`/api/trainer/batches` filters
  `coaches: userId`), so never got an attendance register;
- did not appear in the admin's trainer list, which is built from
  `TrainerProfile.aggregate`.

The student case is worse: `resolveAmountDue` throws "Student profile not
found" before reaching the fee schedule, so such a student **cannot be charged
at all**.

New `lib/auth/ensureRoleProfile.ts`, called from two places on purpose: at user
creation so new accounts are whole, and lazily on `GET /api/{trainer,student}/
profile` so the accounts **already broken in production repair themselves** on
next login rather than needing manual re-creation. Idempotent via the unique
`userId` index; duplicate-key is treated as success; failures log but never
block the caller.

### Student QR scanner "missing" — it was hidden on most browsers

The scanner relied solely on `BarcodeDetector`, which exists on Android Chrome
and essentially nowhere else — **not iOS Safari, not Firefox, and not Chrome on
Windows**, which is what the user was testing on. On those the component
deliberately hid the camera button and printed "this browser can't scan",
so the feature looked absent.

Added `jsqr` (pure JS, no deps) as a second tier: native `BarcodeDetector` when
present, otherwise decode video frames on a canvas. jsQR is dynamically
imported so it is not shipped to browsers that do not need it, and the sampled
frame is capped at 640px wide because decoding full 1080p frames every tick
stutters badly on mid-range Android. **The camera button is now always shown.**

### Branding: background and gradient options

New `theme.backgroundStyle` — `light` / `soft` / `gradient` / `dark`. Emitted
as `--page-bg`, `--page-fg`, `--page-muted`, `--page-card`, `--page-border`
from the same `buildThemeVariables`.

Surface and text colour are derived **together**, deliberately, rather than
offering a free background-colour picker: an owner choosing a background
independently of their text colour produces an unreadable page, which is the
same reasoning already behind `readableOn()`.

`--page-bg` may hold a gradient, so it is applied via `background`, never
`background-color`. `AcademyTheme` gained a `style` prop so the element
defining the variables can also consume one.

Note while wiring the preview: cards sitting on `--brand-soft` keep dark ink,
because that tint stays light in every background treatment — using
`--page-fg` there would have made them invisible in dark mode.

### Mobile

- **Landing navbar overflowed its own pill** (visible in the user's screenshot:
  nav links colliding with the wordmark, "Join GWD" cut off). Links now hide
  below `sm`; wordmark and CTA get `flex-shrink-0` and always fit.
- Added a global `overflow-x: clip` guard on `html, body`. **`clip`, not
  `hidden`** — `hidden` makes the element a scroll container and silently
  breaks every `position: sticky` descendant, including the branding editor's
  preview pane.

### Nothing told an owner their academy was unusable

A deployed academy starts with all four fees at 0, and `resolveAmountDue`
requires **above** zero, so every parent payment failed — with no indication to
the owner. The first person to find out would have been a customer.

New `SetupChecklist` on the admin dashboard states the **consequence**, not the
task ("parents trying to pay online get an error", not "set your fees"). Covers
fees, at least one batch, and logo/tagline. Hides itself entirely once done, so
it cannot become furniture. `AdminPage`'s tabs are now controlled so its "Fix"
links can jump straight to the right tab.

### `check-email` PII

Unauthenticated, and returned the whole user document — name, email, phone,
role, academyId, active status. On a platform holding children's data, guessing
an address yielded a child's name and a contact number. (No password hash: that
is `select: false` and stripped in `toJSON`.)

Now projected to `_id` and `name`, the minimum the registration flow needs.

**Near-miss worth recording:** the first projection dropped `email` and
`isImportedPlaceholder`, which `isPlaceholderAccount()` reads. It **fails
open**, so that would have silently reopened the passport-id enumeration hole
that guard was written to close. Both are now selected server-side and neither
is returned.

Residual, stated not hidden: existence of an address and its first name are
still confirmable. The fix is per-IP rate limiting on this route — the
`RATE_LIMIT_*` env vars already exist — not trimming further.

### `/mgfc/*` → `/portal/*`

Every academy's coaches and students landed on the slug of one demo academy.
Data was correctly tenant-scoped so nothing leaked, but a paying customer's
staff saw a competitor's name in the address bar.

Six routes moved to neutral `/portal/*`; the old paths are **permanent
redirects, not deletions**, because those URLs are in browser histories and
already-sent messages. `/portal` added to middleware `RESERVED_PATHS` so it can
never be shadowed by an academy slug.

### Open items / gaps flagged
- **Still nothing visually verified.** Same as the previous session: the
  Browser pane is not displayed, so all of the above is verified by `tsc`,
  448 tests and `next build` only.
- `jsqr` added as a dependency — needs `npm install` wherever this deploys.
- The super-admin academy list shows apparent duplicates (Champions FC /
  ChampionsFC, Master Grid / MasterGrade) with two rows sharing ID
  `6a61cfe0`. Not investigated; may be seed residue or a real key collision,
  worth a look before onboarding.
- Env still unset: `RAZORPAY_WEBHOOK_SECRET`, `CLOUDINARY_*`, `CRON_SECRET`,
  `RESEND_API_KEY`, `INTERAKT_API_KEY`. Razorpay is still on a **test** key.

### Next up
Visual + real-device pass; then the Razorpay live-mode checklist.

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
