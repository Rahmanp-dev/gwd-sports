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
import { mgmunData } from "@/data/mgmunData";

export default function MgMunPage() {

  // Animation variants
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
      {/* Hero Section */}
      <SectionHero
        title={mgmunData.hero.title}
        subtitle={mgmunData.hero.subtitle}
        description={mgmunData.hero.description}
        backgroundImage="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&h=1080&fit=crop"
        accentColor="from-blue-500 to-purple-500"
        ctaText="Register Now"
        secondaryCtaText="Learn More"
        stats={mgmunData.hero.stats}
      />

      {/* Stats Banner */}
      <StatsBanner 
        stats={mgmunData.hero.stats} 
        accentColor="from-blue-500 to-purple-500"
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
            {/* Left: Content */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                <Globe className="h-5 w-5 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">
                  Diplomatic Excellence
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-white">
                {mgmunData.about.title}
              </h2>

              <p className="text-lg text-gray-300 leading-relaxed">
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
                    <span className="text-gray-300">{highlight}</span>
                  </motion.div>
                ))}
              </div>

              <Button
                size="lg"
                className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Explore Committees
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>

            {/* Right: Image/Visual */}
            <motion.div
              variants={itemVariants}
              className="relative h-[400px] lg:h-[600px]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl" />
              <div className="absolute inset-0 backdrop-blur-3xl rounded-3xl border border-white/10" />
              
              {/* Floating Cards */}
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
                <p className="text-white font-semibold">Debate</p>
                <p className="text-blue-200 text-sm">& Diplomacy</p>
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
                <p className="text-white font-semibold">Resolution</p>
                <p className="text-purple-200 text-sm">Drafting</p>
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
                <p className="text-white font-bold text-xl text-center">MG MUN</p>
                <p className="text-indigo-200 text-sm text-center">Peace Through Dialogue</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

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
              <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
                Skills Development
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                What You'll Learn
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
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
                    <h3 className="text-xl font-bold text-white mb-2">
                      {skill.title}
                    </h3>
                    <p className="text-gray-400">{skill.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Committees Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20">
                Our Committees
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Choose Your Committee
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Select from diverse committees tailored to different experience
                levels and interests
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mgmunData.committees.map((committee, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{committee.icon}</span>
                      <Badge
                        variant="outline"
                        className={`
                          ${
                            committee.difficulty === "Beginner"
                              ? "border-green-500/50 text-green-400"
                              : committee.difficulty === "Intermediate"
                              ? "border-yellow-500/50 text-yellow-400"
                              : committee.difficulty === "Advanced"
                              ? "border-orange-500/50 text-orange-400"
                              : "border-red-500/50 text-red-400"
                          }
                        `}
                      >
                        {committee.difficulty}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      {committee.name}
                    </h3>
                    <p className="text-sm text-blue-400 mb-3">
                      {committee.abbreviation}
                    </p>
                    <p className="text-gray-400 mb-4">{committee.description}</p>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-300">
                        Key Topics:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {committee.topics.map((topic, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs bg-blue-500/10 text-blue-300"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full mt-4 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    >
                      Learn More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 bg-green-500/10 text-green-400 border-green-500/20">
                Your Journey
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                From Registration to Recognition
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                A step-by-step guide to your MUN conference experience
              </p>
            </motion.div>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />

            {/* Timeline Items */}
            <div className="space-y-12">
              {mgmunData.process.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex items-center gap-8 ${
                    index % 2 === 0
                      ? "lg:flex-row"
                      : "lg:flex-row-reverse"
                  } flex-col lg:flex-row`}
                >
                  {/* Content */}
                  <div className="flex-1">
                    <Card
                      className={`bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 ${
                        index % 2 === 0 ? "lg:ml-auto" : "lg:mr-auto"
                      } max-w-md`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            {step.step}
                          </div>
                          <h3 className="text-2xl font-bold text-white">
                            {step.title}
                          </h3>
                        </div>
                        <p className="text-gray-400 pl-16">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Icon */}
                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                      <span className="text-4xl">{step.icon}</span>
                    </div>
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                Our Impact
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Achievements & Recognition
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Join a community of accomplished delegates and future leaders
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {mgmunData.achievements.map((achievement, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                      {achievement.icon}
                    </div>
                    <h3 className="text-4xl font-bold text-white mb-2">
                      {achievement.count}
                    </h3>
                    <p className="text-xl font-semibold text-gray-300 mb-2">
                      {achievement.title}
                    </p>
                    <p className="text-sm text-gray-400">
                      {achievement.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events Section */}
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
              <Badge className="mb-4 bg-red-500/10 text-red-400 border-red-500/20">
                Upcoming Conferences
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Join Our Next Event
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Register now for our upcoming conferences and workshops
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {mgmunData.upcomingEvents.map((event, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-red-500/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <Badge
                      className={`mb-4 ${
                        event.status === "Registration Open"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      {event.status}
                    </Badge>

                    <h3 className="text-xl font-bold text-white mb-4">
                      {event.name}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-sm">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users className="h-4 w-4 text-purple-400" />
                        <span className="text-sm">
                          {event.delegates} Delegates
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Globe className="h-4 w-4 text-orange-400" />
                        <span className="text-sm">
                          {event.committees} Committees
                        </span>
                      </div>
                    </div>

                    <Button
                      className={`w-full ${
                        event.status === "Registration Open"
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                          : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                      }`}
                      disabled={event.status !== "Registration Open"}
                    >
                      {event.status === "Registration Open"
                        ? "Register Now"
                        : "Notify Me"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                Student Stories
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                What Our Delegates Say
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Hear from students who transformed their skills through MG MUN
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {mgmunData.testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-5 w-5 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>

                    <p className="text-gray-300 mb-6 italic">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {testimonial.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.div variants={itemVariants}>
              <Badge className="mb-4 bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                FAQ
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-400">
                Everything you need to know about MG MUN
              </p>
            </motion.div>
          </motion.div>

          <motion.div variants={containerVariants} className="space-y-4">
            {mgmunData.faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-start gap-2">
                      <span className="text-blue-400 flex-shrink-0">Q:</span>
                      <span>{faq.question}</span>
                    </h3>
                    <p className="text-gray-400 pl-6">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-12 md:p-16"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }} />
            </div>

            <div className="relative text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Ready to Begin Your Diplomatic Journey?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join hundreds of students who have transformed their skills
                through MG MUN. Register now for our next conference.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                >
                  Register Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Download Brochure
                  <ExternalLink className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Additional Info */}
              <div className="mt-8 flex flex-wrap justify-center gap-8 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Expert Mentorship</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>International Recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Certificate of Participation</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}