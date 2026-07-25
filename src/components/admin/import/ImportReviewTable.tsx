"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeftRight, CheckCircle2, RotateCcw, UserX } from "lucide-react";
import type { ImportRow, ImportRowFlag, RowEdit } from "@/services/importService";

/**
 * The review table — the safety net for the whole import feature.
 *
 * Design decisions that matter:
 *
 * - Edits are debounced and saved to the server, not held only in React state.
 *   Reviewing 60 handwritten rows takes minutes, and losing that work to an
 *   accidental reload would send the owner back to the paper register.
 *
 * - Flags are shown inline on the row they concern, in plain language, with the
 *   conflicting names spelled out. "Shares number with Aditya Verma — siblings,
 *   or a copy-paste error?" is answerable at a glance; "duplicate detected" is
 *   not.
 *
 * - Rows that need attention sort to the top, because the owner's job here is
 *   exception handling, not reading all 60 rows.
 */
export const ImportReviewTable: React.FC<{
  rows: ImportRow[];
  onSave: (edits: RowEdit[]) => void | Promise<void>;
}> = ({ rows, onSave }) => {
  const [drafts, setDrafts] = useState<Record<number, Partial<ImportRow>>>({});
  const pending = useRef<Map<number, RowEdit>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Server rows are authoritative: once a save round-trips, drop the local draft
  // so validation flags and normalised phone numbers show through.
  useEffect(() => {
    setDrafts({});
  }, [rows]);

  const flush = useCallback(() => {
    const edits = [...pending.current.values()];
    pending.current.clear();
    if (edits.length > 0) void onSave(edits);
  }, [onSave]);

  const queueEdit = useCallback(
    (index: number, field: keyof ImportRow, value: string) => {
      setDrafts((current) => ({
        ...current,
        [index]: { ...current[index], [field]: value },
      }));

      const existing = pending.current.get(index) ?? { index };
      if (field === "feeAmount") {
        existing.feeAmount = value === "" ? null : Number(value);
      } else {
        (existing as any)[field] = value === "" ? null : value;
      }
      pending.current.set(index, existing);

      if (timer.current) clearTimeout(timer.current);
      // Long enough that typing a name doesn't fire a request per keystroke,
      // short enough that the ready count feels responsive.
      timer.current = setTimeout(flush, 700);
    },
    [flush]
  );

  const setRowStatus = useCallback(
    (index: number, status: "skipped" | "pending") => {
      if (timer.current) clearTimeout(timer.current);
      pending.current.set(index, { ...(pending.current.get(index) ?? { index }), status });
      flush();
    },
    [flush]
  );

  // Exceptions first, then original register order.
  const ordered = [...rows].sort((a, b) => {
    const rank = (row: ImportRow) =>
      row.status === "needs_review" ? 0 : row.status === "skipped" ? 2 : 1;
    const delta = rank(a) - rank(b);
    return delta !== 0 ? delta : a.index - b.index;
  });

  const valueOf = (row: ImportRow, field: keyof ImportRow): string => {
    const draft = drafts[row.index]?.[field];
    const value = draft !== undefined ? draft : row[field];
    return value === null || value === undefined ? "" : String(value);
  };

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[900px] text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="w-10 px-3 py-2">#</th>
            <th className="px-3 py-2">Student name *</th>
            <th className="px-3 py-2">Parent mobile *</th>
            <th className="px-3 py-2">Sport / batch *</th>
            <th className="px-3 py-2">Parent name</th>
            <th className="px-3 py-2 w-28">Fee (₹)</th>
            <th className="px-3 py-2 w-32">Status</th>
            <th className="px-3 py-2 w-24"></th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((row) => {
            const isSkipped = row.status === "skipped";
            const isCreated = row.status === "created";
            const readOnly = isCreated;

            return (
              <React.Fragment key={row.index}>
                <tr
                  className={[
                    "border-t align-top",
                    isSkipped ? "opacity-50" : "",
                    row.status === "needs_review" ? "bg-amber-50/60" : "",
                    row.status === "failed" ? "bg-red-50/60" : "",
                  ].join(" ")}
                >
                  <td className="px-3 py-2 text-muted-foreground">{row.index + 1}</td>
                  <td className="px-3 py-2">
                    <Input
                      value={valueOf(row, "name")}
                      disabled={readOnly}
                      placeholder="Required"
                      onChange={(event) => queueEdit(row.index, "name", event.target.value)}
                      className={!row.name ? "border-amber-400" : ""}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={valueOf(row, "mobileNumber")}
                      disabled={readOnly}
                      placeholder="10 digits"
                      inputMode="numeric"
                      onChange={(event) =>
                        queueEdit(row.index, "mobileNumber", event.target.value)
                      }
                      className={!row.normalizedPhone ? "border-amber-400" : ""}
                    />
                    {row.normalizedPhone && (
                      <p className="mt-1 text-xs text-muted-foreground">{row.normalizedPhone}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={valueOf(row, "sportOrBatch")}
                      disabled={readOnly}
                      placeholder="Required"
                      onChange={(event) =>
                        queueEdit(row.index, "sportOrBatch", event.target.value)
                      }
                      className={!row.sportOrBatch ? "border-amber-400" : ""}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={valueOf(row, "parentName")}
                      disabled={readOnly}
                      placeholder="Optional"
                      onChange={(event) => queueEdit(row.index, "parentName", event.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={valueOf(row, "feeAmount")}
                      disabled={readOnly}
                      placeholder="Optional"
                      inputMode="numeric"
                      onChange={(event) => queueEdit(row.index, "feeAmount", event.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2">
                    {!isCreated &&
                      (isSkipped ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRowStatus(row.index, "pending")}
                        >
                          <RotateCcw className="mr-1 h-3.5 w-3.5" />
                          Undo
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRowStatus(row.index, "skipped")}
                        >
                          <UserX className="mr-1 h-3.5 w-3.5" />
                          Skip
                        </Button>
                      ))}
                  </td>
                </tr>

                {(row.flags.length > 0 || row.error) && !isSkipped && (
                  <tr
                    className={
                      row.status === "failed" ? "bg-red-50/60" : "bg-amber-50/40"
                    }
                  >
                    <td />
                    <td colSpan={7} className="px-3 pb-3">
                      <ul className="space-y-1">
                        {row.flags.map((flag, position) => (
                          <FlagLine key={position} flag={flag} />
                        ))}
                        {row.error && (
                          <li className="flex items-start gap-2 text-xs text-red-800">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {row.error}
                          </li>
                        )}
                      </ul>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const FlagLine: React.FC<{ flag: ImportRowFlag }> = ({ flag }) => {
  // Transfers and re-imports are informational, not problems to fix.
  const isInformational =
    flag.type === "existing_passport_other_academy" ||
    flag.type === "existing_passport_same_academy";

  return (
    <li
      className={`flex items-start gap-2 text-xs ${
        isInformational ? "text-sky-800" : "text-amber-900"
      }`}
    >
      {isInformational ? (
        <ArrowLeftRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      )}
      <span>{flag.message}</span>
    </li>
  );
};

const StatusBadge: React.FC<{ status: ImportRow["status"] }> = ({ status }) => {
  switch (status) {
    case "ready":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Ready
        </span>
      );
    case "needs_review":
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <AlertCircle className="h-3.5 w-3.5" />
          Needs attention
        </span>
      );
    case "skipped":
      return <Badge variant="outline">Skipped</Badge>;
    case "created":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Imported
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
          <AlertCircle className="h-3.5 w-3.5" />
          Failed
        </span>
      );
    default:
      return null;
  }
};

export default ImportReviewTable;
