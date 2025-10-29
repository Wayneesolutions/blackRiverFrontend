import { useState, useEffect } from "react";
import { FaCar, FaPlus, FaEdit, FaTrash, FaFileUpload, FaFileAlt, FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaEye, FaDownload, FaTruck, FaTrailer } from "react-icons/fa";
import {
  getVehicleDocument,
  createVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument
} from "../../../../axios/api/compilance.vehicledoc";
import { useVehicles } from "../../../../customHooks/useVehicles";

// Types
interface Vehicle {
  _id: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  status: string;
}

interface Document {
  _id: string;
  documentType: 'insurance' | 'permit' | 'fitness' | 'pollution' | 'driver_license' | 'logbook' | 'maintenance' | 'trailer_registration' | 'safety_inspection' | 'brake_certificate' | 'coupling_certificate' | 'other';
  documentNumber: string;
  expiryDate: string;
  issuedAt: string;
  status?: string;
  files?: DocumentFile[];
}

interface DocumentFile {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  fileType: string;
}

interface VehicleDocument {
  _id: string;
  vehicle: Vehicle;
  documents: Document[];
}

interface FormData {
  vehicleId: string;
  documentType: 'insurance' | 'permit' | 'fitness' | 'pollution' | 'driver_license' | 'logbook' | 'maintenance' | 'trailer_registration' | 'safety_inspection' | 'brake_certificate' | 'coupling_certificate' | 'other';
  documentNumber: string;
  expiryDate: string;
  issuedAt: string;
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

interface DeleteConfirmation {
  show: boolean;
  docId: string | null;
}

// Notification Component
const Notification = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-[#9793E4]" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-[#9793E4]/10 border-[#9793E4]/30'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
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

function VehicleDocument() {
  const { vehicles } = useVehicles();

  const [vehicleDocuments, setVehicleDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    show: false,
    docId: null
  });
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'truck' | 'trailer'>('all');
  const [formData, setFormData] = useState<FormData>({
    vehicleId: "",
    documentType: "insurance",
    documentNumber: "",
    expiryDate: "",
    issuedAt: ""
  });

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchAllDocuments = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching vehicle documents...');
      const res = await getVehicleDocument();
      console.log('📡 Vehicle documents API response:', res);
      
      if (res?.success) {
        console.log('✅ Documents loaded successfully:', res.documentsByVehicle?.length || 0, 'vehicles with documents');
        setVehicleDocuments(res.documentsByVehicle || []);
      } else {
        console.error('❌ Failed to load documents:', res?.message);
        addNotification('error', res?.message || 'Failed to fetch documents');
        setVehicleDocuments([]);
      }
    } catch (err: any) {
      console.error("❌ Error fetching documents:", err);
      addNotification('error', err?.message || 'Failed to fetch documents');
      setVehicleDocuments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  const handleAddDocument = () => {
    setEditingDoc(null);
    setSelectedFile(null);
    setFormData({
      vehicleId: "",
      documentType: "insurance",
      documentNumber: "",
      expiryDate: "",
      issuedAt: ""
    });
    setShowDocModal(true);
  };

  const handleEditDocument = (doc: Document, vehicleId: string) => {
    setEditingDoc(doc);
    setSelectedFile(null);
    setFormData({
      vehicleId: vehicleId,
      documentType: doc.documentType || "insurance",
      documentNumber: doc.documentNumber || "",
      expiryDate: doc.expiryDate ? doc.expiryDate.split('T')[0] : "",
      issuedAt: doc.issuedAt ? doc.issuedAt.split('T')[0] : ""
    });
    setShowDocModal(true);
  };

  const handleDeleteDocument = async (docId: string) => {
    setDeleteConfirmation({ show: true, docId });
  };

  const handleViewDocument = (doc: Document) => {
    setViewingDoc(doc);
    setShowViewModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.docId) return;

    try {
      const res = await deleteVehicleDocument(deleteConfirmation.docId);
      if (res?.success) {
        addNotification('success', res.message || "Document deleted successfully");
        fetchAllDocuments();
      } else {
        addNotification('error', res?.message || "Failed to delete document");
      }
    } catch (err: any) {
      addNotification('error', err?.message || "Error deleting document");
    }

    setDeleteConfirmation({ show: false, docId: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, docId: null });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitDocument = async () => {
    if (!formData.vehicleId || !formData.documentNumber || !formData.expiryDate || !formData.issuedAt) {
      addNotification('error', "Please fill all required fields");
      return;
    }

    setSubmitting(true);

    const data = new FormData();
    data.append("vehicleId", formData.vehicleId);
    data.append("documentType", formData.documentType);
    data.append("documentNumber", formData.documentNumber);
    data.append("expiryDate", formData.expiryDate);
    data.append("issuedAt", formData.issuedAt);

    if (selectedFile) {
      data.append("document", selectedFile);
    }

    try {
      let res;
      if (editingDoc) {
        res = await updateVehicleDocument(editingDoc._id, data);
      } else {
        res = await createVehicleDocument(data);
      }

      if (res?.success) {
        addNotification('success', res.message || `Document ${editingDoc ? "updated" : "created"} successfully`);
        setShowDocModal(false);
        fetchAllDocuments();
      } else {
        addNotification('error', res?.message || `Failed to ${editingDoc ? "update" : "create"} document`);
      }
    } catch (err: any) {
      addNotification('error', err?.message || "Error submitting document");
    }

    setSubmitting(false);
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-700 border border-green-200";
      case "expired":
        return "bg-red-100 text-red-700 border border-red-200";
      case "expiring-soon":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getVehicleTypeIcon = (vehicleType: string) => {
    switch (vehicleType?.toLowerCase()) {
      case 'truck':
        return <FaTruck className="text-blue-600" size={20} />;
      case 'trailer':
        return <FaTrailer className="text-green-600" size={20} />;
      default:
        return <FaCar className="text-gray-600" size={20} />;
    }
  };

  const getDocumentTypeDisplayName = (docType: string) => {
    const typeMap: { [key: string]: string } = {
      'insurance': 'Insurance Certificate',
      'permit': 'Operating Permit',
      'fitness': 'Fitness Certificate',
      'pollution': 'Pollution Certificate',
      'driver_license': 'Driver License',
      'logbook': 'Logbook',
      'maintenance': 'Maintenance Record',
      'trailer_registration': 'Trailer Registration',
      'safety_inspection': 'Safety Inspection',
      'brake_certificate': 'Brake Certificate',
      'coupling_certificate': 'Coupling Certificate',
      'other': 'Other Document'
    };
    return typeMap[docType] || docType;
  };

  // Static vehicle type definitions
  const getVehicleTypeInfo = (vehicleType: string) => {
    const typeMap: { [key: string]: { name: string; icon: React.ReactElement; color: string; bgColor: string; description: string } } = {
      'truck': {
        name: 'Truck',
        icon: <FaTruck className="text-blue-600" size={20} />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        description: 'Commercial truck vehicle'
      },
      'trailer': {
        name: 'Trailer',
        icon: <FaTrailer className="text-green-600" size={20} />,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        description: 'Commercial trailer vehicle'
      },
      'car': {
        name: 'Car',
        icon: <FaCar className="text-gray-600" size={20} />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50 border-gray-200',
        description: 'Passenger vehicle'
      }
    };
    return typeMap[vehicleType?.toLowerCase()] || typeMap['car'];
  };

  // Vehicles available to select in the Add/Edit modal based on active tab
  const getSelectableVehicles = () => {
    if (activeTab === 'all') return vehicles as Vehicle[];
    return (vehicles as Vehicle[]).filter((v: Vehicle) => v.status?.toLowerCase() === activeTab);
  };

  // Filter vehicles by type
  const getFilteredVehicles = () => {
    if (activeTab === 'all') return vehicleDocuments;
    return vehicleDocuments.filter(item => 
      item.vehicle?.status?.toLowerCase() === activeTab
    );
  };

  // Get statistics for each tab
  const getTabStats = () => {
    const all = vehicleDocuments.length;
    const trucks = vehicleDocuments.filter(item => 
      item.vehicle?.status?.toLowerCase() === 'truck'
    ).length;
    const trailers = vehicleDocuments.filter(item => 
      item.vehicle?.status?.toLowerCase() === 'trailer'
    ).length;
    
    return { all, trucks, trailers };
  };

  const tabStats = getTabStats();

  const DocumentModal = () => {
    const selectedVehicle = getSelectableVehicles().find(v => v._id === formData.vehicleId);
    
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between rounded-t-2xl ${
            activeTab === 'truck' ? 'bg-blue-50 border-blue-200' :
            activeTab === 'trailer' ? 'bg-green-50 border-green-200' :
            'bg-[#9793E4]/5 border-[#9793E4]/20'
          }`}>
            <div className="flex items-center gap-3">
              {activeTab === 'truck' && <FaTruck className="text-blue-600" size={20} />}
              {activeTab === 'trailer' && <FaTrailer className="text-green-600" size={20} />}
              {activeTab === 'all' && <FaCar className="text-[#9793E4]" size={20} />}
              <h3 className={`text-xl font-bold ${
                activeTab === 'truck' ? 'text-blue-800' :
                activeTab === 'trailer' ? 'text-green-800' :
                'text-gray-800'
              }`}>
                {editingDoc ? "Update Document" : "Add New Document"}
                {activeTab !== 'all' && (
                  <span className="text-sm font-normal ml-2">
                    ({activeTab === 'truck' ? 'Truck' : 'Trailer'} Documents)
                  </span>
                )}
              </h3>
            </div>
            <button
              onClick={() => setShowDocModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={submitting}
            >
              <FaTimes className="text-gray-500" size={20} />
            </button>
          </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Vehicle Type Context */}
          <div className={`p-4 rounded-lg border ${getVehicleTypeInfo(activeTab === 'all' ? 'car' : activeTab).bgColor}`}>
            <div className="flex items-center gap-3">
              {getVehicleTypeInfo(activeTab === 'all' ? 'car' : activeTab).icon}
              <div>
                <h4 className={`font-bold text-lg ${getVehicleTypeInfo(activeTab === 'all' ? 'car' : activeTab).color}`}>
                  {activeTab === 'all' ? 'All Vehicle Types' : `${getVehicleTypeInfo(activeTab).name} Documents`}
                </h4>
                <p className="text-sm text-gray-600">
                  {activeTab === 'all' 
                    ? 'Adding document for any vehicle type' 
                    : `Adding document specifically for ${getVehicleTypeInfo(activeTab).name.toLowerCase()} vehicles`
                  }
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Vehicle <span className="text-red-500">*</span>
              {activeTab !== 'all' && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  activeTab === 'truck' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                  {activeTab === 'truck' ? 'Trucks Only' : 'Trailers Only'}
                </span>
              )}
            </label>
            <select
              name="vehicleId"
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
              value={formData.vehicleId}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Choose a Vehicle --</option>
              {getSelectableVehicles().length === 0 ? (
                <option value="" disabled>
                  {activeTab === 'truck' ? 'No trucks available' : activeTab === 'trailer' ? 'No trailers available' : 'No vehicles available'}
                </option>
              ) : (
                getSelectableVehicles().map((vehicle: Vehicle) => {
                  const vehicleTypeInfo = getVehicleTypeInfo(vehicle.status || 'car');
                  return (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicleTypeInfo.name.toUpperCase()}: {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.plateNumber}
                    </option>
                  );
                })
              )}
            </select>
            
            {/* Selected Vehicle Info */}
            {selectedVehicle && (
              <div className={`mt-3 p-4 rounded-lg border ${getVehicleTypeInfo(selectedVehicle.status || 'car').bgColor}`}>
                <div className="flex items-center gap-3">
                  {getVehicleTypeInfo(selectedVehicle.status || 'car').icon}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold text-lg ${getVehicleTypeInfo(selectedVehicle.status || 'car').color}`}>
                        {getVehicleTypeInfo(selectedVehicle.status || 'car').name.toUpperCase()}
                      </span>
                      <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full font-medium">
                        {getVehicleTypeInfo(selectedVehicle.status || 'car').description}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 text-lg">
                      {selectedVehicle.make} {selectedVehicle.model}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedVehicle.year} • Plate: {selectedVehicle.plateNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Document Type <span className="text-red-500">*</span>
              {selectedVehicle && (
                <span className="text-xs text-gray-500 ml-2">
                  ({selectedVehicle.status?.toLowerCase() === 'truck' ? 'Truck' : 
                    selectedVehicle.status?.toLowerCase() === 'trailer' ? 'Trailer' : 'Vehicle'} Documents)
                </span>
              )}
            </label>
            <select
              name="documentType"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
              value={formData.documentType}
              onChange={handleInputChange}
            >
              {/* Common Documents */}
              <option value="insurance">Insurance Certificate</option>
              <option value="permit">Operating Permit</option>
              
              {/* Truck-specific Documents */}
              {(!selectedVehicle || selectedVehicle.status?.toLowerCase() === 'truck') && (
                <>
                  <option value="fitness">Fitness Certificate</option>
                  <option value="pollution">Pollution Certificate</option>
                  <option value="driver_license">Driver License</option>
                  <option value="logbook">Logbook</option>
                  <option value="maintenance">Maintenance Record</option>
                </>
              )}
              
              {/* Trailer-specific Documents */}
              {selectedVehicle?.status?.toLowerCase() === 'trailer' && (
                <>
                  <option value="trailer_registration">Trailer Registration</option>
                  <option value="safety_inspection">Safety Inspection</option>
                  <option value="brake_certificate">Brake Certificate</option>
                  <option value="coupling_certificate">Coupling Certificate</option>
                </>
              )}
              
              {/* General Documents */}
              <option value="other">Other Document</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Document Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="documentNumber"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
              value={formData.documentNumber}
              onChange={handleInputChange}
              placeholder="Enter document number"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issued Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="issuedAt"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                value={formData.issuedAt}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expiryDate"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                value={formData.expiryDate}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload Document
            </label>
            <div className="relative">
              <input
                type="file"
                className="w-full border border-gray-300 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#9793E4]/10 file:text-[#9793E4] hover:file:bg-[#9793E4]/20 transition-all"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                <FaFileUpload /> Selected: {selectedFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
          <button
            type="button"
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            onClick={() => setShowDocModal(false)}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] disabled:bg-[#9793E4]/50 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
            onClick={handleSubmitDocument}
            disabled={submitting}
          >
            {submitting ? "Saving..." : editingDoc ? "Update Document" : "Add Document"}
          </button>
        </div>
      </div>
    </div>
  );
  };

  const ViewDocumentModal = () => (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-800">
            Document Details: {getDocumentTypeDisplayName(viewingDoc?.documentType || '')}
          </h3>
          <button
            onClick={() => setShowViewModal(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="text-gray-500" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Document Information */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="text-lg font-bold text-gray-800 mb-4">Document Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Document Number</label>
                <p className="text-lg font-semibold text-gray-800">{viewingDoc?.documentNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Document Type</label>
                <p className="text-lg font-semibold text-gray-800 capitalize">{getDocumentTypeDisplayName(viewingDoc?.documentType || '')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Issued Date</label>
                <p className="text-lg font-semibold text-gray-800">{formatDate(viewingDoc?.issuedAt || '')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Expiry Date</label>
                <p className="text-lg font-semibold text-gray-800">{formatDate(viewingDoc?.expiryDate || '')}</p>
              </div>
            </div>
            {viewingDoc?.status && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`text-sm px-3 py-1 rounded-full font-semibold ${getStatusBadgeColor(viewingDoc.status)}`}>
                  {viewingDoc.status}
                </span>
              </div>
            )}
          </div>

          {/* Document Files */}
          <div>
            <h4 className="text-lg font-bold text-gray-800 mb-4">Uploaded Files</h4>
            {viewingDoc?.files && viewingDoc.files.length > 0 ? (
              <div className="space-y-3">
                {viewingDoc.files.map((file) => (
                  <div key={file._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#9793E4]/10 rounded-lg">
                          <FaFileAlt className="text-[#9793E4]" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {file.fileType.toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-400">
                            Uploaded: {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="p-2.5 text-[#9793E4] hover:bg-[#9793E4]/10 rounded-lg transition-all border border-[#9793E4]/30"
                          onClick={() => window.open(file.fileUrl, '_blank')}
                          title="View File"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          className="p-2.5 text-green-600 hover:bg-green-50 rounded-lg transition-all border border-green-200"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = file.fileUrl;
                            link.download = file.fileName;
                            link.click();
                          }}
                          title="Download File"
                        >
                          <FaDownload size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
                <FaFileAlt size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No files uploaded for this document</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
          <button
            type="button"
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            onClick={() => setShowViewModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
        {/* Modal Header */}
        <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center gap-3 rounded-t-2xl">
          <div className="p-2 bg-red-100 rounded-full">
            <FaTrash className="text-red-600" size={20} />
          </div>
          <h3 className="text-xl font-bold text-red-900">Delete Document</h3>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <p className="text-gray-700 text-base">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
          <button
            type="button"
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            onClick={cancelDelete}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2.5 bg-red-600 !text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-md"
            onClick={confirmDelete}
          >
            Delete Document
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6  min-h-screen bg-gray-50">
      {/* Notifications Container */}
      <div className="fixed top-4 right-4 z-[200] space-y-3 max-w-md">
        {notifications.map(notification => (
          <Notification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Documents</h1>
        {activeTab !== 'all' && (
          <button
            onClick={handleAddDocument}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all font-medium ${
              activeTab === 'truck' 
                ? 'bg-blue-600 hover:bg-blue-700 !text-white' 
                : 'bg-green-600 hover:bg-green-700 !text-white'
            }`}
          >
            <FaPlus /> Add New Document
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-xl">
              <FaCar className="text-gray-600" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{tabStats.all}</h3>
              <p className="text-gray-600 text-sm font-medium">Total Vehicles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FaTruck className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-blue-600">{tabStats.trucks}</h3>
              <p className="text-gray-600 text-sm font-medium">Trucks</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <FaTrailer className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-600">{tabStats.trailers}</h3>
              <p className="text-gray-600 text-sm font-medium">Trailers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'text-[#9793E4] border-b-2 border-[#9793E4] bg-[#9793E4]/5'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaCar className="text-gray-500" size={16} />
              All Vehicles
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                {tabStats.all}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('truck')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'truck'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaTruck className="text-blue-500" size={16} />
              Trucks
              <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                {tabStats.trucks}
              </span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('trailer')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'trailer'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FaTrailer className="text-green-500" size={16} />
              Trailers
              <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                {tabStats.trailers}
              </span>
            </div>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#9793E4] mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading vehicles and documents...</p>
        </div>
      ) : getFilteredVehicles().length === 0 ? (
        <div className="bg-white shadow-lg rounded-2xl p-16 text-center text-gray-500">
          {activeTab === 'all' ? (
            <>
              <FaCar size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-xl font-semibold">No vehicles with documents found</p>
            </>
          ) : activeTab === 'truck' ? (
            <>
              <FaTruck size={64} className="mx-auto mb-4 text-blue-300" />
              <p className="text-xl font-semibold">No truck documents found</p>
              <p className="text-gray-400 mt-2">Add documents for your trucks to see them here</p>
            </>
          ) : (
            <>
              <FaTrailer size={64} className="mx-auto mb-4 text-green-300" />
              <p className="text-xl font-semibold">No trailer documents found</p>
              <p className="text-gray-400 mt-2">Add documents for your trailers to see them here</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {getFilteredVehicles().map((item) => (
            <div key={item._id} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200">
              {/* Vehicle Header */}
              <div className={`p-6 text-white ${
                item.vehicle?.status?.toLowerCase() === 'truck' 
                  ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700'
                  : item.vehicle?.status?.toLowerCase() === 'trailer'
                  ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-700'
                  : 'bg-gradient-to-r from-[#9793E4] via-[#8783D4] to-[#7773C4]'
              }`}>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white text-black bg-opacity-20 rounded-xl backdrop-blur-sm">
                    {getVehicleTypeIcon(item.vehicle?.status || 'car')}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">
                      {item.vehicle?.make} {item.vehicle?.model}
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                      {item.vehicle?.year} • Plate: {item.vehicle?.plateNumber}
                    </p>
                  </div>
                  <span className={`px-4 py-1.5 text-black bg-white bg-opacity-20 rounded-full text-sm font-semibold capitalize backdrop-blur-sm ${
                    item.vehicle?.status?.toLowerCase() === 'truck' 
                      ? 'text-blue-800'
                      : item.vehicle?.status?.toLowerCase() === 'trailer'
                      ? 'text-green-800'
                      : 'text-gray-800'
                  }`}>
                    {item.vehicle?.status}
                  </span>
                </div>
              </div>

              {/* Documents List */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    <FaFileAlt className="text-[#9793E4]" />
                    Documents ({item.documents?.length || 0})
                  </h3>
                </div>

                {!item.documents || item.documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
                    <FaFileAlt size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No documents available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {item.documents.map((doc) => (
                      <div
                        key={doc._id}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#9793E4]/10 rounded-lg">
                              <FaFileAlt className="text-[#9793E4]" size={18} />
                            </div>
                            <div>
                              <span className="font-bold !text-gray-800 capitalize block text-lg">
                                {getDocumentTypeDisplayName(doc.documentType)}
                              </span>
                              {doc.status && (
                                <span className={`text-xs px-3 py-1 rounded-full font-semibold inline-block mt-1 ${getStatusBadgeColor(doc.status)}`}>
                                  {doc.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-blue-200"
                              onClick={() => handleViewDocument(doc)}
                              title="View Document"
                            >
                              <FaEye size={16} />
                            </button>
                            <button
                              className="p-2.5 text-[#9793E4] hover:bg-[#9793E4]/10 rounded-lg transition-all border border-[#9793E4]/30"
                              onClick={() => handleEditDocument(doc, item.vehicle._id)}
                              title="Edit Document"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                              onClick={() => handleDeleteDocument(doc._id)}
                              title="Delete Document"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1.5 ml-12">
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Number:</span>
                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{doc.documentNumber}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Issued:</span>
                            <span>{formatDate(doc.issuedAt)}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-semibold text-gray-700">Expiry:</span>
                            <span>{formatDate(doc.expiryDate)}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showDocModal && <DocumentModal />}
      {showViewModal && <ViewDocumentModal />}
      {deleteConfirmation.show && <DeleteConfirmationModal />}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default VehicleDocument;