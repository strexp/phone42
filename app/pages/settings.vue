<template>
    <v-container class="pa-0 mt-2 h-100" style="overflow-y: auto">
        <v-toolbar color="transparent" density="compact">
            <v-btn icon="mdi-arrow-left" to="/" />
            <v-toolbar-title>{{ $t("settings.title") }}</v-toolbar-title>
        </v-toolbar>

        <v-list lines="two" class="bg-transparent">
            <v-list-subheader class="text-primary font-weight-bold">
                {{ $t("settings.language") }}
            </v-list-subheader>

            <v-dialog v-model="dialogs.lang" max-width="300">
                <template #activator="{ props }">
                    <v-list-item v-bind="props" ripple>
                        <template #prepend>
                            <v-icon icon="mdi-translate" color="grey" />
                        </template>
                        <v-list-item-title>{{
                            $t("settings.language_select")
                        }}</v-list-item-title>
                        <v-list-item-subtitle>{{
                            currentLocaleName
                        }}</v-list-item-subtitle>
                    </v-list-item>
                </template>
                <v-card>
                    <v-card-title>{{
                        $t("settings.language_select")
                    }}</v-card-title>
                    <v-card-text>
                        <v-radio-group
                            v-model="store.locale"
                            @update:model-value="changeLocale"
                        >
                            <v-radio
                                v-for="lang in localeOptions"
                                :key="lang.value"
                                :label="lang.title"
                                :value="lang.value"
                            />
                        </v-radio-group>
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn
                            color="primary"
                            text="OK"
                            @click="dialogs.lang = false"
                        />
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <v-divider class="my-3" />

            <v-list-subheader class="text-primary font-weight-bold">
                {{ $t("settings.sip_account") }}
            </v-list-subheader>

            <SettingItem
                v-model="store.sipSettings.username"
                :title="$t('settings.username')"
                :subtitle="$t('settings.username_hint')"
                icon="mdi-account"
                @save="handleSave"
            />

            <SettingItem
                v-model="store.sipSettings.password"
                :title="$t('settings.password')"
                subtitle="********"
                icon="mdi-key"
                type="password"
                @save="handleSave"
            />

            <SettingItem
                v-model="store.sipSettings.server"
                :title="$t('settings.server')"
                :subtitle="$t('settings.server_hint')"
                icon="mdi-server"
                @save="handleSave"
            />

            <SettingItem
                v-model="store.sipSettings.host"
                :title="$t('settings.domain')"
                :subtitle="$t('settings.domain_hint')"
                icon="mdi-domain"
                @save="handleSave"
            />

            <v-divider class="my-3" />

            <v-list-subheader class="text-primary font-weight-bold">
                {{ $t("settings.sound") }}
            </v-list-subheader>

            <v-list-item
                ripple
                @click="
                    store.settings.enableKeypadSound =
                        !store.settings.enableKeypadSound
                "
            >
                <template #prepend>
                    <v-icon icon="mdi-dialpad" color="grey" />
                </template>
                <v-list-item-title>{{
                    $t("settings.keypad_tone")
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                    $t("settings.keypad_tone_hint")
                }}</v-list-item-subtitle>
                <template #append>
                    <v-switch
                        v-model="store.settings.enableKeypadSound"
                        class="mr-2"
                        color="primary"
                        hide-details
                        density="compact"
                        @click.stop
                    />
                </template>
            </v-list-item>

            <v-list-item
                ripple
                @click="
                    store.settings.enableRingbackSound =
                        !store.settings.enableRingbackSound
                "
            >
                <template #prepend>
                    <v-icon icon="mdi-music-note" color="grey" />
                </template>
                <v-list-item-title>{{
                    $t("settings.ringback_tone")
                }}</v-list-item-title>
                <v-list-item-subtitle>{{
                    $t("settings.ringback_tone_hint")
                }}</v-list-item-subtitle>
                <template #append>
                    <v-switch
                        v-model="store.settings.enableRingbackSound"
                        class="mr-2"
                        color="primary"
                        hide-details
                        density="compact"
                        @click.stop
                    />
                </template>
            </v-list-item>

            <v-divider class="my-3" />

            <v-list-item>
                <v-list-item-title class="text-caption text-grey text-center">
                    Gensokyo Telephony Network<br />
                    v1.0.0
                </v-list-item-title>
            </v-list-item>
        </v-list>

        <v-snackbar v-model="showReconnectMsg" timeout="2000" color="success">
            Settings saved, reconnecting...
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { useCallStore } from "@/stores/callstore";
import sipController from "@/utils/sipclient";
import SettingItem from "@/components/SettingItem.vue";
import { AppLang } from "~/types/lang";

const { setLocale } = useI18n();
const store = useCallStore();
const showReconnectMsg = ref(false);

const dialogs = reactive({
    lang: false,
});

const localeOptions = [
    { title: "English", value: AppLang.en },
    { title: "简体中文", value: AppLang.zh },
];

const currentLocaleName = computed(
    () =>
        localeOptions.find((o) => o.value === store.locale)?.title ||
        store.locale,
);

const changeLocale = (val: AppLang | null) => {
    if (val) setLocale(val);
};

const handleSave = async () => {
    await sipController.reconnect();
    showReconnectMsg.value = true;
};
</script>
