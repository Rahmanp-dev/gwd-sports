'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  Globe,
  IdCard,
  MessageCircle,
  Phone,
  Repeat,
  Search,
  Trophy,
  Users,
} from 'lucide-react';
import { WHATSAPP_ONBOARD_URL } from '@/utils/contact';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * WHAT THIS PLATFORM IS, FOR THE PUBLIC
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Sits below the discovery map: someone has just seen academies pinned on a
 * city map and needs to understand what they are looking at and — if they run
 * an academy — how to get on it.
 *
 * SOURCED FROM THE INTERNAL STRATEGY DOC, DELIBERATELY FILTERED. The market
 * problems, the flywheel and the Passport are all public-facing and are the
 * reason anyone should care. Everything commercially sensitive in that document
 * is omitted on purpose and should stay omitted: pricing and per-student
 * economics, TAM/SAM/SOM figures, revenue and margin, the competitor teardown,
 * funding and valuation, school-partnership targets, and anything framed as a
 * moat or defensibility. A public page explains the value; it does not hand
 * over the plan.
 * ════════════════════════════════════════════════════════════════════════════
 */

const PROBLEMS = [
  {
    icon: Search,
    title: 'Nobody can find you',
    body: 'Most academies have no digital presence at all. Parents choose by WhatsApp forward and word of mouth, so the best coaching often loses to the loudest.',
  },
  {
    icon: IdCard,
    title: 'Progress disappears',
    body: 'A child can train for six years across three academies and finish with nothing to show for it. No record, no ratings, no proof.',
  },
  {
    icon: CreditCard,
    title: 'Fees run on cash and memory',
    body: 'Most fees arrive as cash or a UPI transfer to a coach’s personal number. No confirmation, no receipt, no record of who has paid.',
  },
  {
    icon: Trophy,
    title: 'Tournaments leave no trace',
    body: 'Local competition runs on group chats and printed brackets. Results are lost the week after they happen.',
  },
];

