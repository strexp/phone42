<template>
    <v-bottom-navigation
        v-if="!isInCall && !isCalling && !(viewStore.currentWindow === 'messages' && viewStore.isChatOpen)"
        v-model="viewStore.currentWindow"
        absolute
        grow
        mandatory
    >
        <v-btn value="phone">
            <v-icon icon="mdi-dialpad" class="mb-1" />
            <span>{{ $t("nav.dial") }}</span>
        </v-btn>

        <v-btn value="messages">
            <v-icon icon="mdi-message-text" class="mb-1" />
            <span>{{ $t("nav.messages") }}</span>
        </v-btn>

        <v-btn value="contacts">
            <v-icon icon="mdi-account-box" class="mb-1" />
            <span>{{ $t("nav.contacts") }}</span>
        </v-btn>

        <v-btn value="history">
            <v-icon icon="mdi-clock-outline" class="mb-1" />
            <span>{{ $t("nav.history") }}</span>
        </v-btn>
    </v-bottom-navigation>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useViewStore } from "@/stores/viewstore";
import { CallStatus } from "~/types/call";
import sipclient from "@/utils/sipclient";

const viewStore = useViewStore();
const status = sipclient.status;

const isInCall = computed(() =>
    [CallStatus.IN_CALL, CallStatus.HELD].includes(status.value),
);
const isCalling = computed(() => status.value === CallStatus.CALLING);
</script>
