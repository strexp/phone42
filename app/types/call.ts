enum CallStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  CALLING = "calling",
  IN_CALL = "in_call",
  HELD = "held",
}

enum CallDirection {
  OUTBOUND = "outbound",
  INBOUND = "inbound",
}

interface CallRecord {
  id: string;
  target: string;
  timestamp: number;
  duration: number;
  direction: CallDirection;
}

export { CallStatus, CallDirection };
export type { CallRecord };
