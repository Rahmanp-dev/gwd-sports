/** USER RELATED TYPE INTERFACES **/

export type UserRole = "admin" | "trainer" | "student" | "user";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  sports?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: UserRole;
  sports?: string[];
  isActive?: boolean;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  role: "admin" | "student" | "trainer" | "user";
  sports?: string[];
  isActive?: boolean;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: "admin" | "student" | "trainer" | "user";
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: PaginationMeta;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role?: UserRole;
  sports?: string[];
}

export interface ApiError {
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface UserResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface UserStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisMonth: number;
    usersByRole: {
      _id: string;
      count: number;
      active: number;
      inactive: number;
    }[];
  };
}

/** STUDENT RELATED TYPE INTERFACE **/

export interface Student {
  _id: string;
  userId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
  academyId: string;
  academy: {
    _id: string;
    name: string;
    location: string;
  };
  trainerId?: string;
  trainer?: {
    _id: string;
    name: string;
    sports: string[];
  };
  sport: string;
  level: "beginner" | "intermediate" | "advanced";
  enrollmentDate: string;
  fees: {
    amount: number;
    period: "monthly" | "quarterly" | "yearly";
    dueDate: string;
    status: "paid" | "pending" | "overdue";
  };
  kits: Kit[];
  attendance: Attendance[];
  performance: Performance[];
  createdAt: string;
  updatedAt: string;
}

/** TRAINER RELATED TYPE INTERFACE **/

export interface Trainer {
  _id: string;
  userId?: User | string;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    isActive: boolean;
  };
  academyId?: Academy | string | null;
  academy?: any[];
  sports: string[];
  students: User[] | string[];
  studentCount?: number;
  specializations: string[];
  qualifications: IQualification[];
  experience: IExperience[];
  hourlyRate?: number;
  availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
      _id?: string;
    }[];
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  joinedDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ITrainerProfile {
  _id: string;
  userId: string;
  academyId: string | null;
  sports: string[];
  students: string[];
  specializations: string[];
  qualifications: IQualification[];
  experience: IExperience[];
  hourlyRate?: number;
  availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
      _id: string;
    }[];
  };
  rating: {
    average: number;
    totalReviews: number;
  };
  joinedDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IQualification {
  certification: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  certificateUrl?: string;
  _id: string;
}

export interface IExperience {
  organization: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
  _id: string;
}

/** ACADEMY RELATED TYPE INTERFACE **/

export interface Academy {
  _id: string;
  name: string;
  description: string;
  location: string;
  address: string;
  sports: string[];
  fees: {
    monthly: number;
    quarterly: number;
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
  currentStudents: number;
  trainers: User[];
  images: string[];
  isActive: boolean;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  date: string;
  present: boolean;
  notes?: string;
}

export interface Performance {
  _id: string;
  date: string;
  metric: string;
  value: number;
  unit: string;
  notes?: string;
}

export interface Kit {
  _id: string;
  itemName: string;
  requestedDate: string;
  status: "requested" | "processing" | "delivered" | "rejected";
  cost?: number;
  deliveredDate?: string;
}

export interface FeePayment {
  _id: string;
  amount: number;
  period: "monthly" | "quarterly" | "yearly";
  transactionId?: string;
  paymentDate: string;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
}

export interface Qualification {
  certification: string;
  issuedBy: string;
  issuedDate: string;
  expiryDate?: string;
  certificateUrl?: string;
}

export interface Experience {
  organization: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T>
  extends ApiResponse<{
    items: T[];
    pagination: PaginationInfo;
  }> {}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API response interfaces
export interface StudentResponse extends ApiResponse<{ student: Student }> {}

export interface StudentListResponse
  extends ApiResponse<{
    students: Student[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalStudents: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {}

export interface StudentStatsResponse
  extends ApiResponse<{
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    newStudentsThisMonth: number;
    studentsByLevel: Array<{
      _id: string;
      count: number;
    }>;
    studentsBySport: Array<{
      _id: string;
      count: number;
    }>;
    feeStatus: {
      paid: number;
      pending: number;
      overdue: number;
    };
  }> {}

// Filter interfaces
export interface StudentFilters {
  page?: number;
  limit?: number;
  academyId?: string;
  trainerId?: string;
  sport?: string;
  level?: "beginner" | "intermediate" | "advanced";
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Form data interfaces
export interface StudentFormData {
  userId: string;
  academyId: string;
  trainerId?: string;
  sport: string;
  level: "beginner" | "intermediate" | "advanced";
  fees: {
    amount: number;
    period: "monthly" | "quarterly" | "yearly";
    dueDate: string;
  };
}

export interface StudentUpdateData {
  academyId?: string;
  trainerId?: string | undefined;
  sport?: string;
  level?: "beginner" | "intermediate" | "advanced";
  fees?: {
    amount: number;
    period: "monthly" | "quarterly" | "yearly";
    dueDate: string;
    status: "paid" | "pending" | "overdue";
  };
}

export interface KitUpdateData {
  status: "requested" | "processing" | "delivered" | "rejected";
  deliveredDate?: string;
  cost?: number;
}

export interface TrainerFilters {
  page?: number;
  limit?: number;
  academyId?: string;
  sport?: string;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface AcademyFilters {
  page?: number;
  limit?: number;
  location?: string;
  sport?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UIState {
  sidebarCollapsed: boolean;
  activeTab: string;
  theme: "light" | "dark";
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface FormField {
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "select"
    | "textarea"
    | "checkbox"
    | "date";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  validation?: any;
}

/** EVENT RELATED TYPE INTERFACES **/

export type EventStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface Event {
  _id: string;
  name: string;
  description: string;
  sport: string;
  startDate: string;
  endDate?: string;
  location: string;
  venue: string;
  participants: string[];
  maxParticipants?: number;
  links: string[];
  images: string[];
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  academyId?: string;
  status: EventStatus;
  isPublic: boolean;
  registrationOpen: boolean;
  registrationDeadline?: string;
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
  participantCount?: number;
  canRegister?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventFormData {
  name: string;
  description: string;
  sport: string;
  startDate: string;
  endDate?: string;
  location: string;
  venue: string;
  maxParticipants?: number;
  links?: string[];
  images?: string[];
  registrationDeadline?: string;
  entryFee?: number;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  status: EventStatus;
  isPublic: boolean;
  registrationOpen: boolean;
  tags?: string[];
  requirements?: string;
  prizes?: string[];
}

export interface EventFilters {
  page?: number;
  limit?: number;
  sport?: string;
  status?: EventStatus;
  isPublic?: boolean;
  registrationOpen?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface EventStats {
  totalEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  totalParticipants: number;
  averageParticipants: number;
  eventsByStatus: Array<{
    _id: EventStatus;
    count: number;
    totalParticipants: number;
  }>;
  eventsBySport: Array<{
    _id: string;
    count: number;
    totalParticipants: number;
  }>;
  upcomingEventsList: Array<{
    _id: string;
    name: string;
    sport: string;
    startDate: string;
    participantCount: number;
  }>;
}

export interface PaginatedEventsResponse {
  events: Event[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalEvents: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
