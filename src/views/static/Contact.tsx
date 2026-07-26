"use client";

import { useState } from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────
   Contact Us — GWD Sports Ecosystem
───────────────────────────────────────────── */

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const initialForm: FormState = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

function ContactInfoCard({
  icon,
  title,
  lines,
  href,
}: {
  icon: string;
  title: string;
  lines: string[];
  href?: string;
}) {
  return (
    <div
      className="p-5 rounded-2xl flex gap-4 items-start"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: "rgba(220,38,38,0.1)" }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white mb-1">{title}</p>
        {lines.map((line, i) =>
          href && i === 0 ? (
            <a
              key={i}
              href={href}
              className="text-sm text-red-400 hover:text-red-300 transition-colors block"
            >
              {line}
            </a>
          ) : (
            <p key={i} className="text-sm text-[#a0a0b0]">
              {line}
            </p>
          )
        )}
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    // Simulate API call — replace with actual endpoint
    try {
      await new Promise((res) => setTimeout(res, 1200));
      setStatus("success");
      setForm(initialForm);
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#555566] outline-none transition-all";
  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const subjects = [
    "General Enquiry",
    "Academy Onboarding",
    "Fee / Payment Issue",
    "Refund Request",
    "Technical Support",
    "Partnership / Business",
    "Other",
  ];

  return (
    <>
      <style>{`
        .contact-input:focus {
          border-color: rgba(220,38,38,0.4) !important;
          background: rgba(255,255,255,0.06) !important;
          box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
        }
        .contact-input::placeholder { color: #555566; }
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
              "linear-gradient(135deg, #0a0a0e 0%, #12121a 70%, #1a0a0a 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute top-0 right-0 w-96 h-96 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, #dc2626 0%, transparent 70%)",
                transform: "translate(30%, -30%)",
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-64 h-64 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, #dc2626 0%, transparent 70%)",
                transform: "translate(-30%, 30%)",
              }}
            />
          </div>
          <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-20">
            <div className="flex items-center gap-2 mb-6">
              <Link
                href="/"
                className="text-sm text-[#a0a0b0] hover:text-white transition-colors"
              >
                Home
              </Link>
              <span className="text-[#444] text-sm">/</span>
              <span className="text-sm text-white/60">Contact Us</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-1 h-10 rounded-full"
                style={{
                  background: "linear-gradient(180deg, #dc2626, #991b1b)",
                }}
              />
              <h1
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                className="text-4xl md:text-5xl font-bold"
              >
                Contact Us
              </h1>
            </div>
            <p className="text-[#a0a0b0] mt-4 max-w-xl">
              Have a question, feedback, or need help? Our team is here for you.
              Reach out and we&apos;ll respond within 24 business hours.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* ── Left: Contact Info ── */}
            <div className="lg:col-span-2 space-y-4">
              <h2
                style={{ fontFamily: "'DM Sans', sans-serif" }}
                className="text-2xl font-bold text-white mb-6"
              >
                Get in Touch
              </h2>

              <ContactInfoCard
                icon="✉️"
                title="Email Support"
                lines={["support@gwd.in"]}
                href="mailto:support@gwd.in"
              />
              <ContactInfoCard
                icon="📞"
                title="Phone"
                lines={["+91 040-XXXX-XXXX", "Mon–Sat, 9AM–6PM IST"]}
                href="tel:+91040XXXXXXXX"
              />
              <ContactInfoCard
                icon="📍"
                title="Office Address"
                lines={[
                  "GWD Sports Ecosystem",
                  "Hyderabad, Telangana",
                  "India — 500 XXX",
                ]}
              />
              <ContactInfoCard
                icon="🕘"
                title="Operating Hours"
                lines={[
                  "Monday – Saturday",
                  "9:00 AM – 6:00 PM IST",
                  "Closed on Sundays & National Holidays",
                ]}
              />

              {/* Legal quick links */}
              <div
                className="p-5 rounded-2xl mt-6"
                style={{
                  background: "rgba(220,38,38,0.05)",
                  border: "1px solid rgba(220,38,38,0.12)",
                }}
              >
                <p className="text-sm font-semibold text-white mb-3">
                  Legal & Policy Enquiries
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#666]">Privacy:</span>
                    <a
                      href="mailto:privacy@gwd.in"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      privacy@gwd.in
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#666]">Legal:</span>
                    <a
                      href="mailto:legal@gwd.in"
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      legal@gwd.in
                    </a>
                  </div>
                </div>
              </div>

              {/* Map placeholder */}
              <div
                className="rounded-2xl overflow-hidden mt-2"
                style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  height: "160px",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <span className="text-3xl">🗺️</span>
                <p className="text-xs text-[#555566]">
                  Hyderabad, Telangana, India
                </p>
                <a
                  href="https://maps.google.com/?q=Hyderabad,Telangana,India"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>

            {/* ── Right: Contact Form ── */}
            <div className="lg:col-span-3">
              <div
                className="p-6 md:p-8 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <h2
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                  className="text-2xl font-bold text-white mb-6"
                >
                  Send Us a Message
                </h2>

                {/* Success state */}
                {status === "success" && (
                  <div
                    className="p-5 rounded-xl mb-6 flex items-start gap-3"
                    style={{
                      background: "rgba(22,163,74,0.08)",
                      border: "1px solid rgba(22,163,74,0.2)",
                    }}
                  >
                    <span className="text-green-400 text-lg">✅</span>
                    <div>
                      <p className="text-sm font-semibold text-green-400 mb-1">
                        Message Sent Successfully!
                      </p>
                      <p className="text-sm text-[#a0a0b0]">
                        Thank you for reaching out. Our support team will get
                        back to you within 24 business hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error state */}
                {status === "error" && (
                  <div
                    className="p-5 rounded-xl mb-6 flex items-start gap-3"
                    style={{
                      background: "rgba(220,38,38,0.08)",
                      border: "1px solid rgba(220,38,38,0.2)",
                    }}
                  >
                    <span className="text-red-400 text-lg">❌</span>
                    <div>
                      <p className="text-sm font-semibold text-red-400 mb-1">
                        Submission Failed
                      </p>
                      <p className="text-sm text-[#a0a0b0]">
                        Something went wrong. Please try again or email us at{" "}
                        <a
                          href="mailto:support@gwd.in"
                          className="text-red-400"
                        >
                          support@gwd.in
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#888899] mb-2 font-medium uppercase tracking-wider">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Arjun Sharma"
                        className={`${inputClass} contact-input`}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#888899] mb-2 font-medium uppercase tracking-wider">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="arjun@example.com"
                        className={`${inputClass} contact-input`}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-xs text-[#888899] mb-2 font-medium uppercase tracking-wider">
                      Subject *
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className={`${inputClass} contact-input cursor-pointer`}
                      style={{
                        ...inputStyle,
                        color: form.subject ? "#ffffff" : "#555566",
                      }}
                    >
                      <option value="" disabled>
                        Select a subject
                      </option>
                      {subjects.map((s) => (
                        <option
                          key={s}
                          value={s}
                          style={{ background: "#12121a", color: "#ffffff" }}
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs text-[#888899] mb-2 font-medium uppercase tracking-wider">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Tell us how we can help you..."
                      className={`${inputClass} contact-input resize-none`}
                      style={inputStyle}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, #dc2626, #991b1b)",
                      boxShadow: "0 4px 24px rgba(220,38,38,0.25)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.opacity = "0.9")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {status === "submitting" ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      "Send Message →"
                    )}
                  </button>

                  <p className="text-xs text-center text-[#444455] mt-2">
                    By submitting this form you agree to our{" "}
                    <Link
                      href="/privacy-policy"
                      className="text-[#666677] hover:text-[#a0a0b0] transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