const FLYWHEEL = [
  {
    icon: Globe,
    title: 'Academies get found',
    body: 'Every academy gets a branded page on the city map — their colours, their logo, their disciplines.',
  },
  {
    icon: Users,
    title: 'Families enrol and pay',
    body: 'Enrolment and fees move online. Receipts and confirmations reach parents on WhatsApp automatically.',
  },
  {
    icon: CalendarCheck,
    title: 'Training gets recorded',
    body: 'Coaches take attendance in one tap. Parents know their child arrived. Progress is assessed, not guessed.',
  },
  {
    icon: IdCard,
    title: 'Students build a Passport',
    body: 'Attendance, achievements and assessments become a verifiable record that belongs to the child, not the academy.',
  },
  {
    icon: BadgeCheck,
    title: 'Proof attracts the next family',
    body: 'A Passport is shareable. Real records bring the next parent to the academy that earned them.',
  },
];

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-[#050508] px-5 py-16 text-white sm:px-8 md:py-28"
    >
      {/* Ambient wash — decorative only, clipped by the section. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[#FF1744]/[0.07] blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl">
        {/* ── Why ─────────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={item}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FF1744] sm:text-[11px]">
            Why this exists
          </span>
          <h2 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
            Grassroots sport runs on
            <span className="text-[#FF1744]"> nothing but trust</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#8b8b99] sm:text-base">
            Hyderabad has hundreds of academies doing serious work with almost no
            infrastructure behind them. Not a marketing problem — a plumbing one.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={item}
              transition={{ delay: Math.min(i, 4) * 0.06 }}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-colors hover:border-[#FF1744]/25 sm:p-6"
            >
              <p.icon className="h-5 w-5 text-[#FF1744]" />
              <h3 className="mt-3 text-base font-bold sm:text-lg">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#8b8b99] sm:text-sm">
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ── The flywheel ────────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={item}
          className="mx-auto mt-20 max-w-2xl text-center sm:mt-28"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FF1744]/25 bg-[#FF1744]/[0.07] px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF1744] sm:text-[11px]">
            <Repeat className="h-3 w-3" />
            The ecosystem flywheel
          </span>
          <h2 className="mt-4 text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-5xl">
            Every part feeds the next
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#8b8b99] sm:text-base">
            This is not a directory. Each stage produces something the following
            stage needs — which is why it compounds instead of stalling.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {FLYWHEEL.map((s, i) => (
            <motion.div
              key={s.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              variants={item}
              transition={{ delay: Math.min(i, 5) * 0.06 }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6"
            >
              <span className="absolute right-4 top-3 font-mono text-3xl font-bold text-white/[0.05] sm:text-4xl">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF1744]/10">
                <s.icon className="h-5 w-5 text-[#FF1744]" />
              </span>
              <h3 className="mt-3 text-base font-bold sm:text-lg">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#8b8b99] sm:text-sm">
                {s.body}
              </p>
            </motion.div>
          ))}

          {/* Closes the loop visually — the fifth step feeds the first. */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={item}
            className="flex flex-col items-center justify-center rounded-2xl border border-[#FF1744]/25 bg-[#FF1744]/[0.06] p-6 text-center"
          >
            <Repeat className="h-6 w-6 text-[#FF1744]" />
            <p className="mt-3 text-sm font-bold">…and it starts again</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#8b8b99]">
              Stronger academies attract more families. More families create more
              proof. More proof attracts stronger academies.
            </p>
          </motion.div>
        </div>

        {/* ── Onboarding CTA ──────────────────────────────────────────── */}
        <motion.div
          id="onboard"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={item}
          className="mt-20 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#12121a] to-[#0a0a0d] p-6 sm:mt-28 sm:p-10 md:p-14"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FF1744] sm:text-[11px]">
                Bring your academy on
              </span>
              <h2 className="mt-3 text-[26px] font-extrabold leading-[1.15] tracking-tight sm:text-4xl">
                Your academy, on the map — in a day
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#8b8b99] sm:text-base">
                We set it up with you: your branded page, your fee structure,
                your batches and your coaches. You keep your identity and your
                relationships. We handle the plumbing underneath.
              </p>

              <ul className="mt-6 space-y-2.5">
                {[
                  'A public page in your own colours and logo',
                  'Online fees, receipts and cash entries in one ledger',
                  'One-tap attendance and parent confirmations',
                  'A Student Passport for every child you train',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[13px] text-[#c9c9d4] sm:text-sm">
                    <BadgeCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#FF1744]" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/**
             * These reach a HUMAN, not a signup form.
             *
             * This CTA used to link to /user/auth. An academy owner reading
             * this has no account and cannot make one — onboarding is done with
             * them, not self-serve — so a login screen was a dead end at the
             * exact moment they were ready to talk.
             */}
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-6 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b8b99]">
                Talk to us
              </p>
              <a
                href="tel:+917981374451"
                className="mt-3 flex items-center justify-center gap-2 text-xl font-extrabold tracking-tight text-white transition-colors hover:text-[#FF1744] sm:text-2xl"
              >
                <Phone className="h-5 w-5 text-[#FF1744]" />
                +91 79813 74451
              </a>
              <p className="mt-2 text-[12px] leading-relaxed text-[#71717a]">
                Speak to the team about onboarding your academy. No obligation.
              </p>

              <a
                href={WHATSAPP_ONBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-black transition-all hover:bg-[#1ebe5b]"
              >
                <MessageCircle className="h-4 w-4" />
                Message us on WhatsApp
              </a>

              <a
                href="tel:+917981374451"
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-[#FF1744]/50 px-5 py-3 text-sm font-bold text-[#FF1744] transition-all hover:bg-[#FF1744] hover:text-white"
              >
                <Phone className="h-4 w-4" />
                Call to register
              </a>

              <a
                href="mailto:rahman@gwdglobal.in?subject=Onboarding%20my%20academy%20to%20GWD%20Sports"
                className="mt-3 block text-[12px] text-[#71717a] underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                rahman@gwdglobal.in
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
