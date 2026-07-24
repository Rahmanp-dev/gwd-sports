import apiService from "./apiService";

export interface CreateOrderParams {
  amount: number;
  baseAmount?: number;
  currency?: string;
  receipt?: string;
  studentId?: string;
  period?: string;
  description?: string;
  kitId?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface FeePaymentRecord {
  _id: string;
  orderId: string;
  studentId?: string | any;
  paymentId?: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed";
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: {
    payments: FeePaymentRecord[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  };
}

export const createRazorpayOrder = async (data: CreateOrderParams) => {
  return apiService.post<{ success: boolean; message?: string; data: { order: any; key_id: string } }>(
    "/payments/create-order",
    data,
  );
};

export const verifyRazorpayPayment = async (data: VerifyPaymentParams) => {
  const response = await apiService.post("/payments/verify-payment", data);
  return response as any;
};

export const getPaymentHistory = async (
  page: number = 1,
  limit: number = 10,
): Promise<PaymentHistoryResponse> => {
  const response = await apiService.get(
    `/payments/history?page=${page}&limit=${limit}`,
  );
  console.log("Payment history response:", response);
  return response as any;
};

export interface AdminFeePaymentsParams {
  page?: number;
  limit?: number;
  status?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: string;
  order?: string;
  search?: string;
}

export const getAllFeePayments = async (
  params: AdminFeePaymentsParams,
): Promise<PaymentHistoryResponse> => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page.toString());
  if (params.limit) query.append("limit", params.limit.toString());
  if (params.status && params.status !== "all")
    query.append("status", params.status);
  if (params.minAmount) query.append("minAmount", params.minAmount);
  if (params.maxAmount) query.append("maxAmount", params.maxAmount);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.order) query.append("order", params.order);
  if (params.search) query.append("search", params.search);

  const response = await apiService.get(
    `/payments/admin/all?${query.toString()}`,
  );
  return response as any;
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};
