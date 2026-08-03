"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Award,
  Copy,
  Check,
  ExternalLink,
  Share2,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE SPORTS PASSPORT, ON THE STUDENT'S OWN DASHBOARD
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The Passport used to appear here as a small outline button in a row of two,
 * rendered only `if (passportId)`. That had two failures, and an owner reported
 * both as "I don't see my passport option".
 *
 * 1. WHEN IT EXISTS it looked like a secondary action, next to "My Events",
 *    despite being the single thing a family actually opens and forwards. It is
 *    the product's growth loop and it was styled like a footnote.
 *
 * 2. WHEN IT DOESN'T it vanished completely, with nothing in its place. A
 *    student whose account predates passports, or whose phone number will not
 *    normalise, saw a dashboard that simply had no such feature — no way to
 *    tell whether it was missing, broken, or something they had to earn.
 *    Silence is the worst possible answer to "where is it?".
 *
 * So: a real card, with the QR the coach scans at the gate, the ID a parent
 * quotes on the phone, and one tap to open or share. And when there is no
 * passport yet, it SAYS SO and says what unblocks it, rather than disappearing.
 * ════════════════════════════════════════════════════════════════════════════
 */

export function PassportCard({
  passportId,
  studentName,
}: {
  passportId: string | null;
  studentName?: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Absolute, because this is the URL a parent pastes into WhatsApp — a
  // relative one would be useless the moment it leaves the page.
  const url =
    passportId && typeof window !== "undefined"
      ? `${window.location.origin}/passport/${passportId}`
      : null;

  useEffect(() => {
    if (!url) {
      setQr(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch(() => {
        // A failed QR must not take the card down — the link below it still
        // works, and that is the part that matters.
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Passport link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — long-press the link to copy it manually.");
    }
  };

  const share = async () => {
    if (!url) return;
    const nav = navigator as Navigator & { share?: (d: any) => Promise<void> };
    // The native sheet is the whole point on a phone: it puts the passport one
    // tap from the family WhatsApp group. Desktop has no sheet, so fall back to
    // copying rather than showing a button that does nothing.
    if (nav.share) {
      try {
        await nav.share({
          title: `${studentName ?? "Sports"} Passport`,
          text: `${studentName ? `${studentName}'s` : "My"} training record`,
          url,
        });
        return;
      } catch {
        return; // The user dismissed the sheet. Not an error.
      }
    }
    void copy();
  };

  if (!passportId) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-amber-200">
              Your Sports Passport isn&rsquo;t ready yet
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
              It is issued automatically once your academy has a valid mobile
              number on your account. Ask them to check the number on your
              profile — it needs to be a 10-digit Indian mobile. Your training
              record is being kept either way; only the shareable page is
              waiting.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          {/* The QR. Sized for a phone held up at the gate in daylight —
              anything smaller and the scanner hunts for it. */}
          <div className="flex-shrink-0 self-center">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qr}
                alt="Passport QR code"
                className="h-[132px] w-[132px] rounded-xl bg-white p-2"
              />
            ) : (
              <div className="flex h-[132px] w-[132px] items-center justify-center rounded-xl bg-slate-700/50">
                <QrCode className="h-8 w-8 text-slate-500" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">
                Sports Passport
              </h3>
            </div>

            <p className="mt-2 font-mono text-lg font-bold tracking-widest text-amber-300">
              {passportId}
            </p>

            <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
              Your permanent training record — attendance, progress, badges and
              the tournaments you&rsquo;ve played. It belongs to you, not to an
              academy: if you move, it moves with you.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => window.open(`/passport/${passportId}`, "_blank")}
                className="bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={share}
                className="border-slate-600 bg-transparent text-white hover:bg-slate-700"
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={copy}
                className="border-slate-600 bg-transparent text-white hover:bg-slate-700"
              >
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PassportCard;
