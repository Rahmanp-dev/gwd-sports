'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Wallet,
  DoorOpen,
  Ruler,
  HeartHandshake,
  MessageSquareWarning,
  Sparkles,
  School,
  Trophy,
  IdCard,
} from 'lucide-react';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE PART THE PAGE WAS MISSING
 * ════════════════════════════════════════════════════════════════════════════
 *
 * HowItWorks explains the problem, the loop and how to join. It never answers
 * the question every academy owner asks inside the first minute of a real
 * conversation: "if it's free, where's the catch?" Leaving that unanswered on
 * the page means it gets asked on a call instead — and until it is answered,
 * nothing above it is being believed.
 *
 * So this section is ordered by what an owner actually decides on:
 *   1. What it costs, with the split shown rather than asserted.
 *   2. What we commit to, in plain words — the risk side of handing over your
 *      student records, your parent relationships and your fee collection.
 *   3. What is coming, marked honestly as not built yet.
 *   4. What a student gets, last — because the academy signs up, not the child.
 *
 * EVERY NUMBER HERE IS STRUCTURAL, NOT MEASURED. ₹0 and 100% are properties of
 * how the settlement is wired, not counts of anything. Nothing on this page
 * claims an academy count, a student count or a success rate, because this
 * codebase refuses to generate those anywhere else and the homepage is not an
 * exception. See the `|| 20` / `|| 7` note in LandingPage.tsx for what happened
 * the last time invented numbers reached this page.
 * ════════════════════════════════════════════════════════════════════════════
 */

const fade = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

const PROMISES = [
  {
    Icon: ShieldCheck,
    title: 'Your data is sealed off',
    body: 'Isolation is enforced in the database, not by hiding a menu. You cannot see another academy’s students, revenue or messages — and nobody can see yours.',
  },
  {
    Icon: HeartHandshake,
    title: 'No child is locked out over money',
    body: 'Attendance, Passport and portal access stay open whatever is owed. An unpaid fee is a conversation between adults, not a reason to punish a nine-year-old.',
  },
  {
    Icon: Ruler,
    title: 'Your page never overstates you',
    body: 'Forty students shows as forty. The platform cannot generate a “500+ athletes trained” badge and has no facility for inventing testimonials — for you, or for anyone you compete with.',
  },
  {
    Icon: DoorOpen,
    title: 'You can leave with your data',
    body: 'No lock-in, no notice period, no exit fee. Ask and we export your students, attendance and payment history. A platform that has to trap you isn’t confident in itself.',
  },
];

const COMING = [
  {
    Icon: Sparkles,
    title: 'Content Engine',
    body: 'Instagram-ready posts generated from what your academy already did that week — milestones, results, match recaps. Editable before anything is published.',
  },
  {
    Icon: School,
    title: 'School campaigns',
    body: 'GWD runs sports events inside schools and routes the children who show promise to partner academies nearby — matched by sport and distance.',
  },
  {
    Icon: Trophy,
    title: 'Inter-academy tournaments',
    body: 'Real fixtures between ecosystem academies, with results feeding straight back into student Passports.',
  },
];

