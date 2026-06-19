import { defineStore } from "pinia";
import { ref } from "vue";

export const useViewStore = defineStore("view", () => {
  const currentWindow = ref("phone");

  return {
    currentWindow,
  };
});
