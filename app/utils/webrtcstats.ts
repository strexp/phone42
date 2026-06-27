export async function getCallStats(pc: RTCPeerConnection) {
  try {
    const stats = await pc.getStats();
    let rtt = 0,
      jitter = 0,
      packetsLost = 0,
      packetsReceived = 0;

    let codecId = "";

    stats.forEach((report) => {
      if (report.type === "candidate-pair" && report.state === "succeeded") {
        rtt = report.currentRoundTripTime || report.roundTripTime || 0;
      }
      if (report.type === "inbound-rtp" && report.kind === "audio") {
        jitter = report.jitter || 0;
        packetsLost = report.packetsLost || 0;
        packetsReceived = report.packetsReceived || 0;
        codecId = report.codecId;
      }
    });

    let currentCodec = "";
    if (codecId) {
      const codecStat = stats.get(codecId);
      if (codecStat && codecStat.mimeType) {
        const mimeStr = codecStat.mimeType.split("/")[1] || codecStat.mimeType;
        currentCodec = mimeStr.toUpperCase();
      }
    }

    const totalPackets = packetsLost + packetsReceived;
    const fractionLost = totalPackets > 0 ? packetsLost / totalPackets : 0;

    // A simple MOS Calculation
    const effectiveLatency = rtt * 1000 + jitter * 1000 * 2 + 10;
    let rFactor = 93.2;

    if (effectiveLatency < 160) rFactor -= effectiveLatency / 40;
    else rFactor -= (effectiveLatency - 120) / 10;
    rFactor -= fractionLost * 100 * 2.5;

    const mos =
      1 +
      0.035 * rFactor +
      0.000007 * rFactor * (rFactor - 60) * (100 - rFactor);

    let networkQuality = 4;
    if (mos >= 4.0) networkQuality = 4;
    else if (mos >= 3.0) networkQuality = 3;
    else if (mos >= 2.0) networkQuality = 2;
    else if (mos >= 1.0) networkQuality = 1;
    else networkQuality = 0;

    return { networkQuality, currentCodec, mos };
  } catch (e) {
    console.error("Failed to get call stats", e);
    return null;
  }
}
