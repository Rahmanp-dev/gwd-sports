# Go-live setup: Razorpay Route + Meta WhatsApp

Everything in this file happens in someone else's dashboard, not in this
codebase. The code is already written for all of it; these are the credentials
and account-side steps that switch it on.

Work through it in order. Part 1 (Razorpay) is what lets money move. Part 2
(Meta) is what lets parents be told about it.

\---

# Part 1 — Razorpay Route: paying two academies automatically

## What you are building

A parent pays ₹1,000. You want:

|Who|Gets|Why|
|-|-|-|
|The academy|\~₹1,000|Their coaching fee|
|GWD (you)|your margin|Platform fee|
|Razorpay|\~2% + GST|Gateway charge|

**Razorpay Route** does this split automatically at settlement. Without it, the
whole ₹1,000 lands in *your* account and you have to pay each academy by hand
every month — which is exactly the reconciliation nightmare this platform is
meant to remove.

## Step 1 — Enable Route on your account ✅ DONE

Route is **already activated** on this account (confirmed 2026-07-26). This was
the only step with an external review delay, so the rest of Part 1 is unblocked.

Start at step 2.

> Kept here for reference: Route is not on by default, activation is manual and
> Razorpay reviews it (1–3 working days), and the account must be fully
> KYC-activated in live mode first.

## Step 2 — Create a linked account per academy

One **linked account** per academy. Do this twice, once for each of your two
test academies.

Dashboard → **Route** → **Linked Accounts** → **+ Create Linked Account**.

You will need, *from the academy owner*:

* Legal business name (must match their bank records)
* Business type — usually *Proprietorship* or *Partnership* for a small academy
* PAN
* Bank account number + IFSC
* Registered address, email, phone

Razorpay verifies the bank details by penny-drop. **This can take a day.**

When it succeeds you get an account id shaped like `acc\_XXXXXXXXXXXXXX`.
**Copy it.** That single string is all this platform needs.

> \*\*Get this right the first time.\*\* A wrong IFSC means settlements silently
> fail days later, after parents have already paid. Confirm the bank details
> against a cancelled cheque or a bank statement, not a WhatsApp message.

## Step 3 — Put the account id on the academy record

Each academy document has a settlement field the payment code already reads.
As **super admin**, edit each academy and set:

* `rzp\_account` → `acc\_XXXXXXXXXXXXXX` (from step 2)
* `settlementStrategy` → `razorpay\_route\_auto\_split`
*(the only other valid value is `collect\_and\_manual\_payout` — that is the
fallback where everything lands in your account and you pay academies by
hand)*
* `platformFeePercent` → your margin for that academy (e.g. `1.0` for 1%)

You can leave `settlementStrategy` unset: when `rzp\_account` is present the
code infers auto-split. Setting it explicitly is clearer and is what the
settlement tests assert against.

The split maths lives in `src/lib/payments/money.ts` and is unit-tested. It
computes the gateway fee, your margin and the academy's net **in paise**, so
there is no floating-point drift on money.

> If `rzp\_account` is empty, the code falls back to taking the full amount into
> your account. That is the correct safe behaviour — but it means \*you\* owe the
> academy their share manually. Do not launch an academy in that state.

## Step 4 — Register the webhook

**This is the step that most often gets skipped, and it is the one that loses
money.**

Dashboard → **Settings** → **Webhooks** → **+ Add New Webhook**.

* **Webhook URL:** `https://sports.gwdglobal.in/api/payments/webhook`
* **Secret:** invent a long random string. Save it — you need it in step 5.
* **Active events** — tick at minimum:

  * `payment.captured`
  * `payment.failed`
  * `order.paid`
  * `refund.processed`
  * `transfer.processed` *(Route settlements)*

### Why this matters

Without the webhook, a payment is only recorded if the parent's browser
survives the round trip back to `/verify-payment`. If they close the tab, lose
signal, or their phone rings — **the money is taken and your system never knows.**
The parent shows as unpaid, gets chased by an overdue reminder, and you find out
from an angry message.

The code treats the browser callback as a *convenience*, not the source of
truth. The webhook is the source of truth.

## Step 5 — Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**, and in
your local `.env.local` for testing:

```
RAZORPAY\_KEY\_SECRET=<from Razorpay → Settings → API Keys>
NEXT\_PUBLIC\_RAZORPAY\_KEY\_ID=rzp\_live\_XXXXXXXX
RAZORPAY\_WEBHOOK\_SECRET=<the secret you invented in step 4>
```

