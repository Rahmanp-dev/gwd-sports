"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import QRCode from "qrcode";
import { API_BASE_URL } from "@/utils/constants";
import { useAppSelector } from "@/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Copy,
  Loader2,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

/**
 * The printable check-in code for each batch.
 *
 * The QR is rendered client-side to a data URI rather than fetched as an image,
 * so nothing has to serve or cache it — and the code itself never travels
 * through a third-party QR service, which for a token that grants check-in
 * would be a needless place to leak it.
 *
 * Rotation is offered plainly but framed honestly: the old code dies the moment
 * a new one is generated, and the wall poster has to be replaced.
 */

interface BatchSummary {
  _id: string;
  name: string;
  sport: string;
  daysOfWeek: string[];
  startTime: string | null;
  endTime: string | null;
  studentCount: number;
}

interface QrData {
  batchId: string;
  batchName: string;
  sport: string;
  token: string;
  checkInUrl: string;
  startTime: string | null;
  endTime: string | null;
  daysOfWeek: string[];
}

export function BatchQrCodes() {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [qr, setQr] = useState<QrData | null>(null);
  const [dataUri, setDataUri] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingQr, setLoadingQr] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const { token } = useAppSelector((s) => s.auth);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/trainer/batches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) {
        const list: BatchSummary[] = res.data.data.batches || [];
        setBatches(list);
        if (!selected && list.length > 0) setSelected(list[0]._id);
      } else {
        setError(res.data?.message || "Could not load batches");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load batches");
    } finally {
      setLoading(false);
    }
    // Seeding the default selection once is intentional; re-running on every
    // selection change would refetch the list for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchQr = useCallback(async () => {
    if (!selected) return;
    setLoadingQr(true);
    setError("");
    setConfirmRotate(false);
    try {
      const res = await axios.get(`${API_BASE_URL}/academy/batches/qr`, {
        params: { batchId: selected },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.success) setQr(res.data.data);
      else setError(res.data?.message || "Could not load the code");
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not load the code");
    } finally {
      setLoadingQr(false);
    }
  }, [selected, token]);

  useEffect(() => {
    if (token) fetchBatches();
  }, [token, fetchBatches]);

  useEffect(() => {
    if (token && selected) fetchQr();
  }, [token, selected, fetchQr]);

  // Render the QR whenever the URL changes — including immediately after a
  // rotation, so the poster on screen is never the dead code.
  useEffect(() => {
    if (!qr?.checkInUrl) {
      setDataUri("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qr.checkInUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    })
      .then((uri) => {
        if (!cancelled) setDataUri(uri);
      })
      .catch(() => {
        if (!cancelled) setError("Could not render the QR image");
      });
    return () => {
      cancelled = true;
    };
  }, [qr?.checkInUrl]);

  const rotate = async () => {
    setRotating(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_BASE_URL}/academy/batches/qr`,
        { batchId: selected },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data?.success) {
        setQr((prev) =>
          prev
            ? {
                ...prev,
                token: res.data.data.token,
                checkInUrl: res.data.data.checkInUrl,
              }
            : prev,
        );
        setConfirmRotate(false);
      } else {
        setError(res.data?.message || "Could not rotate the code");
      }
    } catch (e: any) {
      setError(e.response?.data?.message || "Could not rotate the code");
    } finally {
      setRotating(false);
    }
  };

  const copy = () => {
    if (!qr) return;
    navigator.clipboard.writeText(qr.checkInUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /**
   * Opens a bare printable page rather than printing this dashboard. Printing
   * the surrounding UI wastes a page and produces a poster nobody wants to tape
   * to a wall.
   */
  const print = () => {
    if (!qr || !dataUri) return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    win.document.write(`
      <html><head><title>${qr.batchName} — check-in code</title>
      <style>
        body{font-family:system-ui,sans-serif;text-align:center;padding:48px 24px;color:#0f172a}
        h1{font-size:32px;margin:0 0 4px}
        h2{font-size:18px;font-weight:500;color:#64748b;margin:0 0 32px}
        img{width:380px;height:380px}
        p{color:#64748b;font-size:14px;margin-top:28px;line-height:1.6}
      </style></head>
      <body>
        <h1>${qr.batchName}</h1>
        <h2>${qr.sport}${qr.startTime ? ` · ${qr.startTime}–${qr.endTime ?? ""}` : ""}</h2>
        <img src="${dataUri}" alt="Check-in QR code" />
        <p><strong>Scan to check in</strong><br/>Sign in with your child's account.</p>
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-7 w-7 animate-spin text-red-500" />
        <p className="text-sm font-medium text-slate-500">Loading batches…</p>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
        <QrCode className="mx-auto mb-3 h-9 w-9 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">No batches yet.</p>
        <p className="mt-1 text-xs text-slate-400">
          Batches are created when you import students, or manually per sport.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Check-in codes
        </h2>
        <p className="text-sm text-slate-500">
          Print one per batch and put it where parents drop off.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
        >
          {batches.map((batch) => (
            <option key={batch._id} value={batch._id}>
              {batch.name} · {batch.sport} ({batch.studentCount} students)
            </option>
          ))}
        </select>
        <Button variant="outline" onClick={fetchQr} disabled={loadingQr}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-xs leading-relaxed text-red-700">{error}</p>
        </div>
      )}

      {loadingQr ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : qr ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center p-6">
              {dataUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={dataUri}
                  alt={`Check-in code for ${qr.batchName}`}
                  className="h-56 w-56"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
                </div>
              )}
              <p className="mt-3 text-base font-bold text-slate-900">
                {qr.batchName}
              </p>
              <p className="text-xs text-slate-400">
                {qr.sport}
                {qr.startTime ? ` · ${qr.startTime}–${qr.endTime ?? ""}` : ""}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" onClick={print} disabled={!dataUri}>
                  <Printer className="mr-1.5 h-3.5 w-3.5" /> Print
                </Button>
                <Button size="sm" variant="outline" onClick={copy}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  How it works
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  A parent scans this and signs in with their child's account.
                  The code says <em>which batch</em>; the login says{" "}
                  <em>which child</em> — so one photographed code cannot check in
                  anybody else.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  When it works
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                  Only from an hour before a scheduled session until two hours
                  after it ends, and only on days this batch trains. A photo of
                  the code does nothing at 3am or on a rest day.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(qr.daysOfWeek ?? []).length === 0 ? (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-50 text-[10px] text-amber-700"
                    >
                      no training days set — accepts any day
                    </Badge>
                  ) : (
                    qr.daysOfWeek.map((day) => (
                      <Badge
                        key={day}
                        variant="outline"
                        className="bg-slate-50 text-[10px] capitalize text-slate-600"
                      >
                        {day}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  If the code leaks
                </p>
                {confirmRotate ? (
                  <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs leading-relaxed text-amber-900">
                      Generating a new code kills this one immediately. Any
                      poster already on the wall stops working and must be
                      reprinted. There is no undo.
                    </p>
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        size="sm"
                        onClick={rotate}
                        disabled={rotating}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {rotating ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Generate a new code
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRotate(false)}
                        disabled={rotating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1.5"
                    onClick={() => setConfirmRotate(true)}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Rotate this code
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export default BatchQrCodes;
