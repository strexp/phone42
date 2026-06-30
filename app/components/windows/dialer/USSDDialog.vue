<!-- app/components/windows/dialer/USSDDialog.vue -->
<template>
    <v-dialog
        :model-value="modelValue"
        max-width="320"
        @update:model-value="$emit('update:modelValue', $event)"
    >
        <v-card :title="title">
            <v-card-text
                class="pt-2 text-label-large"
                style="
                    white-space: pre-wrap;
                    word-break: break-word;
                    line-height: 1.6;
                "
            >
                <pre style="text-wrap: auto;" v-text="text" />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn
                    color="primary"
                    text="OK"
                    @click="$emit('update:modelValue', false)"
                />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: boolean;
    title: string;
    text: string;
}>();

defineEmits(["update:modelValue"]);
</script>
