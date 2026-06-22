import type { BrochTransferEvent } from "./types";

export const brochTransferEvents: BrochTransferEvent[] = [
  {
    id: "te-02",
    direction: "K↔S",
    catalyst: "H.G. Wells' The Time Machine (1895)",
    latency: "~35 years after Darwin",
    yield: "Evolutionary fiction, deep-time narrative, evolutionary thinking into social sciences",
    question:
      "If Darwin crossed into fiction, what did the fiction give back to biology? Which came first: evolutionary metaphor in culture, or evolutionary mechanism in science?",
  },
  {
    id: "te-03",
    direction: "K↔S",
    catalyst: "Kubrick/Clarke's 2001 (1968); Nolan/Thorne's Interstellar (2014)",
    latency: "~60 years, then 46 more",
    yield: "Visual vocabulary for spacetime geometry; Thorne's black hole rendering paper",
    question:
      "The S→K return from Interstellar produced peer-reviewed physics. Does that mean a film can be a scientific instrument? If yes, what other Story Lineage nodes contain undiscovered K-strand returns?",
    returnPathStatus: "confirmed",
  },
  {
    id: "te-04",
    direction: "S→K",
    catalyst: "YouTube physics community; Reddit geometry communities (~2015-2020)",
    latency: "~20 years after the internet goes public",
    yield: "xPRIMEray's audience and cultural legibility",
    question:
      "TE-04 has no confirmed return path. When xPRIMEray's Observatory Artifacts enter a cultural form, the return completes. What would that look like?",
    returnPathStatus: "unconfirmed",
  },
];

export const brochTransferEventsById = Object.fromEntries(
  brochTransferEvents.map((event) => [event.id, event]),
);
