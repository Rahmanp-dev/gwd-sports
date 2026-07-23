"use client";
import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

interface FeaturesGridProps {
  title: string;
  subtitle: string;
  features: Feature[];
  accentColor?: string;
  bgGradient?: string;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({
  title,
  subtitle,
  features,
  accentColor = "from-amber-500 to-yellow-500",
  bgGradient = "from-amber-500/20 to-yellow-500/20",
}) => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-to-br ${bgGradient} rounded-full blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1.3, 1, 1.3],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br ${bgGradient} rounded-full blur-3xl`}
      />

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
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className={`inline-flex items-center gap-3 px-8 py-3 bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 rounded-full mb-8`}
          >
            <span className="text-sm font-black uppercase tracking-[0.3em] font-display">
              {subtitle}
            </span>
          </motion.div>

          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase leading-none font-display">
            {title.split(" ").slice(0, -1).join(" ")}
            <span
              className={`block text-transparent bg-clip-text bg-gradient-to-r ${accentColor}`}
            >
              {title.split(" ").slice(-1)[0]}
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`w-32 h-2 bg-gradient-to-r ${accentColor} mx-auto shadow-lg shadow-green-500/50`}
          />
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{
                y: -15,
                rotateX: 10,
                rotateY: 5,
              }}
              className="group relative"
              style={{ perspective: "1000px" }}
            >
              <div className="relative bg-gray-900/50 backdrop-blur-md border border-green-500/20 rounded-3xl p-8 h-full shadow-2xl hover:shadow-[0_20px_60px_rgba(34,197,94,0.4)] transition-all duration-500 overflow-hidden">
                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`relative w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-2xl group-hover:shadow-green-500/50 transition-all duration-500`}
                >
                  <feature.icon className="w-10 h-10 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-3xl font-black text-white uppercase mb-4 tracking-tight font-display">
                  {feature.title}
                </h3>
                <p className="text-gray-300 text-lg font-semibold leading-relaxed">
                  {feature.description}
                </p>

                {/* Floating Number */}
                <div className="absolute top-4 right-4 text-8xl font-black text-green-500/5 group-hover:text-green-500/10 transition-colors font-display">
                  {index + 1}
                </div>

                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
