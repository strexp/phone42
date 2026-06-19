<template>
    <div class="flex-grow-1 d-flex flex-column h-100">
        <MobileStatus v-if="isMobile" />
        <v-main style="max-height: 100%">
            <slot />
        </v-main>
        <BottomNav />
    </div>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";

const { mobile } = useDisplay();
const isMobile = mobile;
</script>
