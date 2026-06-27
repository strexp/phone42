<template>
    <v-app>
        <VitePwaManifest />
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
                <v-snackbar
                    v-model="viewStore.snackbar"
                    timeout="3000"
                    color="primary"
                    location="bottom"
                    contained
                >
                    {{ viewStore.snackbarText }}
                    <template #actions>
                        <v-btn
                            variant="text"
                            icon="mdi-close"
                            @click="viewStore.snackbar = false"
                        />
                    </template>
                </v-snackbar>
            </v-card>
            <audio ref="globalAudioRef" style="display: none" autoplay />
        </v-container>
    </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useDisplay } from "vuetify";
import StatusBar from "./components/nav/StatusBar.vue";
import sipController from "@/utils/sipclient";
import { useViewStore } from "@/stores/viewstore";
import { useCallStore } from "@/stores/callstore";

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
const viewStore = useViewStore();
const callStore = useCallStore();
const { t } = useI18n();

onMounted(async () => {
    if (globalAudioRef.value) {
        sipController.init(globalAudioRef.value);
    }

    if (callStore.settings.autoUpdatePhonebook) {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - callStore.ypLastUpdate > ONE_DAY) {
            const success = await callStore.updateYpPhonebook();
            if (success) {
                viewStore.showToast(t("contacts.yp_update_success"));
            }
        }
    }
});
</script>
