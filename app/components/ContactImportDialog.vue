<template>
    <v-dialog
        :model-value="modelValue"
        :fullscreen="isMobile"
        :max-width="isMobile ? undefined : 380"
        transition="dialog-bottom-transition"
        scrollable
        @update:model-value="emit('update:modelValue', $event)"
    >
        <v-card
            class="d-flex flex-column bg-background"
            :rounded="isMobile ? 0 : 'lg'"
            :height="isMobile ? '100%' : 750"
            style="max-height: 100vh"
        >
            <v-toolbar color="primary" density="comfortable">
                <v-btn
                    icon="mdi-close"
                    @click="emit('update:modelValue', false)"
                />
                <v-toolbar-title class="text-subtitle-1 font-weight-bold">{{
                    $t("contacts.yp_import")
                }}</v-toolbar-title>
                <v-btn
                    :loading="isRefreshingYp"
                    icon="mdi-refresh"
                    @click="refreshYp"
                />
                <v-btn
                    variant="text"
                    :disabled="selectedYpNumbers.length === 0"
                    @click="importSelectedYp"
                >
                    {{ $t("contacts.import") }}
                    <span v-if="selectedYpNumbers.length > 0"
                        >({{ selectedYpNumbers.length }})</span
                    >
                </v-btn>
            </v-toolbar>

            <div class="pa-3 bg-background" style="z-index: 10">
                <v-text-field
                    v-model="ypSearch"
                    prepend-inner-icon="mdi-magnify"
                    :label="$t('contacts.search')"
                    variant="solo-filled"
                    density="comfortable"
                    hide-details
                    clearable
                />
            </div>

            <v-card-text class="pa-0 flex-grow-1 overflow-y-auto">
                <div
                    v-if="ypLastUpdateText"
                    class="text-caption text-grey text-center"
                >
                    <v-icon icon="mdi-update" size="small" start />
                    {{ ypLastUpdateText }}
                </div>
                <v-list
                    v-model:selected="selectedYpNumbers"
                    select-strategy="classic"
                    class="bg-transparent"
                >
                    <v-list-item
                        v-for="item in filteredYpPhonebook"
                        :key="item.number"
                        :value="item.number"
                        :disabled="isAlreadyImported(item.number)"
                        ripple
                        class="py-2"
                    >
                        <template #prepend="{ isActive }">
                            <v-list-item-action start>
                                <v-checkbox-btn
                                    :model-value="isActive"
                                    :disabled="isAlreadyImported(item.number)"
                                />
                            </v-list-item-action>
                        </template>
                        <v-list-item-title class="font-weight-bold">{{
                            item.name
                        }}</v-list-item-title>
                        <v-list-item-subtitle class="mt-1 d-flex flex-column">
                            <span class="text-body-2 text-medium-emphasis">{{
                                item.number
                            }}</span>
                            <div
                                class="d-flex align-center mt-1"
                                style="gap: 6px"
                            >
                                <v-chip
                                    v-if="item.type"
                                    size="x-small"
                                    color="primary"
                                    variant="tonal"
                                    >{{ item.type }}</v-chip
                                >
                                <v-chip
                                    v-if="item.language"
                                    size="x-small"
                                    color="secondary"
                                    variant="tonal"
                                    >{{ item.language }}</v-chip
                                >
                                <span class="text-caption text-grey ml-1">{{
                                    item.mnt
                                }}</span>
                            </div>
                        </v-list-item-subtitle>
                    </v-list-item>

                    <div
                        v-if="filteredYpPhonebook.length === 0"
                        class="text-center mt-8 text-grey pb-4"
                    >
                        {{
                            ypSearch
                                ? $t("contacts.no_results")
                                : $t("contacts.yp_empty")
                        }}
                    </div>
                </v-list>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDisplay } from "vuetify";
import { useCallStore } from "@/stores/callstore";
import { useViewStore } from "@/stores/viewstore";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(["update:modelValue"]);

const { mobile } = useDisplay();
const isMobile = mobile;

const { t } = useI18n();
const store = useCallStore();
const viewStore = useViewStore();

const selectedYpNumbers = ref<string[]>([]);
const isRefreshingYp = ref(false);
const ypSearch = ref("");

const isAlreadyImported = (number: string) => {
    return !!store.getContactByNumber(number);
};

const ypLastUpdateText = computed(() => {
    if (!store.ypLastUpdate) return "";
    return new Date(store.ypLastUpdate).toLocaleString();
});

const filteredYpPhonebook = computed(() => {
    const q = ypSearch.value?.toLowerCase() || "";
    if (!q) return store.ypPhonebook;

    return store.ypPhonebook.filter((item) => {
        return (
            (item.name || "").toLowerCase().includes(q) ||
            (item.number || "").toLowerCase().includes(q) ||
            (item.mnt || "").toLowerCase().includes(q) ||
            (item.type || "").toLowerCase().includes(q) ||
            (item.language || "").toLowerCase().includes(q)
        );
    });
});

const refreshYp = async () => {
    isRefreshingYp.value = true;
    const success = await store.updateYpPhonebook();
    if (success) {
        viewStore.showToast(t("contacts.yp_update_success"));
    }
    isRefreshingYp.value = false;
};

const importSelectedYp = () => {
    for (const num of selectedYpNumbers.value) {
        const item = store.ypPhonebook.find((x) => x.number === num);
        if (item && !isAlreadyImported(num)) {
            store.addContact(item.name, item.number);
        }
    }
    selectedYpNumbers.value = [];
    ypSearch.value = "";
    emit("update:modelValue", false);
    viewStore.showToast(t("contacts.import_success"));
};

watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            selectedYpNumbers.value = [];
            ypSearch.value = "";
        }
    },
);
</script>
