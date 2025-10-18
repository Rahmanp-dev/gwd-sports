import React from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Target, Award } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: 10000,
    suffix: "+",
    label: "Athletes Trained",
  },
  {
    icon: Trophy,
    value: 250,
    suffix: "+",
    label: "Championships Won",
  },
  {
    icon: Target,
    value: 98,
    suffix: "%",
    label: "Success Rate",
  },
  {
    icon: Award,
    value: 15,
    suffix: "+",
    label: "Years Experience",
  },
];

function Counter({ value, suffix }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  React.useEffect(() => {
    if (!hasAnimated) {
      let startTime;
      const duration = 2000;

      const animateValue = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
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
    <span className="text-5xl sm:text-6xl lg:text-7xl font-black" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {displayValue}
      {suffix}
    </span>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50">
      {/* Purple gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-600/5 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 uppercase tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
            Proven <span className="text-purple-600">Results</span>
          </h2>
          <div className="w-24 h-1 bg-purple-600 mx-auto" />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="bg-white p-8 border-t-4 border-purple-600 hover:shadow-2xl transition-all duration-300">
                <div className="w-16 h-16 bg-purple-600 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>

                <div className="text-purple-600 mb-3">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>

                <div className="text-gray-600 font-bold text-lg uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}