**Check the key prefix.** `rzp\_test\_…` takes fake money. `rzp\_live\_…` takes real
money. You are currently on a **test** key.

Also confirm the fee split rates (defaults are in `src/lib/env.ts`):

```
GWD\_GATEWAY\_RATE\_BPS=236   # 2.36% = Razorpay 2% + 18% GST, no input tax credit
GWD\_MARGIN\_RATE\_BPS=100    # 1% platform default; per-academy value overrides it
```

> Set `GWD\_GATEWAY\_RATE\_BPS=200` \*\*only if\*\* GWD is GST-registered and actually
> reclaims the input tax credit. If you are not sure, leave it at 236 — the
> conservative value means you never under-collect.

## Step 6 — Test with real money

Do this with **your own money**, on the smallest amount that is realistic.

1. Set one academy's monthly fee to a small real amount (e.g. ₹10) via
**Admin → Branding → Fee structure**. The academy cannot take payments while
all four fee periods are ₹0 — the setup checklist on the admin dashboard will
tell you so.
2. Open that academy's public page, enrol a test student, and pay as a parent.
3. Verify, in order:

   * Razorpay Dashboard → **Transactions** — the payment shows *captured*.
   * Razorpay Dashboard → **Route** → **Transfers** — a transfer to the
academy's linked account exists.
   * Your app → **Admin → Fees** — the payment appears, and the amount shown to
the *academy* excludes your convenience fee.
   * The parent receives a WhatsApp confirmation (needs Part 2 done).
   * `/receipt/<paymentId>` renders and shows both line items.
4. Then refund it from the Razorpay dashboard and confirm the refund reflects.

**Settlement timing:** money reaches the academy's bank on Razorpay's normal
settlement cycle (T+2 or T+3 working days by default), not instantly. Tell the
academy owners this before they ask.

\---

# Part 2 — Meta WhatsApp Cloud API

Interakt has been removed from the codebase. This talks to Meta directly, which
is cheaper (no reseller margin) and gives you full control of templates.

## Step 1 — Prerequisites

You need, on a **Meta Business account you own**:

* A **verified business** (Business Manager → Business Settings → Business Info
→ *Verification*). Unverified businesses are capped at very low messaging
limits.
* A **phone number** that is NOT currently registered on the WhatsApp consumer
app or WhatsApp Business app. If it is, delete that account first and wait
\~24h. **A number can only live in one place.** Do not use your personal number.

## Step 2 — Create the app

1. Go to **developers.facebook.com** → **My Apps** → **Create App**.
2. Use case: **Other** → type: **Business** → select your Business portfolio.
3. In the app, **Add product** → **WhatsApp** → *Set up*.

This creates a WhatsApp Business Account (WABA) and gives you a test number.

## Step 3 — Add and verify your real number

**WhatsApp** → **API Setup** → *Add phone number*.

* Enter the number, choose SMS or voice verification, enter the code.
* Set the display name (this is what parents see — use the academy-neutral
platform name, e.g. "GWD Sports"). Display names go through Meta review.

Once added, note the **Phone number ID** — a long numeric string shown right
next to the number. **This is not the phone number.** It is what the API wants.

## Step 4 — Create a permanent access token

The token shown on the API Setup page **expires in 24 hours**. Do not use it in
production — your messages will silently stop the next morning.

1. **business.facebook.com** → **Business Settings** → **Users** → **System Users**
2. **Add** → name it e.g. `gwd-whatsapp-sender` → role **Admin**
3. Select the system user → **Add Assets** → **Apps** → pick your app → enable
**Manage app**
4. Also **Add Assets** → **WhatsApp Accounts** → pick your WABA → **Full control**
5. Click **Generate New Token** → select your app → tick scopes:

   * `whatsapp\_business\_messaging`
   * `whatsapp\_business\_management`
6. Set expiry to **Never**. Copy the token — **it is shown once.**

## Step 5 — Environment variables

```
META\_WHATSAPP\_ACCESS\_TOKEN=<system user token from step 4>
META\_WHATSAPP\_PHONE\_NUMBER\_ID=<numeric id from step 3>
META\_WHATSAPP\_VERIFY\_TOKEN=<any random string you invent>
META\_APP\_SECRET=<App Dashboard → Settings → Basic → App Secret>
```

## Step 6 — Register the webhook

App Dashboard → **WhatsApp** → **Configuration** → **Webhook** → *Edit*.

