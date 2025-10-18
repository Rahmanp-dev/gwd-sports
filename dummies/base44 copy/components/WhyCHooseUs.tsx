import React from "react";
import { motion } from "framer-motion";
import { Award, Users, Target, TrendingUp, Shield, Zap } from "lucide-react";

const reasons = [
  {
    icon: Award,
    title: "Elite Coaches",
    description: "Train with certified professionals and former champions",
  },
  {
    icon: Target,
    title: "Proven Methods",
    description: "Science-backed training programs that deliver results",
  },
  {
    icon: Users,
    title: "Community",
    description: "Join a family of dedicated athletes and champions",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Advanced metrics and performance tracking systems",
  },
  {
    icon: Shield,
    title: "Safe Training",
    description: "Top-tier safety standards and medical support",
  },
  {
    icon: Zap,
    title: "Modern Facility",
    description: "State-of-the-art equipment and training spaces",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-6 py-2 bg-purple-600 text-white text-sm font-black uppercase tracking-[0.2em] mb-6">
            Why Master Grade
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 uppercase tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
            The <span className="text-purple-600">Elite</span> Difference
          </h2>
          <div className="w-24 h-1 bg-purple-600 mx-auto" />
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-gray-50 p-8 h-full border-l-4 border-purple-600 hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <reason.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase mb-3" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                  {reason.title}
                </h3>
                <p className="text-gray-600 text-lg font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                  {reason.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}