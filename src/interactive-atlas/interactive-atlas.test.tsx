import { vi } from "vitest";

const { remember, api } = vi.hoisted(() => {
  const remember = vi.fn();
  const api = {
    returnHome: vi.fn(),
    crossBoundary: vi.fn(),
    returnOutside: vi.fn(),
    setCenotaphVariant: vi.fn(),
    setGlb: vi.fn(() => Promise.resolve()),
    setMode: vi.fn(),
    setCamera: vi.fn(),
    setMove: vi.fn(),
    setLightTier: vi.fn(),
    remember,
  };
  return { remember, api };
});

let pushUi: ((ui: import("./destinations").AtlasUi) => void) | null = null;

vi.mock("./scene", () => ({
  mountObservatory: (_canvas: HTMLCanvasElement, onChange: (ui: import("./destinations").AtlasUi) => void) => {
    pushUi = onChange;
    return { api, dispose: () => {} };
  },
}));

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { EXHIBITS } from "./destinations";
import InteractiveAtlas from "./InteractiveAtlas";
import { FairMap } from "./walk-ui";
import { PLACES } from "./world";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = function (type: string) {
    if (String(type).includes("webgl")) {
      return { getExtension: () => ({ loseContext() {} }) } as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as typeof HTMLCanvasElement.prototype.getContext;
});

function atHall(proximity: number) {
  return {
    scale: 0.42,
    selected: "hollow-genius" as const,
    proximity,
    atHome: false,
    inside: false,
    mode: "walk" as const,
    walker: { x: PLACES["hollow-genius"].x, z: PLACES["hollow-genius"].z + 8, heading: Math.PI },
  };
}

async function mount() {
  render(
    <MemoryRouter>
      <InteractiveAtlas />
    </MemoryRouter>,
  );
  await waitFor(() => expect(pushUi).toBeTypeOf("function"));
}

