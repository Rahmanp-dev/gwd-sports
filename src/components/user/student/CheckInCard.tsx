"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Keyboard,
  Loader2,
  QrCode,
  X,
} from "lucide-react";
import { extractToken } from "@/lib/attendance/checkInToken";

/**
 * Check-in, from the student's own account.
 *
 * THE GAP THIS FILLS. Phase 3 built the whole QR flow — a code on the wall, a
 * `/check-in/<token>` page, a scan window, an idempotent recorder — and left no
 * way to reach it from inside the app. The only entry point was a phone's
 * native camera, which works but which nobody would guess, so the feature was
 * effectively invisible to the people it was built for.
 *
 * SCANNING WORKS EVERYWHERE, IN TWO TIERS. It previously relied solely on the
 * browser's built-in `BarcodeDetector`. That covers Android Chrome — and
 * nothing else. iOS Safari, Firefox and Chrome on Windows have no such API, so
 * on those the card hid the camera button entirely and told the reader to go
 * use a different app. For most people testing this, the scanner simply did not
 * appear to exist.
 *
 * So: `BarcodeDetector` when the browser has it (native, fastest, no download),
 * and jsQR decoding video frames on a canvas everywhere else. The camera button
 * is now always offered, because the camera always works.
 *
 * The student's login IS the identity. The code only says which batch; the
 * account says which child — which is why one photographed code cannot check in
 * anybody else.
 */

type Mode = "idle" | "scanning" | "manual";

declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

export function CheckInCard() {
  const [mode, setMode] = useState<Mode>("idle");
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Releasing the camera on unmount is not optional — a live stream left
  // running keeps the phone's camera light on after the user has navigated
  // away, which reads as the app spying on them.
  useEffect(() => stopCamera, [stopCamera]);

  const go = (token: string) => {
    stopCamera();
    window.location.href = `/check-in/${token}`;
  };

  const startScanning = async () => {
    setError("");
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Rear camera: a wall poster is never in front of the selfie lens.
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setMode("scanning");

      // The <video> only exists once mode flips, so wait a frame for it.
      requestAnimationFrame(async () => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);

        const native =
          typeof window.BarcodeDetector === "function"
            ? new window.BarcodeDetector({ formats: ["qr_code"] })
            : null;

        /**
         * jsQR is loaded on demand, and only on browsers without the native
         * detector — no reason to ship a decoder to Android Chrome, which
         * already has one built in.
         */
        const decode = native
          ? async (): Promise<string | null> => {
              const codes = await native.detect(videoRef.current!);
              return codes[0]?.rawValue ?? null;
            }
          : await (async () => {
              const jsQR = (await import("jsqr")).default;
              return async (): Promise<string | null> => {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                if (!video || !canvas || !video.videoWidth) return null;

                // Cap the sampled frame: decoding a full 1080p frame every tick
                // makes a mid-range Android phone stutter badly.
                const scale = Math.min(1, 640 / video.videoWidth);
                canvas.width = Math.round(video.videoWidth * scale);
                canvas.height = Math.round(video.videoHeight * scale);

                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                if (!ctx) return null;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const { data, width, height } = ctx.getImageData(
                  0, 0, canvas.width, canvas.height,
                );
                return jsQR(data, width, height, {
                  inversionAttempts: "dontInvert",
                })?.data ?? null;
              };
            })();

        const tick = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const raw = await decode();
            const token = raw ? extractToken(raw) : null;
            if (token) return go(token);
          } catch {
            // A single failed frame is normal while focusing. Keep going.
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      });
    } catch (err: any) {
      setError(
        err?.name === "NotAllowedError"
          ? "Camera permission was denied. Allow it in your browser settings, or type the code instead."
          : "Could not open the camera. Type the code instead.",
      );
      setMode("idle");
    } finally {
      setStarting(false);
    }
  };

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const token = extractToken(manualCode);
    if (!token) {
      setError("That does not look like a check-in code. It is 32 letters and numbers.");
      return;
    }
    go(token);
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-950/50">
          <QrCode className="h-5 w-5 text-green-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-white">Check in to today's session</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-400">
            Scan the code your academy has put up at the entrance. Your coach
            still confirms the register, so this is a head start, not a
            replacement.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-800/50 bg-amber-950/40 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <p className="text-xs leading-relaxed text-amber-200">{error}</p>
        </div>
      )}

      {mode === "scanning" ? (
        <div className="mt-4">
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-56 w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-36 w-36 rounded-lg border-2 border-white/70" />
            </div>
            {/* Offscreen scratch surface the jsQR path samples frames into. */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <p className="mt-2 text-center text-[11px] text-gray-500">
            Point at the code. It will check you in by itself.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              stopCamera();
              setMode("idle");
            }}
            className="mt-2 w-full border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
        </div>
      ) : mode === "manual" ? (
        <form onSubmit={submitManual} className="mt-4 space-y-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Paste the link or type the code"
            autoFocus
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-sm text-white focus:border-green-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
              Check in
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMode("idle");
                setError("");
              }}
              className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              Back
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-2">
          {/* Always offered now — the jsQR fallback means every browser can
              scan, so there is no case where this button would not work. */}
          <Button
            onClick={startScanning}
            disabled={starting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {starting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Camera className="mr-2 h-4 w-4" />
            )}
            Scan the code
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              setMode("manual");
              setError("");
            }}
            className="w-full border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
          >
            <Keyboard className="mr-2 h-4 w-4" /> Enter the code manually
          </Button>
        </div>
      )}

      <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-500">
        <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0" />
        You are checked in as the student signed in on this device — the code
        only identifies the batch.
      </p>
    </div>
  );
}

export default CheckInCard;
