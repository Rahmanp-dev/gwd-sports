"use client";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/use-toast";
import {
  createRazorpayOrder,
  loadRazorpayScript,
  verifyRazorpayPayment,
} from "../../services/paymentService";
import type { CreateOrderParams } from "../../services/paymentService";

interface RazorpayButtonProps {
  amount: number;
  studentId?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (error: any) => void;
  className?: string;
}

export const RazorpayButton: React.FC<RazorpayButtonProps> = ({
  amount,
  studentId,
  onSuccess,
  onError,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      const isLoaded = await loadRazorpayScript();

      if (!isLoaded) {
        toast({
          title: "Failed to load payment gateway",
          variant: "destructive",
        });
        return;
      }

      const orderData: CreateOrderParams = { amount, studentId };
      const res = await createRazorpayOrder(orderData);

      if (!res.success || !res.data?.order) {
        toast({
          title: "Failed to create order",
          description: res.message || "Could not create payment order",
          variant: "destructive",
        });
        return;
      }

      const order = res.data.order;
      const keyId = res.data.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "TEST_KEY_ID";

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "GWD Sports Ecosystem",
        description: "Payment",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const verifyRes = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              toast({ title: "Payment Successful!" });
              onSuccess?.(response.razorpay_payment_id);
            } else {
              toast({
                title: "Payment Verification Failed",
                variant: "destructive",
              });
              onError?.(new Error("Verification failed"));
            }
          } catch (error) {
            toast({ title: "Payment Error", variant: "destructive" });
            onError?.(error);
          }
        },
        prefill: {
          name: "", // Optionally prefill user details
          email: "",
          contact: "",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.on("payment.failed", function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error.description,
          variant: "destructive",
        });
        onError?.(response.error);
      });
      paymentObject.open();
    } catch (error) {
      console.error(error);
      toast({ title: "Something went wrong", variant: "destructive" });
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handlePayment} disabled={isLoading} className={className}>
      {isLoading ? "Processing..." : `Pay ₹${amount}`}
    </Button>
  );
};
