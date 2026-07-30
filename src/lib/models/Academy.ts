import mongoose, { Schema, Document } from "mongoose";

export interface IStarPlayer {
  name: string;
  role: string;
  badge?: string;
  avatarUrl?: string;
}

export interface IRegisteredTeam {
  name: string;
  category: string;
  winRate?: string;
}

export interface IProgram {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

export interface ITestimonial {
  name: string;
  role?: string;
  quote: string;
  avatarUrl?: string;
}

export interface IGalleryItem {
  url: string;
  caption?: string;
}

export interface IHighlight {
  /** Key into WhyChooseUs's ICON_BY_KEY map, not a component. */
  icon?: string;
  title: string;
  description?: string;
}

export interface ICustomStat {
  /** Key into StatsSection's STAT_ICON_BY_KEY map. */
  icon?: string;
  label: string;
  value: number;
  /** e.g. " yrs", "+", "%". Rendered immediately after the counted value. */
  suffix?: string;
}

export interface IVideoSection {
  provider?: 'youtube' | 'instagram';
  url?: string;
  heading?: string;
  subheading?: string;
  layout?: 'cinematic' | 'framed' | 'split';
}

export interface IHomepageSections {
  programs: boolean;
  achievements: boolean;
  testimonials: boolean;
  gallery: boolean;
  stats: boolean;
  video?: boolean;
  /**
   * Order the owner has dragged sections into. Each value is one of the five
   * section keys above. Missing keys are appended after the list in their
   * default order, so a document written before this field existed shows the
   * original order rather than hiding sections.
   */
  order?: string[];
}

export interface IAcademy extends Document {
  name: string;
  description: string;
  location: string;
  address: string;
  sports: string[];
  trainers: mongoose.Types.ObjectId[];
  students: mongoose.Types.ObjectId[];
  fees: {
    monthly: number;
    quarterly: number;
    halfYearly: number;
    yearly: number;
  };
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  facilities: string[];
  timings: {
    opening: string;
    closing: string;
    workingDays: string[];
  };
  capacity: number;
  images: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  slug: string;
  rzp_account?: string;
  /**
   * Which settlement mechanism pays this academy. See src/lib/payments/settlement.ts
   * for why this is a per-academy field and not a global constant — Route
   * auto-split may not be lawfully available below a turnover threshold.
   * When unset, the strategy is inferred from the presence of rzp_account.
   */
  settlementStrategy?: string;
  theme: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    heroImages: string[];
    heroMode?: 'video' | 'carousel';
    heroVideoUrl?: string;
    /** Short credibility line above the headline, e.g. "Est. 2015 · Hyderabad". Empty renders nothing. */
    heroEyebrow?: string;
    tagline: string;
    style?: 'bold' | 'classic' | 'minimal';
    /**
     * Curated font pairing, same "presets not sliders" philosophy as `style`.
     * See FONT_PRESETS in lib/branding/palette.ts.
     */
    fontPreset?: 'sans' | 'editorial' | 'rounded';
    /** Page surface treatment. See BACKGROUND_STYLES in lib/branding/palette.ts. */
    backgroundStyle?: 'light' | 'soft' | 'gradient' | 'dark' | 'slate' | 'vivid' | 'midnight';
    /** Explicit page colour. Overrides the derived surface; text stays computed. */
    backgroundColor?: string;
    /** Gradient controls — only used when backgroundStyle === 'gradient'. */
    gradientType?: 'linear' | 'radial';
    gradientAngle?: number;
    /** 2–4 hex colours, evenly spaced. Empty = derived brand-into-white fade. */
    gradientStops?: string[];
    /** Hero logo presentation. See BrandingDraft in AcademyBrandingEditor. */
    logoScale?: number;
    logoShape?: 'square' | 'rounded' | 'circle';
    logoAlign?: 'left' | 'center' | 'right';
    logoFit?: 'contain' | 'cover';
    /**
     * Backdrop blur over hero media, 0–20px. One value drives BOTH web and
     * mobile — they previously used different hardcoded blurs, so an owner
     * approving the desktop look shipped something different to phones.
     */
    heroBlur?: number;
    /** Dark scrim strength over hero media, 0–100. */
    heroOverlay?: number;
    footer?: {
      phone?: string;
      email?: string;
      address?: string;
      aboutText?: string;
      facebookUrl?: string;
      instagramUrl?: string;
      twitterUrl?: string;
      youtubeUrl?: string;
      copyrightText?: string;
    };
    /**
     * Page density. 'compact' tightens vertical rhythm for content-heavy
     * academies; 'spacious' (default) opens it up for a premium feel.
     * Drives --section-py and --content-gap CSS variables.
     */
    density?: 'compact' | 'spacious';
    /**
     * Which section key uses --accent instead of --brand as its focal colour.
     * A single highlighted section, not a free-for-all — designers create a
     * focal point by using a contrasting colour ONCE.
     */
    accentSection?: string;
    /**
     * Overrides the platform's demo discipline cards (Football/Basketball/
     * Racing League/...) on the public page. Empty means "derive from real
     * `sports[]`" — see SportsGrid.tsx. Never falls back to the demo cards on
     * a real academy's page.
     */
    programs: IProgram[];
    testimonials: ITestimonial[];
    gallery: IGalleryItem[];
    /** "The Elite Difference" cards. Empty = platform-true defaults. */
    highlights?: IHighlight[];
    /** Owner-authored stats, shown alongside the derived ones. */
    customStats?: ICustomStat[];
    /** Embedded YouTube / Instagram showcase. */
    videoSection?: IVideoSection;
    /**
     * Which homepage sections to show. All default true so an existing
     * academy's page looks the same after this field is introduced; an owner
     * or superadmin can turn any of them off.
     */
    sections: IHomepageSections;
  };
  platformFeePercent: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  /**
   * Geofence for student QR self-check-in. See lib/attendance/geofence.ts.
   *
   * `lat`/`lng` are the GROUND, kept separate from `coordinates` (the public
   * ecosystem-map pin) because those are frequently not the same place — a pin
   * on the town centre with training on a field a kilometre away would lock
   * every student out if the pin were reused as the fence centre.
   */
  attendanceGeofence?: {
    enabled: boolean;
    radiusMeters: number;
    lat?: number;
    lng?: number;
  };
  ecosystemScore: number;
  establishedYear?: number;
  achievements: string[];
  coachName?: string;
  starPlayers?: IStarPlayer[];
  registeredTeams?: IRegisteredTeam[];
  gwdFoundingAcademy: boolean;
  verificationStatus: 'pending' | 'verified' | 'founding';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Coerces a weekday to the canonical lowercase full name.
 *
 * Accepts what is actually in the database and what people type: "Mon",
 * "MONDAY", " monday ". Anything unrecognised is returned untouched so the
 * enum still rejects genuine nonsense — this normalises, it does not silence.
 */
const WEEKDAY_BY_PREFIX: Record<string, string> = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
  sun: 'sunday',
};

