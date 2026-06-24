<template>
    <v-avatar :color="color" :variant="variant">
        <v-img v-if="avatar" :src="avatar" />
        <v-icon v-else-if="!name">{{ icon }}</v-icon>
        <span v-else class="text-title-large">
            {{ name[0]?.toUpperCase() }}
        </span>
    </v-avatar>
</template>

<script setup lang="ts">
defineProps({
    name: { type: String, default: "" },
    avatar: { type: String, default: "" },
    icon: { type: String, default: "mdi-account" },
    color: { type: String, default: "primary" },
    variant: {
        type: String as PropType<
            "flat" | "text" | "elevated" | "tonal" | "outlined" | "plain"
        >,
        default: "tonal",
    },
});
</script>
