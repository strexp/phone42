<template>
    <v-card flat class="h-100 d-flex flex-column position-relative">
        <MessageConversations v-if="!viewStore.isChatOpen" />
        <MessageChat v-else @call-triggered="$emit('call-triggered')" />
    </v-card>
</template>

<script setup lang="ts">
import { useViewStore } from "@/stores/viewstore";
import MessageConversations from "./message/MessageConversations.vue";
import MessageChat from "./message/MessageChat.vue";

const viewStore = useViewStore();
defineEmits(["call-triggered"]);
</script>