* **Callback URL:** `https://sports.gwdglobal.in/api/webhooks/meta`
* **Verify token:** the same `META\_WHATSAPP\_VERIFY\_TOKEN` you set above.
* Click **Verify and save.** Meta calls your endpoint once and expects the
challenge echoed back — the code handles this.
* Then **Manage** → subscribe to the **`messages`** field. This is what carries
`sent` / `delivered` / `read` / `failed` status.

Deliveries are signed with HMAC-SHA256 using your app secret, verified against
the raw request body. Unlike a shared-token scheme, the URL itself is not a
secret.

## Step 7 — Submit the message templates

**Every** template must be approved by Meta before a single message sends. Go to
**business.facebook.com** → **WhatsApp Manager** → **Message Templates** →
**Create Template**.

Create all seven. Category **UTILITY** for all of them (not MARKETING — utility
is cheaper and has better delivery for transactional messages). Language:
**English**.

|Template name|Body|
|-|-|
|`gwd\_welcome\_v1`|6 variables — intro, passport link, payment line, login line|
|`gwd\_attendance\_confirmation\_v1`|`{{1}} checked in at {{2}} ✅ — {{3}}`|
|`gwd\_weekly\_digest\_v1`|6 variables — weekly attendance + progress summary|
|`gwd\_fee\_reminder\_v1`|5 variables — one template serves T-5, due-date and T+3|
|`gwd\_payment\_receipt\_v1`|5 variables — payment confirmation + receipt link|
|`gwd\_achievement\_v1`|4 variables — badge earned + passport link|
|`gwd\_broadcast\_v1`|2 variables — owner announcement|

**The exact body text for each is written in the comment block above its
definition in `src/lib/messaging/templates.ts`.** Copy it from there verbatim —
the placeholder count must match exactly or sends fail at runtime with a
`132000` error, which Meta reports at *send* time, not at approval time.

Approval usually takes minutes to a few hours. Rejections are almost always
about promotional language — keep the copy factual.

> `src/lib/messaging/templates.ts` also documents which templates carry which
> variables in which order. Do not reorder them.

## Step 8 — Verify

1. In your app: **Admin → Comms → Messaging health**. It reports whether
credentials are present and lists the templates that need approval.
2. Mark a student present. The parent should receive an attendance confirmation.
3. Check **Admin → Comms** for the delivery status moving
`queued → sent → delivered → read`. If it stays at `sent`, your webhook is
not wired — revisit step 6.

### Messaging limits to expect

A new WABA starts at **250 business-initiated conversations per 24 hours**. It
raises automatically (1K → 10K → 100K) as you send quality traffic without
getting blocked. For two academies this is plenty, but it is worth knowing
before you bulk-import 500 students and wonder why half the welcomes queued.

\---

# Part 3 — Creating your two academies

1. Log in as super admin.
2. **Deploy New Academy** — name, slug, location, and the owner's admin email,
phone and a starting password.
3. Open the academy → **Edit** → fill in the **Branding \& homepage** section:
logo, colours, typeface, background, disciplines, and — critically — the
**fee structure**.
4. Repeat for the second academy.
5. Hand each owner their login. When they sign in, the **setup checklist** on
their dashboard tells them what is still missing before parents can pay.

Then set `rzp\_account` and `settlementStrategy: route` on each (Part 1, step 3).

\---

# Quick reference — every environment variable

```
# Money
RAZORPAY\_KEY\_SECRET=
NEXT\_PUBLIC\_RAZORPAY\_KEY\_ID=rzp\_live\_...
RAZORPAY\_WEBHOOK\_SECRET=
GWD\_GATEWAY\_RATE\_BPS=236
GWD\_MARGIN\_RATE\_BPS=100

# WhatsApp
META\_WHATSAPP\_ACCESS\_TOKEN=
META\_WHATSAPP\_PHONE\_NUMBER\_ID=
META\_WHATSAPP\_VERIFY\_TOKEN=
META\_APP\_SECRET=

# Images (logo + gallery uploads return 503 without these)
CLOUDINARY\_CLOUD\_NAME=
CLOUDINARY\_API\_KEY=
CLOUDINARY\_API\_SECRET=

# Scheduled jobs (attendance confirmations, fee reminders)
CRON\_SECRET=
NEXT\_PUBLIC\_APP\_URL=https://sports.gwdglobal.in

# Super admin seed
SUPER\_ADMIN\_EMAIL=
SUPER\_ADMIN\_PASSWORD=
```

`CRON\_SECRET` must also be set as a **GitHub repository secret**, along with
`APP\_URL`, for `.github/workflows/cron.yml` to drive the 15-minute tick that
sends scheduled messages.

