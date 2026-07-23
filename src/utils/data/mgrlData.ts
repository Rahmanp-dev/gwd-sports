import { Trophy, Gauge, Flag, Zap, Shield, Users } from "lucide-react";
import type { Event } from "@/components/shared/EventsSection";
import type { Feature } from "@/components/shared/FeaturesGrid";

export const MGRL_HERO_DATA = {
  title: "MASTER GRADE RACING",
  subtitle: "Elite Racing League",
  description:
    "Experience the thrill of competitive racing. Professional training, championship events, and a community of speed enthusiasts pushing limits every day.",
  icon: "🏁",
  backgroundImage:
    "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1920&h=1080&fit=crop",
  stats: [
    { value: "200+", label: "Racers" },
    { value: "24", label: "Championships" },
    { value: "95%", label: "Safety Rate" },
  ],
};

export const MGRL_EVENTS: Event[] = [
  {
    title: "MGRL Grand Prix Championship",
    date: "Jan 15-22, 2026",
    location: "Master Grade Racing Circuit",
    participants: "48 Professional Racers",
    image:
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&h=800&fit=crop",
    color: "from-amber-600 to-yellow-500",
  },
  {
    title: "Endurance Racing Challenge",
    date: "Feb 10-12, 2026",
    location: "National Speedway Track",
    participants: "32 Teams",
    image:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&h=800&fit=crop",
    color: "from-orange-600 to-red-500",
  },
  {
    title: "Youth Karting Development Series",
    date: "Mar 5-8, 2026",
    location: "MGRL Training Complex",
    participants: "100+ Young Drivers",
    image:
      "https://images.unsplash.com/photo-1566134101742-88e5c247a1c3?w=1200&h=800&fit=crop",
    color: "from-yellow-600 to-amber-500",
  },
  {
    title: "Time Attack Sprint Championship",
    date: "Apr 18-20, 2026",
    location: "City Street Circuit",
    participants: "64 Competitors",
    image:
      "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&h=800&fit=crop",
    color: "from-red-600 to-rose-500",
  },
];

export const MGRL_FEATURES: Feature[] = [
  {
    icon: Trophy,
    title: "Championship Training",
    description:
      "Learn from professional racers and certified instructors with championship-winning experience",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    icon: Gauge,
    title: "Performance Analysis",
    description:
      "Advanced telemetry systems and data analytics to optimize your racing performance",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Flag,
    title: "Race Strategy",
    description:
      "Master racing lines, overtaking techniques, and strategic decision-making",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: Zap,
    title: "Speed Development",
    description:
      "Progressive training programs to enhance reflexes, reaction time, and racing skills",
    gradient: "from-red-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Comprehensive safety training, modern equipment, and certified racing circuits",
    gradient: "from-amber-600 to-yellow-600",
  },
  {
    icon: Users,
    title: "Racing Community",
    description:
      "Join a passionate community of racers, attend events, and build lasting connections",
    gradient: "from-yellow-600 to-amber-600",
  },
];

export const MGRL_PROGRAMS = [
  {
    title: "Junior Karting",
    age: "8-14 years",
    description: "Foundation racing skills and safety in professional karts",
    color: "from-yellow-500 to-amber-400",
  },
  {
    title: "Teen Racing Academy",
    age: "15-17 years",
    description: "Advanced techniques and competitive racing experience",
    color: "from-amber-500 to-orange-400",
  },
  {
    title: "Pro Racing Program",
    age: "18+ years",
    description:
      "Championship-level training and professional racing opportunities",
    color: "from-orange-500 to-red-400",
  },
];

export const MGRL_RACING_CATEGORIES = [
  {
    title: "Go-Karting",
    icon: "🏎️",
    description: "Entry-level competitive karting on professional tracks",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    title: "Formula Racing",
    icon: "🏁",
    description: "Single-seater open-wheel racing with advanced vehicles",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    title: "GT Racing",
    icon: "🏆",
    description: "Grand Touring sports car racing championships",
    gradient: "from-orange-500 to-red-500",
  },
  {
    title: "Rally Racing",
    icon: "🚗",
    description: "Off-road and mixed-surface rally competitions",
    gradient: "from-red-500 to-rose-500",
  },
];
