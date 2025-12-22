<template>
    <div class="h-100">
        <v-window
            v-model="tab"
            class="flex-grow-1 w-100 fill-hight h-100"
            style="overflow: hidden"
        >
            <v-window-item value="phone" class="h-100">
                <PhoneDialer class="pa-4" />
            </v-window-item>

            <v-window-item value="contacts" class="h-100">
                <ContactList @call-triggered="switchToPhone" />
            </v-window-item>

            <v-window-item value="history" class="h-100">
                <CallHistory @call-triggered="switchToPhone" />
            </v-window-item>
        </v-window>

        <v-bottom-navigation v-model="tab" absolute grow mandatory>
            <v-btn value="phone">
                <v-icon icon="mdi-dialpad" class="mb-1" />

                <span>{{ $t("nav.dial") }}</span>
            </v-btn>

            <v-btn value="contacts">
                <v-icon icon="mdi-account-box" class="mb-1" />

                <span>{{ $t("nav.contacts") }}</span>
            </v-btn>

            <v-btn value="history">
                <v-icon icon="mdi-clock-outline" class="mb-1" />

                <span>{{ $t("nav.history") }}</span>
            </v-btn>
        </v-bottom-navigation>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PhoneDialer from "@/components/PhoneDialer.vue";
import CallHistory from "@/components/CallHistory.vue";
import ContactList from "@/components/ContactList.vue";

const tab = ref("phone");

const switchToPhone = () => {
    tab.value = "phone";
};
</script>
