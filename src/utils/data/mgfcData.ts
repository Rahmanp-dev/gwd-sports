import { Award, Users, Target, TrendingUp, Shield, Zap } from "lucide-react";
import type { Event } from "@/components/shared/EventsSection";
import type { Feature } from "@/components/shared/FeaturesGrid";

export const MGFC_HERO_DATA = {
  title: "MASTER GRADE FOOTBALL",
  subtitle: "Elite Football Academy",
  description:
    "Where football dreams become reality. Train with professional coaches, compete at the highest level, and join a legacy of champions.",
  icon: "⚽",
  backgroundImage:
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&h=1080&fit=crop",
  stats: [
    { value: "500+", label: "Players" },
    { value: "15", label: "Trophies" },
    { value: "98%", label: "Win Rate" },
  ],
};

export const MGFC_EVENTS: Event[] = [
  {
    title: "MGFC Premier League Championship",
    date: "Jan 20-28, 2026",
    location: "Master Grade Football Stadium",
    participants: "32 Teams",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=800&fit=crop",
    color: "from-green-600 to-emerald-500",
  },
  {
    title: "Youth Development Training Camp",
    date: "Feb 5-12, 2026",
    location: "MGFC Training Complex",
    participants: "200+ Young Players",
    image:
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=1200&h=800&fit=crop",
    color: "from-blue-600 to-cyan-500",
  },
  {
    title: "International Friendly Tournament",
    date: "Mar 15-20, 2026",
    location: "National Sports Arena",
    participants: "8 International Teams",
    image:
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&h=800&fit=crop",
    color: "from-orange-600 to-red-500",
  },
];

export const MGFC_FEATURES: Feature[] = [
  {
    icon: Award,
    title: "Professional Coaching",
    description:
      "Learn from UEFA-certified coaches and former professional players",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Target,
    title: "Technical Training",
    description:
      "Master ball control, passing, shooting, and tactical awareness",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "Team Development",
    description: "Build chemistry and leadership skills through team training",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: TrendingUp,
    title: "Performance Analysis",
    description: "Video analysis and data-driven insights to improve your game",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Safety & Wellness",
    description: "Comprehensive injury prevention and sports medicine support",
    gradient: "from-red-500 to-rose-500",
  },
  {
    icon: Zap,
    title: "Elite Facilities",
    description: "FIFA-standard pitches, modern gym, and recovery centers",
    gradient: "from-indigo-500 to-violet-500",
  },
];

export const MGFC_PROGRAMS = [
  {
    title: "Youth Academy",
    age: "6-12 years",
    description: "Foundation skills and love for the game",
    color: "from-green-500 to-emerald-400",
  },
  {
    title: "Teen Development",
    age: "13-17 years",
    description: "Advanced techniques and competitive play",
    color: "from-blue-500 to-cyan-400",
  },
  {
    title: "Elite Training",
    age: "18+ years",
    description: "Professional-level training and mentorship",
    color: "from-orange-500 to-amber-400",
  },
];
