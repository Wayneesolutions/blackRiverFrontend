import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Eye, X, CheckCircle, Clock, Truck, Package, MapPin } from "lucide-react";
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
    
    // First, check if we already have the invoice data in our list
    const invoiceFromList = invoices.find(inv => inv._id === invoiceId);
    
    if (invoiceFromList) {
      // If we have the data, use it directly
      setSelectedInvoice(invoiceFromList);
      setViewLoading(false);
    } else {
      // Otherwise, try to fetch from API
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
        // If API call fails, try to use data from list as fallback
        if (invoiceFromList) {
          setSelectedInvoice(invoiceFromList);
          message.warning('Using cached invoice data');
        } else {
          message.error('Failed to fetch invoice details');
          setShowViewModal(false);
        }
      } finally {
        setViewLoading(false);
      }
    }
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div
      className="p-6 bg-[#EDF8FF] min-h-screen"
      style={{ fontSize: '99%' }}
    >
      <h1 className="text-2xl font-bold mb-5" style={{ color: "#1e293b" }}>Invoices</h1>

      {/* Filters */}
      <div
        className="bg-white p-3 shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between mb-6"
        style={{ border: `1px solid #cbd5e1`, boxShadow: `0 10px 30px rgba(0,0,0,0.08)` }}
      >
        <input
          type="text"
          placeholder="🔍 Search by Client Name"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="p-2 text-sm w-full md:w-1/3 outline-none transition border bg-gray-50"
          style={{ borderColor: '#cbd5e1' }}
          {...focusHandlers}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 text-sm w-full md:w-1/4 outline-none transition border bg-gray-50"
          style={{ borderColor: '#cbd5e1' }}
          {...focusHandlers}
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Invoice Table */}
      <div
        className="overflow-x-auto bg-white shadow-xl border"
        style={{ borderColor: '#cbd5e1' }}
      >
        <table className="w-full text-sm text-left">
          <thead style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)', color: "#fff" }}>
            <tr>
              <th className="p-4 font-semibold">Client</th>
              <th className="p-4 font-semibold">Company</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Invoice Date</th>
              <th className="p-4 font-semibold">Due Date</th>
              <th className="p-4 font-semibold">Payment Date</th>
              <th className="p-4 font-semibold text-center">Actions</th>
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
                  className="border-b hover:bg-blue-50/50 transition"
                >
                  <td className="p-4 font-medium text-gray-800">
                    {inv.clientName}
                  </td>
                  <td className="p-4 text-gray-700">
                    {inv.clientCompany && typeof inv.clientCompany === 'object' && inv.clientCompany.companyName 
                      ? inv.clientCompany.companyName 
                      : inv.company?.companyName || "—"}
                  </td>
                  <td className="p-4 text-gray-600">{inv.clientEmail || "—"}</td>
                  <td className="p-4 font-semibold text-gray-900">
                    {inv.currency || "USD"} {inv.amount}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold capitalize ${
                        inv.status === "paid"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {inv.status === "paid" ? (
                        <>
                          <CheckCircle size={14} />
                          Paid
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {inv.invoiceDate
                      ? new Date(inv.invoiceDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-gray-600">
                    {inv.dueDate
                      ? new Date(inv.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-gray-600">
                    {inv.paymentDate
                      ? new Date(inv.paymentDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleViewInvoice(inv._id)}
                      className="p-2 transition-all hover:scale-110"
                      style={{ 
                        color: '#3b82f6',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '2px solid transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                      title="View Invoice"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={9}>
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Invoice Modal */}
      {showViewModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div
            className="bg-white max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto border"
            style={{ borderColor: '#cbd5e1' }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Invoice Details</h2>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 hover:text-gray-600 p-2 transition-colors"
                  style={{ background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
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
                  <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white p-6">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">Invoice #{selectedInvoice._id.slice(-8).toUpperCase()}</h3>
                        <p className="text-blue-100 text-sm">
                          Trip: <span className="font-semibold">{selectedInvoice.tripId?.tripNumber || 'N/A'}</span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold ${
                          selectedInvoice.status === "paid"
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {selectedInvoice.status === "paid" ? (
                          <>
                            <CheckCircle size={16} />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock size={16} />
                            Pending
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="bg-gray-50 p-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-gray-300 pb-2">Client Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Client Name</p>
                        <p className="font-medium text-gray-900">{selectedInvoice.clientName}</p>
                      </div>
                      {selectedInvoice.clientEmail && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Email</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.clientEmail}</p>
                        </div>
                      )}
                      {selectedInvoice.clientPhone && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Phone</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.clientPhone}</p>
                        </div>
                      )}
                      {selectedInvoice.company && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Company</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.company.companyName}</p>
                        </div>
                      )}
                      {selectedInvoice.clientAddress && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-600 mb-1">Address</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.clientAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company Information */}
                  {selectedInvoice.company && (
                    <div className="bg-gray-50 p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-gray-300 pb-2">Company Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Company Name</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.company.companyName}</p>
                        </div>
                        {selectedInvoice.company.contactEmail && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Contact Email</p>
                            <p className="font-medium text-gray-900">{selectedInvoice.company.contactEmail}</p>
                          </div>
                        )}
                        {selectedInvoice.company.contactPhone && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Contact Phone</p>
                            <p className="font-medium text-gray-900">{selectedInvoice.company.contactPhone}</p>
                          </div>
                        )}
                        {selectedInvoice.company.address && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-600 mb-1">Address</p>
                            <p className="font-medium text-gray-900">{selectedInvoice.company.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Invoice Financial Details */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-blue-300 pb-2">Financial Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Invoice Number</p>
                        <p className="font-medium text-gray-900">#{selectedInvoice._id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Amount</p>
                        <p className="font-bold text-2xl text-blue-700">
                          {selectedInvoice.currency || "USD"} {selectedInvoice.amount}
                        </p>
                      </div>
                      {selectedInvoice.taxAmount !== undefined && selectedInvoice.taxAmount !== null && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tax Amount</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.currency || "USD"} {selectedInvoice.taxAmount}</p>
                        </div>
                      )}
                      {selectedInvoice.paymentTerms && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Payment Terms</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.paymentTerms}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
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
                        <p className="text-sm text-gray-600 mb-1">Due Date</p>
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
                          <p className="text-sm text-gray-600 mb-1">Payment Date</p>
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

                  {/* Trip Information */}
                  {selectedInvoice.tripId && (
                    <div className="bg-gray-50 p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-gray-300 pb-2 flex items-center gap-2">
                        <Truck size={20} />
                        Trip Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Trip Number</p>
                          <p className="font-medium text-gray-900">{selectedInvoice.tripId.tripNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <p className="font-medium text-gray-900 capitalize">{selectedInvoice.tripId.status}</p>
                        </div>
                        {selectedInvoice.tripId.truck && (
                          <>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Truck Unit No</p>
                              <p className="font-medium text-gray-900">{selectedInvoice.tripId.truck.unitNo}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Truck Model</p>
                              <p className="font-medium text-gray-900">{selectedInvoice.tripId.truck.makeModel}</p>
                            </div>
                          </>
                        )}
                        {selectedInvoice.tripId.trailer && (
                          <>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Trailer Unit No</p>
                              <p className="font-medium text-gray-900">{selectedInvoice.tripId.trailer.unitNo}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Trailer Type</p>
                              <p className="font-medium text-gray-900">{selectedInvoice.tripId.trailer.unitType}</p>
                            </div>
                          </>
                        )}
                        {selectedInvoice.tripId.plannedStartDate && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Planned Start Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(selectedInvoice.tripId.plannedStartDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        {selectedInvoice.tripId.plannedEndDate && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Planned End Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(selectedInvoice.tripId.plannedEndDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Orders Information */}
                  {selectedInvoice.tripId?.orders && selectedInvoice.tripId.orders.length > 0 && (
                    <div className="bg-gray-50 p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-gray-300 pb-2 flex items-center gap-2">
                        <Package size={20} />
                        Order Details
                      </h4>
                      {selectedInvoice.tripId.orders.map((order: any, index: number) => (
                        <div key={index} className="mb-6 last:mb-0 p-4 bg-white border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Order Number</p>
                              <p className="font-medium text-gray-900">{order.orderNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Customer Order No</p>
                              <p className="font-medium text-gray-900">{order.customerOrderNo}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Order Type</p>
                              <p className="font-medium text-gray-900">{order.orderType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Commodity</p>
                              <p className="font-medium text-gray-900">{order.commodity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Weight</p>
                              <p className="font-medium text-gray-900">{order.weight} {order.weightUnit}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600 mb-1">Packages</p>
                              <p className="font-medium text-gray-900">{order.noOfPackages} {order.noOfPackagesType}</p>
                            </div>
                            {order.pickupLocation && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                  <MapPin size={14} />
                                  Pickup Location
                                </p>
                                <p className="font-medium text-gray-900 text-sm">{order.pickupLocation.place}</p>
                              </div>
                            )}
                            {order.deliveryLocation && (
                              <div className="md:col-span-2">
                                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                                  <MapPin size={14} />
                                  Delivery Location
                                </p>
                                <p className="font-medium text-gray-900 text-sm">{order.deliveryLocation.place}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Service Breakdown */}
                  {selectedInvoice.serviceBreakdown && selectedInvoice.serviceBreakdown.length > 0 && (
                    <div className="bg-gray-50 p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-4 text-lg border-b border-gray-300 pb-2">Service Breakdown</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-200 border-b-2 border-gray-300">
                            <tr>
                              <th className="p-3 text-left font-semibold">Service</th>
                              <th className="p-3 text-right font-semibold">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.serviceBreakdown.map((service: any, index: number) => (
                              <tr key={index} className="border-b border-gray-200">
                                <td className="p-3">{service.description || service.name || '—'}</td>
                                <td className="p-3 text-right font-medium">{selectedInvoice.currency || "USD"} {service.amount || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div className="bg-amber-50 p-6 border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg border-b border-amber-300 pb-2">Notes</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Invoice URL */}
                  {selectedInvoice.invoiceUrl && (
                    <div className="bg-blue-50 border border-blue-300 p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">Invoice Link</p>
                      <a
                        href={selectedInvoice.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                      >
                        {selectedInvoice.invoiceUrl}
                      </a>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-end pt-4 border-t border-gray-300">
                    <button
                      onClick={handleCloseViewModal}
                      className="px-6 py-2 transition-colors font-medium"
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
                    className="mt-4 px-6 py-2 transition-colors font-medium"
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