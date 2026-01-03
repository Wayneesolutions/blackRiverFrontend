import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RefreshCw, Route, Search, ChevronLeft, ChevronRight, MapPin, X, Truck } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { getActiveOrdersWithTracking } from '../../../../axios/api/distapcher';
import { getSocket } from '../../../../socket/socketClient';

// Type definitions - based on Order model
interface RouteWaypoint {
  type: 'pickup' | 'delivery';
  orderNumber: string;
  customerOrderNo?: string;
  lat: number;
  lng: number;
  address: string;
  orderId: string;
}

interface ActiveOrderGroup {
  _id: string;
  driverId: string;
  driver: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  coDriver?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  truck?: {
    _id: string;
    plateNumber: string;
    make: string;
    model: string;
    unitNumber: string;
    internalId: string;
    trackingKey?: string;
  };
  trailer?: {
    _id: string;
    plateNumber: string;
    unitNumber: string;
  };
  orders: Array<{
    _id: string;
    orderNumber: string;
    customerOrderNo?: string;
    tripNo?: string;
    status: string;
    pickupDate?: string;
    deliveryDate?: string;
  }>;
  routeWaypoints: RouteWaypoint[];
  currentLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  speed: number;
  engineOn: boolean;
  orderCount: number;
}

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";
const GOOGLE_MAPS_LIBRARIES: Libraries = ["marker", "places"];




