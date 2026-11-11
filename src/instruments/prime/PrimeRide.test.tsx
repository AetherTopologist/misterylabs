import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrimeRide } from "./PrimeRide";

function mount(fromWorld = false) {
  return render(
    <MemoryRouter>
      <PrimeRide fromWorld={fromWorld} />
    </MemoryRouter>,
  );
}

describe("PRIME ride", () => {
  it("opens on the 1.50 cm approach and descends in one control", () => {
    mount();
    expect(screen.getByTestId("prime-gap")).toHaveTextContent("1.50 cm");
    fireEvent.change(screen.getByRole("slider", { name: "Descend the gap" }), { target: { value: "1000" } });
    expect(screen.getByTestId("prime-gap").textContent).not.toBe("1.50 cm");
    expect(screen.getByRole("heading", { name: "The repulsion wall" })).toBeInTheDocument();
  });

  it("names the last distance and keeps corpuscles quiet until the skin is loaded", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "The Last Distance" }));
    expect(screen.getByTestId("prime-gap")).toHaveTextContent("238 μm");
    expect(screen.getByTestId("prime-rate")).toHaveTextContent("0.0 spikes/s");
    fireEvent.click(screen.getByRole("button", { name: "The repulsion wall" }));
    expect(screen.getByTestId("prime-rate").textContent).not.toBe("0.0 spikes/s");
  });

  it("lets vibration pick a different ending without leaving the ride", () => {
    mount();
    fireEvent.change(screen.getByRole("slider", { name: "Descend the gap" }), { target: { value: "1000" } });
    fireEvent.click(screen.getByRole("button", { name: /Pacinian/ }));
    fireEvent.change(screen.getByLabelText("Vibration"), { target: { value: "250" } });
    expect(screen.getByText(/loudest teaching curve is pacinian/i)).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Descend the gap" })).toBeInTheDocument();
  });

  it("shows a finite remainder in the Zeno sandbox", () => {
    mount();
    fireEvent.click(screen.getByRole("tab", { name: "Zeno" }));
    const before = screen.getByTestId("zeno-remainder").textContent;
    fireEvent.change(screen.getByLabelText("Halvings"), { target: { value: "20" } });
    expect(screen.getByTestId("zeno-remainder").textContent).not.toBe(before);
    expect(screen.getByTestId("zeno-finite")).toHaveTextContent("1.50 cm");
  });

  it("returns to the walk only when the visitor came from it", () => {
    mount(true);
    const back = screen.getByRole("link", { name: "Return to Interactive Atlas" });
    expect(back.getAttribute("href")).toContain("/atlas/interactive");
    expect(back.getAttribute("href")).toContain("resume=1");
  });

  it("does not offer that return on a direct visit", () => {
    mount(false);
    expect(screen.queryByRole("link", { name: "Return to Interactive Atlas" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Atlas" })).toBeInTheDocument();
  });
});
