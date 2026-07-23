"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { academyService, Academy } from "@/services/academyService";

export default function AcademyBentoGrid() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    async function loadAcademies() {
      try {
        const response = await academyService.getAllAcademies({ limit: 12 });
        if (response?.data?.academies) {
          setAcademies(response.data.academies);
        }
      } catch (error) {
        console.error("Failed to load academies", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAcademies();
  }, []);

  if (isLoading) {
    return (
      <section className="py-24 bg-zinc-950 px-4">
        <div className="max-w-7xl mx-auto min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (!academies.length) return null;

  return (
    <section className="py-24 md:py-32 bg-zinc-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 max-w-2xl text-zinc-50">
            Find your arena.
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-xl leading-relaxed">
            Discover elite sports academies, specialized training facilities, and professional coaching centers in our network.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
          {academies.map((academy, i) => {
            // Layout variance: make first and 4th items span 2 columns on desktop
            const isFeatured = i === 0 || i === 3;
            const primaryColor = academy.theme?.primaryColor || "#fff";
            
            return (
              <motion.div
                key={academy._id}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.6,
                  delay: reduce ? 0 : (i % 3) * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`group relative rounded-sm overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors ${
                  isFeatured ? "md:col-span-2" : "col-span-1"
                }`}
              >
                <Link href={`/${academy.slug}`} className="absolute inset-0 z-10">
                  <span className="sr-only">View {academy.name}</span>
                </Link>

                <div className="absolute inset-0 p-8 flex flex-col justify-end z-20 pointer-events-none">
                  {academy.theme?.logoUrl && (
                    <div className="mb-auto self-start">
                      <img 
                        src={academy.theme.logoUrl} 
                        alt={`${academy.name} logo`}
                        className="w-12 h-12 rounded-full object-contain bg-zinc-950 p-1 border border-zinc-800"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {academy.sports?.slice(0, 3).map((sport) => (
                      <span 
                        key={sport} 
                        className="text-[10px] uppercase tracking-widest font-mono px-3 py-1 bg-zinc-950/80 backdrop-blur-md rounded-full text-zinc-300 border border-zinc-800"
                      >
                        {sport}
                      </span>
                    ))}
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-white">
                    {academy.name}
                  </h3>
                  
                  <div className="flex items-center text-zinc-400 text-sm gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{academy.location || 'Location varies'}</span>
                  </div>
                </div>

                {/* Decorative background accent */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 z-0"
                  style={{
                    background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)`
                  }}
                />

                {/* Arrow indicator */}
                <div className="absolute top-8 right-8 z-20 transform translate-x-4 -translate-y-4 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                    <ArrowUpRight className="w-5 h-5 text-zinc-950" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
