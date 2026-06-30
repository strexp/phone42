import sipclient from "@/utils/sipclient";
import { useCallStore } from "@/stores/callstore";

export interface USSDResult {
    isUSSD: boolean;
    title?: string;
    message?: string;
    clearInput?: boolean;
}

export function checkUSSD(input: string): USSDResult {
    const store = useCallStore();

    switch (input) {
        // aor
        case "*#06#":
            return {
                isUSSD: true,
                title: "SIP Identity",
                message: `AOR:\nsip:${store.sipSettings.username}@${store.sipSettings.host}\n\nDisplay Name:\n${store.sipSettings.displayName}\n\nWebSocket Server:\n${store.sipSettings.server}`,
                clearInput: true,
            };
            
        // environment status
        case "*#0*#": {
            const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
            const micStatus = sipclient.hasMicrophone.value ? "Granted / Available" : "Denied / Unavailable";
            return {
                isUSSD: true,
                title: "Environment Status",
                message: `Microphone: ${micStatus}\nKeypad Tone: ${store.settings.enableKeypadSound ? "ON" : "OFF"}\nRingback Tone: ${store.settings.enableRingbackSound ? "ON" : "OFF"}\n\nUser Agent:\n${ua}`,
                clearInput: true,
            };
        }

        // connection status
        case "*#*#4636#*#*": {
            const syncTime = store.ypLastUpdate 
                ? new Date(store.ypLastUpdate).toLocaleString() 
                : "Never synced";
                
            return {
                isUSSD: true,
                title: "Connection Stats",
                message: `SIP Status: ${sipclient.status.value.toUpperCase()}\nNetwork Quality: ${sipclient.networkQuality.value}/4\nCurrent Codec: ${sipclient.currentCodec.value || "N/A"}\n\nYP.DN42 Sync:\nRecords: ${store.ypPhonebook.length}\nLast Sync:\n${syncTime}`,
                clearInput: true,
            };
        }

        // software status
        case "*#1234#":
            return {
                isUSSD: true,
                title: "Software Status",
                message: `GTN WebPhone Core\nVersion: v1.2.0\nLocale: ${store.locale}\nT9 Dialer: ${store.settings.enableT9Dialer ? "Enabled" : "Disabled"}\n\nPlatform:\n${typeof navigator !== 'undefined' ? navigator.platform : 'Unknown'}`,
                clearInput: true,
            };

        // 42
        case "*#42#":
            return {
                isUSSD: true,
                title: "42",
                message: "The answer to life, the universe, and everything.",
                clearInput: true,
            };

        default:
            return { isUSSD: false };
    }
}
