import apiService from "./apiService";

export interface CreateOrderParams {
  amount: number;
  currency?: string;
  receipt?: string;
  studentId?: string;
}

export interface VerifyPaymentParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const createRazorpayOrder = async (data: CreateOrderParams) => {
  const response = await apiService.post("/payments/create-order", data);
  return (response as any).data;
};

export const verifyRazorpayPayment = async (data: VerifyPaymentParams) => {
  const response = await apiService.post("/payments/verify-payment", data);
  return (response as any).data;
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
