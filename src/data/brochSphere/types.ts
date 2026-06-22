export type BrochNodeKind = "star" | "knowledge" | "story" | "bridge";
export type BrochDepth = "SHALLOW" | "MODERATE" | "DEEP" | "VERY_DEEP";
export type ObserverStanceId = "verifier" | "receiver";
export type TransferDirection = "K→S" | "S→K" | "K↔S";
export type TransferReturnStatus = "confirmed" | "unconfirmed";

export interface BrochNode {
  id: string;
  label: string;
  kind: BrochNodeKind;
  latitude: number;
  longitude: number;
  sector: string;
  heritageDepth: BrochDepth;
  influenceDepth: BrochDepth;
  influenceRadius: number;
  openQuestion?: string;
  uncertainty?: string;
  stanceReadings?: Partial<Record<ObserverStanceId, string>>;
}

export interface BrochTransferEvent {
  id: string;
  direction: TransferDirection;
  catalyst: string;
  latency: string;
  yield: string;
  question: string;
  returnPathStatus?: TransferReturnStatus;
}

export interface ObserverStance {
  id: ObserverStanceId;
  name: string;
  governingQuestion: string;
  position: {
    latitude: number;
    longitude: number;
    sector: string;
  };
  visibleNodeIds: string[];
  cannotAsk: string;
}

export interface BrochConstellation {
  id: string;
  name: string;
  stanceId: ObserverStanceId;
  nodeIds: string[];
  transferEventIds?: string[];
  reading: string;
}

export type JourneyStep =
  | {
      type: "node";
      id: string;
      caption: string;
    }
  | {
      type: "transfer";
      id: string;
      caption: string;
    }
  | {
      type: "horizon";
      id: string;
      caption: string;
    };

export interface BrochJourney {
  id: string;
  name: string;
  subtitle: string;
  primary?: boolean;
  steps: JourneyStep[];
}

export interface BrochEdge {
  id: string;
  from: string;
  to: string;
  kind: "strand" | "great-circle" | "te-crossing" | "beacon";
  transferEventId?: string;
}
