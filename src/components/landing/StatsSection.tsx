"use client";
import React from "react";
import { motion, useInView } from "framer-motion";
import { Trophy, Users, Target, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 1000,
    suffix: "+",
    label: "Athletes Trained",
    color: "from-[var(--brand)] to-[var(--brand-strong)]",
    bg: "bg-[var(--brand-soft)]",
    text: "text-[color:var(--brand)]",
  },
  {
    icon: Trophy,
    value: 25,
    suffix: "+",
    label: "Championships",
    color: "from-amber-400 to-yellow-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
  },
  {
    icon: Target,
    value: 98,
    suffix: "%",
    label: "Success Rate",
    color: "from-emerald-400 to-green-500",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    icon: Award,
    value: 10,
    suffix: "+",
    label: "Years Excellence",
    color: "from-purple-500 to-fuchsia-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
  },
];

interface AnimatedCounterProps {
  value: number;
  suffix: string;
}

function AnimatedCounter({ value, suffix }: AnimatedCounterProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span
      ref={ref}
      className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display"
    >
      {count}
      {suffix}
    </span>
  );
}

export default function StatsSection({ academy }: { academy?: any }) {
  if (academy?.theme?.sections?.stats === false) return null;

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[var(--brand-soft)]/50 to-[var(--brand-soft)]/50 rounded-full blur-3xl opacity-60"
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
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 font-display tracking-tight">
            Numbers That{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-[var(--brand-strong)]">
              Speak Volumes
            </span>
          </h2>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative"
            >
              <div className="relative bg-white border border-slate-100 rounded-[var(--brand-radius)] p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden text-center">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`w-16 h-16 mx-auto ${stat.bg} rounded-[var(--brand-radius)] flex items-center justify-center mb-6 shadow-sm group-hover:shadow-md transition-all duration-300`}
                >
                  <stat.icon className={`w-8 h-8 ${stat.text}`} />
                </motion.div>

                {/* Number */}
                <div
                  className={`text-transparent bg-clip-text bg-gradient-to-br ${stat.color} mb-2`}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <div className="text-slate-500 font-semibold text-lg tracking-wide">
                  {stat.label}
                </div>

                {/* Glowing Background on Hover */}
                <div
                  className={`absolute inset-0 rounded-[var(--brand-radius)] bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Achievement Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-800 rounded-full shadow-md hover:shadow-lg transition-all">
            <Trophy className="w-6 h-6 text-amber-500" />
            <span className="text-lg font-bold font-display tracking-wide">
              #1 Rated Sports Academy
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
