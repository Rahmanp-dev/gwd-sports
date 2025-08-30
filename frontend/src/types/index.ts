
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'student' | 'trainer' | 'user';
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
  role: 'admin' | 'student' | 'trainer' | 'user';
  sports?: string[];
  isActive?: boolean;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'student' | 'trainer' | 'user';
  sports?: string[];
  isActive?: boolean;
}

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: 'admin' | 'student' | 'trainer' | 'user';
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
  }
}

export interface UserResponse {
  success: boolean;
  data: {
    user: User;
  }
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
  }
}

export interface Student {
  _id: string;
  userId: User;
  sports: string[];
  level: "beginner" | "intermediate" | "advanced";
  academyId?: Academy;
  trainerId?: User;
  enrollmentDate: string;
  medicalInfo: {
    allergies: string[];
    medications: string[];
    emergencyContact: {
      name: string;
      phone: string;
      relation: string;
    };
  };
  attendance: Attendance[];
  performance: Performance[];
  kits: Kit[];
  feePayments: FeePayment[];
  totalFeesPaid: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Trainer {
  _id: string;
  userId: User;
  sports: string[];
  specializations: string[];
  qualifications: Qualification[];
  experience: Experience[];
  academyId?: Academy;
  students: User[];
  hourlyRate?: number;
  availability: {
    days: string[];
    timeSlots: TimeSlot[];
  };
  rating: {
    average: number;
    count: number;
  };
  joinedDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

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
  remarks?: string;
  markedBy: User;
  markedAt: string;
}

export interface Performance {
  _id: string;
  sport: string;
  score: number;
  maxScore: number;
  percentage: number;
  remarks: string;
  category: string;
  recordedBy: User;
  recordedAt: string;
}

export interface Kit {
  _id: string;
  kitName: string;
  status: "requested" | "processing" | "delivered";
  requestedAt: string;
  deliveredAt?: string;
  cost?: number;
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

export interface StudentFilters {
  page?: number;
  limit?: number;
  academyId?: string;
  trainerId?: string;
  level?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TrainerFilters {
  page?: number;
  limit?: number;
  academyId?: string;
  sport?: string;
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
