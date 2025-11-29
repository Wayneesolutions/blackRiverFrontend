import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { RefreshCw, Route, Search, ChevronLeft, ChevronRight, MapPin, User, X, Truck, Clock } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Marker, Polyline, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import { listTrip, getTripById } from '../../../../axios/api/distapcher';

// Type definitions
interface Trip {
  _id: string;
  tripNumber: string;
  driver?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  truck?: {
    _id: string;
    licensePlate?: string;
    unitNo?: string;
    makeModel?: string;
    internalId?: string;
  };
  trailer?: {
    _id: string;
    licensePlate?: string;
    unitNo?: string;
    makeModel?: string;
  };
  status: 'planned' | 'in-progress' | 'completed' | 'cancelled';
  actualStartDate?: string;
  actualEndDate?: string;
  plannedStartDate?: string;
  startLocation?: {
    place?: string;
    latitude?: string;
    longitude?: string;
  };
  endLocation?: {
    place?: string;
    latitude?: string;
    longitude?: string;
  };
  traveledPath?: Array<{
    latitude: string;
    longitude: string;
    timestamp: Date | string;
    speed?: number;
    odometer?: number;
  }>;
  orders?: Array<{
    _id: string;
    orderNumber: string;
    pickupLocation?: any;
    deliveryLocation?: any;
  }>;
}

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";
const GOOGLE_MAPS_LIBRARIES: Libraries = ["marker", "places"];

const statusColors: Record<string, string> = {
  'in-progress': "#10b981",
  'planned': "#3b82f6",
  'completed': "#6b7280",
  'cancelled': "#ef4444",
};

const statusBgColors: Record<string, string> = {
  'in-progress': "#d1fae5",
  'planned': "#dbeafe",
  'completed': "#f3f4f6",
  'cancelled': "#fee2e2",
};

