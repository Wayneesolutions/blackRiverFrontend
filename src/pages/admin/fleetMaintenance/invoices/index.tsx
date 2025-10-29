import { useState, useEffect } from 'react';
import { 
  FaFileInvoice, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaSearch, 
  FaDollarSign,
  FaShoppingCart,
  FaFileAlt
} from 'react-icons/fa';

// Enhanced Types for comprehensive invoice management
interface InvoiceItem {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  createdAt: string;
  dueDate: string;
  notes?: string;
}

interface SparePart {
  _id: string;
  partNumber: string;
  partName: string;
  stockQty: number;
  sellingPrice: number;
}

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

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

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Form state
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    taxRate: 13,
    notes: '',
    items: [] as InvoiceItem[],
    status: 'draft' as Invoice['status'],
    dueDate: ''
  });

  // Sample data for demonstration
  useEffect(() => {
    setInvoices([
      {
        _id: '1',
        invoiceNumber: 'INV-2024-001',
        customerName: 'City Transport Ltd',
        customerEmail: 'billing@citytransport.com',
        customerPhone: '+1-555-0789',
        customerAddress: '789 Business Blvd, Vancouver, BC',
        items: [
          {
            partId: '1',
            partNumber: 'ENG-001',
            partName: 'Engine Oil Filter',
            quantity: 10,
            unitPrice: 65.00,
            totalPrice: 650.00
          },
          {
            partId: '2',
            partNumber: 'BRAKE-002',
            partName: 'Brake Pad Set',
            quantity: 5,
            unitPrice: 180.00,
            totalPrice: 900.00
          }
        ],
        subtotal: 1550.00,
        taxRate: 13,
        taxAmount: 201.50,
        total: 1751.50,
        status: 'sent',
        createdAt: '2024-01-25T09:00:00Z',
        dueDate: '2024-02-25',
        notes: 'Rush order - please expedite'
      },
      {
        _id: '2',
        invoiceNumber: 'INV-2024-002',
        customerName: 'Metro Logistics Inc',
        customerEmail: 'accounts@metrologistics.com',
        customerPhone: '+1-555-0123',
        customerAddress: '456 Industrial Ave, Toronto, ON',
        items: [
          {
            partId: '3',
            partNumber: 'TRANS-003',
            partName: 'Transmission Fluid',
            quantity: 20,
            unitPrice: 45.00,
            totalPrice: 900.00
          }
        ],
        subtotal: 900.00,
        taxRate: 13,
        taxAmount: 117.00,
        total: 1017.00,
        status: 'paid',
        createdAt: '2024-01-20T14:30:00Z',
        dueDate: '2024-02-20',
        notes: 'Regular monthly order'
      },
      {
        _id: '3',
        invoiceNumber: 'INV-2024-003',
        customerName: 'Express Delivery Co',
        customerEmail: 'purchasing@expressdelivery.com',
        customerPhone: '+1-555-0456',
        customerAddress: '321 Commerce St, Montreal, QC',
        items: [
          {
            partId: '4',
            partNumber: 'ELEC-004',
            partName: 'Alternator',
            quantity: 3,
            unitPrice: 250.00,
            totalPrice: 750.00
          }
        ],
        subtotal: 750.00,
        taxRate: 13,
        taxAmount: 97.50,
        total: 847.50,
        status: 'draft',
        createdAt: '2024-01-28T11:15:00Z',
        dueDate: '2024-02-28',
        notes: 'Pending approval'
      }
    ]);

    setSpareParts([
      {
        _id: '1',
        partNumber: 'ENG-001',
        partName: 'Engine Oil Filter',
        stockQty: 25,
        sellingPrice: 65.00
      },
      {
        _id: '2',
        partNumber: 'BRAKE-002',
        partName: 'Brake Pad Set',
        stockQty: 8,
        sellingPrice: 180.00
      },
      {
        _id: '3',
        partNumber: 'TRANS-003',
        partName: 'Transmission Fluid',
        stockQty: 50,
        sellingPrice: 45.00
      },
      {
        _id: '4',
        partNumber: 'ELEC-004',
        partName: 'Alternator',
        stockQty: 5,
        sellingPrice: 250.00
      }
    ]);

    setLoading(false);
  }, []);

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateInvoice = () => {
    if (!invoiceForm.customerName || invoiceForm.items.length === 0) {
      addNotification('error', 'Please fill customer name and add at least one item');
      return;
    }

    const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = subtotal * (invoiceForm.taxRate / 100);
    const total = subtotal + taxAmount;

    const newInvoice: Invoice = {
      _id: Date.now().toString(),
      invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      customerName: invoiceForm.customerName,
      customerEmail: invoiceForm.customerEmail,
      customerPhone: invoiceForm.customerPhone,
      customerAddress: invoiceForm.customerAddress,
      items: invoiceForm.items,
      subtotal,
      taxRate: invoiceForm.taxRate,
      taxAmount,
      total,
      status: 'draft',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: invoiceForm.notes
    };

    setInvoices(prev => [...prev, newInvoice]);
    addNotification('success', 'Invoice created successfully');
    setShowCreateModal(false);
    resetForm();
  };

  const resetForm = () => {
    setInvoiceForm({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      taxRate: 13,
      notes: '',
      items: [],
      status: 'draft' as Invoice['status'],
      dueDate: ''
    });
  };

  const addItemToInvoice = (part: SparePart) => {
    const existingItem = invoiceForm.items.find(item => item.partId === part._id);
    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
    } else {
      invoiceForm.items.push({
        partId: part._id,
        partNumber: part.partNumber,
        partName: part.partName,
        quantity: 1,
        unitPrice: part.sellingPrice,
        totalPrice: part.sellingPrice
      });
    }
    setInvoiceForm({ ...invoiceForm });
  };

  const removeItemFromInvoice = (partId: string) => {
    invoiceForm.items = invoiceForm.items.filter(item => item.partId !== partId);
    setInvoiceForm({ ...invoiceForm });
  };

  const updateItemQuantity = (partId: string, quantity: number) => {
    const item = invoiceForm.items.find(item => item.partId === partId);
    if (item) {
      item.quantity = quantity;
      item.totalPrice = item.quantity * item.unitPrice;
      setInvoiceForm({ ...invoiceForm });
    }
  };

  const handleStatusChange = (invoiceId: string, newStatus: Invoice['status']) => {
    setInvoices(prev => prev.map(invoice => 
      invoice._id === invoiceId ? { ...invoice, status: newStatus } : invoice
    ));
    addNotification('success', `Invoice status updated to ${newStatus}`);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceForm({
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      customerPhone: invoice.customerPhone,
      customerAddress: invoice.customerAddress,
      items: invoice.items,
      taxRate: invoice.taxRate,
      status: invoice.status,
      dueDate: invoice.dueDate,
      notes: invoice.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateInvoice = () => {
    if (!selectedInvoice) return;
    
    const updatedInvoice: Invoice = {
      ...selectedInvoice,
      ...invoiceForm,
      subtotal: invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0),
      taxAmount: invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0) * (invoiceForm.taxRate / 100),
      total: invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0) * (1 + invoiceForm.taxRate / 100)
    };

    setInvoices(prev => prev.map(invoice => 
      invoice._id === selectedInvoice._id ? updatedInvoice : invoice
    ));
    
    setShowEditModal(false);
    setSelectedInvoice(null);
    addNotification('success', 'Invoice updated successfully');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteModal(true);
  };

  const confirmDeleteInvoice = () => {
    if (invoiceToDelete) {
      setInvoices(prev => prev.filter(invoice => invoice._id !== invoiceToDelete));
      addNotification('success', 'Invoice deleted successfully');
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalStats = () => {
    const totalInvoices = invoices.length;
    const totalValue = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid').length;
    const pendingInvoices = invoices.filter(invoice => invoice.status === 'sent').length;
    
    return { totalInvoices, totalValue, paidInvoices, pendingInvoices };
  };

  const stats = getTotalStats();

  return (
    <div className="p-6 min-h-screen bg-gray-50">
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

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FaFileInvoice className="text-[#9793E4]" />
              Invoice Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage invoices for spare parts sales</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] shadow-lg hover:shadow-xl transition-all font-medium"
          >
            <FaPlus /> Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Invoices</h3>
            <FaFileInvoice className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalInvoices}</div>
          <p className="text-sm text-gray-500 mt-1">All invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Value</h3>
            <FaDollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">${stats.totalValue.toFixed(2)}</div>
          <p className="text-sm text-gray-500 mt-1">All invoices</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Paid Invoices</h3>
            <FaCheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.paidInvoices}</div>
          <p className="text-sm text-gray-500 mt-1">Completed payments</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Pending</h3>
            <FaExclamationCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.pendingInvoices}</div>
          <p className="text-sm text-gray-500 mt-1">Awaiting payment</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#9793E4] mx-auto mb-4"></div>
          <p className="text-gray-500 text-lg">Loading invoices...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FaFileInvoice className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Invoices Found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all'
              ? 'No invoices match your search criteria.'
              : 'Get started by creating your first invoice.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] transition-all font-medium shadow-md"
            >
              <FaPlus />
              Create First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-gray-500">{formatDate(invoice.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.customerName}</div>
                      <div className="text-xs text-gray-500">{invoice.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">${invoice.total.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{invoice.items.length} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <FaEdit size={14} />
                        </button>
                     
                        <button
                          onClick={() => handleDeleteInvoice(invoice._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Invoice"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Invoice</h3>
            
            {/* Customer Information */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Customer Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.customerName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={invoiceForm.customerEmail}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={invoiceForm.customerPhone}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceForm.taxRate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, taxRate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="13"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={invoiceForm.customerAddress}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Enter customer address"
                />
              </div>
            </div>

            {/* Add Items */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Add Items</h4>
              <div className="grid grid-cols-2 gap-4">
                {spareParts.map((part) => (
                  <div key={part._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{part.partName}</div>
                      <div className="text-sm text-gray-500">{part.partNumber}</div>
                      <div className="text-sm text-gray-600">${part.sellingPrice.toFixed(2)}</div>
                    </div>
                    <button
                      onClick={() => addItemToInvoice(part)}
                      className="px-3 py-1 bg-blue-600 !text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">Invoice Items</h4>
              {invoiceForm.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <FaShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No items added yet. Add parts from the list above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceForm.items.map((item) => (
                    <div key={item.partId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.partName}</div>
                        <div className="text-sm text-gray-500">{item.partNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(item.partId, parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-sm text-gray-600">× ${item.unitPrice.toFixed(2)}</span>
                        <span className="font-medium text-gray-900">${item.totalPrice.toFixed(2)}</span>
                        <button
                          onClick={() => removeItemFromInvoice(item.partId)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice Totals */}
            {invoiceForm.items.length > 0 && (
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Subtotal:</span>
                    <span>${invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tax ({invoiceForm.taxRate}%):</span>
                    <span>${(invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0) * (invoiceForm.taxRate / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${(invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0) * (1 + invoiceForm.taxRate / 100)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-blue-600 !text-white !ml-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Invoice: {selectedInvoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-[#9793E4] via-[#8783D4] to-[#7773C4] rounded-xl p-6 text-white">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm opacity-80">Invoice Number</label>
                    <p className="text-2xl font-bold">{selectedInvoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm opacity-80">Total Amount</label>
                    <p className="text-2xl font-bold">${selectedInvoice.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600">Customer</div>
                  <div className="text-lg font-bold text-gray-900">{selectedInvoice.customerName}</div>
                  <div className="text-sm text-gray-500">{selectedInvoice.customerEmail}</div>
                  <div className="text-sm text-gray-500">{selectedInvoice.customerPhone}</div>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600">Status</div>
                  <div className={`text-lg font-bold ${getStatusColor(selectedInvoice.status).split(' ')[0]}`}>
                    {selectedInvoice.status}
                  </div>
                  <div className="text-sm text-gray-500">Due: {formatDate(selectedInvoice.dueDate)}</div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileAlt className="text-[#9793E4]" size={20} />
                  Invoice Items
                </h4>
                <div className="space-y-3">
                  {selectedInvoice.items.map((item) => (
                    <div key={item.partId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{item.partName}</div>
                          <div className="text-sm text-gray-500">{item.partNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {item.quantity} × ${item.unitPrice.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: ${item.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Subtotal:</span>
                  <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Tax ({selectedInvoice.taxRate}%):</span>
                  <span>${selectedInvoice.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>${selectedInvoice.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedInvoice.notes && (
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedInvoice._id, 'sent')}
                    className="px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark as Sent
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedInvoice._id, 'paid')}
                    className="px-4 py-2 bg-green-600 !text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Mark as Paid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Edit Invoice: {selectedInvoice.invoiceNumber}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={invoiceForm.customerName}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={invoiceForm.customerEmail}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer email"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    value={invoiceForm.customerPhone}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Address
                </label>
                <textarea
                  value={invoiceForm.customerAddress}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter customer address"
                />
              </div>

              {/* Invoice Items */}
              <div className="border border-gray-200 rounded-xl p-5">
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaFileInvoice className="text-[#9793E4]" size={20} />
                  Invoice Items
                </h4>
                <div className="space-y-3">
                  {invoiceForm.items.map((item, index) => (
                    <div key={item.partId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Part Name</label>
                          <input
                            type="text"
                            value={item.partName}
                            onChange={(e) => {
                              const newItems = [...invoiceForm.items];
                              newItems[index] = { ...item, partName: e.target.value };
                              setInvoiceForm(prev => ({ ...prev, items: newItems }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...invoiceForm.items];
                              const quantity = parseInt(e.target.value) || 1;
                              newItems[index] = { ...item, quantity, totalPrice: quantity * item.unitPrice };
                              setInvoiceForm(prev => ({ ...prev, items: newItems }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newItems = [...invoiceForm.items];
                              const unitPrice = parseFloat(e.target.value) || 0;
                              newItems[index] = { ...item, unitPrice, totalPrice: item.quantity * unitPrice };
                              setInvoiceForm(prev => ({ ...prev, items: newItems }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Total</label>
                          <div className="px-2 py-1 text-sm bg-gray-100 rounded border">
                            ${item.totalPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax and Notes */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={invoiceForm.taxRate}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter tax rate"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={invoiceForm.status}
                    onChange={(e) => setInvoiceForm(prev => ({ ...prev, status: e.target.value as Invoice['status'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter any additional notes"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInvoice}
                  className="px-6 py-2.5 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] font-medium transition-colors"
                >
                  Update Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <FaExclamationCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Delete Invoice</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this invoice? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setInvoiceToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteInvoice}
                  className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Delete Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
};

export default InvoicesPage;
