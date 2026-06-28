<template>
    <div class="flex-grow-1 d-flex flex-column h-100">
        <v-main style="max-height: 100%">
            <slot />
        </v-main>
        <BottomNav />
    </div>
</template>

<script setup lang="ts">
import BottomNav from "~/components/nav/BottomNav.vue";
</script>
