"use client";

import Link from "next/link";

/* ─────────────────────────────────────────────
   LegalFooter — GWD Sports Ecosystem
   Premium dark footer with brand, legal links,
   and Razorpay attribution.
───────────────────────────────────────────── */
export default function LegalFooter() {
  const currentYear = new Date().getFullYear();

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms-and-conditions" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        .legal-link { color: #888899; transition: color 0.2s; }
        .legal-link:hover { color: #ffffff; }
      `}</style>

      <footer
        className="bg-[#030305] border-t border-white/[0.05] py-8 px-6"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        <div className="max-w-5xl mx-auto">
          {/* Top: Logo + Tagline (centered) */}
          <div className="flex flex-col items-center text-center mb-6">
            <Link href="/" className="inline-flex items-baseline gap-0 group">
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#dc2626",
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                }}
                className="group-hover:opacity-90 transition-opacity"
              >
                GWD
              </span>
              <span
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "0.14em",
                  lineHeight: 1,
                }}
                className="group-hover:opacity-90 transition-opacity"
              >
                {" "}SPORTS
              </span>
            </Link>
            <p
              className="mt-2 text-xs uppercase tracking-[0.18em]"
              style={{ color: "#3a3a4e" }}
            >
              India&apos;s Sports Academy Operating System
            </p>
          </div>

          {/* Gradient divider */}
          <div
            className="w-full h-px mb-6"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)",
            }}
          />

          {/* Legal Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-y-3 mb-6">
            {legalLinks.map((link, i) => (
              <span key={link.href} className="flex items-center">
                <Link href={link.href} className="legal-link text-sm px-4">
                  {link.label}
                </Link>
                {i < legalLinks.length - 1 && (
                  <span
                    className="hidden sm:inline text-xs select-none"
                    style={{ color: "#1e1e2e" }}
                  >
                    |
                  </span>
                )}
              </span>
            ))}
          </nav>

          {/* Gradient divider */}
          <div
            className="w-full h-px mb-6"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(255,255,255,0.04), transparent)",
            }}
          />

          {/* Bottom: Copyright + Razorpay */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "#3a3a4e" }}>
              © {currentYear} GWD Sports Ecosystem. All rights reserved.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "#2e2e3e" }}>
                Payments secured by
              </span>
              <a
                href="https://razorpay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-40 hover:opacity-70 transition-opacity"
                aria-label="Razorpay"
              >
                <span
                  className="text-xs font-bold tracking-wide"
                  style={{ color: "#528FF0" }}
                >
                  Razorpay
                </span>
              </a>
            </div>
          </div>

          {/* Jurisdiction note */}
          <p
            className="text-center mt-5 text-xs"
            style={{ color: "#252530" }}
          >
            Registered in India · Hyderabad, Telangana · Governed under the
            Information Technology Act, 2000
          </p>
        </div>
      </footer>
    </>
  );
}
