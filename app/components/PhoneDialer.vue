<template>
    <div
        class="d-flex flex-column align-content-space-between justify-center align-center py-8 transition-all h-100"
    >
        <template v-if="isInCall || isCalling">
            <div class="text-caption text-medium-emphasis mb-4">
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
                class="text-caption mt-1 text-grey"
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
                class="d-flex flex-column align-center justify-center w-100 px-4 mb-4 number-display"
                style="min-height: 80px"
                @click="handleDisplayClick"
            >
                <span
                    class="text-headline-large font-weight-bold text-truncate"
                    style="max-width: 100%; letter-spacing: 2px"
                    >{{ inputNumber }}</span
                >
                <span
                    v-if="inputNumber && matchedContactName(inputNumber)"
                    class="text-title-large text-primary mt-1"
                >
                    {{ matchedContactName(inputNumber) }}
                </span>

                <template v-if="!inputNumber">
                    <span class="text-headline-large">{{
                        $t("phone.input_number")
                    }}</span>
                    <span class="text-caption text-grey mt-1">{{
                        $t("phone.paste")
                    }}</span>
                </template>
            </div>
        </template>

        <v-row
            density="compact"
            no-gutters
            align="end"
            class="px-4 mb-4"
            style="width: 360px"
        >
            <v-col
                v-for="key in keys"
                v-show="!(isInCall || isCalling) || showDialpad"
                :key="key.main"
                cols="4"
                class="text-center pa-1"
            >
                <v-btn
                    variant="tonal"
                    class="rounded-circle mb-2 dial-btn text-title-large"
                    height="70"
                    width="70"
                    :color="
                        status === CallStatus.DISCONNECTED ? 'grey' : 'default'
                    "
                    @pointerdown="startPress(key.main)"
                    @pointerup="endPress(key.main)"
                    @pointerleave="cancelPress"
                    @pointercancel="cancelPress"
                    @contextmenu.prevent
                >
                    <div class="d-flex flex-column align-center">
                        <span v-if="key.long"> &nbsp; </span>
                        <span class="text-h5 font-weight-bold">{{
                            key.main
                        }}</span>
                        <span
                            v-if="key.long"
                            class="text-caption text-grey text-none"
                            style="margin-top: -4px"
                        >
                            {{ key.long }}
                        </span>
                    </div>
                </v-btn>
            </v-col>
        </v-row>
        <v-row
            density="compact"
            no-gutters
            align="end"
            class="mb-4 px-4"
            style="width: 360px"
        >
            <template v-if="isInCall || isCalling">
                <v-col cols="4" class="text-center pa-1">
                    <v-btn
                        icon="mdi-microphone-off"
                        size="x-large"
                        variant="outlined"
                        :color="isMuted ? 'error' : ''"
                        @click="isMuted = sipclient.toggleMute()"
                    />
                </v-col>
                <v-col cols="4" class="text-center pa-1">
                    <v-btn
                        icon="mdi-phone-hangup"
                        size="x-large"
                        color="error"
                        elevation="6"
                        @click="hangupAndClear"
                    />
                </v-col>
                <v-col cols="4" class="text-center pa-1">
                    <v-btn
                        icon="mdi-dialpad"
                        size="x-large"
                        variant="outlined"
                        :color="showDialpad ? 'primary' : ''"
                        @click="showDialpad = !showDialpad"
                    />
                </v-col>
            </template>

            <template v-else>
                <v-col cols="4" class="text-center pa-1">
                    <v-btn
                        variant="text"
                        class="rounded-circle"
                        size="x-large"
                        icon="mdi-cog"
                        to="/settings"
                    />
                </v-col>
                <v-col cols="4" class="text-center pa-1">
                    <v-btn
                        icon="mdi-phone"
                        size="x-large"
                        color="success"
                        elevation="6"
                        :disabled="!canCall"
                        @click="doCall"
                    />
                </v-col>

                <v-col cols="4" class="text-center pa-1">
                    <v-btn
                        v-if="inputNumber.length > 0"
                        variant="text"
                        class="rounded-circle dial-btn"
                        size="x-large"
                        icon="mdi-backspace-outline"
                        @pointerdown="startBackspace"
                        @pointerup="endBackspace"
                        @pointerleave="cancelBackspace"
                        @pointercancel="cancelBackspace"
                        @contextmenu.prevent
                    />
                </v-col>
            </template>
        </v-row>
    </div>
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

const showDialpad = ref(false);
const isMuted = ref(false);
const inputNumber = ref("");
const callDuration = ref("00:00");
const store = useCallStore();
let timerInterval: number | null = null;
let pressTimer: number | null = null;
let isLongPress = false;

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

const triggerHaptic = (pattern: number | number[] = 15) => {
    navigator.vibrate?.(pattern);
};

const startPress = (key: string) => {
    isLongPress = false;
    triggerHaptic(15);

    if (store.settings.enableKeypadSound) {
        soundGenerator.startDTMF(key);
    }

    if (key === "0") {
        pressTimer = window.setTimeout(() => {
            isLongPress = true;
            triggerHaptic([30, 40, 30]);
            if (!isInCall.value && inputNumber.value.length < 20) {
                inputNumber.value += "+";
            }
        }, 600);
    }
};

const endPress = (key: string) => {
    clearTimeout(pressTimer as number);
    if (store.settings.enableKeypadSound) {
        soundGenerator.stopDTMF();
    }

    if (!isLongPress) {
        if (isInCall.value) {
            sipclient.sendDTMF(key);
        } else {
            if (inputNumber.value.length < 20) {
                inputNumber.value += key;
            }
        }
    }
};

const cancelPress = () => {
    clearTimeout(pressTimer as number);
    if (store.settings.enableKeypadSound) {
        soundGenerator.stopDTMF();
    }
};

const startBackspace = () => {
    isLongPress = false;
    triggerHaptic(15);
    pressTimer = window.setTimeout(() => {
        isLongPress = true;
        triggerHaptic([30, 40, 30]);
        inputNumber.value = "";
    }, 600);
};

const endBackspace = () => {
    clearTimeout(pressTimer as number);
    if (!isLongPress && inputNumber.value.length > 0) {
        inputNumber.value = inputNumber.value.slice(0, -1);
    }
};

const cancelBackspace = () => {
    clearTimeout(pressTimer as number);
};

const handleDisplayClick = async () => {
    if (inputNumber.value.length === 0) {
        try {
            const text = await navigator.clipboard.readText();
            const cleanText = text.replace(/[^0-9*#+]/g, "");
            if (cleanText) {
                inputNumber.value = cleanText.slice(0, 20);
                triggerHaptic(20);
            }
        } catch (e) {
            console.warn("Clipboard access denied or empty", e);
        }
    }
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
    timerInterval = window.setInterval(() => {
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
        if (
            ![CallStatus.IN_CALL, CallStatus.CALLING, CallStatus.HELD].includes(
                newVal,
            )
        ) {
            showDialpad.value = false;
        }
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

.dial-btn {
    touch-action: none;
}

.number-display {
    cursor: pointer;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
}
</style>
