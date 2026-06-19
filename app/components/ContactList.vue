<template>
    <v-card flat class="h-100 d-flex flex-column">
        <v-card-title class="d-flex align-center py-3">
            <v-icon start icon="mdi-account-group" class="me-2" />
            {{ $t("contacts.title") }}
            <v-spacer />
            <v-dialog v-model="dialog" max-width="300">
                <template #activator="{ props }">
                    <v-btn
                        icon="mdi-account-plus"
                        variant="text"
                        v-bind="props"
                    />
                </template>
                <v-card :title="$t('contacts.add')">
                    <v-card-text>
                        <v-text-field
                            v-model="newContact.name"
                            :label="$t('contacts.name')"
                            variant="underlined"
                        />
                        <v-text-field
                            v-model="newContact.number"
                            :label="$t('contacts.number')"
                            variant="underlined"
                            :error-messages="
                                isDuplicate
                                    ? [
                                          $t('contacts.duplicate') ||
                                              'Duplicate number',
                                      ]
                                    : []
                            "
                        />
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn
                            :text="$t('contacts.cancel')"
                            @click="dialog = false"
                        />
                        <v-btn
                            color="primary"
                            :text="$t('contacts.save')"
                            :disabled="
                                !newContact.name ||
                                !newContact.number ||
                                isDuplicate
                            "
                            @click="saveContact"
                        />
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-card-title>

        <v-divider />

        <v-list class="flex-grow-1 overflow-y-auto">
            <v-list-item
                v-for="contact in store.contacts"
                :key="contact.id"
                ripple
            >
                <template #prepend>
                    <v-avatar color="primary" variant="outlined">
                        <v-img v-if="contact.avatar" :src="contact.avatar" />
                        <span v-else class="text-title-large">{{
                            contact.name[0]?.toUpperCase()
                        }}</span>
                    </v-avatar>
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
import { ref, reactive } from "vue";
import { useCallStore } from "@/stores/callstore";
import sipclient from "@/utils/sipclient";

const store = useCallStore();
const dialog = ref(false);
const newContact = reactive({ name: "", number: "" });

const emit = defineEmits(["call-triggered"]);

const isDuplicate = computed(() => {
    return !!store.getContactByNumber(newContact.number);
});

const saveContact = () => {
    if (newContact.name && newContact.number) {
        store.addContact(newContact.name, newContact.number);
        newContact.name = "";
        newContact.number = "";
        dialog.value = false;
    }
};

const callContact = (number: string) => {
    sipclient.call(number);
    emit("call-triggered");
};
</script>
