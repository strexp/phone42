<template>
    <v-app>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </v-app>
</template>

<script setup lang="ts">
useHead({
    title: "Gensokyo Phone",
    meta: [
        {
            name: "description",
            content: "WebRTC Client for Gensokyo Telephony Network",
        },
    ],
});
</script>
