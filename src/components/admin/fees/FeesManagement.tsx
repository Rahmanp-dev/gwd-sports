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
  Banknote,
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

  /**
   * The ledger is built here — it owns its own data, filters and paging —
   * but RENDERED inside <FinanceDashboard>, directly under the defaulters
   * list. Handing it over as a slot keeps that ownership split honest:
   * layout decisions stay with the dashboard, data decisions stay here.
   */
  const ledger = (
    <div className="space-y-6">
      {/* Divider */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2">
            <div className="mt-1 h-7 w-1 rounded-full bg-slate-800" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Transaction Ledger
              </h2>
              <p className="text-slate-500">
                Every payment, with the student who made it — search by name,
                receipt number or payment ID.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
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
              placeholder="Student name, receipt no., payment ID…"
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
            <label className="text-sm font-medium text-slate-700">
              Sort By
            </label>
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

      {/*
          ════════════════════════════════════════════════════════════════════
          THE LEDGER — a reflowing list, not a scrolling table
          ════════════════════════════════════════════════════════════════════

          This was a five-column <table> in an `overflow-x-auto`. On a phone that
          meant dragging sideways to reach Status and Date — the two columns an
          owner opens this screen to read — and losing sight of which row they
          were on while doing it. Hiding columns at small widths was not an
          option either: the answer to "did this payment land" is precisely the
          column that gets hidden.

          So the row is a flex container that STACKS instead of scrolling.
          Identity on one side, money and state on the other; below `lg` those
          become two rows and every field stays on screen. Nothing is truncated
          away — the request was explicitly for more detail, not less.
        */}
      <Card className="shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-16 text-center text-slate-500">
            <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Loading transactions…
          </div>
        ) : payments.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-500">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            No transactions found matching the current criteria.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {payments.map((fee) => {
              const student = fee.student;
              const isCash =
                fee.settlementStrategy === "offline_direct_to_academy";
              const when = new Date(fee.createdAt);

              return (
                <li
                  key={fee._id}
                  className="px-4 py-4 transition-colors hover:bg-slate-50 sm:px-6"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                    {/* ── WHO, and what the parent would quote back ────── */}
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        {/* Wraps rather than truncates. "Who paid this?" is the
                            question this row exists to answer — an ellipsis in
                            the middle of a name answers it badly. */}
                        <span className="min-w-0 break-words text-sm font-bold text-slate-900">
                          {/*
                              A passport-link payment has no account behind it, so
                              "who paid" genuinely has no answer for some rows.
                              Naming that beats printing "Unknown", which reads
                              like data we lost.
                            */}
                          {student?.name ?? "Direct payment (no account)"}
                        </span>
                        {student?.passportId && (
                          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                            {student.passportId}
                          </code>
                        )}
                        {isCash && (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                            <Banknote className="mr-1 h-3 w-3" /> Cash
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                        {/* The parent-facing receipt number when there is one —
                              `receipt` is the internal Razorpay order reference
                              and means nothing to anyone outside this screen. */}
                        <span className="font-medium text-slate-600">
                          {fee.receiptNumber || fee.receipt || "No receipt no."}
                        </span>
                        {/* `break-all`, not `truncate`: a gateway id is one long
                            unbroken token, and a truncated one that still runs
                            past the card edge is the horizontal scroll we just
                            removed, reintroduced. Wrapping is honest — the whole
                            id stays copyable. */}
                        <span className="min-w-0 break-all font-mono text-slate-400">
                          {fee.paymentId || fee.orderId}
                        </span>
                        {student?.phone && (
                          <a
                            href={`tel:${student.phone}`}
                            className="font-medium text-slate-500 hover:text-slate-800"
                          >
                            {student.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ── HOW MUCH, WHAT HAPPENED, WHEN ────────────────── */}
                    <div className="flex shrink-0 items-center justify-between gap-4 lg:justify-end">
                      <div className="lg:min-w-[7rem] lg:text-right">
                        <div className="text-base font-extrabold tabular-nums text-slate-900">
                          ₹{fee.amount.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {when.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          {when.toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        {getStatusBadge(fee.status)}
                        {fee.status === "success" && (
                          <a
                            href={`/receipt/${fee._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-blue-600 hover:underline"
                          >
                            View receipt →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

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

  return <FinanceDashboard ledgerSlot={ledger} />;
};
