import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Paperclip, X, File, Image as ImageIcon, Check, CheckCheck, Search } from "lucide-react";
import { socketService } from "../../services/socketService";
import { listDriver } from "../../axios/api/distapcher";
import {
  getDriverChatMessages,
  sendDriverChatMessage as sendDriverChatMessageAPI,
  markDriverMessagesAsRead,
  getChatMessageFileSignedUrl,
  type ChatMessage,
} from "../../axios/api/chat";

interface Driver {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  status?: string;
}

interface DriverChatProps {
  onClose?: () => void;
}

const DriverChat: React.FC<DriverChatProps> = ({ onClose }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [driversLoading, setDriversLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectedDriverRef = useRef<Driver | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Load drivers list
  const loadDrivers = async () => {
    try {
      setDriversLoading(true);
      const response = await listDriver({ page: 1, limit: 100, status: 'all' });
      if (response?.success) {
        // Handle different response structures
        let driverList: Driver[] = [];
        if (Array.isArray(response.data)) {
          driverList = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          driverList = response.data.data;
        } else if (response.data?.drivers && Array.isArray(response.data.drivers)) {
          driverList = response.data.drivers;
        }
        setDrivers(driverList);
      }
    } catch (error) {
      console.error("Error loading drivers:", error);
    } finally {
      setDriversLoading(false);
    }
  };

  // Load messages for selected driver
  const loadMessages = async (driverId: string) => {
    try {
      setLoading(true);
      const response = await getDriverChatMessages(driverId, 1, 100);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
        scrollToBottom();
      } else {
        // If response is not successful or no data, set empty messages
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Load unread counts for all drivers
  const loadUnreadCounts = async () => {
    // This would need a backend endpoint to get unread counts for all drivers
    // For now, we'll set it to empty and can be enhanced later
    setUnreadCounts({});
  };

  // Get current user ID
  const getCurrentUserInfo = () => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        if (parsed?.userData) {
          return {
            userId: parsed.userData._id || parsed.userData.id,
            role: parsed.userData.role,
            name: parsed.userData.name || 'You',
            email: parsed.userData.email || '',
          };
        }
      }
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName") || 'You';
      const userEmail = localStorage.getItem("userEmail") || '';
      return { userId, role: null, name: userName, email: userEmail };
    } catch (e) {
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName") || 'You';
      const userEmail = localStorage.getItem("userEmail") || '';
      return { userId, role: null, name: userName, email: userEmail };
    }
  };

  const currentUserId = getCurrentUserInfo().userId;

  // Update refs when selectedDriver or messages change
  useEffect(() => {
    selectedDriverRef.current = selectedDriver;
  }, [selectedDriver]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initialize socket and load drivers
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    // Listen for new messages - use refs to always have current values
    // Set up listener first so it's ready when socket connects
    const handleNewMessage = (message: ChatMessage) => {
      // Get current values from refs
      const currentSelectedDriver = selectedDriverRef.current;
      const currentMessages = messagesRef.current;
      
      console.log("📨 New message received in driver chat:", {
        messageId: message._id,
        driverId: message.driverId,
        driverIdType: typeof message.driverId,
        senderId: message.senderId,
        senderIdType: typeof message.senderId,
        selectedDriverId: currentSelectedDriver?._id,
        selectedDriverName: currentSelectedDriver?.name,
        hasSelectedDriver: !!currentSelectedDriver,
        message: message.message?.substring(0, 50),
        senderType: message.senderType,
        isSystemMessage: message.isSystemMessage,
        hasTripStatus: !!message.tripStatus,
        tripStatusSummary: message.tripStatus?.summary,
        forDispatchersOnly: message.forDispatchersOnly,
        isTempMessage: message._id?.startsWith('temp-'),
        currentMessagesCount: currentMessages.length
      });
      
      // Extract driverId from message (handle both object and string formats)
      let driverIdStr: string = '';
      if (message.driverId) {
        if (typeof message.driverId === 'object') {
          // Handle ObjectId or populated object
          driverIdStr = message.driverId._id?.toString() || 
                       message.driverId.toString() || 
                       String(message.driverId);
        } else {
          driverIdStr = String(message.driverId);
        }
      }
      
      // Normalize selected driver ID for comparison
      const selectedDriverIdStr = currentSelectedDriver?._id?.toString() || currentSelectedDriver?._id;
      const currentUserIdStr = currentUserId?.toString();
      
      // System messages with trip status should always be shown if driverId matches
      const isSystemMessage = message.isSystemMessage || message.senderType === 'system';
      
      console.log("🔍 Comparing driver IDs:", {
        messageDriverId: driverIdStr,
        selectedDriverId: selectedDriverIdStr,
        match: driverIdStr === selectedDriverIdStr,
        isSystemMessage: isSystemMessage,
        hasTripStatus: !!message.tripStatus,
        senderType: message.senderType,
        messageId: message._id?.substring(0, 20)
      });
      
      // Only add message if it's for the currently selected driver
      // For system messages, we still need driverId to match
      // If no driver is selected, we'll just update unread counts
      if (currentSelectedDriver && driverIdStr && driverIdStr === selectedDriverIdStr) {
        console.log("✅ Adding message to chat for selected driver", {
          isSystemMessage: isSystemMessage,
          hasTripStatus: !!message.tripStatus,
          messageId: message._id,
          driverIdMatch: driverIdStr === selectedDriverIdStr
        });
        
        // System messages should always be added (they're not from current user)
        if (isSystemMessage && message.tripStatus) {
          // Check if system message already exists
          const exists = currentMessages.some((msg) => msg._id === message._id);
          if (exists) {
            console.log("⚠️ System message already exists, skipping duplicate");
            return;
          }
        console.log("✅ Adding system message with trip status", {
          tripStatusSummary: message.tripStatus?.summary,
          activeOrders: message.tripStatus?.activeOrders?.length,
          activeTrips: message.tripStatus?.activeTrips?.length,
          totalActive: message.tripStatus?.summary?.totalActive,
          totalPending: message.tripStatus?.summary?.totalPending,
          isCurrentlyDriving: message.tripStatus?.summary?.isCurrentlyDriving,
          messageId: message._id
        });
        setMessages((prev) => {
          const updated = [...prev, message];
          messagesRef.current = updated;
          console.log("📝 Updated messages array:", {
            newLength: updated.length,
            lastMessageId: updated[updated.length - 1]?._id,
            lastMessageType: updated[updated.length - 1]?.senderType,
            lastMessageHasTripStatus: !!updated[updated.length - 1]?.tripStatus
          });
          return updated;
        });
        scrollToBottom();
        return;
        }
        
        // Check if this is a real message that should replace an optimistic message
        const senderId = typeof message.senderId === 'object' 
          ? message.senderId._id?.toString() || message.senderId.toString()
          : message.senderId?.toString();
        
        // If this message is from current user, check if we have an optimistic message to replace
        if (senderId === currentUserIdStr) {
          console.log("📨 Received real message from dispatcher (current user), replacing optimistic message", {
            messageId: message._id,
            messageText: message.message?.substring(0, 50),
            senderId: senderId,
            currentUserId: currentUserIdStr,
            hasOptimistic: currentMessages.some(msg => msg._id.startsWith('temp-'))
          });
          
          setMessages((prev) => {
            // Check if real message already exists
            const realExists = prev.some(msg => msg._id === message._id);
            if (realExists) {
              console.log("⚠️ Real message already exists, skipping duplicate");
              return prev; // Don't add duplicate
            }
            
            // Remove any optimistic messages from current user (remove all temp messages from this user)
            // This ensures we replace optimistic messages even if content doesn't match exactly
            let removedCount = 0;
            const filtered = prev.filter(msg => {
              if (msg._id.startsWith('temp-')) {
                const optimisticSenderId = typeof msg.senderId === 'object' 
                  ? msg.senderId._id?.toString() || msg.senderId.toString()
                  : msg.senderId?.toString();
                if (optimisticSenderId === currentUserIdStr) {
                  removedCount++;
                  console.log("🔄 Removing optimistic message:", msg._id, "Message:", msg.message?.substring(0, 30));
                  return false; // Remove optimistic message
                }
              }
              return true;
            });
            
            // Add the real message
            console.log(`✅ Adding real message from dispatcher (removed ${removedCount} optimistic), total messages:`, filtered.length + 1);
            const updated = [...filtered, message];
            // Update ref immediately
            messagesRef.current = updated;
            return updated;
          });
          scrollToBottom();
        } else {
          // Message from other user (driver or system), check if it already exists
          // Normalize message ID for comparison
          const messageId = typeof message._id === 'object' ? message._id.toString() : String(message._id);
          const exists = currentMessages.some((msg) => {
            const msgId = typeof msg._id === 'object' ? msg._id.toString() : String(msg._id);
            return msgId === messageId;
          });
          
          if (exists) {
            console.log("⚠️ Message already exists, skipping duplicate", {
              messageId: messageId,
              messageText: message.message?.substring(0, 30)
            });
            return; // Don't add duplicate
          }
          
          // Message from other user or system, just add it
          console.log("✅ Adding new message from other user", {
            messageId: messageId,
            senderType: message.senderType,
            isSystemMessage: message.isSystemMessage,
            hasTripStatus: !!message.tripStatus,
            senderId: senderId,
            currentUserId: currentUserIdStr
          });
          setMessages((prev) => {
            // Double-check for duplicates before adding
            const msgId = typeof message._id === 'object' ? message._id.toString() : String(message._id);
            const stillExists = prev.some((msg) => {
              const existingMsgId = typeof msg._id === 'object' ? msg._id.toString() : String(msg._id);
              return existingMsgId === msgId;
            });
            
            if (stillExists) {
              console.log("⚠️ Duplicate detected in setMessages, skipping");
              return prev;
            }
            
            const updated = [...prev, message];
            // Update ref immediately
            messagesRef.current = updated;
            console.log("📝 Added message from other user, total messages:", updated.length);
            return updated;
          });
          scrollToBottom();
        }
        
        // Mark as read if it's not from current user
        if (senderId && senderId !== currentUserIdStr && currentSelectedDriver) {
          markDriverMessagesAsRead(currentSelectedDriver._id);
        }
      } else if (driverIdStr) {
        // Message is for a different driver or no driver selected
        if (isSystemMessage && message.tripStatus) {
          console.log("⚠️ System message received but driverId doesn't match selected driver or no driver selected", {
            messageDriverId: driverIdStr,
            selectedDriverId: selectedDriverIdStr,
            hasSelectedDriver: !!currentSelectedDriver
          });
        }
        // Update unread count for the driver (if not currently viewing)
        console.log(`📬 Updating unread count for driver: ${driverIdStr}`);
        setUnreadCounts((prev) => ({
          ...prev,
          [driverIdStr]: (prev[driverIdStr] || 0) + 1,
        }));
      } else {
        console.log("⚠️ Message has no driverId, skipping", {
          messageId: message._id,
          senderType: message.senderType,
          isSystemMessage: isSystemMessage
        });
      }
    };

    // Listen for typing indicators - use ref for current selectedDriver
    const handleTyping = (data: {
      userId: string;
      userName: string;
      driverId?: string;
      tripId?: string;
      orderId?: string;
      isTyping: boolean;
    }) => {
      const currentSelectedDriver = selectedDriverRef.current;
      // Only handle driver chat typing indicators
      if (currentSelectedDriver && data.driverId && data.driverId === currentSelectedDriver._id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.userName);
          } else {
            newSet.delete(data.userName);
          }
          return newSet;
        });
      }
    };

    // Connect and authenticate socket first
    socketService
      .connect(token)
      .then(() => {
        console.log("✅ Socket connected for driver chat");
        // Set up listeners after socket is connected
        socketService.onNewMessage(handleNewMessage);
        socketService.onUserTyping(handleTyping);
        console.log("✅ Socket listeners set up after connection");
        loadDrivers();
        loadUnreadCounts();
      })
      .catch((error) => {
        console.error("Socket connection error:", error);
      });

    // Also set up listeners immediately (in case socket is already connected)
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleTyping);
    console.log("✅ Socket listeners registered (will work when socket connects)");

    // Cleanup
    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserTyping(handleTyping);
      const currentSelectedDriver = selectedDriverRef.current;
      if (currentSelectedDriver) {
        socketService.leaveDriverChat(currentSelectedDriver._id);
      }
    };
  }, [currentUserId]); // Only depend on currentUserId, not selectedDriver

  // Handle driver selection
  useEffect(() => {
    if (selectedDriver) {
      console.log(`🔄 Driver selected: ${selectedDriver._id} (${selectedDriver.name})`);
      // Reset messages and set loading when driver changes
      setMessages([]);
      setLoading(true);
      
      // Join driver chat room
      const driverIdStr = selectedDriver._id?.toString() || selectedDriver._id;
      socketService
        .joinDriverChat(driverIdStr)
        .then(() => {
          console.log(`✅ Joined driver chat room for driver: ${driverIdStr}`);
          loadMessages(driverIdStr);
          markDriverMessagesAsRead(driverIdStr);
          // Clear unread count for this driver
          setUnreadCounts((prev) => ({
            ...prev,
            [driverIdStr]: 0,
          }));
        })
        .catch((error) => {
          console.error("❌ Error joining driver chat:", error);
          // Still try to load messages even if socket join fails
          loadMessages(driverIdStr);
        });

      // Cleanup on driver change - don't leave immediately, wait a bit
      let timeoutId: NodeJS.Timeout | null = null;
      timeoutId = setTimeout(() => {
        socketService.leaveDriverChat(selectedDriver._id);
        console.log(`💬 Left driver chat room for driver: ${selectedDriver._id}`);
      }, 2000); // Wait 2 seconds before leaving
      
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    } else {
      // No driver selected, clear messages and loading
      setMessages([]);
      setLoading(false);
    }
  }, [selectedDriver]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [newMessage]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!selectedDriver || (!newMessage.trim() && !selectedFile)) return;

    const messageText = newMessage.trim();
    const fileToSend = selectedFile;

    try {
      setSending(true);

      // If file is selected, use HTTP API
      if (fileToSend) {
        setUploadingFile(true);
        const response = await sendDriverChatMessageAPI(selectedDriver._id, messageText, fileToSend);
        if (response.success && response.data) {
          setMessages((prev) => [...prev, response.data!]);
          setNewMessage("");
          setSelectedFile(null);
          scrollToBottom();
        }
        setUploadingFile(false);
      } else {
        // Create optimistic message for immediate display
        const optimisticMessage: ChatMessage = {
          _id: `temp-${Date.now()}-${Math.random()}`,
          driverId: selectedDriver._id,
          senderId: {
            _id: currentUserId || '',
            name: getCurrentUserInfo().name || 'You',
            email: getCurrentUserInfo().email || '',
          },
          senderType: 'dispatcher',
          senderName: getCurrentUserInfo().name || 'You',
          message: messageText,
          readBy: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Add optimistic message immediately for instant feedback
        setMessages((prev) => {
          const updated = [...prev, optimisticMessage];
          // Update ref immediately so handleNewMessage can access it
          messagesRef.current = updated;
          console.log("✅ Added optimistic message, total messages:", updated.length);
          return updated;
        });
        setNewMessage("");
        scrollToBottom();

        // Send via socket for real-time
        // The backend will emit the message back via socket, which will be caught by handleNewMessage
        // The real message will replace the optimistic one (or we'll remove the optimistic one if it matches)
        console.log("📤 Sending message via socket to driver:", selectedDriver._id);
        socketService.sendDriverChatMessage({
          driverId: selectedDriver._id,
          message: messageText,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      if (!fileToSend) {
        setMessages((prev) => prev.filter(msg => !msg._id.startsWith('temp-')));
      }
    } finally {
      setSending(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedDriver) return;
    socketService.setDriverTyping(selectedDriver._id, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socketService.setDriverTyping(selectedDriver._id, false);
    }, 2000);
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  // Format time for message
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {};
    messages.forEach((message) => {
      const date = new Date(message.createdAt);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    return groups;
  };

  // Filter drivers based on search
  const filteredDrivers = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.phone?.includes(searchQuery)
  );

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex h-full bg-gray-50">
      {/* Drivers List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: '#00C2A6' }} />
              Chat
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search drivers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Drivers List */}
        <div className="flex-1 overflow-y-auto">
          {filteredDrivers.length === 0 && !driversLoading ? (
            <div className="p-4 text-center text-gray-500">
              <p>No drivers found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredDrivers.map((driver) => {
                const isSelected = selectedDriver?._id === driver._id;
                const unreadCount = unreadCounts[driver._id] || 0;
                return (
                  <button
                    key={driver._id}
                    onClick={() => setSelectedDriver(driver)}
                    className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                      isSelected ? "bg-blue-50 border-l-4" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {driver.profileImageUrl ? (
                          <img
                            src={driver.profileImageUrl}
                            alt={driver.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                            {driver.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {driver.status === 'active' && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold truncate ${isSelected ? "text-blue-600" : "text-gray-800"}`}>
                          {driver.name}
                        </p>
                        {driver.phone && (
                          <p className="text-sm text-gray-500 truncate">{driver.phone}</p>
                        )}
                      </div>
                      {/* Unread Badge */}
                      {unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedDriver ? (
          <>
            {/* Chat Header */}
            <div className="flex-shrink-0 text-white shadow-lg" style={{ background: '#00C2A6' }}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {selectedDriver.profileImageUrl ? (
                    <img
                      src={selectedDriver.profileImageUrl}
                      alt={selectedDriver.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
                      {selectedDriver.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{selectedDriver.name}</h3>
                    {selectedDriver.phone && (
                      <p className="text-sm text-blue-100">{selectedDriver.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                    <p className="text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-semibold text-lg mb-1">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation with {selectedDriver.name}!</p>
                  </div>
                </div>
              ) : (
                Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
                  <div key={dateKey}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-white px-4 py-1 rounded-full shadow-sm border border-gray-200">
                        <span className="text-xs font-medium text-gray-600">{dateKey}</span>
                      </div>
                    </div>

                    {/* Messages for this date */}
                    {dateMessages.map((message, index) => {
                      const senderType = message.senderType || '';
                      const isSystemMessage = message.isSystemMessage || senderType === 'system';
                      const isRightSide = (senderType === 'dispatcher' || senderType === 'admin') && !isSystemMessage;
                      const isCurrentUser = currentUserId && String(message.senderId._id) === String(currentUserId);
                      const showAvatar = !isSystemMessage && (index === 0 || dateMessages[index - 1].senderId._id !== message.senderId._id);
                      const isRead = message.readBy && message.readBy.length > 0;

                      // System messages (trip status) should be centered
                      if (isSystemMessage && message.tripStatus) {
                        return (
                          <div key={message._id} className="flex justify-center mb-4">
                            <div className="w-full max-w-2xl">
                              {/* Trip Status Card */}
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="text-sm font-bold text-gray-800">Driver Trip Status</h4>
                                      {message.tripStatus.summary.isCurrentlyDriving && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                          Currently Driving
                                        </span>
                                      )}
                                      {!message.tripStatus.summary.isCurrentlyDriving && message.tripStatus.summary.totalPending > 0 && (
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                                          Assigned
                                        </span>
                                      )}
                                      {!message.tripStatus.summary.isCurrentlyDriving && message.tripStatus.summary.totalPending === 0 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                                          Available
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* AI Summary */}
                                    {message.tripStatus.aiSummary && (
                                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                                        {message.tripStatus.aiSummary}
                                      </p>
                                    )}

                                    {/* Trip Details */}
                                    <div className="space-y-2">
                                      {/* Active Trips */}
                                      {message.tripStatus.activeTrips.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-600 mb-1">Active Trips ({message.tripStatus.activeTrips.length}):</p>
                                          {message.tripStatus.activeTrips.map((trip, idx) => (
                                            <div key={idx} className="text-xs text-gray-600 bg-white/60 rounded p-2 mb-2 border border-gray-200">
                                              <div className="font-medium mb-2 flex items-center gap-2">
                                                <span>Trip {trip.tripNumber}</span>
                                                {trip.driverRole && (
                                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                    {trip.driverRole}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-gray-700 space-y-1">
                                                <div className="font-medium text-gray-800">📍 Start Location:</div>
                                                <div className="ml-2">{trip.startLocation}</div>
                                                <div className="font-medium text-gray-800 mt-2">📍 End Location:</div>
                                                <div className="ml-2">{trip.endLocation}</div>
                                                {trip.ordersCount > 0 && (
                                                  <div className="mt-2">
                                                    <span className="font-medium">📦 Orders:</span> {trip.ordersCount}
                                                  </div>
                                                )}
                                                {trip.truck && (
                                                  <div>
                                                    <span className="font-medium">🚚 Truck:</span> {trip.truck}
                                                  </div>
                                                )}
                                                {trip.trailer && (
                                                  <div>
                                                    <span className="font-medium">🚛 Trailer:</span> {trip.trailer}
                                                  </div>
                                                )}
                                                {trip.mainDriver && (
                                                  <div>
                                                    <span className="font-medium">👤 Main Driver:</span> {trip.mainDriver}
                                                  </div>
                                                )}
                                                {trip.coDriver && (
                                                  <div>
                                                    <span className="font-medium">👥 Co-Driver:</span> {trip.coDriver}
                                                  </div>
                                                )}
                                                {trip.actualStartDate && (
                                                  <div className="text-gray-500 mt-2 text-xs">
                                                    Started: {new Date(trip.actualStartDate).toLocaleString()}
                                                  </div>
                                                )}
                                                {trip.plannedEndDate && (
                                                  <div className="text-gray-500 text-xs">
                                                    Expected End: {new Date(trip.plannedEndDate).toLocaleString()}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Active Orders - All non-completed/canceled orders */}
                                      {message.tripStatus.activeOrders.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-600 mb-1">Active Orders ({message.tripStatus.activeOrders.length}):</p>
                                          {message.tripStatus.activeOrders.map((order, idx) => (
                                            <div key={idx} className="text-xs text-gray-600 bg-white/60 rounded p-2 mb-2 border border-gray-200">
                                              <div className="font-medium mb-2 flex items-center gap-2">
                                                <span>Order {order.orderNumber}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${
                                                  order.status === 'in-delivery' ? 'bg-yellow-100 text-yellow-700' :
                                                  order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                                                  order.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                                                  order.status === 'quoted' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-gray-100 text-gray-700'
                                                }`}>
                                                  {order.status}
                                                </span>
                                              </div>
                                              <div className="text-gray-700 space-y-1">
                                                <div className="font-medium text-gray-800">📍 Pickup Location:</div>
                                                <div className="ml-2">{order.pickupLocation}</div>
                                                {order.pickupFullAddress && (
                                                  <div className="ml-2 text-gray-500 text-xs">{order.pickupFullAddress}</div>
                                                )}
                                                <div className="font-medium text-gray-800 mt-2">📍 Delivery Location:</div>
                                                <div className="ml-2">{order.deliveryLocation}</div>
                                                {order.deliveryFullAddress && (
                                                  <div className="ml-2 text-gray-500 text-xs">{order.deliveryFullAddress}</div>
                                                )}
                                                {order.customer && (
                                                  <div className="mt-2">
                                                    <span className="font-medium">👤 Customer:</span> {order.customer}
                                                  </div>
                                                )}
                                                {order.truck && (
                                                  <div>
                                                    <span className="font-medium">🚚 Truck:</span> {order.truck}
                                                  </div>
                                                )}
                                                {order.trailer && (
                                                  <div>
                                                    <span className="font-medium">🚛 Trailer:</span> {order.trailer}
                                                  </div>
                                                )}
                                                {order.actualStartDate && (
                                                  <div className="text-gray-500 mt-2 text-xs">
                                                    Started: {new Date(order.actualStartDate).toLocaleString()}
                                                  </div>
                                                )}
                                                {order.pickupDate && !order.actualStartDate && (
                                                  <div className="text-gray-500 mt-2 text-xs">
                                                    Pickup: {new Date(order.pickupDate).toLocaleString()}
                                                  </div>
                                                )}
                                                {order.deliveryDate && (
                                                  <div className="text-gray-500 text-xs">
                                                    Delivery Due: {new Date(order.deliveryDate).toLocaleString()}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Pending Trips */}
                                      {message.tripStatus.pendingTrips.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-600 mb-1">Pending Trips ({message.tripStatus.pendingTrips.length}):</p>
                                          {message.tripStatus.pendingTrips.map((trip, idx) => (
                                            <div key={idx} className="text-xs text-gray-600 bg-white/60 rounded p-2 mb-2 border border-gray-200">
                                              <div className="font-medium mb-2 flex items-center gap-2">
                                                <span>Trip {trip.tripNumber}</span>
                                                {trip.driverRole && (
                                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                                    {trip.driverRole}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-gray-700 space-y-1">
                                                <div className="font-medium text-gray-800">📍 Start Location:</div>
                                                <div className="ml-2">{trip.startLocation}</div>
                                                <div className="font-medium text-gray-800 mt-2">📍 End Location:</div>
                                                <div className="ml-2">{trip.endLocation}</div>
                                                {trip.ordersCount > 0 && (
                                                  <div className="mt-2">
                                                    <span className="font-medium">📦 Orders:</span> {trip.ordersCount}
                                                  </div>
                                                )}
                                                {trip.mainDriver && (
                                                  <div>
                                                    <span className="font-medium">👤 Main Driver:</span> {trip.mainDriver}
                                                  </div>
                                                )}
                                                {trip.coDriver && (
                                                  <div>
                                                    <span className="font-medium">👥 Co-Driver:</span> {trip.coDriver}
                                                  </div>
                                                )}
                                                {trip.plannedStartDate && (
                                                  <div className="text-gray-500 mt-2 text-xs">
                                                    Planned Start: {new Date(trip.plannedStartDate).toLocaleString()}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Pending Orders */}
                                      {message.tripStatus.pendingOrders.length > 0 && (
                                        <div>
                                          <p className="text-xs font-semibold text-gray-600 mb-1">Pending Orders ({message.tripStatus.pendingOrders.length}):</p>
                                          {message.tripStatus.pendingOrders.map((order, idx) => (
                                            <div key={idx} className="text-xs text-gray-600 bg-white/60 rounded p-2 mb-2 border border-gray-200">
                                              <div className="font-medium mb-2 flex items-center gap-2">
                                                <span>Order {order.orderNumber}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs ${
                                                  order.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                                                  order.status === 'quoted' ? 'bg-orange-100 text-orange-700' :
                                                  'bg-gray-100 text-gray-700'
                                                }`}>
                                                  {order.status}
                                                </span>
                                              </div>
                                              <div className="text-gray-700 space-y-1">
                                                <div className="font-medium text-gray-800">📍 Pickup Location:</div>
                                                <div className="ml-2">{order.pickupLocation}</div>
                                                {order.pickupFullAddress && (
                                                  <div className="ml-2 text-gray-500 text-xs">{order.pickupFullAddress}</div>
                                                )}
                                                <div className="font-medium text-gray-800 mt-2">📍 Delivery Location:</div>
                                                <div className="ml-2">{order.deliveryLocation}</div>
                                                {order.deliveryFullAddress && (
                                                  <div className="ml-2 text-gray-500 text-xs">{order.deliveryFullAddress}</div>
                                                )}
                                                {order.customer && (
                                                  <div className="mt-2">
                                                    <span className="font-medium">👤 Customer:</span> {order.customer}
                                                  </div>
                                                )}
                                                {order.pickupDate && (
                                                  <div className="text-gray-500 mt-2 text-xs">
                                                    Pickup: {new Date(order.pickupDate).toLocaleString()}
                                                  </div>
                                                )}
                                                {order.deliveryDate && (
                                                  <div className="text-gray-500 text-xs">
                                                    Delivery Due: {new Date(order.deliveryDate).toLocaleString()}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* No trips/orders */}
                                      {message.tripStatus.summary.totalActive === 0 && message.tripStatus.summary.totalPending === 0 && (
                                        <p className="text-xs text-gray-600 italic">No active trips or orders assigned.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={message._id}
                          className={`flex items-end gap-2 mb-3 ${isRightSide ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {/* Avatar */}
                          {!isRightSide && showAvatar && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {message.senderName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          {!isRightSide && !showAvatar && <div className="w-8 flex-shrink-0" />}

                          {/* Message Bubble */}
                          <div className={`flex flex-col ${isRightSide ? "items-end" : "items-start"} max-w-[75%]`}>
                            {!isRightSide && showAvatar && (
                              <span className="text-xs font-medium text-gray-600 mb-1 px-1">
                                {message.senderName}
                              </span>
                            )}
                            
                            <div
                              className={`relative rounded-2xl px-4 py-2.5 shadow-md ${
                                isRightSide
                                  ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-sm"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                              }`}
                            >
                              {/* Message Text */}
                              {message.message && (
                                <p className={`text-sm leading-relaxed ${isRightSide ? "text-white" : "text-gray-800"}`}>
                                  {message.message}
                                </p>
                              )}

                              {/* File Attachment */}
                              {message.fileUrl && (
                                <div className={`mt-2 ${message.message ? "pt-2 border-t" : ""} ${
                                  isRightSide ? "border-blue-400/30" : "border-gray-200"
                                }`}>
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      try {
                                        const response = await getChatMessageFileSignedUrl(message._id, 'inline');
                                        if (response.success && response.url) {
                                          window.open(response.url, '_blank');
                                        } else {
                                          window.open(message.fileUrl, '_blank');
                                        }
                                      } catch (error) {
                                        console.error('Error opening file:', error);
                                        window.open(message.fileUrl, '_blank');
                                      }
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded-lg transition-all hover:opacity-80 ${
                                      isRightSide
                                        ? "bg-white/20 hover:bg-white/30 text-white"
                                        : "bg-gray-100 hover:bg-gray-200 text-blue-600"
                                    }`}
                                  >
                                    {message.fileType === "image" ? (
                                      <ImageIcon className="w-4 h-4" />
                                    ) : (
                                      <File className="w-4 h-4" />
                                    )}
                                    <span className="text-xs font-medium flex-1 text-left">
                                      {message.fileName || "File"}
                                    </span>
                                    {message.fileSize && (
                                      <span className={`text-xs ${isRightSide ? "text-blue-100" : "text-gray-500"}`}>
                                        {formatFileSize(message.fileSize)}
                                      </span>
                                    )}
                                  </button>
                                </div>
                              )}


                              {/* Message Footer */}
                              <div className={`flex items-center gap-1.5 mt-1.5 ${isRightSide ? "justify-end" : "justify-start"}`}>
                                <span className={`text-xs ${isRightSide ? "text-blue-100" : "text-gray-500"}`}>
                                  {formatTime(message.createdAt)}
                                </span>
                                {isRightSide && isCurrentUser && (
                                  <div className="flex items-center">
                                    {isRead ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-blue-200" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-gray-200">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {Array.from(typingUsers).join(", ")} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {selectedFile && (
              <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <File className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200 shadow-lg">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx"
              />
              <div className="flex items-end gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 flex-shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 text-gray-800 placeholder-gray-400 transition-all"
                    rows={1}
                    style={{ maxHeight: "120px" }}
                  />
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={sending || uploadingFile || (!newMessage.trim() && !selectedFile)}
                  className="p-2.5 !text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex-shrink-0 disabled:hover:shadow-md"
                  style={{ background: '#00C2A6' }}
                  title="Send message"
                >
                  {sending || uploadingFile ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold text-lg mb-1">Select a driver to start chatting</p>
              <p className="text-sm text-gray-500">Choose a driver from the list to begin your conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverChat;

