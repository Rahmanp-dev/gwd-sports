import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Trophy, Users, Target, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 10000,
    suffix: "+",
    label: "Athletes Trained",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Trophy,
    value: 250,
    suffix: "+",
    label: "Championships Won",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Target,
    value: 98,
    suffix: "%",
    label: "Success Rate",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: Award,
    value: 15,
    suffix: "+",
    label: "Years Experience",
    color: "from-blue-500 to-cyan-600",
  },
];

function Counter({ value, suffix }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (!hasAnimated) {
      let startTime;
      const duration = 2000; // 2 seconds

      const animateValue = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.floor(easeOut * value));

        if (progress < 1) {
          requestAnimationFrame(animateValue);
        } else {
          setHasAnimated(true);
        }
      };

      requestAnimationFrame(animateValue);
    }
  }, [hasAnimated, value]);

  return (
    <span className="text-5xl sm:text-6xl font-bold">
      {displayValue}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-violet-50 via-purple-50 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-6">
            Achievements That <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Speak Volumes</span>
          </h2>
          <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto font-light">
            Numbers that reflect our commitment to excellence and your success
          </p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border border-stone-100 group">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>

                {/* Number */}
                <div className={`text-transparent bg-clip-text bg-gradient-to-r ${stat.color} mb-3`}>
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>

                {/* Label */}
                <div className="text-stone-600 font-medium text-lg">{stat.label}</div>

                {/* Decorative gradient */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}