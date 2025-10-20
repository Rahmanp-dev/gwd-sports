import type { Sport, Testimonial, Event, Stat, Feature } from "@/types/landing";

export const SPORTS: Sport[] = [
  {
    id: "football",
    name: "Football",
    icon: "⚽",
    description:
      "Master the beautiful game with world-class coaching and state-of-the-art facilities.",
    image:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop",
    benefits: ["Teamwork", "Endurance", "Strategy", "Discipline"],
    ageGroup: "6-18 years",
    duration: "3 months",
  },
  {
    id: "basketball",
    name: "Basketball",
    icon: "🏀",
    description:
      "Elevate your game with professional training in shooting, dribbling, and court strategy.",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop",
    benefits: ["Agility", "Coordination", "Teamwork", "Speed"],
    ageGroup: "7-18 years",
    duration: "3 months",
  },
  {
    id: "tennis",
    name: "Tennis",
    icon: "🎾",
    description:
      "Perfect your serve and backhand with expert coaches on premium courts.",
    image:
      "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop",
    benefits: ["Focus", "Precision", "Stamina", "Mental Strength"],
    ageGroup: "5-18 years",
    duration: "4 months",
  },
  {
    id: "tabletennis",
    name: "Table Tennis",
    icon: "🏓",
    description:
      "Develop lightning-fast reflexes and precision with our table tennis program.",
    image:
      "https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&h=600&fit=crop",
    benefits: ["Reflexes", "Hand-Eye Coordination", "Strategy", "Focus"],
    ageGroup: "6-18 years",
    duration: "2 months",
  },
  {
    id: "swimming",
    name: "Swimming",
    icon: "🏊",
    description:
      "Learn all strokes and techniques in our Olympic-sized, temperature-controlled pool.",
    image:
      "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop",
    benefits: ["Full Body Workout", "Breathing Control", "Endurance", "Safety"],
    ageGroup: "4-18 years",
    duration: "3 months",
  },
  {
    id: "badminton",
    name: "Badminton",
    icon: "🏸",
    description:
      "Master footwork, smashes, and court coverage with professional guidance.",
    image:
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=600&fit=crop",
    benefits: ["Agility", "Speed", "Flexibility", "Strategy"],
    ageGroup: "6-18 years",
    duration: "3 months",
  },
  {
    id: "cricket",
    name: "Cricket",
    icon: "🏏",
    description:
      "Train in batting, bowling, and fielding with experienced coaches and modern equipment.",
    image:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&h=600&fit=crop",
    benefits: ["Hand-Eye Coordination", "Teamwork", "Strategy", "Patience"],
    ageGroup: "7-18 years",
    duration: "4 months",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Professional Athlete",
    sport: "Tennis",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    rating: 5,
    content:
      "Master Grade transformed my game completely. The coaches are world-class and the facilities are exceptional. I went from a beginner to competing at state level in just 2 years!",
    achievement: "State Champion 2024",
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Student",
    sport: "Basketball",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    rating: 5,
    content:
      "The structured training program and personalized attention helped me improve my skills dramatically. The team here genuinely cares about each student's progress.",
    achievement: "District MVP",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Parent",
    sport: "Swimming",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    rating: 5,
    content:
      "My daughter has gained so much confidence since joining Master Grade. The coaches are patient, professional, and create a safe learning environment.",
  },
  {
    id: "4",
    name: "David Kumar",
    role: "Professional Athlete",
    sport: "Football",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    rating: 5,
    content:
      "Best sports academy I've trained at. The tactical training and fitness programs are top-notch. I secured a college scholarship thanks to Master Grade!",
    achievement: "College Scholarship",
  },
  {
    id: "5",
    name: "Priya Sharma",
    role: "Student",
    sport: "Badminton",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    rating: 5,
    content:
      "The training methodology is fantastic. I've learned techniques I never knew existed. The community here is supportive and motivating.",
    achievement: "National Qualifier",
  },
  {
    id: "6",
    name: "James Wilson",
    role: "Student",
    sport: "Cricket",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    rating: 5,
    content:
      "Master Grade provided me with the platform to excel. The modern equipment and expert coaching have been instrumental in my development.",
  },
];

export const EVENTS: Event[] = [
  {
    id: "1",
    title: "Inter-Academy Football Championship",
    date: "2025-11-15",
    time: "09:00 AM",
    location: "Master Grade Main Stadium",
    category: "tournament",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=500&fit=crop",
    description:
      "Annual football championship featuring top academies from across the region. Open to all age groups.",
    registrationUrl: "#",
    isFeatured: true,
  },
  {
    id: "2",
    title: "Professional Basketball Workshop",
    date: "2025-11-20",
    time: "02:00 PM",
    location: "Basketball Arena",
    category: "workshop",
    image:
      "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&h=500&fit=crop",
    description:
      "Learn from professional players and coaches. Limited seats available.",
    registrationUrl: "#",
    isFeatured: true,
  },
  {
    id: "3",
    title: "Swimming Excellence Training Camp",
    date: "2025-11-25",
    time: "06:00 AM",
    location: "Aquatic Center",
    category: "training",
    image:
      "https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=500&fit=crop",
    description: "5-day intensive training camp for competitive swimmers.",
    registrationUrl: "#",
  },
  {
    id: "4",
    title: "Table Tennis Tournament",
    date: "2025-12-01",
    time: "10:00 AM",
    location: "Indoor Sports Complex",
    category: "tournament",
    image:
      "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&h=500&fit=crop",
    description: "District level table tennis championship. Register now!",
    registrationUrl: "#",
  },
  {
    id: "5",
    title: "Tennis Skills Masterclass",
    date: "2025-12-05",
    time: "03:00 PM",
    location: "Tennis Courts",
    category: "workshop",
    image:
      "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&h=500&fit=crop",
    description: "Master advanced techniques with our expert coaches.",
    registrationUrl: "#",
  },
  {
    id: "6",
    title: "Cricket Training Session",
    date: "2025-12-10",
    time: "04:00 PM",
    location: "Cricket Ground",
    category: "training",
    image:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=500&fit=crop",
    description: "Specialized coaching for batting and bowling techniques.",
    registrationUrl: "#",
  },
];

export const STATS: Stat[] = [
  {
    id: "1",
    label: "Active Students",
    value: "2,500+",
    icon: "👥",
  },
  {
    id: "2",
    label: "Expert Coaches",
    value: "50+",
    icon: "🏆",
  },
  {
    id: "3",
    label: "Sports Programs",
    value: "7",
    icon: "⚡",
  },
  {
    id: "4",
    label: "Success Rate",
    value: "95%",
    icon: "📈",
  },
];

export const FEATURES: Feature[] = [
  {
    id: "1",
    title: "World-Class Facilities",
    description:
      "State-of-the-art equipment and infrastructure designed for optimal training.",
    icon: "🏟️",
  },
  {
    id: "2",
    title: "Expert Coaching",
    description:
      "Learn from certified professionals with years of competitive experience.",
    icon: "👨‍🏫",
  },
  {
    id: "3",
    title: "Personalized Training",
    description: "Custom programs tailored to your skill level and goals.",
    icon: "📊",
  },
  {
    id: "4",
    title: "Flexible Schedules",
    description: "Morning, evening, and weekend batches to fit your lifestyle.",
    icon: "⏰",
  },
  {
    id: "5",
    title: "Performance Tracking",
    description:
      "Regular assessments and progress reports to monitor improvement.",
    icon: "📈",
  },
  {
    id: "6",
    title: "Safe Environment",
    description:
      "CCTV surveillance, trained staff, and comprehensive safety protocols.",
    icon: "🛡️",
  },
];
