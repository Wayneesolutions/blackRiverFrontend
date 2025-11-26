import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Eye, X } from "lucide-react";
import { message } from "antd";
import { listInvoices, getInvoiceById, type Invoice } from "../../../../axios/api/invoice";
import { FLEET_COLORS, getFocusStyles } from "../../fleetMaintenance/colorUtils";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const focusHandlers = getFocusStyles();
  const primaryButtonStyle: CSSProperties = {
    background: FLEET_COLORS.gradient,
    color: "#fff",
    boxShadow: `0 15px 30px ${FLEET_COLORS.focusRing}`,
  };

  // Fetch invoices from API
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await listInvoices();
      if (response && response.success) {
        setInvoices(response.data || []);
      } else {
        message.error(response?.message || 'Failed to fetch invoices');
        setInvoices([]);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      message.error('Failed to fetch invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter invoices
  useEffect(() => {
    let filtered = invoices;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Filter by client name
    if (clientFilter.trim() !== "") {
      filtered = filtered.filter((inv) =>
        inv.clientName.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [statusFilter, clientFilter, invoices]);

  // View invoice details
  const handleViewInvoice = async (invoiceId: string) => {
    setViewLoading(true);
    setShowViewModal(true);
    try {
      const response = await getInvoiceById(invoiceId);
      if (response && response.success) {
        setSelectedInvoice(response.data);
      } else {
        message.error(response?.message || 'Failed to fetch invoice details');
        setShowViewModal(false);
      }
    } catch (error: any) {
      console.error('Error fetching invoice:', error);
      message.error('Failed to fetch invoice details');
      setShowViewModal(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div
      className="p-6 bg-gray-50 min-h-screen"
      
    >
      <h1 className="text-3xl font-bold mb-6" style={{ color: "black" }}>Invoices</h1>

      {/* Filters */}
      <div
        className="bg-white p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between mb-8"
        style={{ border: `1px solid ${FLEET_COLORS.focusRing}`, boxShadow: `0 20px 40px ${FLEET_COLORS.focusRing}` }}
      >
        <input
          type="text"
          placeholder="🔍 Search by Client Name"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="rounded-xl p-3 w-full md:w-1/3 outline-none transition border"
          style={{ borderColor: FLEET_COLORS.focusRing }}
          {...focusHandlers}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl p-3 w-full md:w-1/4 outline-none transition border"
          style={{ borderColor: FLEET_COLORS.focusRing }}
          {...focusHandlers}
        >
          <option value="all">All Status</option>
          <option value="paid">✅ Paid</option>
          <option value="pending">⏳ Pending</option>
        </select>
      </div>

      {/* Invoice Table */}
      <div
        className="overflow-x-auto bg-white rounded-2xl shadow-xl border"
        style={{ borderColor: FLEET_COLORS.focusRing }}
      >
        <table className="w-full text-sm text-left">
          <thead style={{ background: FLEET_COLORS.gradient, color: "#fff" }}>
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Company</th>
              <th className="p-4">Email</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Invoice Date</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Payment Date</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={9}>
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3">Loading invoices...</span>
                  </div>
                </td>
              </tr>
            ) : filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium text-gray-700">
                    {inv.clientName}
                  </td>
                  <td className="p-4 text-gray-600">{inv.clientCompany || "—"}</td>
                  <td className="p-4 text-gray-500">{inv.clientEmail || "—"}</td>
                  <td className="p-4 font-semibold text-gray-800">
                    {inv.currency || "USD"} {inv.amount}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        inv.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {inv.invoiceDate
                      ? new Date(inv.invoiceDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-gray-500">
                    {inv.dueDate
                      ? new Date(inv.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-gray-500">
                    {inv.paymentDate
                      ? new Date(inv.paymentDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleViewInvoice(inv._id)}
                      className="p-2 rounded-md transition-colors"
                      style={{ color: FLEET_COLORS.primary }}
                      title="View Invoice"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={9}>
                  🚫 No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Invoice Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className="bg-white rounded-xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border"
            style={{ borderColor: FLEET_COLORS.focusRing }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold" style={{ color: FLEET_COLORS.dark }}>Invoice Details</h2>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 p-2 rounded-lg transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = FLEET_COLORS.focusRing; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <X size={24} />
                </button>
              </div>

              {viewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading invoice details...</span>
                </div>
              ) : selectedInvoice ? (
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-2">Invoice #{selectedInvoice._id.slice(-8).toUpperCase()}</h3>
                        <p className="text-blue-100">
                          Status: <span className="font-semibold capitalize">{selectedInvoice.status}</span>
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          selectedInvoice.status === "paid"
                            ? "bg-green-500 text-white"
                            : "bg-yellow-500 text-white"
                        }`}
                      >
                        {selectedInvoice.status === "paid" ? "✅ Paid" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Client Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Client Name</p>
                        <p className="font-medium text-gray-900">{selectedInvoice.clientName}</p>
                      </div>
                      {selectedInvoice.clientEmail && (
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.clientEmail}</p>
                        </div>
                      )}
                      {selectedInvoice.clientCompany && (
                        <div>
                          <p className="text-sm text-gray-600">Company</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.clientCompany}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Invoice Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-bold text-xl text-gray-900">
                          {selectedInvoice.currency || "USD"} {selectedInvoice.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Invoice Date</p>
                        <p className="font-medium text-gray-900">
                          {selectedInvoice.invoiceDate
                            ? new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-medium text-gray-900">
                          {selectedInvoice.dueDate
                            ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : "—"}
                        </p>
                      </div>
                      {selectedInvoice.paymentDate && (
                        <div>
                          <p className="text-sm text-gray-600">Payment Date</p>
                          <p className="font-medium text-gray-900">
                            {new Date(selectedInvoice.paymentDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Invoice URL */}
                  {selectedInvoice.invoiceUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-1">Invoice Link</p>
                      <a
                        href={selectedInvoice.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline break-all"
                      >
                        {selectedInvoice.invoiceUrl}
                      </a>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-end pt-4 border-t">
                    <button
                      onClick={handleCloseViewModal}
                      className="px-6 py-2 rounded-lg transition-colors font-medium"
                      style={primaryButtonStyle}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load invoice details</p>
                  <button
                    onClick={handleCloseViewModal}
                    className="mt-4 px-6 py-2 rounded-lg transition-colors font-medium"
                    style={primaryButtonStyle}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
