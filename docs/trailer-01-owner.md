# Trailer 01 — "IT RAN WITHOUT YOU"
### The academy owner's film · 60 seconds · UI + motion graphics only

---

## THE ONE-LINE CONCEPT

**An academy owner wakes up. The academy has already run itself for two hours.**

Everything in the film is real product UI. There is no actor, no pitch, no
voiceover explaining features. We show a working morning and let the owner
watch their own job get easier.

---

## WHY THIS HOOK (read before scripting)

The instinct is to open on the pain — a messy paper register, a pile of cash,
a chaotic WhatsApp group. **Don't.** Three reasons:

1. Every SaaS ad in India opens on the problem. It is the most skippable five
   seconds in the format.
2. It insults the owner. They *know* their register is a mess. Opening there
   says "look how badly you run your academy."
3. It delays the product by five seconds — which, in a five-second attention
   window, means the product never appears.

Instead we open on **a result that arrives before the viewer understands how.**
A notification, at 6:02 AM, on a dark screen. A child has checked in. The owner
is still asleep. The viewer's first thought is *"who did that?"* — and the rest
of the film is the answer.

The emotional target is not "this is powerful." It is **relief**.

---

## TONE & GRADE

| | |
|---|---|
| Reference | Apple *"Introducing…"* product films — but slower and warmer. Not Silicon Valley cold. |
| Palette | GWD dark `#050508` for connective tissue; MasterGrade's real crimson `#FF1744` and amber `#F59E0B` for accents. Never invent a colour. |
| Type | DM Sans throughout, 800 weight for statements, tight tracking (`-0.02em`). |
| Motion | Everything eases `cubic-bezier(0.22, 1, 0.36, 1)`. Nothing bounces. Nothing spins. |
| Camera | Slow push-ins only. No whip pans, no shake, no 3D card flips. |
| Cuts | On the beat, but never faster than 0.6s until the 0:44 montage. |
| Sound | Sparse. A single low sub-bass pulse per statement. Real UI sounds only at 0:00 and 0:52. |

**Hard rule for the AI tool:** every screen must be a supplied screenshot,
composited. Nothing may be *generated* that looks like a UI. Generated UI is
where these tools invent buttons that do not exist, and one fake button
destroys the credibility of the entire film.

---

# SCENE-BY-SCENE

---

### `0:00 – 0:05` · THE HOOK — "6:02 AM"

**Screen:** Pure black. Not GWD dark — true `#000000`.

