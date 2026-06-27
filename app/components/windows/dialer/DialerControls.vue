<template>
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
                    :disabled="!hasMicrophone"
                    :color="isMuted ? 'error' : ''"
                    @click="$emit('toggle-mute')"
                />
            </v-col>
            <v-col cols="4" class="text-center pa-1">
                <v-btn
                    icon="mdi-phone-hangup"
                    size="x-large"
                    color="error"
                    elevation="6"
                    @click="$emit('hangup')"
                />
            </v-col>
            <v-col cols="4" class="text-center pa-1">
                <v-btn
                    icon="mdi-dialpad"
                    size="x-large"
                    variant="outlined"
                    :color="showDialpad ? 'primary' : ''"
                    @click="$emit('toggle-dialpad')"
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
                    @click="$emit('call')"
                />
            </v-col>

            <v-col cols="4" class="text-center pa-1">
                <v-btn
                    v-if="inputNumber.length > 0"
                    variant="text"
                    class="rounded-circle dial-btn"
                    size="x-large"
                    icon="mdi-backspace-outline"
                    @pointerdown="$emit('backspace-start')"
                    @pointerup="$emit('backspace-end')"
                    @pointerleave="$emit('backspace-cancel')"
                    @pointercancel="$emit('backspace-cancel')"
                    @contextmenu.prevent
                />
            </v-col>
        </template>
    </v-row>
</template>

<script setup lang="ts">
defineProps<{
    isInCall: boolean;
    isCalling: boolean;
    isMuted: boolean;
    showDialpad: boolean;
    canCall: boolean;
    inputNumber: string;
    hasMicrophone: boolean;
}>();

defineEmits([
    "toggle-mute",
    "hangup",
    "toggle-dialpad",
    "call",
    "backspace-start",
    "backspace-end",
    "backspace-cancel",
]);
</script>

<style scoped>
.dial-btn {
    touch-action: none;
}
</style>
