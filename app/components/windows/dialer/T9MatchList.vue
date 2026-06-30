<!-- app/components/windows/dialer/T9MatchList.vue -->
<template>
    <div class="t9-scroll-container w-100 d-flex px-4 mb-2">
        <v-card
            v-for="contact in matches"
            :key="contact.id"
            variant="tonal"
            color="primary"
            class="d-inline-flex align-center pa-1 mb-2 pr-4 mr-2 rounded-pill flex-shrink-0"
            flat
            @click="$emit('select', contact.number)"
        >
            <ContactAvatar
                :name="contact.name"
                :avatar="contact.avatar"
                size="32"
                class="mr-2"
            />
            <div
                class="d-flex flex-column justify-center text-left"
                style="line-height: 1.2"
            >
                <span
                    class="text-title-small font-weight-bold text-truncate"
                    style="max-width: 120px"
                >
                    {{ contact.name }}
                </span>
                <span class="text-label-small text-medium-emphasis">
                    {{ contact.number }}
                </span>
            </div>
        </v-card>
    </div>
</template>

<script setup lang="ts">
import type { Contact } from "@/types/contact";
import ContactAvatar from "@/components/ContactAvatar.vue";

defineProps<{
    matches: Contact[];
}>();

defineEmits<{
    (e: "select", number: string): void;
}>();
</script>

<style scoped>
.t9-scroll-container {
    overflow-x: auto;
}
</style>
