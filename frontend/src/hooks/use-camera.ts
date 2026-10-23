"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "active" | "error";
export type CameraErrorCode = "insecure" | "unsupported" | "denied" | "not-found" | "in-use" | "constraints" | "ended" | "unknown";
export type CameraError = { code: CameraErrorCode; message: string };

const MESSAGES: Record<CameraErrorCode, string> = {
  insecure: "The camera only works over HTTPS or on localhost. Open the app via http://localhost:3000.",
  unsupported: "This browser does not support camera access.",
  denied: "Camera permission was denied. Allow camera access in the browser's site settings, then try again.",
  "not-found": "No camera was found. Connect a webcam, or use Upload image instead.",
  "in-use": "The camera is being used by another application. Close it and try again.",
  constraints: "The selected camera does not support the requested resolution.",
  ended: "The camera was disconnected.",
  unknown: "The camera could not be started.",
};

export function cameraErrorFrom(error: unknown): CameraError {
  const name = error instanceof DOMException || error instanceof Error ? error.name : "";
  const code: CameraErrorCode =
    name === "NotAllowedError" || name === "SecurityError"
      ? "denied"
      : name === "NotFoundError" || name === "DevicesNotFoundError"
        ? "not-found"
        : name === "NotReadableError" || name === "TrackStartError" || name === "AbortError"
          ? "in-use"
          : name === "OverconstrainedError"
            ? "constraints"
            : "unknown";
  return { code, message: MESSAGES[code] };
}

/**
 * Webcam access via getUserMedia. The stream is stopped on stop(), on unmount, and when Next.js
 * hides the route after navigation (effects are cleaned up), so the camera light never stays on
 * in the background. Nothing is recorded or uploaded here.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const attempt = useRef(0);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [error, setError] = useState<CameraError | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | undefined>();

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.onended = null;
      track.stop();
    });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stop = useCallback(() => {
    attempt.current += 1; // cancel any start() still waiting for permission
    releaseStream();
    setStatus("idle");
  }, [releaseStream]);

  const start = useCallback(
    async (requestedDeviceId?: string) => {
      if (typeof window === "undefined") return;
      if (!window.isSecureContext) {
        setError({ code: "insecure", message: MESSAGES.insecure });
        setStatus("error");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError({ code: "unsupported", message: MESSAGES.unsupported });
        setStatus("error");
        return;
      }

      const current = ++attempt.current;
      releaseStream();
      setError(null);
      setStatus("requesting");

      try {
        const size = { width: { ideal: 1280 }, height: { ideal: 720 } };
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: requestedDeviceId ? { deviceId: { exact: requestedDeviceId }, ...size } : { facingMode: "user", ...size },
        });
        if (current !== attempt.current) {
          stream.getTracks().forEach((t) => t.stop()); // stopped or restarted meanwhile
          return;
        }
        streamRef.current = stream;
        const [track] = stream.getVideoTracks();
        track.onended = () => {
          releaseStream();
          setError({ code: "ended", message: MESSAGES.ended });
          setStatus("error");
        };
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setDeviceId(track.getSettings().deviceId);
        setStatus("active");
        // Device labels are only exposed after permission is granted.
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter((d) => d.kind === "videoinput"));
      } catch (err) {
        if (current !== attempt.current) return;
        releaseStream();
        setError(cameraErrorFrom(err));
        setStatus("error");
      }
    },
    [releaseStream],
  );

  /** Grabs the current frame as a JPEG (un-mirrored, at the camera's native resolution). */
  const capture = useCallback(async (): Promise<{ blob: Blob; width: number; height: number }> => {
    const video = videoRef.current;
    if (!video || status !== "active" || video.videoWidth === 0) throw new Error("The camera is not ready yet.");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not capture the frame.");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) throw new Error("Could not capture the frame.");
    return { blob, width: canvas.width, height: canvas.height };
  }, [status]);

  useEffect(
    () => () => {
      attempt.current += 1;
      releaseStream();
      setStatus("idle");
    },
    [releaseStream],
  );

  return { videoRef, status, error, devices, deviceId, start, stop, capture };
}
