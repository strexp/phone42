<template>
    <v-app>
        <v-container
            class="d-flex fill-height align-center justify-center pa-0"
            fluid
        >
            <v-card
                :width="isMobile ? '100%' : 380"
                :height="isMobile ? '100%' : 750"
                class="d-flex flex-column position-relative"
                :rounded="isMobile ? 0 : 'lg'"
                style="max-height: 100vh"
                flat
            >
                <StatusBar v-if="!isMobile" />
                <NuxtLayout>
                    <NuxtPage />
                </NuxtLayout>
            </v-card>
            <audio ref="globalAudioRef" style="display: none" autoplay />
        </v-container>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useDisplay } from "vuetify";
import StatusBar from "@/components/StatusBar.vue";
import sipController from "@/utils/sipclient";

useHead({
    title: "Gensokyo Phone",
    meta: [
        {
            name: "description",
            content: "WebRTC Client for Gensokyo Telephony Network",
        },
    ],
});

const { mobile } = useDisplay();
const isMobile = mobile;

const globalAudioRef = ref<HTMLAudioElement | null>(null);

onMounted(() => {
    if (globalAudioRef.value) {
        sipController.init(globalAudioRef.value);
    }
});
</script>
