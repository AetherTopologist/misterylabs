import { vi } from "vitest";

const { remember, api } = vi.hoisted(() => {
  const remember = vi.fn();
  const api = {
    returnHome: vi.fn(),
    crossBoundary: vi.fn(),
    returnOutside: vi.fn(),
    setCenotaphVariant: vi.fn(),
    setMode: vi.fn(),
    setMove: vi.fn(),
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

  it("draws the new hall on the walking map with the older halls", () => {
    const { container } = render(
      <FairMap walker={{ x: 0, z: 160, heading: 0 }} open onToggle={() => {}} />,
    );
    expect(container).toHaveTextContent("Hollow Genius");
    expect(container).toHaveTextContent("Ambiguous Dancer");
    expect(container).toHaveTextContent("Hydrogen");
    expect(container).toHaveTextContent("Photon Journey");
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(6);
  });
});
