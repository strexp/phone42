<template>
    <v-dialog v-model="isOpen" max-width="320">
        <template #activator="{ props }">
            <v-list-item v-bind="props" ripple>
                <template #prepend>
                    <v-icon :icon="icon" color="grey" />
                </template>
                <v-list-item-title>{{ title }}</v-list-item-title>
                <v-list-item-subtitle>{{ displayValue }}</v-list-item-subtitle>
            </v-list-item>
        </template>

        <v-confirm-edit
            :model-value="modelValue"
            @update:model-value="onUpdate"
            @save="onSave"
            @cancel="isOpen = false"
        >
            <template #default="{ model: proxyModel, actions }">
                <v-card :title="title">
                    <v-card-text>
                        <v-text-field
                            v-model="proxyModel.value"
                            :type="type"
                            variant="underlined"
                            color="primary"
                            autofocus
                            @keyup.enter="
                                proxyModel.value = proxyModel.value;
                                actions.save();
                            "
                        />
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer />
                        <component :is="actions" />
                    </v-card-actions>
                </v-card>
            </template>
        </v-confirm-edit>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const pp = defineProps<{
    title: string;
    subtitle?: string;
    icon: string;
    modelValue: string;
    type?: string;
}>();

const emit = defineEmits(["update:modelValue", "save"]);

const isOpen = ref(false);

const displayValue = computed(() => {
    if (pp.type === "password" && pp.modelValue) {
        return "********";
    }
    return pp.modelValue || pp.subtitle || "";
});

const onUpdate = (val?: string) => {
    emit("update:modelValue", val);
};

const onSave = () => {
    isOpen.value = false;
    emit("save");
};
</script>
