import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isAuthenticated: boolean = false;

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Initialize socket connection
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Disconnect existing connection if any
      if (this.socket) {
        this.socket.disconnect();
      }

      this.token = token;
      // Extract base URL from VITE_APP_BASE_URL (remove /api/v1)
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || "http://localhost:3000/api/v1";
      const socketUrl = baseUrl.replace("/api/v1", "") || "http://localhost:3000";

      this.socket = io(socketUrl, {
        path: "/socket.io/",
        transports: ["polling", "websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        query: {
          token: token,
        },
      });

      // Connection events
      this.socket.on("connect", () => {
        console.log("✅ Socket connected:", this.socket?.id);
        // Authenticate after connection
        this.authenticate(token);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        this.isAuthenticated = false;
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error);
        reject(error);
      });

      // Authentication events
      this.socket.on("authenticated", (data) => {
        console.log("✅ Socket authenticated:", data);
        this.isAuthenticated = true;
        resolve();
      });

      this.socket.on("auth_error", (error) => {
        console.error("❌ Socket authentication error:", error);
        this.isAuthenticated = false;
        reject(new Error(error.message || "Authentication failed"));
      });

      // If already connected, authenticate immediately
      if (this.socket.connected) {
        this.authenticate(token);
      }
    });
  }

  // Authenticate socket
  private authenticate(token: string) {
    if (this.socket && !this.isAuthenticated) {
      this.socket.emit("authenticate", token);
    }
  }

  // Join trip chat room
  joinTripChat(tripId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isAuthenticated) {
        reject(new Error("Socket not connected or authenticated"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Join trip chat timeout"));
      }, 5000);

      this.socket.emit("joinTripChat", tripId);

      this.socket.once("joinedTripChat", (data) => {
        clearTimeout(timeout);
        console.log("✅ Joined trip chat:", data);
        resolve();
      });

      this.socket.once("error", (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || "Failed to join trip chat"));
      });
    });
  }

  // Leave trip chat room
  leaveTripChat(tripId: string) {
    if (this.socket) {
      this.socket.emit("leaveTripChat", tripId);
    }
  }

  // Send chat message via socket
  sendChatMessage(data: {
    tripId: string;
    message: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("sendChatMessage", data);
    } else {
      console.error("Socket not connected or authenticated");
    }
  }

  // Mark messages as read
  markMessagesRead(tripId: string) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("markMessagesRead", tripId);
    }
  }

  // Typing indicator
  setTyping(tripId: string, isTyping: boolean) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("typing", { tripId, isTyping });
    }
  }

  // Listen to new messages
  onNewMessage(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on("newChatMessage", callback);
    }
  }

  // Remove new message listener
  offNewMessage(callback?: (message: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("newChatMessage", callback);
      } else {
        this.socket.off("newChatMessage");
      }
    }
  }

  // Listen to typing indicator
  onUserTyping(callback: (data: { userId: string; userName: string; tripId: string; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.on("userTyping", callback);
    }
  }

  // Remove typing listener
  offUserTyping(callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("userTyping", callback);
      } else {
        this.socket.off("userTyping");
      }
    }
  }

  // Listen to errors
  onError(callback: (error: { message: string }) => void) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  // Remove error listener
  offError(callback?: (error: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("error", callback);
      } else {
        this.socket.off("error");
      }
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isAuthenticated = false;
      this.token = null;
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Check if authenticated
  getIsAuthenticated(): boolean {
    return this.isAuthenticated;
  }
}

// Export singleton instance
export const socketService = new SocketService();

