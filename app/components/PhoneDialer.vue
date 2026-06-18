<template>
    <div
        class="flex-grow-1 d-flex flex-column justify-center align-center mt-md-8 mb-md-6 mb-4 mt-2 transition-all"
    >
        <template v-if="isInCall || isCalling">
            <div class="text-caption text-medium-emphasis mb-1">
                {{
                    isCalling
                        ? $t("phone.calling")
                        : $t("phone.in_call") + ` ${callDuration}`
                }}
            </div>
            <div
                class="text-headline-large font-weight-bold text-truncate"
                style="max-width: 90%"
            >
                {{
                    matchedContactName(sipclient.currentTarget.value) ||
                    sipclient.currentTarget.value
                }}
            </div>
            <div
                v-if="matchedContactName(sipclient.currentTarget.value)"
                class="text-caption"
            >
                {{ sipclient.currentTarget.value }}
            </div>
            <div
                class="text-title-large mt-1 text-primary"
                style="min-height: 24px"
            >
                {{ sipclient.dtmfLog.value }}
            </div>
        </template>

        <template v-else>
            <div
                class="d-flex flex-column align-center justify-center w-100 px-4"
                style="min-height: 80px"
            >
                <span
                    class="text-headline-large font-weight-bold text-truncate"
                    style="max-width: 100%"
                    >{{ inputNumber }}</span
                >
                <span
                    v-if="inputNumber && matchedContactName(inputNumber)"
                    class="text-title-large text-primary mt-1"
                >
                    {{ matchedContactName(inputNumber) }}
                </span>
                <span
                    v-if="!inputNumber"
                    class="text-headline-large text-grey-lighten-2"
                    >{{ $t("phone.input_number") }}</span
                >
            </div>
        </template>
    </div>

    <v-row
        dense
        justify="center"
        class="mb-4 px-4"
        style="max-width: 320px; margin: 0 auto"
    >
        <v-col v-for="key in keys" :key="key.main" cols="4" class="text-center">
            <v-btn
                variant="tonal"
                class="rounded-circle mb-2 text-title-large"
                height="70"
                width="70"
                :color="status === CallStatus.DISCONNECTED ? 'grey' : 'default'"
                @click="pressKey(key.main)"
            >
                {{ key.main }}
            </v-btn>
        </v-col>
        <template v-if="isInCall || isCalling">
            <v-col cols="4" class="text-center mt-4">
                <v-btn
                    icon="mdi-microphone-off"
                    size="large"
                    variant="outlined"
                    :color="isMuted ? 'error' : ''"
                    @click="isMuted = sipclient.toggleMute()"
                />
            </v-col>
            <v-col cols="4" class="text-center mt-4">
                <v-btn
                    icon="mdi-phone-hangup"
                    size="x-large"
                    color="error"
                    elevation="6"
                    @click="hangupAndClear"
                />
            </v-col>
            <v-col cols="4" class="text-center mt-4">
                <v-btn
                    icon="mdi-pause"
                    size="large"
                    variant="outlined"
                    :color="status === CallStatus.HELD ? 'warning' : ''"
                    @click="sipclient.toggleHold()"
                />
            </v-col>
        </template>

        <template v-else>
            <v-col cols="4" class="text-center mt-4">
                <v-btn
                    variant="text"
                    class="rounded-circle mb-2"
                    height="70"
                    width="70"
                    icon="mdi-cog"
                    to="/settings"
                />
            </v-col>
            <v-col cols="4" class="text-center mt-4">
                <v-btn
                    icon="mdi-phone"
                    size="x-large"
                    color="success"
                    elevation="6"
                    :disabled="!canCall"
                    @click="doCall"
                />
            </v-col>

            <v-col cols="4" class="text-center mt-4">
                <v-btn
                    v-if="inputNumber.length > 0"
                    variant="text"
                    class="rounded-circle mb-2"
                    height="70"
                    width="70"
                    icon="mdi-backspace-outline"
                    @click="backspace"
                />
            </v-col>
        </template>
    </v-row>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import sipclient from "@/utils/sipclient";
import soundGenerator from "@/utils/soundgen";
import { useCallStore } from "@/stores/callstore";
import { CallStatus } from "@/types/call";

const keys = [
    { main: "1" },
    { main: "2" },
    { main: "3" },
    { main: "4" },
    { main: "5" },
    { main: "6" },
    { main: "7" },
    { main: "8" },
    { main: "9" },
    { main: "*" },
    { main: "0", long: "+" },
    { main: "#" },
];
const isMuted = ref(false);
const inputNumber = ref("");
const callDuration = ref("00:00");
const store = useCallStore();
let timerInterval: number | null = null;

const status = sipclient.status;

const isInCall = computed(() =>
    [CallStatus.IN_CALL, CallStatus.HELD].includes(status.value),
);
const isCalling = computed(() => status.value === CallStatus.CALLING);

const canCall = computed(
    () => status.value === CallStatus.CONNECTED && inputNumber.value.length > 0,
);

const matchedContactName = (num: string) => {
    const contact = store.getContactByNumber(num);
    return contact ? contact.name : null;
};

const pressKey = (key: string) => {
    if (store.settings.enableKeypadSound) {
        soundGenerator.playDTMF(key);
    }

    if (isInCall.value) {
        sipclient.sendDTMF(key);
    } else {
        if (inputNumber.value.length < 20) {
            inputNumber.value += key;
        }
        if (inputNumber.value == "00") inputNumber.value = "+";
    }
};

const backspace = () => {
    inputNumber.value = inputNumber.value.slice(0, -1);
};

const doCall = () => {
    if (canCall.value) {
        sipclient.call(inputNumber.value);
    }
};

const hangupAndClear = () => {
    sipclient.hangup();
    inputNumber.value = "";
};

const startTimer = () => {
    stopTimer();
    timerInterval = setInterval(() => {
        callDuration.value = sipclient.duration();
    }, 1000);
};

const stopTimer = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    callDuration.value = "00:00";
};

watch(
    status,
    (newVal, oldVal) => {
        if (newVal === CallStatus.IN_CALL && oldVal !== CallStatus.IN_CALL) {
            startTimer();
        }
        if (
            oldVal === CallStatus.IN_CALL &&
            newVal !== CallStatus.IN_CALL &&
            newVal !== CallStatus.HELD
        ) {
            stopTimer();
        }
    },
    { immediate: true },
);

onUnmounted(() => {
    stopTimer();
});
</script>

<style scoped>
.transition-all {
    transition: all 0.3s ease;
}
</style>
