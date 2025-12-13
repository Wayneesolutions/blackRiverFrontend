import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getSocket } from "../../../../socket/socketClient";
import { listVehicle } from "../../../../axios/api/distapcher";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import type { Libraries } from '@react-google-maps/api';
import { ChevronLeft, ChevronRight, ExternalLink, X, Search, Fuel, Gauge, MapPin, User, Activity, RefreshCw } from "lucide-react";

const containerStyle = { width: "100%", height: "100vh" };

interface Vehicle {
  _id: string;
  internalId: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  status: "moving" | "idle" | "stopped" | "maintenance";
  speed: number;
  fuelLevel: number;
  odometer: number;
  engineOn: boolean;
  currentLocation: {
    address: string;
    latitude: string | number;
    longitude: string | number;
    updatedAt: string;
  };
  driver?: {
    name: string;
  };
}

const GOOGLE_MAPS_API_KEY = "AIzaSyBE6Ii-ZxHsICvzD2Fp3m3iMPYX-Vie1N4";
const GOOGLE_MAPS_LIBRARIES: Libraries = ["marker", "places"];

const statusColors: Record<string, string> = {
  moving: "#10b981",
  idle: "#f59e0b",
  stopped: "#ef4444",
  maintenance: "#6b7280",
};

const statusBgColors: Record<string, string> = {
  moving: "#d1fae5",
  idle: "#fef3c7",
  stopped: "#fee2e2",
  maintenance: "#f3f4f6",
};

