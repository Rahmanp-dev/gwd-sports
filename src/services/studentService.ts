import apiService from "./apiService";
import type {
  StudentUpdateData,
  StudentListResponse,
  StudentResponse,
  StudentStatsResponse,
  StudentFilters,
  KitUpdateData,
  Student,
} from "@/types";

class StudentAdminService {
  private baseAdminUrl = "/admin/students";

  // Helper function to transform API response to match frontend types
  private transformStudent(apiStudent: any): Student {
    return {
      _id: apiStudent._id,
      userId: apiStudent.userId._id || apiStudent.userId,
      user: {
        _id:
          apiStudent.user?._id ||
          (Array.isArray(apiStudent.user)
            ? apiStudent.user[0]?._id
            : apiStudent.userId._id),
        name:
          apiStudent.user?.name ||
          (Array.isArray(apiStudent.user)
            ? apiStudent.user[0]?.name
            : apiStudent.userId?.name) ||
          "Unknown",
        email:
          apiStudent.user?.email ||
          (Array.isArray(apiStudent.user)
            ? apiStudent.user[0]?.email
            : apiStudent.userId?.email) ||
          "No email",
        phone:
          apiStudent.user?.phone ||
          (Array.isArray(apiStudent.user)
            ? apiStudent.user[0]?.phone
            : apiStudent.userId?.phone),
        isActive:
          apiStudent.user?.isActive ??
          (Array.isArray(apiStudent.user)
            ? apiStudent.user[0]?.isActive
            : apiStudent.userId?.isActive) ??
          true,
      },
      academyId: apiStudent.academyId?._id || apiStudent.academyId || "",
      academy: {
        _id:
          apiStudent.academy?._id ||
          (Array.isArray(apiStudent.academy)
            ? apiStudent.academy[0]?._id
            : apiStudent.academyId?._id) ||
          "",
        name:
          apiStudent.academy?.name ||
          (Array.isArray(apiStudent.academy)
            ? apiStudent.academy[0]?.name
            : "") ||
          "No Academy",
        location:
          apiStudent.academy?.location ||
          (Array.isArray(apiStudent.academy)
            ? apiStudent.academy[0]?.location
            : "") ||
          "Unknown Location",
      },
      trainerId: apiStudent.trainerId?._id || apiStudent.trainerId,
      trainer: apiStudent.trainer
        ? {
            _id:
              apiStudent.trainer._id ||
              (Array.isArray(apiStudent.trainer)
                ? apiStudent.trainer[0]?._id
                : ""),
            name:
              apiStudent.trainer.name ||
              (Array.isArray(apiStudent.trainer)
                ? apiStudent.trainer[0]?.name
                : "") ||
              "No Trainer",
            sports:
              apiStudent.trainer.sports ||
              (Array.isArray(apiStudent.trainer)
                ? apiStudent.trainer[0]?.sports
                : []) ||
              [],
          }
        : undefined,
      sport: apiStudent.sports?.[0] || "Unknown Sport",
      level: apiStudent.level || "beginner",
      enrollmentDate: apiStudent.enrollmentDate || new Date().toISOString(),
      fees:
        apiStudent.feePayments && apiStudent.feePayments.length > 0
          ? {
              amount:
                apiStudent.feePayments[apiStudent.feePayments.length - 1]
                  .amount || 0,
              period:
                apiStudent.feePayments[apiStudent.feePayments.length - 1]
                  .period || "monthly",
              dueDate:
                apiStudent.feePayments[apiStudent.feePayments.length - 1]
                  .dueDate || new Date().toISOString(),
              status:
                apiStudent.feePayments[apiStudent.feePayments.length - 1]
                  .status || "pending",
            }
          : {
              amount: 0,
              period: "monthly" as const,
              dueDate: new Date().toISOString(),
              status: "pending" as const,
            },
      kits: (apiStudent.kits || []).map((kit: any) => ({
        _id: kit._id || "",
        itemName: kit.kitName || kit.itemName || "Unknown Item",
        size: kit.size || "Unknown Size",
        requestedDate:
          kit.requestedAt || kit.requestedDate || new Date().toISOString(),
        status: kit.status || "requested",
        deliveredDate: kit.deliveredAt || kit.deliveredDate,
        notes: kit.notes || "",
      })),
      attendance: (apiStudent.attendance || []).map((record: any) => ({
        _id: record._id || "",
        date: record.date || new Date().toISOString(),
        present: record.present || false,
        notes: record.remarks || record.notes || "",
      })),
      performance: (apiStudent.performance || []).map((record: any) => ({
        _id: record._id || "",
        date: record.evaluatedAt || record.date || new Date().toISOString(),
        metric:
          record.category || record.sport || record.metric || "Unknown Metric",
        value: record.score || record.value || 0,
        unit: record.maxScore ? `/${record.maxScore}` : record.unit || "",
        notes: record.remarks || record.notes || "",
      })),
      createdAt: apiStudent.createdAt || new Date().toISOString(),
      updatedAt: apiStudent.updatedAt || new Date().toISOString(),
    };
  }

