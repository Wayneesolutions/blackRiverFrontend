import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private isAuthenticated: boolean = false;
  token: string | null | undefined;

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
      console.log("✅ Socket listener 'newChatMessage' registered");
    } else {
      console.error("❌ Cannot register 'newChatMessage' listener: socket not initialized");
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

  // Note: Backend uses joinTripChat for both trips and orders
  // So we use joinTripChat for orders as well

  // Join driver chat room
  joinDriverChat(driverId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isAuthenticated) {
        reject(new Error("Socket not connected or authenticated"));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error("Join driver chat timeout"));
      }, 5000);

      this.socket.emit("joinDriverChat", driverId);

      this.socket.once("joinedDriverChat", (data) => {
        clearTimeout(timeout);
        console.log("✅ Joined driver chat:", data);
        resolve();
      });

      this.socket.once("error", (error) => {
        clearTimeout(timeout);
        reject(new Error(error.message || "Failed to join driver chat"));
      });
    });
  }

  // Leave driver chat room
  leaveDriverChat(driverId: string) {
    if (this.socket) {
      this.socket.emit("leaveDriverChat", driverId);
    }
  }

  // Send driver chat message via socket
  sendDriverChatMessage(data: {
    driverId: string;
    message: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
  }) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("sendDriverChatMessage", data);
    } else {
      console.error("Socket not connected or authenticated");
    }
  }

  // Typing indicator for driver chat
  setDriverTyping(driverId: string, isTyping: boolean) {
    if (this.socket && this.isAuthenticated) {
      this.socket.emit("driverTyping", { driverId, isTyping });
    }
  }

  // Listen to document upload notifications
  onDocumentUploadNotification(callback: (notification: {
    type: string;
    title: string;
    message: string;
    orderId: string;
    orderNumber: string;
    driverName: string;
    timestamp: string;
    link: string;
  }) => void) {
    console.log('🔔 onDocumentUploadNotification called');
    console.log('🔔 Socket exists?', !!this.socket);
    console.log('🔔 Socket connected?', this.socket?.connected);
    console.log('🔔 Socket ID:', this.socket?.id);
    
    if (this.socket) {
      this.socket.on("documentUploadNotification", callback);
      console.log("✅ Socket listener 'documentUploadNotification' registered successfully");
      console.log("✅ Callback function:", callback.name || 'anonymous');
      
      // Test emit to verify listener is working
      console.log("🧪 Testing listener by emitting a test event...");
    } else {
      console.error("❌ Cannot register 'documentUploadNotification' listener: socket not initialized");
      console.error("❌ Socket is null/undefined");
    }
  }

  // Remove document upload notification listener
  offDocumentUploadNotification(callback?: (notification: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off("documentUploadNotification", callback);
      } else {
        this.socket.off("documentUploadNotification");
      }
    }
  }
}

// Export singleton instance
export const socketService = new SocketService();

