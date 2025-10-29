import {
  Trophy,
  Users,
  Target,
  TrendingUp,
  Shield,
  Dumbbell,
} from "lucide-react";
import type { Event } from "@/components/shared/EventsSection";
import type { Feature } from "@/components/shared/FeaturesGrid";

export const MGBC_HERO_DATA = {
  title: "MASTER GRADE BASKETBALL",
  subtitle: "Elite Basketball Club",
  description:
    "Elevate your game to championship level. Train with professional coaches, compete in elite tournaments, and join a legacy of basketball excellence.",
  icon: "🏀",
  backgroundImage:
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&h=1080&fit=crop",
  stats: [
    { value: "350+", label: "Players" },
    { value: "18", label: "Championships" },
    { value: "92%", label: "Win Rate" },
  ],
};

export const MGBC_EVENTS: Event[] = [
  {
    title: "MGBC Premier League Finals",
    date: "Feb 5-12, 2026",
    location: "Master Grade Basketball Arena",
    participants: "24 Elite Teams",
    image:
      "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1200&h=800&fit=crop",
    color: "from-orange-600 to-red-500",
  },
  {
    title: "Youth All-Star Showcase",
    date: "Mar 15-17, 2026",
    location: "National Sports Complex",
    participants: "100+ Young Talents",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&h=800&fit=crop",
    color: "from-amber-600 to-orange-500",
  },
  {
    title: "3-on-3 Street Ball Tournament",
    date: "Apr 8-10, 2026",
    location: "MGBC Outdoor Courts",
    participants: "64 Teams",
    image:
      "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=1200&h=800&fit=crop",
    color: "from-yellow-600 to-amber-500",
  },
  {
    title: "International Basketball Camp",
    date: "May 20-28, 2026",
    location: "MGBC Training Facility",
    participants: "200+ Athletes Worldwide",
    image:
      "https://images.unsplash.com/photo-1594623930572-300a3011d9ae?w=1200&h=800&fit=crop",
    color: "from-red-600 to-orange-500",
  },
];

export const MGBC_FEATURES: Feature[] = [
  {
    icon: Trophy,
    title: "Championship Coaching",
    description:
      "Learn from NBA-level coaches and former professional basketball players",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Target,
    title: "Skill Development",
    description:
      "Master shooting, dribbling, defense, and advanced basketball techniques",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Users,
    title: "Team Building",
    description:
      "Develop chemistry, leadership, and teamwork through structured training",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: TrendingUp,
    title: "Performance Analytics",
    description:
      "Advanced stats tracking and video analysis to elevate your game",
    gradient: "from-red-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Injury Prevention",
    description:
      "Professional sports medicine and comprehensive wellness programs",
    gradient: "from-orange-600 to-red-600",
  },
  {
    icon: Dumbbell,
    title: "Strength & Conditioning",
    description:
      "NBA-style training facilities with personalized fitness programs",
    gradient: "from-amber-600 to-orange-600",
  },
];

export const MGBC_PROGRAMS = [
  {
    title: "Mini Ballers",
    age: "6-10 years",
    description: "Introduction to basketball fundamentals and fun gameplay",
    color: "from-yellow-500 to-amber-400",
  },
  {
    title: "Junior Academy",
    age: "11-14 years",
    description: "Advanced skills and competitive league participation",
    color: "from-amber-500 to-orange-400",
  },
  {
    title: "Elite Training",
    age: "15-18 years",
    description: "Professional-level preparation and scholarship pathways",
    color: "from-orange-500 to-red-400",
  },
];

export const MGBC_TRAINING_FOCUS = [
  {
    title: "Ball Handling",
    icon: "⛹️",
    description:
      "Master dribbling techniques, crossovers, and ball control under pressure",
    gradient: "from-orange-500 to-red-500",
  },
  {
    title: "Shooting Excellence",
    icon: "🎯",
    description:
      "Perfect your form, range, and accuracy from anywhere on the court",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "Defensive Mastery",
    icon: "🛡️",
    description:
      "Learn lockdown defense, positioning, and reading offensive plays",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    title: "Game IQ",
    icon: "🧠",
    description:
      "Develop basketball intelligence, court vision, and strategic thinking",
    gradient: "from-red-500 to-orange-500",
  },
];

export const MGBC_ACHIEVEMENTS = [
  {
    icon: Trophy,
    value: "18",
    label: "Championships Won",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    icon: Users,
    value: "350+",
    label: "Active Players",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: Target,
    value: "92%",
    label: "Win Rate",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: TrendingUp,
    value: "50+",
    label: "Scholarship Athletes",
    gradient: "from-red-500 to-orange-500",
  },
];
