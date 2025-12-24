import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { FaTruck } from 'react-icons/fa';
import { socketService } from '../../services/socketService';
import { getUnreadMessageCount } from '../../axios/api/chat';
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
  const allTripsRef = useRef<any[]>([]);
  const isInitialized = useRef(false);
  const navigate = useNavigate();

  // Fetch all trips for context
  const fetchTrips = useCallback(async () => {
    try {
      const { listTrip } = await import('../../axios/api/distapcher');
      const response = await listTrip({ page: 1, limit: 1000 });
      if (response?.success && response?.data) {
        setAllTrips(response.data);
        allTripsRef.current = response.data;
        console.log(`📋 Loaded ${response.data.length} trips for global notifications`);
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
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

        // Global message handler
        const handleNewMessage = (message: any) => {
          console.log('📨 Global notification - New message:', message);

          // Only show if message is NOT from current user
          if (message.senderId?._id !== currentUserId) {
            // Use ref to get latest trips
            const trip = allTripsRef.current.find(t => t._id === message.tripId);
            const driverName = message.senderId?.name || 'Driver';
            const tripNumber = trip?.tripNumber || message.tripNumber || 'Unknown';

            // Add notification
            const notification: ChatNotification = {
              id: Date.now(),
              tripId: message.tripId,
              tripNumber: tripNumber,
              driverName: driverName,
              message: message.message || 'New message',
              timestamp: Date.now(),
            };

            setNotifications(prev => [...prev, notification]);

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
          }
        };

        socketService.onNewMessage(handleNewMessage);
        console.log('👂 Global chat notification listener active');
      })
      .catch(error => {
        console.error('❌ Global socket connection error:', error);
      });

    return () => {
      console.log('🌍 Cleaning up global chat notifications');
      socketService.offNewMessage();
      isInitialized.current = false;
    };
  }, []); // No dependencies - runs once!

  // Join all trip rooms when trips are loaded
  useEffect(() => {
    if (allTrips.length === 0 || !socketService.isConnected()) return;

    console.log(`🌍 Joining ${allTrips.length} trip rooms globally...`);
    
    allTrips.forEach(trip => {
      socketService.joinTripChat(trip._id)
        .catch(error => {
          console.error(`Failed to join trip ${trip.tripNumber}:`, error);
        });
    });
  }, [allTrips]);

  const handleNotificationClick = (notification: ChatNotification) => {
    // Navigate to trips page with the trip selected
    navigate(`/dispatch/trips`, { state: { openTripChat: notification.tripId } });
    // Remove notification
    removeNotification(notification.id);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

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

