"use client";

import { CheckCircle2, ShieldCheck, Upload, UserRound } from "lucide-react";

import { CameraPanel } from "@/components/camera/camera-panel";
import { ImageDropzone } from "@/components/camera/image-dropzone";
import { ImageThumb } from "@/components/camera/image-thumb";
import { PageHeader } from "@/components/common/page-header";
import { PlannedFeature } from "@/components/common/planned-feature";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useImageList } from "@/hooks/use-image-list";

const MAX_IMAGES = 5;
const TIPS = [
  "One person per image, facing the camera",
  "Even, front lighting — avoid strong backlight",
  "Add slight left/right angles for better matching",
  "Remove sunglasses; keep the face uncovered",
];

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-2 text-sm font-semibold">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function FacesView() {
  const images = useImageList(MAX_IMAGES);

  return (
    <>
      <PageHeader
        title="Face Registration"
        description="Register 3–5 approved face images for a person who has given recorded consent. Only encrypted embeddings are stored; the images themselves are discarded."
        availability="partial"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardContent className="space-y-8 pt-6">
            <Step n={1} title="Choose the person">
              <Select disabled>
                <SelectTrigger className="w-full sm:w-80" aria-label="Person">
                  <UserRound aria-hidden />
                  <SelectValue placeholder="People API not available yet" />
                </SelectTrigger>
                <SelectContent />
              </Select>
            </Step>

            <Step n={2} title="Confirm biometric consent">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                Enrollment is refused unless the person&apos;s latest consent record is GRANTED. Declining must not disadvantage anyone.
              </p>
            </Step>

            <Step n={3} title={`Capture or upload images (${images.items.length}/${MAX_IMAGES})`}>
              <Progress value={(images.items.length / MAX_IMAGES) * 100} aria-label="Images collected" />
              <CameraPanel
                captureLabel="Add frame"
                captureDisabled={images.isFull}
                onCapture={({ blob, width, height }) =>
                  images.add({ blob, width, height, source: "camera", name: `capture-${images.items.length + 1}.jpg` })
                }
              />
              <ImageDropzone
                multiple
                disabled={images.isFull}
                onImage={(img) => images.add({ blob: img.file, width: img.width, height: img.height, source: "upload", name: img.name })}
              />
              {images.items.length > 0 && (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5" aria-label="Collected images" data-testid="collected-images">
                  {images.items.map((img, i) => (
                    <li key={img.id}>
                      <ImageThumb image={img} index={i} onRemove={() => images.remove(img.id)} />
                    </li>
                  ))}
                </ul>
              )}
            </Step>

            <Step n={4} title="Submit for quality check and approval">
              <div className="flex flex-wrap gap-2">
                <Button disabled>
                  <Upload aria-hidden /> Submit {images.items.length || ""} image{images.items.length === 1 ? "" : "s"}
                </Button>
                <Button variant="outline" onClick={images.clear} disabled={images.items.length === 0}>
                  Clear
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Images stay in this tab and are discarded when you leave the page.</p>
            </Step>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <PlannedFeature
            phase="Phases 3–4"
            endpoints={["GET /people", "POST /people/{id}/consents", "POST /people/{id}/faces", "POST /faces/{id}/approve"]}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Capture tips</CardTitle>
              <CardDescription>Better images mean fewer false non-matches.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {TIPS.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
