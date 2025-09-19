import React, { useState } from "react";
import { Upload, FileText, Trash2, Eye, ArrowLeft, User } from "lucide-react";

const mockDrivers = [
  { id: 1, name: "John Doe", status: "active", email: "john@example.com", phone: "+91 9876543210" },
  { id: 2, name: "Amit Sharma", status: "inactive", email: "amit@example.com", phone: "+91 9123456780" },
];

const mockDocs = [
  { id: 1, type: "Driver License", number: "DL12345", expiry: "2025-01-10", status: "completed" },
  { id: 2, type: "Medical Certificate", number: "MC56789", expiry: "2024-11-01", status: "expiring-soon" },
];

function DriverDocument() {
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [documents, setDocuments] = useState(mockDocs);
  const [openDialog, setOpenDialog] = useState(false);

  const handleAddDocument = () => {
    setOpenDialog(false);
    // API logic here
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight"> Driver Documents</h1>

      {/* Driver List */}
      {!selectedDriver && (
        <div className="grid md:grid-cols-3 gap-6">
          {mockDrivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
              onClick={() => setSelectedDriver(driver)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{driver.name}</h2>
                  <p className="text-sm text-gray-500">{driver.email}</p>
                </div>
              </div>
              <p className="text-sm mb-2">📞 {driver.phone}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  driver.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {driver.status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Driver Detail */}
      {selectedDriver && (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedDriver(null)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Drivers
          </button>

          {/* Driver Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-xl">{selectedDriver.name}</h2>
              <p className="text-sm text-gray-500">{selectedDriver.email}</p>
              <p className="text-sm">{selectedDriver.phone}</p>
            </div>
          </div>

          {/* Document Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">📄 Documents</h3>
              <button
                onClick={() => setOpenDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow hover:from-blue-700 hover:to-blue-800 transition"
              >
                <Upload className="w-4 h-4" /> Add Document
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-left font-medium">Number</th>
                    <th className="p-3 text-left font-medium">Expiry</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc, i) => (
                    <tr
                      key={doc.id}
                      className={`${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } border-t`}
                    >
                      <td className="p-3">{doc.type}</td>
                      <td className="p-3">{doc.number}</td>
                      <td className="p-3">{doc.expiry}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            doc.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "expired"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2">
                        <button className="p-2 rounded hover:bg-gray-100">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 rounded hover:bg-gray-100">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {documents.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {openDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold mb-6">➕ Add Driver Document</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Type</label>
                <select className="w-full border rounded-lg p-2">
                  <option>Select Type</option>
                  <option>Driver License</option>
                  <option>Medical Certificate</option>
                  <option>Work Authorization</option>
                  <option>Training Certificate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Document Number</label>
                <input
                  type="text"
                  placeholder="Enter number"
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Issue Date</label>
                  <input type="date" className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input type="date" className="w-full border rounded-lg p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload File</label>
                <input type="file" className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setOpenDialog(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDocument;
