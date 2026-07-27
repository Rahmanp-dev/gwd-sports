"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
} from "lucide-react";
import { getAllFeePayments } from "@/services/paymentService";
import type {
  FeePaymentRecord,
  AdminFeePaymentsParams,
} from "@/services/paymentService";
import { toast } from "sonner";
import { FinanceDashboard } from "./FinanceDashboard";

export const FeesManagement: React.FC = () => {
  const [payments, setPayments] = useState<FeePaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const fetchPayments = useCallback(
    async (page: number) => {
      try {
        setIsLoading(true);
        const params: AdminFeePaymentsParams = {
          page,
          limit: 10,
          status: statusFilter,
          minAmount,
          sortBy,
          order,
          search,
        };

        const res = await getAllFeePayments(params);

        // Depending on API response wrapper struct:
        if (res && res.data) {
          setPayments(res.data.payments || []);
          setPagination({
            page: res.data.pagination?.page || 1,
            pages: res.data.pagination?.pages || 1,
            total: res.data.pagination?.total || 0,
          });
        } else {
          toast.error("Failed to load global payment history");
        }
      } catch (error) {
        console.error(error);
        toast.error("Error fetching admin payments");
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, minAmount, sortBy, order, search],
  );

  useEffect(() => {
    fetchPayments(1);
  }, [fetchPayments]);

  const handleApplyFilters = () => {
    fetchPayments(1); // Reset to page 1 on filter
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setMinAmount("");
    setSortBy("createdAt");
    setOrder("desc");
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      fetchPayments(pagination.page + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.page > 1) {
      fetchPayments(pagination.page - 1);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Success
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial Analytics Dashboard */}
      <FinanceDashboard />

      {/* Divider */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Transaction Ledger
            </h2>
            <p className="text-slate-500">
              Complete payment history with filters and search
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-3 py-1.5 rounded-md border shadow-sm">
            Total Transactions: {pagination.total}
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="shadow-sm">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Search</label>
            <Input
              type="text"
              placeholder="Search by Payment ID, Order ID, or Receipt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10"
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Min Amount (₹)
            </label>
            <Input
              type="number"
              placeholder="e.g. 1"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="createdAt">Date Created</option>
              <option value="amount">Amount</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Order</label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              className="w-full bg-primary hover:bg-primary/90 h-10"
            >
              <Search className="w-4 h-4 mr-2" /> Apply
            </Button>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="w-full h-10"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b">
              <tr>
                <th className="px-3 sm:px-6 py-4">Transaction / Receipt</th>
                <th className="hidden sm:table-cell px-6 py-4">Student ID / Details</th>
                <th className="px-3 sm:px-6 py-4 font-bold text-center">Amount (₹)</th>
                <th className="px-3 sm:px-6 py-4 text-center">Status</th>
                <th className="px-3 sm:px-6 py-4">Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading transactions...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    No transactions found matching the current criteria.
                  </td>
                </tr>
              ) : (
                payments.map((fee) => (
                  <tr
                    key={fee._id}
                    className="bg-white border-b hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {/* The parent-facing receipt number when there is one —
                          `receipt` is the internal Razorpay order reference and
                          means nothing to anybody outside this table. */}
                      <div className="font-semibold text-slate-900">
                        {(fee as any).receiptNumber || fee.receipt || "—"}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {fee.paymentId || fee.orderId}
                      </div>
                      {fee.status === "success" && (
                        <a
                          href={`/receipt/${fee._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline"
                        >
                          View receipt →
                        </a>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-6 py-4">
                      {/* Depending on if studentId was fully populated by backend, show it here safely */}
                      <div className="text-xs font-mono text-slate-500">
                        {fee.studentId
                          ? typeof fee.studentId === "object"
                            ? (fee.studentId as any)._id
                            : fee.studentId
                          : "Anonymous/Direct"}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-center">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        ₹{fee.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-center whitespace-nowrap">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-900">
                        {new Date(fee.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(fee.createdAt).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50">
            <span className="text-sm text-slate-600">
              Showing Page{" "}
              <span className="font-semibold text-slate-900">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-900">
                {pagination.pages}
              </span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={pagination.page <= 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.pages}
                className="h-8"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
