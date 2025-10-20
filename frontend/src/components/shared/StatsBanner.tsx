import React from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  gradient: string;
}

interface StatsBannerProps {
  stats: Stat[];
  accentColor?: string;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  stats,
  accentColor = "from-amber-500 to-yellow-500",
}) => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Background Effects */}
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 bg-gradient-to-r ${accentColor} opacity-10`}
      />
      
      {/* Speed Lines Background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
            style={{ top: `${i * 10}%` }}
            animate={{
              x: ["-100%", "100%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{
                y: -10,
                scale: 1.05,
              }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md border-4 border-amber-500/20 rounded-2xl p-6 shadow-2xl hover:shadow-[0_20px_50px_rgba(245,158,11,0.4)] transition-all duration-500 overflow-hidden">
                {/* Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />
                
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.2 }}
                  transition={{ duration: 0.6 }}
                  className={`relative w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl group-hover:shadow-amber-500/50 transition-all`}
                >
                  <stat.icon className="w-7 h-7 text-white" />
                </motion.div>

                {/* Value */}
                <motion.div
                  className="relative text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 mb-2 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.value}
                </motion.div>

                {/* Label */}
                <div className="relative text-gray-400 uppercase tracking-[0.15em] font-bold text-sm group-hover:text-amber-400 transition-colors">
                  {stat.label}
                </div>

                {/* Corner Accents */}
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-500/50 rounded-tr-xl" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-500/50 rounded-bl-xl" />

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    x: ["-100%", "200%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};