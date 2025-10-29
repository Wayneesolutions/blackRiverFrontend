import { useState, useEffect, useRef } from 'react';
import { 
  FaEllipsisH, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaTimes, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaSearch, 
  FaBox, 
  FaHistory, 
  FaExclamationTriangle,
  FaFileInvoice,
  FaBuilding,
  FaShoppingCart
} from 'react-icons/fa';
import { getAllSpareParts, createSparePart, useSparePart } from '../../../../axios/api/fleet.spareparts';
import { useNavigate } from 'react-router-dom';
// import { getAllWorkOrders } from '../../../../axios/api/fleet.workorder';

// Enhanced Types for comprehensive spare parts management
interface VehicleId {
    _id: string;
    licensePlate: string;
    make: string;
    model: string;
}

interface WorkOrderId {
    _id: string;
    issue: string;
    vehicleId?: VehicleId;
}

interface Supplier {
    _id: string;
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
}

interface UsageHistory {
    workOrderId: WorkOrderId | string;
    usedOn: string;
    qtyUsed: number;
    _id?: string;
}

interface SparePart {
    _id: string;
    partNumber: string;
    partName: string;
    description?: string;
    category: string;
    stockQty: number;
    minStockLevel: number;
    maxStockLevel: number;
    buyingPrice: number;
    sellingPrice: number;
    purchaseDate: string;
    supplier: Supplier | string;
    location: string;
    condition: 'new' | 'refurbished' | 'used';
    warrantyPeriod: number;
    warrantyExpiry?: string;
    createdAt: string;
    updatedAt: string;
    usageHistory: UsageHistory[];
}

interface WorkOrder {
    _id: string;
    issue: string;
    vehicleId?: VehicleId;
    status?: string;
}

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

