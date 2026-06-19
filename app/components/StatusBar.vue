<template>
    <v-system-bar
        :color="barColor"
        absolute
        class="text-white px-4 transition-color d-flex justify-space-between"
    >
        <span>
            <span class="font-weight-bold">{{ BRANDING.SHORT_NAME }}</span> |
            {{ statusText }}
        </span>
        <span>
            <v-icon :icon="signalIcon" class="me-1" />
            {{ time }}
        </span>
    </v-system-bar>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { BRANDING } from "@/config";
import sipController from "@/utils/sipclient";
import { CallStatus } from "@/types/call";

const time = ref("");

onMounted(() => {
    const updateTime = () => {
        const now = new Date();
        time.value = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    updateTime();
    setInterval(updateTime, 1000);
});

const status = sipController.status;

const barColor = computed(() => {
    switch (status.value) {
        case CallStatus.IN_CALL:
            return "success";
        case CallStatus.CALLING:
            return "light-green-darken-1";
        case CallStatus.HELD:
            return "warning";
        case CallStatus.DISCONNECTED:
            return "grey-darken-3";
        default:
            return BRANDING.COLOR;
    }
});

const signalIcon = computed(() => {
    if (status.value === CallStatus.DISCONNECTED) return "mdi-signal-off";
    if (status.value === CallStatus.IN_CALL) {
        const q = sipController.networkQuality.value;
        if (q >= 4) return "mdi-signal-cellular-3";
        if (q === 3) return "mdi-signal-cellular-2";
        if (q === 2) return "mdi-signal-cellular-1";
        return "mdi-signal-cellular-outline";
    }
    return "mdi-signal";
});

const statusText = computed(() => {
    switch (status.value) {
        case CallStatus.CONNECTING:
            return $t("status.connecting");
        case CallStatus.DISCONNECTED:
            return $t("status.disconnected");
        case CallStatus.CALLING:
            return $t("status.calling");
        case CallStatus.IN_CALL:
            return $t("status.in_call");
        case CallStatus.HELD:
            return $t("status.held");
        default:
            return $t("status.connected");
    }
});
</script>

<style scoped>
.transition-color {
    transition: background-color 0.3s ease;
}
</style>
