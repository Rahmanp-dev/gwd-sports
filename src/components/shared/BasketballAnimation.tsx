"use client";
import React from "react";
import { motion } from "framer-motion";

export const BasketballAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bouncing Basketball */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 opacity-20"
        animate={{
          y: [0, -100, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Court Lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-orange-500/10 to-transparent"
          style={{ top: `${20 + i * 15}%` }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Net Effect */}
      <motion.div
        className="absolute top-1/3 right-1/4 w-32 h-32"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-full h-full border-4 border-orange-500/5 rounded-full" />
      </motion.div>
    </div>
  );
};