describe("hollow genius exhibit plate", () => {
  beforeEach(() => {
    remember.mockClear();
    pushUi = null;
  });

  it("names the hall up close and links into the ride without leaving on its own", async () => {
    await mount();
    await act(async () => {
      pushUi!(atHall(0.8));
    });
    expect(screen.getByText("Hollow Genius")).toBeInTheDocument();
    expect(screen.getByText(EXHIBITS["hollow-genius"].question!)).toBeInTheDocument();
    const enter = screen.getByRole("link", { name: "Enter exhibit" });
    expect(enter.getAttribute("href")).toContain("/observatory/higher-dimensional/hollow-genius");
    expect(enter.getAttribute("href")).toContain("from=interactive-atlas");
    fireEvent.click(enter);
    expect(remember).toHaveBeenCalledTimes(1);
  });

  it("offers Follow, Eyes, Vista, and Overhead while walking, and not while flying", async () => {
    await mount();
    expect(screen.queryByRole("group", { name: "Walk camera" })).not.toBeInTheDocument();
    await act(async () => {
      pushUi!(atHall(0.2));
    });
    const eyes = screen.getByRole("button", { name: "Eyes" });
    const vista = screen.getByRole("button", { name: "Vista" });
    const overhead = screen.getByRole("button", { name: "Overhead" });
    expect(screen.getByRole("button", { name: "Follow" })).toBeInTheDocument();
    fireEvent.click(eyes);
    fireEvent.click(vista);
    fireEvent.click(overhead);
    expect(api.setCamera).toHaveBeenCalledWith("eyes");
    expect(api.setCamera).toHaveBeenCalledWith("vista");
    expect(api.setCamera).toHaveBeenCalledWith("overhead");
    expect(api.setMode).not.toHaveBeenCalled();
  });

  it("shows only the name at the edge of reach, and does not remember other halls", async () => {
    await mount();
    await act(async () => {
      pushUi!(atHall(0.4));
    });
    expect(screen.getByText("Hollow Genius")).toBeInTheDocument();
    expect(screen.queryByText(EXHIBITS["hollow-genius"].question!)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Enter exhibit" })).not.toBeInTheDocument();

    await act(async () => {
      pushUi!({
        scale: 0.4,
        selected: "hydrogen",
        proximity: 0.9,
        atHome: false,
        inside: false,
        mode: "fly",
        walker: null,
      });
    });
    const enter = screen.getByRole("link", { name: "Enter exhibit" });
    expect(enter.getAttribute("href")).toContain("/observatory/hydrogen");
    fireEvent.click(enter);
    expect(remember).not.toHaveBeenCalled();
  });

  it("names the pavilion, asks the question, and remembers only that visit", async () => {
    await mount();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "ambiguous-dancer",
        proximity: 0.8,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES["ambiguous-dancer"].x,
          z: PLACES["ambiguous-dancer"].z + 8,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Ambiguous Dancer")).toBeInTheDocument();
    expect(screen.getByText("Pavilion of Turning Shadows")).toBeInTheDocument();
    expect(screen.getByText(EXHIBITS["ambiguous-dancer"].question!)).toBeInTheDocument();
    const enter = screen.getByRole("link", { name: "Enter exhibit" });
    expect(enter.getAttribute("href")).toContain("/observatory/higher-dimensional/ambiguous-dancer");
    expect(enter.getAttribute("href")).toContain("from=interactive-atlas");
    fireEvent.click(enter);
    expect(remember).toHaveBeenCalledTimes(1);

    remember.mockClear();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "ambiguous-dancer",
        proximity: 0.4,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES["ambiguous-dancer"].x,
          z: PLACES["ambiguous-dancer"].z + 12,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Ambiguous Dancer")).toBeInTheDocument();
    expect(screen.queryByText("Pavilion of Turning Shadows")).not.toBeInTheDocument();
    expect(screen.queryByText(EXHIBITS["ambiguous-dancer"].question!)).not.toBeInTheDocument();
  });

  it("names the house of unfolding and remembers that visit", async () => {
    await mount();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "inside-out",
        proximity: 0.8,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES["inside-out"].x,
          z: PLACES["inside-out"].z + 8,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Inside-Out Universe")).toBeInTheDocument();
    expect(screen.getByText("House of Unfolding")).toBeInTheDocument();
    expect(screen.getByText(EXHIBITS["inside-out"].question!)).toBeInTheDocument();
    const enter = screen.getByRole("link", { name: "Enter exhibit" });
    expect(enter.getAttribute("href")).toContain("/observatory/higher-dimensional/inside-out");
    expect(enter.getAttribute("href")).toContain("from=interactive-atlas");
    fireEvent.click(enter);
    expect(remember).toHaveBeenCalledTimes(1);

    remember.mockClear();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "inside-out",
        proximity: 0.4,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES["inside-out"].x,
          z: PLACES["inside-out"].z + 14,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Inside-Out Universe")).toBeInTheDocument();
    expect(screen.queryByText("House of Unfolding")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Enter exhibit" })).not.toBeInTheDocument();
  });

  it("names the square throat and remembers that visit", async () => {
    await mount();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "cubic-worm",
        proximity: 0.8,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES["cubic-worm"].x,
          z: PLACES["cubic-worm"].z + 8,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Cubic Worm")).toBeInTheDocument();
    expect(screen.getByText("The Square Throat")).toBeInTheDocument();
    expect(screen.getByText(EXHIBITS["cubic-worm"].question!)).toBeInTheDocument();
    const enter = screen.getByRole("link", { name: "Enter exhibit" });
    expect(enter.getAttribute("href")).toContain("/observatory/higher-dimensional/cubic-worm");
    expect(enter.getAttribute("href")).toContain("from=interactive-atlas");
    fireEvent.click(enter);
    expect(remember).toHaveBeenCalledTimes(1);

    remember.mockClear();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "cubic-worm",
        proximity: 0.4,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES["cubic-worm"].x,
          z: PLACES["cubic-worm"].z + 14,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Cubic Worm")).toBeInTheDocument();
    expect(screen.queryByText("The Square Throat")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Enter exhibit" })).not.toBeInTheDocument();
  });

  it("names the eightfold cross and remembers that visit", async () => {
    await mount();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "hypercross",
        proximity: 0.8,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES.hypercross.x,
          z: PLACES.hypercross.z + 8,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Hypercross")).toBeInTheDocument();
    expect(screen.getByText("The Eightfold Cross")).toBeInTheDocument();
    expect(screen.getByText(EXHIBITS.hypercross.question!)).toBeInTheDocument();
    const enter = screen.getByRole("link", { name: "Enter exhibit" });
    expect(enter.getAttribute("href")).toContain("/observatory/higher-dimensional/hypercross");
    expect(enter.getAttribute("href")).toContain("from=interactive-atlas");
    fireEvent.click(enter);
    expect(remember).toHaveBeenCalledTimes(1);

    remember.mockClear();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "hypercross",
        proximity: 0.4,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: {
          x: PLACES.hypercross.x,
          z: PLACES.hypercross.z + 14,
          heading: Math.PI,
        },
      });
    });
    expect(screen.getByText("Hypercross")).toBeInTheDocument();
    expect(screen.queryByText("The Eightfold Cross")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Enter exhibit" })).not.toBeInTheDocument();
  });

  it("draws the new hall on the walking map with the older halls", () => {
    const { container } = render(
      <FairMap walker={{ x: 0, z: 160, heading: 0 }} open onToggle={() => {}} />,
    );
    expect(container).toHaveTextContent("Hollow Genius");
    expect(container).toHaveTextContent("Ambiguous Dancer");
    expect(container).toHaveTextContent("Inside-Out Universe");
    expect(container).toHaveTextContent("Cubic Worm");
    expect(container).toHaveTextContent("Hypercross");
    expect(container).toHaveTextContent("Hydrogen");
    expect(container).toHaveTextContent("Photon Journey");
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(6);
  });
});

