import type { BrochEdge, BrochJourney } from "./types";

export const brochJourneys: BrochJourney[] = [
  {
    id: "return-path",
    name: "The Return Path",
    subtitle: "Default arrival. K-strand crosses into Story and does not complete.",
    primary: true,
    steps: [
      {
        type: "node",
        id: "k-einstein",
        caption:
          "You are in the Knowledge Lineage. Geometry has become physics, but it still needs a visual language.",
      },
      {
        type: "transfer",
        id: "te-03",
        caption:
          "TE-03 appears as a threshold. The K-strand needs a form for what spacetime feels like from the inside.",
      },
      {
        type: "node",
        id: "s-2001",
        caption:
          "2001 does not explain geometry. It lets geometry be felt.",
      },
      {
        type: "node",
        id: "s-interstellar",
        caption:
          "Interstellar gives Thorne a cinematographic problem accurate enough to become a physics problem.",
      },
      {
        type: "transfer",
        id: "te-03",
        caption:
          "The return path appears. A story problem forced a K-strand discovery.",
      },
      {
        type: "horizon",
        id: "k-xprimery",
        caption:
          "xPRIMEray is visible on the horizon. It is the unresolved destination, not a completed arrival.",
      },
    ],
  },
  {
    id: "observers-path",
    name: "The Observer's Path",
    subtitle: "Instrument, public meaning, instrument again. No helix crossing.",
    steps: [
      {
        type: "node",
        id: "b-galileo",
        caption: "He built an instrument to extend the eye.",
      },
      {
        type: "node",
        id: "b-sagan",
        caption: "He carried what the instrument revealed into a language many could hold.",
      },
      {
        type: "node",
        id: "k-xprimery",
        caption: "It returns the question to the instrument: build it again, see further.",
      },
      {
        type: "node",
        id: "s-myl",
        caption: "MisterY Labs sits south of the high-confidence chain, still forming.",
      },
    ],
  },
  {
    id: "geometry-thread",
    name: "The Geometry Thread",
    subtitle: "A high-north ancestry chain. No helix crossing.",
    steps: [
      {
        type: "node",
        id: "star-euclid",
        caption: "He wrote proof into a durable form.",
      },
      {
        type: "node",
        id: "star-newton",
        caption: "The same mathematics could describe an apple and Jupiter.",
      },
      {
        type: "node",
        id: "k-faraday",
        caption: "He saw the field before he could write it down.",
      },
      {
        type: "node",
        id: "k-maxwell",
        caption: "He wrote it down.",
      },
      {
        type: "node",
        id: "k-einstein",
        caption: "Geometry is not the container of physics. It is physics.",
      },
      {
        type: "node",
        id: "k-penrose",
        caption: "The path becomes a statement about the field it crosses.",
      },
    ],
  },
];

export const brochEdges: BrochEdge[] = [
  { id: "geometry-euclid-newton", from: "star-euclid", to: "star-newton", kind: "strand" },
  { id: "geometry-newton-faraday", from: "star-newton", to: "k-faraday", kind: "strand" },
  { id: "geometry-faraday-maxwell", from: "k-faraday", to: "k-maxwell", kind: "strand" },
  { id: "geometry-maxwell-einstein", from: "k-maxwell", to: "k-einstein", kind: "strand" },
  { id: "geometry-einstein-penrose", from: "k-einstein", to: "k-penrose", kind: "strand" },
  { id: "observer-galileo-sagan", from: "b-galileo", to: "b-sagan", kind: "great-circle" },
  { id: "observer-sagan-x", from: "b-sagan", to: "k-xprimery", kind: "great-circle" },
  { id: "observer-x-myl", from: "k-xprimery", to: "s-myl", kind: "beacon", transferEventId: "te-04" },
  { id: "story-homer-wells", from: "star-homer", to: "s-wells", kind: "great-circle" },
  { id: "story-wells-2001", from: "s-wells", to: "s-2001", kind: "great-circle" },
  { id: "story-2001-interstellar", from: "s-2001", to: "s-interstellar", kind: "great-circle" },
  { id: "story-interstellar-myl", from: "s-interstellar", to: "s-myl", kind: "great-circle" },
  { id: "darwin-wells", from: "b-darwin", to: "s-wells", kind: "te-crossing", transferEventId: "te-02" },
  { id: "return-einstein-2001", from: "k-einstein", to: "s-2001", kind: "te-crossing", transferEventId: "te-03" },
  { id: "return-interstellar-x", from: "s-interstellar", to: "k-xprimery", kind: "beacon", transferEventId: "te-04" },
];
