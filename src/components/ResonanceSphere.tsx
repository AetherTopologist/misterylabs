import { useEffect, useRef } from "react";

/**
 * ResonanceSphere
 * Canvas-based central sphere for "Resonance Spheres" visualization.
 * Supports dynamic image texture (inspiration media) mapped with subtle GRIN/wormhole refraction distortion.
 * Can be used as backdrop/anchor for the FractalInspirationAtlas nodes (orbit metaphor).
 * 
 * Usage:
 * <ResonanceSphere textureUrl={someMediaUrl} className="..." onNodeFocus={id => ...} />
 * 
 * For full integration: composite with the force graph or place behind the canvas in Atlas/Observatory sections.
 */
interface ResonanceSphereProps {
  textureUrl?: string;
  className?: string;
  size?: number; // canvas pixel size (square recommended)
  distortion?: number; // 0-1 strength of GRIN-like radial warp
  showRays?: boolean;
  highlightedNodeId?: string | null; // drives pulse / "face the portal" animation
  isDark?: boolean; // for theme-aware colors (falls back to document class)
}

export function ResonanceSphere({
  textureUrl,
  className = "",
  size = 420,
  distortion = 0.35,
  showRays = true,
  highlightedNodeId,
  isDark: isDarkProp,
}: ResonanceSphereProps) {
  const isDark = isDarkProp ?? (typeof document !== 'undefined' ? !document.documentElement.classList.contains('light') : true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    const cx = size / 2;
    const cy = size / 2;
    const r = size * 0.38;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // Theme-aware colors via CSS vars (fall back to sensible values)
      const root = typeof document !== 'undefined' ? document.documentElement : null;
      const getVar = (name: string, fallback: string) => {
        if (!root) return fallback;
        const v = getComputedStyle(root).getPropertyValue(name).trim();
        return v || fallback;
      };

      const baseColor = isDark ? '#0a0c16' : getVar('--sphere-base', '#fafafa');
      const gridOpacity = isDark ? '0.02' : '0.06';
      const lineColor = getVar('--sphere-line', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)');
      const cyanGlow = getVar('--sphere-glow-cyan', isDark ? 'rgba(103, 232, 249, 0.35)' : 'rgba(6, 182, 212, 0.45)');
      const amberGlow = getVar('--sphere-glow-amber', isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.35)');

      // Subtle background grid / starfield
      ctx.fillStyle = `rgba(255,255,255,${gridOpacity})`;
      for (let x = 0; x < size; x += 22) {
        for (let y = 0; y < size; y += 22) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // Sphere base (theme aware vignette)
      const baseGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * 1.15);
      baseGrad.addColorStop(0, baseColor);
      baseGrad.addColorStop(0.6, isDark ? '#02040a' : '#f8f8f8');
      baseGrad.addColorStop(1, isDark ? '#000000' : '#ffffff');
      ctx.fillStyle = baseGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Texture mapping with distortion (simple polar warp for GRIN feel)
      if (imgRef.current && imgRef.current.complete) {
        const img = imgRef.current;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // Draw image with radial distortion (approximates refraction / wormhole edge)
        const iw = img.width;
        const ih = img.height;
        const srcScale = Math.min(iw / (r * 2), ih / (r * 2)) * 1.15;

        for (let sy = -r; sy < r; sy += 1.5) {
          const normY = sy / r;
          const warp = 1 + distortion * normY * normY * (Math.abs(normY) > 0.6 ? 1.6 : 1);
          const dx = Math.sqrt(Math.max(0, r * r - sy * sy)) * warp;
          const sxScale = (r * 2) / iw * srcScale * warp;

          ctx.drawImage(
            img,
            (iw / 2) - (dx / sxScale) * (iw / (r * 2)),
            (ih / 2) + (sy / r) * (ih / 2) - (ih * 0.1),
            (dx * 2 / sxScale),
            3,
            cx - dx,
            cy + sy - 1.5,
            dx * 2,
            3
          );
        }
        ctx.restore();
      }

      // Edge rim / wormhole glow (cyan-amber) - theme aware
      const rim = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.08);
      rim.addColorStop(0, isDark ? "rgba(103, 232, 249, 0.0)" : "rgba(6, 182, 212, 0.0)");
      rim.addColorStop(0.85, cyanGlow);
      rim.addColorStop(1, amberGlow);
      ctx.strokeStyle = rim;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // Subtle latitude lines (geodesic feel)
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.8;
      for (let i = -2; i <= 2; i++) {
        const latR = r * Math.cos((i / 3) * 1.2);
        ctx.beginPath();
        ctx.ellipse(cx, cy, latR, latR * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // GRIN ray accents (echo of TransportSphereViz)
      if (showRays) {
        ctx.strokeStyle = isDark ? "rgba(103, 232, 249, 0.25)" : "rgba(6, 182, 212, 0.35)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 7; i++) {
          const ang = (i / 7) * Math.PI * 2 + 0.6;
          const x1 = cx + Math.cos(ang) * r * 0.2;
          const y1 = cy + Math.sin(ang) * r * 0.2;
          const x2 = cx + Math.cos(ang) * r * 1.05;
          const y2 = cy + Math.sin(ang) * r * 1.05;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cx + Math.cos(ang + 0.4) * r * 0.6, cy + Math.sin(ang + 0.3) * r * 0.7, x2, y2);
          ctx.stroke();
        }
      }

      // Focal glow (boosted on highlight for "facing the portal")
      const isHighlighted = !!highlightedNodeId;
      const focalStrength = isHighlighted ? 0.32 : 0.18;
      const focal = ctx.createRadialGradient(cx + r * 0.12, cy - r * 0.08, 8, cx + r * 0.12, cy - r * 0.08, r * 0.55);
      focal.addColorStop(0, `rgba(103, 232, 249, ${focalStrength})`);
      focal.addColorStop(1, "rgba(103,232,249,0)");
      ctx.fillStyle = focal;
      ctx.beginPath();
      ctx.arc(cx + r * 0.12, cy - r * 0.08, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (isHighlighted) {
        // extra "light leak" / ray pulse when a node is selected
        ctx.strokeStyle = amberGlow;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.96, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loadAndDraw = () => {
      draw();
    };

    if (textureUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imgRef.current = img;
        draw();
      };
      img.src = textureUrl;
    } else {
      // Default procedural texture (subtle GRIN field pattern)
      draw();
    }

    // Gentle animation for refraction pulse (stronger on highlight)
    let raf: number;
    const animate = () => {
      draw();
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(raf);
  }, [textureUrl, size, distortion, showRays, highlightedNodeId]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      style={{ width: size, height: size, maxWidth: "100%" }}
      aria-label="Resonance sphere — curved transport visualization textured with inspiration media"
    />
  );
}
