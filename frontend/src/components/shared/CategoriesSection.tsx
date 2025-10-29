import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  title: string;
  icon: string;
  description: string;
  gradient: string;
}

interface CategoriesSectionProps {
  title: string;
  subtitle: string;
  categories: Category[];
  accentColor?: string;
  bgGradient?: string;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  title,
  subtitle,
  categories,
  accentColor = "from-amber-500 to-yellow-500",
  bgGradient = "from-amber-500/20 to-yellow-500/20",
}) => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br ${bgGradient} rounded-full blur-3xl`}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
          opacity: [0.2, 0.1, 0.2],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className={`absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br ${bgGradient} rounded-full blur-3xl`}
      />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />

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
            className={`inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r ${accentColor} text-black rounded-full mb-8 shadow-[0_0_40px_rgba(245,158,11,0.6)]`}
          >
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
              className={`block text-transparent bg-clip-text bg-gradient-to-r ${accentColor} drop-shadow-[0_0_30px_rgba(245,158,11,0.8)]`}
            >
              {title.split(" ").slice(-1)[0]}
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`w-32 h-2 bg-gradient-to-r ${accentColor} mx-auto shadow-[0_0_30px_rgba(245,158,11,0.8)]`}
          />
        </motion.div>

        {/* Categories Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 60, rotateY: -30 }}
              whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: index * 0.15 }}
              whileHover={{
                y: -20,
                rotateY: 10,
                scale: 1.05,
              }}
              className="group relative"
              style={{ perspective: "1500px" }}
            >
              <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-md border-4 border-amber-500/20 rounded-3xl p-8 h-full shadow-2xl hover:shadow-[0_25px_70px_rgba(245,158,11,0.5)] transition-all duration-500 overflow-hidden">
                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500`}
                />

                {/* Animated Corner Lines */}
                <motion.div
                  className="absolute top-0 left-0 w-20 h-20 border-t-4 border-l-4 border-amber-500/50 rounded-tl-3xl"
                  animate={{
                    borderColor: [
                      "rgba(245,158,11,0.5)",
                      "rgba(245,158,11,1)",
                      "rgba(245,158,11,0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-0 right-0 w-20 h-20 border-b-4 border-r-4 border-amber-500/50 rounded-br-3xl"
                  animate={{
                    borderColor: [
                      "rgba(245,158,11,0.5)",
                      "rgba(245,158,11,1)",
                      "rgba(245,158,11,0.5)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="relative text-8xl mb-6 filter drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                >
                  {category.icon}
                </motion.div>

                {/* Content */}
                <h3
                  className="relative text-3xl font-black text-white uppercase mb-4 tracking-tight group-hover:text-amber-400 transition-colors"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  {category.title}
                </h3>
                <p className="relative text-gray-300 text-base font-semibold leading-relaxed mb-6">
                  {category.description}
                </p>

                {/* CTA */}
                <motion.div whileHover={{ x: 5 }} className="relative">
                  <Button
                    variant="ghost"
                    className="text-amber-400 hover:text-amber-300 hover:bg-transparent p-0 h-auto font-black uppercase tracking-wider group/btn"
                  >
                    Learn More
                    <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                  </Button>
                </motion.div>

                {/* Speed Lines Decoration */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute left-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"
                      style={{ top: `${20 + i * 15}%` }}
                      animate={{
                        x: ["-100%", "100%"],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "linear",
                      }}
                    />
                  ))}
                </div>

                {/* Glow Effect */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 -z-10`}
                />

                {/* Number Badge */}
                <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/50 border-2 border-amber-500/30 flex items-center justify-center">
                  <span
                    className="text-amber-500 text-xl font-black"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="text-center mt-20"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              className={`bg-gradient-to-r ${accentColor} hover:from-amber-600 hover:to-yellow-600 text-black text-xl font-black uppercase px-12 py-7 rounded-xl shadow-[0_0_40px_rgba(245,158,11,0.6)] hover:shadow-[0_0_60px_rgba(245,158,11,0.8)] transition-all group/btn`}
            >
              Explore All Categories
              <ArrowRight className="ml-3 w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
