import type { BrochConstellation } from "./types";

export const brochConstellations: BrochConstellation[] = [
  {
    id: "geometry-arc",
    name: "The Geometry Arc",
    stanceId: "verifier",
    nodeIds: ["star-euclid", "k-einstein", "k-penrose"],
    reading:
      "A 2,300-year chain where geometry became the language of physics.",
  },
  {
    id: "instrument-chain",
    name: "The Instrument Chain",
    stanceId: "verifier",
    nodeIds: ["b-galileo", "b-sagan", "k-xprimery"],
    reading:
      "The line of observation instruments. Each extends what the eye can reach.",
  },
  {
    id: "story-arc",
    name: "The Story Arc",
    stanceId: "receiver",
    nodeIds: ["star-homer", "s-wells", "s-2001", "s-interstellar", "s-myl"],
    reading:
      "Narrators who gave the cosmos a shape people could hold. Not popularizers: original form-makers.",
  },
  {
    id: "darwin-cross",
    name: "The Darwin Cross",
    stanceId: "receiver",
    nodeIds: ["b-darwin", "s-wells"],
    transferEventIds: ["te-02"],
    reading:
      "The gap between Darwin and Wells is where TE-02 lives: evolutionary theory becoming evolutionary imagination.",
  },
];
