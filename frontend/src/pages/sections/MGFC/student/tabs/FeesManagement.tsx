import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle, Clock } from "lucide-react";
import { useAppSelector } from "@/store";

const MOCK_FEES = [
  {
    id: "FEE-001",
    month: "October 2024",
    amount: 5,
    dueDate: "2024-10-05",
    status: "Paid",
    paidDate: "2024-10-02"
  },
  {
    id: "FEE-002",
    month: "November 2024",
    amount: 5,
    dueDate: "2024-11-05",
    status: "Pending",
    paidDate: null
  }
];

export default function FeesManagement() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Fees Management</h2>
          <p className="text-gray-400">View and pay your academy fees</p>
        </div>
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={() => navigate("/mgfc/student/pay-fees")}
        >
          <CreditCard className="w-4 h-4 mr-2" />
          Pay Fees Now
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_FEES.map((fee) => (
          <motion.div
            key={fee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gray-800/50 border-gray-700/50">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white text-lg">{fee.month}</CardTitle>
                    <CardDescription className="text-gray-400">
                      Due: {new Date(fee.dueDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge 
                    className={
                      fee.status === "Paid" 
                        ? "bg-green-500/10 text-green-400 border-green-500/20" 
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    }
                  >
                    {fee.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-white">
                    ₹{fee.amount}
                  </div>
                  {fee.status === "Paid" ? (
                    <div className="flex items-center text-sm text-green-400">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Paid on {new Date(fee.paidDate!).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-orange-400">
                      <Clock className="w-4 h-4 mr-1" />
                      Payment Pending
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
