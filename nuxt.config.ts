// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "vuetify-nuxt-module",
    "@pinia/nuxt",
    "@vite-pwa/nuxt",
    "@nuxtjs/i18n",
  ],
  app: {
    head: {
      viewport:
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Gensokyo Phone",
      short_name: "Phone",
      description: "WebRTC Client for Gensokyo Telephony Network",
      theme_color: "#ffffff",
      display: "standalone",
      icons: [
        {
          src: "web-app-manifest-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "web-app-manifest-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
  },

  i18n: {
    strategy: "no_prefix",
    locales: [
      { code: "en-US", file: "en-US.ts", name: "English" },
      { code: "zh-CN", file: "zh-CN.ts", name: "简体中文" },
    ],
    defaultLocale: "en-US",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "phone_locale",
      redirectOn: "root",
    },
  },

  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: "dark",
      },
      icons: {
        defaultSet: "mdi",
      },
    },
  },

  vite: {
    define: {
      global: "window",
    },
  },
});
