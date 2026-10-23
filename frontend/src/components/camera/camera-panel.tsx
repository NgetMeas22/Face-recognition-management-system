"use client";

import { Camera, CameraOff, Loader2, VideoOff } from "lucide-react";
import { useId, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCamera } from "@/hooks/use-camera";
import { cn } from "@/lib/utils";

export type CapturedFrame = { blob: Blob; width: number; height: number };

/**
 * Live webcam preview with start/stop, camera selection and frame capture. The camera starts only
 * when the user clicks "Start camera", so the browser's permission prompt follows a clear action.
 */
export function CameraPanel({
  onCapture,
  captureLabel = "Capture frame",
  captureDisabled = false,
  showScanOverlay = false,
}: {
  onCapture: (frame: CapturedFrame) => void;
  captureLabel?: string;
  captureDisabled?: boolean;
  showScanOverlay?: boolean;
}) {
  const camera = useCamera();
  const [captureError, setCaptureError] = useState<string | null>(null);
  const selectId = useId();
  const active = camera.status === "active";

  async function handleCapture() {
    setCaptureError(null);
    try {
      onCapture(await camera.capture());
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : "Could not capture the frame.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-muted" data-testid="camera-preview">
        {/* Mirrored like a selfie view; captured frames are not mirrored. */}
        <video
          ref={camera.videoRef}
          className={cn("size-full -scale-x-100 object-cover", !active && "invisible")}
          playsInline
          muted
          aria-label="Live camera preview"
        />
        {active && showScanOverlay && (
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute inset-[12%_22%] rounded-[40%] border-2 border-primary/70 shadow-[0_0_0_9999px_rgb(0_0_0/0.25)]" />
            <div className="absolute inset-x-[22%] h-0.5 bg-primary/80 shadow-[0_0_12px_2px] shadow-primary/60 motion-safe:animate-scan-sweep motion-reduce:top-1/2" />
          </div>
        )}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            {camera.status === "requesting" ? (
              <>
                <Loader2 className="size-8 animate-spin" aria-hidden />
                <p>Waiting for camera permission…</p>
              </>
            ) : (
              <>
                <VideoOff className="size-8" aria-hidden />
                <p>Camera is off. Start it to see a live preview.</p>
              </>
            )}
          </div>
        )}
        {active && (
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            <span className="size-2 rounded-full bg-red-500 motion-safe:animate-pulse" aria-hidden /> Live
          </span>
        )}
      </div>

      {camera.error && (
        <Alert variant="destructive" role="alert">
          <CameraOff aria-hidden />
          <AlertTitle>Camera unavailable</AlertTitle>
          <AlertDescription>{camera.error.message}</AlertDescription>
        </Alert>
      )}
      {captureError && (
        <p className="text-sm text-destructive" role="alert">
          {captureError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {active ? (
          <Button variant="outline" onClick={camera.stop}>
            <CameraOff aria-hidden /> Stop camera
          </Button>
        ) : (
          <Button onClick={() => void camera.start()} disabled={camera.status === "requesting"} data-testid="start-camera">
            <Camera aria-hidden /> {camera.status === "error" ? "Try again" : "Start camera"}
          </Button>
        )}
        <Button variant="secondary" onClick={() => void handleCapture()} disabled={!active || captureDisabled} data-testid="capture-frame">
          {captureLabel}
        </Button>
        {active && camera.devices.length > 1 && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <label htmlFor={selectId} className="sr-only">
              Camera
            </label>
            <Select value={camera.deviceId} onValueChange={(id) => void camera.start(id)}>
              <SelectTrigger id={selectId} className="w-56" aria-label="Choose camera">
                <SelectValue placeholder="Choose camera" />
              </SelectTrigger>
              <SelectContent>
                {camera.devices.map((device, i) => (
                  <SelectItem key={device.deviceId || i} value={device.deviceId}>
                    {device.label || `Camera ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
