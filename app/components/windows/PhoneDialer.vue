<template>
    <div
        class="d-flex flex-column align-content-space-between justify-center align-center py-8 transition-all h-100"
    >
        <DialerDisplay
            :is-in-call="isInCall"
            :is-calling="isCalling"
            :input-number="inputNumber"
            :call-duration="callDuration"
            :current-target="sipclient.currentTarget.value"
            :dtmf-log="sipclient.dtmfLog.value"
            @display-click="handleDisplayClick"
        />

        <T9MatchList
            v-if="t9Matches.length > 0 && !(isInCall || isCalling)"
            :matches="t9Matches"
            @select="handleT9Select"
        />

        <Keypad
            v-show="!(isInCall || isCalling) || showDialpad"
            :disabled="status === CallStatus.DISCONNECTED"
            @key-press="handleKeyPress"
            @key-long-press="handleLongPress"
        />

        <DialerControls
            :is-in-call="isInCall"
            :is-calling="isCalling"
            :is-muted="isMuted"
            :show-dialpad="showDialpad"
            :can-call="canCall"
            :input-number="inputNumber"
            :has-microphone="sipclient.hasMicrophone.value"
            @toggle-mute="isMuted = sipclient.toggleMute()"
            @hangup="hangupAndClear"
            @toggle-dialpad="showDialpad = !showDialpad"
            @call="doCall"
            @backspace-start="startBackspace"
            @backspace-end="endBackspace"
            @backspace-cancel="cancelBackspace"
        />

        <USSDDialog
            v-model="showUssdDialog"
            :title="ussdTitle"
            :text="ussdMessage"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";
import sipclient from "@/utils/sipclient";
import { CallStatus } from "@/types/call";
import Keypad from "./dialer/KeyPad.vue";
import DialerDisplay from "./dialer/DialerDisplay.vue";
import DialerControls from "./dialer/DialerControls.vue";
import T9MatchList from "./dialer/T9MatchList.vue";
import USSDDialog from "./dialer/USSDDialog.vue";
import { useDialerKeyboard } from "@/composables/useDialerKeyboard";
import { useViewStore } from "@/stores/viewstore";
import { useCallStore } from "@/stores/callstore";
import { searchT9 } from "@/utils/t9";
import { checkUSSD } from "@/utils/ussd";

const showDialpad = ref(false);
const isMuted = ref(false);
const inputNumber = ref("");
const callDuration = ref("00:00");

const showUssdDialog = ref(false);
const ussdTitle = ref("");
const ussdMessage = ref("");

const viewStore = useViewStore();
const callStore = useCallStore();
const route = useRoute();
const router = useRouter();

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

const t9Matches = computed(() => {
    if (!callStore.settings.enableT9Dialer || !inputNumber.value) return [];
    return searchT9(callStore.contacts, inputNumber.value);
});

const handleT9Select = (number: string) => {
    inputNumber.value = number;
};

const triggerHaptic = (pattern: number | number[] = 15) => {
    navigator.vibrate?.(pattern);
};

const handleKeyPress = (key: string) => {
    if (isInCall.value) {
        sipclient.sendDTMF(key);
    } else {
        if (inputNumber.value.length < 20) {
            inputNumber.value += key;
        }
    }
};

const handleLongPress = (key: string) => {
    if (!isInCall.value && inputNumber.value.length < 20) {
        inputNumber.value += key;
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

useDialerKeyboard({
    isInCall,
    isCalling,
    showDialpad,
    onKeyPress: handleKeyPress,
    onLongPress: handleLongPress,
    onBackspaceStart: startBackspace,
    onBackspaceEnd: endBackspace,
    onCall: doCall,
});

watch(inputNumber, (newVal) => {
    const res = checkUSSD(newVal);
    if (res.isUSSD) {
        ussdTitle.value = res.title || "";
        ussdMessage.value = res.message || "";
        showUssdDialog.value = true;
        if (res.clearInput) {
            inputNumber.value = "";
        }
    }
});

watch(
    () => route.query.dial,
    (newDial) => {
        if (newDial) {
            const dialStr = String(newDial);
            const cleanText = dialStr.replace(/[^0-9*#+]/g, "");
            if (cleanText) {
                inputNumber.value = cleanText.slice(0, 20);
                viewStore.currentWindow = "phone";
            }

            const newQuery = { ...route.query };
            delete newQuery.dial;
            router.replace({ query: newQuery });
        }
    },
    { immediate: true },
);

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
</style>
