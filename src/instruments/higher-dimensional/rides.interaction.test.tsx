import { vi } from "vitest";

vi.mock("@react-three/fiber", () => ({
  Canvas: () => null,
  useFrame: () => {},
  useThree: () => ({ gl: { getContext: () => ({ colorMask() {} }) } }),
}));

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load(_url: string, _ok?: unknown, _progress?: unknown, err?: (e: unknown) => void) {
      err?.(new Error("asset skipped in jsdom"));
    }
  },
}));
import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { SpinningDancer } from "@/components/SpinningDancer";
import { InsideOutStage } from "@/components/higher-dimensional/InsideOutStage";
import { HollowGenius } from "@/components/higher-dimensional/HollowGenius";
import HigherDimensionalPage from "@/pages/observatory/HigherDimensional";
import { WORM_TUBE_WARNING } from "./worm-tube";
import { HD_INDEX, HD_RIDES } from "./rides";

beforeAll(() => {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserver as unknown as typeof globalThis.ResizeObserver;
  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
      window.setTimeout(() => cb(performance.now()), 16) as unknown as number;
  }
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

describe("higher-dimensional routes", () => {
  it("keeps the collection index and three direct child routes", () => {
    const app = readFileSync(path.resolve("src/App.tsx"), "utf8");
    const atlas = readFileSync(path.resolve("src/pages/Atlas.tsx"), "utf8");
    expect(app).toContain(`path="${HD_INDEX}"`);
    expect(new Set(HD_RIDES.map((ride) => ride.href)).size).toBe(HD_RIDES.length);
    for (const ride of HD_RIDES) {
      expect(ride.href.startsWith(`${HD_INDEX}/`)).toBe(true);
      expect(app).toContain(`path="${ride.href}"`);
      expect(atlas).toContain("HD_RIDES");
    }
    expect(atlas).toContain("collection index");
  });

  it("navigates from the collection index to each ride and back", () => {
    render(
      <MemoryRouter initialEntries={[HD_INDEX]}>
        <Routes>
          <Route path={HD_INDEX} element={<HigherDimensionalPage />} />
          {HD_RIDES.map((ride) => (
            <Route
              key={ride.href}
              path={ride.href}
              element={
                <>
                  <h1>{ride.label} destination</h1>
                  <Link to={HD_INDEX}>Back to collection</Link>
                </>
              }
            />
          ))}
        </Routes>
      </MemoryRouter>,
    );

    for (const ride of HD_RIDES) {
      fireEvent.click(screen.getByRole("link", { name: new RegExp(ride.label) }));
      expect(screen.getByRole("heading", { name: `${ride.label} destination` })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("link", { name: "Back to collection" }));
      expect(screen.getByRole("heading", { name: /Higher-Dimensional Transport/ })).toBeInTheDocument();
    }
  });
});

describe("hollow genius controls", () => {
  it("offers ground truth, appearance, and both reliefs without claiming perception", () => {
    render(<HollowGenius />);
    expect(screen.getByText("Ground truth")).toBeInTheDocument();
    expect(screen.getByText("not a perception model")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concave shell" }));
    fireEvent.click(screen.getByRole("button", { name: "Convex relief" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset camera" }));
    fireEvent.click(screen.getByRole("button", { name: "Looks concave" }));
    expect(screen.getByText(/Recorded: you reported “concave”/)).toBeInTheDocument();
    expect(screen.getByText(/does not infer an answer/)).toBeInTheDocument();
  });
});

describe("ambiguous dancer ride", () => {
  it("reverses physical yaw and stores a perceived report separately", () => {
    localStorage.clear();
    render(<SpinningDancer ride />);
    expect(screen.getByText("physical cw")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Shaded" }));
    fireEvent.click(screen.getByRole("button", { name: "Reverse physical direction" }));
    expect(screen.getByText("physical ccw")).toBeInTheDocument();
    expect(screen.getByText(/Physical yaw just reversed/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Looks counter-clockwise" }));
    const saved = JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.reports") || "[]");
    expect(saved.at(-1)).toMatchObject({ perceived: "counterclockwise", physical: "ccw", shaded: true });
    expect(screen.getByText(/Last report: counterclockwise/)).toBeInTheDocument();
  });

  it("keeps the legacy silhouette when ride mode is off", () => {
    render(<SpinningDancer />);
    expect(screen.queryByRole("button", { name: "Reverse physical direction" })).not.toBeInTheDocument();
    expect(screen.getByText("clockwise")).toBeInTheDocument();
  });
});

describe("inside-out rendering modes", () => {
  it("switches wire, surface, and the labeled worm tube", () => {
    render(<InsideOutStage />);
    expect(screen.getByLabelText("Tesseract projection or artistic worm tube")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Wireframe" }));
    fireEvent.click(screen.getByRole("button", { name: "Surfaces" }));
    expect(screen.queryByText(WORM_TUBE_WARNING)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Worm tube" }));
    expect(screen.getByText(WORM_TUBE_WARNING)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reverse" }));
    expect(screen.getByRole("button", { name: "Reversed" })).toBeInTheDocument();
    expect(screen.getByText(/NESTING IS NOT EVERSION|projected, not turned inside out/i)).toBeInTheDocument();
  });
});
