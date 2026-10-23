"use client";
/* eslint-disable @next/next/no-img-element -- previews are local blob: URLs */

import {
  Camera,
  CheckCircle2,
  HelpCircle,
  ImageUp,
  ScanFace,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CameraPanel } from "@/components/camera/camera-panel";
import { ImageDropzone } from "@/components/camera/image-dropzone";
import { OutcomeLegend } from "@/components/camera/outcome-legend";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageList } from "@/hooks/use-image-list";
import { formatBytes } from "@/lib/image-validation";
import { useI18n } from "@/lib/i18n";

type ScanOutcomeType = "IDLE" | "MATCH" | "REVIEW" | "NO_MATCH";

export function ScannerView() {
  const live = useImageList(1);
  const upload = useImageList(1);
  const [tab, setTab] = useState("live");
  const { isKhmer, t } = useI18n();

  const [scanOutcome, setScanOutcome] = useState<ScanOutcomeType>("IDLE");
  const [isScanning, setIsScanning] = useState(false);
  const [manualVerified, setManualVerified] = useState(false);

  const activeImage = tab === "live" ? live.items[0] : upload.items[0];

  const handleSimulatedScan = (forcedOutcome?: ScanOutcomeType) => {
    setIsScanning(true);
    setManualVerified(false);
    setTimeout(() => {
      setIsScanning(false);
      const outcome = forcedOutcome || (tab === "live" ? "MATCH" : "REVIEW");
      setScanOutcome(outcome);
      if (outcome === "MATCH") {
        toast.success(isKhmer ? "ការស្កេនជោគជ័យ៖ ត្រូវគ្នាយ៉ាងត្រឹមត្រូវ" : "Face match verified");
      } else if (outcome === "REVIEW") {
        toast.warning(isKhmer ? "ត្រូវការការផ្ទៀងផ្ទាត់ដោយផ្ទាល់" : "Verification review required");
      } else {
        toast.error(isKhmer ? "មិនស្គាល់អត្តសញ្ញាណ" : "No matching profile found");
      }
    }, 600);
  };

  const handleManualVerify = () => {
    setManualVerified(true);
    toast.success(t.scanner.manualVerifySuccess);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.scanner.title}
        description={t.scanner.subtitle}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Left Column: Input Source */}
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(val) => { setTab(val); setScanOutcome("IDLE"); }}>
            <TabsList className="grid w-full grid-cols-2 max-w-xs h-9">
              <TabsTrigger value="live" className="text-xs font-semibold gap-1.5">
                <Camera className="size-3.5" aria-hidden /> {t.scanner.liveCamera}
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs font-semibold gap-1.5">
                <ImageUp className="size-3.5" aria-hidden /> {t.scanner.uploadImage}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live" className="mt-4 space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold">{t.scanner.liveCamera}</CardTitle>
                  <CardDescription className="text-xs">{t.scanner.cameraPrompt}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {tab === "live" && (
                    <CameraPanel
                      showScanOverlay
                      onCapture={({ blob, width, height }) => {
                        live.clear();
                        live.add({ blob, width, height, source: "camera", name: "camera-frame.jpg" });
                        setScanOutcome("IDLE");
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="mt-4 space-y-4">
              <Card className="border-border/80 shadow-xs">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm font-semibold">{t.scanner.uploadImage}</CardTitle>
                  <CardDescription className="text-xs">{t.scanner.uploadPrompt}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <ImageDropzone
                    onImage={(img) => {
                      upload.clear();
                      upload.add({ blob: img.file, width: img.width, height: img.height, source: "upload", name: img.name });
                      setScanOutcome("IDLE");
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Snapshot & Actions */}
          {activeImage && (
            <Card className="border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{t.scanner.snapshot}</CardTitle>
                    <CardDescription className="text-xs">
                      {activeImage.width}×{activeImage.height}px · {formatBytes(activeImage.blob.size)}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (tab === "live") live.clear();
                      else upload.clear();
                      setScanOutcome("IDLE");
                    }}
                    className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3 mr-1" />
                    {t.common.discard}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative overflow-hidden rounded-lg border bg-black/5 dark:bg-black/30">
                  <img
                    src={activeImage.url}
                    alt="Scan preview"
                    className="max-h-64 w-full object-contain mx-auto"
                    data-testid="scan-preview"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => handleSimulatedScan("MATCH")}
                    disabled={isScanning}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    <ScanFace className="size-3.5" aria-hidden />
                    {isScanning ? t.common.loading : t.scanner.identify}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSimulatedScan("REVIEW")}
                    disabled={isScanning}
                    className="h-8 text-xs"
                  >
                    {isKhmer ? "តេស្តពិនិត្យ" : "Simulate Review"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSimulatedScan("NO_MATCH")}
                    disabled={isScanning}
                    className="h-8 text-xs"
                  >
                    {isKhmer ? "តេស្តមិនស្គាល់" : "Simulate Unknown"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Result & Legend */}
        <div className="space-y-4">
          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{t.scanner.resultTitle}</CardTitle>
                {scanOutcome !== "IDLE" && (
                  <Badge
                    variant={
                      scanOutcome === "MATCH" || manualVerified
                        ? "secondary"
                        : scanOutcome === "REVIEW"
                        ? "outline"
                        : "destructive"
                    }
                    className={
                      scanOutcome === "MATCH" || manualVerified
                        ? "bg-success/15 text-success border-success/30 text-[11px]"
                        : scanOutcome === "REVIEW"
                        ? "bg-warning/15 text-warning-foreground dark:text-warning border-warning/40 text-[11px]"
                        : "text-[11px]"
                    }
                  >
                    {scanOutcome === "MATCH" || manualVerified
                      ? t.scanner.match
                      : scanOutcome === "REVIEW"
                      ? t.scanner.needsReview
                      : t.scanner.noMatch}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {scanOutcome === "IDLE" && (
                <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
                  <ScanFace className="size-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-semibold text-foreground">{t.scanner.readyToScan}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                    {t.scanner.cameraPrompt}
                  </p>
                </div>
              )}

              {/* Match Confirmed */}
              {(scanOutcome === "MATCH" || manualVerified) && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-3 text-success">
                    <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{t.scanner.match}</p>
                      <p className="text-[11px] opacity-90">{t.scanner.matchDesc}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                        JD
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground">John Doe</p>
                        <p className="text-xs text-muted-foreground">EMP-00104 · Engineering</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                      <div>
                        <span className="text-muted-foreground text-[11px] block">{t.scanner.similarityScore}</span>
                        <span className="font-semibold text-foreground font-mono">0.96 (High)</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px] block">{t.common.status}</span>
                        <span className="font-semibold text-success">{t.attendance.onTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Needs Review */}
              {scanOutcome === "REVIEW" && !manualVerified && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/15 p-3 text-warning-foreground dark:text-warning">
                    <HelpCircle className="size-5 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{t.scanner.needsReview}</p>
                      <p className="text-[11px] opacity-90">{t.scanner.needsReviewDesc}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t.scanner.similarityScore}</span>
                      <span className="font-mono font-semibold text-warning-foreground dark:text-warning">0.74 (Uncertain)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{isKhmer ? "បេក្ខភាពត្រូវគ្នា" : "Candidate Match"}</span>
                      <span className="font-semibold">Sarah Connor (EMP-00219)</span>
                    </div>

                    <div className="pt-2 border-t border-border/60">
                      <Button
                        onClick={handleManualVerify}
                        className="w-full h-8 text-xs font-semibold gap-1.5"
                      >
                        <UserCheck className="size-3.5" />
                        {t.scanner.manualVerify}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Unknown Face */}
              {scanOutcome === "NO_MATCH" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                    <UserX className="size-5 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{t.scanner.noMatch}</p>
                      <p className="text-[11px] opacity-90">{t.scanner.noMatchDesc}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-muted/20 p-3 text-xs flex items-start gap-2.5 text-muted-foreground">
                    <ShieldAlert className="size-4 shrink-0 text-muted-foreground mt-0.5" />
                    <span>{t.scanner.privacyNotice}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isKhmer ? "លទ្ធផលស្កេន" : "Scan Result Types"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <OutcomeLegend />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
