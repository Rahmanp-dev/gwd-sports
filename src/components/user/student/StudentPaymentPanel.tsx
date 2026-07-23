"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toastUtils } from "@/utils/toast";
import { 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  loadRazorpayScript 
} from "@/services/paymentService";
import { IndianRupee, CreditCard, Loader2 } from "lucide-react";
import { useAppSelector } from "@/store";

export function StudentPaymentPanel({ 
  outstandingFees, 
  onPaymentSuccess,
  academyFees 
}: { 
  outstandingFees: number, 
  onPaymentSuccess?: () => void,
  academyFees?: { monthly: number, quarterly: number, halfYearly: number, yearly: number }
}) {
  const [selectedPlan, setSelectedPlan] = useState<string>("outstanding");
  const [amount, setAmount] = useState<string>(outstandingFees > 0 ? outstandingFees.toString() : "");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  const handlePlanChange = (val: string) => {
    setSelectedPlan(val);
    if (val === "outstanding") setAmount(outstandingFees.toString());
    else if (val === "monthly") setAmount(academyFees?.monthly?.toString() || "");
    else if (val === "quarterly") setAmount(academyFees?.quarterly?.toString() || "");
    else if (val === "halfYearly") setAmount(academyFees?.halfYearly?.toString() || "");
    else if (val === "yearly") setAmount(academyFees?.yearly?.toString() || "");
    else if (val === "custom") setAmount("");
  };

  const handlePayment = async () => {
    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      toastUtils.error("Invalid Amount", "Please enter a valid amount to pay.");
      return;
    }

    setIsProcessing(true);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toastUtils.error("Payment Gateway Error", "Could not load Razorpay SDK. Please check your connection.");
        return;
      }

      // Create Order on Backend
      const orderRes = await createRazorpayOrder({
        amount: paymentAmount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        period: selectedPlan !== "custom" && selectedPlan !== "outstanding" ? selectedPlan : undefined,
      });

      const orderData = orderRes?.order || orderRes?.data?.order || (orderRes?.id ? orderRes : null);
      const key_id = orderRes?.key_id || orderRes?.data?.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!orderData || !orderData.id) {
        throw new Error("Failed to create order");
      }

      const options = {
        key: key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GWD Sports Ecosystem",
        description: "Fee Payment",
        order_id: orderData.id,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: "#4f46e5", // Indigo 600
        },
        handler: async function (response: any) {
          try {
            const verification = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification.success) {
              toastUtils.success("Payment Successful!", `Your payment of ₹${paymentAmount} was successful.`);
              setAmount("");
              if (onPaymentSuccess) onPaymentSuccess();
            } else {
              toastUtils.error("Payment Verification Failed", "We could not verify your payment. Please contact support.");
            }
          } catch (err: any) {
            toastUtils.error("Payment Verification Failed", err.message || "An error occurred while verifying the payment.");
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on("payment.failed", function (response: any) {
        toastUtils.error("Payment Failed", response.error.description);
      });

      rzp.open();

    } catch (err: any) {
      toastUtils.error("Payment Initialization Failed", err.message || "Could not start payment process.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-slate-900">Make a Payment</CardTitle>
        </div>
        <CardDescription className="text-slate-500">
          Pay your academy fees securely via Razorpay Route.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-700">Payment Plan</Label>
            <Select value={selectedPlan} onValueChange={handlePlanChange}>
              <SelectTrigger className="bg-white border-slate-200">
                <SelectValue placeholder="Select a payment plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outstanding">Outstanding Dues (₹{outstandingFees})</SelectItem>
                {academyFees?.monthly && <SelectItem value="monthly">Monthly (₹{academyFees.monthly})</SelectItem>}
                {academyFees?.quarterly && <SelectItem value="quarterly">Quarterly (₹{academyFees.quarterly})</SelectItem>}
                {academyFees?.halfYearly && <SelectItem value="halfYearly">Half-Yearly (₹{academyFees.halfYearly})</SelectItem>}
                {academyFees?.yearly && <SelectItem value="yearly">Yearly (₹{academyFees.yearly})</SelectItem>}
                <SelectItem value="custom">Custom Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Amount (INR)</Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (selectedPlan !== "custom") setSelectedPlan("custom");
                }}
                placeholder="Enter amount"
                className="pl-9 bg-white border-slate-200 text-slate-900 focus-visible:ring-blue-500"
              />
            </div>
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={handlePayment}
            disabled={isProcessing || !amount || Number(amount) <= 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing Securely...
              </>
            ) : (
              <>Pay ₹{amount || "0"}</>
            )}
          </Button>
          
          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              Secured by Razorpay Route
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
