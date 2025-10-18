import React from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
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
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-3xl"
      />

      {/* Top Border */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 shadow-lg shadow-purple-600/50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-5xl font-black uppercase mb-4 tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">Grade</span>
            </h3>
            <div className="w-20 h-1 bg-gradient-to-r from-purple-400 to-white mb-6 shadow-lg shadow-purple-400/50" />
            <p className="text-purple-100 mb-8 leading-relaxed font-semibold text-lg">
              Building legends since 2010. Where champions train.
            </p>

            {/* Social */}
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 bg-white/10 hover:bg-gradient-to-br hover:from-purple-600 hover:to-purple-400 backdrop-blur-md flex items-center justify-center rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50"
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
            <h4 className="text-2xl font-black uppercase mb-8 tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Quick Links</h4>
            <ul className="space-y-4">
              {['About Us', 'Our Programs', 'Success Stories', 'Events', 'Blog'].map((item) => (
                <li key={item}>
                  <motion.a
                    whileHover={{ x: 10 }}
                    href="#"
                    className="text-purple-200 hover:text-white transition-colors font-bold uppercase text-base tracking-wider flex items-center gap-2 group"
                  >
                    <Zap className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <h4 className="text-2xl font-black uppercase mb-8 tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Our Sports</h4>
            <ul className="space-y-4">
              {['Football', 'Basketball', 'Tennis', 'Swimming', 'Cricket'].map((sport) => (
                <li key={sport}>
                  <motion.a
                    whileHover={{ x: 10 }}
                    href="#"
                    className="text-purple-200 hover:text-white transition-colors font-bold uppercase text-base tracking-wider flex items-center gap-2 group"
                  >
                    <Zap className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {sport}
                  </motion.a>
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
          >
            <h4 className="text-2xl font-black uppercase mb-8 tracking-tight" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Contact</h4>
            <ul className="space-y-5 mb-8">
              <motion.li whileHover={{ x: 5 }} className="flex items-start gap-4 text-purple-200">
                <Phone className="w-6 h-6 mt-1 text-purple-400 flex-shrink-0" />
                <span className="font-bold text-base">+1 (555) 123-4567</span>
              </motion.li>
              <motion.li whileHover={{ x: 5 }} className="flex items-start gap-4 text-purple-200">
                <Mail className="w-6 h-6 mt-1 text-purple-400 flex-shrink-0" />
                <span className="font-bold text-base">hello@mastergrade.com</span>
              </motion.li>
              <motion.li whileHover={{ x: 5 }} className="flex items-start gap-4 text-purple-200">
                <MapPin className="w-6 h-6 mt-1 text-purple-400 flex-shrink-0" />
                <span className="font-bold text-base">123 Champions Ave, Sports City</span>
              </motion.li>
            </ul>

            {/* Newsletter */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h5 className="text-xl font-black uppercase mb-4 tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Newsletter</h5>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-400 rounded-xl font-semibold"
                />
                <Button className="bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 font-black uppercase px-6 rounded-xl shadow-lg hover:shadow-purple-500/50">
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
          className="pt-10 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6"
        >
          <p className="text-purple-200 font-bold uppercase tracking-widest text-sm">
            © 2026 Master Grade. All Rights Reserved.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-purple-200 hover:text-white transition-colors font-bold uppercase text-sm tracking-wider">
              Privacy
            </a>
            <a href="#" className="text-purple-200 hover:text-white transition-colors font-bold uppercase text-sm tracking-wider">
              Terms
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}