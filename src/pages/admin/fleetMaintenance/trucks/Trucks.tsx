import  { useState } from "react";
import { FaTimes, FaEdit, FaCheckCircle } from "react-icons/fa";

interface Vehicle {
  _id: string;
  internalId: string;
  plateNumber: string;
  vinNumber: string;
  make: string;
  model: string;
  year: number;
  status: string;
  hasTrailer: boolean;
  engineOn: boolean;
  speed: number;
  fuelLevel: number;
  odometer: number;
  // Safety compliance fields
  safetyExpiryDate?: string;
  safetyDecalNumber?: string;
  safetyPaperNumber?: string;
  lastInspectionShop?: string;
  lastInspectionInvoice?: string;
}

// Static mock data matching Excel sheet structure - All trucks from Excel
const staticTrucks: Vehicle[] = [
  {
    _id: 't1',
    internalId: '1001',
    plateNumber: 'ABC-1001',
    vinNumber: '1HGBH41JXMN109186',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2020,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 75,
    odometer: 125000,
    safetyExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-1001-2024',
    safetyPaperNumber: 'SP-1001-2024',
    lastInspectionShop: 'ABC Auto Shop',
    lastInspectionInvoice: 'INV-1001-2024'
  },
  {
    _id: 't2',
    internalId: '1002',
    plateNumber: 'ABC-1002',
    vinNumber: '1HGBH41JXMN109187',
    make: 'Volvo',
    model: 'VNL',
    year: 2021,
    status: 'in-use',
    hasTrailer: true,
    engineOn: true,
    speed: 65,
    fuelLevel: 50,
    odometer: 98000,
    safetyExpiryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-1002-2023',
    safetyPaperNumber: 'SP-1002-2023',
    lastInspectionShop: 'XYZ Truck Service',
    lastInspectionInvoice: 'INV-1002-2023'
  },
  {
    _id: 't3',
    internalId: '1003',
    plateNumber: 'ABC-1003',
    vinNumber: '1HGBH41JXMN109188',
    make: 'Peterbilt',
    model: '579',
    year: 2019,
    status: 'maintenance',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 30,
    odometer: 150000,
    safetyExpiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-1003-2024',
    safetyPaperNumber: 'SP-1003-2024',
    lastInspectionShop: 'Main Street Garage',
    lastInspectionInvoice: 'INV-1003-2024'
  },
  {
    _id: 't4',
    internalId: '1004',
    plateNumber: 'ABC-1004',
    vinNumber: '1HGBH41JXMN109189',
    make: 'Kenworth',
    model: 'T680',
    year: 2022,
    status: 'available',
    hasTrailer: true,
    engineOn: false,
    speed: 0,
    fuelLevel: 80,
    odometer: 45000,
    safetyExpiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-1004-2024',
    safetyPaperNumber: 'SP-1004-2024',
    lastInspectionShop: 'Fleet Service Center',
    lastInspectionInvoice: 'INV-1004-2024'
  },
  {
    _id: 't5',
    internalId: '1207',
    plateNumber: 'ABC-1207',
    vinNumber: '1HGBH41JXMN109190',
    make: 'Mack',
    model: 'Anthem',
    year: 2021,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 60,
    odometer: 110000,
    safetyExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-1207-2024',
    safetyPaperNumber: 'SP-1207-2024',
    lastInspectionShop: 'Premium Truck Service',
    lastInspectionInvoice: 'INV-1207-2024'
  },
  {
    _id: 't6',
    internalId: '1208',
    plateNumber: 'ABC-1208',
    vinNumber: '1HGBH41JXMN109192',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2020,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 70,
    odometer: 105000
  },
  {
    _id: 't7',
    internalId: '1209',
    plateNumber: 'ABC-1209',
    vinNumber: '1HGBH41JXMN109193',
    make: 'Volvo',
    model: 'VNL',
    year: 2021,
    status: 'in-use',
    hasTrailer: true,
    engineOn: true,
    speed: 60,
    fuelLevel: 45,
    odometer: 92000
  },
  {
    _id: 't8',
    internalId: '1210',
    plateNumber: 'ABC-1210',
    vinNumber: '1HGBH41JXMN109194',
    make: 'Peterbilt',
    model: '579',
    year: 2019,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 85,
    odometer: 118000
  },
  {
    _id: 't9',
    internalId: '1212',
    plateNumber: 'ABC-1212',
    vinNumber: '1HGBH41JXMN109195',
    make: 'Kenworth',
    model: 'T680',
    year: 2022,
    status: 'maintenance',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 20,
    odometer: 48000
  },
  {
    _id: 't10',
    internalId: '1213',
    plateNumber: 'ABC-1213',
    vinNumber: '1HGBH41JXMN109196',
    make: 'Mack',
    model: 'Anthem',
    year: 2021,
    status: 'available',
    hasTrailer: true,
    engineOn: false,
    speed: 0,
    fuelLevel: 65,
    odometer: 87000
  },
  {
    _id: 't11',
    internalId: '1214',
    plateNumber: 'ABC-1214',
    vinNumber: '1HGBH41JXMN109197',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2020,
    status: 'in-use',
    hasTrailer: true,
    engineOn: true,
    speed: 70,
    fuelLevel: 55,
    odometer: 142000
  },
  {
    _id: 't12',
    internalId: '1215',
    plateNumber: 'ABC-1215',
    vinNumber: '1HGBH41JXMN109198',
    make: 'Volvo',
    model: 'VNL',
    year: 2021,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 90,
    odometer: 76000
  },
  {
    _id: 't13',
    internalId: '1216',
    plateNumber: 'ABC-1216',
    vinNumber: '1HGBH41JXMN109199',
    make: 'Peterbilt',
    model: '579',
    year: 2019,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 75,
    odometer: 128000
  },
  {
    _id: 't14',
    internalId: '1217',
    plateNumber: 'ABC-1217',
    vinNumber: '1HGBH41JXMN109200',
    make: 'Kenworth',
    model: 'T680',
    year: 2022,
    status: 'in-use',
    hasTrailer: true,
    engineOn: true,
    speed: 58,
    fuelLevel: 40,
    odometer: 52000
  },
  {
    _id: 't15',
    internalId: '1401',
    plateNumber: 'ABC-1401',
    vinNumber: '1HGBH41JXMN109191',
    make: 'Freightliner',
    model: 'Cascadia',
    year: 2020,
    status: 'in-use',
    hasTrailer: true,
    engineOn: true,
    speed: 55,
    fuelLevel: 40,
    odometer: 135000,
    safetyExpiryDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-1401-2024',
    safetyPaperNumber: 'SP-1401-2024',
    lastInspectionShop: 'Central Fleet Maintenance',
    lastInspectionInvoice: 'INV-1401-2024'
  },
  {
    _id: 't16',
    internalId: '1402',
    plateNumber: 'ABC-1402',
    vinNumber: '1HGBH41JXMN109201',
    make: 'Mack',
    model: 'Anthem',
    year: 2021,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 80,
    odometer: 95000
  },
  {
    _id: 't17',
    internalId: '2025',
    plateNumber: 'ABC-2025',
    vinNumber: '1HGBH41JXMN109202',
    make: 'Volvo',
    model: 'VNL',
    year: 2023,
    status: 'available',
    hasTrailer: false,
    engineOn: false,
    speed: 0,
    fuelLevel: 95,
    odometer: 15000
  }
];

