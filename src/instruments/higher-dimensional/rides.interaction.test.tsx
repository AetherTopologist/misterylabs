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
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SpinningDancer } from "@/components/SpinningDancer";
import { CubeNetExplorer } from "@/components/CubeNetExplorer";
import { InsideOutStage } from "@/components/higher-dimensional/InsideOutStage";
import { HypercrossStage } from "@/components/higher-dimensional/HypercrossStage";
import { HollowGenius } from "@/components/higher-dimensional/HollowGenius";
import HigherDimensionalPage from "@/pages/observatory/HigherDimensional";
import { NET_LABELS } from "@/components/CubeNetExplorer";
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
    expect(document.querySelector('[data-pane="truth"] figcaption')).toHaveTextContent("Ground truth");
    expect(screen.getByText("not a perception model")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Concave shell" }));
    fireEvent.click(screen.getByRole("button", { name: "Convex relief" }));
    fireEvent.click(screen.getByRole("tab", { name: "Camera" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset camera" }));
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    fireEvent.click(screen.getByRole("button", { name: "Looks concave" }));
    expect(screen.getByText(/Recorded: you reported “concave”/)).toBeInTheDocument();
    expect(screen.getByText(/does not infer an answer/)).toBeInTheDocument();
  });

  it("keeps the instrument state when the dock tab changes", () => {
    render(<HollowGenius />);
    fireEvent.click(screen.getByRole("button", { name: "Tesla" }));
    fireEvent.click(screen.getByRole("tab", { name: "Lighting" }));
    expect(screen.getByLabelText("Light azimuth")).toBeInTheDocument();
    expect(screen.getByText("Tesla", { selector: ".hg-status span" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Geometry" }));
    expect(screen.getByRole("button", { name: "Tesla" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Concave shell" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Einstein" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.keyDown(screen.getByRole("tab", { name: "Geometry" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Camera" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Hide controls" }));
    expect(screen.queryByRole("tab", { name: "Camera" })).not.toBeInTheDocument();
    expect(screen.getByText("Tesla", { selector: ".hg-status span" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show controls" }));
    expect(screen.getByRole("tab", { name: "Camera" })).toHaveAttribute("aria-selected", "true");
  });

  it("changes the mobile view without dropping either pane or the canvas key", () => {
    const { container } = render(<HollowGenius />);
    const src = readFileSync(path.resolve("src/components/higher-dimensional/HollowGenius.tsx"), "utf8");
    expect(src).toContain("key={projection}");
    expect(src).toContain("frameloop={");
    expect(src).not.toMatch(/key=\{[^}]*pane/);
    expect(container.querySelector(".hg-cockpit")).toHaveAttribute("data-view", "appearance");
    expect(container.querySelector('[data-pane="truth"]')).toHaveAttribute("data-live", "false");
    expect(container.querySelector('[data-pane="appearance"]')).toHaveAttribute("data-live", "true");
    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(container.querySelector(".hg-cockpit")).toHaveAttribute("data-view", "compare");
    expect(container.querySelector('[data-pane="truth"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="appearance"]')).toHaveAttribute("data-live", "true");
    fireEvent.click(screen.getByRole("button", { name: "Ground truth" }));
    expect(container.querySelector(".hg-cockpit")).toHaveAttribute("data-view", "truth");
    expect(screen.getByRole("button", { name: "Tesla" })).toBeInTheDocument();
  });
});

describe("ambiguous dancer ride", () => {
  it("logs a reversal without moving the yaw or revealing the model", () => {
    localStorage.clear();
    localStorage.setItem("misterylabs.ambiguous-dancer.reports", JSON.stringify([
      { t: 1, perceived: "clockwise", physical: "cw", shaded: false },
    ]));
    const { container, unmount } = render(<SpinningDancer ride />);
    expect(screen.queryByText("physical cw")).not.toBeInTheDocument();
    expect(screen.queryByText(/Model yaw/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    expect(screen.queryByText(/Model yaw/)).not.toBeInTheDocument();
    expect(screen.getByText(/does not subtract a reaction time/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Now looks clockwise" }));
    expect(screen.queryByText(/Model yaw/)).not.toBeInTheDocument();
    expect(screen.getByText(/clockwise · initial/)).toBeInTheDocument();
    expect(screen.getByText("Report clockwise", { selector: ".ad-status span" })).toBeInTheDocument();
    expect(screen.getByText("Paused", { selector: ".ad-status span" })).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.session.v2") || "{}");
    const yaw = stored.events[0].yawUnwrapped;
    expect(stored.schema).toBe(2);
    expect(stored.events[0]).toMatchObject({
      kind: "initial",
      perceived: "clockwise",
      physicalDirection: "cw",
      running: false,
      speed: 1,
      shaded: false,
      markers: false,
      posePhase: null,
      gazeTarget: "Knee",
    });
    expect(stored.events[0].angularVelocityRadS).toBeCloseTo(0.84, 8);
    expect(stored.config.reactionTimeCorrection).toBe("none");

    fireEvent.click(screen.getByRole("button", { name: "Now looks clockwise" }));
    fireEvent.click(screen.getByRole("button", { name: "Unsure" }));
    fireEvent.click(screen.getByRole("tab", { name: "Appearance" }));
    fireEvent.click(screen.getByRole("button", { name: "Shaded" }));
    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));
    fireEvent.change(screen.getByLabelText("Rotation speed"), { target: { value: "6" } });
    fireEvent.click(screen.getByRole("button", { name: "Reverse physical direction" }));
    expect(screen.queryByText("physical ccw")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    fireEvent.click(screen.getByRole("button", { name: "Now looks counterclockwise" }));

    const after = JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.session.v2") || "{}");
    expect(after.events.map((event: { kind: string }) => event.kind)).toEqual(["initial", "repeat", "unsure", "reversal"]);
    expect(after.events.every((event: { yawUnwrapped: number }) => event.yawUnwrapped === yaw)).toBe(true);
    expect(after.events[3]).toMatchObject({
      perceived: "counterclockwise",
      physicalDirection: "ccw",
      speed: 6,
      shaded: true,
      running: false,
    });
    expect(after.events[3].angularVelocityRadS).toBeCloseTo(-5.04, 8);
    expect(screen.getByText("6.00×", { selector: ".ad-status span" })).toBeInTheDocument();
    expect(screen.getByText("Paused", { selector: ".ad-status span" })).toBeInTheDocument();
    expect(screen.queryByText(/Model yaw/)).not.toBeInTheDocument();

    const legacy = JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.reports") || "[]");
    expect(legacy[0]).toEqual({ t: 1, perceived: "clockwise", physical: "cw", shaded: false });
    expect(legacy.at(-1).perceived).toBe("counterclockwise");

    fireEvent.click(screen.getByRole("button", { name: "Reveal model" }));
    expect(screen.getByText(/Model yaw is counter-clockwise/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide model" }));
    expect(screen.queryByText(/Model yaw/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Full log" }));
    expect(screen.getByText(/physical ccw/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Analysis" }));
    expect(screen.getByText(/Directional reversals: 1/)).toBeInTheDocument();
    expect(screen.getByText(/needs two/)).toBeInTheDocument();
    expect(screen.getByText(/Exploratory/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    expect(screen.getByText(/counterclockwise · reversal/)).toBeInTheDocument();
    expect(container.querySelector("canvas")).toBeTruthy();

    unmount();
    render(<SpinningDancer ride />);
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    expect(screen.getByText(/counterclockwise · reversal/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear session" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm clear" }));
    expect(screen.getAllByText("No taps yet.").length).toBeGreaterThan(0);
    const legacyAfterClear = JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.reports") || "[]");
    expect(legacyAfterClear[0]).toEqual({ t: 1, perceived: "clockwise", physical: "cw", shaded: false });
    fireEvent.click(screen.getByRole("button", { name: "Start new session" }));
    expect(JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.reports") || "[]")[0].t).toBe(1);
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download JSON" })).toBeInTheDocument();
  });

  it("keeps the canvas and the phase controls when the dock changes", () => {
    const { container } = render(<SpinningDancer ride />);
    const canvas = container.querySelector("canvas");
    const speed = screen.getByLabelText("Rotation speed");
    fireEvent.change(speed, { target: { value: "6" } });
    expect(speed).toHaveValue("6");
    expect(screen.getByText(/one turn every 1\.25 s/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    expect(container.querySelector("canvas")).toBe(canvas);
    expect(screen.getByText("Paused", { selector: ".ad-status span" })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Observer" }), { key: "ArrowLeft" });
    expect(screen.getByRole("tab", { name: "Appearance" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));
    expect(screen.getByLabelText("Rotation speed")).toHaveValue("6");
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide controls" }));
    expect(screen.queryByRole("tab", { name: "Motion" })).not.toBeInTheDocument();
    expect(container.querySelector("canvas")).toBe(canvas);
    fireEvent.click(screen.getByRole("button", { name: "Show controls" }));
    expect(screen.getByRole("tab", { name: "Motion" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Expand" }));
    expect(container.querySelector(".ad-cockpit")).toHaveClass("is-full");
  });

  it("starts audio only from a gesture and does not move the yaw", () => {
    class Param {
      value = 0;
      setValueAtTime(value: number) { this.value = value; }
      exponentialRampToValueAtTime() {}
    }
    class Node {
      gain = new Param();
      pan = new Param();
      frequency = new Param();
      connect() { return this; }
      start() {}
      stop() {}
    }
    const opened: { closed: boolean; suspended: boolean }[] = [];
    class FakeContext {
      currentTime = 1.25;
      state = "running";
      destination = new Node();
      closed = false;
      suspended = false;
      constructor() { opened.push(this); }
      createGain() { return new Node(); }
      createOscillator() { return new Node(); }
      createStereoPanner() { return new Node(); }
      resume() { return Promise.resolve(); }
      suspend() { this.suspended = true; this.state = "suspended"; return Promise.resolve(); }
      close() { this.closed = true; return Promise.resolve(); }
    }
    const previous = window.AudioContext;
    window.AudioContext = FakeContext as unknown as typeof AudioContext;
    try {
    localStorage.clear();
    const { unmount } = render(<SpinningDancer ride />);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    fireEvent.click(screen.getByRole("button", { name: "Now looks clockwise" }));
    const before = JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.session.v2") || "{}");
    const yaw = before.events[0].yawUnwrapped;
    expect(before.events[0].audioMode).toBe("silent");
    expect(opened).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Audio anchor" }));
    expect(screen.getByText(/not a demonstrated effect/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start audio" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Coupled" }));
    fireEvent.click(screen.getByRole("button", { name: "Headphones yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Start audio" }));
    expect(opened).toHaveLength(1);
    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));
    fireEvent.click(screen.getByRole("tab", { name: "Observer" }));
    expect(screen.getByRole("button", { name: "Coupled" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Stop audio" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Now looks counterclockwise" }));
    const after = JSON.parse(localStorage.getItem("misterylabs.ambiguous-dancer.session.v2") || "{}");
    expect(after.events.map((event: { kind: string }) => event.kind)).toEqual(["initial", "reversal"]);
    expect(after.events.every((event: { yawUnwrapped: number }) => event.yawUnwrapped === yaw)).toBe(true);
    expect(after.events[1].physicalDirection).toBe("cw");
    expect(after.events[1].audioMode).toBe("coupled");
    expect(after.events[1].headphones).toBe("yes");
    expect(after.audioCues).toHaveLength(1);
    expect(after.audioCues[0]).toMatchObject({ audioPan: "left", cause: "report-feedback", physicalDirection: "cw" });
    fireEvent.click(screen.getByRole("button", { name: "Stop audio" }));
    expect(opened[0].suspended).toBe(true);
    unmount();
    expect(opened[0].closed).toBe(true);
    } finally {
      window.AudioContext = previous;
    }
  });

  it("keeps the legacy silhouette when ride mode is off", () => {
    render(<SpinningDancer />);
    expect(screen.queryByRole("button", { name: "Reverse physical direction" })).not.toBeInTheDocument();
    expect(screen.getByText("clockwise")).toBeInTheDocument();
    expect(screen.getByLabelText("Rotation speed")).toHaveAttribute("max", "6");
  });
});

describe("inside-out laboratories", () => {
  beforeEach(() => localStorage.clear());

  function faceLabels() {
    return ["Front", "Back", "Top", "Bottom", "Right", "Left"].map((name) =>
      screen.getByRole("button", { name: new RegExp(`^${name}, step \\d+$`) }).getAttribute("aria-label"),
    );
  }

  it("shares the net, chirality, face, and fold progress across the cube laboratory", () => {
    const { container } = render(<InsideOutStage />);
    expect(container.querySelector(".io-cockpit")).toHaveAttribute("data-lab", "cube");
    expect(container.querySelector('[data-pane="net"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="fold"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="projection"]')).toHaveAttribute("data-live", "false");
    expect(screen.getByRole("button", { name: "Cube" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector("svg")).toHaveAttribute("data-hinges", "5");
    expect(screen.getAllByText(/spanning-tree hinges/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Progress 0 is the flat net/)).toBeInTheDocument();
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([...NET_LABELS]);
    expect(screen.getByText(/Classic Cross closes/)).toBeInTheDocument();
    expect(screen.getByText(/Nesting is not eversion/)).toBeInTheDocument();
    expect(screen.queryByText(WORM_TUBE_WARNING)).not.toBeInTheDocument();

    const fold = container.querySelector('canvas[aria-label="Cube net hinge fold"]');
    const projection = container.querySelector('canvas[aria-label="Tesseract projection or artistic worm tube"]');
    expect(container.querySelectorAll("canvas")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /^Front, step/ }));
    expect(screen.getByTestId("cube-selection")).toHaveTextContent(/Front · step \d+/);
    expect(screen.getByRole("button", { name: /^Front, step/ })).toHaveAttribute("aria-pressed", "true");
    const clockwise = faceLabels();
    fireEvent.click(screen.getByRole("button", { name: "Counterclockwise fold" }));
    expect(screen.getByTestId("cube-selection")).toHaveTextContent(/Front · step \d+/);
    expect(faceLabels()).not.toEqual(clockwise);
    expect(screen.getByText(/Classic Cross closes/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Fold progress"), { target: { value: "0.2" } });
    fireEvent.change(screen.getByLabelText("Cube net"), { target: { value: "3" } });
    expect(screen.getByLabelText("Fold progress")).toHaveValue("0.2");
    expect(screen.getByTestId("cube-selection")).toHaveTextContent(/Front · step \d+/);
    expect(container.querySelector(".io-cockpit")).toHaveAttribute("data-chirality", "ccw");
    for (const index of [7, 8]) {
      fireEvent.change(screen.getByLabelText("Cube net"), { target: { value: String(index) } });
      expect(screen.getByText(new RegExp(`${NET_LABELS[index]} does not close`))).toBeInTheDocument();
      expect(container.querySelector("svg")).toHaveAttribute("data-hinges", "5");
    }
    fireEvent.change(screen.getByLabelText("Cube net"), { target: { value: "0" } });
    expect(screen.getByLabelText("Fold progress")).toHaveValue("0.2");

    fireEvent.click(screen.getByRole("button", { name: "Clear face" }));
    expect(screen.getByTestId("cube-selection")).toHaveTextContent("No face selected");
    fireEvent.click(screen.getByRole("button", { name: "Select Z-Staircase" }));
    expect(screen.getByLabelText("Cube net")).toHaveValue("10");

    fireEvent.click(screen.getByRole("button", { name: "4D" }));
    expect(container.querySelector('[data-pane="projection"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="fold"]')).toHaveAttribute("data-live", "false");
    expect(container.querySelector('[data-pane="net"]')).toHaveAttribute("data-live", "false");
    expect(container.querySelector('canvas[aria-label="Cube net hinge fold"]')).toBe(fold);
    expect(container.querySelector('canvas[aria-label="Tesseract projection or artistic worm tube"]')).toBe(projection);

    fireEvent.click(screen.getByRole("button", { name: "Cube" }));
    expect(screen.getByLabelText("Fold progress")).toHaveValue("0.2");
    expect(screen.getByLabelText("Cube net")).toHaveValue("10");
    expect(container.querySelector(".io-cockpit")).toHaveAttribute("data-chirality", "ccw");
    expect(localStorage.getItem("misterylabs.inside-out.lab")).toBe("cube");
  });

  it("focuses one cube panel without dropping the shared state", () => {
    const { container } = render(<InsideOutStage />);
    fireEvent.click(screen.getByRole("button", { name: /^Front, step/ }));
    fireEvent.change(screen.getByLabelText("Fold progress"), { target: { value: "0.15" } });
    fireEvent.click(screen.getByRole("button", { name: "Net only" }));
    expect(container.querySelector('[data-pane="net"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="fold"]')).toHaveAttribute("data-live", "false");
    expect(screen.getByLabelText("Fold progress")).toHaveValue("0.15");
    expect(screen.getByTestId("cube-selection")).toHaveTextContent(/Front · step \d+/);
    fireEvent.click(screen.getByRole("button", { name: "Fold only" }));
    expect(container.querySelector('[data-pane="fold"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="net"]')).toHaveAttribute("data-live", "false");
    expect(screen.getByLabelText("Fold progress")).toHaveValue("0.15");
    fireEvent.click(screen.getByRole("button", { name: "Both views" }));
    expect(container.querySelector('[data-pane="net"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="fold"]')).toHaveAttribute("data-live", "true");
    expect(screen.getByRole("button", { name: /^Front, step/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the 4D laboratory separate from the cube fold", () => {
    const { container, unmount } = render(<InsideOutStage />);
    const fold = container.querySelector('canvas[aria-label="Cube net hinge fold"]');
    const projection = container.querySelector('canvas[aria-label="Tesseract projection or artistic worm tube"]');
    fireEvent.change(screen.getByLabelText("Fold progress"), { target: { value: "0.2" } });
    fireEvent.click(screen.getByRole("button", { name: "4D" }));
    expect(screen.queryByText(WORM_TUBE_WARNING)).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Projection" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(screen.getByRole("button", { name: "Wireframe" }));
    fireEvent.click(screen.getByRole("button", { name: "Surfaces" }));
    fireEvent.click(screen.getByRole("button", { name: "Worm tube" }));
    expect(screen.getByText(WORM_TUBE_WARNING)).toBeInTheDocument();
    expect(screen.getAllByText(/Artistic tube/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reverse" }));
    expect(screen.getByRole("button", { name: "Reversed" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("XY rotation offset"), { target: { value: "1.2" } });
    fireEvent.click(screen.getByRole("button", { name: "Slow motion" }));
    expect(screen.getByLabelText("Speed multiplier")).toHaveAttribute("max", "3");
    expect(screen.getByLabelText("Speed multiplier")).toHaveAttribute("min", "0.25");
    fireEvent.click(screen.getByRole("tab", { name: "Inspect" }));
    expect(screen.getByText(/not an unfolding of this hypercube/i)).toBeInTheDocument();
    expect(screen.getByText(/offset 1\.20 rad/)).toBeInTheDocument();
    expect(screen.getByText(/Nesting is not eversion/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(container.querySelector('[data-pane="net"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="fold"]')).toHaveAttribute("data-live", "true");
    expect(container.querySelector('[data-pane="projection"]')).toHaveAttribute("data-live", "true");
    expect(screen.getByLabelText("Fold progress")).toHaveValue("0.2");
    fireEvent.click(screen.getByRole("button", { name: "4D controls" }));
    expect(screen.queryByText(WORM_TUBE_WARNING)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Projection" }));
    expect(screen.getByText(WORM_TUBE_WARNING)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Motion" }));
    expect(screen.getByLabelText("XY rotation offset")).toHaveValue("1.2");
    expect(screen.getByRole("button", { name: "Slow motion" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Hide controls" }));
    expect(screen.queryByRole("tab", { name: "Motion" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show controls" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand stage" }));
    expect(container.querySelector(".io-cockpit")).toHaveClass("is-full");
    fireEvent.click(screen.getByRole("button", { name: "Exit stage" }));
    expect(container.querySelector(".io-cockpit")).not.toHaveClass("is-full");
    expect(container.querySelector('canvas[aria-label="Cube net hinge fold"]')).toBe(fold);
    expect(container.querySelector('canvas[aria-label="Tesseract projection or artistic worm tube"]')).toBe(projection);
    expect(localStorage.getItem("misterylabs.inside-out.lab")).toBe("compare");
    unmount();

    const remembered = render(<InsideOutStage />);
    expect(remembered.container.querySelector(".io-cockpit")).toHaveAttribute("data-lab", "compare");
    remembered.unmount();
  });

  it("keeps the standalone net explorer on its own state", () => {
    render(<CubeNetExplorer />);
    expect(screen.getByRole("heading", { name: "2D Net Explorer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "⟳ Clockwise" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /, step \d+$/ })).toHaveLength(6);
    expect(document.querySelector("[data-hinges]")).toBeNull();
  });
});

describe("hypercross instrument", () => {
  it("keeps fold progress while the dock changes and does not claim a physical transit", () => {
    const { container } = render(<HypercrossStage />);
    const slider = screen.getByLabelText("Fold progress");
    const canvas = container.querySelector("canvas");
    expect(slider).toHaveValue("0");
    expect(canvas).toBeTruthy();
    fireEvent.change(slider, { target: { value: "0.5" } });
    expect(slider).toHaveValue("0.5");

    fireEvent.click(screen.getByRole("tab", { name: "Hinges" }));
    expect(screen.getAllByText(/W−/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Hinge sequence").textContent).toMatch(/° open/);
    expect(slider).toHaveValue("0.5");

    fireEvent.click(screen.getByRole("tab", { name: "Reading" }));
    expect(screen.getByRole("heading", { name: "Observation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Model" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Interpretation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Speculation" })).toBeInTheDocument();
    expect(screen.getByText(/not a physical object/i)).toBeInTheDocument();
    expect(screen.getByText(/not a reproduction of a painting/i)).toBeInTheDocument();
    expect(slider).toHaveValue("0.5");

    fireEvent.click(screen.getByRole("tab", { name: "Projection" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset camera" }));
    fireEvent.click(screen.getByRole("button", { name: "Parallel 4D" }));
    expect(screen.getByRole("button", { name: "Parallel 4D" })).toHaveAttribute("aria-pressed", "true");
    expect(slider).toHaveValue("0.5");
    expect(container.querySelector("canvas")).toBe(canvas);

    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(container.querySelector('canvas[aria-label="Hypercross tesseract net"]')).toBe(canvas);
    expect(Math.abs(parseFloat((slider as HTMLInputElement).value) - 0.5)).toBeLessThan(0.05);
  });

  it("is a collection instrument and not an atlas ride", () => {
    const app = readFileSync(path.resolve("src/App.tsx"), "utf8");
    const atlas = readFileSync(path.resolve("src/pages/Atlas.tsx"), "utf8");
    const collection = readFileSync(path.resolve("src/pages/observatory/HigherDimensional.tsx"), "utf8");
    const rides = readFileSync(path.resolve("src/instruments/higher-dimensional/rides.ts"), "utf8");
    expect(app).toContain('path="/observatory/higher-dimensional/hypercross"');
    expect(collection).toContain('to="/observatory/higher-dimensional/hypercross"');
    expect(atlas).not.toContain("hypercross");
    expect(rides).not.toContain("hypercross");
    expect(HD_RIDES).toHaveLength(3);
  });
});

