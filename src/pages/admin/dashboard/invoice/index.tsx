import { useState, useEffect, useRef } from "react";
import { Eye, X, CheckCircle, Clock, Truck, Package, MapPin, Search, Filter } from "lucide-react";
import { listInvoices, getInvoiceById } from "../../../../axios/api/invoice";
import { message } from "antd";

interface Invoice {
  _id: string;
  clientName: string;
  clientCompany?: { companyName: string };
  company?: {
    companyName: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
  };
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  amount: string;
  currency?: string;
  status: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentDate?: string;
  tripId?: any;
  serviceBreakdown?: any[];
  notes?: string;
  invoiceUrl?: string;
  taxAmount?: number;
  paymentTerms?: string;
}

const InvoiceList = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

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

  // Fetch invoices on mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter invoices
  useEffect(() => {
    let filtered = invoices;

    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    if (clientFilter.trim() !== "") {
      filtered = filtered.filter((inv) =>
        inv.clientName.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [statusFilter, clientFilter, invoices]);

  // Sync scroll between top and bottom scrollbars
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const bottomScroll = bottomScrollRef.current;

    if (!topScroll || !bottomScroll) return;

    let isScrolling = false;

    const handleTopScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      bottomScroll.scrollLeft = topScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    const handleBottomScroll = () => {
      if (isScrolling) return;
      isScrolling = true;
      topScroll.scrollLeft = bottomScroll.scrollLeft;
      requestAnimationFrame(() => {
        isScrolling = false;
      });
    };

    // Sync scroll widths
    const syncScrollWidths = () => {
      // Get the actual scrollable width from the bottom table container
      const bottomScrollWidth = bottomScroll.scrollWidth;
      const topInner = topScroll.querySelector('.top-scroll-content') as HTMLElement;
      if (topInner && bottomScrollWidth > 0) {
        topInner.style.width = `${bottomScrollWidth}px`;
        // Also sync initial scroll position
        topScroll.scrollLeft = bottomScroll.scrollLeft;
      }
    };

    // Initial sync - wait for table to render
    const timeoutId = setTimeout(syncScrollWidths, 100);
    // Also sync after a short delay to ensure table is fully rendered
    const timeoutId2 = setTimeout(syncScrollWidths, 300);
    // Sync when table content changes
    const timeoutId3 = setTimeout(syncScrollWidths, 500);

    // Observe table changes
    const tableObserver = new MutationObserver(() => {
      syncScrollWidths();
    });

    const bottomTable = bottomScroll.querySelector('table');
    if (bottomTable) {
      tableObserver.observe(bottomTable, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }

    topScroll.addEventListener('scroll', handleTopScroll, { passive: true });
    bottomScroll.addEventListener('scroll', handleBottomScroll, { passive: true });
    window.addEventListener('resize', syncScrollWidths);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      tableObserver.disconnect();
      topScroll.removeEventListener('scroll', handleTopScroll);
      bottomScroll.removeEventListener('scroll', handleBottomScroll);
      window.removeEventListener('resize', syncScrollWidths);
    };
  }, [filteredInvoices, loading]);

  const handleViewInvoice = async (invoiceId: string) => {
    setViewLoading(true);
    setShowSidebar(true);

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
          setShowSidebar(false);
        }
      } catch (error: any) {
        console.error('Error fetching invoice:', error);
        // If API call fails, try to use data from list as fallback
        if (invoiceFromList) {
          setSelectedInvoice(invoiceFromList);
          message.warning('Using cached invoice data');
        } else {
          message.error('Failed to fetch invoice details');
          setShowSidebar(false);
        }
      } finally {
        setViewLoading(false);
      }
    }
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
    setTimeout(() => setSelectedInvoice(null), 300);
  };

  return (
    <div className="p-6 bg-main min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-primary">Invoices</h1>
      {/* Filters - Enhanced Version */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">


        {/* LEFT → Search */}
        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A90E2]"
            size={18}
          />

          <input
            type="text"
            placeholder="Search by Client Name"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full text-sm rounded-lg
       bg-card text-[#4A4A4A] placeholder-gray-400
       border border-[#D0E6F9]
       focus:ring-2 focus:ring-[#5CB4F4] focus:border-[#5CB4F4]
       outline-none transition-all shadow-sm"
          />
        </div>



        {/* RIGHT → Status Filter */}
        <div className="relative w-full md:w-48 md:text-right">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#4A90E2]" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-full text-sm border-2 border-transparent rounded-lg 
                 focus:ring-2 focus:ring-white focus:border-white outline-none transition-all 
                 appearance-none bg-card cursor-pointer shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>

      </div>


      {/* Invoice Table */}
      <div className="bg-card shadow-lg">
        {/* Top Scrollbar - Only visible horizontal scrollbar */}
        <style>{`
          .top-scrollbar-container::-webkit-scrollbar {
            height: 8px;
          }
          .top-scrollbar-container::-webkit-scrollbar-track {
            background: #f7fafc;
          }
          .top-scrollbar-container::-webkit-scrollbar-thumb {
            background: #cbd5e0;
            border-radius: 4px;
          }
          .top-scrollbar-container::-webkit-scrollbar-thumb:hover {
            background: #a0aec0;
          }
        `}</style>
        <div 
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden top-scrollbar-container"
          style={{ 
            maxHeight: '20px',
            marginBottom: '2px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f7fafc' /* Firefox */
          }}
        >
          <div className="top-scroll-content" style={{ height: '1px' }}></div>
        </div>
        {/* Main Table - Scrollbar hidden, controlled by top scrollbar */}
        <style>{`
          .table-container-hidden-scrollbar {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }
          .table-container-hidden-scrollbar::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        <div 
          ref={bottomScrollRef}
          className="overflow-x-auto table-container-hidden-scrollbar"
        >
          <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-[#5CB4F4] to-[#3C8DCE] text-white">
            <tr>
              <th className="p-4 text-left font-semibold">Client</th>
              <th className="p-4 text-left font-semibold">Company</th>
              <th className="p-4 text-left font-semibold">Email</th>
              <th className="p-4 text-left font-semibold">Amount</th>
              <th className="p-4 text-left font-semibold">Status</th>
              <th className="p-4 text-left font-semibold">Invoice Date</th>
              <th className="p-4 text-left font-semibold">Due Date</th>
              <th className="p-4 text-left font-semibold">Payment Date</th>
              <th className="p-4 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="p-8 text-center text-secondary" colSpan={9}>
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
                  className="hover:bg-blue-50/50 transition-colors"
                >
                  <td className="p-4 font-medium text-primary">
                    {inv.clientName}
                  </td>
                  <td className="p-4 text-primary">
                    {inv.clientCompany?.companyName || inv.company?.companyName || "—"}
                  </td>
                  <td className="p-4 text-secondary">{inv.clientEmail || "—"}</td>
                  <td className="p-4 font-semibold text-primary">
                    {inv.currency} {inv.amount}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${inv.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
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
                  <td className="p-4 text-secondary">
                    {inv.invoiceDate
                      ? new Date(inv.invoiceDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-secondary">
                    {inv.dueDate
                      ? new Date(inv.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-secondary">
                    {inv.paymentDate
                      ? new Date(inv.paymentDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleViewInvoice(inv._id)}
                      className="inline-flex items-center justify-center p-2 rounded-lg transition-all hover:scale-110 bg-card text-[#00D1FF] hover:bg-blue-100"
                      title="View Invoice"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-8 text-center text-secondary" colSpan={9}>
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={handleCloseSidebar}
          ></div>

          {/* Sidebar Panel */}
          <div
            className={`fixed right-0 top-0 h-full w-full md:w-2/3 lg:w-1/2 bg-card shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300 ${showSidebar ? 'translate-x-0' : 'translate-x-full'
              }`}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-theme">
                <h2 className="text-2xl font-bold text-primary">Invoice Details</h2>
                <button
                  onClick={handleCloseSidebar}
                  className="p-2 rounded-lg text-secondary hover:text-secondary hover:bg-gray-100 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {viewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-secondary">Loading invoice details...</span>
                </div>
              ) : selectedInvoice ? (
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="bg-gradient-to-r from-[#4A90E2] to-[#357ABD] text-white p-6 rounded-lg">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">
                          Invoice #{selectedInvoice._id.slice(-8).toUpperCase()}
                        </h3>
                        {selectedInvoice.tripId?.tripNumber && (
                          <p className="text-blue-100 text-sm flex items-center gap-2">
                            <Truck size={16} />
                            Trip: <span className="font-semibold">{selectedInvoice.tripId.tripNumber}</span>
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${selectedInvoice.status === "paid"
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
                  <div className="bg-card p-6 rounded-lg border border-theme">
                    <h4 className="font-semibold text-primary mb-4 text-lg">Client Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-secondary mb-1">Client Name</p>
                        <p className="font-medium text-primary">{selectedInvoice.clientName}</p>
                      </div>
                      {selectedInvoice.clientEmail && (
                        <div>
                          <p className="text-sm text-secondary mb-1">Email</p>
                          <p className="font-medium text-primary">{selectedInvoice.clientEmail}</p>
                        </div>
                      )}
                      {selectedInvoice.clientPhone && (
                        <div>
                          <p className="text-sm text-secondary mb-1">Phone</p>
                          <p className="font-medium text-primary">{selectedInvoice.clientPhone}</p>
                        </div>
                      )}
                      {selectedInvoice.company && (
                        <div>
                          <p className="text-sm text-secondary mb-1">Company</p>
                          <p className="font-medium text-primary">{selectedInvoice.company.companyName}</p>
                        </div>
                      )}
                      {selectedInvoice.clientAddress && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-secondary mb-1">Address</p>
                          <p className="font-medium text-primary">{selectedInvoice.clientAddress}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-primary mb-4 text-lg">Financial Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-secondary mb-1">Invoice Number</p>
                        <p className="font-medium text-primary">
                          #{selectedInvoice._id.slice(-8).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary mb-1">Amount</p>
                        <p className="font-bold text-2xl text-blue-700">
                          {selectedInvoice.currency} {selectedInvoice.amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary mb-1">Invoice Date</p>
                        <p className="font-medium text-primary">
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
                        <p className="text-sm text-secondary mb-1">Due Date</p>
                        <p className="font-medium text-primary">
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
                        <div className="md:col-span-2">
                          <p className="text-sm text-secondary mb-1">Payment Date</p>
                          <p className="font-medium text-primary">
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
                    <div className="bg-card p-6 rounded-lg border border-theme">
                      <h4 className="font-semibold text-primary mb-4 text-lg flex items-center gap-2">
                        <Truck size={20} className="text-[#00D1FF]" />
                        Trip Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-secondary mb-1">Trip Number</p>
                          <p className="font-medium text-primary">{selectedInvoice.tripId.tripNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-secondary mb-1">Status</p>
                          <p className="font-medium text-primary capitalize">{selectedInvoice.tripId.status}</p>
                        </div>
                        {selectedInvoice.tripId.truck && (
                          <>
                            <div>
                              <p className="text-sm text-secondary mb-1">Truck Unit No</p>
                              <p className="font-medium text-primary">{selectedInvoice.tripId.truck.unitNo}</p>
                            </div>
                            <div>
                              <p className="text-sm text-secondary mb-1">Truck Model</p>
                              <p className="font-medium text-primary">{selectedInvoice.tripId.truck.makeModel}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Orders Information */}
                  {selectedInvoice.tripId?.orders && selectedInvoice.tripId.orders.length > 0 && (
                    <div className="bg-card p-6 rounded-lg border border-theme">
                      <h4 className="font-semibold text-primary mb-4 text-lg flex items-center gap-2">
                        <Package size={20} className="text-[#00D1FF]" />
                        Order Details
                      </h4>
                      {selectedInvoice.tripId.orders.map((order: any, index: number) => (
                        <div key={index} className="mb-4 last:mb-0 p-4 bg-card rounded-lg border border-theme">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-secondary mb-1">Order Number</p>
                              <p className="font-medium text-primary">{order.orderNumber}</p>
                            </div>
                            <div>
                              <p className="text-secondary mb-1">Commodity</p>
                              <p className="font-medium text-primary">{order.commodity}</p>
                            </div>
                            {order.pickupLocation && (
                              <div className="md:col-span-2">
                                <p className="text-secondary mb-1 flex items-center gap-1">
                                  <MapPin size={14} className="text-[#00D1FF]" />
                                  Pickup Location
                                </p>
                                <p className="font-medium text-primary text-sm">{order.pickupLocation.place}</p>
                              </div>
                            )}
                            {order.deliveryLocation && (
                              <div className="md:col-span-2">
                                <p className="text-secondary mb-1 flex items-center gap-1">
                                  <MapPin size={14} className="text-green-600" />
                                  Delivery Location
                                </p>
                                <p className="font-medium text-primary text-sm">{order.deliveryLocation.place}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-primary mb-2 text-lg">Notes</h4>
                      <p className="text-primary whitespace-pre-wrap">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="flex justify-end pt-4 border-t-2 border-theme">
                    <button
                      onClick={handleCloseSidebar}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#4A90E2] to-[#357ABD] !text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-secondary">Failed to load invoice details</p>
                  <button
                    onClick={handleCloseSidebar}
                    className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceList;