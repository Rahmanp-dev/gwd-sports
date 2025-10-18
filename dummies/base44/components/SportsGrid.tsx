import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

const sports = [
  {
    name: "Football",
    icon: "⚽",
    description: "Master the beautiful game with world-class coaching",
    gradient: "from-green-500 to-emerald-600",
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=400&fit=crop",
  },
  {
    name: "Basketball",
    icon: "🏀",
    description: "Elevate your game with elite training programs",
    gradient: "from-orange-500 to-red-600",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop",
  },
  {
    name: "Table Tennis",
    icon: "🏓",
    description: "Precision, speed, and strategy combined",
    gradient: "from-blue-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=600&h=400&fit=crop",
  },
  {
    name: "Tennis",
    icon: "🎾",
    description: "Serve your way to excellence on the court",
    gradient: "from-yellow-500 to-amber-600",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop",
  },
  {
    name: "Swimming",
    icon: "🏊",
    description: "Dive into excellence with Olympic-standard training",
    gradient: "from-cyan-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&h=400&fit=crop",
  },
  {
    name: "Badminton",
    icon: "🏸",
    description: "Lightning-fast reflexes and strategic gameplay",
    gradient: "from-purple-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=400&fit=crop",
  },
  {
    name: "Cricket",
    icon: "🏏",
    description: "From basics to boundary-hitting mastery",
    gradient: "from-red-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=400&fit=crop",
  },
];

export default function SportsGrid() {
  return (
    <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-violet-50/30">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100/80 rounded-full mb-6">
            <span className="text-sm font-semibold text-violet-700">Our Programs</span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
            Elite Sports <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Academies</span>
          </h2>
          <p className="text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto font-light">
            Choose from our world-class programs, each designed to unlock your full athletic potential
          </p>
        </motion.div>

        {/* Sports grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {sports.map((sport, index) => (
            <motion.div
              key={sport.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 rounded-3xl cursor-pointer">
                {/* Image background */}
                <div className="relative h-64 sm:h-72 overflow-hidden">
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${sport.gradient} opacity-60 group-hover:opacity-70 transition-opacity duration-500`} />
                  
                  {/* Icon */}
                  <div className="absolute top-6 left-6 w-16 h-16 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    {sport.icon}
                  </div>

                  {/* Arrow icon */}
                  <div className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                    <ArrowUpRight className="w-5 h-5 text-stone-900" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 bg-white">
                  <h3 className="text-2xl font-bold text-stone-900 mb-3">{sport.name}</h3>
                  <p className="text-stone-600 leading-relaxed">{sport.description}</p>
                  
                  <div className="mt-6 flex items-center gap-2 text-violet-600 font-semibold text-sm group-hover:gap-3 transition-all">
                    Learn More
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Hover gradient border */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${sport.gradient} opacity-20 blur-xl`} />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-stone-600 mb-4">Can't decide? Let our experts guide you</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Get Free Consultation
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}