import type { ObserverStance } from "./types";

export const observerStances: ObserverStance[] = [
  {
    id: "verifier",
    name: "The Verifier",
    governingQuestion: "What is the ancestry of this claim, and what does it prove?",
    position: {
      latitude: 70,
      longitude: 60,
      sector: "Physical sector",
    },
    visibleNodeIds: [
      "star-euclid",
      "star-newton",
      "k-faraday",
      "k-maxwell",
      "k-einstein",
      "k-penrose",
      "k-xprimery",
      "b-darwin",
      "b-sagan",
      "b-galileo",
      "star-press",
      "s-interstellar",
    ],
    cannotAsk:
      "What form did this idea have to take before it became real to someone who was not inside the Knowledge Lineage?",
  },
  {
    id: "receiver",
    name: "The Receiver",
    governingQuestion: "Who does this idea reach, and what did it take to get there?",
    position: {
      latitude: -20,
      longitude: 242,
      sector: "Cultural sector",
    },
    visibleNodeIds: [
      "star-homer",
      "b-tolkien",
      "s-wells",
      "s-clarke",
      "s-2001",
      "s-interstellar",
      "b-darwin",
      "b-sagan",
      "b-galileo",
      "s-myl",
      "star-press",
      "k-xprimery",
    ],
    cannotAsk:
      "Which ideas in the Knowledge Lineage have not yet crossed into form — and what would need to happen before they could be felt?",
  },
];

export const observerStancesById = Object.fromEntries(
  observerStances.map((stance) => [stance.id, stance]),
);
