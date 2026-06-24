# Visual Observatory Audit v0.1

Generated: 2026-06-24  
Analysed: 35 source files across 15 routes

## Summary

| Severity | Count |
|---|---|
| 🔴 CRITICAL | 7 |
| 🟠 HIGH | 36 |
| 🟡 MEDIUM | 111 |
| 🔵 LOW | 15 |
| **Total** | **169** |

## Detector Reference

| ID | Name | What it catches |
|---|---|---|
| D1 | Text < 11px | `text-[Npx]` where N < 11 (content text) or N < 9 (decorative uppercase stamp) |
| D2 | min-w > viewport | `min-w-[Npx]` where N > 390 — exceeds mobile viewport width |
| D3 | Fixed height > 600px | `h-[Npx]` where N > 600 — may push content below fold on short viewports |
| D4 | Hardcoded hex/rgb color | `bg-[#hex]`, `from-[#hex]`, or `background: #hex` bypassing CSS token system |
| D5 | Missing clamp typography | Heading with `text-5xl+` but no `clamp()` — abrupt resize or mobile overflow |
| D6 | overflow-hidden on diagram | `overflow-hidden` combined with `min-w-[Npx]` — content clips with no scroll |
| D7 | dark-only Tailwind override | `dark:text-*` or `dark:bg-*` without a corresponding semantic token |
| D8 | Panel layer bypass | `bg-background/N` (alpha-mix) instead of semantic `--layer-*` token |

## Route-by-Route Findings

### 🔴 `/atlas`

81 findings

#### 🔴 F-OBS-022 — Text < 11px

