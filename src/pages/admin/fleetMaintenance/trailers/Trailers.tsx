import { useState } from "react";
import { FaTimes, FaEdit, FaCheckCircle } from "react-icons/fa";

interface Trailer {
  _id: string;
  trailer: string;
  internalId?: string;
  plateNumber: string;
  type: string;
  capacity: string;
  ownerShip?: string;
  lastDispatch?: string;
  lastDropLocation?: string;
  note?: string;
  operationStatus: string;
  loadStatus?: string;
  compilance?: string;
  status?: string;
  isAttached?: boolean;
  // Safety compliance fields
  safetyExpiryDate?: string;
  safetyDecalNumber?: string;
  safetyPaperNumber?: string;
  lastInspectionShop?: string;
  lastInspectionInvoice?: string;
  attachedVehicle?: {
    _id: string;
    plateNumber: string;
    make: string;
    model: string;
    driver?: {
      name: string;
    };
  };
  currentLocation?: {
    address?: string;
    latitude?: string;
    longitude?: string;
    updatedAt?: string;
  };
  speed?: number;
  cargoDetails?: {
    cargoType?: string;
    weight?: number;
  };
}

// Static mock data matching Excel sheet structure - All trailers from Excel
const staticTrailers: Trailer[] = [
  {
    _id: 'tr1',
    trailer: 'BR2901',
    internalId: 'BR2901',
    plateNumber: 'TRL-2901',
    type: 'refrigerated',
    capacity: '25000 lbs',
    operationStatus: 'available',
    status: 'available',
    isAttached: false,
    safetyExpiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-BR2901-2024',
    safetyPaperNumber: 'SP-BR2901-2024',
    lastInspectionShop: 'Cold Storage Services',
    lastInspectionInvoice: 'INV-BR2901-2024',
    currentLocation: {
      address: '123 Warehouse Ave, Chicago, IL, USA',
      latitude: '41.8781',
      longitude: '-87.6298',
      updatedAt: new Date().toISOString()
    },
    speed: 0
  },
  {
    _id: 'tr2',
    trailer: 'BR2902',
    internalId: 'BR2902',
    plateNumber: 'TRL-2902',
    type: 'refrigerated',
    capacity: '28000 lbs',
    operationStatus: 'in_transit',
    status: 'in_transit',
    isAttached: true,
    safetyExpiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-BR2902-2023',
    safetyPaperNumber: 'SP-BR2902-2023',
    lastInspectionShop: 'Fleet Refrigeration Services',
    lastInspectionInvoice: 'INV-BR2902-2023',
    attachedVehicle: {
      _id: 'v1',
      plateNumber: 'ABC-1002',
      make: 'Volvo',
      model: 'VNL',
      driver: {
        name: 'John Smith'
      }
    },
    currentLocation: {
      address: '456 Highway Road, Dallas, TX, USA',
      latitude: '32.7767',
      longitude: '-96.7970',
      updatedAt: new Date().toISOString()
    },
    speed: 65
  },
  {
    _id: 'tr3',
    trailer: 'BR2903',
    internalId: 'BR2903',
    plateNumber: 'TRL-2903',
    type: 'refrigerated',
    capacity: '26000 lbs',
    operationStatus: 'maintenance',
    status: 'maintenance',
    isAttached: false,
    safetyExpiryDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    safetyDecalNumber: 'SD-BR2903-2024',
    safetyPaperNumber: 'SP-BR2903-2024',
    lastInspectionShop: 'Premium Trailer Service',
    lastInspectionInvoice: 'INV-BR2903-2024',
    currentLocation: {
      address: '789 Service Lane, Atlanta, GA, USA',
      latitude: '33.7490',
      longitude: '-84.3880',
      updatedAt: new Date().toISOString()
    },
    speed: 0
  }
];

