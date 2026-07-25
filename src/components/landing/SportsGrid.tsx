"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Trophy } from "lucide-react";
import { Link } from "@/lib/router-shim";

const defaultSports = [
  {
    name: "Football Academy",
    icon: "⚽",
    tagline: "Elite Training",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop",
    link: "/programs/football",
  },
  {
    name: "Basketball",
    icon: "🏀",
    tagline: "Champions League",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
    link: "/programs/basketball",
  },
  {
    name: "Racing League",
    icon: "🏎️",
    tagline: "Speed & Adrenaline",
    image:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&h=600&fit=crop",
    link: "/programs/racing-league",
  },
  {
    name: "Model United Nations",
    icon: "🎤",
    tagline: "Leadership & Oratory",
    image:
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=600&fit=crop",
    link: "/programs/mun",
  },
  {
    name: "Galaxy Events",
    icon: "🌟",
    tagline: "Premier Tournaments",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop",
    link: "/programs/galaxy-events",
  },
];

export default function SportsGrid({ academy }: { academy?: any }) {
  const displaySports = academy?.theme?.programs?.length
    ? academy.theme.programs
    : defaultSports;

  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      {/* Premium Apple-style Light Background */}
      <div className="absolute inset-0 bg-slate-50">
        <div className="absolute top-40 right-0 w-[30rem] h-[30rem] rounded-full bg-[var(--brand-soft)]/50 blur-3xl" />
        <div className="absolute bottom-40 left-0 w-[30rem] h-[30rem] rounded-full bg-[var(--brand-soft)]/50 blur-3xl" />
      </div>

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
            className="inline-flex items-center gap-3 px-6 py-2 bg-[var(--brand-soft)] border border-[color:var(--brand-soft)] text-[color:var(--brand)] rounded-full shadow-sm mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            <span className="text-sm font-semibold tracking-wider uppercase">
              Disciplines
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 font-display tracking-tight"
          >
            Master Your <span className="text-[color:var(--brand)]">Game</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto"
          >
            Train with elite coaches in state-of-the-art facilities across
            multiple disciplines.
          </motion.p>
        </motion.div>

        {/* Sports Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {displaySports.map((sport: any, index: number) => (
            <motion.div
              key={sport.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group cursor-pointer"
            >
              <Link to={sport.link || "/user/auth"} className="block h-full">
                <div className="relative h-[400px] rounded-[2rem] overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100">
                  {/* Background Image */}
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent transition-opacity duration-300 group-hover:opacity-90`} />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="text-5xl mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                      {sport.icon}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-2 font-display tracking-tight">
                        {sport.name}
                      </h3>
                      <p className="text-white/80 font-medium">
                        {sport.tagline}
                      </p>
                    </div>
                    
                    {/* Hover Reveal Details */}
                    <div className="mt-6 overflow-hidden h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <div className="flex items-center gap-2 text-white/90 font-medium">
                        Explore Program <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Special CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: displaySports.length * 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="relative group cursor-pointer"
          >
            <Link to="/user/auth" className="block h-full">
              <div className="relative h-[400px] rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-8 transition-shadow duration-300 hover:shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-strong)]/50 via-slate-900 to-[var(--brand-strong)]/50" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                    <Trophy className="w-10 h-10 text-[color:var(--brand)]" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 font-display tracking-tight">
                    Join The Academy
                  </h3>
                  <p className="text-slate-300 mb-8 max-w-[250px] mx-auto text-lg">
                    Begin your journey to greatness with professional coaching.
                  </p>
                  <span className="inline-flex items-center gap-2 text-[color:var(--brand)] font-semibold group-hover:text-[color:var(--brand-soft)] transition-colors">
                    Enroll Now <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
