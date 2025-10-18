import React from "react";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  return (
    <footer className="relative bg-gray-900 text-white border-t-4 border-purple-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-3xl font-black uppercase mb-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Master <span className="text-purple-600">Grade</span>
            </h3>
            <div className="w-16 h-1 bg-purple-600 mb-4" />
            <p className="text-gray-400 mb-6 leading-relaxed font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
              Building champions since 2010. Elite training for elite athletes.
            </p>

            {/* Social */}
            <div className="flex gap-3">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, index) => (
                <button
                  key={index}
                  className="w-10 h-10 bg-gray-800 hover:bg-purple-600 flex items-center justify-center transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-black uppercase mb-6" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Quick Links</h4>
            <ul className="space-y-3">
              {['About Us', 'Our Programs', 'Testimonials', 'Events', 'Blog'].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-purple-600 transition-colors font-bold uppercase text-sm tracking-wider"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h4 className="text-xl font-black uppercase mb-6" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Our Sports</h4>
            <ul className="space-y-3">
              {['Football', 'Basketball', 'Table Tennis', 'Tennis', 'Swimming', 'Badminton', 'Cricket'].map((sport) => (
                <li key={sport}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-purple-600 transition-colors font-bold uppercase text-sm tracking-wider"
                  >
                    {sport}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xl font-black uppercase mb-6" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Contact</h4>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3 text-gray-400">
                <Phone className="w-5 h-5 mt-1 text-purple-600 flex-shrink-0" />
                <span className="font-bold">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <Mail className="w-5 h-5 mt-1 text-purple-600 flex-shrink-0" />
                <span className="font-bold">info@mastergrade.com</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-5 h-5 mt-1 text-purple-600 flex-shrink-0" />
                <span className="font-bold">123 Champions Ave, Sports City</span>
              </li>
            </ul>

            {/* Newsletter */}
            <div>
              <h5 className="text-sm font-black uppercase mb-3 tracking-wider">Newsletter</h5>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-600"
                />
                <Button className="bg-purple-600 hover:bg-purple-700 font-black uppercase">
                  Join
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-500 font-bold uppercase tracking-wider">
            © 2026 Master Grade. All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors font-bold uppercase text-xs tracking-wider">
              Privacy
            </a>
            <a href="#" className="text-gray-500 hover:text-purple-600 transition-colors font-bold uppercase text-xs tracking-wider">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}