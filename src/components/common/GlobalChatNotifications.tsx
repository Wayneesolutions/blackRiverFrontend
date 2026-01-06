import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { FaTruck } from 'react-icons/fa';
import { socketService } from '../../services/socketService';
import { useNavigate } from 'react-router-dom';

interface ChatNotification {
  id: number;
  tripId: string;
  tripNumber: string;
  driverName: string;
  message: string;
  timestamp: number;
}

const GlobalChatNotifications = () => {
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [allTrips, setAllTrips] = useState<any[]>([]);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const allTripsRef = useRef<any[]>([]);
  const isInitialized = useRef(false);
  const navigate = useNavigate();

  // Fetch all orders (and trips for backward compatibility) for context
  const fetchTrips = useCallback(async () => {
    try {
      // Fetch orders (primary)
      const { listOrder } = await import('../../axios/api/distapcher');
      const orderResponse = await listOrder({ page: 1, limit: 1000 });
      
      // Also fetch trips for backward compatibility
      const { listTrip } = await import('../../axios/api/distapcher');
      const tripResponse = await listTrip({ page: 1, limit: 1000 });
      
      const allItems = [
        ...(orderResponse?.success && orderResponse?.data ? orderResponse.data.map((o: any) => ({
          _id: o._id,
          tripNumber: o.orderNumber || o._id,
          orderNumber: o.orderNumber || o._id,
          isOrder: true
        })) : []),
        ...(tripResponse?.success && tripResponse?.data ? tripResponse.data.map((t: any) => ({
          _id: t._id,
          tripNumber: t.tripNumber || t._id,
          isOrder: false
        })) : [])
      ];
      
      if (allItems.length > 0) {
        setAllTrips(allItems);
        allTripsRef.current = allItems;
        console.log(`📋 Loaded ${allItems.length} orders/trips for global notifications`);
      }
    } catch (error) {
      console.error('Error fetching orders/trips:', error);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Update ref when trips change
  useEffect(() => {
    allTripsRef.current = allTrips;
  }, [allTrips]);

  // Initialize socket connection for global notifications
  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentUserId = localStorage.getItem('userId');

    if (!token || isInitialized.current) return;

    isInitialized.current = true;
    console.log('🌍 Initializing GLOBAL chat notifications...');

    socketService
      .connect(token)
      .then(() => {
        console.log('✅ Global socket connected for chat notifications');
        setIsSocketReady(true);

        // Global message handler
        const handleNewMessage = (message: any) => {
          console.log('📨 Global notification - New message:', message);
          console.log('📨 Current user ID:', currentUserId);
          console.log('📨 Message sender ID:', message.senderId?._id, message.senderId?._id?.toString());

          // Only show if message is NOT from current user
          // Check both string and object ID formats
          const senderId = message.senderId?._id?.toString() || message.senderId?._id || message.senderId;
          const currentUserIdStr = currentUserId?.toString() || currentUserId;
          
          console.log('🔍 Comparing sender IDs:', {
            senderId,
            currentUserIdStr,
            areEqual: senderId === currentUserIdStr,
            senderIdType: typeof senderId,
            currentUserIdType: typeof currentUserIdStr
          });
          
          if (senderId === currentUserIdStr) {
            console.log('⚠️ Message is from current user, skipping notification');
            return;
          }
          
          console.log('✅ Message is from another user, proceeding with notification');

          // Get orderId or tripId (backend sends both for orders)
          const messageId = message.orderId || message.tripId;
          if (!messageId) {
            console.log('⚠️ Message has no orderId or tripId, skipping');
            return;
          }
          
          console.log('✅ Message is from another user, showing notification for:', messageId);

            // Let any page (e.g. Trips list) update unread counts in real time
            try {
              window.dispatchEvent(
                new CustomEvent('chat:newMessage', { detail: { tripId: messageId, orderId: message.orderId } })
              );
            } catch (e) {
              // no-op (older browsers / non-DOM contexts)
            }

            // Use ref to get latest trips (check both tripId and orderId)
            const trip = allTripsRef.current.find(t => 
              t._id === messageId || 
              t._id === message.tripId || 
              t._id === message.orderId
            );
            const driverName = message.senderId?.name || 'Driver';
            const tripNumber = trip?.tripNumber || trip?.orderNumber || message.tripNumber || message.orderNumber || 'Unknown';

            // Add notification
            const notification: ChatNotification = {
              id: Date.now(),
              tripId: messageId, // Use as tripId for navigation (works for both trips and orders)
              tripNumber: tripNumber,
              driverName: driverName,
              message: message.message || 'New message',
              timestamp: Date.now(),
            };

            console.log('📢 Adding notification:', notification);
            setNotifications(prev => {
              console.log('📢 Current notifications count:', prev.length);
              const updated = [...prev, notification];
              console.log('📢 Updated notifications count:', updated.length);
              return updated;
            });

            // Play sound
            try {
              const audio = new Audio('/notification.mp3');
              audio.volume = 0.5;
              audio.play().catch(e => console.log('Sound play failed:', e));
            } catch (e) {
              console.log('Audio not available');
            }

            // Auto-remove after 8 seconds
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }, 8000);
        };

        socketService.onNewMessage(handleNewMessage);
        console.log('👂 Global chat notification listener active');
        
        // Test: Log all socket events to debug
        const socket = socketService.getSocket();
        if (socket) {
          console.log('🔌 Socket instance:', socket.id, 'connected:', socket.connected);
          
          // Listen to all events for debugging
          socket.onAny((eventName, ...args) => {
            if (eventName === 'newChatMessage') {
              console.log('🎯 Received newChatMessage event:', args);
            }
          });
        } else {
          console.error('❌ Socket instance is null!');
        }
      })
      .catch(error => {
        console.error('❌ Global socket connection error:', error);
        setIsSocketReady(false);
      });

    return () => {
      console.log('🌍 Cleaning up global chat notifications');
      socketService.offNewMessage();
      isInitialized.current = false;
      setIsSocketReady(false);
    };
  }, []); // No dependencies - runs once!

  // Join all trip rooms when trips are loaded and socket is connected
  useEffect(() => {
    if (allTrips.length === 0) {
      console.log('⏳ Waiting for trips to load...');
      return;
    }

    if (!isSocketReady) {
      console.log('⏳ Waiting for socket authentication...');
      return;
    }

    // Check if socket is connected, if not, wait and retry
    const joinRooms = async () => {
      let retries = 0;
      const maxRetries = 10;
      
      while ((!socketService.isConnected() || !socketService.getIsAuthenticated()) && retries < maxRetries) {
        console.log(
          `⏳ Waiting for socket readiness... (connected=${socketService.isConnected()} authed=${socketService.getIsAuthenticated()}) (${retries + 1}/${maxRetries})`
        );
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }

      if (!socketService.isConnected() || !socketService.getIsAuthenticated()) {
        console.error('❌ Socket not ready after retries, cannot join rooms');
        return;
      }

      console.log(`🌍 Joining ${allTrips.length} order/trip rooms globally...`);
      
      // Join rooms with delay to avoid overwhelming the server
      for (const item of allTrips) {
        try {
          // Backend uses joinTripChat for both orders and trips
          await socketService.joinTripChat(item._id);
          console.log(`✅ Joined room: ${item.tripNumber || item.orderNumber}`);
        } catch (error) {
          console.error(`❌ Failed to join ${item.isOrder ? 'order' : 'trip'} ${item.tripNumber || item.orderNumber}:`, error);
        }
        // Small delay between joins
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      console.log(`✅ Successfully joined ${allTrips.length} order/trip rooms`);
    };

    joinRooms();
  }, [allTrips, isSocketReady]);

  const handleNotificationClick = async (notification: ChatNotification) => {
    // Determine correct route based on current path (admin vs dispatcher)
    const currentPath = window.location.pathname;
    const isAdmin = currentPath.startsWith('/admin');
    const tripsPath = isAdmin ? '/admin/dispatch/trips' : '/dispatch/trips';
    
    console.log(`🔗 Clicked notification for ${notification.tripNumber}, ID: ${notification.tripId}`);
    console.log(`🔗 Current path: ${currentPath}, Target path: ${tripsPath}`);
    
    // If already on trips page, directly call the handler to set state (no navigation needed)
    if (currentPath === tripsPath || currentPath.endsWith('/trips')) {
      console.log('🔗 Already on trips page, opening chat directly via state');
      console.log('🔗 Trip ID:', notification.tripId);
      
      // Method 1: Try direct handler from global store FIRST (most reliable)
      console.log('🔍 Checking global store:', !!(window as any).__tripsChatHandlers);
      console.log('🔍 Handler in store:', !!(window as any).__tripsChatHandlers?.openChat);
      console.log('🔍 Handler type:', typeof (window as any).__tripsChatHandlers?.openChat);
      
      if ((window as any).__tripsChatHandlers?.openChat) {
        console.log('🔗 Method 1: Using handler from global store');
        try {
          const handler = (window as any).__tripsChatHandlers.openChat;
          console.log('🔗 Handler function:', typeof handler, !!handler);
          if (handler && typeof handler === 'function') {
            await handler(notification.tripId);
            console.log('✅ Chat opened via global store handler');
            return;
          } else {
            console.warn('⚠️ Handler is not a function:', typeof handler);
          }
        } catch (error) {
          console.error('❌ Error with global store handler:', error);
        }
      }
      
      // Method 2: Try global function (calls handler which sets state)
      console.log('🔍 Checking global function:', typeof (window as any).openTripChat);
      if ((window as any).openTripChat) {
        console.log('🔗 Method 2: Calling global function');
        try {
          await (window as any).openTripChat(notification.tripId);
          console.log('✅ Chat opened via global function');
          return;
        } catch (error) {
          console.error('❌ Error with global function:', error);
        }
      }
      
      // Wait a bit and retry global store (handler might not be set up yet)
      console.log('⏳ Handlers not ready, waiting 500ms and retrying...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔍 Retry - Checking global store:', !!(window as any).__tripsChatHandlers);
      console.log('🔍 Retry - Handler in store:', !!(window as any).__tripsChatHandlers?.openChat);
      
      if ((window as any).__tripsChatHandlers?.openChat) {
        console.log('🔗 Retry: Using handler from global store');
        try {
          const handler = (window as any).__tripsChatHandlers.openChat;
          if (handler && typeof handler === 'function') {
            await handler(notification.tripId);
            console.log('✅ Chat opened via global store handler (retry)');
            return;
          }
        } catch (error) {
          console.error('❌ Error with global store handler (retry):', error);
        }
      }
      
      // Also retry global function
      if ((window as any).openTripChat) {
        console.log('🔗 Retry: Calling global function');
        try {
          await (window as any).openTripChat(notification.tripId);
          console.log('✅ Chat opened via global function (retry)');
          return;
        } catch (error) {
          console.error('❌ Error with global function (retry):', error);
        }
      }
      
      // Method 3: Dispatch custom event (trips page will listen and set state)
      console.log('🔗 Method 3: Dispatching custom event');
      const event = new CustomEvent('openChatFromNotification', { 
        detail: { tripId: notification.tripId, orderId: notification.tripId },
        bubbles: true,
        cancelable: true,
        composed: true // Allow event to cross shadow DOM boundaries
      });
      
      // Dispatch to window (multiple times to ensure it's caught)
      window.dispatchEvent(event);
      window.dispatchEvent(event); // Dispatch twice to ensure
      
      // Also dispatch to document
      document.dispatchEvent(event);
      document.dispatchEvent(event);
      
      // Also dispatch to document.body
      if (document.body) {
        document.body.dispatchEvent(event);
      }
      
      console.log('🔗 Event dispatched to window, document, and body');
      
      // Give event listeners time to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Method 4: Retry global function after a delay (in case it wasn't set up yet)
      setTimeout(async () => {
        if ((window as any).openTripChat) {
          console.log('🔗 Method 4: Retrying global function');
          try {
            await (window as any).openTripChat(notification.tripId);
            console.log('✅ Chat opened via retry');
          } catch (error) {
            console.error('❌ Error in retry:', error);
          }
        } else if ((window as any).__tripsChatHandlers?.openChat) {
          console.log('🔗 Method 4: Retrying global store handler');
          try {
            await (window as any).__tripsChatHandlers.openChat(notification.tripId);
            console.log('✅ Chat opened via store handler retry');
          } catch (error) {
            console.error('❌ Error in store handler retry:', error);
          }
        }
      }, 500);
    } else {
      // Navigate to trips page with the trip selected
      console.log(`🔗 Navigating to ${tripsPath} with state`);
      navigate(tripsPath, { state: { openTripChat: notification.tripId } });
    }
    
    // Remove notification
    removeNotification(notification.id);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Debug: Log notifications state
  useEffect(() => {
    console.log('🔔 Notifications state updated:', notifications.length, 'notifications');
    if (notifications.length > 0) {
      console.log('🔔 Notification details:', notifications);
    }
  }, [notifications]);

  if (notifications.length === 0) {
    console.log('🔔 No notifications to display');
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-3" style={{ pointerEvents: 'none' }}>
      {notifications.map((notification) => (
        <ChatNotificationCard
          key={notification.id}
          notification={notification}
          onClick={() => handleNotificationClick(notification)}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

interface ChatNotificationCardProps {
  notification: ChatNotification;
  onClick: () => void;
  onClose: () => void;
}

const ChatNotificationCard = ({ notification, onClick, onClose }: ChatNotificationCardProps) => {
  const [progress, setProgress] = useState(100);
  const duration = 8000;

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const decrement = (100 / duration) * 50;
        return Math.max(0, prev - decrement);
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div
      onClick={onClick}
      className="w-[400px] bg-white rounded-2xl shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] border border-gray-100 overflow-hidden animate-slide-in"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Progress bar */}
      <div 
        className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-100" 
        style={{ width: `${progress}%` }}
      ></div>

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Driver Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {notification.driverName.charAt(0)}
            </div>
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white absolute ml-8 -mt-3"></div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-gray-900 text-base">
                {notification.driverName}
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                <FaTruck className="w-3 h-3" />
                {notification.tripNumber}
              </span>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed line-clamp-2 mb-3">
              {notification.message}
            </p>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold">
                <MessageCircle className="w-4 h-4" />
                <span>Click to open chat</span>
              </div>
              <div className="flex-1"></div>
              <span className="text-gray-400 text-xs">Just now</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="flex-shrink-0 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>
  );
};

export default GlobalChatNotifications;