  async getAllStudents(
    filters: StudentFilters = {},
  ): Promise<StudentListResponse> {
    const queryParams = new URLSearchParams();

    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.academyId) queryParams.append("academyId", filters.academyId);
    if (filters.trainerId) queryParams.append("trainerId", filters.trainerId);
    if (filters.sport) queryParams.append("sport", filters.sport);
    if (filters.level) queryParams.append("level", filters.level);
    if (filters.isActive !== undefined)
      queryParams.append("isActive", filters.isActive.toString());
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters.sortOrder) queryParams.append("sortOrder", filters.sortOrder);

    const url = `${this.baseAdminUrl}?${queryParams.toString()}`;
    const response = await apiService.get<any>(url);

    // Transform the response
    return {
      success: response.success,
      data: {
        students: response.data.students.map((student: any) =>
          this.transformStudent(student),
        ),
        pagination: response.data.pagination,
      },
    };
  }

  async getStudentById(id: string): Promise<StudentResponse> {
    const response = await apiService.get<any>(`${this.baseAdminUrl}/${id}`);

    return {
      success: response.success,
      data: {
        student: this.transformStudent(response.data.student),
      },
    };
  }

  async updateStudent(
    id: string,
    studentData: StudentUpdateData,
  ): Promise<StudentResponse> {
    const response = await apiService.put<any>(
      `${this.baseAdminUrl}/${id}`,
      studentData,
    );

    return {
      success: response.success,
      data: {
        student: this.transformStudent(response.data.student),
      },
    };
  }

  async updateKitStatus(
    studentProfileId: string,
    kitId: string,
    kitData: KitUpdateData,
  ): Promise<{ success: boolean; message: string }> {
    return apiService.put<{ success: boolean; message: string }>(
      `${this.baseAdminUrl}/${studentProfileId}/kits/${kitId}`,
      kitData,
    );
  }

  async getAllKits(): Promise<{
    success: boolean;
    data: {
      kits: Array<{
        _id: string;
        studentProfileId: string;
        studentId: string;
        studentName: string;
        studentEmail: string;
        kitId: string;
        kitName: string;
        kitStatus: "delivered" | "requested" | "processing" | "rejected";
        kitCost?: number;
        requestedAt: string;
        deliveredAt?: string | null;
      }>;
    };
  }> {
    return apiService.get(`/admin/get-kits`);
  }

  async getStudentStats(): Promise<StudentStatsResponse> {
    return apiService.get<StudentStatsResponse>(`${this.baseAdminUrl}/stats`);
  }
}

class StudentPublicService {
  private baseStudentUrl = "/student";

  // Check if the student has a User profile
  async checkStudentUserProfile(email: string) {
    const response = await apiService.post<any>("/user/check-email", { email });
    return response;
  }

  // Create Student Profile
  async createStudentProfile(
    data: {
      userId: string;
      sports: string[];
      level:
        | "beginner"
        | "intermediate"
        | "advanced"
        | "U12"
        | "U14"
        | "U16"
        | "U19"
        | "U23";
      medicalInfo: {
        allergies: string[];
        medications: string[];
        emergencyContact: {
          name: string;
          phone: string;
          relation: string;
        };
      };
    },
    accessToken: string,
  ) {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: {
        studentProfile: any;
      };
    }>(`${this.baseStudentUrl}/profile`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response;
  }

  // Get Own Student Profile
  async getOwnStudentProfile() {
    const response = await apiService.get<{
      success: boolean;
      data: {
        studentProfile: {
          _id: string;
          userId: string;
          academyId: string | null;
          trainerId: string | null;
          enrollmentDate: string | null;
          totalFeesPaid: number;
          outstandingFees: number;
          sports: string[];
          level:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "U12"
            | "U14"
            | "U16"
            | "U19"
            | "U23";
          isActive: boolean;
          medicalInfo?: {
            allergies?: string[];
            medications?: string[];
            emergencyContact: {
              name: string;
              phone: string;
              relation: string;
            };
          };
          feePayments: any[];
          attendance: any[];
          kits: any[];
          performance: any[];
          createdAt: string;
          updatedAt: string;
        };
      };
    }>(`${this.baseStudentUrl}/profile`);
    return response;
  }

  // Update Own Student Profile
  async updateOwnStudentProfile(data: {
    sports?: string[];
    level?:
      | "beginner"
      | "intermediate"
      | "advanced"
      | "U12"
      | "U14"
      | "U16"
      | "U19"
      | "U23";
    medicalInfo?: {
      allergies?: string[];
      medications?: string[];
      emergencyContact?: {
        name: string;
        phone: string;
        relation: string;
      };
    };
  }) {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: {
        studentProfile: any;
      };
    }>(`${this.baseStudentUrl}/profile`, data);
    return response;
  }

  // Join Academy
  async joinAcademy(academyId: string) {
    return apiService.post<{ success: boolean; message: string }>(
      `${this.baseStudentUrl}/join-academy`,
      { academyId },
    );
  }

  async getAttendanceRecords() {
    return apiService.get<{ success: boolean; data: { attendance: any[] } }>(
      `${this.baseStudentUrl}/attendance`,
    );
  }

  async getPerformanceRecords() {
    return apiService.get<{ success: boolean; data: { performance: any[] } }>(
      `${this.baseStudentUrl}/performance`,
    );
  }

  // Request Kit
  async requestKit(kitName: string) {
    const response = await apiService.post<{
      success: boolean;
      message: string;
    }>(`${this.baseStudentUrl}/request-kit`, { kitName });
    return response;
  }

  // Get Kits
  async getKits() {
    const response = await apiService.get<{
      success: boolean;
      data: {
        kits: Array<{
          _id: string;
          kitName: string;
          status: "delivered" | "requested" | "processing" | "rejected";
          requestedAt: string;
          deliveredAt?: string | null;
          cost?: number;
        }>;
      };
    }>(`${this.baseStudentUrl}/kits`);
    return response;
  }
}

export const studentAdminService = new StudentAdminService();
export const studentPublicService = new StudentPublicService();
