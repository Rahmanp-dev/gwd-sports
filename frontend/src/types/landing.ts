export interface Sport {
  id: string;
  name: string;
  icon: string;
  description: string;
  image: string;
  benefits: string[];
  ageGroup: string;
  duration: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  sport: string;
  image: string;
  rating: number;
  content: string;
  achievement?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: "tournament" | "workshop" | "training" | "other";
  image: string;
  description: string;
  registrationUrl?: string;
  isFeatured?: boolean;
}

export interface Stat {
  id: string;
  label: string;
  value: string;
  icon: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}
