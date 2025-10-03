import { useState, useEffect } from "react";
import { FaCar, FaPlus, FaEdit, FaTrash, FaFileUpload, FaFileAlt, FaTimes } from "react-icons/fa";
import {
  getVehicleDocument,
  createVehicleDocument,
  updateVehicleDocument,
  deleteVehicleDocument
} from "../../../../axios/api/compilance.vehicledoc";
import { useVehicles } from "../../../../customHooks/useVehicles";

function VehicleDocument() {
  const { vehicles } = useVehicles();
  
  const [vehicleDocuments, setVehicleDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    vehicleId: "",
    documentType: "insurance",
    documentNumber: "",
    expiryDate: "",
    issuedAt: ""
  });

  const fetchAllDocuments = async () => {
    setLoading(true);
    try {
      const res = await getVehicleDocument();
      if (res?.success) {
        setVehicleDocuments(res.documentsByVehicle || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
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

  const handleEditDocument = (doc, vehicleId) => {
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

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await deleteVehicleDocument(docId);
      if (res?.success) {
        alert(res.message || "Document deleted successfully");
        fetchAllDocuments();
      } else {
        alert(res?.message || "Failed to delete document");
      }
    } catch (err) {
      alert(err?.message || "Error deleting document");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitDocument = async () => {
    if (!formData.vehicleId || !formData.documentNumber || !formData.expiryDate || !formData.issuedAt) {
      alert("Please fill all required fields");
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
        alert(res.message || `Document ${editingDoc ? "updated" : "created"} successfully`);
        setShowDocModal(false);
        fetchAllDocuments();
      } else {
        alert(res?.message || `Failed to ${editingDoc ? "update" : "create"} document`);
      }
    } catch (err) {
      alert(err?.message || "Error submitting document");
    }

    setSubmitting(false);
  };

  const getStatusBadgeColor = (status) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const DocumentModal = () => (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-800">
            {editingDoc ? "Update Document" : "Add New Document"}
          </h3>
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Vehicle <span className="text-red-500">*</span>
            </label>
            <select
              name="vehicleId"
              className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.vehicleId}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Choose a Vehicle --</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle._id} value={vehicle._id}>
                  {vehicle.make} {vehicle.model} ({vehicle.year}) - {vehicle.plateNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              name="documentType"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={formData.documentType}
              onChange={handleInputChange}
            >
              <option value="insurance">Insurance</option>
              <option value="permit">Permit</option>
              <option value="fitness">Fitness</option>
              <option value="pollution">Pollution</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Document Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="documentNumber"
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                className="w-full border border-gray-300 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all"
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
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
            onClick={handleSubmitDocument}
            disabled={submitting}
          >
            {submitting ? "Saving..." : editingDoc ? "Update Document" : "Add Document"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vehicle Documents</h1>
        <button
          onClick={handleAddDocument}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all font-medium"
        >
          <FaPlus /> Add New Document
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading vehicles and documents...</p>
        </div>
      ) : vehicleDocuments.length === 0 ? (
        <div className="bg-white shadow-lg rounded-2xl p-16 text-center text-gray-500">
          <FaCar size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-xl font-semibold">No vehicles with documents found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {vehicleDocuments.map((item) => (
            <div key={item._id} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200">
              {/* Vehicle Header */}
              <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-white text-black bg-opacity-20 rounded-xl backdrop-blur-sm">
                    <FaCar size={28} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">
                      {item.vehicle?.make} {item.vehicle?.model}
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                      {item.vehicle?.year} • Plate: {item.vehicle?.plateNumber}
                    </p>
                  </div>
                  <span className="px-4 py-1.5 text-black bg-white bg-opacity-20 rounded-full text-sm font-semibold capitalize backdrop-blur-sm">
                    {item.vehicle?.status}
                  </span>
                </div>
              </div>

              {/* Documents List */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    <FaFileAlt className="text-blue-600" />
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
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FaFileAlt className="text-blue-600" size={18} />
                            </div>
                            <div>
                              <span className="font-bold !text-gray-800 capitalize block text-lg">
                                {doc.documentType}
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
    </div>
  );
}

export default VehicleDocument;