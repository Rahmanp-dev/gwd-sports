import { Calendar, Trophy, Users, Sparkles, Star, Rocket } from "lucide-react";
import type { Event } from "@/components/shared/EventsSection";
import type { Feature } from "@/components/shared/FeaturesGrid";

export const GALAXY_EVENTS_HERO_DATA = {
  title: "GALAXY EVENTS",
  subtitle: "Where Champions Unite",
  description:
    "Experience the ultimate convergence of sports, culture, and excellence. From championship tournaments to star-studded galas, Galaxy Events brings together the best of Master Grade in spectacular fashion.",
  icon: "🌟",
  backgroundImage:
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop",
  stats: [
    { value: "50+", label: "Annual Events" },
    { value: "10K+", label: "Attendees" },
    { value: "100%", label: "Memorable" },
  ],
};

export const GALAXY_MAJOR_EVENTS: Event[] = [
  {
    title: "Master Grade Championship Gala",
    date: "December 15, 2025",
    location: "Grand Palace Convention Center",
    participants: "500+ Champions & VIPs",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&h=800&fit=crop",
    color: "from-purple-600 to-indigo-500",
  },
  {
    title: "Galaxy Sports Festival",
    date: "January 20-22, 2026",
    location: "Master Grade Complex",
    participants: "2000+ Athletes Across All Sports",
    image:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1200&h=800&fit=crop",
    color: "from-violet-600 to-purple-500",
  },
  {
    title: "Youth Excellence Awards Night",
    date: "February 28, 2026",
    location: "Star Theater & Events Hall",
    participants: "300+ Young Achievers",
    image:
      "https://images.unsplash.com/photo-1464047736614-af63643285bf?w=1200&h=800&fit=crop",
    color: "from-fuchsia-600 to-pink-500",
  },
  {
    title: "International Sports Summit",
    date: "March 10-12, 2026",
    location: "Global Sports Convention Center",
    participants: "1000+ International Delegates",
    image:
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1200&h=800&fit=crop",
    color: "from-indigo-600 to-blue-500",
  },
  {
    title: "Master Grade Alumni Meet",
    date: "April 5, 2026",
    location: "Heritage Sports Club",
    participants: "800+ Alumni & Families",
    image:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop",
    color: "from-purple-500 to-violet-500",
  },
  {
    title: "Community Carnival & Fun Fair",
    date: "May 18-19, 2026",
    location: "MG Open Grounds",
    participants: "5000+ Community Members",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop",
    color: "from-pink-600 to-rose-500",
  },
];

export const GALAXY_EVENT_CATEGORIES = [
  {
    title: "Championship Events",
    icon: "🏆",
    description:
      "Premier tournaments across football, basketball, racing and more",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    title: "Awards & Galas",
    icon: "⭐",
    description:
      "Star-studded ceremonies celebrating excellence and achievement",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    title: "Community Gatherings",
    icon: "🎪",
    description:
      "Fun-filled family events, carnivals, and community celebrations",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    title: "Workshops & Summits",
    icon: "🎓",
    description:
      "Educational conferences, skill development workshops, and seminars",
    gradient: "from-indigo-500 to-blue-500",
  },
];

export const GALAXY_FEATURES: Feature[] = [
  {
    icon: Calendar,
    title: "Year-Round Calendar",
    description:
      "Continuous stream of exciting events throughout the year for all ages",
    gradient: "from-purple-500 to-indigo-500",
  },
  {
    icon: Trophy,
    title: "Championship Hosting",
    description:
      "World-class facilities and organization for major sporting tournaments",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Community Focused",
    description:
      "Events designed to bring together athletes, families, and supporters",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Premium Experiences",
    description: "VIP packages, exclusive access, and unforgettable moments",
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: Star,
    title: "Celebrity Appearances",
    description: "Meet sports stars, legends, and inspirational personalities",
    gradient: "from-purple-600 to-fuchsia-600",
  },
  {
    icon: Rocket,
    title: "Innovation & Tech",
    description: "Cutting-edge event technology and immersive experiences",
    gradient: "from-violet-600 to-purple-600",
  },
];

export const GALAXY_EVENT_TYPES = [
  {
    title: "Sports Tournaments",
    age: "All Ages",
    description: "Competitive championships across multiple sports disciplines",
    color: "from-purple-500 to-indigo-400",
  },
  {
    title: "Awards Ceremonies",
    age: "Invitation Only",
    description: "Prestigious recognition events celebrating top performers",
    color: "from-violet-500 to-purple-400",
  },
  {
    title: "Community Events",
    age: "Open to All",
    description: "Family-friendly gatherings, fairs, and celebration days",
    color: "from-fuchsia-500 to-pink-400",
  },
];

export const GALAXY_STATS = [
  {
    icon: Calendar,
    value: "50+",
    label: "Events Annually",
    gradient: "from-purple-500 to-violet-500",
  },
  {
    icon: Users,
    value: "10K+",
    label: "Total Attendees",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Trophy,
    value: "25+",
    label: "Championships",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Star,
    value: "100+",
    label: "Celebrity Guests",
    gradient: "from-indigo-500 to-purple-500",
  },
];

export const UPCOMING_HIGHLIGHTS = [
  {
    title: "MG Annual Awards Night",
    date: "Nov 30, 2025",
    location: "Grand Ballroom",
    participants: "300+ Guests",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop",
    color: "from-purple-600 to-indigo-500",
    featured: true,
  },
  {
    title: "Winter Sports Carnival",
    date: "Dec 10-12, 2025",
    location: "MG Sports Complex",
    participants: "3000+ Participants",
    image:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop",
    color: "from-violet-600 to-purple-500",
    featured: true,
  },
];
