<template>
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
            {{ matchedContactName(currentTarget) || currentTarget }}
        </div>
        <div
            v-if="matchedContactName(currentTarget)"
            class="text-caption mt-1 text-grey"
        >
            {{ currentTarget }}
        </div>
        <div
            class="text-title-large mt-1 text-primary"
            style="min-height: 24px"
        >
            {{ dtmfLog }}
        </div>
    </template>

    <template v-else>
        <div
            class="d-flex flex-column align-center justify-center w-100 px-4 mb-4 number-display"
            style="min-height: 80px"
            @click="$emit('display-click')"
        >
            <span
                class="text-headline-large font-weight-bold text-truncate"
                style="max-width: 100%; letter-spacing: 2px"
            >
                {{ inputNumber }}
            </span>
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
</template>

<script setup lang="ts">
import { useCallStore } from "@/stores/callstore";

defineProps<{
    isInCall: boolean;
    isCalling: boolean;
    inputNumber: string;
    callDuration: string;
    currentTarget: string;
    dtmfLog: string;
}>();

defineEmits(["display-click"]);

const store = useCallStore();

const matchedContactName = (num: string) => {
    const contact = store.getContactByNumber(num);
    return contact ? contact.name : null;
};
</script>

<style scoped>
.number-display {
    cursor: pointer;
    -webkit-tap-highlight-color: rgba(255, 255, 255, 0.1);
}
</style>