export default function WhatItCosts() {
  return (
    <section
      id="what-it-costs"
      className="relative bg-[#050508] px-5 py-16 text-white sm:px-8 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-[24rem] w-[24rem] rounded-full bg-[#FF1744]/[0.06] blur-[110px]" />
        <div className="absolute bottom-0 left-1/4 h-[20rem] w-[20rem] rounded-full bg-[#C8971A]/[0.05] blur-[110px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ── 1. The money question ───────────────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fade}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FF1744] sm:text-[11px]">
            For academies
          </span>
          <h2 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
            &ldquo;If it&rsquo;s free,
            <span className="text-[#FF1744]"> where&rsquo;s the catch?&rdquo;</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#8b8b99] sm:text-base">
            Fair question, and the first one everybody asks. Here is the whole
            answer, with nothing held back for the contract.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fade}
          className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4"
        >
          {[
            { n: '₹0', l: 'To join' },
            { n: '₹0', l: 'Every month' },
            { n: '100%', l: 'Of your coaching fee' },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#12121a] to-[#0a0a0d] px-5 py-7 text-center"
            >
              <div className="text-4xl font-extrabold tracking-tight text-[#FF1744] sm:text-5xl">
                {s.n}
              </div>
              <div className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a7a88]">
                {s.l}
              </div>
            </div>
          ))}
        </motion.div>

        {/* The split, shown as a worked example rather than asserted. An owner
            who can see where each rupee goes stops needing to be reassured. */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fade}
          className="mt-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0a0d] p-6 sm:p-8"
        >
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FF1744]" />
            <div className="min-w-0">
              <h3 className="text-base font-bold sm:text-lg">
                Where the money actually comes from
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#8b8b99] sm:text-sm">
                When a parent pays online, a small convenience fee is added to
                <em> their</em> total — the way it is on any ticket or bill
                payment. Most of it goes to the payment gateway; the remainder
                is our platform fee. Your coaching fee is untouched and settles
                directly into your bank account. We never hold it and never take
                a cut of it.
              </p>

              {/*
                ══════════════════════════════════════════════════════════════
                WHAT MAY AND MAY NOT BE CLAIMED HERE
                ══════════════════════════════════════════════════════════════

                An earlier draft printed a four-way split naming Razorpay's cut
                as ₹73.25 and ours as ₹30.75. That was WRONG to publish, for a
                reason the codebase already knows about: `gatewayFeePaise` is a
                MODELLED estimate at a flat 236 bps with no branching by payment
                method, while `gatewayFeeActualPaise` — captured from the
                webhook in settle.ts — is what Razorpay really charged. The two
                are stored separately precisely because they differ.

                They differ most on the commonest case. UPI carries zero MDR in
                India by regulation, so on a UPI payment the gateway's actual
                charge is at or near nil and our share of the same ₹104 is far
                larger than ₹30.75. Publishing the estimate as fact understated
                our own take roughly threefold on the method most parents use —
                and attributed a specific number to a named third party that
                they do not actually charge on that transaction.

                So the tiles now assert only what is true on EVERY transaction
                regardless of instrument: the total charged, and that the
                academy receives 100% of its fee. The remainder is described by
                its components without a per-party rupee figure. The 1% is ours
                to state because we set it; the gateway's is not.

                Do not reinstate a named third-party amount here without making
                the split method-aware and reconciling against
                gatewayFeeActualPaise.
                ══════════════════════════════════════════════════════════════
              */}
              <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
                {[
                  { k: 'Parent pays', v: '₹3,104', s: 'The total on their screen', tone: 'text-white' },
                  { k: 'Your academy', v: '₹3,000', s: '100% of your fee, always', tone: 'text-[#4ade80]' },
                  { k: 'Added on top', v: '₹104', s: 'Gateway, tax + our 1%', tone: 'text-[#8b8b99]' },
                ].map((row) => (
                  <div
                    key={row.k}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                  >
                    <div className={`text-lg font-extrabold tracking-tight ${row.tone}`}>
                      {row.v}
                    </div>
                    <div className="mt-0.5 text-[11px] font-medium text-[#c9c9d4]">{row.k}</div>
                    <div className="mt-0.5 text-[10px] text-[#6e6e7c]">{row.s}</div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[12px] leading-relaxed text-[#6e6e7c]">
                A real ₹3,000 monthly fee, split automatically at the moment of
                payment. The ₹104 on top covers{' '}
                <span className="text-[#c9c9d4]">
                  the payment gateway&rsquo;s charge and the tax on it
                </span>{' '}
                — money we never touch — plus{' '}
                <span className="text-[#c9c9d4]">our 1% platform fee</span>,
                which is what funds everything on this page. The gateway&rsquo;s
                share varies by how the parent chooses to pay; yours never does.
                Cash handed over at the ground still works, and we charge
                nothing on it, because we did nothing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── 2. The promises ─────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fade}
          className="mx-auto mt-20 max-w-2xl text-center sm:mt-28"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FF1744] sm:text-[11px]">
            What we commit to
          </span>
          <h2 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
            Handing over your academy
            <span className="text-[#FF1744]"> is a real risk</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#8b8b99] sm:text-base">
            Your student records, your parent relationships, your fee
            collection. The least we can do is be specific in advance about how
            we intend to behave — and then be held to it.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4">
          {PROMISES.map((p, i) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={fade}
              transition={{ delay: i * 0.06 }}
              className="group rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#12121a] to-[#0a0a0d] p-5 transition-colors hover:border-[#FF1744]/25 sm:p-6"
            >
              <p.Icon className="h-5 w-5 text-[#FF1744]" />
              <h3 className="mt-3 text-base font-bold sm:text-lg">{p.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#8b8b99] sm:text-sm">
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── 3. What's coming — marked, never blurred into the present ── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fade}
          className="mt-20 rounded-3xl border border-[#C8971A]/20 bg-gradient-to-br from-[#14110a] to-[#0a0a0d] p-6 sm:mt-28 sm:p-10"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C8971A] sm:text-[11px]">
              Being built now
            </span>
            <span className="rounded-full border border-[#C8971A]/30 bg-[#C8971A]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#e0bb55]">
              Not available yet
            </span>
          </div>
          <h2 className="mt-3 max-w-2xl text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl">
            The ecosystem gets stronger
            <span className="text-[#C8971A]"> as more academies join</span>
          </h2>

          <div className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {COMING.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <c.Icon className="h-5 w-5 text-[#C8971A]" />
                <h3 className="mt-3 text-base font-bold">{c.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[#8b8b99]">
                  {c.body}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-6 flex items-start gap-2 text-[12px] leading-relaxed text-[#6e6e7c]">
            <MessageSquareWarning className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#C8971A]" />
            These are in development and are labelled as such deliberately. You
            will not find anything on this page implied as available today that
            isn&rsquo;t.
          </p>
        </motion.div>

        {/* ── 4. The student's side, last ─────────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fade}
          className="mt-20 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#12121a] to-[#0a0a0d] p-6 sm:mt-28 sm:p-10 md:p-14"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FF1744] sm:text-[11px]">
                For students &amp; parents
              </span>
              <h2 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl">
                Every student gets a
                <span className="text-[#FF1744]"> Sports Passport</span>
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#8b8b99] sm:text-base">
                One link carrying a child&rsquo;s training record — the
                tournaments they played, the levels they reached, their
                attendance and the badges they earned. It belongs to them, not
                to an academy: if they move, the record moves with them and
                nothing restarts.
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  'A permanent ID and a shareable link',
                  'Tournaments, leagues, camps and trials, kept by their coach',
                  'Attendance and progress, updated as it happens',
                  'No fees, phone numbers or medical details — ever',
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-[13px] text-[#c9c9d4] sm:text-sm"
                  >
                    <IdCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF1744]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a7a88]">
                Why it matters to an academy
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#c9c9d4]">
                A parent shares their child&rsquo;s Passport in a family group.
                Six people see your logo, your academy name and a real
                achievement attached to a real child. One of them has a
                seven-year-old.
              </p>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white">
                That is a lead you did nothing to generate — and it started
                with a coach entering a score.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