const ProfessionalTripTracker: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-api',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [orderGroups, setOrderGroups] = useState<ActiveOrderGroup[]>([]);
  const [selectedOrderGroup, setSelectedOrderGroup] = useState<ActiveOrderGroup | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsRequest, setDirectionsRequest] = useState<google.maps.DirectionsRequest | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const socket = useMemo(() => getSocket(), []);

  // Fetch active orders from backend
  const fetchOrdersData = useCallback(async () => {
    try {
      const isInitialLoad = isInitialLoadRef.current;

      // Only show loading spinner on initial load
      if (isInitialLoad) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }

      const response = await getActiveOrdersWithTracking();

      if (response?.success && response?.data) {
        const orderGroupsData = Array.isArray(response.data) ? response.data : [];
        setOrderGroups(orderGroupsData);

        // Auto-select first order group if none selected (only on initial load)
        if (isInitialLoad && orderGroupsData.length > 0 && !selectedOrderGroup) {
          const firstGroup = orderGroupsData[0];
          setSelectedOrderGroup(firstGroup);
        } else if (selectedOrderGroup) {
          // Refresh selected order group if it still exists
          const updatedGroup = orderGroupsData.find((g: ActiveOrderGroup) => g.driverId === selectedOrderGroup.driverId);
          if (updatedGroup) {
            setSelectedOrderGroup(updatedGroup);
          } else {
            // Order group no longer in the list, clear selection
            setSelectedOrderGroup(null);
            setDirectionsResult(null);
            setDirectionsRequest(null);
          }
        }
      } else {
        setOrderGroups([]);
      }
    } catch (err) {
      console.error('Error fetching active orders:', err);
      setOrderGroups([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOrderGroup]);

  useEffect(() => {
    // Initial load
    fetchOrdersData();

    // Refresh orders every 10 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchOrdersData();
    }, 10000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchOrdersData]);

  // Set up socket for real-time vehicle location updates
  useEffect(() => {
    if (!selectedOrderGroup?.truck?.trackingKey) return;

    // Leave previous vehicle updates
    socket.emit("leaveVehicle");

    // Join vehicle updates
    const vehicleId = selectedOrderGroup.truck.trackingKey || selectedOrderGroup.truck.internalId || selectedOrderGroup.truck._id;
    socket.emit("joinVehicle", vehicleId);

    // Listen for vehicle location updates
    socket.off("vehicleLocation");
    socket.on("vehicleLocation", (data) => {
      if (selectedOrderGroup && data._id === selectedOrderGroup.truck?._id) {
        setSelectedOrderGroup(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentLocation: data.currentLocation ? {
              lat: Number(data.currentLocation.latitude || 0),
              lng: Number(data.currentLocation.longitude || 0),
              address: data.currentLocation.address || ''
            } : prev.currentLocation,
            speed: data.speed || prev.speed,
            engineOn: data.engineOn !== undefined ? data.engineOn : prev.engineOn
          };
        });
      }
    });

    return () => {
      socket.emit("leaveVehicle");
      socket.off("vehicleLocation");
    };
  }, [socket, selectedOrderGroup?.truck?._id, selectedOrderGroup?.truck?.trackingKey]);

  // Get current location from order group (truck's current location)
  const getCurrentLocation = useCallback((group: ActiveOrderGroup | null): { lat: number; lng: number } | null => {
    if (!group || !group.currentLocation) return null;
    return { lat: group.currentLocation.lat, lng: group.currentLocation.lng };
  }, []);

  // Handle order group selection
  const handleOrderGroupClick = useCallback((group: ActiveOrderGroup) => {
    if (selectedOrderGroup?.driverId === group.driverId) {
      console.log('🚛 Order group already selected, skipping');
      return;
    }

    console.log('🚛 Order group selected for driver:', group.driver.name);

    setSelectedOrderGroup(group);
    setDirectionsResult(null);
    setDirectionsRequest(null);

    // Center map on current location or first waypoint
    const currentLocation = getCurrentLocation(group);
    const centerLocation = currentLocation || (group.routeWaypoints.length > 0 ? {
      lat: group.routeWaypoints[0].lat,
      lng: group.routeWaypoints[0].lng
    } : null);

    if (centerLocation && map) {
      map.setCenter(centerLocation);
      map.setZoom(12);
      console.log('🗺️ Map centered on order group location');
    }
  }, [map, getCurrentLocation, selectedOrderGroup]);

  // Filter order groups by search
  const filteredOrderGroups = useMemo(() => {
    if (!searchTerm) return orderGroups;
    const lowerSearch = searchTerm.toLowerCase();
    return orderGroups.filter((group) =>
      group.driver.name.toLowerCase().includes(lowerSearch) ||
      group.truck?.plateNumber?.toLowerCase().includes(lowerSearch) ||
      group.truck?.unitNumber?.toLowerCase().includes(lowerSearch) ||
      group.orders.some(o => o.orderNumber.toLowerCase().includes(lowerSearch)) ||
      group.orders.some(o => o.customerOrderNo?.toLowerCase().includes(lowerSearch))
    );
  }, [orderGroups, searchTerm]);

  // Get route waypoints from order group (already combined by backend)
  const getRouteWaypoints = useCallback((group: ActiveOrderGroup | null): Array<{ lat: number; lng: number; label: string; type: string }> => {
    if (!group || !group.routeWaypoints || group.routeWaypoints.length === 0) return [];
    
    return group.routeWaypoints.map((wp) => ({
      lat: wp.lat,
      lng: wp.lng,
      label: `${wp.type === 'pickup' ? 'Pickup' : 'Delivery'}: ${wp.orderNumber}`,
      type: wp.type
    }));
  }, []);

  // Build directions request for planned route
  const buildDirectionsRequest = useCallback((group: ActiveOrderGroup | null): google.maps.DirectionsRequest | null => {
    if (!group || !isLoaded || !window.google?.maps) return null;

    const waypointsList = getRouteWaypoints(group);
    if (waypointsList.length < 2) return null; // Need at least 2 waypoints

    const startWaypoint = waypointsList[0];
    const endWaypoint = waypointsList[waypointsList.length - 1];

    if (!startWaypoint || !endWaypoint) return null;

    // Get intermediate waypoints (skip first and last)
    const intermediateWaypoints = waypointsList
      .slice(1, -1)
      .map(w => ({
        location: new window.google.maps.LatLng(w.lat, w.lng),
        stopover: true,
      }));

    return {
      origin: new window.google.maps.LatLng(startWaypoint.lat, startWaypoint.lng),
      destination: new window.google.maps.LatLng(endWaypoint.lat, endWaypoint.lng),
      waypoints: intermediateWaypoints.length > 0 ? intermediateWaypoints : undefined,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false,
    };
  }, [isLoaded, getRouteWaypoints]);

  // Directions callback
  const directionsCallback = useCallback((result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === google.maps.DirectionsStatus.OK) {
      setDirectionsResult(result);
    } else {
      console.error('Directions request failed:', status);
      setDirectionsResult(null);
    }
  }, []);

  // Update directions request when order group changes
  useEffect(() => {
    if (selectedOrderGroup && isLoaded) {
      const request = buildDirectionsRequest(selectedOrderGroup);
      setDirectionsRequest(request);
    } else {
      setDirectionsRequest(null);
      setDirectionsResult(null);
    }
  }, [selectedOrderGroup, isLoaded, buildDirectionsRequest]);

  // Early returns AFTER all hooks
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Error loading Google Maps</p>
          <p className="text-gray-500">{loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Compute values after early returns
  const currentLocation = getCurrentLocation(selectedOrderGroup);
  const waypoints = getRouteWaypoints(selectedOrderGroup);

  return (
    <div className="flex h-screen bg-[#EDF8FF]">
      {/* Left Sidebar */}
      <div
        className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${sidebarCollapsed ? "w-0" : "w-72"
          } overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-[linear-gradient(90deg,#42aeec_0%,#1db5f5_40%,#0ea3d8_100%)] p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Route className="w-5 h-5" />
              Order Tracker
            </h2>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by driver, truck, order number..."
              className="w-full pl-10 pr-4 py-1.5 text-sm rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Order Group List */}
        <div className="flex-1 overflow-y-auto p-3 bg-[#EDF8FF]">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading active orders...</p>
            </div>
          ) : filteredOrderGroups.length === 0 ? (
            <div className="text-center py-8">
              <Route className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No active orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrderGroups.map((group) => (
                <div
                  key={group.driverId}
                  className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${selectedOrderGroup?.driverId === group.driverId
                    ? "bg-[#EDF8FF] border-[#42aeec] shadow-md"
                    : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                    }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOrderGroupClick(group);
                  }}
                >
                  {/* Driver Name & Order Count */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-base text-gray-800">
                      {group.driver.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {group.orderCount} {group.orderCount === 1 ? 'Order' : 'Orders'}
                    </span>
                  </div>

                  {/* Order Group Details */}
                  <div className="space-y-1 text-xs">
                    {group.truck && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Truck className="w-3 h-3" />
                        <span>
                          {group.truck.plateNumber || group.truck.unitNumber || 'N/A'}
                          {group.truck.make && group.truck.model && ` - ${group.truck.make} ${group.truck.model}`}
                        </span>
                      </div>
                    )}
                    {group.currentLocation && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <MapPin className="w-3 h-3" />
                        <span>Live tracking active</span>
                      </div>
                    )}
                    {group.routeWaypoints.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Route className="w-3 h-3" />
                        <span>{group.routeWaypoints.length} stops</span>
                      </div>
                    )}
                    {group.orders.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-gray-500 mb-1">Orders:</p>
                        {group.orders.slice(0, 2).map(order => (
                          <p key={order._id} className="text-gray-600 text-xs">
                            • {order.orderNumber}
                          </p>
                        ))}
                        {group.orders.length > 2 && (
                          <p className="text-gray-500 text-xs">+{group.orders.length - 2} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Toggle Button (when collapsed) */}
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-[#0ea3d8] text-white p-2 rounded-r-lg shadow-lg hover:bg-[#0ea3d8]/90 transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Right Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={currentLocation || (waypoints.length > 0 ? { lat: waypoints[0].lat, lng: waypoints[0].lng } : { lat: 20.5937, lng: 78.9629 })}
          zoom={currentLocation || waypoints.length > 0 ? 12 : 5}
          onLoad={(mapInstance) => {
            setMap(mapInstance);
            if (currentLocation) {
              mapInstance.setCenter(currentLocation);
            } else if (waypoints.length > 0) {
              mapInstance.setCenter({ lat: waypoints[0].lat, lng: waypoints[0].lng });
            }
          }}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          {/* Planned Route (from Directions Service) */}
          {directionsRequest && (
            <DirectionsService
              options={directionsRequest}
              callback={directionsCallback}
            />
          )}

          {/* Render Planned Route */}
          {directionsResult && (
            <DirectionsRenderer
              options={{
                directions: directionsResult,
                polylineOptions: {
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.7,
                  strokeWeight: 5,
                  zIndex: 1,
                },
                suppressMarkers: true, // We'll use our own markers
              }}
            />
          )}

          {/* Current Truck Location Marker */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              title={`Current Truck Location${selectedOrderGroup?.truck ? ` - ${selectedOrderGroup.truck.plateNumber}` : ''}`}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: '#10b981',
                fillOpacity: 1,
                strokeWeight: 4,
                strokeColor: '#ffffff',
              }}
              zIndex={10}
            />
          )}

          {/* Route Waypoints (Pickup and Delivery) */}
          {waypoints.map((waypoint, index) => (
            <Marker
              key={`waypoint-${index}-${waypoint.lat}-${waypoint.lng}`}
              position={{ lat: waypoint.lat, lng: waypoint.lng }}
              label={{
                text: waypoint.label,
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: waypoint.type === 'pickup' ? '#3b82f6' : '#f59e0b',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              }}
              zIndex={5}
            />
          ))}
        </GoogleMap>

        {/* Order Group Info Panel */}
        {selectedOrderGroup && (
          <div className="absolute top-6 right-6 bg-white rounded-xl shadow-2xl w-80 overflow-hidden border border-gray-200 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="p-3 text-white bg-[linear-gradient(90deg,#42aeec_0%,#1db5f5_40%,#0ea3d8_100%)]">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold truncate">{selectedOrderGroup.driver.name}</h3>
                <button
                  onClick={() => {
                    setSelectedOrderGroup(null);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs opacity-90 truncate">
                {selectedOrderGroup.orders.length} {selectedOrderGroup.orders.length === 1 ? 'Order' : 'Orders'}
              </p>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-[#EDF8FF] rounded-lg">
                  <div className="flex items-center gap-1 text-blue-600 mb-0.5">
                    <Route className="w-3 h-3" />
                    <span className="text-xs font-medium">Stops</span>
                  </div>
                  <p className="text-base font-bold text-gray-800">
                    {selectedOrderGroup.routeWaypoints.length}
                  </p>
                </div>
                {selectedOrderGroup.currentLocation && (
                  <div className="p-2 bg-[#EDF8FF] rounded-lg">
                    <div className="flex items-center gap-1 text-green-600 mb-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs font-medium">Live</span>
                    </div>
                    <p className="text-base font-bold text-gray-800">
                      {selectedOrderGroup.speed} km/h
                    </p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                {selectedOrderGroup.truck && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Truck</span>
                    <span className="font-semibold text-gray-800 text-sm truncate ml-2">
                      {selectedOrderGroup.truck.plateNumber || selectedOrderGroup.truck.unitNumber || 'N/A'}
                    </span>
                  </div>
                )}
                {selectedOrderGroup.coDriver && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Co-Driver</span>
                    <span className="font-semibold text-gray-800 text-sm truncate ml-2">
                      {selectedOrderGroup.coDriver.name}
                    </span>
                  </div>
                )}
                {selectedOrderGroup.currentLocation && (
                  <div className="py-1.5">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Current Location</p>
                        <p className="text-xs text-gray-800 truncate">
                          {selectedOrderGroup.currentLocation.address || 'Location tracking active'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Orders List */}
                {selectedOrderGroup.orders.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Orders:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedOrderGroup.orders.map(order => (
                        <div key={order._id} className="p-2 bg-gray-50 rounded text-xs">
                          <p className="font-semibold text-gray-800">{order.orderNumber}</p>
                          {order.customerOrderNo && (
                            <p className="text-gray-600">Cust: {order.customerOrderNo}</p>
                          )}
                          {order.tripNo && (
                            <p className="text-gray-500 text-xs">Trip: {order.tripNo}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalTripTracker;

