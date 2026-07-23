import mongoose, { Schema, Document } from "mongoose";

export type EventStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

export interface IEvent extends Document {
  name: string;
  description: string;
  sport: string;
  startDate: Date;
  endDate?: Date;
  location: string;
  venue: string;
  participants: mongoose.Types.ObjectId[];
  maxParticipants?: number;
  links: string[];
  images: string[];
  createdBy: mongoose.Types.ObjectId;
  academyId?: mongoose.Types.ObjectId;
  status: EventStatus;
  isPublic: boolean;
  registrationOpen: boolean;
  registrationDeadline?: Date;
  entryFee?: number;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  tags: string[];
  requirements?: string;
  prizes?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  name: { 
    type: String, 
    required: [true, 'Event name is required'],
    trim: true,
    minlength: [3, 'Event name must be at least 3 characters'],
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  sport: { 
    type: String, 
    required: [true, 'Sport is required'],
    trim: true,
    lowercase: true
  },
  startDate: { 
    type: Date, 
    required: [true, 'Start date is required'],
  },
  endDate: { 
    type: Date,
  },
  location: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true
  },
  venue: { 
    type: String, 
    required: [true, 'Venue is required'],
    trim: true
  },
  participants: [{ 
    type: Schema.Types.ObjectId, 
    ref: "User" 
  }],
  maxParticipants: {
    type: Number,
    min: [1, 'Maximum participants must be at least 1'],
    max: [10000, 'Maximum participants cannot exceed 10000']
  },
  links: [{
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Links must be valid URLs'
    }
  }],
  images: [{ 
    type: String,
    validate: {
      validator: function(url: string) {
        return /^https?:\/\/.+/.test(url);
      },
      message: 'Images must be valid image URLs'
    }
  }],
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: [true, 'Creator is required']
  },
  academyId: { 
    type: Schema.Types.ObjectId, 
    ref: "Academy",
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  registrationOpen: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date,
  },
  entryFee: {
    type: Number,
    min: [0, 'Entry fee cannot be negative'],
    default: 0
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
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  requirements: {
    type: String,
    trim: true,
    maxlength: [1000, 'Requirements cannot exceed 1000 characters']
  },
  prizes: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
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

// Indexes for better performance
EventSchema.index({ sport: 1, startDate: 1 });
EventSchema.index({ status: 1, isPublic: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ academyId: 1 });
EventSchema.index({ isActive: 1 });
EventSchema.index({ registrationOpen: 1, registrationDeadline: 1 });

// Virtual for participant count
EventSchema.virtual('participantCount').get(function() {
  return this.participants?.length || 0;
});

// Virtual to check if registration is still open
EventSchema.virtual('canRegister').get(function() {
  const now = new Date();
  return this.registrationOpen && 
         this.isActive && 
         this.status === 'published' &&
         (!this.registrationDeadline || this.registrationDeadline > now) &&
         (!this.maxParticipants || this.participants.length < this.maxParticipants);
});

export const Event = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