const ProfessionalFleetTracker: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-maps-api',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [search, setSearch] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState<boolean>(true);

  const socket = useMemo(() => getSocket(), []);

  // Fetch vehicles from backend
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await listVehicle();
        if (res.success) {
          const data = res.data?.vehicles || [];
          const formatted = data.map((v: Vehicle) => ({
            ...v,
            currentLocation: {
              ...v.currentLocation,
              latitude: Number(v.currentLocation.latitude),
              longitude: Number(v.currentLocation.longitude),
            },
          }));

          setVehicles(formatted);
          if (formatted.length > 0) handleVehicleClick(formatted[0]);
        }
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      }
    };
    fetchVehicles();
  }, []);

  // Handle vehicle selection
  const handleVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    const lat = Number(vehicle.currentLocation?.latitude);
    const lng = Number(vehicle.currentLocation?.longitude);

    if (!isNaN(lat) && !isNaN(lng)) setLocation({ lat, lng });

    // Leave previous vehicle updates
    socket.emit("leaveVehicle");

    // Join new vehicle updates
    socket.emit("joinVehicle", vehicle._id);

    // Listen for vehicle updates
    socket.off("vehicleLocation");
    socket.on("vehicleLocation", (data) => {
      setVehicles((prev) =>
        prev.map((v) => (v._id === data._id ? { ...v, ...data } : v))
      );

      if (vehicle._id === data._id) {
        setLocation({
          lat: Number(data.currentLocation.latitude),
          lng: Number(data.currentLocation.longitude),
        });
        setSelectedVehicle({ ...vehicle, ...data });
      }
    });
  };

  // Open info panel in new tab
  const openInNewTab = () => {
    if (!selectedVehicle) return;
    openVehicleInNewTab(selectedVehicle);
  };

  // Map pan
  const onLoad = useCallback(
    (map: google.maps.Map) => {
      if (location) map.panTo(location);
    },
    [location]
  );

  // Filter vehicles by search
  const filteredVehicles = vehicles.filter((v) =>
    v.plateNumber.toLowerCase().includes(search.toLowerCase())
  );

  // Open vehicle in new tab
  const openVehicleInNewTab = (vehicle: Vehicle) => {
    const lat = Number(vehicle.currentLocation?.latitude);
    const lng = Number(vehicle.currentLocation?.longitude);

    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15`;

    const vehicleContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Vehicle Tracker - ${vehicle.plateNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container { 
              max-width: 900px; 
              width: 100%;
              background: white; 
              border-radius: 20px; 
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, ${statusColors[vehicle.status]}, ${statusColors[vehicle.status]}dd);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 { font-size: 32px; margin-bottom: 10px; }
            .header p { opacity: 0.9; font-size: 16px; }
            .content { padding: 40px; }
            .status-badge {
              display: inline-block;
              padding: 8px 20px;
              border-radius: 25px;
              font-size: 14px;
              font-weight: 700;
              margin: 20px 0;
              background: ${statusBgColors[vehicle.status]};
              color: ${statusColors[vehicle.status]};
            }
            .metrics {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 20px;
              margin: 30px 0;
            }
            .metric-card {
              background: #f9fafb;
              padding: 20px;
              border-radius: 12px;
              border-left: 4px solid ${statusColors[vehicle.status]};
            }
            .metric-label {
              color: #6b7280;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            .metric-value {
              color: #1f2937;
              font-size: 24px;
              font-weight: 700;
            }
            .info-section {
              background: #f9fafb;
              padding: 25px;
              border-radius: 12px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 15px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .info-row:last-child { border-bottom: none; }
            .label { color: #6b7280; font-weight: 600; }
            .value { color: #1f2937; font-weight: 700; text-align: right; }
            .map-button {
              display: inline-block;
              background: ${statusColors[vehicle.status]};
              color: white;
              padding: 15px 30px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: 600;
              margin-top: 20px;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .map-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            .timestamp {
              text-align: center;
              color: #9ca3af;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 ${vehicle.plateNumber}</h1>
              <p>${vehicle.make} ${vehicle.model} (${vehicle.year})</p>
              <div class="status-badge">${vehicle.status.toUpperCase()}</div>
            </div>
            
            <div class="content">
              <div class="metrics">
                <div class="metric-card">
                  <div class="metric-label">Speed</div>
                  <div class="metric-value">${vehicle.speed} <span style="font-size: 16px;">km/h</span></div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Fuel Level</div>
                  <div class="metric-value">${vehicle.fuelLevel} <span style="font-size: 16px;">%</span></div>
                </div>
                <div class="metric-card">
                  <div class="metric-label">Odometer</div>
                  <div class="metric-value">${(vehicle.odometer / 1000).toFixed(1)} <span style="font-size: 16px;">k km</span></div>
                </div>
              </div>

              <div class="info-section">
                <div class="info-row">
                  <span class="label">Engine Status</span>
                  <span class="value" style="color: ${vehicle.engineOn ? '#10b981' : '#ef4444'}">
                    ${vehicle.engineOn ? '✓ Running' : '✗ Off'}
                  </span>
                </div>
                ${vehicle.driver ? `
                <div class="info-row">
                  <span class="label">Driver</span>
                  <span class="value">${vehicle.driver.name}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="label">Internal ID</span>
                  <span class="value">${vehicle.internalId}</span>
                </div>
                <div class="info-row">
                  <span class="label">Current Location</span>
                  <span class="value" style="max-width: 60%; text-align: right;">${vehicle.currentLocation?.address}</span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${mapUrl}" target="_blank" class="map-button">
                  📍 View on Google Maps
                </a>
              </div>

              <div class="timestamp">
                Last updated: ${new Date(vehicle.currentLocation?.updatedAt).toLocaleString()}
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const newWindow = window.open('', '_blank', 'width=1000,height=800');
    if (newWindow) {
      newWindow.document.write(vehicleContent);
      newWindow.document.close();
    }
  };

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div
        className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-96" : "w-0"
          } overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Fleet Tracker
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
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
                placeholder="Search by plate number..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Vehicle List */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No vehicles found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVehicles.map((v) => (
                  <div
                    key={v._id}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 relative group ${selectedVehicle?._id === v._id
                        ? "bg-blue-50 border-blue-400 shadow-md"
                        : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm"
                      }`}
                  >
                    {/* Open in New Tab Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openVehicleInNewTab(v);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-50 z-10"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                    </button>

                    <div onClick={() => handleVehicleClick(v)}>
                      {/* Plate Number & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-800">
                          {v.plateNumber}
                        </h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: statusBgColors[v.status],
                            color: statusColors[v.status],
                          }}
                        >
                          {v.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Vehicle Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="w-4 h-4" />
                          <span>
                            {v?.driver ? v?.driver?.name : "No driver assigned"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{v.currentLocation?.address}</span>
                        </div>
                        <div className="flex items-center justify-between text-gray-500 mt-2 pt-2 border-t border-gray-200">
                          <span className="flex items-center gap-1">
                            <Gauge className="w-4 h-4" />
                            {v.speed} km/h
                          </span>
                          <span className="flex items-center gap-1">
                            <Fuel className="w-4 h-4" />
                            {v.fuelLevel}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button (when closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-3 rounded-r-lg shadow-lg hover:bg-blue-700 transition-colors z-10"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Right Map */}
      <div className="flex-1 relative">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={location || { lat: 20.5937, lng: 78.9629 }}
            zoom={location ? 12 : 5}
            onLoad={onLoad}
          >
            {selectedVehicle && location && (
              <Marker
                position={location}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: statusColors[selectedVehicle.status] || "blue",
                  fillOpacity: 0.9,
                  strokeWeight: 2,
                  strokeColor: "white",
                }}
              />
            )}
          </GoogleMap>
        )}

        {/* Advanced Info Panel */}
        {selectedVehicle && isInfoPanelOpen && (
          <div className="absolute top-6 right-6 bg-white rounded-2xl shadow-2xl w-96 overflow-hidden border border-gray-200">
            {/* Header */}
            <div
              className="p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${statusColors[selectedVehicle.status]}, ${statusColors[selectedVehicle.status]}dd)`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold">{selectedVehicle.plateNumber}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={openInNewTab}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Open selected vehicle in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsInfoPanelOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm opacity-90">
                {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
              </p>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              {/* Status Row */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Status</span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: statusBgColors[selectedVehicle.status],
                    color: statusColors[selectedVehicle.status],
                  }}
                >
                  {selectedVehicle.status.toUpperCase()}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <Gauge className="w-4 h-4" />
                    <span className="text-xs font-medium">Speed</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedVehicle.speed} <span className="text-sm">km/h</span>
                  </p>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <Fuel className="w-4 h-4" />
                    <span className="text-xs font-medium">Fuel</span>
                  </div>
                  <p className="text-xl font-bold text-gray-800">
                    {selectedVehicle.fuelLevel} <span className="text-sm">%</span>
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Odometer</span>
                  <span className="font-semibold text-gray-800">
                    {selectedVehicle.odometer.toLocaleString()} km
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Engine</span>
                  <span
                    className={`font-semibold ${selectedVehicle.engineOn ? "text-green-600" : "text-red-600"
                      }`}
                  >
                    {selectedVehicle.engineOn ? "On ✓" : "Off ✗"}
                  </span>
                </div>

                {selectedVehicle.driver && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Driver</span>
                    <span className="font-semibold text-gray-800">
                      {selectedVehicle.driver.name}
                    </span>
                  </div>
                )}

                <div className="py-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="text-sm text-gray-800">
                        {selectedVehicle.currentLocation?.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reopen Info Panel Button */}
        {selectedVehicle && !isInfoPanelOpen && (
          <button
            onClick={() => setIsInfoPanelOpen(true)}
            className="absolute top-6 right-6 bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
            title="Show vehicle info"
          >
            <Activity className="w-5 h-5 text-blue-600" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfessionalFleetTracker;