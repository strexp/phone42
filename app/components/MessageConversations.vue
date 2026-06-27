<template>
    <div class="d-flex flex-column h-100 w-100">
        <v-card-title class="d-flex align-center py-3 ml-2">
            {{ $t("nav.messages") }}
            <v-spacer />
            <v-btn
                icon="mdi-message-plus"
                variant="text"
                @click="showNewMessage = true"
            />
        </v-card-title>

        <v-divider />

        <v-list class="flex-grow-1 overflow-y-auto">
            <v-list-item v-if="msgStore.getConversations.length === 0">
                <v-list-item-title class="text-center text-grey mt-4">
                    {{ $t("messages.no_records") }}
                </v-list-item-title>
            </v-list-item>

            <v-list-item
                v-for="conv in msgStore.getConversations"
                :key="conv.id"
                lines="two"
                @click="openChat(conv.target)"
            >
                <template #prepend>
                    <ContactAvatar
                        :name="callStore.getContactByNumber(conv.target)?.name"
                        variant="tonal"
                    />
                </template>
                <v-list-item-title>
                    {{
                        callStore.getContactByNumber(conv.target)?.name ||
                        conv.target
                    }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-truncate">
                    {{ conv.body }}
                </v-list-item-subtitle>
                <template #append>
                    <div class="d-flex flex-column align-end">
                        <div class="text-label-small text-grey mb-1">
                            {{ formatDate(conv.timestamp) }}
                        </div>
                        <v-badge
                            v-if="msgStore.getUnreadCount(conv.target) > 0"
                            color="error"
                            :content="msgStore.getUnreadCount(conv.target)"
                            inline
                        />
                    </div>
                </template>
            </v-list-item>
            <div class="text-label-small text-grey text-center">
                {{ $t("messages.reach_warning") }}
            </div>
        </v-list>

        <v-dialog v-model="showNewMessage" max-width="320">
            <v-card :title="$t('messages.new_message')">
                <v-card-text>
                    <v-text-field
                        v-model="newTarget"
                        :label="$t('contacts.number')"
                        variant="underlined"
                        autofocus
                    />
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        :text="$t('contacts.cancel')"
                        @click="showNewMessage = false"
                    />
                    <v-btn
                        color="primary"
                        :text="$t('messages.start')"
                        :disabled="!newTarget"
                        @click="startNewChat"
                    />
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useMessageStore } from "@/stores/messagestore";
import { useCallStore } from "@/stores/callstore";
import { useViewStore } from "@/stores/viewstore";
import ContactAvatar from "@/components/ContactAvatar.vue";

const msgStore = useMessageStore();
const callStore = useCallStore();
const viewStore = useViewStore();

const showNewMessage = ref(false);
const newTarget = ref("");

const openChat = (target: string) => {
    viewStore.openMessageChat(target);
    msgStore.markAsRead(target);
};

const startNewChat = () => {
    if (newTarget.value) {
        showNewMessage.value = false;
        openChat(newTarget.value);
        newTarget.value = "";
    }
};

const formatDate = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
    return date.toLocaleDateString();
};
</script>
