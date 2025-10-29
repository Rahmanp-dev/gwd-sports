import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";

const sports = [
  {
    name: "Football",
    icon: "⚽",
    tagline: "Power & Precision",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop",
    color: "from-green-600 to-emerald-500",
  },
  {
    name: "Basketball",
    icon: "🏀",
    tagline: "Speed & Strategy",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
    color: "from-orange-600 to-red-500",
  },
  {
    name: "Table Tennis",
    icon: "🏓",
    tagline: "Agility & Focus",
    image:
      "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&h=600&fit=crop",
    color: "from-cyan-600 to-blue-500",
  },
  {
    name: "Tennis",
    icon: "🎾",
    tagline: "Strength & Skill",
    image:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop",
    color: "from-yellow-600 to-amber-500",
  },
  {
    name: "Swimming",
    icon: "🏊",
    tagline: "Endurance & Grace",
    image:
      "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=600&fit=crop",
    color: "from-blue-600 to-indigo-500",
  },
  {
    name: "Badminton",
    icon: "🏸",
    tagline: "Speed & Reflexes",
    image:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=600&fit=crop",
    color: "from-pink-600 to-rose-500",
  },
  {
    name: "Cricket",
    icon: "🏏",
    tagline: "Power & Technique",
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=600&fit=crop",
    color: "from-red-600 to-orange-500",
  },
];

export default function SportsGrid() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
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
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl"
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
            className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-full mb-8 shadow-lg shadow-amber-500/50"
          >
            <Zap className="w-5 h-5" />
            <span
              className="text-sm font-black uppercase tracking-[0.3em]"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              Our Programs
            </span>
          </motion.div>

          <h2
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-white mb-6 uppercase tracking-tighter leading-none"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Choose Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500">
              Champion Path
            </span>
          </h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-32 h-2 bg-gradient-to-r from-amber-500 to-yellow-500 mx-auto mb-8 shadow-lg shadow-amber-500/50"
          />
          <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto font-bold">
            Seven elite disciplines. One legendary destination.
          </p>
        </motion.div>

        {/* Sports Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sports.map((sport, index) => (
            <motion.div
              key={sport.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -20, rotateY: 5 }}
              className="group relative"
              style={{ perspective: "1000px" }}
            >
              <div className="relative overflow-hidden bg-gray-900 rounded-3xl shadow-2xl hover:shadow-[0_20px_60px_rgba(251,191,36,0.3)] transition-all duration-500 transform-gpu">
                {/* Image */}
                <div className="relative h-80 overflow-hidden">
                  <motion.img
                    whileHover={{ scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    src={sport.image}
                    alt={sport.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                  {/* Icon Badge */}
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className="absolute top-6 left-6 w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
                  >
                    {sport.icon}
                  </motion.div>

                  {/* Gradient Overlay on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${sport.color} opacity-0 group-hover:opacity-90 transition-opacity duration-500 flex items-center justify-center`}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      className="text-center"
                    >
                      <div className="text-7xl mb-4">{sport.icon}</div>
                      <div
                        className="text-white text-2xl font-black uppercase tracking-wider mb-2"
                        style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                      >
                        {sport.tagline}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-white font-black uppercase text-sm">
                        Explore <ArrowRight className="w-5 h-5" />
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
                  <h3
                    className="text-4xl font-black text-white uppercase tracking-tight mb-2"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  >
                    {sport.name}
                  </h3>
                  <div className="text-amber-400 font-bold uppercase tracking-wider text-sm">
                    {sport.tagline}
                  </div>
                </div>

                {/* Glowing Border */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${sport.color} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10`}
                />
              </div>
            </motion.div>
          ))}

          {/* Special CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: sports.length * 0.1 }}
            whileHover={{ y: -20, scale: 1.05 }}
            className="relative group cursor-pointer"
          >
            <div className="h-80 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-[0_20px_60px_rgba(251,191,36,0.6)] transition-all duration-500 overflow-hidden">
              <div className="text-center z-10 relative p-8">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="text-7xl mb-6"
                >
                  💪
                </motion.div>
                <h3
                  className="text-5xl font-black text-black uppercase mb-4 tracking-tight"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  Not Sure?
                </h3>
                <p className="text-black text-xl mb-6 font-bold">
                  Get expert guidance
                </p>
                <div className="inline-flex items-center gap-3 text-black font-black uppercase text-base border-4 border-black px-8 py-4 hover:bg-black hover:text-amber-500 transition-all rounded-full">
                  Contact Us <ArrowRight className="w-5 h-5" />
                </div>
              </div>

              {/* Animated Background Elements */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute inset-0 bg-black/10 rounded-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
