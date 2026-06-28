// src/utils/sipController.ts
import { ref } from "vue";
import { CallDirection, CallStatus } from "@/types/call";
import soundGenerator from "./soundgen";
import { useCallStore } from "@/stores/callstore";
import { useMessageStore } from "@/stores/messagestore";
import { useViewStore } from "@/stores/viewstore";
import { PhoneUser, type PhoneUserDelegate } from "./phoneuser";
import type { SessionDescriptionHandler } from "sip.js/lib/platform/web";
import { getCallStats } from "./webrtcstats";

export class SipController {
  public status = ref<CallStatus>(CallStatus.DISCONNECTED);
  public dtmfLog = ref<string>("");
  public currentTarget = ref<string>("");
  public networkQuality = ref<number>(4);
  public currentCodec = ref<string>("");
  public hasMicrophone = ref<boolean>(true);

  private user: PhoneUser | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private startTime: number = 0;
  private isInitialized = false;
  private statsInterval: number | null = null;

  private isOutboundCall: boolean = false;

  private reconnectTimer: number | null = null;
  private reconnectAttempt: number = 0;
  private intentionalDisconnect = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("pagehide", () => this.cleanupBeforeUnload());
      window.addEventListener("beforeunload", () => this.cleanupBeforeUnload());
    }
  }

  private cleanupBeforeUnload() {
    this.intentionalDisconnect = true;
    if (this.user) {
      this.user.disconnect().catch(() => {});
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const baseDelay = 3000;
    let delay = baseDelay * Math.pow(2, this.reconnectAttempt);
    if (delay > 30000) delay = 30000;

    console.log(`Scheduling reconnect in ${delay}ms`);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempt++;
      if (this.audioElement) {
        this.init(this.audioElement, true).catch((e) => {
          console.error("Reconnect attempt failed", e);
        });
      }
    }, delay);
  }

  private clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
  }

  public async init(audioElem: HTMLAudioElement, force = false) {
    if (this.isInitialized && !force) return;

    this.audioElement = audioElem;

    const store = useCallStore();
    const config = store.sipSettings;

    const delegate: PhoneUserDelegate = {
      onMessageReceived: (body, from) => {
        const msgStore = useMessageStore();
        const callStore = useCallStore();
        msgStore.addMessage({
          target: from,
          body: body,
          direction: "inbound",
        });
        const viewStore = useViewStore();
        if (
          viewStore.currentWindow !== "messages" ||
          !viewStore.isChatOpen ||
          viewStore.activeChatTarget !== from
        ) {
          const contact = callStore.getContactByNumber(from);
          const name = contact ? contact.name : from;
          viewStore.showToast(`${name}: ${body}`);
        } else {
          msgStore.markAsRead(from);
        }
      },
      onCallReceived: (remoteUser: string) => {
        this.currentTarget.value = remoteUser;
        this.status.value = CallStatus.CALLING;
        this.isOutboundCall = false;
        this.hasMicrophone.value = this.user?.hasMicrophone ?? true;

        const callStore = useCallStore();
        if (callStore.settings.enableRingbackSound)
          soundGenerator.startRingback();

        if (this.user) {
          this.user
            .answer()
            .catch((e) => console.error("Auto answer failed", e));
        }
      },
      onCallCreated: () => {
        this.status.value = CallStatus.CALLING;
        this.isOutboundCall = true;
        const callStore = useCallStore();
        if (callStore.settings.enableRingbackSound)
          soundGenerator.startRingback();
      },
      onCallAnswered: () => {
        this.status.value = CallStatus.IN_CALL;
        this.hasMicrophone.value = this.user?.hasMicrophone ?? true;
        soundGenerator.stopRingback();
        this.startTime = Date.now();
        this.dtmfLog.value = "";
        this.startStats();
      },
      onCallHangup: () => {
        this.handleHangup();
      },
      onCallHold: (held) => {
        this.status.value = held ? CallStatus.HELD : CallStatus.IN_CALL;
      },
      onUnregistered: () => {
        console.error("SIP Unregistered");
        this.status.value = CallStatus.DISCONNECTED;
        if (!this.intentionalDisconnect) this.scheduleReconnect();
      },
      onServerDisconnect: () => {
        this.status.value = CallStatus.DISCONNECTED;
        if (!this.intentionalDisconnect) this.scheduleReconnect();
      },
    };

    if (this.user) {
      this.intentionalDisconnect = true;
      try {
        await this.user.unregister();
        await this.user.disconnect();
      } catch {
        console.log("User disconnected.");
      }
      this.intentionalDisconnect = false;
    }

    this.user = new PhoneUser({
      server: config.server,
      aor: `sip:${config.username}@${config.host}`,
      credentials: {
        username: config.username,
        password: config.password,
      },
      displayName: config.displayName,
      media: { remote: { audio: this.audioElement } },
      delegate,
    });

    try {
      this.status.value = CallStatus.CONNECTING;
      await this.user.connect();
      await this.user.register();
      this.status.value = CallStatus.CONNECTED;
      this.isInitialized = true;
      this.clearReconnect();
    } catch (e) {
      console.error("SIP Connect Failed", e);
      this.status.value = CallStatus.DISCONNECTED;
      this.scheduleReconnect();
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
      this.hasMicrophone.value = this.user.hasMicrophone;
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
    this.clearReconnect();
    if (this.audioElement) {
      await this.init(this.audioElement, true);
    }
  }

  public async sendDTMF(tone: string) {
    const store = useCallStore();
    if (store.settings.enableKeypadSound) {
      soundGenerator.playDTMF(tone);
    }

    if (this.status.value === CallStatus.IN_CALL && this.user) {
      this.user.sendDTMF(tone).catch((e) => console.error("DTMF Failed", e));
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
    if (this.user.isHeld()) {
      await this.user.unhold();
    } else {
      await this.user.hold();
    }
  }

  private handleHangup() {
    soundGenerator.stopRingback();
    this.stopStats();
    this.currentCodec.value = "";

    if (
      this.status.value === CallStatus.IN_CALL ||
      this.status.value === CallStatus.HELD
    ) {
      const duration = Math.round((Date.now() - this.startTime) / 1000);
      const store = useCallStore();
      store.addRecord({
        target: this.currentTarget.value || "Unknown",
        duration: duration,
        direction: this.isOutboundCall
          ? CallDirection.OUTBOUND
          : CallDirection.INBOUND,
      });
    }

    this.status.value = CallStatus.CONNECTED;
    this.dtmfLog.value = "";
  }

  private startStats() {
    this.stopStats();
    this.networkQuality.value = 4;
    this.statsInterval = window.setInterval(async () => {
      if (!this.user || !this.user.session) return;
      const sdh = this.user.session
        .sessionDescriptionHandler as SessionDescriptionHandler;
      if (!sdh) return;
      const pc: RTCPeerConnection | undefined = sdh.peerConnection;
      if (!pc) return;

      const stats = await getCallStats(pc);
      if (stats) {
        this.networkQuality.value = stats.networkQuality;
        if (stats.currentCodec) {
          this.currentCodec.value = stats.currentCodec;
        }
      }
    }, 2000);
  }

  private stopStats() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
    this.networkQuality.value = 4;
  }

  public async sendMessage(dest: string, body: string) {
    if (!this.user || this.status.value !== CallStatus.CONNECTED || !dest)
      return;
    const store = useCallStore();
    const config = store.sipSettings;
    try {
      await this.user.message(`sip:${dest}@${config.host}`, body);
      const msgStore = useMessageStore();
      msgStore.addMessage({
        target: dest,
        body: body,
        direction: "outbound",
      });
    } catch (e) {
      console.error("Message Failed", e);
    }
  }
}

const sipController = new SipController();
export default sipController;
