import React from "react";
import { motion } from "framer-motion";

// Basketball Animation
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

// Football Animation
export const FootballAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Field Lines */}
      {[...Array(7)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/10 to-transparent"
          style={{ top: `${10 + i * 13}%` }}
          animate={{
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.3,
          }}
        />
      ))}

      {/* Moving Football */}
      <motion.div
        className="absolute top-1/2 w-12 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 opacity-20"
        animate={{
          x: ["0%", "100%"],
          rotate: [0, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
};

// Racing Animation
export const RacingAnimation: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Speed Lines */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"
          style={{ top: `${10 + i * 11}%` }}
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

      {/* Checkered Flag Pattern */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-24 h-24 opacity-10"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className={`${
                (Math.floor(i / 4) + (i % 4)) % 2 === 0
                  ? "bg-amber-500"
                  : "bg-transparent"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};