const ProfessionalTripTracker: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-api',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [tripDetails, setTripDetails] = useState<Trip | null>(null);
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsRequest, setDirectionsRequest] = useState<google.maps.DirectionsRequest | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch trips from backend
  const fetchTripsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await listTrip({ 
        status: 'in-progress',
        limit: 100 
      });
      
      if (response?.success && response?.data) {
        const tripData = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setTrips(tripData);
        
        // Auto-select first trip if none selected
        if (tripData.length > 0 && !selectedTrip) {
          handleTripClick(tripData[0]);
        } else if (selectedTrip) {
          // Refresh selected trip details
          const updatedTrip = tripData.find((t: Trip) => t._id === selectedTrip._id);
          if (updatedTrip) {
            await loadTripDetails(updatedTrip._id);
          }
        }
      } else {
        setTrips([]);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTrip]);

  // Load detailed trip information including traveledPath
  const loadTripDetails = useCallback(async (tripId: string) => {
    try {
      const response = await getTripById(tripId);
      if (response?.success && response?.data) {
        setTripDetails(response.data);
        return response.data;
      }
    } catch (err) {
      console.error('Error loading trip details:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchTripsData();
    
    // Refresh trips every 10 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchTripsData();
    }, 10000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchTripsData]);

  // Helper to extract coordinates from location (checks both direct and placeId)
  const extractCoordinates = useCallback((location: any): { lat: number; lng: number } | null => {
    if (!location) return null;
    
    // Try direct latitude/longitude first
    if (location.latitude && location.longitude) {
      const lat = parseFloat(location.latitude);
      const lng = parseFloat(location.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Try placeId's currentLocation
    if (location.placeId?.currentLocation) {
      const loc = location.placeId.currentLocation;
      if (loc.latitude && loc.longitude) {
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    
    return null;
  }, []);

  // Get current trip location (from traveledPath or startLocation)
  const getCurrentTripLocation = useCallback((trip: Trip | null): { lat: number; lng: number } | null => {
    if (!trip) return null;
    
    // If trip has traveled path, use the latest coordinate
    if (trip.traveledPath && trip.traveledPath.length > 0) {
      const lastPoint = trip.traveledPath[trip.traveledPath.length - 1];
      if (lastPoint.latitude && lastPoint.longitude) {
        const lat = parseFloat(lastPoint.latitude);
        const lng = parseFloat(lastPoint.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { lat, lng };
        }
      }
    }
    
    // Otherwise, use start location (check both direct and placeId)
    const startCoords = extractCoordinates(trip.startLocation);
    if (startCoords) return startCoords;
    
    // If no start location, try first order's pickup location
    if (trip.orders && trip.orders.length > 0) {
      const firstOrder = trip.orders[0];
      const pickupCoords = extractCoordinates(firstOrder.pickupLocation);
      if (pickupCoords) return pickupCoords;
    }
    
    return null;
  }, [extractCoordinates]);

  // Handle trip selection
  const handleTripClick = useCallback(async (trip: Trip) => {
    console.log('🚛 Trip selected:', trip.tripNumber);
    setSelectedTrip(trip);
    
    // Load full trip details including traveledPath
    const details = await loadTripDetails(trip._id);
    if (details) {
      setTripDetails(details);
    }
    
    // Center map on trip's current location or start location
    const currentLocation = getCurrentTripLocation(details || trip);
    if (currentLocation && map) {
      map.setCenter(currentLocation);
      map.setZoom(13);
      console.log('🗺️ Map centered on trip location');
    }
  }, [map, loadTripDetails, getCurrentTripLocation]);

  // Filter trips by search
  const filteredTrips = useMemo(() => {
    if (!searchTerm) return trips;
    const lowerSearch = searchTerm.toLowerCase();
    return trips.filter((trip) => 
      trip.tripNumber.toLowerCase().includes(lowerSearch) ||
      trip.driver?.name.toLowerCase().includes(lowerSearch) ||
      trip.truck?.licensePlate?.toLowerCase().includes(lowerSearch) ||
      trip.truck?.unitNo?.toLowerCase().includes(lowerSearch)
    );
  }, [trips, searchTerm]);

  // Get traveled path coordinates for map polyline
  const getTraveledPathCoordinates = useCallback((trip: Trip | null): Array<{ lat: number; lng: number }> => {
    if (!trip) return [];
    
    // If trip has traveledPath, use it
    if (trip.traveledPath && trip.traveledPath.length > 0) {
      return trip.traveledPath
        .filter(point => point.latitude && point.longitude)
        .map(point => {
          const lat = parseFloat(point.latitude);
          const lng = parseFloat(point.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
          return null;
        })
        .filter((point): point is { lat: number; lng: number } => point !== null);
    }
    
    // If no traveledPath but we have start and end locations, create a simple route
    const startCoords = extractCoordinates(trip.startLocation);
    const endCoords = extractCoordinates(trip.endLocation);
    
    if (startCoords && endCoords) {
      // Generate a simple straight line path between start and end
      const numPoints = 20;
      const path: Array<{ lat: number; lng: number }> = [];
      
      for (let i = 0; i <= numPoints; i++) {
        const ratio = i / numPoints;
        path.push({
          lat: startCoords.lat + (endCoords.lat - startCoords.lat) * ratio,
          lng: startCoords.lng + (endCoords.lng - startCoords.lng) * ratio
        });
      }
      
      return path;
    }
    
    return [];
  }, [extractCoordinates]);

  // Get route waypoints (from orders, start, end locations)
  const getRouteWaypoints = useCallback((trip: Trip | null): Array<{ lat: number; lng: number; label: string }> => {
    if (!trip) return [];
    
    const waypoints: Array<{ lat: number; lng: number; label: string }> = [];
    
    // Add start location (always show if available)
    const startCoords = extractCoordinates(trip.startLocation);
    if (startCoords) {
      waypoints.push({
        ...startCoords,
        label: 'Start'
      });
    }
    
    // Add order locations
    if (trip.orders && trip.orders.length > 0) {
      trip.orders.forEach((order) => {
        const pickupCoords = extractCoordinates(order.pickupLocation);
        if (pickupCoords) {
          waypoints.push({
            ...pickupCoords,
            label: `Pickup: ${order.orderNumber}`
          });
        }
        
        const deliveryCoords = extractCoordinates(order.deliveryLocation);
        if (deliveryCoords) {
          waypoints.push({
            ...deliveryCoords,
            label: `Delivery: ${order.orderNumber}`
          });
        }
      });
    }
    
    // Add end location (always show if available)
    const endCoords = extractCoordinates(trip.endLocation);
    if (endCoords) {
      waypoints.push({
        ...endCoords,
        label: 'End'
      });
    }
    
    return waypoints;
  }, [extractCoordinates]);

  // Build directions request for planned route
  const buildDirectionsRequest = useCallback((trip: Trip | null): google.maps.DirectionsRequest | null => {
    if (!trip || !isLoaded || !window.google?.maps) return null;
    
    const waypointsList = getRouteWaypoints(trip);
    if (waypointsList.length < 2) return null; // Need at least start and end
    
    const startWaypoint = waypointsList.find(w => w.label === 'Start');
    const endWaypoint = waypointsList.find(w => w.label === 'End') || waypointsList[waypointsList.length - 1];
    
    if (!startWaypoint || !endWaypoint) return null;
    
    // Get intermediate waypoints (pickup and delivery points)
    const intermediateWaypoints = waypointsList
      .filter(w => w.label !== 'Start' && w.label !== 'End')
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

  // Update directions request when trip changes
  useEffect(() => {
    const trip = tripDetails || selectedTrip;
    if (trip && isLoaded) {
      const request = buildDirectionsRequest(trip);
      setDirectionsRequest(request);
    } else {
      setDirectionsRequest(null);
      setDirectionsResult(null);
    }
  }, [tripDetails, selectedTrip, isLoaded, buildDirectionsRequest]);

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
  const currentLocation = getCurrentTripLocation(tripDetails || selectedTrip);
  const traveledPath = getTraveledPathCoordinates(tripDetails || selectedTrip);
  const waypoints = getRouteWaypoints(tripDetails || selectedTrip);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div
        className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-0" : "w-96"
        } overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Route className="w-6 h-6" />
              Trip Tracker
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by trip number, driver, truck..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Trip List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading trips...</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8">
              <Route className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No active trips found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map((trip) => (
                <div
                  key={trip._id}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                    selectedTrip?._id === trip._id
                      ? "bg-purple-50 border-purple-400 shadow-md"
                      : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                  }`}
                  onClick={() => handleTripClick(trip)}
                >
                  {/* Trip Number & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-800">
                      {trip.tripNumber}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: statusBgColors[trip.status],
                        color: statusColors[trip.status],
                      }}
                    >
                      {trip.status.toUpperCase().replace('-', ' ')}
                    </span>
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-2 text-sm">
                    {trip.driver && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{trip.driver.name}</span>
                      </div>
                    )}
                    {trip.truck && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Truck className="w-4 h-4" />
                        <span>
                          {trip.truck.licensePlate || trip.truck.unitNo || 'N/A'}
                          {trip.truck.makeModel && ` - ${trip.truck.makeModel}`}
                        </span>
                      </div>
                    )}
                    {trip.actualStartDate && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>
                          Started: {new Date(trip.actualStartDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {tripDetails?._id === trip._id && tripDetails?.traveledPath && tripDetails.traveledPath.length > 0 && (
                      <div className="flex items-center gap-2 text-purple-600 font-medium">
                        <MapPin className="w-4 h-4" />
                        <span>{tripDetails.traveledPath.length} location points tracked</span>
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
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white p-3 rounded-r-lg shadow-lg hover:bg-purple-700 transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Right Map */}
      <div className="flex-1 relative">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={currentLocation || { lat: 20.5937, lng: 78.9629 }}
          zoom={currentLocation ? 13 : 5}
          onLoad={(mapInstance) => {
            setMap(mapInstance);
            if (currentLocation) {
              mapInstance.setCenter(currentLocation);
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
                  strokeOpacity: 0.6,
                  strokeWeight: 5,
                  zIndex: 1,
                },
                suppressMarkers: true, // We'll use our own markers
              }}
            />
          )}

          {/* Traveled Path Polyline */}
          {traveledPath.length > 1 && (
            <Polyline
              path={traveledPath}
              options={{
                strokeColor: '#8b5cf6',
                strokeOpacity: 0.9,
                strokeWeight: 4,
                geodesic: true,
                zIndex: 2, // Above planned route
              }}
            />
          )}

          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: '#8b5cf6',
                fillOpacity: 1,
                strokeWeight: 3,
                strokeColor: '#ffffff',
              }}
              zIndex={10}
            />
          )}

          {/* Route Waypoints (Start, Pickup, Delivery, End) */}
          {waypoints.map((waypoint, index) => (
            <Marker
              key={`waypoint-${index}`}
              position={{ lat: waypoint.lat, lng: waypoint.lng }}
              label={{
                text: waypoint.label,
                color: '#fff',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: waypoint.label === 'Start' ? '#10b981' : 
                          waypoint.label.startsWith('Pickup') ? '#3b82f6' :
                          waypoint.label.startsWith('Delivery') ? '#f59e0b' : '#ef4444',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#ffffff',
              }}
              zIndex={5}
            />
          ))}
        </GoogleMap>

        {/* Trip Info Panel */}
        {selectedTrip && tripDetails && (
          <div className="absolute top-6 right-6 bg-white rounded-xl shadow-2xl w-72 overflow-hidden border border-gray-200 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="p-3 text-white bg-gradient-to-r from-purple-600 to-purple-700">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold truncate">{selectedTrip.tripNumber}</h3>
                <button
                  onClick={() => {
                    setSelectedTrip(null);
                    setTripDetails(null);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs opacity-90 truncate">
                {selectedTrip.driver?.name || 'No driver assigned'}
              </p>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* Status */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-gray-600 text-sm font-medium">Status</span>
                <span
                  className="px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: statusBgColors[selectedTrip.status],
                    color: statusColors[selectedTrip.status],
                  }}
                >
                  {selectedTrip.status.toUpperCase().replace('-', ' ')}
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2">
                {tripDetails.traveledPath && tripDetails.traveledPath.length > 0 && (
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-1 text-purple-600 mb-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs font-medium">Points</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">
                      {tripDetails.traveledPath.length}
                    </p>
                  </div>
                )}
                {selectedTrip.orders && (
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-1 text-blue-600 mb-0.5">
                      <Route className="w-3 h-3" />
                      <span className="text-xs font-medium">Orders</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedTrip.orders.length}
                    </p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                {selectedTrip.truck && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Truck</span>
                    <span className="font-semibold text-gray-800 text-sm truncate ml-2">
                      {selectedTrip.truck.licensePlate || selectedTrip.truck.unitNo || 'N/A'}
                    </span>
                  </div>
                )}
                {selectedTrip.actualStartDate && (
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600 text-sm">Started</span>
                    <span className="font-semibold text-gray-800 text-xs text-right">
                      {new Date(selectedTrip.actualStartDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedTrip.startLocation && (
                  <div className="py-1.5">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Start</p>
                        <p className="text-xs text-gray-800 truncate">
                          {selectedTrip.startLocation.place || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {selectedTrip.endLocation && (
                  <div className="py-1.5">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">End</p>
                        <p className="text-xs text-gray-800 truncate">
                          {selectedTrip.endLocation.place || 'N/A'}
                        </p>
                      </div>
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

