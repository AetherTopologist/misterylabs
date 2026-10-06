import type { ExhibitId } from "./destinations";

/**
 * Future relation layer. Not drawn.
 *
 * Provenance is the root system under one instrument. Forest links run
 * horizontally between trees. They must never share walkway or root
 * materials, and they are not evidence.
 */
export type ForestLinkKind =
  | "demonstration"
  | "explainer"
  | "cultural-anchor"
  | "related-instrument"
  | "historical-parallel";

export type ForestLink = {
  layer: "forest";
  id: string;
  kind: ForestLinkKind;
  from: ExhibitId;
  to: string;
};

export const FOREST_LINKS: ForestLink[] = [];
