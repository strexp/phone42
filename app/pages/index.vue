<template>
    <v-window
        v-model="viewStore.currentWindow"
        class="flex-grow-1 w-100 fill-hight h-100"
        style="overflow: hidden"
    >
        <v-window-item value="phone" class="h-100">
            <PhoneDialer class="pa-4" />
        </v-window-item>

        <v-window-item value="messages" class="h-100">
            <MessageList @call-triggered="switchToPhone" />
        </v-window-item>

        <v-window-item value="contacts" class="h-100">
            <ContactList @call-triggered="switchToPhone" @message-triggered="switchToMessage" />
        </v-window-item>

        <v-window-item value="history" class="h-100">
            <CallHistory @call-triggered="switchToPhone" />
        </v-window-item>
    </v-window>
</template>

<script setup lang="ts">
import PhoneDialer from "@/components/PhoneDialer.vue";
import CallHistory from "@/components/CallHistory.vue";
import ContactList from "@/components/ContactList.vue";
import MessageList from "@/components/MessageList.vue";
import { useViewStore } from "@/stores/viewstore";

const viewStore = useViewStore();

const switchToPhone = () => {
    viewStore.currentWindow = "phone";
};

const switchToMessage = () => {
    viewStore.currentWindow = "messages";
};
</script>
