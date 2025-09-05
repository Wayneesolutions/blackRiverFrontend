import React, { useState } from 'react';
import { ChevronDown, Search, Users, MapPin, Navigation, Maximize2, Minus, Plus } from 'lucide-react';

const VehicleMapInterface = () => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const [sortByStatus, setSortByStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample vehicle data
  const vehicles = [
    {
      id: '1003',
      name: 'Surinder Singh',
      location: '9754 Commerce Rd, Landon, on HD',
      status: 'Global',
      speed: '50KM/H',
      coordinates: { lat: -15.7801, lng: -47.9292 }
    },
    {
      id: '1003',
      name: 'Surinder Singh',
      location: '9754 Commerce Rd, Landon, on HD',
      status: 'Global',
      speed: '50KM/H',
      coordinates: { lat: -16.2801, lng: -48.4292 }
    }
  ];

  const groups = ['All Groups', 'Fleet A', 'Fleet B', 'Training', 'Service'];
  const assets = ['All Assets', 'Trucks', 'Vans', 'Cars', 'Motorcycles'];
  const filters = ['All Filters', 'Online', 'Offline', 'Moving', 'Stopped'];
  const statusOptions = ['All Status', 'Active', 'Inactive', 'Maintenance'];

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Filter Controls */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            {/* Groups Dropdown */}
            <div className="relative">
              <select 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">Groups</option>
                {groups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Asset Dropdown */}
            <div className="relative">
              <select 
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">Asset</option>
                {assets.map(asset => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filters Dropdown */}
            <div className="relative">
              <select 
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="">Filters</option>
                {filters.map(filter => (
                  <option key={filter} value={filter}>{filter}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Sort By Status */}
            <div className="relative">
              <div className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="w-4 h-4 border border-gray-400"></div>
                <span className="text-gray-700 flex-1">Short By Status</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto">
          {vehicles.map((vehicle, index) => (
            <div key={index} className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.id}</h3>
                    <span className="text-xs text-gray-500">{vehicle.speed}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">{vehicle.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{vehicle.location}</p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {vehicle.status}
                    </span>
                    <span className="text-xs text-gray-500">{vehicle.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {/* Map Header */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <span className="text-sm font-medium text-gray-700">Updated List With map</span>
        </div>

        {/* Map */}
        <div className="w-full h-full bg-gradient-to-b from-green-400 to-blue-600 relative overflow-hidden">
          {/* Satellite/Terrain Map Background */}
          <div 
            className="absolute inset-0 opacity-90"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          {/* Geographic Labels */}
          <div className="absolute inset-0 text-white">
            {/* South America */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <h2 className="text-4xl font-bold text-white opacity-80">Brazil</h2>
            </div>

            {/* Other locations */}
            <div className="absolute top-1/4 left-1/3 text-sm opacity-70">
              <span>STATE OF MATO GROSSO DO SUL</span>
            </div>
            <div className="absolute top-1/3 right-1/4 text-sm opacity-70">
              <span>STATE OF ACRE</span>
            </div>
            <div className="absolute bottom-1/3 left-1/4 text-sm opacity-70">
              <span>STATE OF MINAS GERAIS</span>
            </div>
            <div className="absolute top-1/5 left-1/4 text-sm opacity-70">
              <span>Paraguay</span>
            </div>
            <div className="absolute top-1/6 right-1/3 text-sm opacity-70">
              <span>Venezuela</span>
            </div>
            <div className="absolute top-1/4 right-1/6 text-sm opacity-70">
              <span>Guayaquil</span>
            </div>

            {/* Cities */}
            <div className="absolute top-1/3 left-1/3 text-xs opacity-60">
              <span>• São Paulo</span>
            </div>
            <div className="absolute top-2/3 left-2/3 text-xs opacity-60">
              <span>• Brasília</span>
            </div>
            <div className="absolute bottom-1/4 right-1/3 text-xs opacity-60">
              <span>• Manaus</span>
            </div>
          </div>

          {/* Vehicle Markers */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-white rounded-lg shadow-lg p-2 relative">
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              <span className="text-sm font-medium text-gray-800">1003 Surinder Singh</span>
            </div>
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg mt-1 mx-auto"></div>
          </div>

          <div className="absolute top-2/3 left-1/3">
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-10">
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <Users className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <Navigation className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <span className="text-sm font-bold text-gray-600">3D</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <MapPin className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <Minus className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Mini Map */}
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-lg shadow-lg overflow-hidden z-10">
          <div className="w-full h-full bg-green-200 relative">
            <div className="absolute inset-2 bg-green-400 rounded opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleMapInterface;