import { useState, useEffect, useCallback } from "react";
import { FaTimes, FaEdit, FaCheckCircle, FaChevronLeft, FaChevronRight, FaExclamationCircle, FaInfoCircle } from "react-icons/fa";
import { listTrailers, updateTrailer } from "../../../../axios/api/distapcher";

// Add CSS animation for toast notifications
const toastStyle = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = toastStyle;
  if (!document.head.querySelector('style[data-toast-animation]')) {
    styleSheet.setAttribute('data-toast-animation', 'true');
    document.head.appendChild(styleSheet);
  }
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

const NotificationToast = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]}`} style={{ 
      animation: 'slideIn 0.3s ease-out',
      transform: 'translateX(0)',
      opacity: 1
    }}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

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

function Trailers() {
  const [search, setSearch] = useState<string>("");
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTrailer, setSelectedTrailer] = useState<Trailer | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  // Safety compliance form state
  const [safetyForm, setSafetyForm] = useState({
    safetyExpiryDate: '',
    safetyDecalNumber: '',
    safetyPaperNumber: '',
    lastInspectionShop: '',
    lastInspectionInvoice: ''
  });

  // Notification functions
  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Fetch trailers with pagination
  const fetchTrailers = useCallback(async (page: number, limit: number, searchQuery: string) => {
    setLoading(true);
    try {
      const res = await listTrailers({
        page,
        limit,
        search: searchQuery.trim() || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (res?.success) {
        const trailersData = Array.isArray(res?.data)
          ? res.data
          : [];
        
        setTrailers(trailersData);
        
        // Update pagination info
        if (res?.pagination) {
          setTotal(res.pagination.total || 0);
          setTotalPages(res.pagination.pages || 0);
          setCurrentPage(res.pagination.current || 1);
        }
      } else {
        setTrailers([]);
        setTotal(0);
        setTotalPages(0);
        if (res?.message) {
          addNotification('error', res.message);
        }
      }
    } catch (error: any) {
      console.error('Error fetching trailers:', error);
      setTrailers([]);
      setTotal(0);
      setTotalPages(0);
      addNotification('error', error?.message || 'Failed to fetch trailers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTrailers(currentPage, pageSize, search);
  }, [currentPage, pageSize, fetchTrailers]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchTrailers(1, pageSize, search);
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleTrailerClick = (trailer: Trailer) => {
    setSelectedTrailer(trailer);
    setSafetyForm({
      safetyExpiryDate: trailer.safetyExpiryDate ? new Date(trailer.safetyExpiryDate).toISOString().split('T')[0] : '',
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

  const handleSave = async () => {
    if (!selectedTrailer) return;
    
    setSubmitting(true);
    try {
      const updateData: Partial<Trailer> = {
        safetyExpiryDate: safetyForm.safetyExpiryDate || undefined,
        safetyDecalNumber: safetyForm.safetyDecalNumber || undefined,
        safetyPaperNumber: safetyForm.safetyPaperNumber || undefined,
        lastInspectionShop: safetyForm.lastInspectionShop || undefined,
        lastInspectionInvoice: safetyForm.lastInspectionInvoice || undefined
      };

      const res = await updateTrailer(selectedTrailer._id, updateData);
      
      if (res?.success) {
        // Update local state
        const updatedTrailers = trailers.map(trailer => {
          if (trailer._id === selectedTrailer._id) {
            return {
              ...trailer,
              ...updateData
            } as Trailer;
          }
          return trailer;
        });
        
        setTrailers(updatedTrailers);
        setSelectedTrailer({
          ...selectedTrailer,
          ...updateData
        } as Trailer);
        setIsEditing(false);
        addNotification('success', 'Safety compliance data saved successfully!');
      } else {
        addNotification('error', res?.message || 'Failed to save safety compliance data');
      }
    } catch (error: any) {
      console.error('Error updating trailer:', error);
      addNotification('error', error?.message || 'Error updating safety compliance data');
    } finally {
      setSubmitting(false);
    }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        year: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-3 max-w-md">
        {notifications.map(notification => (
          <NotificationToast key={notification.id} notification={notification} onClose={removeNotification} />
        ))}
      </div>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">Trailer Listing</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <input
          type="text"
          placeholder="Search by trailer ID, plate, or type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-1/3 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
        />
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Items per page:</label>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading trailers...</p>
        </div>
      ) : (
        <>
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
                {trailers.map((trailer) => {
                  const complianceStatus = getComplianceStatus(trailer.safetyExpiryDate);
                  return (
                    <tr 
                      key={trailer._id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 font-medium text-gray-800">{trailer.trailer || trailer.internalId || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{trailer.plateNumber || 'N/A'}</td>
                      <td className="p-4 text-gray-600 capitalize">{trailer.type?.replace('_', ' ') || 'N/A'}</td>
                      <td className="p-4 text-gray-600">{trailer.capacity || 'N/A'}</td>
                      <td className="p-4 min-w-[180px]">
                        {trailer.safetyExpiryDate ? (
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                              {formatDate(trailer.safetyExpiryDate)}
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
                          {trailer.operationStatus?.replace('_', ' ') || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">
                        {trailer.isAttached && trailer.attachedVehicle ? (
                          <div>
                            <div className="font-medium">{trailer.attachedVehicle.plateNumber || 'N/A'}</div>
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

                {trailers.length === 0 && (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow-sm">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                <span className="font-medium">{total}</span> trailers
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg border ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <FaChevronLeft size={14} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <FaChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Safety Compliance Modal */}
      {showDetailsModal && selectedTrailer && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 z-10 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Safety Compliance Record</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Unit No: <span className="font-semibold">{selectedTrailer.trailer || selectedTrailer.internalId}</span> | 
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
                        disabled={submitting}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 !text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-medium shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <FaCheckCircle size={16} />
                        {submitting ? 'Saving...' : 'Save Safety Compliance'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setSafetyForm({
                            safetyExpiryDate: selectedTrailer.safetyExpiryDate ? new Date(selectedTrailer.safetyExpiryDate).toISOString().split('T')[0] : '',
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
