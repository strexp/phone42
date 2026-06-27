// src/store/call.ts
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { CallRecord } from "@/types/call";
import type { Contact, YpContact } from "@/types/contact";
import type { AppSettings } from "@/types/app";
import { PRESET_CONTACTS, SIP_CONFIG } from "@/config";
import { AppLang } from "~/types/lang";

export const useCallStore = defineStore("call", () => {
  const history = ref<CallRecord[]>([]);
  const contacts = ref<Contact[]>([]);
  const settings = ref<AppSettings>({
    enableKeypadSound: true,
    enableRingbackSound: true,
    autoUpdatePhonebook: true,
  });

  const ypPhonebook = ref<YpContact[]>([]);
  const ypLastUpdate = ref<number>(0);

  const locale = ref(AppLang.en);
  if (import.meta.client) {
    switch (localStorage.getItem("phone_locale")) {
      case AppLang.zh:
        locale.value = AppLang.zh;
        break;
      case AppLang.en:
        locale.value = AppLang.en;
        break;
    }
  }

  const sipSettings = ref({
    server: SIP_CONFIG.SERVER_URL,
    host: SIP_CONFIG.SERVER_HOST,
    username: SIP_CONFIG.USERNAME,
    password: SIP_CONFIG.PASSWORD,
    displayName: SIP_CONFIG.DISPLAY_NAME,
  });

  const initContacts = () => {
    const presets: Contact[] = PRESET_CONTACTS.map((c, index) => ({
      id: `preset-${index}`,
      ...c,
    }));
    contacts.value = presets;
  };

  const addRecord = (record: Omit<CallRecord, "id" | "timestamp">) => {
    history.value.unshift({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...record,
    });
    if (history.value.length > 50) history.value.pop();
  };

  const clearHistory = () => {
    history.value = [];
  };

  const addContact = (name: string, number: string) => {
    contacts.value.push({
      id: crypto.randomUUID(),
      name,
      number,
      isPreset: false,
    });
  };

  const removeContact = (id: string) => {
    contacts.value = contacts.value.filter((c) => c.id !== id || c.isPreset);
  };

  const getContactByNumber = (num: string) => {
    return contacts.value.find((c) => c.number === num);
  };

  const updateYpPhonebook = async () => {
    try {
      const res = await fetch("https://yp.dn42/api/public/phonebook");
      if (res.ok) {
        const data = await res.json();
        if (data && data.items) {
          ypPhonebook.value = data.items;
          ypLastUpdate.value = Date.now();
          return true;
        }
      }
    } catch (e) {
      console.error("Failed to fetch yp.dn42 phonebook", e);
    }
    return false;
  };

  const STORAGE_KEY = "gtn_call_data";

  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        history.value = data.history || [];
        settings.value = { ...settings.value, ...data.settings };
        if (typeof settings.value.autoUpdatePhonebook === "undefined") {
          settings.value.autoUpdatePhonebook = true;
        }

        if (data.sipSettings) {
          sipSettings.value = { ...sipSettings.value, ...data.sipSettings };
        }

        ypPhonebook.value = data.ypPhonebook || [];
        ypLastUpdate.value = data.ypLastUpdate || 0;

        const savedContacts = data.contacts || [];
        const presets: Contact[] = PRESET_CONTACTS.map((c, index) => ({
          id: `preset-${index}`,
          ...c,
        }));

        contacts.value = [...presets, ...savedContacts];
      } catch (e) {
        console.error("Failed to load store", e);
        initContacts();
      }
    } else {
      initContacts();
    }
  }

  watch(
    [history, settings, contacts, sipSettings, ypPhonebook, ypLastUpdate],
    () => {
      if (import.meta.client) {
        const userContacts = contacts.value.filter((c) => !c.isPreset);
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            history: history.value,
            settings: settings.value,
            contacts: userContacts,
            sipSettings: sipSettings.value,
            ypPhonebook: ypPhonebook.value,
            ypLastUpdate: ypLastUpdate.value,
          }),
        );
      }
    },
    { deep: true },
  );

  return {
    locale,
    history,
    settings,
    contacts,
    sipSettings,
    ypPhonebook,
    ypLastUpdate,
    addRecord,
    clearHistory,
    addContact,
    removeContact,
    getContactByNumber,
    updateYpPhonebook,
  };
});
