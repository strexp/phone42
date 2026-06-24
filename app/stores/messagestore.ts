import { defineStore } from "pinia";
import { ref, watch, computed } from "vue";
import type { ChatMessage } from "@/types/message";

export const useMessageStore = defineStore("message", () => {
  const messages = ref<ChatMessage[]>([]);
  const STORAGE_KEY = "gtn_message_data";

  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        messages.value = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to load messages", e);
        messages.value = [];
      }
    }
  }

  watch(
    messages,
    () => {
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value));
      }
    },
    { deep: true },
  );

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    messages.value.push({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      isRead: msg.direction === "outbound",
      ...msg,
    });
  };

  const markAsRead = (target: string) => {
    for (const m of messages.value) {
      if (m.target === target && m.direction === "inbound" && !m.isRead) {
        m.isRead = true;
      }
    }
  };

  const getUnreadCount = (target: string) => {
    return messages.value.filter((m) => m.target === target && m.direction === "inbound" && !m.isRead).length;
  };

  const clearMessages = (target?: string) => {
    if (target) {
      messages.value = messages.value.filter((m) => m.target !== target);
    } else {
      messages.value = [];
    }
  };

  const getConversations = computed(() => {
    const map = new Map<string, ChatMessage>();
    for (const msg of messages.value) {
      const existing = map.get(msg.target);
      if (!existing || msg.timestamp > existing.timestamp) {
        map.set(msg.target, msg);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
  });

  const getMessagesByTarget = (target: string) => {
    return messages.value
      .filter((m) => m.target === target)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  return {
    messages,
    addMessage,
    clearMessages,
    getConversations,
    getMessagesByTarget,
    markAsRead,
    getUnreadCount,
  };
});
