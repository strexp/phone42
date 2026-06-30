<template>
    <v-row
        density="compact"
        no-gutters
        align="end"
        class="px-4 mb-4"
        style="width: 360px"
    >
        <v-col
            v-for="key in keys"
            :key="key.main"
            cols="4"
            class="text-center pa-1"
        >
            <v-btn
                variant="tonal"
                class="rounded-circle mb-2 dial-btn text-title-large"
                height="70"
                width="70"
                :color="disabled ? 'grey' : 'default'"
                @pointerdown="startPress(key.main)"
                @pointerup="endPress(key.main)"
                @pointerleave="cancelPress"
                @pointercancel="cancelPress"
                @contextmenu.prevent
            >
                <div
                    class="d-flex flex-column align-center justify-center mt-1"
                >
                    <span
                        class="text-h5 font-weight-bold"
                        style="line-height: 1"
                    >
                        {{ key.main }}
                    </span>

                    <span
                        v-if="key.long"
                        class="text-grey font-weight-bold text-none text-label-small"
                        style="margin-top: 4px"
                    >
                        {{ key.long }}
                    </span>
                    <span
                        v-else-if="store.settings.enableT9Dialer && key.letters"
                        class="text-grey font-weight-bold text-none text-label-small"
                        style="margin-top: 4px"
                    >
                        {{ key.letters }}
                    </span>
                    <span
                        v-else
                        class="text-grey font-weight-bold text-none text-label-small"
                        style="margin-top: 4px"
                    >
                        &nbsp;
                    </span>
                </div>
            </v-btn>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
import soundGenerator from "@/utils/soundgen";
import { useCallStore } from "@/stores/callstore";

const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits(["key-press", "key-long-press"]);

const keys = [
    { main: "1" },
    { main: "2", letters: "ABC" },
    { main: "3", letters: "DEF" },
    { main: "4", letters: "GHI" },
    { main: "5", letters: "JKL" },
    { main: "6", letters: "MNO" },
    { main: "7", letters: "PQRS" },
    { main: "8", letters: "TUV" },
    { main: "9", letters: "WXYZ" },
    { main: "*" },
    { main: "0", long: "+" },
    { main: "#" },
];

const store = useCallStore();
let pressTimer: number | null = null;
let isLongPress = false;

const triggerHaptic = (pattern: number | number[] = 15) => {
    navigator.vibrate?.(pattern);
};

const startPress = (key: string) => {
    if (props.disabled) return;
    isLongPress = false;
    triggerHaptic(15);

    if (store.settings.enableKeypadSound) {
        soundGenerator.startDTMF(key);
    }

    if (key === "0") {
        pressTimer = window.setTimeout(() => {
            isLongPress = true;
            triggerHaptic([30, 40, 30]);
            emit("key-long-press", "+");
        }, 600);
    }
};

const endPress = (key: string) => {
    if (props.disabled) return;
    clearTimeout(pressTimer as number);
    if (store.settings.enableKeypadSound) {
        soundGenerator.stopDTMF();
    }

    if (!isLongPress) {
        emit("key-press", key);
    }
};

const cancelPress = () => {
    if (props.disabled) return;
    clearTimeout(pressTimer as number);
    if (store.settings.enableKeypadSound) {
        soundGenerator.stopDTMF();
    }
};
</script>

<style scoped>
.dial-btn {
    touch-action: none;
}
</style>
