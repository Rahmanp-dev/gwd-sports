"use client";

import Link from "next/link";

/* ─────────────────────────────────────────────
   Reusable Section component
───────────────────────────────────────────── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2
        style={{ fontFamily: "'DM Sans', sans-serif" }}
        className="text-xl font-bold text-white mb-3 pb-2 border-b border-white/10"
      >
        {title}
      </h2>
      <div className="text-[#a0a0b0] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function PrivacyPolicyPage() {
  return (
    <>
      {/* Google Fonts */}
      <style>{`
      `}</style>

      <div
        className="min-h-screen"
        style={{
          background: "#0a0a0e",
          fontFamily: "'DM Sans', sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Hero Header */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0a0a0e 0%, #12121a 60%, #1a0a0e 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full"
              style={{
                background: "radial-gradient(circle, #dc2626 0%, transparent 70%)",
                transform: "translate(30%, -30%)",
              }}
            />
          </div>
          <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-20">
            <div className="flex items-center gap-2 mb-6">
              <Link
                href="/"
                className="text-sm text-[#a0a0b0] hover:text-white transition-colors"
              >
                Home
              </Link>
              <span className="text-[#444] text-sm">/</span>
              <span className="text-sm text-white/60">Privacy Policy</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-1 h-10 rounded-full"
                style={{ background: "linear-gradient(180deg, #dc2626, #991b1b)" }}
              />
              <h1
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                className="text-4xl md:text-5xl font-bold"
              >
                Privacy Policy
              </h1>
            </div>
            <p className="text-[#a0a0b0] mt-4 max-w-2xl">
              GWD Sports Ecosystem is committed to safeguarding your personal data.
              This policy explains how we collect, use, and protect your information
              in compliance with the{" "}
              <span className="text-white/80">
                Information Technology Act, 2000
              </span>{" "}
              and the IT (Amendment) Act, 2008.
            </p>
            <p className="mt-4 text-sm text-[#666]">
              Last Updated:{" "}
              <span className="text-[#a0a0b0]">July 2026</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Info bar */}
          <div
            className="flex items-start gap-4 p-5 rounded-xl mb-10"
            style={{
              background: "rgba(220,38,38,0.06)",
              border: "1px solid rgba(220,38,38,0.15)",
            }}
          >
            <div className="text-red-500 text-xl mt-0.5">🔒</div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">
                Your Data is Safe with Us
              </p>
              <p className="text-sm text-[#a0a0b0]">
                GWD Sports Ecosystem Pvt. Ltd. acts as the data controller for
                information collected through the platform. We never sell your
                personal data to third parties.
              </p>
            </div>
          </div>

          <Section title="1. Who We Are">
            <p>
              GWD Sports Ecosystem Pvt. Ltd. (&quot;GWD&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) operates the GWD Sports Academy
              Management Platform — India&apos;s Sports Academy Operating System —
              accessible at{" "}
              <a href="https://gwd.in" className="text-red-400 hover:text-red-300">
                gwd.in
              </a>{" "}
              and affiliated subdomains. Our registered office is located in
              Hyderabad, Telangana, India.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p>
              We collect the following categories of personal information when you
              register or use our platform:
            </p>

            <div
              className="mt-4 rounded-xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                {
                  category: "Identity & Contact",
                  data: "Full name, date of birth, gender, email address, phone number, profile photograph",
                  icon: "👤",
                },
                {
                  category: "Academy Data",
                  data: "Academy name, sport discipline, batch/program enrollment, attendance records, performance metrics",
                  icon: "🏟️",
                },
                {
                  category: "Payment Information",
                  data: "Fee payment records, transaction IDs, payment method type (card/UPI/netbanking). Card numbers are never stored — handled entirely by Razorpay.",
                  icon: "💳",
                },
                {
                  category: "Usage Data",
                  data: "IP address, browser type, device information, pages visited, time spent, referral source",
                  icon: "📊",
                },
                {
                  category: "Media & Documents",
                  data: "Profile pictures, sports certificates, event photos stored via Cloudinary",
                  icon: "📸",
                },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4"
                  style={{
                    background:
                      i % 2 === 0
                        ? "rgba(255,255,255,0.02)"
                        : "rgba(255,255,255,0.04)",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                  }}
                >
                  <div className="text-2xl flex-shrink-0">{row.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">
                      {row.category}
                    </p>
                    <p className="text-sm text-[#a0a0b0]">{row.data}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="3. How We Use Your Information">
            <BulletList
              items={[
                "To create and manage your account on the GWD Sports platform",
                "To facilitate academy management including attendance, batch scheduling, and fee collection",
                "To process payments securely via Razorpay's PCI-DSS compliant payment gateway",
                "To send transactional notifications (payment receipts, enrollment confirmations, attendance alerts) via SMS, email, or WhatsApp",
                "To generate reports and analytics for academy administrators",
                "To upload and serve media (profile photos, event images) via Cloudinary CDN",
                "To respond to support requests and enquiries",
                "To improve platform features based on anonymised usage analytics",
                "To comply with legal obligations under Indian law",
              ]}
            />
          </Section>

          <Section title="4. Data Sharing & Third Parties">
            <p>
              We do{" "}
              <strong className="text-white">not sell, rent, or trade</strong> your
              personal information to third parties. We share data only with:
            </p>
            <div className="mt-4 space-y-4">
              {[
                {
                  name: "Razorpay Software Pvt. Ltd.",
                  purpose:
                    "Payment processing — collects and processes payment card data, UPI, and netbanking under their own PCI-DSS certified infrastructure. Governed by Razorpay's Privacy Policy.",
                  link: "https://razorpay.com/privacy/",
                },
                {
                  name: "Cloudinary Inc.",
                  purpose:
                    "Cloud-based image and video storage and delivery (CDN). Media files are stored on Cloudinary servers. Governed by Cloudinary's Privacy Policy.",
                  link: "https://cloudinary.com/privacy",
                },
                {
                  name: "Communication Service Providers",
                  purpose:
                    "SMS/email/WhatsApp gateway providers for sending transactional notifications only. No marketing use without explicit consent.",
                  link: null,
                },
                {
                  name: "Legal & Regulatory Authorities",
                  purpose:
                    "We may disclose information to government authorities when required by law, court order, or to enforce our terms.",
                  link: null,
                },
              ].map((tp, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p className="font-semibold text-white text-sm mb-1">
                    {tp.name}
                  </p>
                  <p className="text-sm text-[#a0a0b0]">{tp.purpose}</p>
                  {tp.link && (
                    <a
                      href={tp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-400 hover:text-red-300 mt-1 inline-block"
                    >
                      View their privacy policy →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your personal data for as long as your account is active or
              as needed to provide services. Specific retention periods:
            </p>
            <BulletList
              items={[
                "Account data: retained for the duration of your account plus 2 years after deletion",
                "Payment records: retained for 8 years as required by Indian financial regulations",
                "Usage logs: retained for 12 months and then anonymised",
                "Support communications: retained for 3 years",
              ]}
            />
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement industry-standard security measures to protect your
              personal data:
            </p>
            <BulletList
              items={[
                "HTTPS/TLS encryption for all data in transit",
                "AES-256 encryption for sensitive data at rest",
                "Payment card data is never stored on GWD servers — fully delegated to Razorpay's PCI-DSS Level 1 infrastructure",
                "Role-based access controls ensuring only authorised personnel can access personal data",
                "Regular security audits and vulnerability assessments",
                "Multi-factor authentication available for admin accounts",
              ]}
            />
          </Section>

          <Section title="7. Your Rights Under Indian IT Act 2000">
            <p>
              Under the Information Technology Act, 2000 and the Information
              Technology (Reasonable Security Practices and Procedures and Sensitive
              Personal Data or Information) Rules, 2011, you have the following
              rights:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  right: "Right to Access",
                  desc: "Request a copy of your personal data we hold",
                },
                {
                  right: "Right to Correction",
                  desc: "Request correction of inaccurate or incomplete data",
                },
                {
                  right: "Right to Withdrawal of Consent",
                  desc: "Withdraw consent for data processing at any time",
                },
                {
                  right: "Right to Grievance Redressal",
                  desc: "Lodge a complaint with our Grievance Officer within 30 days",
                },
              ].map((r, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(220,38,38,0.04)",
                    border: "1px solid rgba(220,38,38,0.12)",
                  }}
                >
                  <p className="text-sm font-semibold text-red-400 mb-1">
                    {r.right}
                  </p>
                  <p className="text-sm text-[#a0a0b0]">{r.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              To exercise any of these rights, please write to us at{" "}
              <a
                href="mailto:privacy@gwd.in"
                className="text-red-400 hover:text-red-300"
              >
                privacy@gwd.in
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="8. Cookies & Tracking">
            <p>
              We use cookies and similar tracking technologies to enhance your
              experience:
            </p>
            <BulletList
              items={[
                "Essential cookies: required for platform functionality (login sessions, security tokens)",
                "Analytics cookies: anonymised data to understand usage patterns (can be opted out)",
                "You may control cookies via your browser settings — note that disabling essential cookies will affect platform functionality",
              ]}
            />
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              Our platform is used to manage sports academies which may include
              students under 18 years of age. For minors:
            </p>
            <BulletList
              items={[
                "Account registration for minors requires parent/guardian consent",
                "Parents or guardians may request access to or deletion of their child's data",
                "We do not knowingly collect personal data from children under 13 without parental consent",
              ]}
            />
          </Section>

          <Section title="10. Changes to this Policy">
            <p>
              We may update this Privacy Policy periodically. When we make material
              changes, we will notify you via email or a prominent notice on our
              platform at least 7 days before the changes take effect. Continued use
              of the platform after changes constitutes acceptance of the revised
              policy.
            </p>
          </Section>

          <Section title="11. Grievance Officer">
            <p>
              As required under the IT Act 2000, we have appointed a Grievance
              Officer to address your concerns:
            </p>
            <div
              className="mt-4 p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-white font-semibold">GWD Sports Ecosystem Pvt. Ltd.</p>
              <p className="text-[#a0a0b0] text-sm mt-2">
                Grievance Officer — Privacy & Data Protection
              </p>
              <p className="text-[#a0a0b0] text-sm mt-1">
                Hyderabad, Telangana, India
              </p>
              <a
                href="mailto:privacy@gwd.in"
                className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block"
              >
                privacy@gwd.in
              </a>
              <p className="text-[#666] text-xs mt-3">
                Response time: Within 30 days of receiving your grievance
              </p>
            </div>
          </Section>

          {/* Footer nav */}
          <div
            className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Link
              href="/"
              className="text-sm text-[#a0a0b0] hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
            <div className="flex gap-6">
              <Link
                href="/terms-and-conditions"
                className="text-sm text-[#a0a0b0] hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/refund-policy"
                className="text-sm text-[#a0a0b0] hover:text-white transition-colors"
              >
                Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
