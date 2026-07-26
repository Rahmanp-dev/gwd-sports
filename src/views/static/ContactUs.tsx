'use client';

import { useState } from 'react';

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Mailto fallback (replace with backend endpoint when available)
    const mailto = `mailto:rahman@gwdglobal.in?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailto;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#050508]">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <p className="text-[#FF1744] text-xs tracking-[0.2em] uppercase font-medium mb-4">GWD Sports Ecosystem</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Contact Us
          </h1>
          <p className="text-[#888899] text-sm">We&apos;re here to help. Reach out anytime.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12">
        {/* Contact Info Cards */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>Get in Touch</h2>

          {[
            { label: 'Email', value: 'rahman@gwdglobal.in', icon: '✉', href: 'mailto:rahman@gwdglobal.in' },
            { label: 'Phone', value: '+91 79813 74451', icon: '📞', href: 'tel:+917981374451' },
            { label: 'Address', value: 'Hyderabad, Telangana, India', icon: '📍', href: null },
            { label: 'Operating Hours', value: 'Mon–Sat · 9AM–6PM IST', icon: '🕐', href: null },
          ].map(({ label, value, icon, href }) => (
            <div key={label} className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-1">{label}</p>
                {href ? (
                  <a href={href} className="text-white text-sm font-medium hover:text-[#FF1744] transition-colors">
                    {value}
                  </a>
                ) : (
                  <p className="text-white text-sm font-medium">{value}</p>
                )}
              </div>
            </div>
          ))}

          {/* Map Placeholder */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl h-48 flex items-center justify-center text-[#333] text-sm">
            📍 Hyderabad, Telangana
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>Send a Message</h2>

          {submitted ? (
            <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-8 text-center">
              <p className="text-emerald-400 text-4xl mb-3">✓</p>
              <p className="text-white font-semibold mb-1">Message sent!</p>
              <p className="text-[#888899] text-sm">We&apos;ll get back to you within 2 business days.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#888899] text-xs uppercase tracking-wider mb-1.5">Your Name</label>
                <input
                  name="name" value={form.name} onChange={handleChange} required
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#FF1744]/50 transition-colors"
                  placeholder="Rahul Sharma"
                />
              </div>
              <div>
                <label className="block text-[#888899] text-xs uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  name="email" value={form.email} onChange={handleChange} required type="email"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#FF1744]/50 transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-[#888899] text-xs uppercase tracking-wider mb-1.5">Subject</label>
                <select
                  name="subject" value={form.subject} onChange={handleChange} required
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#FF1744]/50 transition-colors"
                >
                  <option value="" className="bg-[#111]">Select a topic</option>
                  <option value="Academy Onboarding" className="bg-[#111]">Academy Onboarding</option>
                  <option value="Payment Issue" className="bg-[#111]">Payment Issue</option>
                  <option value="Technical Support" className="bg-[#111]">Technical Support</option>
                  <option value="Refund Request" className="bg-[#111]">Refund Request</option>
                  <option value="Partnership" className="bg-[#111]">Partnership</option>
                  <option value="Other" className="bg-[#111]">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[#888899] text-xs uppercase tracking-wider mb-1.5">Message</label>
                <textarea
                  name="message" value={form.message} onChange={handleChange} required rows={5}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-[#444] text-sm focus:outline-none focus:border-[#FF1744]/50 transition-colors resize-none"
                  placeholder="Tell us how we can help..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#FF1744] hover:bg-[#e00c34] text-white font-semibold rounded-xl py-3 text-sm transition-colors duration-200"
              >
                Send Message →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
