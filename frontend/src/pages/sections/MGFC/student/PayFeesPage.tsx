import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CreditCard, ShieldCheck, CheckCircle } from "lucide-react";
import { useAppSelector } from "@/store";
import { toast } from "sonner";
import { createRazorpayOrder, verifyRazorpayPayment, loadRazorpayScript } from "@/services/paymentService";
import { motion } from "framer-motion";

export default function PayFeesPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, token } = useAppSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "success" | "failed">("idle");

  const feeAmount = 5;

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  if (!isAuthenticated || !user) {
    toast.error("Please login to pay fees");
    return <Navigate to="/user/auth" />;
  }

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setPaymentStatus("idle");

      console.log("=== FRONTEND DEBUG ===");
      console.log("Current User Object:", user);

      const orderPayload = { 
        amount: feeAmount, 
        studentId: user?._id // Passing user ID to backend to see if it reaches
      };
      console.log("Payload sending to createRazorpayOrder:", orderPayload);

      // 1. Create order
      const order = await createRazorpayOrder(orderPayload);
      console.log("Response from createRazorpayOrder:", order);

      // 2. Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_SS49Ahe904DIC8",
        amount: order.amount,
        currency: order.currency || "INR",
        name: import.meta.env.VITE_APP_NAME || "MasterGrade FC",
        description: `Academy Fees Payment - ${user.name} (${user.email})`,
        order_id: order.id,
        notes: {
          invoice_id: order.receipt || order.id,
          student_name: user.name,
          student_email: user.email,
        },
        handler: async function (response: any) {
          try {
            await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            setPaymentStatus("success");
            toast.success("Payment successful!");
            setTimeout(() => {
              navigate("/mgfc/student?tab=fees");
            }, 2000);
          } catch (error) {
            setPaymentStatus("failed");
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: user.name || "Student Name",
          email: user.email || "student@example.com",
          contact: user.phone || "9999999999",
        },
        theme: {
          color: "#16a34a", // Green to match theme
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus("failed");
            toast.error("Payment cancelled");
            setIsLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      setPaymentStatus("failed");
      toast.error("Failed to initiate payment");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/mgfc-bg.jpg')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <Button 
          variant="ghost" 
          className="text-gray-400 hover:text-white mb-6"
          onClick={() => navigate("/mgfc/student?tab=fees")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-gray-900 border-gray-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/10 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full" />
          
          <CardHeader className="text-center pb-8 border-b border-gray-800 relative z-10">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white font-bold">Pay Academy Fees</CardTitle>
            <CardDescription className="text-gray-400 text-base mt-2">
              Complete your payment for MasterGrade FC
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 space-y-6 relative z-10">
            <div className="bg-black/40 rounded-xl p-6 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Student Name</span>
                <span className="text-white font-medium">{user?.name || "Student Name"}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Class Type</span>
                <span className="text-white font-medium">Monthly Fees</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-800">
                <span className="text-lg text-gray-300 font-semibold">Total Amount</span>
                <span className="text-3xl text-green-400 font-bold">₹{feeAmount}</span>
              </div>
            </div>

            <div className="flex items-center justify-center text-sm text-gray-500 gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span>Secured by Razorpay</span>
            </div>
          </CardContent>

          <CardFooter className="pb-8 relative z-10">
            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold text-lg transition-all shadow-lg shadow-green-600/20 hover:shadow-green-600/40"
              onClick={handlePayment}
              disabled={isLoading || paymentStatus === "success"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : paymentStatus === "success" ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Payment Successful
                </>
              ) : (
                `Pay ₹${feeAmount}`
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
