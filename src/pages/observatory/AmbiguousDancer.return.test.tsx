import { vi } from "vitest";

vi.mock("@/components/SpinningDancer", () => ({
  SpinningDancer: () => <div>dancer instrument</div>,
}));

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import AmbiguousDancerPage from "./AmbiguousDancer";

function renderAt(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/observatory/higher-dimensional/ambiguous-dancer${search}`]}>
      <Routes>
        <Route path="/observatory/higher-dimensional/ambiguous-dancer" element={<AmbiguousDancerPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ambiguous dancer return to the atlas", () => {
  it("offers the walkable world only when the visitor came from it", () => {
    renderAt("?from=interactive-atlas");
    const back = screen.getByRole("link", { name: "Return to Interactive Atlas" });
    expect(back.getAttribute("href")).toContain("/atlas/interactive");
    expect(back.getAttribute("href")).toContain("resume=1");
    expect(screen.getByText("dancer instrument")).toBeInTheDocument();
  });

  it("does not add that link to a direct visit", () => {
    renderAt("");
    expect(screen.queryByRole("link", { name: "Return to Interactive Atlas" })).not.toBeInTheDocument();
    expect(screen.getByText("dancer instrument")).toBeInTheDocument();
  });
});
