"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  MessageSquareText,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toastUtils } from "@/utils/toast";
import {
  importService,
  type ImportMethod,
  type ImportRow,
  type ImportCounts,
  type RowEdit,
} from "@/services/importService";
import { ImportReviewTable } from "./ImportReviewTable";

type Step = "choose" | "review" | "done";

interface CommitOutcome {
  created: number;
  failed: number;
  skipped: number;
  passportsReused: number;
  transfers: Array<{ rowIndex: number; studentName: string; fromAcademyName: string }>;
  failures: Array<{ rowIndex: number; name: string | null; error: string }>;
}

/**
 * The bulk import wizard: choose a method → review and edit → confirm.
 *
 * The review step is the whole point of this component. Nothing reaches the
 * database until the owner presses Confirm, so extraction being imperfect is
 * fine — what matters is that every imperfection is visible and one tap from
 * being fixed.
 */
export const ImportWizard: React.FC<{ defaultSport?: string | null }> = ({
  defaultSport = null,
}) => {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<ImportMethod | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [counts, setCounts] = useState<ImportCounts | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [sportFallback, setSportFallback] = useState<string>(defaultSport ?? "");

  const [pastedText, setPastedText] = useState("");
  const [outcome, setOutcome] = useState<CommitOutcome | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const applyExtraction = useCallback((data: any) => {
    setJobId(data.jobId);
    setRows(data.rows);
    setCounts(data.counts);
    setWarning(data.parseWarning ?? null);
    setStep("review");
  }, []);

  const handleError = useCallback((error: any, fallback: string) => {
    const message = error?.message || fallback;
    toastUtils.error("Import failed", message);
  }, []);

  // ---- Extraction ---------------------------------------------------------

  const extractFromImage = async (file: File) => {
    setIsBusy(true);
    setMethod("register_ocr");
    try {
      const dataUrl = await fileToDataUrl(file);
      const response = await importService.extractFromImage(dataUrl, sportFallback || null);
      applyExtraction(response.data);
      toastUtils.success(
        `Read ${response.data.rows.length} entries`,
        "Check each row against your register before confirming."
      );
    } catch (error: any) {
      if (error?.status === 503) {
        toastUtils.error(
          "Photo import unavailable",
          "OCR is not configured on this deployment. Use CSV or WhatsApp text instead."
        );
      } else {
        handleError(error, "Could not read that photo.");
      }
    } finally {
      setIsBusy(false);
    }
  };

  const extractFromText = async () => {
    if (!pastedText.trim()) {
      toastUtils.warning("Nothing to import", "Paste the forwarded student list first.");
      return;
    }
    setIsBusy(true);
    setMethod("whatsapp_text");
    try {
      const response = await importService.extractFromText(pastedText, sportFallback || null);
      applyExtraction(response.data);
      toastUtils.success(`Found ${response.data.rows.length} students`);
    } catch (error) {
      handleError(error, "Could not parse that message.");
    } finally {
      setIsBusy(false);
    }
  };

  const extractFromCsv = async (file: File) => {
    setIsBusy(true);
    setMethod("csv");
    try {
      const content = await file.text();
      const response = await importService.extractFromCsv(
        content,
        file.name,
        sportFallback || null
      );
      applyExtraction(response.data);
      toastUtils.success(`Loaded ${response.data.rows.length} rows from ${file.name}`);
    } catch (error) {
      handleError(error, "Could not read that file.");
    } finally {
      setIsBusy(false);
    }
  };

  // ---- Review edits -------------------------------------------------------

  const saveEdits = useCallback(
    async (edits: RowEdit[]) => {
      if (!jobId || edits.length === 0) return;
      try {
        const response = await importService.updateRows(jobId, edits, sportFallback || null);
        setRows(response.data.rows);
        setCounts(response.data.counts);
      } catch (error) {
        handleError(error, "Could not save that change.");
      }
    },
    [jobId, sportFallback, handleError]
  );

  // ---- Commit -------------------------------------------------------------

  const commit = async () => {
    if (!jobId) return;
    setIsBusy(true);
    try {
      const response = await importService.commit(jobId);
      setOutcome({
        created: response.data.created,
        failed: response.data.failed,
        skipped: response.data.skipped,
        passportsReused: response.data.passportsReused,
        transfers: response.data.transfers ?? [],
        failures: response.data.failures ?? [],
      });
      setCounts(response.data.counts);
      setRows(response.data.rows ?? rows);
      setStep("done");
      toastUtils.success(response.message);
    } catch (error) {
      handleError(error, "Import failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const discard = async () => {
    if (!jobId) {
      reset();
      return;
    }
    try {
      await importService.discard(jobId);
      toastUtils.info?.("Import discarded", "Nothing was saved.");
    } catch {
      // Discarding is best-effort; the staged job is harmless if it lingers.
    }
    reset();
  };

  const reset = () => {
    setStep("choose");
    setMethod(null);
    setJobId(null);
    setRows([]);
    setCounts(null);
    setWarning(null);
    setPastedText("");
    setOutcome(null);
  };

  const readyCount = counts?.ready ?? 0;

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {step === "choose" && (
        <div className="space-y-6">
          <Card className="p-4">
            <label className="text-sm font-medium">
              Default sport or batch
              <span className="ml-2 font-normal text-muted-foreground">
                applied to any row that doesn&apos;t have one
              </span>
            </label>
            <Input
              className="mt-2 max-w-sm"
              placeholder="e.g. Cricket"
              value={sportFallback}
              onChange={(event) => setSportFallback(event.target.value)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Sport is required to save a student. Setting it here means you don&apos;t have to
              type it on every row.
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <MethodCard
              icon={<Camera className="h-6 w-6" />}
              title="Photograph your register"
              description="Take a photo of a page from your paper register. Handwriting in English, Hindi or a regional script is fine."
              action="Choose photo"
              busy={isBusy && method === "register_ocr"}
              onClick={() => imageInputRef.current?.click()}
            />
            <MethodCard
              icon={<MessageSquareText className="h-6 w-6" />}
              title="Paste a WhatsApp list"
              description="Forward or copy a student list out of an existing WhatsApp group and paste it below."
              action="Paste list"
              busy={isBusy && method === "whatsapp_text"}
              onClick={() => setMethod("whatsapp_text")}
            />
            <MethodCard
              icon={<FileSpreadsheet className="h-6 w-6" />}
              title="Upload a CSV"
              description="Any spreadsheet export. Column names are matched automatically."
              action="Choose file"
              busy={isBusy && method === "csv"}
              onClick={() => csvInputRef.current?.click()}
            />
          </div>

          {method === "whatsapp_text" && (
            <Card className="p-4">
              <Textarea
                rows={10}
                placeholder={
                  "1. Rohan Sharma - 9876543210 - 2500\n2. Aditya Verma - 9123456789 - 2500\n3. Priya Nair - 8765432109 - 3000"
                }
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
                className="font-mono text-sm"
              />
              <div className="mt-3 flex items-center gap-2">
                <Button onClick={extractFromText} disabled={isBusy}>
                  {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Read this list
                </Button>
                <Button variant="ghost" onClick={() => setMethod(null)} disabled={isBusy}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void extractFromImage(file);
              event.target.value = "";
            }}
          />
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void extractFromCsv(file);
              event.target.value = "";
            }}
          />
        </div>
      )}

      {step === "review" && counts && (
        <div className="space-y-4">
          <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="secondary">{counts.total} rows read</Badge>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {counts.ready} ready
              </span>
              {counts.needsReview > 0 && (
                <span className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  {counts.needsReview} need attention
                </span>
              )}
              {counts.skipped > 0 && (
                <span className="text-muted-foreground">{counts.skipped} skipped</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={discard} disabled={isBusy}>
                <Trash2 className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button onClick={commit} disabled={isBusy || readyCount === 0}>
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Import {readyCount} student{readyCount === 1 ? "" : "s"}
              </Button>
            </div>
          </Card>

          {warning && (
            <Card className="border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {warning}
            </Card>
          )}

          <Card className="border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            Nothing has been saved yet. Edit anything that looks wrong, skip rows you don&apos;t
            want, then press Import.
          </Card>

          <ImportReviewTable rows={rows} onSave={saveEdits} />
        </div>
      )}

      {step === "done" && outcome && (
        <CommitSummary outcome={outcome} onReset={reset} />
      )}
    </div>
  );
};

const StepIndicator: React.FC<{ step: Step }> = ({ step }) => {
  const steps: Array<{ id: Step; label: string }> = [
    { id: "choose", label: "Choose a method" },
    { id: "review", label: "Review and edit" },
    { id: "done", label: "Imported" },
  ];
  const activeIndex = steps.findIndex((s) => s.id === step);

  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((item, index) => {
        const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "todo";
        return (
          <li key={item.id} className="flex items-center gap-2">
            <span
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                state === "done"
                  ? "bg-emerald-600 text-white"
                  : state === "active"
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            <span className={state === "todo" ? "text-muted-foreground" : "font-medium"}>
              {item.label}
            </span>
            {index < steps.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
          </li>
        );
      })}
    </ol>
  );
};

const MethodCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  busy: boolean;
  onClick: () => void;
}> = ({ icon, title, description, action, busy, onClick }) => (
  <Card className="flex flex-col p-5">
    <div className="mb-3 text-foreground">{icon}</div>
    <h3 className="text-base font-semibold">{title}</h3>
    <p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p>
    <Button className="mt-4 w-full" variant="outline" onClick={onClick} disabled={busy}>
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Upload className="mr-2 h-4 w-4" />
      )}
      {action}
    </Button>
  </Card>
);

