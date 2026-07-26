"use client";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Globe,
} from "lucide-react";
import { BRAND_NAME } from "@/utils/constants";
import { Link } from "@/lib/router-shim";

export default function Footer({ academy }: { academy?: any }) {
  const theme = academy?.theme ?? {};
  const footerTheme = theme?.footer ?? {};

  const brandName = academy?.name || BRAND_NAME;
  const brandFirstPart = brandName.split(" ")[0] || brandName;
  const brandSecondPart = brandName.split(" ").slice(1).join(" ") || "";

  // Contact info resolution: theme.footer > academy.contactInfo > fallbacks
  const phone = footerTheme.phone || academy?.contactInfo?.phone || "+91 91235-56789";
  const email = footerTheme.email || academy?.contactInfo?.email || `hello@${brandName.toLowerCase().replace(/\s+/g, "")}.com`;
  const location = footerTheme.address || academy?.location || "Hyderabad";

  const facebookUrl = footerTheme.facebookUrl || "";
  const instagramUrl = footerTheme.instagramUrl || "";
  const twitterUrl = footerTheme.twitterUrl || "";
  const youtubeUrl = footerTheme.youtubeUrl || "";

  const socialLinks = [
    { icon: Facebook, label: "Facebook", href: facebookUrl },
    { icon: Instagram, label: "Instagram", href: instagramUrl },
    { icon: Twitter, label: "Twitter/X", href: twitterUrl },
    { icon: Youtube, label: "YouTube", href: youtubeUrl },
  ].filter((s) => Boolean(s.href));

  // Fallback social icons if owner hasn't specified custom links yet
  const defaultSocials = [
    { icon: Facebook, label: "Facebook", href: "#" },
    { icon: Instagram, label: "Instagram", href: "#" },
    { icon: Twitter, label: "Twitter", href: "#" },
    { icon: Youtube, label: "YouTube", href: "#" },
  ];

  const activeSocials = socialLinks.length > 0 ? socialLinks : defaultSocials;

  const footerSports: string[] = (
    theme?.programs?.length
      ? theme.programs.map((p: any) => p.label)
      : (academy?.sports ?? [])
  )
    .filter(Boolean)
    .map((s: string) => String(s).charAt(0).toUpperCase() + String(s).slice(1))
    .slice(0, 6);

  const established = academy?.establishedYear;
  const blurb =
    footerTheme.aboutText ||
    (academy?.description
      ? String(academy.description).slice(0, 150)
      : established
        ? `Training athletes in ${location} since ${established}.`
        : `Training athletes in ${location}.`);

  const copyrightText =
    footerTheme.copyrightText ||
    `© ${new Date().getFullYear()} ${brandName}. All Rights Reserved.`;

  return (
    <footer
      className="relative transition-colors duration-300 overflow-hidden border-t"
      style={{
        background: "var(--page-card, #ffffff)",
        color: "var(--page-fg, #0f172a)",
        borderColor: "var(--page-border, #e2e8f0)",
      }}
    >
      {/* Subtle Background Radial Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(var(--page-border)_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Border Gradient Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand)] via-[var(--accent)] to-[var(--brand-strong)] z-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 z-10">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3
              className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight font-display"
              style={{ color: "var(--page-fg)" }}
            >
              {brandFirstPart}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)]">
                {brandSecondPart}
              </span>
            </h3>
            <div className="w-16 h-1 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)] mb-6 rounded-full" />
            <p
              className="mb-8 leading-relaxed font-medium text-sm sm:text-base opacity-90"
              style={{ color: "var(--page-muted)" }}
            >
              {blurb}
            </p>

            {/* Social Icons */}
            <div className="flex flex-wrap gap-3">
              {activeSocials.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={index}
                    href={item.href}
                    target={item.href !== "#" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={item.label}
                    className="w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm border"
                    style={{
                      background: "var(--brand-soft)",
                      borderColor: "var(--brand-border)",
                      color: "var(--brand)",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4
              className="text-xl font-bold mb-6 font-display"
              style={{ color: "var(--page-fg)" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-3.5">
              {(
                [
                  { label: "About Us", href: "/about" },
                  { label: "Our Programs", href: "/programs" },
                  { label: "Success Stories", href: "/success-stories" },
                  { label: "Events", href: "/events" },
                ] as { label: string; href: string }[]
              ).map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="transition-colors font-medium flex items-center gap-2 group text-sm"
                    style={{ color: "var(--page-muted)" }}
                  >
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: "var(--brand)" }} />
                    <span className="hover:underline">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Sports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4
              className="text-xl font-bold mb-6 font-display"
              style={{ color: "var(--page-fg)" }}
            >
              Our Sports
            </h4>
            <ul className="space-y-3.5">
              {footerSports.map((sport) => (
                <li key={sport}>
                  <span
                    className="font-medium flex items-center gap-2 text-sm"
                    style={{ color: "var(--page-muted)" }}
                  >
                    <ChevronRight className="w-4 h-4" style={{ color: "var(--brand)" }} />
                    {sport}
                  </span>
                </li>
              ))}
              {footerSports.length === 0 && (
                <li className="text-sm opacity-60">Programmes being added.</li>
              )}
            </ul>
          </motion.div>

          {/* Contact Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4
              className="text-xl font-bold mb-6 font-display"
              style={{ color: "var(--page-fg)" }}
            >
              Contact
            </h4>
            <ul className="space-y-5">
              <li className="flex items-start gap-3.5 text-sm group">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    background: "var(--brand-soft)",
                    borderColor: "var(--brand-border)",
                    color: "var(--brand)",
                  }}
                >
                  <Phone className="w-4 h-4" />
                </div>
                <span className="font-medium mt-2" style={{ color: "var(--page-fg)" }}>
                  {phone}
                </span>
              </li>
              <li className="flex items-start gap-3.5 text-sm group">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    background: "var(--brand-soft)",
                    borderColor: "var(--brand-border)",
                    color: "var(--brand)",
                  }}
                >
                  <Mail className="w-4 h-4" />
                </div>
                <span className="font-medium mt-2 break-all" style={{ color: "var(--page-fg)" }}>
                  {email}
                </span>
              </li>
              <li className="flex items-start gap-3.5 text-sm group">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
                  style={{
                    background: "var(--brand-soft)",
                    borderColor: "var(--brand-border)",
                    color: "var(--brand)",
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="font-medium mt-2" style={{ color: "var(--page-fg)" }}>
                  {location}
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Copyright Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-6"
          style={{ borderColor: "var(--page-border)" }}
        >
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <p className="font-medium text-xs sm:text-sm" style={{ color: "var(--page-muted)" }}>
              {copyrightText}
            </p>
            {academy ? (
              <a
                href="https://sports.gwdglobal.in"
                className="flex items-center gap-1.5 text-xs opacity-75 hover:opacity-100 transition-opacity"
                style={{ color: "var(--page-muted)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/gwdlogo.png" alt="" className="h-4 w-auto opacity-70" />
                Powered by GWD Sports Ecosystem
              </a>
            ) : null}
          </div>

          <div className="flex gap-6 text-xs sm:text-sm font-semibold">
            <Link
              to="/contact"
              className="hover:underline transition-colors"
              style={{ color: "var(--page-fg)" }}
            >
              Contact Us
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:underline transition-colors"
              style={{ color: "var(--page-fg)" }}
            >
              Privacy
            </Link>
            <Link
              to="/terms-and-conditions"
              className="hover:underline transition-colors"
              style={{ color: "var(--page-fg)" }}
            >
              Terms
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
