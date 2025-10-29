import { Users, Trophy, Globe, Award } from "lucide-react";

export const mgmunData = {
  hero: {
    title: "MG Model United Nations",
    subtitle: "PEACE THROUGH DIALOGUE",
    description:
      "Empowering young minds to become global leaders through diplomatic excellence, critical thinking, and collaborative problem-solving.",
    stats: [
      {
        label: "Conferences Hosted",
        value: "15+",
        icon: Trophy,
        gradient: "from-blue-500 to-cyan-500",
      },
      {
        label: "Student Delegates",
        value: "500+",
        icon: Users,
        gradient: "from-purple-500 to-pink-500",
      },
      {
        label: "Countries Represented",
        value: "50+",
        icon: Globe,
        gradient: "from-green-500 to-emerald-500",
      },
      {
        label: "Award Winners",
        value: "200+",
        icon: Award,
        gradient: "from-orange-500 to-red-500",
      },
    ],
  },

  about: {
    title: "What is MG MUN?",
    description:
      "MG Model United Nations is a premier platform that simulates real UN proceedings, where students represent different countries, engage in debates, draft resolutions, and develop solutions to global challenges. Our program focuses on developing leadership, public speaking, research, negotiation, and critical thinking skills.",
    highlights: [
      "Authentic UN committee simulations",
      "Professional training workshops",
      "International networking opportunities",
      "Award-winning delegate programs",
      "Expert mentorship and guidance",
      "Crisis committee experiences",
    ],
  },

  committees: [
    {
      name: "United Nations Security Council",
      abbreviation: "UNSC",
      description:
        "Address pressing international security issues and peacekeeping operations.",
      icon: "🛡️",
      difficulty: "Advanced",
      topics: [
        "Conflict Resolution",
        "Peacekeeping Missions",
        "Counter-Terrorism",
      ],
    },
    {
      name: "United Nations General Assembly",
      abbreviation: "UNGA",
      description:
        "Discuss global issues affecting all member nations with inclusive participation.",
      icon: "🌍",
      difficulty: "Intermediate",
      topics: ["Sustainable Development", "Human Rights", "Climate Action"],
    },
    {
      name: "Economic and Social Council",
      abbreviation: "ECOSOC",
      description:
        "Focus on economic development, social progress, and humanitarian issues.",
      icon: "💼",
      difficulty: "Intermediate",
      topics: ["Economic Development", "Social Welfare", "Education Access"],
    },
    {
      name: "Human Rights Council",
      abbreviation: "HRC",
      description:
        "Promote and protect human rights around the world through dialogue and cooperation.",
      icon: "⚖️",
      difficulty: "Advanced",
      topics: ["Civil Liberties", "Discrimination", "Freedom of Expression"],
    },
    {
      name: "International Press Corps",
      abbreviation: "IPC",
      description:
        "Report on committee proceedings and create engaging media content.",
      icon: "📰",
      difficulty: "Beginner",
      topics: ["Journalism", "Media Coverage", "Public Relations"],
    },
    {
      name: "Crisis Committee",
      abbreviation: "CRISIS",
      description:
        "Navigate fast-paced scenarios requiring quick decision-making and strategic thinking.",
      icon: "⚡",
      difficulty: "Expert",
      topics: ["Emergency Response", "Strategic Planning", "Real-time Crisis"],
    },
  ],

  skills: [
    {
      title: "Public Speaking",
      description:
        "Master the art of articulating ideas confidently in front of large audiences.",
      icon: "🎤",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Critical Thinking",
      description:
        "Develop analytical skills to evaluate complex global issues and propose solutions.",
      icon: "🧠",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Negotiation & Diplomacy",
      description:
        "Learn to build consensus, form alliances, and achieve diplomatic objectives.",
      icon: "🤝",
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Research & Writing",
      description:
        "Conduct thorough research and draft compelling position papers and resolutions.",
      icon: "📚",
      color: "from-orange-500 to-red-500",
    },
    {
      title: "Leadership",
      description:
        "Take initiative, guide discussions, and inspire collaborative action.",
      icon: "👑",
      color: "from-yellow-500 to-amber-500",
    },
    {
      title: "Global Awareness",
      description:
        "Understand international relations, geopolitics, and cultural diversity.",
      icon: "🌐",
      color: "from-indigo-500 to-blue-500",
    },
  ],

  process: [
    {
      step: 1,
      title: "Registration",
      description:
        "Sign up for the conference and select your preferred committee.",
      icon: "📝",
    },
    {
      step: 2,
      title: "Country Allocation",
      description: "Receive your country assignment and research materials.",
      icon: "🗺️",
    },
    {
      step: 3,
      title: "Preparation",
      description: "Attend training sessions and prepare your position papers.",
      icon: "📖",
    },
    {
      step: 4,
      title: "Conference",
      description: "Participate in committee sessions and debate resolutions.",
      icon: "🏛️",
    },
    {
      step: 5,
      title: "Awards & Recognition",
      description: "Outstanding delegates receive awards and certificates.",
      icon: "🏆",
    },
  ],

  achievements: [
    {
      title: "Best Delegate Awards",
      count: "50+",
      description: "Top performing delegates recognized annually",
      icon: "🥇",
    },
    {
      title: "International Conferences",
      count: "10+",
      description: "Students participated in global MUN events",
      icon: "✈️",
    },
    {
      title: "University Acceptances",
      count: "95%",
      description: "MUN participants accepted to top universities",
      icon: "🎓",
    },
    {
      title: "Leadership Positions",
      count: "100+",
      description: "Students holding leadership roles in various fields",
      icon: "💼",
    },
  ],

  upcomingEvents: [
    {
      name: "MG MUN Annual Conference 2025",
      date: "March 15-17, 2025",
      location: "Mumbai, Maharashtra",
      committees: 6,
      delegates: 200,
      status: "Registration Open",
    },
    {
      name: "Beginner's MUN Workshop",
      date: "January 20, 2025",
      location: "Online",
      committees: 2,
      delegates: 50,
      status: "Registration Open",
    },
    {
      name: "Advanced Diplomacy Training",
      date: "February 10-11, 2025",
      location: "Pune, Maharashtra",
      committees: 3,
      delegates: 75,
      status: "Coming Soon",
    },
  ],

  testimonials: [
    {
      name: "Aarav Sharma",
      role: "Former UNSC Delegate",
      image: "/assets/testimonials/student1.jpg",
      quote:
        "MG MUN transformed my public speaking abilities and gave me the confidence to pursue international relations. The experience was invaluable.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Best Delegate 2024",
      image: "/assets/testimonials/student2.jpg",
      quote:
        "The mentorship and training I received prepared me not just for MUN, but for life. I learned to think critically and communicate effectively.",
      rating: 5,
    },
    {
      name: "Rohan Mehta",
      role: "Crisis Committee Chair",
      image: "/assets/testimonials/student3.jpg",
      quote:
        "Leading a crisis committee taught me decision-making under pressure and the importance of teamwork. Skills I use every day now.",
      rating: 5,
    },
  ],

  faqs: [
    {
      question: "What is Model United Nations?",
      answer:
        "Model United Nations (MUN) is an educational simulation where students role-play as UN delegates representing different countries. Participants research, debate, and draft resolutions on real-world issues, developing valuable skills in diplomacy, public speaking, and international relations.",
    },
    {
      question: "Do I need prior MUN experience to join?",
      answer:
        "No prior experience is necessary! We welcome beginners and provide comprehensive training sessions. We have committees suitable for all experience levels, from beginner-friendly IPC to advanced Crisis Committees.",
    },
    {
      question: "What skills will I develop through MUN?",
      answer:
        "MUN helps develop critical thinking, public speaking, research, writing, negotiation, leadership, and teamwork skills. You'll also gain knowledge about international relations, current affairs, and global issues.",
    },
    {
      question: "How do I prepare for a MUN conference?",
      answer:
        "Preparation involves researching your assigned country's foreign policy, understanding committee topics, writing position papers, and practicing parliamentary procedure. We provide training workshops and study materials to help you prepare effectively.",
    },
    {
      question: "What is the registration process?",
      answer:
        "Registration is simple: fill out the online form, select your preferred committee, pay the registration fee, and submit required documents. You'll receive country allocation and preparation materials within a week.",
    },
    {
      question: "Are there awards and recognition?",
      answer:
        "Yes! We recognize outstanding delegates with Best Delegate, Outstanding Delegate, High Commendation, and Special Mention awards. All participants receive certificates of participation.",
    },
  ],
};