const CommitSummary: React.FC<{ outcome: CommitOutcome; onReset: () => void }> = ({
  outcome,
  onReset,
}) => (
  <div className="space-y-4">
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-emerald-600" />
        <div>
          <h3 className="text-xl font-semibold">
            {outcome.created} student{outcome.created === 1 ? "" : "s"} imported
          </h3>
          <p className="text-sm text-muted-foreground">
            Each one now has a Sports Passport. Welcome messages are queued.
          </p>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-4">
        <Stat label="Created" value={outcome.created} />
        <Stat label="Existing passports reused" value={outcome.passportsReused} />
        <Stat label="Skipped" value={outcome.skipped} />
        <Stat label="Failed" value={outcome.failed} tone={outcome.failed > 0 ? "bad" : undefined} />
      </dl>
    </Card>

    {outcome.transfers.length > 0 && (
      <Card className="p-4">
        <h4 className="text-sm font-semibold">Transferred in</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          These students already had a Passport elsewhere. Their history came with them.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {outcome.transfers.map((transfer) => (
            <li key={transfer.rowIndex}>
              <span className="font-medium">{transfer.studentName}</span>
              <span className="text-muted-foreground"> — from {transfer.fromAcademyName}</span>
            </li>
          ))}
        </ul>
      </Card>
    )}

    {outcome.failures.length > 0 && (
      <Card className="border-red-200 bg-red-50 p-4">
        <h4 className="text-sm font-semibold text-red-900">
          {outcome.failures.length} row{outcome.failures.length === 1 ? "" : "s"} could not be
          imported
        </h4>
        <p className="mt-1 text-xs text-red-800">
          Everything else was imported. You can add these manually or re-import them.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-red-900">
          {outcome.failures.map((failure) => (
            <li key={failure.rowIndex}>
              Row {failure.rowIndex + 1}
              {failure.name ? ` (${failure.name})` : ""}: {failure.error}
            </li>
          ))}
        </ul>
      </Card>
    )}

    <Button onClick={onReset}>Import another list</Button>
  </div>
);

const Stat: React.FC<{ label: string; value: number; tone?: "bad" }> = ({
  label,
  value,
  tone,
}) => (
  <div>
    <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
    <dd className={`text-2xl font-semibold ${tone === "bad" ? "text-red-600" : ""}`}>{value}</dd>
  </div>
);

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.readAsDataURL(file);
  });
}

export default ImportWizard;
