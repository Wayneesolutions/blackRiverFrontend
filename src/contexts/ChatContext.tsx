// ChatContext.tsx
import { createContext, useContext, useState } from "react";

const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: any) => {
    const [activeDriverId, setActiveDriverId] = useState<string | null>(null);

    return (
        <ChatContext.Provider value={{ activeDriverId, setActiveDriverId }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);