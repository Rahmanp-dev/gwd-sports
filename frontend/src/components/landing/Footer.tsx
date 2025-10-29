import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-3xl"
      />

      {/* Top Border */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 shadow-lg shadow-amber-500/50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3
              className="text-5xl font-black uppercase mb-4 tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Master{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500">
                Grade
              </span>
            </h3>
            <div className="w-20 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 mb-6 shadow-lg shadow-amber-500/50" />
            <p className="text-gray-300 mb-8 leading-relaxed font-semibold text-lg">
              Building legends since 2010. Where champions train.
            </p>

            {/* Social */}
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 bg-amber-500/20 hover:bg-gradient-to-br hover:from-amber-500 hover:to-yellow-500 backdrop-blur-md flex items-center justify-center rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/50"
                >
                  <Icon className="w-6 h-6" />
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
            <h4
              className="text-2xl font-black uppercase mb-8 tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-4">
              {[
                "About Us",
                "Our Programs",
                "Success Stories",
                "Events",
                "Blog",
              ].map((item) => (
                <li key={item}>
                  <motion.a
                    whileHover={{ x: 10 }}
                    href="#"
                    className="text-gray-400 hover:text-amber-500 transition-colors font-bold uppercase text-base tracking-wider flex items-center gap-2 group"
                  >
                    <Zap className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item}
                  </motion.a>
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
              className="text-2xl font-black uppercase mb-8 tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Our Sports
            </h4>
            <ul className="space-y-4">
              {["Football", "Basketball", "Tennis", "Swimming", "Cricket"].map(
                (sport) => (
                  <li key={sport}>
                    <motion.a
                      whileHover={{ x: 10 }}
                      href="#"
                      className="text-gray-400 hover:text-amber-500 transition-colors font-bold uppercase text-base tracking-wider flex items-center gap-2 group"
                    >
                      <Zap className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {sport}
                    </motion.a>
                  </li>
                ),
              )}
            </ul>
          </motion.div>

          {/* Contact & Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4
              className="text-2xl font-black uppercase mb-8 tracking-tight"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Contact
            </h4>
            <ul className="space-y-5 mb-8">
              <motion.li
                whileHover={{ x: 5 }}
                className="flex items-start gap-4 text-gray-300"
              >
                <Phone className="w-6 h-6 mt-1 text-amber-500 flex-shrink-0" />
                <span className="font-bold text-base">+1 (555) 123-4567</span>
              </motion.li>
              <motion.li
                whileHover={{ x: 5 }}
                className="flex items-start gap-4 text-gray-300"
              >
                <Mail className="w-6 h-6 mt-1 text-amber-500 flex-shrink-0" />
                <span className="font-bold text-base">
                  hello@mastergrade.com
                </span>
              </motion.li>
              <motion.li
                whileHover={{ x: 5 }}
                className="flex items-start gap-4 text-gray-300"
              >
                <MapPin className="w-6 h-6 mt-1 text-amber-500 flex-shrink-0" />
                <span className="font-bold text-base">
                  123 Champions Ave, Sports City
                </span>
              </motion.li>
            </ul>

            {/* Newsletter */}
            <div className="bg-amber-500/10 backdrop-blur-md rounded-2xl p-6 border border-amber-500/20">
              <h5
                className="text-xl font-black uppercase mb-4 tracking-wider"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                Newsletter
              </h5>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-black/50 border-amber-500/30 text-white placeholder:text-gray-500 focus:border-amber-500 rounded-xl font-semibold"
                />
                <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-black uppercase px-6 rounded-xl shadow-lg hover:shadow-amber-500/50">
                  Join
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="pt-10 border-t border-amber-500/20 flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
            © 2026 Master Grade. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a
              href="#"
              className="text-gray-400 hover:text-amber-500 transition-colors font-bold uppercase text-sm tracking-wider"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-amber-500 transition-colors font-bold uppercase text-sm tracking-wider"
            >
              Terms
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