function Trailers() {
  const [search, setSearch] = useState<string>("");
  const [trailers, setTrailers] = useState<Trailer[]>(staticTrailers);
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
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

  const handleTrailerClick = (trailer: Trailer) => {
    setSelectedTrailer(trailer);
    setSafetyForm({
      safetyExpiryDate: trailer.safetyExpiryDate || '',
      safetyDecalNumber: trailer.safetyDecalNumber || '',
      safetyPaperNumber: trailer.safetyPaperNumber || '',
      lastInspectionShop: trailer.lastInspectionShop || '',
      lastInspectionInvoice: trailer.lastInspectionInvoice || ''
    });
    setShowDetailsModal(true);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedTrailer) return;
    
    // Update the trailer in static data
    const updatedTrailers = trailers.map(trailer => {
      if (trailer._id === selectedTrailer._id) {
        return {
          ...trailer,
          safetyExpiryDate: safetyForm.safetyExpiryDate,
          safetyDecalNumber: safetyForm.safetyDecalNumber,
          safetyPaperNumber: safetyForm.safetyPaperNumber,
          lastInspectionShop: safetyForm.lastInspectionShop,
          lastInspectionInvoice: safetyForm.lastInspectionInvoice
        };
      }
      return trailer;
    });
    
    setTrailers(updatedTrailers);
    setSelectedTrailer({
      ...selectedTrailer,
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
    setSelectedTrailer(null);
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

  const filtered = trailers.filter((trailer) =>
    (trailer.trailer + " " + trailer.plateNumber + " " + trailer.type)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Trailer Listing</h1>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by trailer ID, plate, or type..."
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
              <th className="p-4">Type</th>
              <th className="p-4">Capacity</th>
              <th className="p-4 min-w-[180px]">Safety Expiry</th>
              <th className="p-4">Safety Compliance</th>
              <th className="p-4">Operation Status</th>
              <th className="p-4">Attached Vehicle</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((trailer) => {
              const complianceStatus = getComplianceStatus(trailer.safetyExpiryDate);
              return (
                <tr 
                  key={trailer._id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-4 font-medium text-gray-800">{trailer.trailer}</td>
                  <td className="p-4 text-gray-600">{trailer.plateNumber}</td>
                  <td className="p-4 text-gray-600 capitalize">{trailer.type?.replace('_', ' ')}</td>
                  <td className="p-4 text-gray-600">{trailer.capacity || 'N/A'}</td>
                  <td className="p-4 min-w-[180px]">
                    {trailer.safetyExpiryDate ? (
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {new Date(trailer.safetyExpiryDate).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })}
                        </span>
                        <div className="w-full">
                          <span
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold inline-block whitespace-nowrap ${
                              complianceStatus.status === 'expired'
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : complianceStatus.status === 'expiring-soon'
                                  ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                  : "bg-green-100 text-green-700 border border-green-200"
                            }`}
                          >
                            {complianceStatus.text}
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
                        <span className="font-medium text-gray-800">{trailer.safetyDecalNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Paper:</span>
                        <span className="font-medium text-gray-800">{trailer.safetyPaperNumber || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Shop:</span>
                        <span className="font-medium text-gray-800 truncate max-w-[120px]">{trailer.lastInspectionShop || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Invoice:</span>
                        <span className="font-medium text-gray-800">{trailer.lastInspectionInvoice || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        trailer.operationStatus === "available"
                          ? "bg-green-100 text-green-700"
                          : trailer.operationStatus === "in_transit"
                          ? "bg-blue-100 text-blue-700"
                          : trailer.operationStatus === "maintenance"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {trailer.operationStatus?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {trailer.isAttached && trailer.attachedVehicle ? (
                      <div>
                        <div className="font-medium">{trailer.attachedVehicle.plateNumber}</div>
                        <div className="text-xs text-gray-500">
                          {trailer.attachedVehicle.make} {trailer.attachedVehicle.model}
                        </div>
                        {trailer.attachedVehicle.driver && (
                          <div className="text-xs text-gray-500">
                            Driver: {trailer.attachedVehicle.driver.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Not attached</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrailerClick(trailer);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 !text-white text-xs rounded-lg flex items-center gap-1 transition-colors font-medium"
                      title="Edit Safety Compliance"
                    >
                      <FaEdit size={12} />
                      {trailer.safetyExpiryDate ? 'Edit' : 'Add'} Safety
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
                  No trailers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Safety Compliance Modal */}
      {showDetailsModal && selectedTrailer && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Safety Compliance Record</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Unit No: <span className="font-semibold">{selectedTrailer.trailer}</span> | 
                  Plate: <span className="font-semibold">{selectedTrailer.plateNumber}</span> | 
                  {selectedTrailer.type?.replace('_', ' ').toUpperCase()}
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
                  {selectedTrailer.safetyExpiryDate && !isEditing && (
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      getComplianceStatus(selectedTrailer.safetyExpiryDate).status === 'expired'
                        ? "bg-red-100 text-red-700 border-2 border-red-300"
                        : getComplianceStatus(selectedTrailer.safetyExpiryDate).status === 'expiring-soon'
                          ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                          : "bg-green-100 text-green-700 border-2 border-green-300"
                    }`}>
                      {getComplianceStatus(selectedTrailer.safetyExpiryDate).text}
                    </span>
                  )}
                </div>
                
                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Safety Expiry Date</label>
                        <p className="text-lg font-bold text-gray-900">
                          {selectedTrailer.safetyExpiryDate ? new Date(selectedTrailer.safetyExpiryDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Set'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Safety Decal Number</label>
                        <p className="text-lg font-bold text-gray-900">{selectedTrailer.safetyDecalNumber || 'Not Set'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Safety Paper Number</label>
                        <p className="text-lg font-bold text-gray-900">{selectedTrailer.safetyPaperNumber || 'Not Set'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Last Inspection Shop</label>
                        <p className="text-lg font-bold text-gray-900">{selectedTrailer.lastInspectionShop || 'Not Set'}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Last Inspection Invoice Number</label>
                      <p className="text-lg font-bold text-gray-900">{selectedTrailer.lastInspectionInvoice || 'Not Set'}</p>
                    </div>
                    <button
                      onClick={handleEditClick}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-md"
                    >
                      <FaEdit size={16} />
                      {selectedTrailer.safetyExpiryDate ? 'Edit Safety Compliance' : 'Add Safety Compliance'}
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
                          placeholder="e.g., SD-BR2901-2024"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Safety Paper Number</label>
                        <input
                          type="text"
                          value={safetyForm.safetyPaperNumber}
                          onChange={(e) => setSafetyForm(prev => ({ ...prev, safetyPaperNumber: e.target.value }))}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="e.g., SP-BR2901-2024"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Shop Name</label>
                        <input
                          type="text"
                          value={safetyForm.lastInspectionShop}
                          onChange={(e) => setSafetyForm(prev => ({ ...prev, lastInspectionShop: e.target.value }))}
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="e.g., Cold Storage Services"
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
                        placeholder="e.g., INV-BR2901-2024"
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
                            safetyExpiryDate: selectedTrailer.safetyExpiryDate || '',
                            safetyDecalNumber: selectedTrailer.safetyDecalNumber || '',
                            safetyPaperNumber: selectedTrailer.safetyPaperNumber || '',
                            lastInspectionShop: selectedTrailer.lastInspectionShop || '',
                            lastInspectionInvoice: selectedTrailer.lastInspectionInvoice || ''
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

export default Trailers;