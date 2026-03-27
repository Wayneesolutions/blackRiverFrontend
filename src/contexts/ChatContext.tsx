// ChatContext.tsx
import { createContext, useContext, useState, useEffect } from "react";

export interface ChatNotification {
    driverId: string;
    driverName: string;
    message: string;
}

const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: any) => {
    const [activeDriverId, setActiveDriverId] = useState<string | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [chatNotification, setChatNotification] = useState<ChatNotification | null>(null);

    const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);

    // Auto-clear unread when a driver becomes active
    useEffect(() => {
        if (activeDriverId) {
            setUnreadCounts(prev => {
                const next = { ...prev };
                delete next[activeDriverId];
                return next;
            });
        }
    }, [activeDriverId]);

    const addUnread = (driverId: string) => {
        setUnreadCounts(prev => ({ ...prev, [driverId]: (prev[driverId] || 0) + 1 }));
    };

    const clearUnread = (driverId: string) => {
        setUnreadCounts(prev => {
            const next = { ...prev };
            delete next[driverId];
            return next;
        });
    };

    const setInitialUnreadCounts = (counts: Record<string, number>) => {
        setUnreadCounts(counts);
    };

    const clearChatNotification = () => setChatNotification(null);

    return (
        <ChatContext.Provider value={{
            activeDriverId, setActiveDriverId,
            unreadCounts, totalUnread, addUnread, clearUnread, setInitialUnreadCounts,
            chatNotification, setChatNotification, clearChatNotification
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
