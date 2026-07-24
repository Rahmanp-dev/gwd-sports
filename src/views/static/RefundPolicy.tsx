"use client";

import Link from "next/link";

/* ─────────────────────────────────────────────
   Shared Components
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
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
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
   Refund Policy Table Data
───────────────────────────────────────────── */
const refundPolicies = [
  {
    icon: "📅",
    type: "Monthly Academy Fees",
    eligibility: "Within 7 days of payment",
    condition:
      "No sessions attended during the billing period",
    amount: "100% of fee paid",
    color: "#16a34a",
    timeline: "5–7 business days",
  },
  {
    icon: "📆",
    type: "Quarterly Fee Plans",
    eligibility: "Within 30 days of payment",
    condition:
      "Pro-rated for unused months; attended sessions deducted at monthly rate",
    amount: "Pro-rated (unused months only)",
    color: "#ca8a04",
    timeline: "5–7 business days",
  },
  {
    icon: "🗓️",
    type: "Annual / Yearly Plans",
    eligibility: "Within 30 days of payment",
    condition:
      "Pro-rated for unused months; processing fee of ₹100 applies",
    amount: "Pro-rated (unused months only)",
    color: "#2563eb",
    timeline: "7–10 business days",
  },
  {
    icon: "🏆",
    type: "Event Registration Fees",
    eligibility: "Refundable 48+ hours before event",
    condition:
      "No refund within 48 hours of event. Full refund if GWD/academy cancels.",
    amount: "100% if eligible",
    color: "#7c3aed",
    timeline: "5–7 business days",
  },
  {
    icon: "👕",
    type: "Kit & Equipment Purchases",
    eligibility: "No refund after dispatch",
    condition:
      "Exchanges for manufacturing defects within 7 days of receipt, in original packaging",
    amount: "Not applicable after dispatch",
    color: "#dc2626",
    timeline: "Exchange only",
  },
];

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function RefundPolicyPage() {
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
              "linear-gradient(135deg, #0a0a0e 0%, #0a1220 60%, #12120a 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, #2563eb 0%, transparent 70%)",
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
              <span className="text-sm text-white/60">Refund Policy</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-1 h-10 rounded-full"
                style={{
                  background: "linear-gradient(180deg, #2563eb, #1d4ed8)",
                }}
              />
              <h1
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-4xl md:text-5xl font-bold"
              >
                Refund & Cancellation Policy
              </h1>
            </div>
            <p className="text-[#a0a0b0] mt-4 max-w-2xl">
              We want you to be fully satisfied with GWD Sports platform. This
              policy outlines our refund and cancellation procedures in compliance
              with Razorpay payment gateway requirements and Indian consumer
              protection laws.
            </p>
            <div className="flex items-center gap-6 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">7 days</p>
                <p className="text-xs text-[#666] mt-1">Monthly refund window</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">5–7 days</p>
                <p className="text-xs text-[#666] mt-1">Processing time</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">30 days</p>
                <p className="text-xs text-[#666] mt-1">
                  Quarterly/annual window
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-[#666]">
              Last Updated:{" "}
              <span className="text-[#a0a0b0]">July 2026</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Razorpay notice */}
          <div
            className="flex items-start gap-4 p-5 rounded-xl mb-10"
            style={{
              background: "rgba(37,99,235,0.06)",
              border: "1px solid rgba(37,99,235,0.2)",
            }}
          >
            <div className="text-blue-400 text-xl mt-0.5">💳</div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">
                Payments Powered by Razorpay
              </p>
              <p className="text-sm text-[#a0a0b0]">
                All payment transactions on GWD Sports are processed through
                Razorpay Software Pvt. Ltd. — a PCI-DSS Level 1 certified payment
                gateway licensed by the RBI. Refunds are credited back to your
                original payment method via Razorpay&apos;s refund infrastructure.
              </p>
            </div>
          </div>

          <Section title="1. Refund Eligibility at a Glance">
            <p>
              The following summarises refund eligibility across different payment
              types on the GWD Sports platform:
            </p>
            <div className="mt-6 space-y-4">
              {refundPolicies.map((policy, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden"
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderLeft: `4px solid ${policy.color}`,
                  }}
                >
                  <div
                    className="px-5 py-4"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">{policy.icon}</span>
                      <h3
                        className="font-semibold"
                        style={{ color: policy.color }}
                      >
                        {policy.type}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      <div>
                        <p className="text-xs text-[#666] uppercase tracking-wider mb-1">
                          Eligibility
                        </p>
                        <p className="text-sm text-white">
                          {policy.eligibility}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#666] uppercase tracking-wider mb-1">
                          Refund Amount
                        </p>
                        <p className="text-sm text-white">{policy.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#666] uppercase tracking-wider mb-1">
                          Processing Time
                        </p>
                        <p className="text-sm text-white">{policy.timeline}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#666] mt-3">
                      <span className="text-[#a0a0b0]">Condition: </span>
                      {policy.condition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="2. How to Request a Refund">
            <p>
              You can request a refund through any of the following channels:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="p-5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📧</span>
                  <h3 className="font-semibold text-white">Via Email</h3>
                </div>
                <p className="text-sm text-[#a0a0b0] mb-3">
                  Send a refund request email to our support team with:
                </p>
                <ul className="text-sm text-[#a0a0b0] space-y-1">
                  <li>• Your registered name & phone number</li>
                  <li>• Transaction ID / Receipt number</li>
                  <li>• Reason for refund request</li>
                  <li>• Payment method used</li>
                </ul>
                <a
                  href="mailto:support@gwd.in"
                  className="mt-4 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
                >
                  support@gwd.in →
                </a>
              </div>

              <div
                className="p-5 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📱</span>
                  <h3 className="font-semibold text-white">
                    Via Student Dashboard
                  </h3>
                </div>
                <p className="text-sm text-[#a0a0b0] mb-3">
                  Log in to your GWD Sports account and navigate to:
                </p>
                <div
                  className="p-3 rounded-lg font-mono text-xs text-[#a0a0b0]"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                >
                  Dashboard → Payments → Transaction History → Request Refund
                </div>
                <p className="text-xs text-[#666] mt-3">
                  Online requests are acknowledged within 24 business hours.
                </p>
              </div>
            </div>
          </Section>

          <Section title="3. Refund Processing Timeline">
            <p>
              Once your refund request is approved, the amount will be credited as
              follows:
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  action: "Refund Request Received",
                  time: "Immediate (email auto-acknowledgment)",
                },
                {
                  action: "Eligibility Review by GWD Team",
                  time: "1–2 business days",
                },
                {
                  action: "Refund Initiated via Razorpay",
                  time: "2–3 business days after approval",
                },
                {
                  action: "Credit to Original Payment Method",
                  time: "3–5 business days (bank processing)",
                },
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "rgba(37,99,235,0.2)",
                      color: "#60a5fa",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className="text-sm font-semibold text-white">
                        {s.action}
                      </p>
                      <p className="text-xs text-blue-400">{s.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="mt-5 p-4 rounded-xl"
              style={{
                background: "rgba(202,138,4,0.06)",
                border: "1px solid rgba(202,138,4,0.2)",
              }}
            >
              <p className="text-sm text-[#a0a0b0]">
                <span className="text-yellow-400 font-semibold">⚠️ Note: </span>
                Refund timelines may vary — UPI transactions typically credit in
                1–3 business days, while card/netbanking may take 3–7 business
                days. Actual credit dates depend on your bank&apos;s processing
                speed.
              </p>
            </div>
          </Section>

          <Section title="4. AutoPay / Subscription Cancellation">
            <p>
              If you are enrolled in an AutoPay (UPI Mandate / eMandate) subscription plan:
            </p>
            <BulletList
              items={[
                "You can cancel your AutoPay subscription at any time from your student dashboard under Settings → Subscriptions",
                "Cancellations take effect at the end of the current billing cycle — you will not be charged for the next cycle",
                "Refunds on cancelled subscriptions follow the same Monthly/Quarterly/Annual plan policy above",
                "GWD is not liable for charges auto-debited before a cancellation request is submitted",
              ]}
            />
          </Section>

          <Section title="5. Non-Refundable Situations">
            <p>
              Refunds will not be processed in the following circumstances:
            </p>
            <BulletList
              items={[
                "Request made after the eligible refund window (7 days for monthly, 30 days for quarterly/annual)",
                "Sessions/training have already been attended (attended sessions deducted at monthly rate for pro-rata calculations)",
                "Kit or equipment has been dispatched for delivery",
                "Refund request for subjective performance dissatisfaction — training quality disputes must be raised directly with the academy",
                "Account terminated for violation of Terms & Conditions",
                "Payment made as a non-refundable deposit or booking fee, as stated at time of payment",
              ]}
            />
          </Section>

          <Section title="6. Academy-Cancelled Programs">
            <p>
              If an academy cancels a program or batch after enrollment:
            </p>
            <BulletList
              items={[
                "Enrolled students are entitled to a full refund for the unused period",
                "GWD will facilitate such refunds within 7 business days of the academy-initiated cancellation",
                "Students will be notified via registered email and SMS",
              ]}
            />
          </Section>

          <Section title="7. Contact for Refund Queries">
            <div
              className="p-5 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-white font-semibold">
                GWD Sports Ecosystem — Support Team
              </p>
              <p className="text-[#a0a0b0] text-sm mt-2">
                For all refund and payment queries:
              </p>
              <a
                href="mailto:support@gwd.in"
                className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
              >
                support@gwd.in
              </a>
              <p className="text-[#a0a0b0] text-sm mt-2">
                Phone: +91 040-XXXX-XXXX
              </p>
              <p className="text-[#a0a0b0] text-sm">
                Address: GWD Sports Ecosystem, Hyderabad, Telangana, India
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-[#666]">Operating Hours</p>
                <p className="text-sm text-[#a0a0b0] mt-1">
                  Monday to Saturday, 9:00 AM – 6:00 PM IST
                </p>
                <p className="text-xs text-[#666] mt-2">
                  Response SLA: Within 24 business hours for refund queries
                </p>
              </div>
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
                href="/terms-and-conditions"
                className="text-sm text-[#a0a0b0] hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
