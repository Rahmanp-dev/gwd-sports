import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const sports = [
  {
    name: "Football",
    icon: "⚽",
    description: "Build power, speed, and tactical mastery",
    image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&h=400&fit=crop",
  },
  {
    name: "Basketball",
    icon: "🏀",
    description: "Dominate the court with elite skills",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop",
  },
  {
    name: "Table Tennis",
    icon: "🏓",
    description: "Lightning reflexes and precision strikes",
    image: "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=600&h=400&fit=crop",
  },
  {
    name: "Tennis",
    icon: "🎾",
    description: "Power serves and winning strategies",
    image: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop",
  },
  {
    name: "Swimming",
    icon: "🏊",
    description: "Olympic-level technique and endurance",
    image: "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=600&h=400&fit=crop",
  },
  {
    name: "Badminton",
    icon: "🏸",
    description: "Speed, agility, and tactical excellence",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&h=400&fit=crop",
  },
  {
    name: "Cricket",
    icon: "🏏",
    description: "Master batting, bowling, and fielding",
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=400&fit=crop",
  },
];

export default function SportsGrid() {
  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      {/* Purple accent bar */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-6 py-2 bg-purple-600 text-white text-sm font-black uppercase tracking-[0.2em] mb-6">
            Our Programs
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-6 uppercase tracking-tighter" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
            Choose Your <span className="text-purple-600">Discipline</span>
          </h2>
          <div className="w-24 h-1 bg-purple-600 mx-auto mb-6" />
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto font-medium" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            Seven elite programs designed to transform athletes into champions
          </p>
        </motion.div>

        {/* Sports Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sports.map((sport, index) => (
            <motion.div
              key={sport.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer border-2 border-gray-200 hover:border-purple-600"
            >
              {/* Image Background */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={sport.image}
                  alt={sport.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-purple-600/95 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="text-6xl mb-4">{sport.icon}</div>
                    <p className="text-white text-lg font-bold mb-4">{sport.description}</p>
                    <div className="flex items-center justify-center gap-2 text-white font-black uppercase text-sm tracking-wider">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl mb-2">{sport.icon}</div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                      {sport.name}
                    </h3>
                  </div>
                  <div className="w-12 h-12 bg-purple-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Purple accent line */}
              <div className="absolute bottom-0 left-0 w-0 group-hover:w-full h-1 bg-purple-600 transition-all duration-500" />
            </motion.div>
          ))}

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: sports.length * 0.1 }}
            className="relative overflow-hidden bg-purple-600 hover:bg-purple-700 transition-all duration-300 cursor-pointer h-80 flex items-center justify-center border-2 border-purple-700"
          >
            <div className="text-center p-8">
              <div className="text-6xl mb-6">💪</div>
              <h3 className="text-3xl font-black text-white uppercase mb-4" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>Not Sure?</h3>
              <p className="text-white text-lg mb-6 font-medium">Get a free consultation with our experts</p>
              <div className="inline-flex items-center gap-2 text-white font-black uppercase text-sm border-2 border-white px-6 py-3 hover:bg-white hover:text-purple-600 transition-all tracking-wider">
                Contact Us <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}