// src/utils/sipController.ts
import { SimpleUser } from "sip.js/lib/platform/web";
import type { SimpleUserDelegate } from "sip.js/lib/platform/web";
import { ref } from "vue";
import { CallDirection, CallStatus } from "@/types/call";
import soundGenerator from "./soundgen";
import { useCallStore } from "@/stores/callstore";

export class SipController {
  public status = ref<CallStatus>(CallStatus.DISCONNECTED);
  public dtmfLog = ref<string>("");
  public currentTarget = ref<string>("");

  private user: SimpleUser | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private startTime: number = 0;
  private isInitialized = false;

  public async init(audioElem: HTMLAudioElement, force = false) {
    if (this.isInitialized && !force) return;

    this.audioElement = audioElem;

    const store = useCallStore();
    const config = store.sipSettings;

    const delegate: SimpleUserDelegate = {
      onCallCreated: () => {
        this.status.value = CallStatus.CALLING;
        const store = useCallStore();
        if (store.settings.enableRingbackSound) soundGenerator.startRingback();
      },
      onCallAnswered: () => {
        this.status.value = CallStatus.IN_CALL;
        soundGenerator.stopRingback();
        this.startTime = Date.now();
        this.dtmfLog.value = "";
      },
      onCallHangup: () => {
        this.handleHangup();
      },
      onCallHold: (held) => {
        this.status.value = held ? CallStatus.HELD : CallStatus.IN_CALL;
      },
      onUnregistered: () => {
        console.error("SIP Connect Failed");
        this.status.value = CallStatus.DISCONNECTED;
      },
    };

    if (this.user) {
      try {
        await this.user.disconnect();
      } catch {
        console.log("User disconnected.");
      }
    }

    this.user = new SimpleUser(config.server, {
      delegate,
      media: { remote: { audio: this.audioElement } },
      aor: `sip:${config.username}@${config.host}`,
      userAgentOptions: {
        displayName: config.displayName,
        authorizationPassword: config.password,
        authorizationUsername: config.username,
      },
    });

    try {
      this.status.value = CallStatus.CONNECTING;
      await this.user.connect();
      if (!this.user.isConnected) {
        this.status.value = CallStatus.DISCONNECTED;
        return;
      }
      await this.user.register();
      this.status.value = CallStatus.CONNECTED;
      this.isInitialized = true;
    } catch (e) {
      console.error("SIP Connect Failed", e);
      this.status.value = CallStatus.DISCONNECTED;
    }
  }

  public async call(dest: string) {
    if (!this.user || this.status.value !== CallStatus.CONNECTED || !dest)
      return;

    const store = useCallStore();
    const config = store.sipSettings;

    try {
      this.currentTarget.value = dest;
      this.dtmfLog.value = "";
      await this.user.call(`sip:${dest}@${config.host}`);
    } catch (e) {
      console.error("Call Failed", e);
    }
  }

  public async hangup() {
    if (!this.user) return;
    try {
      await this.user.hangup();
    } catch {
      this.handleHangup();
    }
  }

  public duration() {
    if (!this.startTime) return "00:00";
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const m = Math.floor(duration / 60)
      .toString()
      .padStart(2, "0");
    const s = (duration % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  public async reconnect() {
    if (this.audioElement) {
      await this.init(this.audioElement, true);
    }
  }

  public async sendDTMF(tone: string) {
    const store = useCallStore();
    if (store.settings.enableKeypadSound) {
      soundGenerator.playDTMF(tone);
    }

    if (this.status.value === CallStatus.IN_CALL) {
      this.user?.sendDTMF(tone);
      this.dtmfLog.value += tone;
    }
  }

  public toggleMute(): boolean {
    if (!this.user) return false;
    if (this.user.isMuted()) {
      this.user.unmute();
      return false;
    } else {
      this.user.mute();
      return true;
    }
  }

  public async toggleHold() {
    if (!this.user) return;
    if (this.status.value === CallStatus.HELD) {
      await this.user.unhold();
    } else {
      await this.user.hold();
    }
  }

  private handleHangup() {
    soundGenerator.stopRingback();

    if (
      this.status.value === CallStatus.IN_CALL ||
      this.status.value === CallStatus.HELD
    ) {
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      const store = useCallStore();
      store.addRecord({
        target: this.currentTarget.value || "Unknown",
        duration: duration,
        direction: CallDirection.OUTBOUND,
      });
    }

    this.status.value = CallStatus.CONNECTED;
    this.dtmfLog.value = "";
  }
}

const sipController = new SipController();
export default sipController;
