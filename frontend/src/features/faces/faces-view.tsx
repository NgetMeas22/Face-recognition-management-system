"use client";

import { CheckCircle2, ShieldCheck, Trash2, Upload, UserRound } from "lucide-react";

import { CameraPanel } from "@/components/camera/camera-panel";
import { ImageDropzone } from "@/components/camera/image-dropzone";
import { ImageThumb } from "@/components/camera/image-thumb";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useImageList } from "@/hooks/use-image-list";
import { useI18n } from "@/lib/i18n";

const MAX_IMAGES = 5;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-xs">
          {n}
        </span>
        {title}
      </h2>
      <div className="pl-7">{children}</div>
    </section>
  );
}

export function FacesView() {
  const images = useImageList(MAX_IMAGES);
  const { t } = useI18n();

  const tips = [t.faces.tip1, t.faces.tip2, t.faces.tip3, t.faces.tip4];

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.faces.title}
        description={t.faces.subtitle}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold">{t.faces.title}</CardTitle>
            <CardDescription className="text-xs">{t.faces.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <Step n={1} title={t.faces.step1}>
              <Select disabled>
                <SelectTrigger className="w-full sm:w-80 h-9 text-xs" aria-label="Person">
                  <UserRound className="size-4 text-muted-foreground mr-1.5" aria-hidden />
                  <SelectValue placeholder={t.faces.selectPerson} />
                </SelectTrigger>
                <SelectContent />
              </Select>
            </Step>

            <Step n={2} title={t.faces.step2}>
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-success" aria-hidden />
                  <span>{t.faces.consentNotice}</span>
                </p>
              </div>
            </Step>

            <Step n={3} title={`${t.faces.step3} (${images.items.length}/${MAX_IMAGES})`}>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Progress value={(images.items.length / MAX_IMAGES) * 100} className="h-2 flex-1" aria-label="Images collected" />
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {images.items.length} / {MAX_IMAGES}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">{t.scanner.liveCamera}</p>
                    <CameraPanel
                      captureLabel={t.faces.addFrame}
                      captureDisabled={images.isFull}
                      onCapture={({ blob, width, height }) =>
                        images.add({ blob, width, height, source: "camera", name: `capture-${images.items.length + 1}.jpg` })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-foreground">{t.scanner.uploadImage}</p>
                    <ImageDropzone
                      multiple
                      disabled={images.isFull}
                      onImage={(img) =>
                        images.add({ blob: img.file, width: img.width, height: img.height, source: "upload", name: img.name })
                      }
                    />
                  </div>
                </div>

                {images.items.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">{t.faces.collectedImages}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={images.clear}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3 mr-1" />
                        {t.faces.clearAll}
                      </Button>
                    </div>
                    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5" aria-label="Collected images" data-testid="collected-images">
                      {images.items.map((img, i) => (
                        <li key={img.id}>
                          <ImageThumb image={img} index={i} onRemove={() => images.remove(img.id)} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Step>

            <Step n={4} title={t.faces.step4}>
              <div className="flex flex-wrap items-center gap-2">
                <Button disabled className="h-8 gap-1.5 text-xs font-semibold">
                  <Upload className="size-3.5" aria-hidden />
                  {t.faces.submitApproval} ({images.items.length})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={images.clear}
                  disabled={images.items.length === 0}
                  className="h-8 text-xs"
                >
                  {t.faces.clearAll}
                </Button>
              </div>
            </Step>
          </CardContent>
        </Card>

        {/* Guidelines Sidebar */}
        <div>
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">{t.faces.tipsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <ul className="space-y-2 text-xs text-muted-foreground">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
