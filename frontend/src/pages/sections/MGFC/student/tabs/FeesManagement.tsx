import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppSelector } from "@/store";
import { getPaymentHistory } from "@/services/paymentService";
import type { FeePaymentRecord } from "@/services/paymentService";
import { toast } from "sonner";

export default function FeesManagement() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const fetchHistory = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const res = await getPaymentHistory(page, 6);
      console.log(res);
      if (res.success) {
        setPayments(res.data.payments);
        setPagination(res.data.pagination);
      } else {
        toast.error("Failed to load payment history");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching payment history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      fetchHistory(pagination.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchHistory(pagination.page - 1);
    }
  };

  const getStatusDetails = (status: string) => {
    switch (status) {
      case "success":
        return {
          icon: <CheckCircle className="w-4 h-4 mr-1" />,
          badgeClass: "bg-green-500/10 text-green-400 border-green-500/20",
          textClass: "text-green-400",
          label: "Paid",
        };
      case "failed":
        return {
          icon: <XCircle className="w-4 h-4 mr-1" />,
          badgeClass: "bg-red-500/10 text-red-400 border-red-500/20",
          textClass: "text-red-400",
          label: "Failed",
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 mr-1" />,
          badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          textClass: "text-orange-400",
          label: "Pending",
        };
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div>
          <Card className="bg-gradient-to-br from-green-600 to-green-800 border-green-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Matches Played</p>
                  <h3 className="text-3xl font-bold text-white mt-1">1</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div>
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Goals Scored</p>
                  <h3 className="text-3xl font-bold text-white mt-1">1</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div>
          <Card className="bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Assists</p>
                  <h3 className="text-3xl font-bold text-white mt-1">1</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div>
          <Card className="bg-gradient-to-br from-orange-600 to-orange-800 border-orange-500/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Attendance</p>
                  <h3 className="text-3xl font-bold text-white mt-1">100%</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Fees Management</h2>
          <p className="text-gray-400">View and pay your academy fees</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto shadow-lg shadow-green-600/20"
          onClick={() => navigate("/mgfc/student/pay-fees")}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Pay Fees Now
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : payments.length === 0 ? (
        <Card className="bg-gray-800/50 border-gray-700/50 text-center py-12">
          <CardContent>
            <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Payment History
            </h3>
            <p className="text-gray-400">
              You haven't made any fee payments yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {payments.map((fee) => {
              const statusInfo = getStatusDetails(fee.status);
              const dateObj = new Date(fee.createdAt);
              const formattedMonth = dateObj.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              });
              const formattedDate = dateObj.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <motion.div
                  key={fee._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-gray-800/50 border-gray-700/50 hover:border-gray-600 transition-colors h-full flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div className="pr-2 text-left">
                          <CardTitle className="text-white text-md truncate">
                            {fee.paymentId
                              ? `Payment ID:  ${fee.paymentId}`
                              : `OrderId: ${fee.orderId.slice(0, 15)}...`}
                          </CardTitle>
                          <CardDescription className="text-gray-400 mt-1">
                            {formattedMonth}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusInfo.badgeClass} shrink-0`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <div className="flex justify-between items-end">
                        <div className="text-2xl font-bold text-white">
                          ₹{fee.amount}
                        </div>
                        <div
                          className={`flex items-center text-sm ${statusInfo.textClass}`}
                        >
                          {statusInfo.icon}
                          {fee.status === "success"
                            ? `Paid on ${formattedDate}`
                            : formattedDate}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6 border-t border-gray-800">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevPage}
                disabled={pagination.page <= 1}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-400">
                Page <strong className="text-white">{pagination.page}</strong>{" "}
                of <strong className="text-white">{pagination.pages}</strong>
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.pages}
                className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
