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
import { getDiagnostics, patchDiagnostics, resetDiagnostics } from "./cenotaph-diagnostics";

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
    expect(container).toHaveTextContent("PRIME");
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(6);
  });

  it("names the last distance and remembers the walk before entering", async () => {
    await mount();
    await act(async () => {
      pushUi!({
        scale: 0.42,
        selected: "prime",
        proximity: 0.8,
        atHome: false,
        inside: false,
        mode: "walk",
        walker: { x: PLACES.prime.x, z: PLACES.prime.z + 8, heading: 0 },
      });
    });
    expect(screen.getByText("PRIME")).toBeInTheDocument();
    expect(screen.getByText("The Last Distance")).toBeInTheDocument();
    expect(screen.getByText(EXHIBITS.prime.question!)).toBeInTheDocument();
    const enter = screen.getByRole("link", { name: "Enter the Last Distance" });
    expect(enter.getAttribute("href")).toContain("/observatory/prime");
    expect(enter.getAttribute("href")).toContain("from=interactive-atlas");
    fireEvent.click(enter);
    expect(remember).toHaveBeenCalledTimes(1);
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

describe("cenotaph visitor hud", () => {
  beforeEach(() => {
    api.setGlb.mockClear();
    api.setMode.mockClear();
    api.setLightTier.mockClear();
    remember.mockClear();
    pushUi = null;
    resetDiagnostics();
  });

  it("does not offer a geometry selector and keeps lighting collapsed", async () => {
    await mount();
    expect(screen.queryByText("DEV · GLB")).not.toBeInTheDocument();
    expect(screen.queryByText("DEV · DIAGNOSTICS")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Production (Original)" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Shader log/)).not.toBeInTheDocument();
    const light = screen.getByRole("button", { name: "Lighting: Budget" });
    expect(light).toHaveAttribute("aria-expanded", "false");
    expect(light).toHaveTextContent("B");
    expect(light.className).toContain("ia-light-mark");
    expect(api.setGlb).not.toHaveBeenCalled();
  });

  it("opens the tier menu and diagnostics, then collapses on close or outside tap", async () => {
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Lighting: Budget" }));
    expect(screen.getByRole("button", { name: "Lighting: Budget" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Shader log: unavailable/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mobile Max" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Full lamps" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Neutral" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy Diagnostics" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Budget" }));
    expect(api.setLightTier).toHaveBeenCalledWith("budget");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText(/Shader log/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lighting: Budget" }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByText(/Shader log/)).not.toBeInTheDocument();
  });

  it("refreshes tier, light count, and shader log without another click", async () => {
    resetDiagnostics();
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Lighting: Budget" }));
    await act(async () => {
      patchDiagnostics({ tier: "budget", activeRealLights: 26, activeArchSlots: 8, shaderLog: "unavailable", tierNote: null });
    });
    expect(screen.getByText("Real lights: 26 · tier Budget · 8 slots")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Budget" })).toHaveAttribute("aria-pressed", "true");
    await act(async () => {
      patchDiagnostics({ tier: "emissive", activeRealLights: 29, activeArchSlots: 0 });
    });
    expect(screen.getByText("Real lights: 29 · tier Emissive")).toBeInTheDocument();
    expect(screen.queryByText("Real lights: 26 · tier Budget · 8 slots")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emissive" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Budget" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Lighting: Emissive" })).toHaveTextContent("E");
    await act(async () => {
      patchDiagnostics({
        tierNote: "Full lamps needs about 281 fragment vectors and this device has 256. Staying on the current tier so the monument stays visible.",
      });
    });
    expect(screen.getByText(/Full lamps needs about 281 fragment vectors/)).toBeInTheDocument();
    expect(screen.getByText("Shader log: unavailable")).toBeInTheDocument();
    await act(async () => {
      patchDiagnostics({ shaderLog: "link failed" });
    });
    expect(screen.getByText("Shader log: link failed")).toBeInTheDocument();
    expect(getDiagnostics().tier).toBe("emissive");
    resetDiagnostics();
  });

  it("keeps the exhibit entrance tappable beside the lighting control while walking", async () => {
    await mount();
    await act(async () => {
      pushUi!(atHall(0.8));
    });
    const enter = screen.getByRole("link", { name: "Enter exhibit" });
    const light = screen.getByRole("button", { name: "Lighting: Budget" });
    const stick = screen.getByRole("application", { name: /Walk/ });
    expect(light.closest(".ia-light")?.contains(enter)).toBe(false);
    expect(enter.closest(".ia-plate")?.className).toContain("ia-plate");
    expect(stick).toBeInTheDocument();
    fireEvent.click(light);
    expect(screen.getByRole("region", { name: "Lighting: Budget" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("region", { name: "Lighting: Budget" })).not.toBeInTheDocument();
    fireEvent.click(enter);
    expect(remember).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Walk" })).toHaveAttribute("data-on", "true");
  });
});
