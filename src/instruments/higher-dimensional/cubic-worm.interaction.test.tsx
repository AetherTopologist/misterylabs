import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { CubicWormStage } from "@/components/higher-dimensional/CubicWormStage";
import { HD_RIDES } from "./rides";

beforeAll(() => {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserver as unknown as typeof globalThis.ResizeObserver;
  const grad = { addColorStop() {} };
  const ctx = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "canvas") return { width: 320, height: 240 };
        if (prop === "createRadialGradient" || prop === "createLinearGradient") return () => grad;
        if (prop === "measureText") return () => ({ width: 0 });
        if (typeof prop === "string") return () => {};
        return undefined;
      },
      set() {
        return true;
      },
    },
  );
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as HTMLCanvasElement["getContext"];
});

function renderStage() {
  return render(
    <MemoryRouter>
      <CubicWormStage />
    </MemoryRouter>,
  );
}

describe("cubic worm instrument", () => {
  it("keeps the rotation across modes and does not claim a physical throat", () => {
    const { container } = renderStage();
    const slider = screen.getByLabelText("XW rotation");
    const canvas = container.querySelector("canvas");
    expect(slider).toHaveValue("0");
    expect(screen.getByRole("button", { name: "Cubic Worm" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(slider, { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Geometry" }));
    expect(slider).toHaveValue("40");
    expect(container.querySelector("canvas")).toBe(canvas);

    fireEvent.click(screen.getByRole("button", { name: "Reveal" }));
    expect(screen.getAllByText(/W−/).length).toBeGreaterThan(0);
    expect(screen.getByText(/not adjacent/i)).toBeInTheDocument();
    expect(screen.getByText(/Artistic bridge: none/i)).toBeInTheDocument();
    expect(slider).toHaveValue("40");

    fireEvent.click(screen.getByRole("tab", { name: "Read" }));
    expect(screen.getByRole("heading", { name: "Observation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Model" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Interpretation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Speculation" })).toBeInTheDocument();
    expect(screen.getByText(/not a general-relativistic wormhole/i)).toBeInTheDocument();
    expect(screen.getByText(/No spacetime metric is computed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore the eight-cell structure/i }).getAttribute("href")).toContain("hypercross");
    expect(slider).toHaveValue("40");

    fireEvent.click(screen.getByRole("tab", { name: "Look" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset camera" }));
    expect(slider).toHaveValue("40");
    fireEvent.click(screen.getByRole("button", { name: "Face-on" }));
    expect(slider).toHaveValue("0");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(container.querySelector('canvas[aria-label="Cubic worm tesseract projection"]')).toBe(canvas);
  });

  it("is linked from the collection and not from the atlas rides", () => {
    const app = readFileSync(path.resolve("src/App.tsx"), "utf8");
    const atlas = readFileSync(path.resolve("src/pages/Atlas.tsx"), "utf8");
    const collection = readFileSync(path.resolve("src/pages/observatory/HigherDimensional.tsx"), "utf8");
    const rides = readFileSync(path.resolve("src/instruments/higher-dimensional/rides.ts"), "utf8");
    expect(app).toContain('path="/observatory/higher-dimensional/cubic-worm"');
    expect(collection).toContain('to="/observatory/higher-dimensional/cubic-worm"');
    expect(atlas).not.toContain("cubic-worm");
    expect(rides).not.toContain("cubic-worm");
    expect(HD_RIDES).toHaveLength(3);
  });
});
