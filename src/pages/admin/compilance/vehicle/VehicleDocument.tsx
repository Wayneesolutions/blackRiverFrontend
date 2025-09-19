import React, { useState } from "react";
import { FaCar, FaPlus, FaEdit, FaTrash, FaFileUpload } from "react-icons/fa";

function VehicleDocument() {
  // Dummy vehicles (simulate schema fields)
  const [vehicles] = useState([
    {
      _id: "1",
      internalId: "V001",
      plateNumber: "AB12CD3456",
      vinNumber: "1HGCM82633A123456",
      make: "Volvo",
      model: "FH16",
      year: 2022,
      status: "moving",
      driver: "John Doe",
      fuelLevel: 60,
      odometer: 34000,
      engineOn: true,
      currentLocation: {
        address: "NH-44, Bangalore",
        latitude: "12.9716",
        longitude: "77.5946",
      },
      documents: [
        {
          _id: "d1",
          documentType: "insurance",
          documentNumber: "INS12345",
          status: "completed",
          expiryDate: "2025-01-10",
        },
        {
          _id: "d2",
          documentType: "permit",
          documentNumber: "PRM56789",
          status: "expiring-soon",
          expiryDate: "2024-12-01",
        },
      ],
    },
    {
      _id: "2",
      internalId: "V002",
      plateNumber: "XY34EF7890",
      vinNumber: "2HGCM82633A654321",
      make: "Tata",
      model: "Prima",
      year: 2021,
      status: "idle",
      driver: "Jane Smith",
      fuelLevel: 45,
      odometer: 28000,
      engineOn: false,
      currentLocation: {
        address: "Hyderabad Ring Road",
        latitude: "17.3850",
        longitude: "78.4867",
      },
      documents: [],
    },
  ]);

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const handleAddDocument = () => {
    setEditingDoc(null);
    setShowDocModal(true);
  };

  const handleEditDocument = (doc: any) => {
    setEditingDoc(doc);
    setShowDocModal(true);
  };

  // Vehicle list UI
  const VehicleList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle._id}
          className="bg-white shadow-md rounded-xl p-5 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setSelectedVehicle(vehicle)}
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-100 rounded-full text-blue-600">
              <FaCar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">
                {vehicle.make} {vehicle.model} ({vehicle.year})
              </h3>
              <p className="text-sm text-gray-500">
                Plate: {vehicle.plateNumber} | Driver: {vehicle.driver}
              </p>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                {vehicle.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Vehicle details + documents
  const VehicleDetails = () => (
    <div className="bg-white shadow-md rounded-xl p-6">
      <button
        className="mb-4 text-sm text-blue-600 hover:underline"
        onClick={() => setSelectedVehicle(null)}
      >
        ← Back to Vehicles
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
      </h2>

      {/* Vehicle Info */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-6">
        <p><strong>Plate:</strong> {selectedVehicle.plateNumber}</p>
        <p><strong>VIN:</strong> {selectedVehicle.vinNumber}</p>
        <p><strong>Driver:</strong> {selectedVehicle.driver}</p>
        <p><strong>Status:</strong> {selectedVehicle.status}</p>
        <p><strong>Fuel Level:</strong> {selectedVehicle.fuelLevel}%</p>
        <p><strong>Odometer:</strong> {selectedVehicle.odometer} km</p>
        <p><strong>Engine:</strong> {selectedVehicle.engineOn ? "On" : "Off"}</p>
        <p><strong>Location:</strong> {selectedVehicle.currentLocation.address}</p>
      </div>

      {/* Documents */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">Documents</h3>
        <button
          onClick={handleAddDocument}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FaPlus /> Add Document
        </button>
      </div>

      {selectedVehicle.documents.length === 0 ? (
        <p className="text-gray-500">No documents available.</p>
      ) : (
        <div className="space-y-3">
          {selectedVehicle.documents.map((doc: any) => (
            <div
              key={doc._id}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
            >
              <div>
                <p className="font-medium capitalize">{doc.documentType}</p>
                <p className="text-xs text-gray-500">
                  Number: {doc.documentNumber} | Expiry: {doc.expiryDate}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    doc.status === "completed"
                      ? "bg-green-100 text-green-600"
                      : doc.status === "expired"
                      ? "bg-red-100 text-red-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  className="text-blue-600 hover:text-blue-800"
                  onClick={() => handleEditDocument(doc)}
                >
                  <FaEdit />
                </button>
                <button className="text-red-600 hover:text-red-800">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Add/Update Document Modal
  const DocumentModal = () => (
    <div className="fixed inset-0  bg-opacity-50 bg-white flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <h3 className="text-lg font-bold mb-4">
          {editingDoc ? "Update Document" : "Add Document"}
        </h3>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Document Type</label>
            <select className="w-full border rounded-lg p-2 defaultValue={editingDoc?.documentType}">
              <option value="insurance">Insurance</option>
              <option value="permit">Permit</option>
              <option value="fitness">Fitness</option>
              <option value="pollution">Pollution</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Document Number</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2"
              defaultValue={editingDoc?.documentNumber || ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Expiry Date</label>
            <input
              type="date"
              className="w-full border rounded-lg p-2"
              defaultValue={editingDoc?.expiryDate || ""}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Upload Document</label>
            <div className="flex items-center gap-2">
              <input type="file" className="border rounded-lg p-2 w-full" />
              <FaFileUpload className="text-gray-500" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              onClick={() => setShowDocModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingDoc ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Vehicle Documents</h1>
      {!selectedVehicle ? <VehicleList /> : <VehicleDetails />}
      {showDocModal && <DocumentModal />}
    </div>
  );
}

export default VehicleDocument;
