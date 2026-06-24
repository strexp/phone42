type MessageDirection = "inbound" | "outbound";

interface ChatMessage {
  id: string;
  target: string;
  body: string;
  timestamp: number;
  direction: MessageDirection;
  isRead?: boolean;
}

export type { ChatMessage, MessageDirection };
