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
  public networkQuality = ref<number>(4);

  private user: SimpleUser | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private startTime: number = 0;
  private isInitialized = false;
  private statsInterval: number | null = null;

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
        this.startStats();
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
    this.stopStats();

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

  private startStats() {
    this.stopStats();
    this.networkQuality.value = 4;
    this.statsInterval = window.setInterval(async () => {
      if (!this.user || !this.user.session) return;
      const session = this.user.session as any;
      const pc: RTCPeerConnection =
        session.sessionDescriptionHandler?.peerConnection;
      if (!pc) return;

      try {
        const stats = await pc.getStats();
        let rtt = 0,
          jitter = 0,
          packetsLost = 0,
          packetsReceived = 0;

        stats.forEach((report) => {
          if (
            report.type === "candidate-pair" &&
            report.state === "succeeded"
          ) {
            rtt = report.currentRoundTripTime || report.roundTripTime || 0;
          }
          if (report.type === "inbound-rtp" && report.kind === "audio") {
            jitter = report.jitter || 0;
            packetsLost = report.packetsLost || 0;
            packetsReceived = report.packetsReceived || 0;
          }
        });

        const totalPackets = packetsLost + packetsReceived;
        const fractionLost = totalPackets > 0 ? packetsLost / totalPackets : 0;

        // A simply MOS Calculation
        const effectiveLatency = rtt * 1000 + jitter * 1000 * 2 + 10;
        let rFactor = 93.2;

        if (effectiveLatency < 160) rFactor -= effectiveLatency / 40;
        else rFactor -= (effectiveLatency - 120) / 10;
        rFactor -= fractionLost * 100 * 2.5;

        let mos =
          1 +
          0.035 * rFactor +
          0.000007 * rFactor * (rFactor - 60) * (100 - rFactor);

        console.log(`MOS Calcuated: ${mos}`);

        if (mos >= 4.0) this.networkQuality.value = 4;
        else if (mos >= 3.0) this.networkQuality.value = 3;
        else if (mos >= 2.0) this.networkQuality.value = 2;
        else if (mos >= 1.0) this.networkQuality.value = 1;
        else this.networkQuality.value = 0;
      } catch (e) {
        // 忽略错误
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
    } catch (e) {
      console.error("Message Failed", e);
    }
  }
}

const sipController = new SipController();
export default sipController;
