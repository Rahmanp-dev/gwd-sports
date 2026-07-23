"use client";
import Footer from "@/components/landing/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MoveLeft } from "lucide-react";
import { useNavigate } from "@/lib/router-shim";

const images = [
  { src: "/gallery/galaxy-events.png", alt: "Galaxy Events" },
  { src: "/gallery/mg.png", alt: "MasterGrade" },
  { src: "/gallery/mgbc.png", alt: "MasterGrade Basketball Club" },
  { src: "/gallery/mgfc.png", alt: "MasterGrade Football Club" },
  { src: "/gallery/mgmun.png", alt: "MasterGrade Model UN" },
  { src: "/gallery/mgpl.png", alt: "MasterGrade Premier League" },
  { src: "/gallery/mgrl.png", alt: "MasterGrade Rugby League" },
];

export default function GalleryPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-6 left-6 z-50"
      >
        <Button
          size="lg"
          onClick={() => navigate("/")}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg"
        >
          <MoveLeft className="mr-2 h-5 w-5" />
          Go to Homepage
        </Button>
      </motion.div>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 z-10">
        {/* Heading */}
        <section className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4"
          >
            Our{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Gallery
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="max-w-2xl mx-auto text-lg text-gray-400"
          >
            Explore moments, events, and memories from MasterGrade.
          </motion.p>
        </section>

        {/* Gallery Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((img, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm hover:border-gray-600 transition-all duration-300"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-contain p-8 transition-transform duration-500 group-hover:scale-110"
              />

              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="text-center text-lg font-semibold text-white px-4">
                  {img.alt}
                </p>
              </div>
            </motion.div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
