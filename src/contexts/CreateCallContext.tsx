import { createContext, useContext, useState, useEffect } from "react";
import { socketService } from "../services/socketService";

type CallState = "idle" | "incoming" | "outgoing" | "connected";

const CallContext = createContext<any>(null);

export const CallProvider = ({ children }: any) => {
  const [callState, setCallState] = useState<CallState>("idle");
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const [handlers, setHandlers] = useState<any>({
    onAnswer: null,
    onIce: null
  });

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleIncoming = ({ from, offer }: any) => {
      console.log("📞 GLOBAL incoming call");
      setIncomingCall({ from, offer });
      setCallState("incoming");
    };

    const handleAnswer = ({ answer }: any) => {
      console.log("📞 call answered");
      handlers.onAnswer?.(answer); // ✅ forward to WebRTC
      setCallState("connected");
    };

    const handleIce = ({ candidate }: any) => {
      console.log("🧊 ICE received");
      handlers.onIce?.(candidate); // ✅ forward to WebRTC
    };

    socket.on("incoming-call", handleIncoming);
    socket.on("call-answered", handleAnswer);
    socket.on("call-ice", handleIce);

    return () => {
      socket.off("incoming-call", handleIncoming);
      socket.off("call-answered", handleAnswer);
      socket.off("call-ice", handleIce);
    };
  }, [handlers]);

  return (
    <CallContext.Provider value={{
      callState,
      incomingCall,
      setCallState,
      setIncomingCall,
      setCallHandlers: setHandlers // 👈 expose this
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);