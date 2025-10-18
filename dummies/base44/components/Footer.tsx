import React from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-violet-950 text-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-3xl font-bold mb-2">
                  <span className="text-white">Master</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400"> Grade</span>
                </h3>
                <p className="text-stone-400 leading-relaxed">
                  Building champions, nurturing dreams, creating excellence since 2010.
                </p>
              </div>

              {/* Social links */}
              <div className="flex gap-3">
                {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-violet-500/50 backdrop-blur-sm flex items-center justify-center transition-all duration-300 border border-white/10 hover:border-violet-400/50"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="text-lg font-bold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {['About Us', 'Our Programs', 'Testimonials', 'Events', 'Blog', 'Careers'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-stone-400 hover:text-violet-400 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-violet-400 transition-all duration-200" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Sports Programs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-lg font-bold mb-6 text-white">Our Sports</h4>
            <ul className="space-y-3">
              {['Football', 'Basketball', 'Table Tennis', 'Tennis', 'Swimming', 'Badminton', 'Cricket'].map((sport) => (
                <li key={sport}>
                  <a
                    href="#"
                    className="text-stone-400 hover:text-violet-400 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-violet-400 transition-all duration-200" />
                    {sport}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact & Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h4 className="text-lg font-bold mb-6 text-white">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-stone-400">
                  <Phone className="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-400" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-start gap-3 text-stone-400">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-400" />
                  <span>info@mastergrade.com</span>
                </li>
                <li className="flex items-start gap-3 text-stone-400">
                  <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-violet-400" />
                  <span>123 Champions Ave, Sports City, SC 12345</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-sm font-bold mb-3 text-white">Stay Updated</h4>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-stone-400 rounded-xl focus:border-violet-400"
                />
                <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl px-6 flex-shrink-0">
                  Join
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="pt-8 border-t border-white/10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-stone-400">
            <p>© 2026 Master Grade Sports Academy. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-violet-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-violet-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-violet-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}