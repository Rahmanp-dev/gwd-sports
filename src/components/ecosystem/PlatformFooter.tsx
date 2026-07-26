'use client';

import React from 'react';
import { ArrowUpRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import {
  GWD_ADDRESS_CITY,
  GWD_ADDRESS_NAME,
  GWD_EMAIL,
  GWD_MAPS_URL,
  GWD_PHONE_DISPLAY,
  GWD_PHONE_E164,
  WHATSAPP_ONBOARD_URL,
} from '@/utils/contact';

/**
 * The platform's own footer, for the GWD landing page.
 *
 * Distinct from `components/landing/Footer.tsx`, which is an ACADEMY's footer
 * on their `/[slug]` page and carries their identity. This one carries GWD's:
 * the company behind the product, how to reach it, and the legal pages.
 *
 * The corporate attribution is deliberate and belongs on the platform page
 * rather than on any academy's — a parent on an academy's site is dealing with
 * that academy, and only the "Powered by" line there needs to say otherwise.
 */

const LEGAL = [
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Refund Policy', href: '/refund-policy' },
  { label: 'Contact Us', href: '/contact' },
];

const EXPLORE = [
  { label: 'Discover academies', href: '/discover' },
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Onboard your academy', href: '/#onboard' },
  { label: 'Rankings', href: '/rankings' },
  { label: 'Events', href: '/events' },
];

export default function PlatformFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050508] px-5 py-12 text-white sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Identity */}
          <div>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gwdlogo.png" alt="" className="h-9 w-auto" />
              <span className="font-['DM_Sans',sans-serif] text-lg font-bold tracking-wider">
                <span className="text-[#FF1744]">GWD</span> SPORTS
              </span>
            </div>

            <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-[#71717a]">
              The infrastructure layer for grassroots sport in India — discovery,
              enrolment, payments and verified student records, in one place.
            </p>

            <div className="mt-5 space-y-2 text-[13px] text-[#8b8b99]">
              <a
                href={`tel:+${GWD_PHONE_E164}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 text-[#FF1744]" />
                {GWD_PHONE_DISPLAY}
              </a>
              <a
                href={WHATSAPP_ONBOARD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                WhatsApp us
              </a>
              <a
                href={`mailto:${GWD_EMAIL}`}
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 text-[#FF1744]" />
                {GWD_EMAIL}
              </a>
              <a
                href={GWD_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 transition-colors hover:text-white"
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#FF1744]" />
                <span>
                  {GWD_ADDRESS_NAME}
                  <br />
                  {GWD_ADDRESS_CITY}
                </span>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#71717a]">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5">
              {EXPLORE.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[13px] text-[#8b8b99] transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#71717a]">
              Legal
            </h4>
            <ul className="mt-4 space-y-2.5">
              {LEGAL.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-[13px] text-[#8b8b99] transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Corporate line */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
          <p className="text-[12px] text-[#71717a]">
            © {new Date().getFullYear()} GWD Sports Ecosystem. A product of{' '}
            <a
              href="https://www.gwdglobal.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 font-semibold text-[#a1a1aa] underline-offset-2 transition-colors hover:text-white hover:underline"
            >
              GWD Global Pvt Ltd
              <ArrowUpRight className="h-3 w-3" />
            </a>
            .
          </p>

          <a
            href="https://www.gwdglobal.in"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-4 py-1.5 text-[12px] font-semibold text-[#a1a1aa] transition-colors hover:border-[#FF1744]/40 hover:text-white"
          >
            www.gwdglobal.in
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
