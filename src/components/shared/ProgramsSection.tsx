"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Program {
  title: string;
  age: string;
  description: string;
  color: string;
}

interface ProgramsSectionProps {
  title: string;
  subtitle: string;
  programs: Program[];
  icon?: string;
  accentColor?: string;
}

export const ProgramsSection: React.FC<ProgramsSectionProps> = ({
  title,
  subtitle,
  programs,
  icon = "⚽",
  accentColor = "from-green-500 to-emerald-500",
}) => {
  const getActiveColor = () => {
    if (location.pathname.includes("football"))
      return "border-green-500 bg-green-500/10";
    if (location.pathname.includes("basketball"))
      return "border-orange-500 bg-orange-500/10";
    if (location.pathname.includes("events"))
      return "border-purple-500 bg-purple-500/10";
    if (location.pathname.includes("mun"))
      return "border-blue-500 bg-blue-500/10";
    if (location.pathname.includes("racing"))
      return "border-amber-500 bg-amber-500/10";
    return "border-slate-500 bg-slate-500/10";
  };

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute top-1/4 right-0 w-[600px] h-[600px] bg-gradient-to-br ${accentColor.replace("from-green-500 to-emerald-500", "from-amber-500/10 to-yellow-500/10")} rounded-full blur-3xl`}
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
            transition={{ duration: 0.6 }}
            className={`inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r ${accentColor} text-${accentColor.includes("amber") || accentColor.includes("yellow") ? "black" : "white"} rounded-full mb-8 shadow-lg ${accentColor.includes("amber") ? "shadow-amber-500/50" : "shadow-green-500/50"}`}
          >
            <span className="text-2xl">{icon}</span>
            <span
              className="text-sm font-black uppercase tracking-[0.3em]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {subtitle}
            </span>
          </motion.div>

          <h2
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
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
            className={`w-32 h-2 bg-gradient-to-r ${accentColor} mx-auto mb-8 shadow-lg ${accentColor.includes("amber") ? "shadow-amber-500/50" : "shadow-green-500/50"}`}
          />
        </motion.div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -15, scale: 1.02 }}
              className="group relative"
            >
              <div
                className={`relative bg-slate-900/80 backdrop-blur-md rounded-3xl p-10 h-full shadow-2xl hover:shadow-[0_20px_60px_${accentColor.includes("amber") ? "rgba(245,158,11,0.4)" : "rgba(34,197,94,0.4)"}] transition-all duration-500 border-4 ${accentColor.includes("amber") ? "border-amber-500/20 hover:border-amber-500/50" : "border-green-500/20 hover:border-green-500/50"} overflow-hidden`}
              >
                {/* Number Badge */}
                <div
                  className={`absolute top-8 right-8 w-16 h-16 bg-gradient-to-br ${program.color} rounded-2xl flex items-center justify-center shadow-xl`}
                >
                  <span
                    className="text-2xl font-black text-white"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    0{index + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-6 mb-8">
                  <h3
                    className="text-4xl font-black text-white uppercase tracking-tight pr-20"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {program.title}
                  </h3>

                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${program.color} text-white rounded-full text-sm font-black uppercase`}
                  >
                    <Zap className="w-4 h-4" />
                    {program.age}
                  </div>

                  <p className="text-slate-300 text-lg font-semibold leading-relaxed">
                    {program.description}
                  </p>
                </div>

                {/* CTA */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className={`bg-gradient-to-r ${program.color} hover:shadow-xl text-white font-black uppercase w-full group/btn`}
                  >
                    Learn More
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                  </Button>
                </motion.div>

                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${program.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
