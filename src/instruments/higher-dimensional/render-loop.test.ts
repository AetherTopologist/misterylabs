import { describe, expect, it } from "vitest";
import { renderLoopOwner } from "./render-loop";

describe("hollow genius render loop", () => {
  it("leaves monocular and ground truth on the automatic renderer", () => {
    expect(renderLoopOwner(true, "monocular")).toBe("automatic");
    expect(renderLoopOwner(true, "binocular")).toBe("automatic");
    expect(renderLoopOwner(false, "monocular")).toBe("automatic");
  });

  it("lets only the binocular appearance pane seize the frame", () => {
    expect(renderLoopOwner(false, "binocular")).toBe("anaglyph");
  });
});
