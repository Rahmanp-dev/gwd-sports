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
} from "lucide-react";
import { BRAND_NAME } from "@/utils/constants";
import { Link } from "@/lib/router-shim";

export default function Footer({ academy }: { academy?: any }) {
  const brandName = academy?.name || BRAND_NAME;
  const brandFirstPart = brandName.split(" ")[0] || brandName;
  const brandSecondPart = brandName.split(" ").slice(1).join(" ") || "";
  const phone = academy?.contactInfo?.phone || "+91 91235-56789";
  const email = academy?.contactInfo?.email || `hello@${brandName.toLowerCase().replace(/\s/g, "")}.com`;
  const location = academy?.location || "Hyderabad";

  return (
    <footer className="relative bg-white text-slate-600 border-t border-slate-200 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />

      {/* Top Border Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--brand)] via-[var(--accent)] to-[var(--brand-strong)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-4xl font-bold mb-4 tracking-tight font-display text-slate-900">
              {brandFirstPart}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)]">
                {brandSecondPart}
              </span>
            </h3>
            <div className="w-16 h-1 bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)] mb-6 rounded-full" />
            <p className="text-slate-500 mb-8 leading-relaxed font-medium">
              Building legends since 2010. Where champions train and achieve greatness.
            </p>

            {/* Social */}
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 bg-slate-50 hover:bg-[var(--brand-soft)] hover:text-[color:var(--brand)] text-slate-500 flex items-center justify-center rounded-xl transition-all duration-300 shadow-sm hover:shadow-md border border-slate-100"
                >
                  <Icon className="w-5 h-5" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-xl font-bold mb-8 text-slate-900 font-display">
              Quick Links
            </h4>
            <ul className="space-y-4">
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
                    className="text-slate-500 hover:text-[color:var(--brand)] transition-colors font-medium flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[color:var(--brand)] transition-colors" />
                    {item.label}
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
            <h4 className="text-xl font-bold mb-8 text-slate-900 font-display">
              Our Sports
            </h4>
            <ul className="space-y-4">
              {(
                [
                  { label: "Football", href: "/programs/football" },
                  { label: "Basketball", href: "/programs/basketball" },
                  { label: "Racing League", href: "/programs/racing-league" },
                  { label: "Model United Nations", href: "/programs/mun" },
                  { label: "Galaxy Events", href: "/programs/galaxy-events" },
                ] as { label: string; href: string }[]
              ).map((sport) => (
                <li key={sport.label}>
                  <Link
                    to={sport.href}
                    className="text-slate-500 hover:text-[color:var(--brand)] transition-colors font-medium flex items-center gap-2 group"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[color:var(--brand)] transition-colors" />
                    {sport.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-xl font-bold mb-8 text-slate-900 font-display">
              Contact
            </h4>
            <ul className="space-y-6">
              <li className="flex items-start gap-4 text-slate-500 hover:text-slate-700 transition-colors group">
                <div className="w-10 h-10 bg-[var(--brand-soft)] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-soft)] transition-colors">
                  <Phone className="w-5 h-5 text-[color:var(--brand)]" />
                </div>
                <span className="font-medium mt-2">{phone}</span>
              </li>
              <li className="flex items-start gap-4 text-slate-500 hover:text-slate-700 transition-colors group">
                <div className="w-10 h-10 bg-[var(--brand-soft)] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-soft)] transition-colors">
                  <Mail className="w-5 h-5 text-[color:var(--brand)]" />
                </div>
                <span className="font-medium mt-2 break-all">{email}</span>
              </li>
              <li className="flex items-start gap-4 text-slate-500 hover:text-slate-700 transition-colors group">
                <div className="w-10 h-10 bg-[var(--brand-soft)] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[var(--brand-soft)] transition-colors">
                  <MapPin className="w-5 h-5 text-[color:var(--brand)]" />
                </div>
                <span className="font-medium mt-2">{location}</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <p className="text-slate-500 font-medium text-sm">
            © {new Date().getFullYear()} {brandName}. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <Link
              to="/contact"
              className="text-slate-500 hover:text-[color:var(--brand)] transition-colors font-semibold text-sm"
            >
              Contact Us
            </Link>
            <Link
              to="/privacy-policy"
              className="text-slate-500 hover:text-[color:var(--brand)] transition-colors font-semibold text-sm"
            >
              Privacy
            </Link>
            <Link
              to="/terms-and-conditions"
              className="text-slate-500 hover:text-[color:var(--brand)] transition-colors font-semibold text-sm"
            >
              Terms
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
