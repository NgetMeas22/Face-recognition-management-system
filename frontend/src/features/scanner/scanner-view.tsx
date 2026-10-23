"use client";
/* eslint-disable @next/next/no-img-element -- previews are local blob: URLs */

import { Camera, ImageUp, ScanFace, Trash2 } from "lucide-react";
import { useState } from "react";

import { CameraPanel } from "@/components/camera/camera-panel";
import { ImageDropzone } from "@/components/camera/image-dropzone";
import { OutcomeLegend } from "@/components/camera/outcome-legend";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useImageList, type LocalImage } from "@/hooks/use-image-list";
import { formatBytes } from "@/lib/image-validation";

const RECOGNITION_PENDING = "Recognition API not implemented yet (backend Phase 4)";

function IdentifyButton({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A span keeps the tooltip working on a disabled button. */}
        <span tabIndex={0} className="inline-flex">
          <Button disabled aria-describedby="recognition-pending">
            <ScanFace aria-hidden /> {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent id="recognition-pending">{RECOGNITION_PENDING}</TooltipContent>
    </Tooltip>
  );
}

function SnapshotCard({ image, onDiscard, actionLabel }: { image: LocalImage; onDiscard: () => void; actionLabel: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{image.source === "camera" ? "Captured frame" : image.name}</CardTitle>
        <CardDescription>
          {image.width}×{image.height}px · {formatBytes(image.blob.size)} · held in this tab only, not uploaded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <img src={image.url} alt="Image to scan" className="max-h-80 w-full rounded-lg border object-contain" data-testid="scan-preview" />
        <div className="flex flex-wrap gap-2">
          <IdentifyButton label={actionLabel} />
          <Button variant="outline" onClick={onDiscard}>
            <Trash2 aria-hidden /> Discard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScannerView() {
  const live = useImageList(1);
  const upload = useImageList(1);
  const [tab, setTab] = useState("live");

  return (
    <>
      <PageHeader
        title="Face Scanner"
        description="Identify enrolled, consenting people from the webcam or an uploaded photo. Uncertain results always go to a human; manual check-in stays available."
        availability="partial"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="live">
              <Camera aria-hidden /> Live camera
            </TabsTrigger>
            <TabsTrigger value="upload">
              <ImageUp aria-hidden /> Upload image
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live webcam</CardTitle>
                <CardDescription>The browser asks for permission when you start the camera. Nothing is recorded.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mounted only while this tab is shown, so switching tabs turns the camera off. */}
                {tab === "live" && (
                  <CameraPanel
                    showScanOverlay
                    onCapture={({ blob, width, height }) => {
                      live.clear();
                      live.add({ blob, width, height, source: "camera", name: "camera-frame.jpg" });
                    }}
                  />
                )}
              </CardContent>
            </Card>
            {live.items[0] && <SnapshotCard image={live.items[0]} onDiscard={live.clear} actionLabel="Identify" />}
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload image</CardTitle>
                <CardDescription>
                  Images with several faces get one result per face. Uploads never record attendance automatically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageDropzone
                  onImage={(img) => {
                    upload.clear();
                    upload.add({ blob: img.file, width: img.width, height: img.height, source: "upload", name: img.name });
                  }}
                />
              </CardContent>
            </Card>
            {upload.items[0] && <SnapshotCard image={upload.items[0]} onDiscard={upload.clear} actionLabel="Scan image" />}
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <PlannedFeature
            phase="Phase 4"
            endpoints={["POST /scan/live/sessions", "POST /scan/live/sessions/{sid}/frames", "POST /scan/image", "POST /scan/events/{id}/review"]}
          >
            Camera access, frame capture and file checks work now. Sending images for recognition is disabled until the scan
            endpoints exist.
          </PlannedFeature>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How results will appear</CardTitle>
              <CardDescription>A score is a similarity, not a probability of identity.</CardDescription>
            </CardHeader>
            <CardContent>
              <OutcomeLegend />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
