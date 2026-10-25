import { vi } from "vitest";

vi.mock("@/components/higher-dimensional/HypercrossStage", () => ({
  HypercrossStage: () => <div>hypercross instrument</div>,
}));

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import HypercrossPage from "./Hypercross";

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/observatory/higher-dimensional/hypercross${search}`]}>
      <Routes>
        <Route path="/observatory/higher-dimensional/hypercross" element={<HypercrossPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("hypercross return to the atlas", () => {
  it("offers the walkable world only when the visitor came from it", () => {
    renderAt("?from=interactive-atlas");
    const back = screen.getByRole("link", { name: "Return to Interactive Atlas" });
    expect(back.getAttribute("href")).toContain("/atlas/interactive");
    expect(back.getAttribute("href")).toContain("resume=1");
    expect(screen.getByText("hypercross instrument")).toBeInTheDocument();
  });

  it("does not add that link to a direct visit", () => {
    renderAt("");
    expect(screen.queryByRole("link", { name: "Return to Interactive Atlas" })).not.toBeInTheDocument();
    expect(screen.getByText("hypercross instrument")).toBeInTheDocument();
  });
});
