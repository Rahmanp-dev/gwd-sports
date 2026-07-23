"use client";
import { useState, useEffect } from "react";
import { useNavigate, Navigate, useLocation } from "@/lib/router-shim";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  loadRazorpayScript,
} from "@/services/paymentService";
import { motion } from "framer-motion";
import { BRAND_NAME } from "@/utils/constants";

export default function PayFeesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Get fee details passed from navigation state or location state
  const feeAmount = location.state?.amount || 3000;
  const feeDescription =
    location.state?.description || "Monthly Training & Facilities Fee";
  const kitId = location.state?.kitId;

  const platformFee = Math.round(feeAmount * 0.01); // 1% platform fee for GWD
  const gatewayFee = Math.round((feeAmount + platformFee) * 0.0236); // 2.36% (2% + 18% GST) gateway fee
  const totalPayable = feeAmount + platformFee + gatewayFee;

  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      setRazorpayLoaded(loaded);
      if (!loaded) {
        toast.error(
          "Failed to load Razorpay SDK. Please check your internet connection.",
        );
      }
    });
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error("Razorpay SDK is not loaded yet.");
      return;
    }

    setLoading(true);

    try {
      const orderPayload = {
        amount: totalPayable,
        baseAmount: feeAmount,
        currency: "INR",
        description: feeDescription,
        kitId: kitId,
        period: "monthly",
      };

      const order = await createRazorpayOrder(orderPayload);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TGk4a8OmY6rFxG",
        amount: order.amount,
        currency: order.currency || "INR",
        name: process.env.NEXT_PUBLIC_APP_NAME || BRAND_NAME,
        description: `Academy Fees Payment - ${user.name} (${user.email})`,
        order_id: order.id,
        notes: {
          invoice_id: order.receipt || order.id,
          student_name: user.name,
          student_email: user.email,
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || "",
        },
        theme: {
          color: "#7c3aed",
        },
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verificationPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            const verifyResult =
              await verifyRazorpayPayment(verificationPayload);

            if (verifyResult.success) {
              toast.success("Payment successful! Receipt generated.");
              navigate("/mgfc/student");
            } else {
              toast.error(
                verifyResult.message || "Payment verification failed.",
              );
            }
          } catch (err: any) {
            toast.error(
              err.message || "An error occurred during payment verification.",
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info("Payment cancelled.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(
        err.message || "Failed to initiate payment. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 text-xs gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <ShieldCheck className="w-5 h-5 text-purple-200" />
            </div>
            <CardTitle className="text-xl font-bold mt-2">
              Pay Training Fees
            </CardTitle>
            <CardDescription className="text-purple-100 text-xs">
              Secure fee payment via Razorpay Payment Gateway
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Student Name
                </span>
                <span className="text-xs font-bold text-gray-900">
                  {user.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Email</span>
                <span className="text-xs font-mono text-gray-700">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-purple-200/60">
                <span className="text-xs text-gray-500 font-medium">
                  Base Fee
                </span>
                <span className="text-xs font-bold text-gray-900">
                  ₹{feeAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Platform Fee (1%)
                </span>
                <span className="text-xs font-bold text-gray-900">
                  ₹{platformFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Gateway Fee (2.36%)
                </span>
                <span className="text-xs font-bold text-gray-900">
                  ₹{gatewayFee.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-purple-200/60">
                <span className="text-xs text-gray-700 font-bold">
                  Total Payable
                </span>
                <span className="text-xl font-extrabold text-purple-700">
                  ₹{totalPayable.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1.5 text-gray-600">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Instant digital receipt generated upon completion</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600">
                <CreditCard className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>
                  Supports UPI, Debit/Credit Cards, NetBanking, and Wallets
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button
              onClick={handlePayment}
              disabled={loading || !razorpayLoaded}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </div>
              ) : (
                `Pay ₹${totalPayable.toLocaleString()} Now`
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
