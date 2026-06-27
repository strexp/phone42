<template>
    <v-card flat class="h-100 d-flex flex-column">
        <v-card-title class="d-flex align-center py-3 ml-2">
            {{ $t("contacts.title") }}
            <v-spacer />

            <v-btn
                icon="mdi-cloud-download"
                variant="text"
                class="mr-2"
                @click="ypDialogOpen = true"
            />

            <v-btn
                icon="mdi-account-plus"
                variant="text"
                @click="addDialogOpen = true"
            />
        </v-card-title>

        <ContactImportDialog v-model="ypDialogOpen" />
        <ContactAddDialog v-model="addDialogOpen" />

        <v-divider />

        <v-list class="flex-grow-1 overflow-y-auto">
            <v-list-item
                v-for="contact in store.contacts"
                :key="contact.id"
                lines="two"
                ripple
            >
                <template #prepend>
                    <ContactAvatar
                        :name="contact.name"
                        :avatar="contact.avatar"
                        variant="outlined"
                    />
                </template>

                <v-list-item-title class="font-weight-medium">{{
                    contact.name
                }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{
                    contact.number
                }}</v-list-item-subtitle>

                <template #append>
                    <v-btn
                        v-if="!contact.isPreset"
                        icon="mdi-trash-can-outline"
                        size="small"
                        variant="text"
                        color="grey"
                        class="me-1"
                        @click.stop="store.removeContact(contact.id)"
                    />
                    <v-btn
                        icon="mdi-message-text"
                        size="small"
                        color="primary"
                        variant="tonal"
                        class="me-1"
                        @click="sendMessage(contact.number)"
                    />
                    <v-btn
                        icon="mdi-phone"
                        size="small"
                        color="success"
                        variant="tonal"
                        @click="callContact(contact.number)"
                    />
                </template>
            </v-list-item>
        </v-list>
    </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useCallStore } from "@/stores/callstore";
import { useViewStore } from "@/stores/viewstore";
import ContactAddDialog from "./contact/ContactAddDialog.vue";
import ContactImportDialog from "./contact/ContactImportDialog.vue";
import sipclient from "@/utils/sipclient";

const store = useCallStore();
const viewStore = useViewStore();

const ypDialogOpen = ref(false);
const addDialogOpen = ref(false);

const emit = defineEmits(["call-triggered", "message-triggered"]);

const sendMessage = (number: string) => {
    viewStore.openMessageChat(number);
};

const callContact = (number: string) => {
    sipclient.call(number);
    emit("call-triggered");
};
</script>
