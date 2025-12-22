<template>
    <v-card flat class="h-100 d-flex flex-column">
        <v-card-title class="d-flex align-center py-3 flex-shrink-0">
            <v-icon icon="mdi-history" class="me-2" />
            {{ $t("history.title") }}
            <v-spacer />
            <v-btn
                icon="mdi-delete-sweep"
                variant="text"
                size="small"
                @click="store.clearHistory"
            />
        </v-card-title>

        <v-divider />

        <div class="flex-grow-1 overflow-y-auto" style="min-height: 0">
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
