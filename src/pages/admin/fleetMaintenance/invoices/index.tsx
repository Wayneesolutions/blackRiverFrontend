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
import { 
  getFleetInvoices, 
  createFleetInvoice, 
  updateFleetInvoice, 
  deleteFleetInvoice,
  updateFleetInvoiceStatus
} from '../../../../axios/api/fleet.invoices';
import { getAllSpareParts } from '../../../../axios/api/fleet.spareparts';

// Enhanced Types for comprehensive invoice management
interface InvoiceItem {
  partId: string | { _id: string };
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
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState<boolean>(false);

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error parsing userInfo from localStorage:', err);
    } finally {
      setUserInfoReady(true);
    }
  }, []);

  // Fetch invoices and spare parts when company context is available
  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const isSuperadmin = userInfo?.role === 'superadmin';
    const hasCompany = Boolean(userInfo?.company);

    if (!isSuperadmin && !hasCompany) {
      setInvoices([]);
      setSpareParts([]);
      setEmptyStateMessage('No company assigned to the current admin.');
      setLoading(false);
      return;
    }

    fetchInvoices();
    fetchSpareParts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoReady, userInfo]);

  // Refetch invoices when filters change
  useEffect(() => {
    if (!userInfoReady || emptyStateMessage) {
      return;
    }
    fetchInvoices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const res = await getFleetInvoices(params);
      if (res?.success) {
        const data = res.data || [];
        setInvoices(data);
        if (res.message && data.length === 0) {
          setEmptyStateMessage(res.message);
        } else {
          setEmptyStateMessage(null);
        }
      } else {
        addNotification('error', res?.message || 'Failed to fetch invoices');
        setInvoices([]);
        setEmptyStateMessage(res?.message || 'Failed to fetch invoices');
      }
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      addNotification('error', err?.message || 'Failed to fetch invoices');
      setInvoices([]);
      setEmptyStateMessage(err?.message || 'Failed to fetch invoices');
    }
    setLoading(false);
  };

  const fetchSpareParts = async () => {
    try {
      const res = await getAllSpareParts();
      if (res?.success) {
        const data = res.data || [];
        setSpareParts(data);
        if (res.message && data.length === 0) {
          setEmptyStateMessage((prev) => prev || res.message);
        }
      } else {
        addNotification('error', res?.message || 'Failed to fetch spare parts');
        setSpareParts([]);
        if (res?.message) {
          setEmptyStateMessage((prev) => prev || res.message);
        }
      }
    } catch (err: any) {
      console.error("Error fetching spare parts:", err);
      addNotification('error', err?.message || 'Failed to fetch spare parts');
      setSpareParts([]);
      setEmptyStateMessage((prev) => prev || 'Failed to fetch spare parts');
    }
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (emptyStateMessage) {
    return (
      <div className="p-6 min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center space-y-4">
        <FaFileInvoice className="text-5xl text-gray-300" />
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800">No invoice data available</h2>
          <p className="text-gray-500">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

  // Filter invoices client-side (API also filters, but keeping this for instant search feedback)
  const filteredInvoices = invoices.filter(invoice => {
    if (searchTerm) {
      const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           invoice.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }
    return true;
  });

  const handleCreateInvoice = async () => {
    if (!invoiceForm.customerName || invoiceForm.items.length === 0) {
      addNotification('error', 'Please fill customer name and add at least one item');
      return;
    }

    if (!invoiceForm.dueDate) {
      addNotification('error', 'Please select a due date');
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * (invoiceForm.taxRate / 100);
      const total = subtotal + taxAmount;

      const invoiceData = {
        customerName: invoiceForm.customerName,
        customerEmail: invoiceForm.customerEmail,
        customerPhone: invoiceForm.customerPhone,
        customerAddress: invoiceForm.customerAddress,
        items: invoiceForm.items.map(item => ({
          partId: typeof item.partId === 'string' ? item.partId : item.partId._id || item.partId,
          partNumber: item.partNumber,
          partName: item.partName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        subtotal,
        taxRate: invoiceForm.taxRate,
        taxAmount,
        total,
        status: invoiceForm.status,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes
      };

      const res = await createFleetInvoice(invoiceData);
      if (res?.success) {
        addNotification('success', res.message || 'Invoice created successfully');
        setShowCreateModal(false);
        resetForm();
        await fetchInvoices();
      } else {
        addNotification('error', res?.message || 'Failed to create invoice');
      }
    } catch (err: any) {
      console.error("Error creating invoice:", err);
      addNotification('error', err?.message || 'Error creating invoice');
    }
    setSubmitting(false);
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
    if (!part._id || !part.partNumber || !part.partName || !part.sellingPrice) {
      addNotification('error', 'Invalid part selected');
      return;
    }

    const existingItemIndex = invoiceForm.items.findIndex(item => 
      (typeof item.partId === 'string' ? item.partId : item.partId._id || item.partId) === part._id
    );

    if (existingItemIndex >= 0) {
      const newItems = [...invoiceForm.items];
      newItems[existingItemIndex].quantity += 1;
      newItems[existingItemIndex].totalPrice = newItems[existingItemIndex].quantity * newItems[existingItemIndex].unitPrice;
      setInvoiceForm({ ...invoiceForm, items: newItems });
    } else {
      const newItems = [...invoiceForm.items, {
        partId: part._id,
        partNumber: part.partNumber,
        partName: part.partName,
        quantity: 1,
        unitPrice: part.sellingPrice,
        totalPrice: part.sellingPrice
      }];
      setInvoiceForm({ ...invoiceForm, items: newItems });
    }
  };

  const removeItemFromInvoice = (partId: string) => {
    const newItems = invoiceForm.items.filter(item => 
      (typeof item.partId === 'string' ? item.partId : item.partId._id || item.partId) !== partId
    );
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const updateItemQuantity = (partId: string, quantity: number) => {
    if (quantity < 1) {
      addNotification('error', 'Quantity must be at least 1');
      return;
    }

    const newItems = invoiceForm.items.map(item => {
      const itemPartId = typeof item.partId === 'string' ? item.partId : item.partId._id || item.partId;
      if (itemPartId === partId) {
        return {
          ...item,
          quantity,
          totalPrice: quantity * item.unitPrice
        };
      }
      return item;
    });
    setInvoiceForm({ ...invoiceForm, items: newItems });
  };

  const handleStatusChange = async (invoiceId: string, newStatus: Invoice['status']) => {
    setSubmitting(true);
    try {
      const res = await updateFleetInvoiceStatus(invoiceId, newStatus);
      if (res?.success) {
        addNotification('success', res.message || `Invoice status updated to ${newStatus}`);
        await fetchInvoices();
      } else {
        addNotification('error', res?.message || 'Failed to update invoice status');
      }
    } catch (err: any) {
      console.error("Error updating invoice status:", err);
      addNotification('error', err?.message || 'Error updating invoice status');
    }
    setSubmitting(false);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceForm({
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail || '',
      customerPhone: invoice.customerPhone || '',
      customerAddress: invoice.customerAddress || '',
      items: invoice.items.map(item => ({
        partId: typeof item.partId === 'string' ? item.partId : (item.partId as any)?._id || item.partId,
        partNumber: item.partNumber,
        partName: item.partName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      taxRate: invoice.taxRate,
      status: invoice.status,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      notes: invoice.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateInvoice = async () => {
    if (!selectedInvoice) return;

    setSubmitting(true);
    try {
      const subtotal = invoiceForm.items.reduce((sum, item) => sum + item.totalPrice, 0);
      const taxAmount = subtotal * (invoiceForm.taxRate / 100);
      const total = subtotal + taxAmount;

      const updateData = {
        customerName: invoiceForm.customerName,
        customerEmail: invoiceForm.customerEmail,
        customerPhone: invoiceForm.customerPhone,
        customerAddress: invoiceForm.customerAddress,
        items: invoiceForm.items.map(item => ({
          partId: typeof item.partId === 'string' ? item.partId : item.partId._id || item.partId,
          partNumber: item.partNumber,
          partName: item.partName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        })),
        subtotal,
        taxRate: invoiceForm.taxRate,
        taxAmount,
        total,
        status: invoiceForm.status,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes
      };

      const res = await updateFleetInvoice(selectedInvoice._id, updateData);
      if (res?.success) {
        addNotification('success', res.message || 'Invoice updated successfully');
        setShowEditModal(false);
        setSelectedInvoice(null);
        resetForm();
        await fetchInvoices();
      } else {
        addNotification('error', res?.message || 'Failed to update invoice');
      }
    } catch (err: any) {
      console.error("Error updating invoice:", err);
      addNotification('error', err?.message || 'Error updating invoice');
    }
    setSubmitting(false);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteModal(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;

    setSubmitting(true);
    try {
      const res = await deleteFleetInvoice(invoiceToDelete);
      if (res?.success) {
        addNotification('success', res.message || 'Invoice deleted successfully');
        setShowDeleteModal(false);
        setInvoiceToDelete(null);
        await fetchInvoices();
      } else {
        addNotification('error', res?.message || 'Failed to delete invoice');
      }
    } catch (err: any) {
      console.error("Error deleting invoice:", err);
      addNotification('error', err?.message || 'Error deleting invoice');
    }
    setSubmitting(false);
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchInvoices();
                }
              }}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
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
              <h4 className="text-md font-semibold text-gray-800 mb-3">Add Items from Spare Parts</h4>
              {spareParts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <FaShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No spare parts available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {spareParts.map((part) => (
                    <div key={part._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{part.partName}</div>
                        <div className="text-sm text-gray-500">{part.partNumber}</div>
                        <div className="text-sm font-semibold text-[#9793E4]">${(part.sellingPrice || 0).toFixed(2)}</div>
                        <div className="text-xs text-gray-400">Stock: {part.stockQty || 0}</div>
                      </div>
                      <button
                        onClick={() => addItemToInvoice(part)}
                        className="px-3 py-1 bg-[#9793E4] !text-white rounded hover:bg-[#8783D4] transition-colors text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                  {invoiceForm.items.map((item, idx) => (
                    <div key={typeof item.partId === 'string' ? item.partId : (item.partId as any)?._id || idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.partName}</div>
                        <div className="text-sm text-gray-500">{item.partNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const partId = typeof item.partId === 'string' ? item.partId : (item.partId as any)?._id || '';
                            updateItemQuantity(partId, parseInt(e.target.value));
                          }}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                        />
                        <span className="text-sm text-gray-600">× ${item.unitPrice.toFixed(2)}</span>
                        <span className="font-medium text-gray-900">${item.totalPrice.toFixed(2)}</span>
                        <button
                          onClick={() => {
                            const partId = typeof item.partId === 'string' ? item.partId : (item.partId as any)?._id || '';
                            removeItemFromInvoice(partId);
                          }}
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
                disabled={submitting || loading}
                className="px-4 py-2 bg-[#9793E4] !text-white !ml-3 rounded-lg hover:bg-[#8783D4] disabled:bg-[#9793E4]/50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Invoice'}
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
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={typeof item.partId === 'string' ? item.partId : (item.partId as any)?._id || idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                  {selectedInvoice.status !== 'sent' && (
                    <button
                      onClick={() => handleStatusChange(selectedInvoice._id, 'sent')}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Mark as Sent
                    </button>
                  )}
                  {selectedInvoice.status !== 'paid' && (
                    <button
                      onClick={() => handleStatusChange(selectedInvoice._id, 'paid')}
                      disabled={submitting}
                      className="px-4 py-2 bg-green-600 !text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Mark as Paid
                    </button>
                  )}
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
                    <div key={typeof item.partId === 'string' ? item.partId : (item.partId as any)?._id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] disabled:bg-[#9793E4]/50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {submitting ? 'Updating...' : 'Update Invoice'}
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
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {submitting ? 'Deleting...' : 'Delete Invoice'}
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
