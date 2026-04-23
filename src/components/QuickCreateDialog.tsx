import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, PRIORITIES, STATUSES, type Category, type Priority, type Status } from "@/lib/types";
import { projectStore } from "@/lib/store";
import { toast } from "sonner";

interface Props {
  trigger?: React.ReactNode;
}

export function QuickCreateDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<Category>("Engineering");
  const [status, setStatus] = useState<Status>("Backlog");
  const [priority, setPriority] = useState<Priority>("Medium");

  function reset() {
    setTitle("");
    setSummary("");
    setCategory("Engineering");
    setStatus("Backlog");
    setPriority("Medium");
  }

  function handleCreate(openDetail: boolean) {
    if (!title.trim()) {
      toast.error("Give your project a title.");
      return;
    }
    const project = projectStore.create({
      title: title.trim(),
      short_summary: summary.trim(),
      category,
      status,
      priority,
    });
    toast.success("Project added to the lab.");
    reset();
    setOpen(false);
    if (openDetail) navigate(`/projects/${project.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-glow hover:opacity-95">
            <Plus className="h-4 w-4" /> New project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] border-border bg-card shadow-elevated">
        <DialogHeader>
          <DialogTitle>New project entry</DialogTitle>
          <DialogDescription>
            Capture it now, refine it later. You can fill in everything else from the detail page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="qc-title">Title</Label>
            <Input
              id="qc-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Plasma chamber telemetry rewrite"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qc-summary">Short summary <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="qc-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One-line description of what this is."
              rows={2}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleCreate(false)}>Create</Button>
          <Button
            onClick={() => handleCreate(true)}
            className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-95"
          >
            Create & open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
