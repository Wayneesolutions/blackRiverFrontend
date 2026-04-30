import React, { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, PhoneIncoming, Mic, MicOff } from "lucide-react";
import { socketService } from "../../services/socketService";

export const GlobalCallHandler: React.FC = () => {
  const [callState, setCallState] = useState<"idle" | "incoming" | "connected" | "declined">("idle");
  const [incomingCall, setIncomingCall] = useState<{ from: string; offer: any } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const peerSocketRef = useRef<string | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playRingTone = () => {
    const beep = () => {
      try {
        const ctx = new AudioContext();
        [[440, 0, 0.35], [480, 0.4, 0.35]].forEach(([freq, delay, dur]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain); gain.connect(ctx.destination);
          osc.frequency.value = freq as number;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0, ctx.currentTime + (delay as number));
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + (delay as number) + 0.02);
          gain.gain.setValueAtTime(0.25, ctx.currentTime + (delay as number) + (dur as number) - 0.02);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + (delay as number) + (dur as number));
          osc.start(ctx.currentTime + (delay as number));
          osc.stop(ctx.currentTime + (delay as number) + (dur as number));
        });
      } catch {}
    };
    beep();
    ringIntervalRef.current = setInterval(beep, 3000);
  };

  const stopRingTone = () => {
    if (ringIntervalRef.current) { clearInterval(ringIntervalRef.current); ringIntervalRef.current = null; }
  };

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(prev => !prev); }
  };

  const endCall = (notifyPeer = true) => {
    stopRingTone();
    if (notifyPeer && peerSocketRef.current) {
      socketService.getSocket()?.emit("call-end", { to: peerSocketRef.current });
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    peerSocketRef.current = null;
    setIsMuted(false);
    setCallState("idle");
    setIncomingCall(null);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    stopRingTone();
    peerSocketRef.current = incomingCall.from;
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc.onicecandidate = (e) => {
        if (e.candidate) socketService.sendIceCandidate({ to: incomingCall.from, candidate: e.candidate });
      };
      const playRemoteStream = (stream: MediaStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
      };
      pc.ontrack = (e) => { if (e.streams?.[0]) playRemoteStream(e.streams[0]); };
      (pc as any).onaddstream = (e: any) => { if (e.stream) playRemoteStream(e.stream); };
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      pcRef.current = pc;
      socketService.answerCall({ to: incomingCall.from, answer });
      setCallState("connected");
    } catch (err) { console.error("❌ Accept call error:", err); }
  };

  useEffect(() => {
    const registerListeners = () => {
      const socket = socketService.getSocket();
      if (!socket) return false;

      socket.on("incoming-call", ({ from, offer }: { from: string; offer: any }) => {
        peerSocketRef.current = from;
        setIncomingCall({ from, offer });
        setCallState("incoming");
        playRingTone();
        if ("Notification" in window && Notification.permission === "granted") {
          const n = new Notification("📞 Incoming Call", { body: "Driver is calling you", icon: "/favicon.ico", requireInteraction: true });
          n.onclick = () => { window.focus(); n.close(); };
        }
      });

      socket.on("call-answered", ({ answer, from }: { answer: any; from?: string }) => {
        if (from) peerSocketRef.current = from;
        pcRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState("connected");
      });

      socket.on("call-ice", ({ candidate }: { candidate: any }) => {
        pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      });

      socket.on("call-ended", () => endCall(false));
      socket.on("call-rejected", () => {
        endCall(false);
        setCallState("declined");
        setTimeout(() => setCallState("idle"), 2500);
      });
      return true;
    };

    // Try immediately, then retry until socket is ready
    if (!registerListeners()) {
      const interval = setInterval(() => {
        if (registerListeners()) clearInterval(interval);
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <>
    {/* Hidden audio element — always in DOM so it can play remote audio */}
    <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />
    {callState === "idle" ? null : (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)" }}>
      {callState === "declined" ? (
        <>
          <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center mb-5 border-4 border-white/20">
            <PhoneOff className="w-10 h-10 text-white" />
          </div>
          <p className="text-white text-2xl font-bold mb-2">Call Declined</p>
          <p className="text-white/60 text-sm">The call was not accepted</p>
        </>
      ) : (
        <>
          <div className={`w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center mb-5 text-white text-4xl font-bold border-4 border-white/20 ${callState === "incoming" ? "animate-pulse" : ""}`}>
            D
          </div>
          <p className="text-white text-2xl font-bold mb-2">Driver</p>
          <p className="text-white/60 text-sm mb-8">
            {callState === "incoming" ? "Incoming Call" : "● Call Connected"}
          </p>

          {/* Mute control — connected only */}
          {callState === "connected" && (
            <div className="flex gap-6 mb-8">
              <button
                onClick={toggleMute}
                className={`flex flex-col items-center gap-1.5 w-14 h-14 rounded-full justify-center transition-colors ${isMuted ? "bg-white/40" : "bg-white/15 hover:bg-white/25"}`}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>
              <p className="text-white/60 text-xs self-end mb-1">{isMuted ? "Unmute" : "Mute"}</p>
            </div>
          )}

          <div className="flex gap-10 items-end">
            {callState === "incoming" && (
              <div className="flex flex-col items-center gap-2">
                <button onClick={acceptCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-colors shadow-lg">
                  <Phone className="w-7 h-7 text-white" />
                </button>
                <span className="text-white/70 text-xs">Accept</span>
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={callState === "incoming"
                  ? () => { socketService.getSocket()?.emit("call-rejected", { to: peerSocketRef.current }); endCall(false); }
                  : () => endCall()
                }
                className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-colors shadow-lg"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/70 text-xs">{callState === "incoming" ? "Decline" : "End Call"}</span>
            </div>
          </div>
        </>
      )}
    </div>
    )}
    </>
  );
};
