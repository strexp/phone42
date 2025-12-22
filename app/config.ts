// src/assets/config.ts
export const SIP_CONFIG = {
  SERVER_URL: "wss://pbx.gensokyo.dn42:8089/ws",
  DISPLAY_NAME: "Gensokyo User",
  USERNAME: "webdemo",
  PASSWORD: "webdemo",
  SERVER_HOST: "pbx.gensokyo.dn42",
};

export const BRANDING = {
  NAME: "Gensokyo Telephony Network",
  SHORT_NAME: "Gensokyo",
  COLOR: "deep-purple-accent-3",
};

export const PRESET_CONTACTS = [
  {
    name: "Gensokyo Echo Test",
    number: "424008033001",
    isPreset: true,
  },
  {
    name: "Jerry Network",
    number: "424036183618",
    isPreset: true,
  },
];

export const DTMF_FREQUENCIES: Record<string, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477],
};
