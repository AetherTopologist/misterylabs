import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Images,
  Loader2,
  AlertTriangle,
  Check,
  ExternalLink,
  ImageOff,
} from "lucide-react";
import {
  evidenceStore,
  makeAttachedImage,
  scanRepoImages,
  type ScanError,
  type ScannedImage,
} from "@/lib/evidence";
import { toast } from "sonner";

interface Props {
  evidenceId: string;
  repoFullName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GithubImageScanDialog({ evidenceId, repoFullName, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ScannedImage[]>([]);
  const [capped, setCapped] = useState(false);
  const [cap, setCap] = useState(24);
  const [error, setError] = useState<ScanError | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const run = async () => {
    const [owner, repo] = repoFullName.split("/");
    if (!owner || !repo) {
      setError({ kind: "github", message: "Invalid repo identifier" });
      return;
    }
    setLoading(true);
    setError(null);
    setImages([]);
    setSelected(new Set());
    const res = await scanRepoImages(owner, repo);
    setLoading(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setImages(res.images);
    setCapped(res.capped);
    setCap(res.cap);
    // Default-select all scanned images
    setSelected(new Set(res.images.map((i) => i.raw_url)));
  };

  useEffect(() => {
    if (open) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, repoFullName]);

  const toggle = (url: string) => {
    const next = new Set(selected);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === images.length) setSelected(new Set());
    else setSelected(new Set(images.map((i) => i.raw_url)));
  };

  const attach = () => {
    const picks = images.filter((i) => selected.has(i.raw_url));
    if (picks.length === 0) {
      toast.error("Select at least one image");
      return;
    }
    evidenceStore.attachImages(
      evidenceId,
      picks.map((p) => makeAttachedImage(p, repoFullName)),
    );
    toast.success(`Attached ${picks.length} image${picks.length === 1 ? "" : "s"}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            Scan repo images — {repoFullName}
          </DialogTitle>
          <DialogDescription>
            Read-only scan of README-linked images and known artifact folders. Capped at {cap} images
            per repo. No files are downloaded — only metadata + URLs are stored.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Scanning README and artifact folders…
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error.kind === "auth" || error.kind === "missing_token"
                ? "GitHub token problem"
                : "Image scan failed"}
            </div>
            <p className="mt-1 leading-relaxed">{error.message}</p>
          </div>
        )}

        {!loading && !error && images.length === 0 && (
          <div className="rounded-md border border-border/60 bg-card/40 p-4 text-center text-xs text-muted-foreground">
            <ImageOff className="mx-auto mb-1 h-5 w-5" />
            No images found in README or known artifact folders.
          </div>
        )}

        {images.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {selected.size} / {images.length} selected
                {capped && <span className="ml-2 text-warning">· cap reached, more may exist</span>}
              </div>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={toggleAll}>
                {selected.size === images.length ? "Deselect all" : "Select all"}
              </Button>
            </div>

            <div className="grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
              {images.map((img) => {
                const isSelected = selected.has(img.raw_url);
                return (
                  <button
                    key={img.raw_url}
                    type="button"
                    onClick={() => toggle(img.raw_url)}
                    className={`group relative overflow-hidden rounded-md border text-left transition-colors ${
                      isSelected
                        ? "border-primary/60 ring-1 ring-primary/40"
                        : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-secondary/40">
                      <img
                        src={img.raw_url}
                        alt={img.filename}
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.opacity = "0.2";
                        }}
                      />
                    </div>
                    <div className="space-y-0.5 p-1.5">
                      <div className="truncate font-mono text-[10px] text-foreground">
                        {img.filename}
                      </div>
                      <div className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                        {img.folder}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <a
                      href={img.blob_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded bg-card/80 text-muted-foreground opacity-0 transition-opacity hover:text-primary-glow group-hover:opacity-100"
                      aria-label="Open on GitHub"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={attach} disabled={selected.size === 0 || loading}>
            Attach {selected.size > 0 ? `${selected.size} ` : ""}image{selected.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
