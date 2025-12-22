<template>
    <v-container class="fill-height justify-center pa-0" fluid>
        <v-card
            :width="isMobile ? '100%' : 380"
            :height="isMobile ? '100%' : 750"
            class="d-flex flex-column overflow-hidden position-relative"
            :class="{ 'rounded-lg my-4': !isMobile }"
        >
            <StatusBar v-if="!isMobile" />
            <MobileStatus v-else />
            <div
                class="flex-grow-1 position-relative d-flex flex-column overflow-hidden pt-md-6"
            >
                <slot />
            </div>
            <div v-if="!isMobile" class="bg-black py-1 d-flex justify-center">
                <div
                    class="bg-grey-darken-3 rounded-pill"
                    style="width: 100px; height: 4px"
                />
            </div>
        </v-card>
        <audio ref="globalAudioRef" style="display: none" autoplay />
    </v-container>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useDisplay } from "vuetify";
import StatusBar from "@/components/StatusBar.vue";
import sipController from "@/utils/sipclient";
import MobileStatus from "@/components/MobileStatus.vue";

const { mobile } = useDisplay();
const isMobile = mobile;

const globalAudioRef = ref<HTMLAudioElement | null>(null);

onMounted(() => {
    if (globalAudioRef.value) {
        sipController.init(globalAudioRef.value);
    }
});
</script>