export function normaliseWorkingDay(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return value;
  const canonical = WEEKDAY_BY_PREFIX[cleaned.slice(0, 3)];
  // Only accept a prefix match if the whole string is consistent with it —
  // "sunflower" must not silently become "sunday".
  if (canonical && (cleaned === canonical || cleaned === cleaned.slice(0, 3))) {
    return canonical;
  }
  return value;
}

const AcademySchema = new Schema<IAcademy>({
  name: {
    type: String,
    required: [true, 'Academy name is required'],
    trim: true,
    minlength: [3, 'Academy name must be at least 3 characters'],
    maxlength: [100, 'Academy name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  sports: [{
    type: String,
    required: true,
    trim: true,
    lowercase: true
  }],
  trainers: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }], 
  students: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }],
  fees: {
    monthly: {
      type: Number,
      required: true,
      min: [0, 'Monthly fee cannot be negative']
    },
    quarterly: {
      type: Number,
      required: true,
      min: [0, 'Quarterly fee cannot be negative']
    },
    halfYearly: {
      type: Number,
      required: true,
      min: [0, 'Half-yearly fee cannot be negative'],
      default: 0
    },
    yearly: {
      type: Number,
      required: true,
      min: [0, 'Yearly fee cannot be negative']
    },
    /**
     * Day of month fees fall due, academy-wide. Drives the T-5 / due-date /
     * T+3 reminder cadence in lib/messaging/reminders.ts.
     *
     * Capped at 28 for the same reason as the per-student field: every month
     * has a 28th, so a due day can never fall into a month that lacks it.
     */
    dueDayOfMonth: {
      type: Number,
      min: [1, 'Due day must be between 1 and 28'],
      max: [28, 'Due day must be between 1 and 28'],
      default: 5
    }
  },
  contactInfo: {
    name: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      match: [/^[+]?[\d\s\-\(\)]{10,}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  facilities: [{
    type: String,
    trim: true
  }],
  timings: {
    opening: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    closing: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    /**
     * Canonical form is lowercase full names. Real documents in the database
     * hold "Mon", "Tue", "Wed" — written before this enum existed.
     *
     * That mismatch is not cosmetic: Mongoose validates the ENTIRE document on
     * save(), so a legacy value here failed any unrelated write to the academy
     * and took the whole student import down with it. The setter coerces on
     * write, so every save from now on normalises rather than rejects. Existing
     * documents are fixed by scripts/normalize-working-days.js.
     */
    workingDays: [{
      type: String,
      set: normaliseWorkingDay,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  capacity: {
    type: Number,
    required: true,
    min: [1, 'Capacity must be at least 1']
  },
  images: [{
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(url);
      },
      message: 'Images must be valid image URLs'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  slug: {
    type: String,
    required: [true, 'Academy slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  rzp_account: {
    type: String
  },
  settlementStrategy: {
    type: String,
    enum: ['razorpay_route_auto_split', 'collect_and_manual_payout'],
  },
  theme: {
    primaryColor: { type: String, default: '#7c3aed' },
    accentColor: { type: String, default: '#c8971a' },
    logoUrl: { type: String, default: '' },
    heroImages: [{ type: String }],
    tagline: { type: String, default: '' },
    /**
     * How the page feels: corner radius, shadow weight and how heavily the
     * brand colour tints surfaces. Three coherent presets rather than a pile of
     * sliders — see lib/branding/palette.ts for why.
     */
    style: {
      type: String,
      enum: ['bold', 'classic', 'minimal'],
      default: 'classic'
    },
    fontPreset: {
      type: String,
      enum: ['sans', 'editorial', 'rounded'],
      default: 'sans'
    },
    backgroundStyle: {
      type: String,
      enum: ['light', 'soft', 'gradient', 'dark', 'slate', 'vivid', 'midnight'],
      default: 'light'
    },
    /** Empty means "derive the surface from the brand colour". */
    backgroundColor: { type: String, default: '' },
    /**
     * Gradient controls. Only consulted when backgroundStyle === 'gradient'.
     * Empty gradientStops falls back to the original brand-into-white fade,
     * so academies saved before these fields existed are unchanged.
     */
    gradientType: { type: String, enum: ['linear', 'radial'], default: 'linear' },
    gradientAngle: { type: Number, default: 160, min: 0, max: 360 },
    gradientStops: [{ type: String }],
    logoScale: { type: Number, default: 100, min: 40, max: 220 },
    logoShape: { type: String, enum: ['square', 'rounded', 'circle'], default: 'rounded' },
    logoAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
    logoFit: { type: String, enum: ['contain', 'cover'], default: 'contain' },
    heroBlur: { type: Number, default: 3, min: 0, max: 20 },
    heroOverlay: { type: Number, default: 55, min: 0, max: 100 },
    heroMode: { type: String, enum: ['video', 'carousel'], default: 'video' },
    heroVideoUrl: { type: String, default: '' },
    heroEyebrow: { type: String, default: '', maxlength: 60 },
    footer: {
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      address: { type: String, default: '' },
      aboutText: { type: String, default: '' },
      facebookUrl: { type: String, default: '' },
      instagramUrl: { type: String, default: '' },
      twitterUrl: { type: String, default: '' },
      youtubeUrl: { type: String, default: '' },
      copyrightText: { type: String, default: '' },
    },
    programs: [{
      id: { type: String, required: true },
      label: { type: String, required: true },
      emoji: { type: String },
      description: { type: String }
    }],
    testimonials: [{
      name: { type: String, required: true },
      role: { type: String },
      quote: { type: String, required: true },
      avatarUrl: { type: String }
    }],
    gallery: [{
      url: { type: String, required: true },
      caption: { type: String }
    }],
    /**
     * "The Elite Difference" cards (WhyChooseUs.tsx).
     *
     * WAS MISSING ENTIRELY. WhyChooseUs has read `theme.highlights` since it
     * was written, but the field was never added here — and Mongoose strips
     * unknown paths on save by default, so anything an owner authored was
     * silently discarded and the platform-true defaults always rendered.
     * That is why this section could not be edited.
     */
    highlights: [{
      icon: { type: String, default: 'award' },
      title: { type: String, required: true },
      description: { type: String, default: '' },
    }],
    /**
     * Owner-authored figures for the stats strip, shown ALONGSIDE the four
     * derived ones (students, achievements, disciplines, years active).
     * Derived stats stay computed — these are for facts the platform has no
     * way to know, e.g. "3 grounds" or "12 district selections".
     */
    customStats: [{
      icon: { type: String, default: 'trophy' },
      label: { type: String, required: true },
      value: { type: Number, required: true },
      suffix: { type: String, default: '' },
    }],
    /** Embedded YouTube / Instagram showcase section. */
    videoSection: {
      provider: { type: String, enum: ['youtube', 'instagram'], default: 'youtube' },
      url: { type: String, default: '' },
      heading: { type: String, default: '' },
      subheading: { type: String, default: '' },
      layout: { type: String, enum: ['cinematic', 'framed', 'split'], default: 'cinematic' },
    },
    density: {
      type: String,
      enum: ['compact', 'spacious'],
      default: 'spacious'
    },
    accentSection: { type: String, default: '' },
    sections: {
      programs: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      testimonials: { type: Boolean, default: true },
      gallery: { type: Boolean, default: true },
      stats: { type: Boolean, default: true },
      // Defaults OFF: an empty video section would render a dead frame on
      // every existing academy's page the moment this shipped.
      video: { type: Boolean, default: false },
      order: [{ type: String }]
    }
  },
  platformFeePercent: {
    type: Number,
    default: 1,
    min: 0,
    max: 10
  },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  /**
   * Student QR check-in geofence. Off by default: switching it on for every
   * existing academy would start refusing check-ins at academies that have
   * never set a ground location.
   */
  attendanceGeofence: {
    enabled: { type: Boolean, default: false },
    radiusMeters: { type: Number, default: 200, min: 50, max: 5000 },
    // The ground. Empty falls back to `coordinates` — see resolveGeofenceCentre.
    lat: { type: Number },
    lng: { type: Number },
  },
  ecosystemScore: { type: Number, default: 0, min: 0, max: 100 },
  establishedYear: { type: Number },
  achievements: [{ type: String, trim: true }],
  coachName: { type: String, trim: true },
  starPlayers: [{
    name: { type: String, required: true },
    role: { type: String, required: true },
    badge: { type: String, default: 'STATE' },
    avatarUrl: { type: String }
  }],
  registeredTeams: [{
    name: { type: String, required: true },
    category: { type: String, required: true },
    winRate: { type: String, default: '75%' }
  }],
  gwdFoundingAcademy: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'founding'],
    default: 'pending'
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
AcademySchema.index({ ownerId: 1 });
AcademySchema.index({ location: 1, sports: 1 });
AcademySchema.index({ isActive: 1 });
AcademySchema.index({ createdBy: 1 });
AcademySchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

// Virtual for student count
AcademySchema.virtual('studentCount').get(function() {
  return this.students?.length || 0;
});

// Virtual for trainer count
AcademySchema.virtual('trainerCount').get(function() {
  return this.trainers?.length || 0;
});

export const Academy = mongoose.models.Academy || mongoose.model<IAcademy>("Academy", AcademySchema);

export default Academy;
