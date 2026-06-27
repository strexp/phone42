<template>
    <v-dialog
        :model-value="modelValue"
        max-width="300"
        @update:model-value="emit('update:modelValue', $event)"
    >
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
                            ? [$t('contacts.duplicate') || 'Duplicate number']
                            : []
                    "
                />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn
                    :text="$t('contacts.cancel')"
                    @click="emit('update:modelValue', false)"
                />
                <v-btn
                    color="primary"
                    :text="$t('contacts.save')"
                    :disabled="
                        !newContact.name || !newContact.number || isDuplicate
                    "
                    @click="saveContact"
                />
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import { useCallStore } from "@/stores/callstore";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(["update:modelValue"]);

const store = useCallStore();
const newContact = reactive({ name: "", number: "" });

const isDuplicate = computed(() => {
    return !!store.getContactByNumber(newContact.number);
});

const saveContact = () => {
    if (newContact.name && newContact.number) {
        store.addContact(newContact.name, newContact.number);
        emit("update:modelValue", false);
    }
};

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            newContact.name = "";
            newContact.number = "";
        }
    },
);
</script>
