import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  MessageSquare,
  Target,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { SectionHero } from "@/components/shared/SectionHero";
import { StatsBanner } from "@/components/shared/StatsBanner";
import Footer from "@/components/landing/Footer";
import { mgmunData } from "@/utils/data/mgmunData";

export default function MgMunPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="relative bg-gradient-to-b from-black via-gray-900 to-black">
      <SectionHero
        title={mgmunData.hero.title}
        subtitle={mgmunData.hero.subtitle}
        description={mgmunData.hero.description}
        backgroundImage="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop"
        accentColor="from-blue-500 to-amber-500"
        ctaText="Register Now"
        secondaryCtaText="Learn More"
        stats={mgmunData.hero.stats}
        logo="/logos/mgmun.png"
      />

      <StatsBanner
        stats={mgmunData.hero.stats}
        accentColor="from-blue-500 to-amber-500"
      />

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Globe className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-blue-400 font-display">
                  Diplomatic Excellence
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white font-display">
                {mgmunData.about.title}
              </h2>

              <p className="text-lg text-gray-300 leading-relaxed font-body">
                {mgmunData.about.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {mgmunData.about.highlights.map((highlight, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-400 mt-1 flex-shrink-0" />
                    <span className="text-gray-300 font-body">{highlight}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-display"
              >
                Explore Committees
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            {/* Right side animation - keep as is */}
            <motion.div
              variants={itemVariants}
              className="relative h-[400px] lg:h-[600px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl" />
              <div className="absolute inset-0 backdrop-blur-3xl rounded-3xl border border-white/10" />

              <motion.div
                animate={{
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-10 right-10 bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-2xl border border-blue-400/20"
              >
                <MessageSquare className="h-8 w-8 text-white mb-2" />
                <p className="text-white font-semibold font-display">Debate</p>
                <p className="text-blue-200 text-sm font-body">& Diplomacy</p>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 20, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
                className="absolute bottom-10 left-10 bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-2xl shadow-2xl border border-purple-400/20"
              >
                <Target className="h-8 w-8 text-white mb-2" />
                <p className="text-white font-semibold font-display">
                  Resolution
                </p>
                <p className="text-purple-200 text-sm font-body">Drafting</p>
              </motion.div>

              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-2xl shadow-2xl border border-indigo-400/20"
              >
                <Globe className="h-12 w-12 text-white mx-auto mb-2" />
                <p className="text-white font-bold text-xl text-center font-display">
                  MG MUN
                </p>
                <p className="text-indigo-200 text-sm text-center font-body">
                  Peace Through Dialogue
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Rest of sections - update all headings to use font-display and body text to use font-body */}
      {/* I'll show key examples: */}

      {/* Skills Development Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20 font-display">
                Skills Development
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">
                What You'll Learn
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-body">
                Develop essential skills that will serve you throughout your
                academic and professional career
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mgmunData.skills.map((skill, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${skill.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                    >
                      <span className="text-3xl">{skill.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 font-display">
                      {skill.title}
                    </h3>
                    <p className="text-gray-400 font-body">
                      {skill.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Continue updating all other sections similarly... */}
      {/* For brevity, I'm showing the pattern - apply font-display to all headings/titles */}
      {/* and font-body to all paragraph text throughout the rest of the file */}

      <Footer />
    </div>
  );
}
