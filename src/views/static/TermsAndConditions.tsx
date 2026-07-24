"use client";

import Link from "next/link";

/* ─────────────────────────────────────────────
   Shared Section Component
───────────────────────────────────────────── */
function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-start gap-4 mb-3">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, #dc2626, #991b1b)" }}
        >
          {number}
        </div>
        <h2
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          className="text-xl font-bold text-white pb-2 border-b border-white/10 flex-1"
        >
          {title}
        </h2>
      </div>
      <div className="pl-12 text-[#a0a0b0] leading-relaxed space-y-3">
        {children}
      </div>
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

function InfoBox({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-4 rounded-xl mt-4"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {title && (
        <p className="text-sm font-semibold text-white mb-2">{title}</p>
      )}
      <div className="text-sm text-[#a0a0b0]">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function TermsAndConditionsPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
      `}</style>

      <div
        className="min-h-screen"
        style={{
          background: "#0a0a0e",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: "#ffffff",
        }}
      >
        {/* Hero Header */}
        <div
          className="relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #0a0a0e 0%, #12121a 60%, #0a1210 100%)",
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
              <span className="text-sm text-white/60">Terms & Conditions</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-1 h-10 rounded-full"
                style={{ background: "linear-gradient(180deg, #dc2626, #991b1b)" }}
              />
              <h1
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-4xl md:text-5xl font-bold"
              >
                Terms & Conditions
              </h1>
            </div>
            <p className="text-[#a0a0b0] mt-4 max-w-2xl">
              These Terms and Conditions govern your use of the GWD Sports Ecosystem
              platform. By accessing or using our services, you agree to be legally
              bound by these terms. Please read them carefully.
            </p>
            <p className="mt-4 text-sm text-[#666]">
              Last Updated: <span className="text-[#a0a0b0]">July 2026</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Alert */}
          <div
            className="flex items-start gap-4 p-5 rounded-xl mb-10"
            style={{
              background: "rgba(220,38,38,0.06)",
              border: "1px solid rgba(220,38,38,0.15)",
            }}
          >
            <div className="text-red-500 text-xl mt-0.5">⚖️</div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">
                Legally Binding Agreement
              </p>
              <p className="text-sm text-[#a0a0b0]">
                By creating an account or using the GWD Sports Platform, you
                confirm that you have read, understood, and agree to these Terms &
                Conditions. If you disagree with any part, please discontinue use
                of the platform.
              </p>
            </div>
          </div>

          <Section number="1" title="Acceptance of Terms">
            <p>
              These Terms & Conditions (&quot;Terms&quot;) constitute a legally
              binding agreement between you (&quot;User&quot;, &quot;Academy
              Admin&quot;, &quot;Student&quot;, or &quot;Parent&quot;) and GWD
              Sports Ecosystem Pvt. Ltd. (&quot;GWD&quot;, &quot;we&quot;,
              &quot;us&quot;).
            </p>
            <p>
              Access to the platform is conditional upon acceptance of these Terms.
              Continued use of the platform constitutes ongoing acceptance of any
              updated Terms.
            </p>
          </Section>

          <Section number="2" title="Platform Usage Terms">
            <p>The GWD Sports platform is a SaaS solution designed for:</p>
            <BulletList
              items={[
                "Sports academy management (attendance, scheduling, fee management)",
                "Student enrollment and program management",
                "Payment processing for academy fees and events",
                "Communication between academy staff, students, and parents",
                "Performance tracking and sports analytics",
              ]}
            />
            <p className="mt-3">
              You agree to use the platform only for lawful purposes and in
              accordance with these Terms. You may not:
            </p>
            <BulletList
              items={[
                "Use the platform to engage in any fraudulent, illegal, or unauthorized activity",
                "Attempt to gain unauthorized access to other accounts or platform systems",
                "Upload malicious code, viruses, or any harmful software",
                "Scrape, crawl, or systematically extract data from the platform without written permission",
                "Misrepresent your identity or affiliation with any academy",
                "Use the platform to send unsolicited commercial communications (spam)",
              ]}
            />
          </Section>

          <Section number="3" title="Academy Administrator Responsibilities">
            <p>
              If you register as an Academy Administrator, you have additional
              responsibilities:
            </p>
            <BulletList
              items={[
                "You are responsible for the accuracy of all academy information entered on the platform",
                "You must obtain appropriate consents from students and parents before registering their data",
                "You are responsible for ensuring all staff members under your account comply with these Terms",
                "You must promptly notify GWD of any unauthorized access to your academy account",
                "You are responsible for maintaining the confidentiality of your admin login credentials",
                "You may not transfer or sublicense your academy account to any third party without GWD's written consent",
                "You must ensure your academy operates in compliance with applicable Indian sports regulations and local laws",
                "You are responsible for setting accurate fee structures and refund policies that comply with these Terms",
              ]}
            />
          </Section>

          <Section number="4" title="Student & Parent Responsibilities">
            <BulletList
              items={[
                "Students and parents must provide accurate personal information during registration",
                "Parents/guardians must provide consent for minor students (under 18 years) to use the platform",
                "You are responsible for maintaining the confidentiality of your login credentials",
                "Students and parents must comply with the specific rules and policies set by their enrolled academy",
                "Any disputes regarding training, coaching, or academy operations should be raised directly with the academy administration",
                "GWD is not responsible for the quality of coaching or training services provided by individual academies",
              ]}
            />
          </Section>

          <Section number="5" title="Payment Terms">
            <p>
              All payment transactions on the GWD Sports platform are processed
              through{" "}
              <strong className="text-white">Razorpay Software Pvt. Ltd.</strong>,
              a PCI-DSS compliant payment gateway licensed by the Reserve Bank of
              India (RBI).
            </p>
            <InfoBox title="Payment Methods Accepted">
              <ul className="space-y-1">
                <li>• UPI (Google Pay, PhonePe, Paytm, BHIM)</li>
                <li>• Credit & Debit Cards (Visa, Mastercard, RuPay)</li>
                <li>• Net Banking (major Indian banks)</li>
                <li>• EMI options (subject to bank eligibility)</li>
              </ul>
            </InfoBox>
            <BulletList
              items={[
                "All fees are quoted and charged in Indian Rupees (INR)",
                "Payment is due as per the fee schedule set by your enrolled academy",
                "A payment confirmation will be sent to your registered email and phone number",
                "Late payment fees, if applicable, are set by the individual academy",
                "GWD charges a platform fee which may be included in the stated fee amount",
                "Any chargebacks or disputed transactions will be investigated in accordance with Razorpay's dispute resolution process",
              ]}
            />
          </Section>

          <Section number="6" title="Refund Policy">
            <p>
              Our standard refund policy is as follows (individual academy policies
              may be stricter):
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  type: "Monthly Fee Payments",
                  policy:
                    "Eligible for full refund if requested within 7 days of payment, provided no sessions have been attended.",
                  color: "#16a34a",
                  icon: "📅",
                },
                {
                  type: "Quarterly / Annual Fee Payments",
                  policy:
                    "Pro-rated refund for unused months, if refund is requested within 30 days of payment. Processing fee of ₹50 may be deducted.",
                  color: "#ca8a04",
                  icon: "📆",
                },
                {
                  type: "Event Registration Fees",
                  policy:
                    "No refund within 48 hours of the event. Full refund if the event is cancelled by GWD or the academy.",
                  color: "#dc2626",
                  icon: "🏆",
                },
                {
                  type: "Kit / Equipment Payments",
                  policy:
                    "No refund after dispatch. Exchanges allowed within 7 days for defective items.",
                  color: "#7c3aed",
                  icon: "👕",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl flex gap-4 items-start"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderLeft: `3px solid ${item.color}`,
                  }}
                >
                  <div className="text-xl flex-shrink-0">{item.icon}</div>
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: item.color }}
                    >
                      {item.type}
                    </p>
                    <p className="text-sm text-[#a0a0b0]">{item.policy}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4">
              Refunds are processed within{" "}
              <strong className="text-white">5–7 business days</strong> to the
              original payment method. For refund requests, email{" "}
              <a
                href="mailto:support@gwd.in"
                className="text-red-400 hover:text-red-300"
              >
                support@gwd.in
              </a>{" "}
              or submit a request via the Student Dashboard.
            </p>
          </Section>

          <Section number="7" title="Intellectual Property">
            <p>
              All content on the GWD Sports platform — including but not limited to
              software, UI designs, logos, text, graphics, and data structures — is
              the exclusive intellectual property of GWD Sports Ecosystem Pvt. Ltd.
              and is protected under Indian and international copyright laws.
            </p>
            <BulletList
              items={[
                "You may not reproduce, distribute, or create derivative works without written permission",
                "Academy-specific content (logos, schedules, curricula) remains the property of the respective academy",
                "User-generated content (profile photos, uploaded documents) remains your property but you grant GWD a license to display it on the platform",
              ]}
            />
          </Section>

          <Section number="8" title="Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable Indian law, GWD Sports
              Ecosystem Pvt. Ltd. shall not be liable for:
            </p>
            <BulletList
              items={[
                "Any indirect, incidental, special, consequential, or punitive damages",
                "Loss of revenue, data, goodwill, or other intangible losses",
                "Damages arising from unauthorized access to your account due to your failure to maintain credential confidentiality",
                "The quality, safety, or legality of services provided by individual academies on our platform",
                "Personal injury or property damage arising from physical sports training activities",
                "Service interruptions due to force majeure events, government actions, or third-party provider outages",
              ]}
            />
            <InfoBox>
              Our total aggregate liability shall not exceed the amount paid by you
              to GWD in the 3 months preceding the claim.
            </InfoBox>
          </Section>

          <Section number="9" title="Account Suspension & Termination">
            <p>
              GWD reserves the right to suspend or terminate your account, with or
              without notice, if you:
            </p>
            <BulletList
              items={[
                "Violate any provision of these Terms",
                "Engage in fraudulent activity or provide false information",
                "Fail to pay outstanding fees",
                "Engage in behaviour that is harmful to other users or the platform",
              ]}
            />
            <p className="mt-3">
              Academy accounts may also be terminated for non-renewal of
              subscription or violation of data protection obligations.
            </p>
          </Section>

          <Section number="10" title="Dispute Resolution">
            <p>
              In the event of any dispute arising from these Terms or use of the
              platform:
            </p>
            <BulletList
              items={[
                "Both parties shall first attempt to resolve the dispute through good-faith negotiation",
                "If unresolved within 30 days, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996",
                "The arbitration shall be conducted in English and shall be held in Hyderabad, Telangana",
                "The arbitration award shall be final and binding on both parties",
              ]}
            />
          </Section>

          <Section number="11" title="Governing Law & Jurisdiction">
            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(220,38,38,0.05)",
                border: "1px solid rgba(220,38,38,0.12)",
              }}
            >
              <p>
                These Terms shall be governed by and construed in accordance with
                the laws of{" "}
                <strong className="text-white">India</strong>. Any legal proceedings
                arising from or related to these Terms shall be subject to the
                exclusive jurisdiction of the courts located in{" "}
                <strong className="text-white">
                  Hyderabad, Telangana, India
                </strong>
                .
              </p>
              <p className="mt-3">
                Applicable legislation includes but is not limited to: the
                Information Technology Act 2000, the Consumer Protection Act 2019,
                and the Contract Act 1872.
              </p>
            </div>
          </Section>

          <Section number="12" title="Contact for Legal Enquiries">
            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-white font-semibold">
                GWD Sports Ecosystem Pvt. Ltd.
              </p>
              <p className="text-[#a0a0b0] text-sm mt-2">Legal Department</p>
              <p className="text-[#a0a0b0] text-sm">
                Hyderabad, Telangana, India
              </p>
              <a
                href="mailto:legal@gwd.in"
                className="text-red-400 hover:text-red-300 text-sm mt-2 inline-block"
              >
                legal@gwd.in
              </a>
              <p className="text-[#666] text-xs mt-3">
                Response time: Within 10 business days
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
                href="/privacy-policy"
                className="text-sm text-[#a0a0b0] hover:text-white transition-colors"
              >
                Privacy Policy
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
