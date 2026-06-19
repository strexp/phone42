<template>
    <v-card flat class="h-100 d-flex flex-column">
        <v-card-title class="d-flex align-center py-3">
            <v-icon start icon="mdi-history" class="me-2" />
            {{ $t("history.title") }}
            <v-spacer />
            <v-dialog v-model="confirmDelete" max-width="300">
                <template #activator="{ props }">
                    <v-btn
                        icon="mdi-delete-sweep"
                        variant="text"
                        v-bind="props"
                    />
                </template>
                <v-card
                    :title="
                        $t('history.clear_confirm_title') || 'Clear History'
                    "
                >
                    <v-card-text>{{
                        $t("history.clear_confirm_text") ||
                        "Are you sure you want to clear all history?"
                    }}</v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn
                            :text="$t('contacts.cancel') || 'Cancel'"
                            @click="confirmDelete = false"
                        />
                        <v-btn
                            color="error"
                            :text="$t('history.clear') || 'Clear'"
                            @click="doClearHistory"
                        />
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-card-title>

        <v-divider />

        <div
            class="flex-grow-1 overflow-y-auto"
            style="min-height: 0; max-height: 100%"
        >
            <v-list lines="two">
                <v-list-item v-if="store.history.length === 0">
                    <v-list-item-title class="text-center text-grey mt-4">{{
                        $t("history.no_records")
                    }}</v-list-item-title>
                </v-list-item>

                <v-list-item
                    v-for="item in store.history"
                    :key="item.id"
                    @click="callContact(item.target)"
                >
                    <template #prepend>
                        <v-avatar color="primary" variant="tonal">
                            <v-icon>mdi-phone-outgoing</v-icon>
                        </v-avatar>
                    </template>

                    <v-list-item-title>
                        {{
                            store.getContactByNumber(item.target)?.name ||
                            item.target
                        }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                        {{ formatDate(item.timestamp) }}
                    </v-list-item-subtitle>

                    <template #append>
                        <div class="text-caption font-weight-bold">
                            {{ formatDuration(item.duration) }}
                        </div>
                    </template>
                </v-list-item>
            </v-list>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import { useCallStore } from "@/stores/callstore";
import sipclient from "@/utils/sipclient";
const store = useCallStore();
const emit = defineEmits(["call-triggered"]);

const confirmDelete = ref(false);

const doClearHistory = () => {
    store.clearHistory();
    confirmDelete.value = false;
};
const formatDate = (ts: number) => new Date(ts).toLocaleString();
const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
};

const callContact = (number: string) => {
    sipclient.call(number);
    emit("call-triggered");
};
</script>