describe("cenotaph door plate", () => {
  beforeEach(() => {
    pushUi = null;
  });

  it("names the threshold without opening a chamber", async () => {
    await mount();
    await act(async () => {
      pushUi!({
        scale: 0.5,
        selected: null,
        proximity: 0,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: { x: 0, z: 86, heading: Math.PI },
      });
    });
    expect(screen.getByText("Enter the Cenotaph")).toBeInTheDocument();
    expect(screen.getByText("The chamber is beyond this door.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cross the boundary" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Enter exhibit" })).not.toBeInTheDocument();
  });
});

describe("cenotaph geometry selector", () => {
  beforeEach(() => {
    api.setGlb.mockClear();
    api.setMode.mockClear();
    pushUi = null;
  });

  it("stays on the public atlas in fly and walk, and defaults to production", async () => {
    await mount();
    const summary = screen.getByText("DEV · GLB");
    const panel = summary.closest("details") as HTMLDetailsElement;
    expect(panel.open).toBe(false);
    expect(panel).toHaveTextContent("Production (Original)");
    panel.open = true;
    const production = screen.getByRole("button", { name: "Production (Original)" });
    const floor = screen.getByRole("button", { name: "Production + Floor" });
    expect(production).toHaveAttribute("aria-pressed", "true");
    expect(floor).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(/Observation floor at 12\.937 m/)).toBeInTheDocument();
    let release: (() => void) | null = null;
    api.setGlb.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );
    fireEvent.click(floor);
    expect(api.setGlb).toHaveBeenCalledWith("floor");
    expect(api.setMode).not.toHaveBeenCalled();
    expect(floor).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/disc is in the file at 13\.103 m/)).toBeInTheDocument();
    await act(async () => {
      release?.();
    });

    await act(async () => {
      pushUi!(atHall(0.2));
    });
    expect(screen.getByText("DEV · GLB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Walk" })).toHaveAttribute("data-on", "true");
  });

  it("keeps a collapsed diagnostics panel that does not claim a shader log", async () => {
    await mount();
    const summary = screen.getByText("DEV · DIAGNOSTICS");
    const panel = summary.closest("details") as HTMLDetailsElement;
    expect(panel.open).toBe(false);
    panel.open = true;
    expect(screen.getByText(/Shader log: unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Production GLB:/)).toBeInTheDocument();
    expect(screen.getByText(/Production \+ Floor GLB:/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Diagnostics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Budget" })).toBeInTheDocument();
  });
});
