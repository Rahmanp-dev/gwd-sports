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
