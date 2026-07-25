import apiService from "./apiService";

export type ImportMethod = "register_ocr" | "whatsapp_text" | "csv";

export type ImportRowStatus =
  | "pending"
  | "ready"
  | "needs_review"
  | "skipped"
  | "created"
  | "failed";

export interface ImportRowFlag {
  type:
    | "duplicate_phone_in_file"
    | "duplicate_phone_in_academy"
    | "existing_passport_same_academy"
    | "existing_passport_other_academy"
    | "missing_required_field"
    | "unparseable_phone"
    | "low_ocr_confidence";
  message: string;
  relatedRowIndexes?: number[];
  relatedPassportId?: string;
}

export interface ImportRow {
  index: number;
  name: string | null;
  mobileNumber: string | null;
  parentName: string | null;
  sportOrBatch: string | null;
  feeAmount: number | null;
  normalizedPhone: string | null;
  status: ImportRowStatus;
  flags: ImportRowFlag[];
  createdPassportId?: string | null;
  error?: string | null;
  editedByOwner?: boolean;
}

export interface ImportCounts {
  total: number;
  ready: number;
  needsReview: number;
  skipped: number;
  created: number;
  failed: number;
}

export interface ExtractResponse {
  success: boolean;
  message?: string;
  code?: string;
  data: {
    jobId: string;
    method: ImportMethod;
    defaultSport: string | null;
    rows: ImportRow[];
    counts: ImportCounts;
    parseWarning?: string;
    mappedColumns?: Record<string, string>;
    unmappedHeaders?: string[];
  };
}

export interface CommitResponse {
  success: boolean;
  message: string;
  data: {
    created: number;
    skipped: number;
    failed: number;
    passportsReused: number;
    transfers: Array<{ rowIndex: number; studentName: string; fromAcademyName: string }>;
    failures: Array<{ rowIndex: number; name: string | null; error: string }>;
    counts: ImportCounts;
    rows: ImportRow[];
    alreadyCommitted?: boolean;
  };
}

export interface RowEdit {
  index: number;
  name?: string | null;
  mobileNumber?: string | null;
  parentName?: string | null;
  sportOrBatch?: string | null;
  feeAmount?: number | null;
  status?: "skipped" | "pending";
}

export interface ActivationData {
  students: { total: number; withParentPhone: number; missingParentPhone: number };
  passports: { total: number; engaged: number; dormant: number; engagementRate: number };
  imports: { committedJobs: number; studentsCreated: number; rowsFailed: number };
  welcomeMessages: {
    pending: number;
    processing: number;
    done: number;
    failed: number;
    skipped: number;
  };
  dormantParents: Array<{
    passportId: string;
    studentName: string;
    parentName: string | null;
    parentPhone: string;
    addedAt: string;
  }>;
  engagementMetricStatus: "live" | "awaiting_phase_2_delivery";
}

class ImportService {
  private base = "/import";

  extractFromImage(imageDataUrl: string, defaultSport?: string | null) {
    return apiService.post<ExtractResponse>(`${this.base}/extract`, {
      method: "register_ocr",
      imageDataUrl,
      defaultSport,
    });
  }

  extractFromText(text: string, defaultSport?: string | null) {
    return apiService.post<ExtractResponse>(`${this.base}/extract`, {
      method: "whatsapp_text",
      text,
      defaultSport,
    });
  }

  extractFromCsv(csvContent: string, fileName?: string, defaultSport?: string | null) {
    return apiService.post<ExtractResponse>(`${this.base}/extract`, {
      method: "csv",
      csvContent,
      fileName,
      defaultSport,
    });
  }

  getJob(jobId: string) {
    return apiService.get<ExtractResponse>(`${this.base}/${jobId}`);
  }

  updateRows(jobId: string, rows: RowEdit[], defaultSport?: string | null) {
    return apiService.patch<{
      success: boolean;
      data: { applied: number; rows: ImportRow[]; counts: ImportCounts };
    }>(`${this.base}/${jobId}`, { rows, defaultSport });
  }

  commit(jobId: string) {
    return apiService.post<CommitResponse>(`${this.base}/${jobId}/commit`);
  }

  discard(jobId: string) {
    return apiService.delete<{ success: boolean; message: string }>(`${this.base}/${jobId}`);
  }

  getActivation() {
    return apiService.get<{ success: boolean; data: ActivationData }>("/academy/activation");
  }
}

export const importService = new ImportService();
export default importService;
