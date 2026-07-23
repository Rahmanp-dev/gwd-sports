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
    color: "from-blue-500 to-cyan-400",
  },
  {
    icon: Trophy,
    value: 25,
    suffix: "+",
    label: "Championships",
    color: "from-amber-500 to-yellow-400",
  },
  {
    icon: Target,
    value: 98,
    suffix: "%",
    label: "Success Rate",
    color: "from-green-500 to-emerald-400",
  },
  {
    icon: Award,
    value: 10,
    suffix: "+",
    label: "Years Excellence",
    color: "from-orange-500 to-amber-400",
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
      className="text-4xl sm:text-5xl lg:text-6xl font-black font-display"
    >
      {count}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Animated Background */}
      <motion.div
        animate={{
          rotate: [0, 180, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl opacity-60"
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
          <h2 className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase leading-none font-display">
            Numbers That
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-500 font-display">
              Speak Volumes
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-32 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 mx-auto shadow-lg shadow-amber-500/50"
          />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 60, rotateX: -45 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              whileHover={{
                y: -20,
                rotateY: 10,
                rotateX: 5,
              }}
              className="group relative"
              style={{ perspective: "1000px" }}
            >
              <div className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-10 shadow-2xl hover:shadow-[0_30px_80px_rgba(251,191,36,0.4)] transition-all duration-500 border-4 border-amber-500/20 hover:border-amber-500/50 overflow-hidden">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.3, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-20 h-20 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:shadow-2xl group-hover:shadow-amber-500/50 transition-all duration-500`}
                >
                  <stat.icon className="w-10 h-10 text-white" />
                </motion.div>

                {/* Number */}
                <div
                  className={`text-transparent bg-clip-text bg-gradient-to-br ${stat.color} mb-4 drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]`}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <div className="text-gray-300 font-black text-xl uppercase tracking-wider">
                  {stat.label}
                </div>

                {/* Animated Background Gradient */}
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${stat.color} rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                />

                {/* Glowing Border */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Floating Achievement Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-4 px-10 py-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-full shadow-2xl shadow-amber-500/50">
            <Trophy className="w-8 h-8" />
            <span className="text-2xl font-black uppercase font-display tracking-wider">
              #1 Rated Sports Academy
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
