'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { EntryButton } from './entry-button';

const BRACKET = 'pointer-events-none absolute h-7 w-7 border-primary/80';
const CORNERS = [
  `${BRACKET} left-4 top-4 border-l-2 border-t-2 rounded-tl-lg`,
  `${BRACKET} right-4 top-4 border-r-2 border-t-2 rounded-tr-lg`,
  `${BRACKET} bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg`,
  `${BRACKET} bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg`,
];

/**
 * Live headshot capture (PRD v2 §3 Steps 5–6) — a entry-grade viewfinder with
 * corner brackets, a circular face guide, a scan sweep, and capture/retake.
 * Emits a JPEG data URL via onChange (null while retaking).
 */
export function PhotoCapture({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;
    async function start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError('Camera not available on this device.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        setError('Camera permission denied or unavailable.');
      }
    }
    if (!value) void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [value]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onChange(canvas.toDataURL('image/jpeg', 0.85));
    stop();
  };

  return (
    <div className="space-y-6">
      <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-xl ring-1 ring-border">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Your photo" className="h-full w-full object-cover" />
        ) : (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />

            {/* Corner brackets */}
            {CORNERS.map((cls, i) => (
              <span key={i} className={cls} />
            ))}

            {/* Circular face guide + scan sweep */}
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="relative h-44 w-44 overflow-hidden rounded-full border-2 border-dashed border-primary/70 sm:h-52 sm:w-52">
                <div className="absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 animate-scan bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
              </div>
            </div>

            {/* REC dot */}
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-foreground/60 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-background backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" /> live
            </div>

            {/* Guidance pill */}
            {!error && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-foreground/70 px-3.5 py-1.5 text-xs font-medium text-background backdrop-blur-sm">
                Align your head inside the circle
              </div>
            )}

            {error && (
              <div className="absolute inset-0 grid place-items-center bg-background/90 p-6 text-center text-sm text-foreground">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {value ? (
          <EntryButton entryVariant="soft" size="lg" onClick={() => onChange(null)} className="px-8">
            <RotateCcw className="h-5 w-5" /> Retake picture
          </EntryButton>
        ) : (
          <EntryButton size="lg" onClick={capture} disabled={Boolean(error)} className="px-10">
            <Camera className="h-5 w-5" /> Capture photo
          </EntryButton>
        )}
      </div>
    </div>
  );
}
