"use client";
import React from "react";
import { motion } from "framer-motion";
import { Award, Users, Target, TrendingUp, Shield, Zap } from "lucide-react";
import { BRAND_NAME } from "@/utils/constants";

const reasons = [
  {
    icon: Award,
    title: "Elite Coaches",
    description: "Train with world champions and certified professionals",
    gradient: "from-blue-50 to-indigo-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Target,
    title: "Proven Results",
    description: "Science-backed training that delivers champions",
    gradient: "from-sky-50 to-blue-50",
    iconColor: "text-sky-600",
  },
  {
    icon: Users,
    title: "Strong Community",
    description: "Join a family of 10,000+ dedicated athletes",
    gradient: "from-indigo-50 to-purple-50",
    iconColor: "text-indigo-600",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Advanced analytics and performance metrics",
    gradient: "from-teal-50 to-emerald-50",
    iconColor: "text-teal-600",
  },
  {
    icon: Shield,
    title: "Safety First",
    description: "Olympic-standard safety protocols and care",
    gradient: "from-rose-50 to-red-50",
    iconColor: "text-rose-600",
  },
  {
    icon: Zap,
    title: "Modern Facilities",
    description: "State-of-the-art equipment and venues",
    gradient: "from-violet-50 to-fuchsia-50",
    iconColor: "text-violet-600",
  },
];

export default function WhyChooseUs({ academy }: { academy?: any }) {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-slate-50 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-full shadow-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              Why {academy?.name || BRAND_NAME}
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 font-display tracking-tight">
            The Elite <span className="text-blue-600">Difference</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              <div className="relative bg-white border border-slate-100 rounded-[2rem] p-8 h-full shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Gradient Background on Hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${reason.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:shadow-md transition-all duration-300`}
                  >
                    <reason.icon className={`w-8 h-8 ${reason.iconColor}`} />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight font-display">
                    {reason.title}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">
                    {reason.description}
                  </p>
                </div>

                {/* Floating Number (Subtle) */}
                <div
                  className="absolute bottom-4 right-6 text-7xl font-black text-slate-50 group-hover:text-white transition-colors z-0"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  0{index + 1}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
