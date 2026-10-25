/**
 * Spatial records for the interactive atlas.
 *
 * A destination is a place in the world, not a menu item.
 * `collection` is reserved for a future family that reuses this same
 * grammar at another scale (approach, then descend). None are placed yet.
 * `hidden` destinations stay out of ordinary navigation, paths, and picking
 * until something explicit discovers them. Do not draw them by default.
 */
export type DestinationKind = "landmark" | "collection" | "exhibit" | "hidden";

export type ExhibitId =
  | "hydrogen"
  | "triad"
  | "optics"
  | "bell"
  | "xprimeray"
  | "photon"
  | "hollow-genius"
  | "ambiguous-dancer"
  | "inside-out"
  | "cubic-worm";

export type DestinationId = ExhibitId | "cenotaph";

export type Destination = {
  id: string;
  kind: DestinationKind;
  name: string;
  question?: string;
  /** Fairground hall name, when the plate should say more than the instrument. */
  hall?: string;
  /** Site route, relative to the router basename. Only when the instrument is released. */
  href?: string;
  /** True only when a real instrument page already exists. */
  released: boolean;
  /** Ordinary world placement. Hidden records stay false. */
  placed: boolean;
};

export const EXHIBITS: Record<ExhibitId, Destination> = {
  hydrogen: {
    id: "hydrogen",
    kind: "exhibit",
    name: "Hydrogen",
    question: "Why doesn’t it collapse?",
    href: "/observatory/hydrogen",
    released: true,
    placed: true,
  },
  triad: {
    id: "triad",
    kind: "exhibit",
    name: "Triad",
    question: "What would this maneuver demand?",
    href: "/observatory/triad",
    released: true,
    placed: true,
  },
  optics: {
    id: "optics",
    kind: "exhibit",
    name: "Apple of the Eye",
    question: "Where does the ray actually go?",
    href: "/observatory/polar-grin",
    released: true,
    placed: true,
  },
  bell: {
    id: "bell",
    kind: "exhibit",
    name: "Bell",
    question: "What must the world give up?",
    released: false,
    placed: true,
  },
  xprimeray: {
    id: "xprimeray",
    kind: "exhibit",
    name: "xPRIMEray",
    question: "What shape does light think space has?",
    released: false,
    placed: true,
  },
  photon: {
    id: "photon",
    kind: "exhibit",
    name: "Photon Journey",
    question: "Why can a phone photograph the Moon, yet struggle to focus on a droplet?",
    href: "/observatory/photon-journey",
    released: true,
    placed: true,
  },
  "hollow-genius": {
    id: "hollow-genius",
    kind: "exhibit",
    name: "Hollow Genius",
    question: "Why does a hollow face look outward?",
    href: "/observatory/higher-dimensional/hollow-genius",
    released: true,
    placed: true,
  },
  "ambiguous-dancer": {
    id: "ambiguous-dancer",
    kind: "exhibit",
    name: "Ambiguous Dancer",
    hall: "Pavilion of Turning Shadows",
    question: "Did she change direction, or did you?",
    href: "/observatory/higher-dimensional/ambiguous-dancer",
    released: true,
    placed: true,
  },
  "inside-out": {
    id: "inside-out",
    kind: "exhibit",
    name: "Inside-Out Universe",
    hall: "House of Unfolding",
    question: "How does a flat net become a solid?",
    href: "/observatory/higher-dimensional/inside-out",
    released: true,
    placed: true,
  },
  "cubic-worm": {
    id: "cubic-worm",
    kind: "exhibit",
    name: "Cubic Worm",
    hall: "The Square Throat",
    question: "Is that a passage, or a projection?",
    href: "/observatory/higher-dimensional/cubic-worm",
    released: true,
    placed: true,
  },
};

export const CENOTAPH: Destination = {
  id: "cenotaph",
  kind: "landmark",
  name: "Newton’s Cenotaph",
  released: false,
  placed: true,
};

/** Future collections. Not populated. Entering one should descend, not open a submenu. */
export const COLLECTIONS: Destination[] = [];

/** Future rabbit holes. Absent from paths, pick spheres, and the plate. */
export const HIDDEN_DESTINATIONS: Destination[] = [];

export type AtlasMode = "fly" | "walk";

export type WalkerPose = {
  x: number;
  z: number;
  heading: number;
};

export type AtlasUi = {
  scale: number;
  selected: DestinationId | null;
  proximity: number;
  atHome: boolean;
  inside: boolean;
  mode: AtlasMode;
  walker: WalkerPose | null;
};

export type CenotaphVariant = "a" | "b" | "c" | "m";

export type AtlasApi = {
  returnHome: () => void;
  crossBoundary: () => void;
  returnOutside: () => void;
  setCenotaphVariant: (variant: CenotaphVariant) => void;
  setMode: (mode: AtlasMode) => void;
  setMove: (x: number, y: number) => void;
  /** Remember where the visitor is standing before they leave for an instrument. */
  remember: () => void;
};

export function isExhibitId(value: string): value is ExhibitId {
  return value in EXHIBITS;
}

export function isDestinationId(value: string | null): value is DestinationId {
  return value === "cenotaph" || (value != null && value in EXHIBITS);
}
