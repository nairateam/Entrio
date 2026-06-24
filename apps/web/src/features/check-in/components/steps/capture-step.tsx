'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { Alert, Button } from '@/components/ui';
import { useCheckInStore } from '../../store/use-check-in-store';
import { initials } from '@/lib/format';

export function CaptureStep() {
  const headshot = useCheckInStore((s) => s.headshot);
  const setHeadshot = useCheckInStore((s) => s.setHeadshot);
  const submit = useCheckInStore((s) => s.submit);
  const isSubmitting = useCheckInStore((s) => s.isSubmitting);
  const goTo = useCheckInStore((s) => s.goTo);
  const selectedVisitor = useCheckInStore((s) => s.selectedVisitor);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // The visitor may already have a photo (prior visit / pre-registration).
  const existingPhoto = selectedVisitor?.photoUrl ?? null;
  const [retaking, setRetaking] = useState(false);
  // What's on screen: a fresh capture wins, else the existing photo (until Retake).
  const shown = headshot ?? (retaking ? null : existingPhoto);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera not available on this device.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCameraError('Camera permission denied or unavailable.');
      }
    }

    // Only run the camera when there's nothing to show (new visitor, or after Retake).
    if (!shown) void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [shown]);

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setHeadshot(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  // Fallback when no camera is available — generate a labelled placeholder so
  // the flow stays testable end to end.
  const usePlaceholder = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = 'bold 96px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials(selectedVisitor?.fullName ?? '?'), canvas.width / 2, canvas.height / 2);
    }
    setHeadshot(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  const retake = () => {
    setHeadshot(null);
    setRetaking(true);
  };

  const isExistingPhoto = !headshot && shown === existingPhoto;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Visitor headshot" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-[4/3] w-full bg-black object-cover"
          />
        )}
      </div>

      {isExistingPhoto && (
        <p className="text-sm text-muted-foreground">
          Existing photo on file. Use it, or retake to capture a new one.
        </p>
      )}

      {cameraError && !shown && (
        <Alert variant="info" title="Camera unavailable">
          {cameraError} You can use a placeholder to continue.
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {shown ? (
          <Button variant="outline" onClick={retake}>
            <RotateCcw className="h-4 w-4" />
            Retake
          </Button>
        ) : (
          <>
            <Button onClick={capture} disabled={Boolean(cameraError)}>
              <Camera className="h-4 w-4" />
              Capture
            </Button>
            <Button variant="outline" onClick={usePlaceholder}>
              Use placeholder
            </Button>
          </>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button variant="ghost" size="sm" onClick={() => goTo('security-check')}>
          Back
        </Button>
        <Button onClick={() => void submit()} isLoading={isSubmitting} disabled={!shown}>
          Confirm check-in
        </Button>
      </div>
    </div>
  );
}
