import { onMounted, onUnmounted, type Ref } from "vue";
import { useViewStore } from "@/stores/viewstore";
import { useCallStore } from "@/stores/callstore";
import soundGenerator from "@/utils/soundgen";

export function useDialerKeyboard(options: {
  isInCall: Ref<boolean>;
  isCalling: Ref<boolean>;
  showDialpad: Ref<boolean>;
  onKeyPress: (key: string) => void;
  onLongPress: (key: string) => void;
  onBackspaceStart: () => void;
  onBackspaceEnd: () => void;
  onCall: () => void;
}) {
  const viewStore = useViewStore();
  const store = useCallStore();
  let keyPressTimer: number | null = null;
  let isKeyLongPress = false;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (viewStore.currentWindow !== "phone") return;

    const validKeys = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "*",
      "#",
      "+",
    ];
    const conditionInCall =
      (options.isInCall.value || options.isCalling.value) &&
      options.showDialpad.value;
    const conditionNotInCall = !(
      options.isInCall.value || options.isCalling.value
    );

    if (conditionInCall || conditionNotInCall) {
      if (validKeys.includes(e.key)) {
        if (!e.repeat) {
          isKeyLongPress = false;

          if (store.settings.enableKeypadSound) {
            soundGenerator.startDTMF(e.key);
          }

          if (e.key === "0" && conditionNotInCall) {
            keyPressTimer = window.setTimeout(() => {
              isKeyLongPress = true;
              options.onLongPress("+");
            }, 600);
          }
        }
        e.preventDefault();
      } else if (conditionNotInCall && e.key === "Backspace") {
        if (!e.repeat) {
          options.onBackspaceStart();
        }
        e.preventDefault();
      } else if (conditionNotInCall && e.key === "Enter") {
        if (!e.repeat) {
          options.onCall();
        }
        e.preventDefault();
      }
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (viewStore.currentWindow !== "phone") return;

    const validKeys = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "*",
      "#",
      "+",
    ];
    const conditionA =
      (options.isInCall.value || options.isCalling.value) &&
      options.showDialpad.value;
    const conditionB = !(options.isInCall.value || options.isCalling.value);

    if (conditionA || conditionB) {
      if (validKeys.includes(e.key)) {
        clearTimeout(keyPressTimer as number);

        if (store.settings.enableKeypadSound) {
          soundGenerator.stopDTMF();
        }

        if (!isKeyLongPress) {
          options.onKeyPress(e.key);
        }
        e.preventDefault();
      } else if (conditionB && e.key === "Backspace") {
        options.onBackspaceEnd();
        e.preventDefault();
      }
    }
  };

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
  });
}