const SparePartsInventory = () => {
    // const [activeTab, setActiveTab] = useState('inventory');
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showUsageModal, setShowUsageModal] = useState<boolean>(false);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [showInvoiceDetailsModal, setShowInvoiceDetailsModal] = useState<boolean>(false);
    const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [spareParts, setSpareParts] = useState<SparePart[]>([]);
    const [workOrders] = useState<WorkOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadingWorkOrders] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Form refs
    const newPartRef = useRef({
        partNumber: '',
        partName: '',
        description: '',
        category: '',
        stockQty: '',
        minStockLevel: '',
        maxStockLevel: '',
        buyingPrice: '',
        sellingPrice: '',
        purchaseDate: '',
        supplier: '',
        location: '',
        condition: 'new',
        warrantyPeriod: ''
    });

    const newSupplierRef = useRef({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: ''
    });

    const invoiceRef = useRef({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        items: [] as InvoiceItem[],
        taxRate: 13,
        notes: ''
    });

    const usageDataRef = useRef({ workOrderId: '', qtyUsed: '' });

    // Sample data for demonstration
    useEffect(() => {
        // Initialize with sample data
        setSpareParts([
            {
                _id: '1',
                partNumber: 'ENG-001',
                partName: 'Engine Oil Filter',
                description: 'High-quality engine oil filter for heavy-duty trucks',
                category: 'Engine Parts',
                stockQty: 25,
                minStockLevel: 5,
                maxStockLevel: 50,
                buyingPrice: 45.00,
                sellingPrice: 65.00,
                purchaseDate: '2024-01-15',
                supplier: {
                    _id: '1',
                    name: 'Auto Parts Central',
                    contact: 'John Smith',
                    email: 'john@autopartscentral.com',
                    phone: '+1-555-0123',
                    address: '123 Main St, Toronto, ON'
                },
                location: 'Warehouse A - Shelf 3',
                condition: 'new',
                warrantyPeriod: 12,
                warrantyExpiry: '2025-01-15',
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z',
                usageHistory: []
            },
            {
                _id: '2',
                partNumber: 'BRAKE-002',
                partName: 'Brake Pad Set',
                description: 'Ceramic brake pads for front wheels',
                category: 'Brake System',
                stockQty: 8,
                minStockLevel: 3,
                maxStockLevel: 20,
                buyingPrice: 120.00,
                sellingPrice: 180.00,
                purchaseDate: '2024-01-20',
                supplier: {
                    _id: '2',
                    name: 'Brake Masters Inc',
                    contact: 'Sarah Johnson',
                    email: 'sarah@brakemasters.com',
                    phone: '+1-555-0456',
                    address: '456 Industrial Ave, Montreal, QC'
                },
                location: 'Warehouse B - Shelf 1',
                condition: 'new',
                warrantyPeriod: 24,
                warrantyExpiry: '2026-01-20',
                createdAt: '2024-01-20T14:30:00Z',
                updatedAt: '2024-01-20T14:30:00Z',
                usageHistory: []
            }
        ]);

        setSuppliers([
            {
                _id: '1',
                name: 'Auto Parts Central',
                contact: 'John Smith',
                email: 'john@autopartscentral.com',
                phone: '+1-555-0123',
                address: '123 Main St, Toronto, ON'
            },
            {
                _id: '2',
                name: 'Brake Masters Inc',
                contact: 'Sarah Johnson',
                email: 'sarah@brakemasters.com',
                phone: '+1-555-0456',
                address: '456 Industrial Ave, Montreal, QC'
            }
        ]);

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
                    }
                ],
                subtotal: 650.00,
                taxRate: 13,
                taxAmount: 84.50,
                total: 734.50,
                status: 'sent',
                createdAt: '2024-01-25T09:00:00Z',
                dueDate: '2024-02-25',
                notes: 'Rush order - please expedite'
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

    const fetchSpareParts = async () => {
        setLoading(true);
        try {
            const res = await getAllSpareParts();
            if (res?.success) {
                setSpareParts(res.data || []);
            } else {
                addNotification('error', res?.message || 'Failed to fetch spare parts');
                setSpareParts([]);
            }
        } catch (err: any) {
            console.error("Error fetching spare parts:", err);
            addNotification('error', err?.message || 'Failed to fetch spare parts');
            setSpareParts([]);
        }
        setLoading(false);
    };

  // const fetchWorkOrders = async () => {
  //   setLoadingWorkOrders(true);
  //   try {
  //     const res = await getAllWorkOrders();
  //     if (res?.success) {
  //       setWorkOrders(res.data || []);
  //     } else {
  //       addNotification('error', res?.message || 'Failed to fetch work orders');
  //       setWorkOrders([]);
  //     }
  //   } catch (err: any) {
  //     console.error("Error fetching work orders:", err);
  //     addNotification('error', err?.message || 'Failed to fetch work orders');
  //     setWorkOrders([]);
  //   }
  //   setLoadingWorkOrders(false);
  // };

    const filteredParts = spareParts.filter(part =>
        part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddPart = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = newPartRef.current;

        if (!formData.partNumber || !formData.partName || !formData.stockQty) {
            addNotification('error', 'Please fill all required fields');
            return;
        }

        setSubmitting(true);

        const data = {
            partNumber: formData.partNumber,
            partName: formData.partName,
            description: formData.description,
            category: formData.category,
            stockQty: parseInt(formData.stockQty),
            minStockLevel: parseInt(formData.minStockLevel) || 0,
            maxStockLevel: parseInt(formData.maxStockLevel) || 100,
            buyingPrice: parseFloat(formData.buyingPrice) || 0,
            sellingPrice: parseFloat(formData.sellingPrice) || 0,
            purchaseDate: formData.purchaseDate,
            supplier: formData.supplier,
            location: formData.location,
            condition: formData.condition,
            warrantyPeriod: parseInt(formData.warrantyPeriod) || 0
        };

        try {
            const res = await createSparePart(data);
            if (res?.success) {
                addNotification('success', res.message || 'Spare part added successfully');
                setShowAddModal(false);
                newPartRef.current = {
                    partNumber: '',
                    partName: '',
                    description: '',
                    category: '',
                    stockQty: '',
                    minStockLevel: '',
                    maxStockLevel: '',
                    buyingPrice: '',
                    sellingPrice: '',
                    purchaseDate: '',
                    supplier: '',
                    location: '',
                    condition: 'new',
                    warrantyPeriod: ''
                };
                fetchSpareParts();
            } else {
                addNotification('error', res?.message || 'Failed to add spare part');
            }
        } catch (err: any) {
            addNotification('error', err?.message || 'Error adding spare part');
        }

        setSubmitting(false);
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = newSupplierRef.current;

        if (!formData.name || !formData.contact || !formData.email) {
            addNotification('error', 'Please fill all required fields');
            return;
        }

        const newSupplier: Supplier = {
            _id: Date.now().toString(),
            ...formData
        };

        setSuppliers(prev => [...prev, newSupplier]);
        addNotification('success', 'Supplier added successfully');
        setShowSupplierModal(false);
        newSupplierRef.current = {
            name: '',
            contact: '',
            email: '',
            phone: '',
            address: ''
        };
    };

    const handleCreateInvoice = () => {
        const newInvoice: Invoice = {
            _id: Date.now().toString(),
            invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
            customerName: invoiceRef.current.customerName,
            customerEmail: invoiceRef.current.customerEmail,
            customerPhone: invoiceRef.current.customerPhone,
            customerAddress: invoiceRef.current.customerAddress,
            items: invoiceRef.current.items,
            subtotal: invoiceRef.current.items.reduce((sum, item) => sum + item.totalPrice, 0),
            taxRate: invoiceRef.current.taxRate,
            taxAmount: invoiceRef.current.items.reduce((sum, item) => sum + item.totalPrice, 0) * (invoiceRef.current.taxRate / 100),
            total: invoiceRef.current.items.reduce((sum, item) => sum + item.totalPrice, 0) * (1 + invoiceRef.current.taxRate / 100),
            status: 'draft',
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            notes: invoiceRef.current.notes
        };

        setInvoices(prev => [...prev, newInvoice]);
        addNotification('success', 'Invoice created successfully');
        setShowInvoiceModal(false);
    };

    const handleUsePart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPart) return;

        const formData = usageDataRef.current;

        if (!formData.workOrderId || !formData.qtyUsed) {
            addNotification('error', 'Please fill all required fields');
            return;
        }

        const qtyUsed = parseInt(formData.qtyUsed);
        if (qtyUsed <= 0) {
            addNotification('error', 'Quantity must be greater than 0');
            return;
        }

        if (selectedPart.stockQty < qtyUsed) {
            addNotification('error', `Not enough stock! Available: ${selectedPart.stockQty} units`);
            return;
        }

        setSubmitting(true);

        const data = {
            workOrderId: formData.workOrderId,
            qtyUsed: qtyUsed
        };

        try {
            const res = await useSparePart(selectedPart._id, data);
            if (res?.success) {
                addNotification('success', res.message || 'Part used successfully');
                setShowUsageModal(false);
                setSelectedPart(null);
                usageDataRef.current = { workOrderId: '', qtyUsed: '' };
                fetchSpareParts();
            } else {
                addNotification('error', res?.message || 'Failed to use part');
            }
        } catch (err: any) {
            addNotification('error', err?.message || 'Error using part');
        }

        setSubmitting(false);
    };

    const handleDeletePart = (partId: string): void => {
        if (window.confirm('Are you sure you want to delete this part?')) {
            setSpareParts(prev => prev.filter(part => part._id !== partId));
            addNotification('success', 'Part deleted successfully');
        }
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Invalid Date";
        }
    };

    const getStockStatus = (stockQty: number, minStockLevel: number) => {
        if (stockQty <= minStockLevel) return { status: 'Low Stock', color: 'text-red-600 bg-red-50' };
        if (stockQty <= minStockLevel * 2) return { status: 'Medium Stock', color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Good Stock', color: 'text-green-600 bg-green-50' };
    };

    const getWorkOrderDetails = (usage: UsageHistory) => {
        if (typeof usage.workOrderId === 'object' && usage.workOrderId !== null) {
            return {
                issue: usage.workOrderId.issue || 'N/A',
                vehicle: usage.workOrderId.vehicleId
                    ? `${usage.workOrderId.vehicleId.licensePlate} - ${usage.workOrderId.vehicleId.make} ${usage.workOrderId.vehicleId.model}`
                    : 'N/A'
            };
        }
        return { issue: 'N/A', vehicle: 'N/A' };
    };

    // addItemToInvoice removed; invoices handled in dedicated page

    const removeItemFromInvoice = (partId: string) => {
        invoiceRef.current.items = invoiceRef.current.items.filter(item => item.partId !== partId);
    };

    const updateInvoiceItemQuantity = (partId: string, quantity: number) => {
        const item = invoiceRef.current.items.find(item => item.partId === partId);
        if (item) {
            item.quantity = quantity;
            item.totalPrice = item.quantity * item.unitPrice;
        }
    };

    const ActionDropdown = ({ part }: { part: SparePart }) => {
        const [showDropdown, setShowDropdown] = useState(false);

        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="More actions"
                >
                    <FaEllipsisH size={16} />
                </button>

                {showDropdown && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDropdown(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <button
                                onClick={() => {
                                    setSelectedPart(part);
                                    usageDataRef.current = { workOrderId: '', qtyUsed: '' };
                                    setShowUsageModal(true);
                                    setShowDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm !text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <FaEdit size={14} className="text-orange-600" />
                                Use Part
                            </button>
                            <button
                                onClick={() => {
                                    navigate('/admin/fleetmaintenance/invoices');
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <FaFileInvoice size={14} className="text-blue-600" />
                                Go to Invoices
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedPart(part);
                                    setShowDetailsModal(true);
                                    setShowDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <FaEye size={14} className="text-green-600" />
                                View Details
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                                onClick={() => {
                                    handleDeletePart(part._id);
                                    setShowDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <FaTrash size={14} />
                                Delete Part
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderInventoryTab = () => (
        <div className="space-y-6">
            {/* Search and Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search parts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">{spareParts.length}</div>
                        <div className="text-gray-600 text-sm">Total Parts</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-red-600">
                            {spareParts.filter(part => part.stockQty <= part.minStockLevel).length}
                        </div>
                        <div className="text-gray-600 text-sm">Low Stock</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-[#9793E4]">
                            {spareParts.reduce((total, part) => total + part.stockQty, 0)}
                        </div>
                        <div className="text-gray-600 text-sm">Total Stock</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">
                            ${spareParts.reduce((total, part) => total + (part.stockQty * part.buyingPrice), 0).toFixed(2)}
                        </div>
                        <div className="text-gray-600 text-sm">Inventory Value</div>
                    </div>
                </div>
            </div>

            {/* Parts Table */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#9793E4] mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Loading spare parts...</p>
                </div>
            ) : filteredParts.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <FaBox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Spare Parts Found</h3>
                    <p className="text-gray-500 mb-4">
                        {searchTerm
                            ? 'No parts match your search.'
                            : 'Get started by adding your first spare part.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] transition-all font-medium shadow-md"
                        >
                            <FaPlus />
                            Add First Spare Part
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
                                        Part Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Stock Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Pricing
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Supplier
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredParts.map((part) => {
                                    const stockStatus = getStockStatus(part.stockQty, part.minStockLevel);
                                    const supplier = typeof part.supplier === 'object' ? part.supplier : suppliers.find(s => s._id === part.supplier);
                                    return (
                                        <tr key={part._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-semibold text-gray-900">{part.partName}</div>
                                                <div className="text-sm text-gray-500">{part.partNumber}</div>
                                                <div className="text-xs text-gray-400">{part.category}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{part.stockQty} units</div>
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                                                    {stockStatus.status}
                                                </span>
                                                {part.stockQty <= part.minStockLevel && (
                                                    <FaExclamationTriangle className="inline ml-2 text-red-500" size={12} />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    <div>Buy: ${part.buyingPrice.toFixed(2)}</div>
                                                    <div>Sell: ${part.sellingPrice.toFixed(2)}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{supplier?.name || 'N/A'}</div>
                                                <div className="text-xs text-gray-500">{formatDate(part.purchaseDate)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <ActionDropdown part={part} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );

    // invoices tab removed; single invoices page is the source of truth

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
                            <FaBox className="text-[#9793E4]" />
                            Fleet Parts Management
                        </h1>
                        <p className="text-gray-600 mt-2">Comprehensive spare parts inventory and invoice management</p>
                                            </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSupplierModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 !text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <FaBuilding />
                            Add Supplier
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] shadow-lg hover:shadow-xl transition-all font-medium"
                        >
                            <FaPlus /> Add New Part
                        </button>
                                            </div>
                </div>
            </div>

            {/* Inventory */}
            {renderInventoryTab()}

            {/* Add Part Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Spare Part</h3>
                        <form onSubmit={handleAddPart} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Part Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={newPartRef.current.partNumber}
                                        onChange={(e) => newPartRef.current.partNumber = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., ENG-001"
                                        required
                                    />
                                </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Part Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={newPartRef.current.partName}
                                    onChange={(e) => newPartRef.current.partName = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter part name"
                                    required
                                />
                            </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        defaultValue={newPartRef.current.category}
                                        onChange={(e) => newPartRef.current.category = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Engine Parts">Engine Parts</option>
                                        <option value="Brake System">Brake System</option>
                                        <option value="Transmission">Transmission</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Suspension">Suspension</option>
                                        <option value="Body Parts">Body Parts</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Condition
                                    </label>
                                    <select
                                        defaultValue={newPartRef.current.condition}
                                        onChange={(e) => newPartRef.current.condition = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="new">New</option>
                                        <option value="refurbished">Refurbished</option>
                                        <option value="used">Used</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    defaultValue={newPartRef.current.description}
                                    onChange={(e) => newPartRef.current.description = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    placeholder="Part description..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock Quantity <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    defaultValue={newPartRef.current.stockQty}
                                    onChange={(e) => newPartRef.current.stockQty = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0"
                                    min="0"
                                    required
                                />
                            </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Min Stock Level
                                    </label>
                                    <input
                                        type="number"
                                        defaultValue={newPartRef.current.minStockLevel}
                                        onChange={(e) => newPartRef.current.minStockLevel = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Max Stock Level
                                    </label>
                                    <input
                                        type="number"
                                        defaultValue={newPartRef.current.maxStockLevel}
                                        onChange={(e) => newPartRef.current.maxStockLevel = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="100"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Buying Price
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        defaultValue={newPartRef.current.buyingPrice}
                                        onChange={(e) => newPartRef.current.buyingPrice = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Selling Price
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        defaultValue={newPartRef.current.sellingPrice}
                                        onChange={(e) => newPartRef.current.sellingPrice = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Purchase Date
                                    </label>
                                    <input
                                        type="date"
                                        defaultValue={newPartRef.current.purchaseDate}
                                        onChange={(e) => newPartRef.current.purchaseDate = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Supplier
                                    </label>
                                    <select
                                        defaultValue={newPartRef.current.supplier}
                                        onChange={(e) => newPartRef.current.supplier = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier._id} value={supplier._id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={newPartRef.current.location}
                                        onChange={(e) => newPartRef.current.location = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., Warehouse A - Shelf 3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Warranty Period (months)
                                    </label>
                                    <input
                                        type="number"
                                        defaultValue={newPartRef.current.warrantyPeriod}
                                        onChange={(e) => newPartRef.current.warrantyPeriod = e.target.value}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="12"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#9793E4] !text-white !ml-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Adding...' : 'Add Part'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Supplier Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Supplier</h3>
                        <form onSubmit={handleAddSupplier} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={newSupplierRef.current.name}
                                    onChange={(e) => newSupplierRef.current.name = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter supplier name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Person <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    defaultValue={newSupplierRef.current.contact}
                                    onChange={(e) => newSupplierRef.current.contact = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter contact person"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    defaultValue={newSupplierRef.current.email}
                                    onChange={(e) => newSupplierRef.current.email = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter email"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    defaultValue={newSupplierRef.current.phone}
                                    onChange={(e) => newSupplierRef.current.phone = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    defaultValue={newSupplierRef.current.address}
                                    onChange={(e) => newSupplierRef.current.address = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    placeholder="Enter address"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowSupplierModal(false)}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 !text-white !ml-3 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Create Invoice</h3>
                        
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
                                        defaultValue={invoiceRef.current.customerName}
                                        onChange={(e) => invoiceRef.current.customerName = e.target.value}
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
                                        defaultValue={invoiceRef.current.customerEmail}
                                        onChange={(e) => invoiceRef.current.customerEmail = e.target.value}
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
                                        defaultValue={invoiceRef.current.customerPhone}
                                        onChange={(e) => invoiceRef.current.customerPhone = e.target.value}
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
                                        defaultValue={invoiceRef.current.taxRate}
                                        onChange={(e) => invoiceRef.current.taxRate = parseFloat(e.target.value)}
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
                                    defaultValue={invoiceRef.current.customerAddress}
                                    onChange={(e) => invoiceRef.current.customerAddress = e.target.value}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows={2}
                                    placeholder="Enter customer address"
                                />
                            </div>
                        </div>

                        {/* Invoice Items */}
                        <div className="mb-6">
                            <h4 className="text-md font-semibold text-gray-800 mb-3">Invoice Items</h4>
                            {invoiceRef.current.items.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    <FaShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                    <p>No items added yet. Add parts from the inventory.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {invoiceRef.current.items.map((item) => (
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
                                                    onChange={(e) => updateInvoiceItemQuantity(item.partId, parseInt(e.target.value))}
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
                        {invoiceRef.current.items.length > 0 && (
                            <div className="mb-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Subtotal:</span>
                                        <span>${invoiceRef.current.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Tax ({invoiceRef.current.taxRate}%):</span>
                                        <span>${(invoiceRef.current.items.reduce((sum, item) => sum + item.totalPrice, 0) * (invoiceRef.current.taxRate / 100)).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                        <span>Total:</span>
                                        <span>${(invoiceRef.current.items.reduce((sum, item) => sum + item.totalPrice, 0) * (1 + invoiceRef.current.taxRate / 100)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowInvoiceModal(false)}
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

            {/* Use Part Modal */}
            {showUsageModal && selectedPart && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Use Part: {selectedPart.partName}
                        </h3>
                        <div className="mb-4 p-3 bg-[#9793E4]/10 rounded-lg border border-[#9793E4]/30">
                            <div className="text-sm text-gray-600">
                                Current Stock: <span className="font-semibold text-gray-900">{selectedPart.stockQty} units</span>
                            </div>
                        </div>
                        <form onSubmit={handleUsePart} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Work Order <span className="text-red-500">*</span>
                                </label>
                                {loadingWorkOrders ? (
                                    <div className="text-sm text-gray-500 py-2">Loading work orders...</div>
                                ) : (
                                    <select
                                        defaultValue={usageDataRef.current.workOrderId}
                                        onChange={(e) => usageDataRef.current.workOrderId = e.target.value}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                                        required
                                    >
                                        <option value="">Select Work Order</option>
                                        {workOrders.map(wo => (
                                            <option key={wo._id} value={wo._id}>
                                                {wo.issue} {wo.vehicleId ? `- ${wo.vehicleId.licensePlate}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Quantity Used <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    defaultValue={usageDataRef.current.qtyUsed}
                                    onChange={(e) => usageDataRef.current.qtyUsed = e.target.value}
                                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#9793E4] focus:border-transparent transition-all"
                                    placeholder="Enter quantity used"
                                    min="1"
                                    max={selectedPart.stockQty}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUsageModal(false);
                                        setSelectedPart(null);
                                    }}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#9793E4] !text-white !ml-3 rounded-lg hover:bg-[#8783D4] disabled:bg-[#9793E4]/50 disabled:cursor-not-allowed font-medium transition-colors shadow-md"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Processing...' : 'Use Part'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Part Details Modal */}
            {showDetailsModal && selectedPart && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">
                                    Part Details: {selectedPart.partName}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedPart(null);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <FaTimes className="text-gray-500" size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-gradient-to-r from-[#9793E4] via-[#8783D4] to-[#7773C4] rounded-xl p-6 text-white">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm opacity-80">Current Stock</label>
                                        <p className="text-2xl font-bold">{selectedPart.stockQty} units</p>
                                    </div>
                                    <div>
                                        <label className="text-sm opacity-80">Total Usage</label>
                                        <p className="text-2xl font-bold">
                                            {selectedPart.usageHistory?.reduce((total, usage) => total + usage.qtyUsed, 0) || 0} units
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="text-sm text-gray-600">Part Number</div>
                                    <div className="text-lg font-bold text-gray-900">{selectedPart.partNumber}</div>
                                    </div>
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="text-sm text-gray-600">Category</div>
                                    <div className="text-lg font-bold text-gray-900">{selectedPart.category}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="text-sm text-gray-600">Buying Price</div>
                                    <div className="text-lg font-bold text-gray-900">${selectedPart.buyingPrice.toFixed(2)}</div>
                                    </div>
                                <div className="border border-gray-200 rounded-xl p-4">
                                    <div className="text-sm text-gray-600">Selling Price</div>
                                    <div className="text-lg font-bold text-gray-900">${selectedPart.sellingPrice.toFixed(2)}</div>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-xl p-5">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FaHistory className="text-[#9793E4]" size={20} />
                                    Usage History
                                </h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {selectedPart.usageHistory && selectedPart.usageHistory.length > 0 ? (
                                        selectedPart.usageHistory
                                            .sort((a, b) => new Date(b.usedOn).getTime() - new Date(a.usedOn).getTime())
                                            .map((usage, index) => {
                                                const details = getWorkOrderDetails(usage);
                                                return (
                                                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <span className="text-sm font-semibold text-gray-700">Update #{index + 1}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {formatDate(usage.usedOn)}
                                                            </span>
                                                        </div>
                                                        <div className="font-medium text-gray-900">
                                                            {usage.qtyUsed} units used
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">
                                                            Work Order: {details.issue}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Vehicle: {details.vehicle}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                            <FaHistory className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                            <p>No usage history available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600 font-medium">Created:</span>
                                        <span className="ml-2 text-gray-900">{formatDate(selectedPart.createdAt)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 font-medium">Last Updated:</span>
                                        <span className="ml-2 text-gray-900">{formatDate(selectedPart.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedPart(null);
                                    }}
                                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Details Modal */}
            {showInvoiceDetailsModal && selectedInvoice && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-800">
                                    Invoice Details: {selectedInvoice.invoiceNumber}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowInvoiceDetailsModal(false);
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
                                    <div className={`text-lg font-bold ${
                                        selectedInvoice.status === 'paid' ? 'text-green-600' :
                                        selectedInvoice.status === 'sent' ? 'text-blue-600' :
                                        selectedInvoice.status === 'draft' ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                    </div>
                                    <div className="text-sm text-gray-500">Due: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</div>
                                </div>
                            </div>

                            {/* Invoice Items */}
                            <div className="border border-gray-200 rounded-xl p-5">
                                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <FaFileInvoice className="text-[#9793E4]" size={20} />
                                    Invoice Items
                                </h4>
                                <div className="space-y-3">
                                    {selectedInvoice.items.map((item, index) => (
                                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
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

                            {/* Invoice Dates */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600 font-medium">Created:</span>
                                    <span className="ml-2 text-gray-900">{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600 font-medium">Due Date:</span>
                                    <span className="ml-2 text-gray-900">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => {
                                        setShowInvoiceDetailsModal(false);
                                        setSelectedInvoice(null);
                                    }}
                                    className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Close
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

export default SparePartsInventory;