**File:** `src/pages/Atlas.tsx:1184`  
**Severity:** CRITICAL  
**Issue:** Text size 8px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[8px] text-muted-foreground/25">{p.n}</span>
```
**Fix:** Replace `text-[8px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🔴 F-OBS-040 — Text < 11px

**File:** `src/pages/Atlas.tsx:1502`  
**Severity:** CRITICAL  
**Issue:** Text size 8px (content text) is below the 11px content floor.  
**Code:**
```
className="inline-flex items-center gap-1 rounded-sm border border-border/22 bg-secondary/20 px-2 py-0.5 font-mono text-
```
**Fix:** Replace `text-[8px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🔴 F-OBS-042 — Text < 11px

**File:** `src/pages/Atlas.tsx:1516`  
**Severity:** CRITICAL  
**Issue:** Text size 8px (content text) is below the 11px content floor.  
**Code:**
```
className="inline-flex items-center gap-1 rounded-sm border border-border/30 bg-secondary/25 px-2 py-0.5 font-mono text-
```
**Fix:** Replace `text-[8px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🔴 F-OBS-047 — Text < 11px

**File:** `src/pages/Atlas.tsx:1581`  
**Severity:** CRITICAL  
**Issue:** Text size 8px (content text) is below the 11px content floor.  
**Code:**
```
<span className="shrink-0 font-mono text-[8px] tabular-nums text-muted-foreground/28">
```
**Fix:** Replace `text-[8px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🔴 F-OBS-071 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:722`  
**Severity:** CRITICAL  
**Issue:** Text size 8px (content text) is below the 11px content floor.  
**Code:**
```
<div className="mt-2 text-[8px] font-mono tracking-[0.15em] text-amber-400/60">
```
**Fix:** Replace `text-[8px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🔴 F-OBS-082 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:366`  
**Severity:** CRITICAL  
**Issue:** Text size 8px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[8px] italic text-muted-foreground/28 hidden sm:inline">
```
**Fix:** Replace `text-[8px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-013 — Text < 11px

**File:** `src/pages/Atlas.tsx:922`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="mr-3 shrink-0 font-mono text-[7px] uppercase tracking-[0.4em] text-muted-foreground/30">
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟠 F-OBS-015 — Text < 11px

**File:** `src/pages/Atlas.tsx:1066`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className={`shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.2em] ${MATURITY_ST
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟠 F-OBS-029 — Text < 11px

**File:** `src/pages/Atlas.tsx:1264`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<div className="mt-1 font-mono text-[9px] text-muted-foreground/30">27,619 pixels</div>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-031 — Text < 11px

**File:** `src/pages/Atlas.tsx:1269`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<div className="mt-1 font-mono text-[9px] text-muted-foreground/30">of 129,600 total px</div>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-033 — Text < 11px

**File:** `src/pages/Atlas.tsx:1273`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<div className="mt-1 space-y-0.5 font-mono text-[9px] text-muted-foreground/35">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-034 — Text < 11px

**File:** `src/pages/Atlas.tsx:1378`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] text-muted-foreground/40">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-041 — Text < 11px

**File:** `src/pages/Atlas.tsx:1506`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="ml-0.5 text-[7px] uppercase tracking-[0.15em] text-amber-400/35">
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟠 F-OBS-048 — Text < 11px

**File:** `src/pages/Atlas.tsx:1584`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="rounded-sm border border-border/22 bg-secondary/20 px-2 py-0.5 font-mono text-[9px] text-muted-foregrou
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-049 — Text < 11px

**File:** `src/pages/Atlas.tsx:1588`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] text-muted-foreground/25">↓</span>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-050 — Text < 11px

**File:** `src/pages/Atlas.tsx:1598`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[7px] uppercase tracking-[0.3em] text-muted-foreground/30">
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟠 F-OBS-051 — Text < 11px

**File:** `src/pages/Atlas.tsx:1601`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] text-amber-400/55">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-056 — Text < 11px

**File:** `src/pages/Atlas.tsx:1866`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[7px] uppercase tracking-[0.25em]">{typeLabel}</span>
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟠 F-OBS-061 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:570`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
className="grid h-8 w-8 place-items-center rounded border border-border/60 bg-background/70 font-mono text-[9px] upperca
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-065 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:643`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
className="rounded-full border border-border/60 bg-secondary/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-067 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:669`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
{m.caption && <figcaption className="px-2 py-1 text-[9px] text-muted-foreground/70 font-mono tracking-tight">{m.caption}
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-068 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:670`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
{m.resonanceNote && <p className="px-2 pb-1 text-[9px] italic text-primary-glow/70">{m.resonanceNote}</p>}
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-069 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:691`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
{m.caption && <div className="px-2 py-1 text-[9px] text-muted-foreground/70 font-mono">{m.caption}</div>}
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-070 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:692`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
{m.resonanceNote && <p className="px-2 pb-2 text-[9px] italic text-primary-glow/70">{m.resonanceNote}</p>}
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-081 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:361`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="rounded-sm border border-amber-500/18 bg-amber-950/15 px-1.5 py-0.5 font-mono text-[7px] uppercase trac
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟠 F-OBS-083 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:375`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
className="rounded-sm border border-border/20 bg-secondary/20 px-2 py-0.5 font-mono text-[9px] text-muted-foreground/48"
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-085 — Text < 11px

**File:** `src/components/ResonanceSpheresAtlas.tsx:245`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<div className="font-mono text-[9px] uppercase tracking-widest text-amber-400/70 mb-2">Jump to node</div>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-014 — Text < 11px

**File:** `src/pages/Atlas.tsx:1063`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className={`font-mono text-[8px] uppercase tracking-[0.3em] ${card.accent}`}>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-016 — Text < 11px

**File:** `src/pages/Atlas.tsx:1074`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mt-3 pt-3 border-t border-border/20 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foregrou
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-017 — Text < 11px

**File:** `src/pages/Atlas.tsx:1108`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.45em] text-muted-foreground/30">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-018 — Text < 11px

**File:** `src/pages/Atlas.tsx:1112`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.35em] text-cyan-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-019 — Text < 11px

**File:** `src/pages/Atlas.tsx:1116`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/25">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-020 — Text < 11px

**File:** `src/pages/Atlas.tsx:1135`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="block font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/25 mb-1.5">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-021 — Text < 11px

**File:** `src/pages/Atlas.tsx:1170`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-4 font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/30">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-023 — Text < 11px

**File:** `src/pages/Atlas.tsx:1205`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/35">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-024 — Text < 11px

**File:** `src/pages/Atlas.tsx:1209`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/25">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-025 — Text < 11px

**File:** `src/pages/Atlas.tsx:1218`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-026 — Text < 11px

**File:** `src/pages/Atlas.tsx:1235`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.4em] text-muted-foreground/30">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-027 — Text < 11px

**File:** `src/pages/Atlas.tsx:1253`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-4 font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/30">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-028 — Text < 11px

**File:** `src/pages/Atlas.tsx:1258`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/25 mb-1">Dominant transition</div>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-030 — Text < 11px

**File:** `src/pages/Atlas.tsx:1267`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/25 mb-1">Classification shift</div
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-032 — Text < 11px

**File:** `src/pages/Atlas.tsx:1272`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/25 mb-1">Controls held fixed</div>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-035 — Text < 11px

**File:** `src/pages/Atlas.tsx:1411`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.35em] text-amber-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-036 — Text < 11px

**File:** `src/pages/Atlas.tsx:1441`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/55">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-037 — Text < 11px

**File:** `src/pages/Atlas.tsx:1445`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="rounded-sm border border-amber-500/22 bg-amber-950/20 px-2 py-0.5 font-mono text-[8px] uppercase tracki
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-038 — Text < 11px

**File:** `src/pages/Atlas.tsx:1472`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<p className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-039 — Text < 11px

**File:** `src/pages/Atlas.tsx:1486`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-043 — Text < 11px

**File:** `src/pages/Atlas.tsx:1528`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-044 — Text < 11px

**File:** `src/pages/Atlas.tsx:1538`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-cyan-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-045 — Text < 11px

**File:** `src/pages/Atlas.tsx:1563`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/45">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-046 — Text < 11px

**File:** `src/pages/Atlas.tsx:1575`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-3 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-052 — Text < 11px

**File:** `src/pages/Atlas.tsx:1614`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
className="rounded-sm border border-border/22 bg-secondary/20 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15e
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-053 — Text < 11px

**File:** `src/pages/Atlas.tsx:1755`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-3 font-mono text-[8px] uppercase tracking-[0.45em] text-amber-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-054 — Text < 11px

**File:** `src/pages/Atlas.tsx:1829`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.2em] opacity-60">{label}</span>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-055 — Text < 11px

**File:** `src/pages/Atlas.tsx:1830`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[10px] font-semibold">{value}</span>
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-057 — Text < 11px

**File:** `src/pages/Atlas.tsx:1871`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-muted-foreground/35">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-059 — Missing clamp typography

**File:** `src/pages/Atlas.tsx:1758`  
**Severity:** MEDIUM  
**Issue:** Heading class `text-5xl` has no smaller mobile base and no `clamp()` — will be oversized at 390px.  
**Code:**
```
<h2 className="text-4xl font-bold tracking-tight md:text-5xl">
```
**Fix:** Replace with fluid sizing: `[font-size:clamp(1.875rem,8vw,4.5rem)]` for h1, `clamp(1.5rem,5vw,3rem)` for h2.

---

#### 🟡 F-OBS-062 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:614`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-063 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:622`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-064 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:630`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-066 — Text < 11px

**File:** `src/components/FractalInspirationAtlas.tsx:654`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-cyan-400/70">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-075 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:220`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.35em] text-amber-400/55">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-076 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:248`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-077 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:267`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-078 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:311`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="rounded-sm border border-amber-500/25 bg-amber-950/22 px-2 py-0.5 font-mono text-[8px] uppercase tracki
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-079 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:335`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.18em] text-primary/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-080 — Text < 11px

**File:** `src/components/FractalAcademia.tsx:356`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className={`font-mono text-[8px] uppercase tracking-[0.25em] ${s.badge}`}>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-084 — Text < 11px

**File:** `src/components/ResonanceSpheresAtlas.tsx:238`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<div className="text-center mt-2 text-[10px] font-mono tracking-[0.2em] text-muted-foreground/70">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-086 — Text < 11px

**File:** `src/components/ResonanceSpheresAtlas.tsx:299`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<Badge variant="outline" className="text-amber-400 border-amber-400/30 text-[10px]">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-087 — Text < 11px

**File:** `src/components/ResonanceSpheresAtlas.tsx:303`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<Badge className="bg-cyan-500/10 text-cyan-400 text-[10px]">{expanded.node.zenoXeno.toUpperCase()}</Badge>
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-088 — Text < 11px

**File:** `src/components/ResonanceSpheresAtlas.tsx:396`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span key={tag} className="px-2 py-0.5 text-[10px] rounded bg-secondary/30 border border-border/30 font-mono text-muted-
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-089 — Text < 11px

**File:** `src/components/ResonanceSpheresAtlas.tsx:416`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
{link.credit && <span className="text-[10px] text-muted-foreground/50">({link.credit})</span>}
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-090 — Text < 11px

**File:** `src/components/ResonanceSpheresAtlas.tsx:420`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<p className="mt-3 text-[10px] text-amber-600 dark:text-amber-400/60 italic">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-091 — Missing clamp typography

**File:** `src/components/ResonanceSpheresAtlas.tsx:131`  
**Severity:** MEDIUM  
**Issue:** Heading class `text-5xl` has no smaller mobile base and no `clamp()` — will be oversized at 390px.  
**Code:**
```
<h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
```
**Fix:** Replace with fluid sizing: `[font-size:clamp(1.875rem,8vw,4.5rem)]` for h1, `clamp(1.5rem,5vw,3rem)` for h2.

---

#### 🔵 F-OBS-058 — Missing clamp typography

**File:** `src/pages/Atlas.tsx:1122`  
**Severity:** LOW  
**Issue:** Breakpoint-stepped heading `text-5xl` jumps at a hard breakpoint. On narrow screens between steps, sizing may be abrupt.  
**Code:**
```
<h1 className="mt-8 max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
```
**Fix:** Consider `[font-size:clamp(1.875rem,6vw,3.75rem)]` for fully fluid scaling with no snap.

---

#### 🔵 F-OBS-060 — Panel layer bypass

**File:** `src/pages/Atlas.tsx:1841`  
**Severity:** LOW  
**Issue:** `bg-background/50` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
: "text-muted-foreground/50 border-border/25 bg-background/50";
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

#### 🔵 F-OBS-072 — Fixed height > 600px

**File:** `src/components/FractalInspirationAtlas.tsx:507`  
**Severity:** LOW  
**Issue:** Fixed height h-[640px] exceeds 600px. On short viewports (768×1024 tablet landscape) this may push content below fold.  
**Code:**
```
className="fractal-canvas relative mt-8 h-[640px] w-full overflow-hidden rounded-2xl border border-border/60 shadow-glow
```
**Fix:** Use `max-h-[640px]` + `overflow-y-auto`, or responsive variant like `h-[420px] lg:h-[640px]`.

---

#### 🔵 F-OBS-073 — Panel layer bypass

**File:** `src/components/FractalInspirationAtlas.tsx:542`  
**Severity:** LOW  
**Issue:** `bg-background/60` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
<div className="rounded border border-border/40 bg-background/60 px-2 py-1 backdrop-blur">
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

#### 🔵 F-OBS-074 — Panel layer bypass

**File:** `src/components/FractalInspirationAtlas.tsx:578`  
**Severity:** LOW  
**Issue:** `bg-background/60` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
<div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded border border-border/40 bg-background/60 px-3 
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

#### 🔵 F-OBS-092 — dark-only Tailwind override

**File:** `src/components/ResonanceSpheresAtlas.tsx:136`  
**Severity:** LOW  
**Issue:** `dark:text-amber-400` is a dark-only Tailwind override. The base class may render incorrectly in light mode without a matching semantic token.  
**Code:**
```
anchored to the xPRIMEray transport observatory. <span className="text-amber-600 dark:text-amber-400/80">Coherence-maxxe
```
**Fix:** Migrate both light and dark states to a single semantic token: `text-[hsl(var(--annotation-amber))]` instead of `text-amber-500 dark:text-amber-400`.

---

#### 🔵 F-OBS-093 — dark-only Tailwind override

**File:** `src/components/ResonanceSpheresAtlas.tsx:420`  
**Severity:** LOW  
**Issue:** `dark:text-amber-400` is a dark-only Tailwind override. The base class may render incorrectly in light mode without a matching semantic token.  
**Code:**
```
<p className="mt-3 text-[10px] text-amber-600 dark:text-amber-400/60 italic">
```
**Fix:** Migrate both light and dark states to a single semantic token: `text-[hsl(var(--annotation-amber))]` instead of `text-amber-500 dark:text-amber-400`.

---

### 🔴 `/observatory/poisson-dot`

12 findings

#### 🔴 F-OBS-125 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:335`  
**Severity:** CRITICAL  
**Issue:** Text size 8px (content text) is below the 11px content floor.  
**Code:**
```
<div className="flex justify-between font-mono text-[8px] text-muted-foreground/28">
```
**Fix:** Replace `text-[8px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-123 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:305`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
className="rounded-sm border border-border/30 px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-for
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-124 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:318`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className={`font-mono text-[10px] font-semibold tabular-nums ${isNeg ? "text-rose-400" : "text-amber-400"}`}>
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-126 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:348`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[10px] font-semibold tabular-nums text-cyan-400">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-127 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:365`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[10px] font-semibold tabular-nums text-violet-400">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-128 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:382`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[10px] font-semibold tabular-nums text-sky-400">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-129 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:405`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-130 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:413`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-131 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:421`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-132 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:429`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-133 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:438`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/38">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-134 — Text < 11px

**File:** `src/components/PoissonDotAndNegativeIOR.tsx:472`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-violet-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

### 🟠 `/`

12 findings

#### 🟠 F-OBS-006 — Text < 11px

**File:** `src/pages/Index.tsx:402`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<div className="mt-1.5 font-mono text-[9px] text-muted-foreground/30">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-001 — Text < 11px

**File:** `src/pages/Index.tsx:162`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<p className="mt-2.5 font-mono text-[10px] text-muted-foreground/40">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-002 — Text < 11px

**File:** `src/pages/Index.tsx:237`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className={`mt-0.5 font-mono text-[8px] uppercase tracking-[0.18em] ${panel.accent}`}>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-003 — Text < 11px

**File:** `src/pages/Index.tsx:376`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-004 — Text < 11px

**File:** `src/pages/Index.tsx:383`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<p className="mt-2.5 border-t border-border/25 pt-2 font-mono text-[10px] leading-snug text-muted-foreground/45">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-005 — Text < 11px

**File:** `src/pages/Index.tsx:395`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/35">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-007 — Text < 11px

**File:** `src/pages/Index.tsx:469`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<p className="mt-4 font-mono text-[10px] text-muted-foreground/50">— MisterY Labs</p>
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-008 — Text < 11px

**File:** `src/pages/Index.tsx:472`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="font-mono text-[8px] uppercase tracking-[0.35em] text-muted-foreground/40 mb-3">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-009 — Text < 11px

**File:** `src/pages/Index.tsx:523`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-3 font-mono text-[8px] uppercase tracking-[0.45em] text-amber-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-010 — Missing clamp typography

**File:** `src/pages/Index.tsx:101`  
**Severity:** MEDIUM  
**Issue:** Heading class `text-5xl` has no smaller mobile base and no `clamp()` — will be oversized at 390px.  
**Code:**
```
<h1 className="mx-auto max-w-2xl text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7x
```
**Fix:** Replace with fluid sizing: `[font-size:clamp(1.875rem,8vw,4.5rem)]` for h1, `clamp(1.5rem,5vw,3rem)` for h2.

---

#### 🟡 F-OBS-011 — Missing clamp typography

**File:** `src/pages/Index.tsx:313`  
**Severity:** MEDIUM  
**Issue:** Heading class `text-5xl` has no smaller mobile base and no `clamp()` — will be oversized at 390px.  
**Code:**
```
<h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
```
**Fix:** Replace with fluid sizing: `[font-size:clamp(1.875rem,8vw,4.5rem)]` for h1, `clamp(1.5rem,5vw,3rem)` for h2.

---

#### 🟡 F-OBS-012 — Missing clamp typography

**File:** `src/pages/Index.tsx:526`  
**Severity:** MEDIUM  
**Issue:** Heading class `text-5xl` has no smaller mobile base and no `clamp()` — will be oversized at 390px.  
**Code:**
```
<h2 className="text-4xl font-bold tracking-tight md:text-5xl">
```
**Fix:** Replace with fluid sizing: `[font-size:clamp(1.875rem,8vw,4.5rem)]` for h1, `clamp(1.5rem,5vw,3rem)` for h2.

---

### 🟠 `/media`

6 findings

#### 🟠 F-OBS-099 — Text < 11px

**File:** `src/pages/Media.tsx:349`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[7px] uppercase tracking-[0.2em] text-foreground/30">
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟠 F-OBS-101 — Text < 11px

**File:** `src/pages/Media.tsx:430`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] text-muted-foreground/50 tabular-nums">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-098 — Text < 11px

**File:** `src/pages/Media.tsx:292`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="rounded-sm border border-border/40 bg-secondary/30 px-1.5 py-0.5 font-mono text-[8px] uppercase trackin
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-100 — Text < 11px

**File:** `src/pages/Media.tsx:359`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<div className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground/65 line-clamp-2 sm:text-[10px]">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-102 — Text < 11px

**File:** `src/pages/Media.tsx:522`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<p className="mt-4 border-t border-border/15 pt-3 text-[10px] italic text-muted-foreground/35">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🔵 F-OBS-103 — Panel layer bypass

**File:** `src/pages/Media.tsx:347`  
**Severity:** LOW  
**Issue:** `bg-background/60` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
<span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-sm bg-background/60 px-1.5 py-0.5 backdrop-bl
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

### 🟠 `/observatory`

9 findings

#### 🟠 F-OBS-107 — Text < 11px

**File:** `src/components/OpsStatusBar.tsx:88`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<div className="flex items-center gap-3 text-[9px] tracking-[0.2em]">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-108 — Text < 11px

**File:** `src/components/OpsStatusBar.tsx:114`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<div className="text-[9px]">{label}</div>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-110 — Text < 11px

**File:** `src/components/OpsStatusBar.tsx:141`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="ml-1 font-mono text-[9px] font-normal tracking-wider text-muted-foreground">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-104 — Text < 11px

**File:** `src/pages/Observatory.tsx:162`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<div className="inline-flex items-center rounded-full bg-secondary/50 px-3 py-1 text-[10px] font-mono tracking-[0.2em] t
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-105 — Text < 11px

**File:** `src/pages/Observatory.tsx:298`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className="text-[10px] text-amber-400">DIFFERENCE FIXTURE</span>
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-109 — Text < 11px

**File:** `src/components/OpsStatusBar.tsx:115`  
**Severity:** MEDIUM  
**Issue:** Text size 10.5px (content text) is below the 11px content floor.  
**Code:**
```
<div className={`mt-0.5 readout text-[10.5px] normal-case tracking-wider ${color}`}>
```
**Fix:** Replace `text-[10.5px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🔵 F-OBS-106 — dark-only Tailwind override

**File:** `src/pages/Observatory.tsx:339`  
**Severity:** LOW  
**Issue:** `dark:text-cyan-400` is a dark-only Tailwind override. The base class may render incorrectly in light mode without a matching semantic token.  
**Code:**
```
<div className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400/60 dark:text-cyan-400/60">LIVING CONSTELLA
```
**Fix:** Migrate both light and dark states to a single semantic token: `text-[hsl(var(--annotation-amber))]` instead of `text-amber-500 dark:text-amber-400`.

---

#### 🔵 F-OBS-111 — Panel layer bypass

**File:** `src/components/OpsStatusBar.tsx:113`  
**Severity:** LOW  
**Issue:** `bg-background/40` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
<div className="rounded border border-border/60 bg-background/40 px-2 py-1">
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

#### 🔵 F-OBS-112 — Panel layer bypass

**File:** `src/components/OpsStatusBar.tsx:134`  
**Severity:** LOW  
**Issue:** `bg-background/40` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
<div className="relative overflow-hidden rounded border border-border/60 bg-background/40 px-2.5 py-1.5">
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

### 🟠 `/observatory/quaternion`

13 findings

#### 🟠 F-OBS-141 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:490`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className={`font-mono text-[9px] font-semibold ${cls}`}>{k}</span>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-147 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:523`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<p className="mt-1.5 text-[9px] leading-relaxed text-muted-foreground/65">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-135 — Text < 11px

**File:** `src/pages/observatory/Quaternion.tsx:32`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.3em] text-cyan-400/45">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-136 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:279`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className={`w-4 shrink-0 font-mono text-[10px] font-semibold uppercase ${vc.label}`}>
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-137 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:449`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/70">Live orbit</span>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-138 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:459`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-139 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:470`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-140 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:481`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-142 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:498`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-143 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:501`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<div className="font-mono text-[10px] tabular-nums text-foreground/70">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-144 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:507`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/65">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-145 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:518`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/50">Formula</div>
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-146 — Text < 11px

**File:** `src/components/QuaternionExplorer.tsx:519`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<div className="font-mono text-[10px] leading-relaxed text-muted-foreground/60">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

### 🟠 `/observatory/higher-dimensional`

19 findings

#### 🟠 F-OBS-154 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:308`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] text-muted-foreground/40">{desc}</span>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-157 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:356`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] text-muted-foreground/45">{label}</span>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-158 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:357`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] font-semibold tabular-nums text-foreground/75">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-159 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:363`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<p className="mt-2 text-[9px] leading-relaxed text-muted-foreground/38">
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-162 — Text < 11px

**File:** `src/components/CubeNetExplorer.tsx:813`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
className={`rounded-sm border py-1.5 font-mono text-[9px] font-semibold transition-colors ${
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟠 F-OBS-164 — Text < 11px

**File:** `src/components/CubeNetExplorer.tsx:838`  
**Severity:** HIGH  
**Issue:** Text size 9px (content text) is below the 11px content floor.  
**Code:**
```
<span className="font-mono text-[9px] text-muted-foreground/60">{fc.name}</span>
```
**Fix:** Replace `text-[9px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-148 — Text < 11px

**File:** `src/pages/observatory/HigherDimensional.tsx:47`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className={`mb-2 font-mono text-[8px] uppercase tracking-[0.3em] ${lm ? "text-violet-700/75" : "text-violet-400/50"
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-149 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:249`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/70">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-150 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:261`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-151 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:274`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-152 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:297`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2.5 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-153 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:306`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<span className={`w-7 font-mono text-[10px] font-semibold ${col}`}>{plane}</span>
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-155 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:315`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-156 — Text < 11px

**File:** `src/components/TesseractExplorer.tsx:345`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.2em] text-violet-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-160 — Text < 11px

**File:** `src/components/CubeNetExplorer.tsx:644`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1 font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/45">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-161 — Text < 11px

**File:** `src/components/CubeNetExplorer.tsx:744`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/35">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-163 — Text < 11px

**File:** `src/components/CubeNetExplorer.tsx:826`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-2 font-mono text-[8px] uppercase tracking-[0.25em] text-muted-foreground/35">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-165 — Text < 11px

**File:** `src/components/CubeNetExplorer.tsx:846`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.3em] text-violet-400/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-166 — Text < 11px

**File:** `src/components/CubeNetExplorer.tsx:874`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.2em] text-foreground/50">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

### 🟠 `shared`

3 findings

#### 🟠 F-OBS-168 — Text < 11px

**File:** `src/components/SiteFooter.tsx:19`  
**Severity:** HIGH  
**Issue:** Text size 7px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[7px] uppercase tracking-[0.3em] text-muted-foreground/25">
```
**Fix:** Raise `text-[7px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-167 — Text < 11px

**File:** `src/components/SiteFooter.tsx:5`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="flex flex-wrap items-center justify-between gap-4 font-mono text-[8px] uppercase tracking-[0.25em] text-
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-169 — Hardcoded hex/rgb color

**File:** `src/index.css:343`  
**Severity:** MEDIUM  
**Issue:** Hardcoded color `background-color: #12131a` bypasses the semantic token system. Will not respond to light/dark theme.  
**Code:**
```
background-color: #12131a;
```
**Fix:** Replace with a CSS var token: `bg-[hsl(var(--layer-panel))]`, `text-[hsl(var(--ink-primary))]`, etc. See src/index.css for available tokens.

---

### 🟡 `/research`

4 findings

#### 🟡 F-OBS-094 — Text < 11px

**File:** `src/pages/Research.tsx:227`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-095 — Text < 11px

**File:** `src/pages/Research.tsx:230`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-096 — Text < 11px

**File:** `src/pages/Research.tsx:233`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<span className="font-mono text-[8px] uppercase tracking-[0.3em] text-muted-foreground/40">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-097 — Text < 11px

**File:** `src/pages/Research.tsx:388`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
className={`rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] ${badge.cls}`}
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

### 🟡 `/broch-sphere`

5 findings

#### 🟡 F-OBS-113 — min-w > viewport

**File:** `src/components/brochSphere/BrochSpherePrototype.tsx:226`  
**Severity:** MEDIUM  
**Issue:** min-w-[720px] exceeds mobile viewport but a scroll wrapper exists. Verify `overflow-x-auto` is on the direct parent, not a grandparent.  
**Code:**
```
className="h-[420px] w-full min-w-[720px] lg:h-[520px]"
```
**Fix:** Ensure the direct parent has `overflow-x-auto`. Consider adding a scroll hint (fade or chevron) on mobile for discoverability.

---

#### 🔵 F-OBS-114 — Missing clamp typography

**File:** `src/components/brochSphere/BrochSpherePrototype.tsx:120`  
**Severity:** LOW  
**Issue:** Breakpoint-stepped heading `text-5xl` jumps at a hard breakpoint. On narrow screens between steps, sizing may be abrupt.  
**Code:**
```
<h1 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
```
**Fix:** Consider `[font-size:clamp(1.875rem,6vw,3.75rem)]` for fully fluid scaling with no snap.

---

#### 🔵 F-OBS-115 — Panel layer bypass

**File:** `src/components/brochSphere/BrochSpherePrototype.tsx:127`  
**Severity:** LOW  
**Issue:** `bg-background/40` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
<div className="rounded-lg border border-border/40 bg-background/40 p-3 text-sm text-muted-foreground">
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

#### 🔵 F-OBS-116 — Panel layer bypass

**File:** `src/components/brochSphere/BrochSpherePrototype.tsx:693`  
**Severity:** LOW  
**Issue:** `bg-background/30` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
className="h-auto justify-start rounded-lg border-amber-500/25 bg-background/30 px-3 py-2 text-left"
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

#### 🔵 F-OBS-117 — Panel layer bypass

**File:** `src/components/brochSphere/BrochTransferEventCard.tsx:55`  
**Severity:** LOW  
**Issue:** `bg-background/40` bypasses the panel layer token system. Alpha-mixed background values produce different results in light vs dark.  
**Code:**
```
<div className="mt-4 rounded-md border border-amber-500/25 bg-background/40 p-3">
```
**Fix:** Use semantic layer tokens: `bg-[hsl(var(--layer-panel))]` or `bg-[hsl(var(--layer-panel-strong))]`. Avoid raw `bg-background/N` on panels.

---

### 🟡 `/observatory/force-graph`

2 findings

#### 🟡 F-OBS-118 — Text < 11px

**File:** `src/pages/observatory/ForceGraph.tsx:109`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
className="px-2.5 py-0.5 text-[10px] font-mono border border-border/40 bg-card/30 rounded-sm text-muted-foreground/80 tr
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

#### 🟡 F-OBS-119 — Text < 11px

**File:** `src/pages/observatory/ForceGraph.tsx:132`  
**Severity:** MEDIUM  
**Issue:** Text size 10px (content text) is below the 11px content floor.  
**Code:**
```
<div className="mt-8 pt-4 border-t border-border/30 text-[10px] text-muted-foreground/40 font-mono tracking-[0.2em]">
```
**Fix:** Replace `text-[10px]` with `text-[11px]` minimum, or `[font-size:clamp(11px,2.5vw,13px)]` for responsive sizing.

---

### 🟡 `/observatory/transport-sphere`

3 findings

#### 🟡 F-OBS-120 — Text < 11px

**File:** `src/pages/observatory/TransportSphere.tsx:34`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className={`font-mono text-[8px] uppercase tracking-[0.3em] ${lm ? "text-foreground/65" : "text-muted-foreground/25
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-121 — Text < 11px

**File:** `src/pages/observatory/TransportSphere.tsx:38`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className={`font-mono text-[8px] uppercase tracking-[0.3em] ${lm ? "text-cyan-700/75" : "text-cyan-400/35"}`}>n(x) 
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

#### 🟡 F-OBS-122 — Text < 11px

**File:** `src/pages/observatory/TransportSphere.tsx:48`  
**Severity:** MEDIUM  
**Issue:** Text size 8px (decorative uppercase stamp) is below the 8px decorative floor.  
**Code:**
```
<div className="font-mono text-[8px] uppercase tracking-[0.45em] text-muted-foreground/30 mb-2">
```
**Fix:** Raise `text-[8px]` to `text-[9px]` minimum for decorative stamps, or use `text-[11px]` if this conveys readable information.

---

## Remediation Tickets

Priority order (CRITICAL → LOW), within severity by detector ID.

| Ticket | Sev | Detector | Route | File:Line |
|---|---|---|---|---|
| F-OBS-022 | CRITICAL | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1184` |
| F-OBS-040 | CRITICAL | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1502` |
| F-OBS-042 | CRITICAL | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1516` |
| F-OBS-047 | CRITICAL | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1581` |
| F-OBS-071 | CRITICAL | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:722` |
| F-OBS-082 | CRITICAL | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:366` |
| F-OBS-125 | CRITICAL | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:335` |
| F-OBS-006 | HIGH | D1 Text < 11px | `/` | `src/pages/Index.tsx:402` |
| F-OBS-013 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:922` |
| F-OBS-015 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1066` |
| F-OBS-029 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1264` |
| F-OBS-031 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1269` |
| F-OBS-033 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1273` |
| F-OBS-034 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1378` |
| F-OBS-041 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1506` |
| F-OBS-048 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1584` |
| F-OBS-049 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1588` |
| F-OBS-050 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1598` |
| F-OBS-051 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1601` |
| F-OBS-056 | HIGH | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1866` |
| F-OBS-061 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:570` |
| F-OBS-065 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:643` |
| F-OBS-067 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:669` |
| F-OBS-068 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:670` |
| F-OBS-069 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:691` |
| F-OBS-070 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:692` |
| F-OBS-081 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:361` |
| F-OBS-083 | HIGH | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:375` |
| F-OBS-085 | HIGH | D1 Text < 11px | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:245` |
| F-OBS-099 | HIGH | D1 Text < 11px | `/media` | `src/pages/Media.tsx:349` |
| F-OBS-101 | HIGH | D1 Text < 11px | `/media` | `src/pages/Media.tsx:430` |
| F-OBS-107 | HIGH | D1 Text < 11px | `/observatory` | `src/components/OpsStatusBar.tsx:88` |
| F-OBS-108 | HIGH | D1 Text < 11px | `/observatory` | `src/components/OpsStatusBar.tsx:114` |
| F-OBS-110 | HIGH | D1 Text < 11px | `/observatory` | `src/components/OpsStatusBar.tsx:141` |
| F-OBS-141 | HIGH | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:490` |
| F-OBS-147 | HIGH | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:523` |
| F-OBS-154 | HIGH | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:308` |
| F-OBS-157 | HIGH | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:356` |
| F-OBS-158 | HIGH | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:357` |
| F-OBS-159 | HIGH | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:363` |
| F-OBS-162 | HIGH | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/CubeNetExplorer.tsx:813` |
| F-OBS-164 | HIGH | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/CubeNetExplorer.tsx:838` |
| F-OBS-168 | HIGH | D1 Text < 11px | `shared` | `src/components/SiteFooter.tsx:19` |
| F-OBS-001 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:162` |
| F-OBS-002 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:237` |
| F-OBS-003 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:376` |
| F-OBS-004 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:383` |
| F-OBS-005 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:395` |
| F-OBS-007 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:469` |
| F-OBS-008 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:472` |
| F-OBS-009 | MEDIUM | D1 Text < 11px | `/` | `src/pages/Index.tsx:523` |
| F-OBS-014 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1063` |
| F-OBS-016 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1074` |
| F-OBS-017 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1108` |
| F-OBS-018 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1112` |
| F-OBS-019 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1116` |
| F-OBS-020 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1135` |
| F-OBS-021 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1170` |
| F-OBS-023 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1205` |
| F-OBS-024 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1209` |
| F-OBS-025 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1218` |
| F-OBS-026 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1235` |
| F-OBS-027 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1253` |
| F-OBS-028 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1258` |
| F-OBS-030 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1267` |
| F-OBS-032 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1272` |
| F-OBS-035 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1411` |
| F-OBS-036 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1441` |
| F-OBS-037 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1445` |
| F-OBS-038 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1472` |
| F-OBS-039 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1486` |
| F-OBS-043 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1528` |
| F-OBS-044 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1538` |
| F-OBS-045 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1563` |
| F-OBS-046 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1575` |
| F-OBS-052 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1614` |
| F-OBS-053 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1755` |
| F-OBS-054 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1829` |
| F-OBS-055 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1830` |
| F-OBS-057 | MEDIUM | D1 Text < 11px | `/atlas` | `src/pages/Atlas.tsx:1871` |
| F-OBS-062 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:614` |
| F-OBS-063 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:622` |
| F-OBS-064 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:630` |
| F-OBS-066 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:654` |
| F-OBS-075 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:220` |
| F-OBS-076 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:248` |
| F-OBS-077 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:267` |
| F-OBS-078 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:311` |
| F-OBS-079 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:335` |
| F-OBS-080 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/FractalAcademia.tsx:356` |
| F-OBS-084 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:238` |
| F-OBS-086 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:299` |
| F-OBS-087 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:303` |
| F-OBS-088 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:396` |
| F-OBS-089 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:416` |
| F-OBS-090 | MEDIUM | D1 Text < 11px | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:420` |
| F-OBS-094 | MEDIUM | D1 Text < 11px | `/research` | `src/pages/Research.tsx:227` |
| F-OBS-095 | MEDIUM | D1 Text < 11px | `/research` | `src/pages/Research.tsx:230` |
| F-OBS-096 | MEDIUM | D1 Text < 11px | `/research` | `src/pages/Research.tsx:233` |
| F-OBS-097 | MEDIUM | D1 Text < 11px | `/research` | `src/pages/Research.tsx:388` |
| F-OBS-098 | MEDIUM | D1 Text < 11px | `/media` | `src/pages/Media.tsx:292` |
| F-OBS-100 | MEDIUM | D1 Text < 11px | `/media` | `src/pages/Media.tsx:359` |
| F-OBS-102 | MEDIUM | D1 Text < 11px | `/media` | `src/pages/Media.tsx:522` |
| F-OBS-104 | MEDIUM | D1 Text < 11px | `/observatory` | `src/pages/Observatory.tsx:162` |
| F-OBS-105 | MEDIUM | D1 Text < 11px | `/observatory` | `src/pages/Observatory.tsx:298` |
| F-OBS-109 | MEDIUM | D1 Text < 11px | `/observatory` | `src/components/OpsStatusBar.tsx:115` |
| F-OBS-118 | MEDIUM | D1 Text < 11px | `/observatory/force-graph` | `src/pages/observatory/ForceGraph.tsx:109` |
| F-OBS-119 | MEDIUM | D1 Text < 11px | `/observatory/force-graph` | `src/pages/observatory/ForceGraph.tsx:132` |
| F-OBS-120 | MEDIUM | D1 Text < 11px | `/observatory/transport-sphere` | `src/pages/observatory/TransportSphere.tsx:34` |
| F-OBS-121 | MEDIUM | D1 Text < 11px | `/observatory/transport-sphere` | `src/pages/observatory/TransportSphere.tsx:38` |
| F-OBS-122 | MEDIUM | D1 Text < 11px | `/observatory/transport-sphere` | `src/pages/observatory/TransportSphere.tsx:48` |
| F-OBS-123 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:305` |
| F-OBS-124 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:318` |
| F-OBS-126 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:348` |
| F-OBS-127 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:365` |
| F-OBS-128 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:382` |
| F-OBS-129 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:405` |
| F-OBS-130 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:413` |
| F-OBS-131 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:421` |
| F-OBS-132 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:429` |
| F-OBS-133 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:438` |
| F-OBS-134 | MEDIUM | D1 Text < 11px | `/observatory/poisson-dot` | `src/components/PoissonDotAndNegativeIOR.tsx:472` |
| F-OBS-135 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/pages/observatory/Quaternion.tsx:32` |
| F-OBS-136 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:279` |
| F-OBS-137 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:449` |
| F-OBS-138 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:459` |
| F-OBS-139 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:470` |
| F-OBS-140 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:481` |
| F-OBS-142 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:498` |
| F-OBS-143 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:501` |
| F-OBS-144 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:507` |
| F-OBS-145 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:518` |
| F-OBS-146 | MEDIUM | D1 Text < 11px | `/observatory/quaternion` | `src/components/QuaternionExplorer.tsx:519` |
| F-OBS-148 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/pages/observatory/HigherDimensional.tsx:47` |
| F-OBS-149 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:249` |
| F-OBS-150 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:261` |
| F-OBS-151 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:274` |
| F-OBS-152 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:297` |
| F-OBS-153 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:306` |
| F-OBS-155 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:315` |
| F-OBS-156 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/TesseractExplorer.tsx:345` |
| F-OBS-160 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/CubeNetExplorer.tsx:644` |
| F-OBS-161 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/CubeNetExplorer.tsx:744` |
| F-OBS-163 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/CubeNetExplorer.tsx:826` |
| F-OBS-165 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/CubeNetExplorer.tsx:846` |
| F-OBS-166 | MEDIUM | D1 Text < 11px | `/observatory/higher-dimensional` | `src/components/CubeNetExplorer.tsx:874` |
| F-OBS-167 | MEDIUM | D1 Text < 11px | `shared` | `src/components/SiteFooter.tsx:5` |
| F-OBS-113 | MEDIUM | D2 min-w > viewport | `/broch-sphere` | `src/components/brochSphere/BrochSpherePrototype.tsx:226` |
| F-OBS-169 | MEDIUM | D4 Hardcoded hex/rgb color | `shared` | `src/index.css:343` |
| F-OBS-010 | MEDIUM | D5 Missing clamp typography | `/` | `src/pages/Index.tsx:101` |
| F-OBS-011 | MEDIUM | D5 Missing clamp typography | `/` | `src/pages/Index.tsx:313` |
| F-OBS-012 | MEDIUM | D5 Missing clamp typography | `/` | `src/pages/Index.tsx:526` |
| F-OBS-059 | MEDIUM | D5 Missing clamp typography | `/atlas` | `src/pages/Atlas.tsx:1758` |
| F-OBS-091 | MEDIUM | D5 Missing clamp typography | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:131` |
| F-OBS-072 | LOW | D3 Fixed height > 600px | `/atlas` | `src/components/FractalInspirationAtlas.tsx:507` |
| F-OBS-058 | LOW | D5 Missing clamp typography | `/atlas` | `src/pages/Atlas.tsx:1122` |
| F-OBS-114 | LOW | D5 Missing clamp typography | `/broch-sphere` | `src/components/brochSphere/BrochSpherePrototype.tsx:120` |
| F-OBS-092 | LOW | D7 dark-only Tailwind override | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:136` |
| F-OBS-093 | LOW | D7 dark-only Tailwind override | `/atlas` | `src/components/ResonanceSpheresAtlas.tsx:420` |
| F-OBS-106 | LOW | D7 dark-only Tailwind override | `/observatory` | `src/pages/Observatory.tsx:339` |
| F-OBS-060 | LOW | D8 Panel layer bypass | `/atlas` | `src/pages/Atlas.tsx:1841` |
| F-OBS-073 | LOW | D8 Panel layer bypass | `/atlas` | `src/components/FractalInspirationAtlas.tsx:542` |
| F-OBS-074 | LOW | D8 Panel layer bypass | `/atlas` | `src/components/FractalInspirationAtlas.tsx:578` |
| F-OBS-103 | LOW | D8 Panel layer bypass | `/media` | `src/pages/Media.tsx:347` |
| F-OBS-111 | LOW | D8 Panel layer bypass | `/observatory` | `src/components/OpsStatusBar.tsx:113` |
| F-OBS-112 | LOW | D8 Panel layer bypass | `/observatory` | `src/components/OpsStatusBar.tsx:134` |
| F-OBS-115 | LOW | D8 Panel layer bypass | `/broch-sphere` | `src/components/brochSphere/BrochSpherePrototype.tsx:127` |
| F-OBS-116 | LOW | D8 Panel layer bypass | `/broch-sphere` | `src/components/brochSphere/BrochSpherePrototype.tsx:693` |
| F-OBS-117 | LOW | D8 Panel layer bypass | `/broch-sphere` | `src/components/brochSphere/BrochTransferEventCard.tsx:55` |

## What Passes

The following were checked and are clean:

- All 16 CSS token contrast pairs (WCAG AA+) — verified by `scripts/contrast-check.ts`
- Semantic CSS token system: `--layer-*`, `--ink-*`, `--annotation-*` tokens are correctly defined for both themes
- `.annotation-plate`, `.annotation-plate-strong`, `.instrument-strip` surface classes exist in `index.css`
- `.broch-node-label-bg` and `.fractal-canvas` classes added with proper `html.light` overrides
- Observatory heading uses `clamp(1.875rem, 8vw, 4.5rem)` — passes D5
- Broch Sphere SVG wrapper uses `overflow-x-auto` — passes D6

