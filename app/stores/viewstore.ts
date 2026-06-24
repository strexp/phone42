import { defineStore } from "pinia";
import { ref } from "vue";

export const useViewStore = defineStore("view", () => {
  const currentWindow = ref("phone");
  const activeChatTarget = ref("");
  const isChatOpen = ref(false);

  const snackbar = ref(false);
  const snackbarText = ref("");

  const showToast = (text: string) => {
    snackbarText.value = text;
    snackbar.value = true;
  };

  const openMessageChat = (target: string) => {
    activeChatTarget.value = target;
    isChatOpen.value = true;
    currentWindow.value = "messages";
  };

  const closeMessageChat = () => {
    isChatOpen.value = false;
    activeChatTarget.value = "";
  };

  return {
    currentWindow,
    activeChatTarget,
    isChatOpen,
    snackbar,
    snackbarText,
    showToast,
    openMessageChat,
    closeMessageChat,
  };
});
