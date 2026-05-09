import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Github,
  Loader2,
  Search,
  Star,
  GitFork,
  Lock,
  Archive,
  ShieldCheck,
  AlertTriangle,
  Link as LinkIcon,
} from "lucide-react";
import {
  fetchScannedRepoDetail,
  parseGithubRepo,
  scanGithubRepos,
  snapshotFromDetail,
  type ScannedRepo,
  type ScanError,
} from "@/lib/evidence";
import { projectStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { toast } from "sonner";

interface Props {
  /** Project (Research Object) the snapshot will be attached to. */
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GithubScanDialog({ projectId, open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [matchedOnly, setMatchedOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importingFor, setImportingFor] = useState<string | null>(null);
  const [repos, setRepos] = useState<ScannedRepo[]>([]);
  const [scanned, setScanned] = useState<number | null>(null);
  const [error, setError] = useState<ScanError | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  const runScan = async () => {
    setLoading(true);
    setError(null);
    const res = await scanGithubRepos({
      query: query.trim(),
      limit: 20,
      matchedOnly,
    });
    setLoading(false);
    if ("error" in res) {
      setError(res.error);
      setRepos([]);
      setScanned(null);
      return;
    }
    setRepos(res.repos);
    setScanned(res.total_scanned);
  };

  const importRepo = async (r: ScannedRepo) => {
    setImportingFor(r.full_name);
    const [owner, repo] = r.full_name.split("/");
    const res = await fetchScannedRepoDetail(owner, repo);
    setImportingFor(null);
    if ("error" in res) {
      toast.error(`Couldn't import: ${res.error.message}`);
      return;
    }
    evidenceStore.attachGithubSnapshot(evidenceId, snapshotFromDetail(res.repo));
    toast.success(`Attached ${res.repo.full_name}`);
    onOpenChange(false);
  };

  const importManual = async () => {
    const parsed = parseGithubRepo(manualUrl.trim());
    if (!parsed) {
      toast.error("Enter a valid github.com repo URL");
      return;
    }
    setImportingFor("__manual__");
    const res = await fetchScannedRepoDetail(parsed.owner, parsed.repo);
    setImportingFor(null);
    if ("error" in res) {
      // Fallback: at least save the URL
      evidenceStore.upsertGithub(evidenceId, manualUrl.trim());
      toast.warning(`Saved URL only — metadata fetch failed: ${res.error.message}`);
      onOpenChange(false);
      return;
    }
    evidenceStore.attachGithubSnapshot(evidenceId, snapshotFromDetail(res.repo));
    toast.success(`Attached ${res.repo.full_name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            Scan GitHub for evidence
          </DialogTitle>
          <DialogDescription>
            Read-only scan of repositories you can access. Searches for LuxCore, GRIN, BlendLuxCore,
            xPRIMEray, curved ray tracing. No writes to GitHub are performed.
          </DialogDescription>
        </DialogHeader>

        {/* Search controls */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, description or topic (optional)"
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === "Enter" && runScan()}
            />
            <Button size="sm" onClick={runScan} disabled={loading} className="h-9 gap-1.5">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Scan
            </Button>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={matchedOnly}
              onChange={(e) => setMatchedOnly(e.target.checked)}
              className="h-3 w-3 accent-primary"
            />
            Only show repos matching evidence keywords
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5" />
              {error.kind === "auth" || error.kind === "missing_token"
                ? "GitHub token problem"
                : "Scan failed"}
            </div>
            <p className="mt-1 leading-relaxed">
              {error.kind === "missing_token"
                ? "No server token configured. Add GITHUB_TOKEN in backend secrets."
                : error.kind === "auth"
                  ? "Token rejected. It may be expired or lack repo:read scope."
                  : error.message}
            </p>
            <p className="mt-1 text-muted-foreground">
              You can still paste a public repo URL below.
            </p>
          </div>
        )}

        {/* Results */}
        {!error && (
          <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {scanned !== null && (
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {repos.length} of {scanned} accessible repos shown
              </div>
            )}
            {repos.map((r) => (
              <button
                key={r.full_name}
                onClick={() => importRepo(r)}
                disabled={!!importingFor}
                className="group w-full rounded-md border border-border/60 bg-card/50 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-secondary/40 disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-mono text-xs text-foreground">
                        {r.full_name}
                      </span>
                      {r.private && <Lock className="h-3 w-3 text-muted-foreground" />}
                      {r.archived && <Archive className="h-3 w-3 text-muted-foreground" />}
                      {r.fork && <GitFork className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    {r.description && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                        {r.description}
                      </p>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {r.language && <span>{r.language}</span>}
                      <span className="inline-flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5" />
                        {r.stargazers_count}
                      </span>
                      <span>updated {timeAgo(r.pushed_at)}</span>
                    </div>
                    {r.matched_keywords.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.matched_keywords.map((k) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary-glow ring-1 ring-inset ring-primary/40"
                          >
                            <ShieldCheck className="h-2.5 w-2.5" />
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {importingFor === r.full_name ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-primary-glow">
                      Attach →
                    </span>
                  )}
                </div>
              </button>
            ))}
            {!loading && scanned !== null && repos.length === 0 && (
              <div className="rounded-md border border-border/60 bg-card/40 p-3 text-xs text-muted-foreground">
                No matching repos. Try unchecking the keyword filter or change the query.
              </div>
            )}
          </div>
        )}

        {/* Manual fallback */}
        <div className="space-y-1.5 rounded-md border border-border/60 bg-card/40 p-2.5">
          <Label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <LinkIcon className="h-3 w-3" />
            Or paste a repo URL manually
          </Label>
          <div className="flex gap-2">
            <Input
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs"
              onClick={importManual}
              disabled={importingFor === "__manual__"}
            >
              {importingFor === "__manual__" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Attach"
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
