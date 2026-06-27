<template>
    <div class="d-flex flex-column h-100 w-100">
        <v-toolbar color="transparent" density="compact">
            <v-btn icon="mdi-arrow-left" @click="closeChat" />
            <v-toolbar-title class="d-flex flex-column justify-center">
                <div class="text-subtitle-1 font-weight-bold" style="line-height: 1.2;">
                    {{ contact?.name || activeChatTarget }}
                </div>
                <div v-if="contact" class="text-caption text-grey" style="line-height: 1.2;">
                    {{ activeChatTarget }}
                </div>
            </v-toolbar-title>
            <v-btn icon="mdi-phone" @click="doCall" />
        </v-toolbar>
        <v-divider />

        <v-card-text
            id="chat-scroll-container"
            class="flex-grow-1 overflow-y-auto pa-3 d-flex flex-column"
            style="min-height: 0"
        >
            <div
                v-for="msg in activeMessages"
                :key="msg.id"
                class="d-flex mb-3"
                :class="
                    msg.direction === 'outbound'
                        ? 'justify-end'
                        : 'justify-start'
                "
            >
                <v-card
                    :color="
                        msg.direction === 'outbound'
                            ? 'primary'
                            : 'surface-variant'
                    "
                    class="px-3 py-2 text-body-1"
                    style="
                        max-width: 80%;
                        border-radius: 16px;
                        min-width: 30%;
                    "
                    flat
                >
                    <div
                        style="
                            white-space: pre-wrap;
                            word-break: break-word;
                        "
                    >
                        {{ msg.body }}
                    </div>
                    <div
                        class="text-label-small mt-1 text-right"
                        :class="
                            msg.direction === 'outbound'
                                ? 'text-primary-lighten-4'
                                : 'text-grey'
                        "
                    >
                        {{ formatTime(msg.timestamp) }}
                    </div>
                </v-card>
            </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-2 px-3 align-end surface">
            <v-textarea
                v-model="newMessageText"
                variant="solo-filled"
                density="comfortable"
                hide-details
                auto-grow
                rows="1"
                max-rows="4"
                :placeholder="$t('messages.type_message')"
                class="mr-2"
            />
            <v-btn
                icon="mdi-send"
                color="primary"
                variant="elevated"
                :disabled="
                    !newMessageText.trim() ||
                    status !== CallStatus.CONNECTED
                "
                @click="sendMessage"
            />
        </v-card-actions>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useMessageStore } from "@/stores/messagestore";
import { useCallStore } from "@/stores/callstore";
import { useViewStore } from "@/stores/viewstore";
import sipclient from "@/utils/sipclient";
import { CallStatus } from "@/types/call";

const emit = defineEmits(["call-triggered"]);

const msgStore = useMessageStore();
const callStore = useCallStore();
const viewStore = useViewStore();
const status = sipclient.status;

const activeChatTarget = computed(() => viewStore.activeChatTarget);
const contact = computed(() => callStore.getContactByNumber(activeChatTarget.value));
const newMessageText = ref("");

const activeMessages = computed(() => {
    if (!activeChatTarget.value) return [];
    return msgStore.getMessagesByTarget(activeChatTarget.value);
});

const scrollToBottom = () => {
    nextTick(() => {
        const el = document.getElementById("chat-scroll-container");
        if (el) el.scrollTop = el.scrollHeight;
    });
};

watch(
    activeMessages,
    () => {
        scrollToBottom();
        if (viewStore.isChatOpen && activeChatTarget.value) {
            msgStore.markAsRead(activeChatTarget.value);
        }
    },
    { deep: true, immediate: true }
);

const closeChat = () => {
    viewStore.closeMessageChat();
};

const sendMessage = async () => {
    const text = newMessageText.value.trim();
    if (!text || !activeChatTarget.value) return;
    await sipclient.sendMessage(activeChatTarget.value, text);
    newMessageText.value = "";
    scrollToBottom();
};

const doCall = () => {
    if (activeChatTarget.value) {
        sipclient.call(activeChatTarget.value);
        emit("call-triggered");
    }
};

const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};
</script>