function Trucks() {
  const [search, setSearch] = useState<string>("");
  const [vehicles, setVehicles] = useState<Vehicle[]>(staticTrucks);
  const [selectedTruck, setSelectedTruck] = useState<Vehicle | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Safety compliance form state
  const [safetyForm, setSafetyForm] = useState({
    safetyExpiryDate: '',
    safetyDecalNumber: '',
    safetyPaperNumber: '',
    lastInspectionShop: '',
    lastInspectionInvoice: ''
  });

  const handleTruckClick = (truck: Vehicle) => {
    setSelectedTruck(truck);
    setSafetyForm({
      safetyExpiryDate: truck.safetyExpiryDate || '',
      safetyDecalNumber: truck.safetyDecalNumber || '',
      safetyPaperNumber: truck.safetyPaperNumber || '',
      lastInspectionShop: truck.lastInspectionShop || '',
      lastInspectionInvoice: truck.lastInspectionInvoice || ''
    });
    setShowDetailsModal(true);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedTruck) return;
    
    // Update the vehicle in static data
    const updatedVehicles = vehicles.map(vehicle => {
      if (vehicle._id === selectedTruck._id) {
        return {
          ...vehicle,
          safetyExpiryDate: safetyForm.safetyExpiryDate,
          safetyDecalNumber: safetyForm.safetyDecalNumber,
          safetyPaperNumber: safetyForm.safetyPaperNumber,
          lastInspectionShop: safetyForm.lastInspectionShop,
          lastInspectionInvoice: safetyForm.lastInspectionInvoice
        };
      }
      return vehicle;
    });
    
    setVehicles(updatedVehicles);
    setSelectedTruck({
      ...selectedTruck,
      safetyExpiryDate: safetyForm.safetyExpiryDate,
      safetyDecalNumber: safetyForm.safetyDecalNumber,
      safetyPaperNumber: safetyForm.safetyPaperNumber,
      lastInspectionShop: safetyForm.lastInspectionShop,
      lastInspectionInvoice: safetyForm.lastInspectionInvoice
    });
    setIsEditing(false);
    alert('Safety compliance data saved successfully!');
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedTruck(null);
    setIsEditing(false);
  };

  const getComplianceStatus = (expiryDate?: string) => {
    if (!expiryDate) return { status: 'unknown', color: 'gray', text: 'Not Set' };
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', color: 'red', text: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'expiring-soon', color: 'yellow', text: `Expiring in ${daysUntilExpiry} days` };
    } else {
      return { status: 'valid', color: 'green', text: 'Valid' };
    }
  };

  // Filter vehicles based on search
  const filtered = vehicles.filter((truck: Vehicle) =>
    (truck.make + " " + truck.model + " " + truck.plateNumber + " " + truck.internalId)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Truck Listing</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by make, model, plate, or internal ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-blue-50 text-gray-700 uppercase text-sm">
              <th className="p-4">Unit No</th>
              <th className="p-4">Plate Number</th>
              <th className="p-4">Make</th>
              <th className="p-4">Model</th>
              <th className="p-4">Year</th>
              <th className="p-4 min-w-[180px]">Safety Expiry</th>
              <th className="p-4">Safety Compliance</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((truck: Vehicle) => {
              return (
                <tr 
                  key={truck._id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-medium text-gray-800">{truck.internalId}</td>
                  <td className="p-4 text-gray-600">{truck.plateNumber}</td>
                  <td className="p-4 text-gray-600">{truck.make}</td>
                  <td className="p-4 text-gray-600">{truck.model}</td>
                  <td className="p-4 text-gray-600">{truck.year}</td>
                  <td className="p-4 min-w-[180px]">
                    {truck.safetyExpiryDate ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {new Date(truck.safetyExpiryDate).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })}
                        </span>
                        <div className="w-full">
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${
                              getComplianceStatus(truck.safetyExpiryDate).status === 'expired'
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : getComplianceStatus(truck.safetyExpiryDate).status === 'expiring-soon'
                                  ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                            }`}
                          >
                            {getComplianceStatus(truck.safetyExpiryDate).text}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not Set</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Decal:</span>
                        <span className="font-medium text-gray-800">{truck.safetyDecalNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Paper:</span>
                        <span className="font-medium text-gray-800">{truck.safetyPaperNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Shop:</span>
                        <span className="font-medium text-gray-800 truncate max-w-[120px]">{truck.lastInspectionShop || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Invoice:</span>
                        <span className="font-medium text-gray-800">{truck.lastInspectionInvoice || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${truck.status === "available"
                          ? "bg-green-100 text-green-700"
                          : truck.status === "in-use"
                            ? "bg-yellow-100 text-yellow-700"
                            : truck.status === "maintenance"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {truck.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTruckClick(truck);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 !text-white text-xs rounded-lg flex items-center gap-1 transition-colors font-medium"
                      title="Edit Safety Compliance"
                    >
                      <FaEdit size={12} />
                      {truck.safetyExpiryDate ? 'Edit' : 'Add'} Safety
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="p-6 text-center text-gray-500 italic"
                >
                  No trucks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Safety Compliance Modal */}
      {showDetailsModal && selectedTruck && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Safety Compliance Record</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Unit No: <span className="font-semibold">{selectedTruck.internalId}</span> | 
                  Plate: <span className="font-semibold">{selectedTruck.plateNumber}</span> | 
                  {selectedTruck.make} {selectedTruck.model}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-gray-500" size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Safety Compliance Form */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Safety Compliance Information</h3>
                  {selectedTruck.safetyExpiryDate && !isEditing && (
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      getComplianceStatus(selectedTruck.safetyExpiryDate).status === 'expired'
                        ? "bg-red-100 text-red-700 border-2 border-red-300"
                        : getComplianceStatus(selectedTruck.safetyExpiryDate).status === 'expiring-soon'
                          ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                          : "bg-green-100 text-green-700 border-2 border-green-300"
                    }`}>
                      {getComplianceStatus(selectedTruck.safetyExpiryDate).text}
                    </span>
                  )}
                </div>
                
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Safety Expiry Date</label>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedTruck.safetyExpiryDate ? new Date(selectedTruck.safetyExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Set'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Safety Decal Number</label>
                        <p className="text-lg font-bold text-gray-900">{selectedTruck.safetyDecalNumber || 'Not Set'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Safety Paper Number</label>
                        <p className="text-lg font-bold text-gray-900">{selectedTruck.safetyPaperNumber || 'Not Set'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Last Inspection Shop</label>
                        <p className="text-lg font-bold text-gray-900">{selectedTruck.lastInspectionShop || 'Not Set'}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Last Inspection Invoice Number</label>
                      <p className="text-lg font-bold text-gray-900">{selectedTruck.lastInspectionInvoice || 'Not Set'}</p>
                    </div>
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-md"
                    >
                      <FaEdit size={16} />
                      {selectedTruck.safetyExpiryDate ? 'Edit Safety Compliance' : 'Add Safety Compliance'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Safety Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={safetyForm.safetyExpiryDate}
                          onChange={(e) => setSafetyForm(prev => ({ ...prev, safetyExpiryDate: e.target.value }))}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Safety Decal Number</label>
                        <input
                          type="text"
                          value={safetyForm.safetyDecalNumber}
                          onChange={(e) => setSafetyForm(prev => ({ ...prev, safetyDecalNumber: e.target.value }))}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="e.g., SD-1001-2024"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Safety Paper Number</label>
                        <input
                          type="text"
                          value={safetyForm.safetyPaperNumber}
                          onChange={(e) => setSafetyForm(prev => ({ ...prev, safetyPaperNumber: e.target.value }))}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="e.g., SP-1001-2024"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name</label>
                        <input
                          type="text"
                          value={safetyForm.lastInspectionShop}
                          onChange={(e) => setSafetyForm(prev => ({ ...prev, lastInspectionShop: e.target.value }))}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="e.g., ABC Auto Shop"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number</label>
                      <input
                        type="text"
                        value={safetyForm.lastInspectionInvoice}
                        onChange={(e) => setSafetyForm(prev => ({ ...prev, lastInspectionInvoice: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., INV-1001-2024"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 !text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-md"
                      >
                        <FaCheckCircle size={16} />
                        Save Safety Compliance
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setSafetyForm({
                            safetyExpiryDate: selectedTruck.safetyExpiryDate || '',
                            safetyDecalNumber: selectedTruck.safetyDecalNumber || '',
                            safetyPaperNumber: selectedTruck.safetyPaperNumber || '',
                            lastInspectionShop: selectedTruck.lastInspectionShop || '',
                            lastInspectionInvoice: selectedTruck.lastInspectionInvoice || ''
                          });
                        }}
                        className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 !text-white rounded-lg transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trucks;