**0:00.0** Silence. One second of nothing. (Hold it. The instinct is to cut
this. Don't — it is what makes the notification land.)

**0:01.0** A single WhatsApp notification slides down from the top, phone-frame
only, no device chrome. Real message text, from our actual template:

> **Rohan checked in at MasterGrade Sports Academy at 6:02 AM ✅**

Soft haptic *thud*. The notification is the only lit object on screen.

**0:02.5** Notification holds. Beneath it, small, `#5C636E`:

> *Nobody opened an app to send this.*

**0:04.0** Everything fades except the timestamp `6:02 AM`, which drifts to
screen centre and enlarges.

**Assets:** `S01`

**Note:** Rohan is the name in our real `attendance_confirmation` template.
Keep it.

---

### `0:05 – 0:11` · THE TURN — "You were asleep"

**0:05.0** `6:02 AM` remains. Beside it, a second timestamp fades in:
`YOU WOKE UP 7:15 AM`.

**0:06.5** Both timestamps slide apart to the edges of frame. Between them, a
thin crimson progress line draws left→right, and small ticks appear along it as
label chips — each one a thing that already happened:

- `6:02 · Rohan checked in`
- `6:04 · Parent notified`
- `6:11 · Aarav checked in`
- `6:38 · Fee reminder sent`
- `6:52 · Payment received`

Each chip pops in on a sub-bass hit, 0.35s apart.

**0:10.0** Line completes. All chips hold. Statement types on beneath:

> ## Your academy ran for an hour and thirteen minutes before you did.

**Assets:** none — pure motion graphics using our type and colour.

---

### `0:11 – 0:20` · YOU EXIST NOW — the Discovery Map

**0:11.0** Hard cut. The GWD Discovery Map, full bleed. We are zoomed OUT over
Hyderabad — the real dark Leaflet map from our landing page, red pins glowing.

**0:12.5** Slow push-in toward one pin. As it grows, the label resolves:
`MasterGrade Sports Academy · CRICKET`.

**0:14.5** Pin is tapped (soft click). The real academy sidebar slides in from
the right — the actual panel with **#1**, sport chips, `GWD FOUNDING ACADEMY`
badge, **District Semifinalist**, Star Players (Rohit Sharma K — State,
Aditya Varma — District MVP), Registered Teams.

**0:17.0** Statement types over a darkened map:

> ## A parent three streets away can finally find you.

**0:19.0** Sidebar's `View Full Profile →` button pulses once.

**Assets:** `S02`, `S03`

**Direction note:** the push-in must be a *scale on the still*, not a re-render.
Do not let the tool animate the map — it will invent roads.

---

### `0:20 – 0:27` · YOUR PAGE, NOT OURS — branded site + live editor

**0:20.0** The `View Full Profile` press carries us into MasterGrade's real
public homepage — crimson hero, crest, **"WHERE LEGENDS ARE BORN"**.

**0:21.5** Hold 1s. Let it breathe. This is the "that's *mine*" moment.

**0:22.5** Cut to the **Look & Feel canvas editor** — the split view with the
live page on the left and the Brand panel on the right.

**0:23.5** The colour swatch changes: `#FF1744` → a deep blue preset. **The
homepage on the left recolours in the same frame.** Cut on the exact frame the
change lands.

**0:25.0** Statement:

> ## Edit your homepage. On your homepage.

**Assets:** `S04`, `S05`, `S06`

**Direction note:** S05 and S06 must be the *same viewport, same scroll
position*, differing only in brand colour. That is what makes the recolour read
as instant rather than as a cut between two screens.

---

### `0:27 – 0:36` · THE DAY — attendance, without you

**0:27.0** Cut to the **Check-in codes** screen. The QR is centre-frame.

**0:28.0** The QR lifts off the screen and rotates flat, as if printed and
pinned to a gate. Everything else desaturates.

**0:29.5** A phone frame enters bottom-right and scans it. Green check.

**0:30.5** Overlay chips fire in sequence off the real "How it works" copy:

- `The code says which batch`
- `The login says which child`
- `A photo of it does nothing at 3am`

**0:33.0** Cut to the **owner's Command Center**, KPI row lighting left to
right: `ACTIVE STUDENTS 4` · `ATTENDANCE 85%` · `REVENUE ₹18.3K` · `FEE OVERDUE 0`.

**0:34.5** Statement:

> ## The register marks itself. The parent already knows.

**Assets:** `S07`, `S08`

---

### `0:36 – 0:46` · THE MONEY — the part they actually worry about

**0:36.0** Cut to **Fees & payments**. Push in on the **Fee Defaulters** panel —
real names, phone and mail buttons. Outstanding figures here are the academy's
own side of the ledger, so they are safe to show — but see THE MONEY RULE.

**0:38.0** Cursor presses **Mark paid** on one row. The row settles green and
leaves the list. Small chip: `Reminders stopped.`

**0:40.0** Cut to the **Transaction Ledger** — the reflowing list with the
student's name on every row, receipt number, status and date.

**0:42.0** Push in until one row fills the frame. It does **not** expand into
arithmetic. It simply resolves, and a single line settles beside it:

> `settled to your bank`

**0:44.0** Statement:

> ## Cash at the ground still works. One tap, and the books agree.

**Assets:** `S09`, `S10`

---

## ⚠️ THE MONEY RULE — read before capturing S09/S10

**No figure that lets a viewer do subtraction may appear in this film.**

An earlier draft of this script showed:

```
PARENT PAYS      ₹3,104
YOUR ACADEMY     ₹3,000
```

That is wrong, and it is wrong in a subtle way worth naming. It never states
the convenience fee — but anyone can subtract, and the moment they do, the
question is "what is that ₹104?" A trailer has three seconds and cannot answer
it. The breakdown belongs in the partner booklet, given in a conversation where
it can be explained properly.

**So:**

- Never show a parent-facing total alongside an academy figure.
- Never show two money numbers that differ, in the same frame or adjacent cuts.
- Amounts in the ledger are fine **on their own** — the ledger now renders the
  academy's own share, so every number on that screen is money the academy
  banks. There is nothing to subtract from.
- If a beat feels like it needs a number to land, use **100%** — the claim,
  not the arithmetic.

**Capture check:** before uploading S09 and S10, confirm the ledger figures
match the "Lifetime revenue" tile's basis. They do now — both read the
academy's share — but if a screenshot ever shows a row larger than what the
KPI implies, stop and ask, because that is the parent total leaking back in.

### `0:46 – 0:53` · THE PROOF — the Sports Passport

**0:46.0** Cut to the **Sports Passport**, phone-shaped, dark header, crimson
`RV` avatar, the gold **State level** badge.

**0:47.5** Scroll reveals the **Sporting record** timeline — real entries:
`U-14 District Championship · Runners-up`, `State U-16 Selection Trial ·
Shortlisted`, `Telangana Junior League · Selected`.

**0:49.5** The passport shrinks into a phone frame. The **Share** sheet opens.
It goes into a WhatsApp family group. Three read receipts tick.

**0:51.0** Statement:

> ## Every parent who shares it is showing somebody your academy.

**Assets:** `S11`, `S12`

---

### `0:53 – 1:00` · THE PRICE

**0:53.0** Cut to black. One beat of silence — kill the music entirely.

**0:54.0** Three figures type on, one per beat, centred, huge:

```
₹0        ₹0          100%
to join   per month   of your coaching fee
```

**0:57.0** They collapse into the GWD mark.

**0:58.0** Under it:

> **sports.gwdglobal.in**
> Free for every academy in India.

**1:00.0** Cut to black.

**Assets:** `S13` (logo, transparent PNG)

**⚠️ Do not** add "no catch", "no hidden fees", or "where's the catch". Saying
it invites the doubt. The three numbers are the whole argument.

---

# SCREENSHOT MANIFEST

Capture every one of these yourself and upload them. **The AI tool must
composite these, never generate UI.**

### Capture settings — non-negotiable

| Setting | Value | Why |
|---|---|---|
| Resolution | **2× / retina minimum.** Desktop 2560×1440, phone 1170×2532 | Video is unforgiving; a 1× screenshot looks broken at 1080p |
| Format | PNG, never JPG | JPG artefacts on UI text look like render errors |
| Browser chrome | **None.** Full-page or element capture only | We composite our own frame |
| Cursor | Hidden | We animate the cursor |
| Zoom | Browser at 100% | 110% breaks our layout metrics |
| Theme | MasterGrade's real theme | Do not switch academies mid-film |

---

| ID | Screen | Where | State to capture | Notes |
|---|---|---|---|---|
| **S01** | WhatsApp check-in message | Your phone | The real `attendance_confirmation` message on a dark chat background | Crop to the bubble only. If you don't have a real one, send yourself a test check-in. |
| **S02** | Discovery Map — wide | `/` (landing) | Zoomed to show all Hyderabad pins, sidebar **closed** | Wait for Leaflet tiles to fully load |
| **S03** | Discovery Map — sidebar open | `/` | MasterGrade pin selected, full sidebar visible | Same zoom/position as S02 if possible |
| **S04** | Academy public homepage | `/mastergrade` | Hero, crest, "WHERE LEGENDS ARE BORN", scrolled to top | Full viewport |
| **S05** | Look & Feel editor — crimson | Admin → Look & feel | Canvas left, Brand panel right, `#FF1744` active | **Note the scroll position** |
| **S06** | Look & Feel editor — blue | Admin → Look & feel | **Identical framing to S05**, Deep Blue preset applied | Only the colour may differ |
| **S07** | Check-in codes | Admin → Check-in → Check-in codes | Batch selected, QR visible, "How it works" panel readable | The QR must be sharp |
| **S08** | Command Center | Admin → Overview | Full KPI row + panels below | Top of page |
| **S09** | Fee Defaulters | Admin → Fees & payments | Defaulters panel with rows, phone/mail/Mark-paid buttons visible | Crop tight to the panel |
| **S10** | Transaction Ledger | Admin → Fees & payments | Ledger list with student names, receipts, amounts, statuses | Needs ≥4 rows to read as a real ledger |
| **S11** | Sports Passport — top | `/passport/GWD-C8A6GN` | Header, avatar, State level badge, stat tiles | **Phone viewport, 390px wide** |
| **S12** | Sports Passport — record | `/passport/GWD-C8A6GN` | Scrolled to the Sporting record timeline, ≥3 entries visible | Same phone viewport |
| **S13** | GWD logo | `/public/gwdlogo.png` | Transparent PNG | Already in the repo |

### Optional, strengthens the film

| ID | Screen | Why |
|---|---|---|
| **S14** | Import wizard — three methods (CSV / photo / paste) | If you want a "getting started" beat |
| **S15** | ⌘K command palette open | Excellent 0.5s flash of sophistication |
| **S16** | Messages tab with delivery statuses | Proves the WhatsApp claim is real |

---

# PROMPT GUARDRAILS FOR THE AI TOOL

Paste this verbatim alongside the assets:

> **Non-negotiable constraints:**
>
> 1. All user-interface imagery must come from the supplied screenshots.
>    **Never generate, redraw, extrapolate or "clean up" any UI.** Do not
>    invent buttons, menus, charts, numbers or text inside a product screen.
> 2. Do not alter any text visible inside a screenshot. Names, amounts,
>    timestamps and labels are real and must remain exactly as supplied.
> 3. Screens may only be scaled, cropped, masked, and moved. No perspective
>    warping of UI except the single QR "lift" at 0:28.
> 4. Colours: `#050508` background, `#FF1744` primary, `#F59E0B` accent,
>    `#FFFFFF` type. No other colours.
> 5. Typeface: DM Sans. Headline weight 800, tracking −0.02em.
> 6. All easing `cubic-bezier(0.22, 1, 0.36, 1)`. No bounce, no elastic, no
>    spin, no 3D card flip, no lens flare, no particles.
> 7. Camera moves are push-in or push-out only.
> 8. If an asset is missing for a beat, **leave the frame black and flag it**.
>    Do not substitute a generated screen.

---

# THINGS TO DECIDE BEFORE YOU SHOOT

**1. Whose names appear.** Every name in this script is seeded demo data on
MasterGrade (Rahul Verma, Rohan, Aarav) or already public on the academy's own
profile (Rohit Sharma K, Aditya Varma). **Do not swap in real fee-paying
children** — a trailer showing a real child's attendance record and their
parent's payment is a privacy problem you cannot take back once it's posted.

**2. The "0 students" figures.** Several real academies currently show `0
students` on the Discovery Map, and the Command Center shows `ACTIVE STUDENTS 4`.
Those are honest and small. Two options: film them as-is and let the numbers be
modest, or populate MasterGrade's demo data properly before capture. **Do not
retouch the numbers in post** — that is the one thing the platform itself
refuses to do anywhere in the product, and it would be a strange thing to break
in the advert for it.

**3. Length.** 60s is right for a website hero and a pitch. Cut a **20-second**
version for paid social: keep `0:00–0:11` (hook), `0:36–0:46` (money),
`0:53–1:00` (price). Those three beats carry the whole argument.

---

# WHAT TRAILERS 02 AND 03 WILL BE

Sketched here only so this one doesn't try to do their job.

**02 — Student, parent & coach.** Same UI-only technique, warmer, slower. Told
from the Passport outward. The coach's toolkit, the evaluation, the badge
landing on a parent's phone. Hook candidate: a child's finger tracing their own
Sporting record timeline.

**03 — Real humans.** Live footage: a real ground, real parents at drop-off, a
coach with a phone, a QR taped to a gate. UI appears only as overlay on real
hands. This is the film that proves the first two weren't a rendering. Shoot
this one last, at MasterGrade, in one morning.
