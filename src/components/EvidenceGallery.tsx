import { useState } from "react";
import { Images, ExternalLink, X, Search, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PLACEHOLDER_GALLERY, type AttachedImage } from "@/lib/evidence";
import { projectStore } from "@/lib/store";
import type { Project } from "@/lib/types";
import { GithubImageScanDialog } from "./GithubImageScanDialog";
import { toast } from "sonner";

export function EvidenceGallery({ project }: { project: Project }) {
  const [scanOpen, setScanOpen] = useState(false);
  const [preview, setPreview] = useState<AttachedImage | null>(null);

  const real = (project.attached_images ?? []).filter((i) => i.source !== "placeholder");
  const showPlaceholders = real.length === 0;
  const images = showPlaceholders ? PLACEHOLDER_GALLERY : real;
  const repoFullName = project.github_snapshot?.full_name ?? "";

  return (
    <div className="rounded-md border border-border/60 bg-card/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <Images className="h-3 w-3 text-primary-glow" />
          Visual Evidence
          {!showPlaceholders && <span className="text-border">·</span>}
          {!showPlaceholders && (
            <span className="normal-case tracking-normal text-muted-foreground">
              {real.length} attached
            </span>
          )}
        </div>
        {repoFullName && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 gap-1 px-1.5 text-[10px] font-mono uppercase tracking-wider text-primary-glow hover:bg-primary/10"
            onClick={() => setScanOpen(true)}
          >
            <Search className="h-3 w-3" />
            {real.length > 0 ? "Scan more" : "Scan repo images"}
          </Button>
        )}
      </div>

      {!repoFullName && showPlaceholders && (
        <p className="mb-2 text-[11px] text-muted-foreground">
          Attach a GitHub repo first, then scan it to import visual artifacts.
        </p>
      )}

      {showPlaceholders && (
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Example placeholders — import a repo to replace
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img, i) => (
          <GalleryThumb
            key={img.id}
            image={img}
            index={i + 1}
            onOpen={() => !showPlaceholders && setPreview(img)}
            onRemove={
              showPlaceholders
                ? undefined
                : () => {
                    projectStore.removeImage(project.id, img.id);
                    toast.success("Image removed");
                  }
            }
          />
        ))}
      </div>

      {repoFullName && (
        <GithubImageScanDialog
          projectId={project.id}
          repoFullName={repoFullName}
          open={scanOpen}
          onOpenChange={setScanOpen}
        />
      )}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="font-mono text-xs">
            {preview?.filename}
            <span className="ml-2 text-muted-foreground">{preview?.folder}</span>
          </DialogTitle>
          {preview && (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-md border border-border/60 bg-secondary/40">
                <img
                  src={preview.raw_url}
                  alt={preview.filename}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className="truncate">{preview.repo_full_name}</span>
                {preview.blob_url && (
                  <a
                    href={preview.blob_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary-glow hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open on GitHub
                  </a>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GalleryThumb({
  image,
  onOpen,
  onRemove,
}: {
  image: AttachedImage;
  onOpen: () => void;
  onRemove?: () => void;
}) {
  const isPlaceholder = image.source === "placeholder";
  return (
    <div className="group relative overflow-hidden rounded-md border border-border/60 bg-card/40">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left"
        aria-label={`Open ${image.filename}`}
      >
        <div className="flex aspect-video w-full items-center justify-center overflow-hidden bg-secondary/40">
          {isPlaceholder ? (
            <ImageOff className="h-6 w-6 text-muted-foreground/60" />
          ) : (
            <img
              src={image.raw_url}
              alt={image.filename}
              loading="lazy"
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = "0.15";
              }}
            />
          )}
        </div>
        <div className="space-y-0.5 p-1.5">
          <div className="truncate font-mono text-[10px] text-foreground">{image.filename}</div>
          <div className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            {image.folder}
          </div>
          {image.caption && (
            <div className="truncate text-[10px] text-muted-foreground">{image.caption}</div>
          )}
        </div>
      </button>
      {image.blob_url && !isPlaceholder && (
        <a
          href={image.blob_url}
          target="_blank"
          rel="noreferrer"
          className="absolute left-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded bg-card/80 text-muted-foreground opacity-0 transition-opacity hover:text-primary-glow group-hover:opacity-100"
          aria-label="Open on GitHub"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded bg-card/80 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          aria-label="Remove image"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
