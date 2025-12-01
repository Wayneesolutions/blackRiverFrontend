import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Edit, Filter, Calendar, DollarSign, Users, TrendingUp,
     Trash2, X, CheckCircle, AlertCircle, Building2, Download } from 'lucide-react';
import { createInvoice, listInvoices,  updateInvoice, deleteInvoice, listTrips } from "../../../../axios/api/account.invoices";
import jsPDF from 'jspdf';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

interface Invoice {
    _id: string;
    clientName: string;
    clientEmail: string;
    loadId?: string; // Legacy field
    tripId?: string; // New field
    amount: number;
    currency: string;
    status: 'paid' | 'pending';
    invoiceDate: string;
    dueDate: string;
    paymentDate: string | null;
    invoiceUrl: string;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

interface Trip {
    _id: string;
    tripNumber: string;
    status: string;
    driver?: {
        _id: string;
        name: string;
        email?: string;
    };
    truck?: {
        _id: string;
        plateNumber?: string;
        internalId?: string;
    };
    orders?: Array<{
        _id: string;
        orderNumber: string;
        customerOrderNo?: string;
        customer?: {
            _id: string;
            name: string;
            email: string;
            phone?: string;
            address?: string;
            company?: string;
        };
        pickupLocation?: {
            place?: string;
        };
        deliveryLocation?: {
            place?: string;
        };
    }>;
    startLocation?: {
        place?: string;
    };
    endLocation?: {
        place?: string;
    };
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
}

type TabType = 'list' | 'view' | 'edit' | 'create';
type StatusFilter = 'all' | 'paid' | 'pending';

interface Notification {
    id: number;
    type: 'success' | 'error';
    message: string;
}

const InvoiceManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; invoiceId: string | null }>({ show: false, invoiceId: null });
    const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);

    const pageBackgroundStyle = {
        background: `linear-gradient(180deg, ${FLEET_COLORS.focusRing} 0%, rgba(255,255,255,0.98) 40%, #f8fafc 100%)`,
    };

   

    const primaryButtonStyle: React.CSSProperties = {
        background: FLEET_COLORS.gradient,
        color: '#fff',
        border: 'none',
        boxShadow: `0 12px 25px ${FLEET_COLORS.focusRing}`,
    };

    useEffect(() => {
        // Check authentication state
        const userInfo = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        console.log('🔐 User Info from localStorage:', userInfo);
        console.log('🔑 Token from localStorage:', token);
        
        if (!token || !userInfo) {
            console.log('❌ User not authenticated - redirecting to login');
            showNotification('error', 'Please log in to access this page');
            // You might want to redirect to login page here
            return;
        }
        
        fetchInvoices();
        fetchTrips();
    }, []);

    const showNotification = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const getLocalUserInfo = () => {
        const userInfoString = localStorage.getItem('userInfo');
        if (!userInfoString) {
            return null;
        }
        try {
            return JSON.parse(userInfoString);
        } catch (error) {
            console.error('Error parsing userInfo from localStorage:', error);
            return null;
        }
    };

    const handleDownloadPDF = (invoice: Invoice) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);
            
            // Color scheme - using RGB values directly
            const primaryR = 67, primaryG = 56, primaryB = 202; // Indigo
            const secondaryR = 99, secondaryG = 102, secondaryB = 241; // Lighter indigo
            const textR = 31, textG = 41, textB = 55; // Gray-800
            const lightGrayR = 243, lightGrayG = 244, lightGrayB = 246; // Gray-100
            
            // Header with colored background
            doc.setFillColor(primaryR, primaryG, primaryB);
            doc.rect(0, 0, pageWidth, 50, 'F');
            
            // Company/Invoice Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text('INVOICE', pageWidth / 2, 25, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Professional Invoice Document', pageWidth / 2, 35, { align: 'center' });
            
            // Reset text color
            doc.setTextColor(textR, textG, textB);
            
            // Invoice Details Box (Top Right)
            const boxX = pageWidth - margin - 80;
            let yPos = 60;
            
            doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
            doc.roundedRect(boxX, yPos, 80, 50, 3, 3, 'F');
            
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128); // Gray-500
            doc.text('Invoice Number', boxX + 5, yPos + 8);
            doc.text('Invoice Date', boxX + 5, yPos + 18);
            doc.text('Due Date', boxX + 5, yPos + 28);
            doc.text('Status', boxX + 5, yPos + 38);
            
            doc.setFontSize(10);
            doc.setTextColor(textR, textG, textB);
            doc.setFont('helvetica', 'bold');
            doc.text(`#${invoice._id.slice(-8).toUpperCase()}`, boxX + 5, yPos + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(invoice.invoiceDate), boxX + 5, yPos + 25);
            doc.text(formatDate(invoice.dueDate), boxX + 5, yPos + 35);
            
            // Status badge
            const statusR = invoice.status === 'paid' ? 34 : 251;
            const statusG = invoice.status === 'paid' ? 197 : 191;
            const statusB = invoice.status === 'paid' ? 94 : 36;
            doc.setFillColor(statusR, statusG, statusB);
            doc.roundedRect(boxX + 5, yPos + 40, 30, 6, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(invoice.status.toUpperCase(), boxX + 20, yPos + 44, { align: 'center' });
            doc.setTextColor(textR, textG, textB);
            
            // Bill To Section
            yPos = 60;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Bill To:', margin, yPos);
            yPos += 8;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(invoice.clientName, margin, yPos);
            yPos += 7;
            
            if (invoice.clientEmail) {
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128);
                doc.text(invoice.clientEmail, margin, yPos);
                doc.setTextColor(textR, textG, textB);
                yPos += 10;
            } else {
                yPos += 5;
            }
            
            // Line separator
            yPos += 5;
            doc.setDrawColor(229, 231, 235); // Gray-200
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 15;
            
            // Items/Summary Section
            doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
            doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Description', margin + 5, yPos + 6);
            doc.text('Amount', pageWidth - margin - 5, yPos + 6, { align: 'right' });
            
            yPos += 15;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('Service/Product', margin + 5, yPos);
            doc.text(`${invoice.currency} ${parseFloat(invoice.amount.toString()).toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
            
            // Total Section
            yPos += 20;
            doc.setDrawColor(209, 213, 219); // Gray-300
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
            
            doc.setFillColor(secondaryR, secondaryG, secondaryB);
            doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Total Amount Due', margin + 10, yPos + 8);
            doc.setFontSize(18);
            doc.text(`${invoice.currency} ${parseFloat(invoice.amount.toString()).toFixed(2)}`, pageWidth - margin - 10, yPos + 15, { align: 'right' });
            doc.setTextColor(textR, textG, textB);
            
            // Notes Section
            if (invoice.notes) {
                yPos += 30;
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('Additional Notes:', margin, yPos);
                yPos += 8;
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(75, 85, 99); // Gray-600
                const splitNotes = doc.splitTextToSize(invoice.notes, contentWidth - 10);
                doc.text(splitNotes, margin + 5, yPos);
                doc.setTextColor(textR, textG, textB);
            }
            
            // Footer
            const footerY = pageHeight - 30;
            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(margin, footerY, pageWidth - margin, footerY);
            
            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128);
            doc.text('Thank you for your business!', pageWidth / 2, footerY + 10, { align: 'center' });
            doc.text('If you have any questions about this invoice, please contact us.', pageWidth / 2, footerY + 16, { align: 'center' });
            
            // Page number
            doc.text(`Page 1 of 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            
            // Save PDF
            const fileName = `Invoice_${invoice._id.slice(-8)}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            showNotification('success', 'Invoice PDF downloaded successfully');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showNotification('error', 'Failed to generate PDF');
        }
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const userInfo: any = getLocalUserInfo();
            
            // Handle different userInfo structures (userData.company or direct company)
            const userRole = userInfo?.role || userInfo?.userData?.role;
            const userCompany = userInfo?.company || userInfo?.userData?.company;
            const isSuperadmin = userRole === 'superadmin';
            const isHR = userRole === 'hr';
            const hasCompany = Boolean(userCompany);

            // Allow HR and dispatchers to call API even if company is not visible in localStorage
            // The backend will handle company filtering based on the authenticated user
            if (!isSuperadmin && !isHR && !hasCompany) {
                setEmptyStateMessage(null);
                setInvoices([]);
                return;
            }

            const response = await listInvoices();
            const message = (response as any)?.message;

            if (response && response.success && Array.isArray(response.data)) {
                setInvoices(response.data);
                if (message && response.data.length === 0) {
                    setEmptyStateMessage(message);
                } else {
                    setEmptyStateMessage(null);
                }
            } else {
                setInvoices([]);
                setEmptyStateMessage(message || 'Failed to fetch invoices.');
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setInvoices([]);
            setEmptyStateMessage('Failed to fetch invoices.');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrips = async () => {
        try {
            const userInfo: any = getLocalUserInfo();
            
            // Handle different userInfo structures (userData.company or direct company)
            const userRole = userInfo?.role || userInfo?.userData?.role;
            const userCompany = userInfo?.company || userInfo?.userData?.company;
            const isSuperadmin = userRole === 'superadmin';
            const isHR = userRole === 'hr';
            const hasCompany = Boolean(userCompany);

            // Allow HR and dispatchers to call API even if company is not visible in localStorage
            // The backend will handle company filtering based on the authenticated user
            if (!isSuperadmin && !isHR && !hasCompany) {
                setTrips([]);
                return;
            }

            console.log('🔍 Starting to fetch trips...');
            const response = await listTrips();
            console.log('📡 Trip API Response:', response);
            console.log('📡 Response type:', typeof response);
            console.log('📡 Response keys:', response ? Object.keys(response) : 'null');
            
            // Handle different response structures
            let tripData = null;
            if (response && response.data) {
                tripData = response.data;
                console.log('✅ Found data in response.data:', tripData);
            } else if (response && Array.isArray(response)) {
                tripData = response;
                console.log('✅ Response is array:', tripData);
            } else if (response && response.success && response.data) {
                tripData = response.data;
                console.log('✅ Found data in response.success.data:', tripData);
            } else {
                console.log('❌ No data found in response structure');
            }
            
            if (tripData && Array.isArray(tripData)) {
                console.log('✅ Setting trips with data:', tripData);
                console.log('✅ Number of trips:', tripData.length);
                setTrips(tripData);
            } else {
                console.log('❌ No valid trip data found in response:', response);
                setTrips([]);
            }
        } catch (error) {
            console.error('❌ Error fetching trips:', error);
            console.error('❌ Error details:', error);
            setTrips([]);
        }
    };

    const filteredInvoices = statusFilter === 'all'
        ? invoices
        : invoices.filter(invoice => invoice.status === statusFilter);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusColor = (status: string): string => {
        return status === 'paid' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
    };

    const calculateStats = () => {
        const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
        const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const pendingAmount = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + Number(inv.amount), 0);
        const paidCount = invoices.filter(inv => inv.status === 'paid').length;
        const pendingCount = invoices.filter(inv => inv.status === 'pending').length;

        return { totalAmount, paidAmount, pendingAmount, paidCount, pendingCount };
    };

    const stats = calculateStats();

    const NotificationContainer: React.FC = () => (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
                        notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                >
                    {notification.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                        {notification.message}
                    </p>
                    <button
                        onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                        className="ml-2"
                    >
                        <X className={`h-4 w-4 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                    </button>
                </div>
            ))}
        </div>
    );

    const DeleteConfirmationModal: React.FC = () => {
        if (!deleteModal.show) return null;

        const handleConfirmDelete = async () => {
            if (!deleteModal.invoiceId) return;

            try {
                await deleteInvoice(deleteModal.invoiceId);
                showNotification('success', 'Invoice deleted successfully');
                fetchInvoices();
            } catch (error) {
                showNotification('error', 'Failed to delete invoice');
            } finally {
                setDeleteModal({ show: false, invoiceId: null });
            }
        };

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-100 p-3 rounded-full">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Delete Invoice</h3>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this invoice? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteModal({ show: false, invoiceId: null })}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const DashboardOverview: React.FC = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6" >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(stats.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-400">{invoices.length} invoices</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(stats.paidAmount)}
                        </p>
                        <p className="text-xs text-gray-400">{stats.paidCount} invoices</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6" >
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">
                            {formatCurrency(stats.pendingAmount)}
                        </p>
                        <p className="text-xs text-gray-400">{stats.pendingCount} invoices</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-yellow-600" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Collection Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-xs text-gray-400">Payment efficiency</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-purple-600" />
                    </div>
                </div>
            </div>
        </div>
    );

    const InvoiceList: React.FC = () => (
        <div className="bg-white rounded-lg" >
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 sm:mb-0">Invoice List</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="paid">Paid</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading invoices...</div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No invoices found</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Invoice ID</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Client</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Amount</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Due Date</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInvoices.map((invoice) => (
                                <tr key={invoice._id} className="hover:bg-gray-50">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center">
                                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                                            <span className="font-mono text-sm">{invoice._id.slice(-8)}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div>
                                            <div className="font-medium text-gray-900">{invoice.clientName}</div>
                                            <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="font-medium text-gray-900">{formatCurrency(Number(invoice.amount))}</span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-900">
                                        {formatDate(invoice.dueDate)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(invoice);
                                                    setActiveTab('view');
                                                }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                                title="View Invoice"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownloadPDF(invoice)}
                                                className="text-purple-600 hover:text-purple-800 transition-colors"
                                                title="Download PDF"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedInvoice(invoice);
                                                    setActiveTab('edit');
                                                }}
                                                className="text-gray-600 hover:text-gray-800 transition-colors"
                                                title="Edit Invoice"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ show: true, invoiceId: invoice._id })}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Delete Invoice"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const InvoiceView: React.FC = () => {
        if (!selectedInvoice) return null;

        return (
            <div className="bg-white rounded-lg" >
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
                        <button
                            onClick={() => setActiveTab('list')}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            ← Back to List
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Invoice ID</label>
                                    <p className="font-mono text-sm">{selectedInvoice._id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Client</label>
                                    <p className="font-medium">{selectedInvoice.clientName}</p>
                                    <p className="text-sm text-gray-600">{selectedInvoice.clientEmail}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="text-lg font-bold">{formatCurrency(Number(selectedInvoice.amount))}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Invoice Date</label>
                                    <p className="text-sm">{formatDate(selectedInvoice.invoiceDate)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                                    <p className="text-sm">{formatDate(selectedInvoice.dueDate)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Payment Date</label>
                                    <p className="text-sm">
                                        {selectedInvoice.paymentDate ? formatDate(selectedInvoice.paymentDate) : 'Not paid'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Load ID</label>
                                    <p className="font-mono text-sm">{selectedInvoice.loadId || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedInvoice.notes && (
                        <div className="mt-6">
                            <label className="text-sm font-medium text-gray-500">Notes</label>
                            <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedInvoice.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const InvoiceEdit: React.FC = () => {
        if (!selectedInvoice) return null;

        const [editForm, setEditForm] = useState<Invoice>({ ...selectedInvoice });

        const handleInputChange = (field: keyof Invoice, value: any) => {
            setEditForm(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleSave = async () => {
            setLoading(true);
            try {
                const updateData = {
                    clientName: editForm.clientName,
                    clientEmail: editForm.clientEmail,
                    loadId: editForm.loadId,
                    amount: editForm.amount.toString(),
                    currency: editForm.currency,
                    status: editForm.status,
                    dueDate: editForm.dueDate,
                    paymentDate: editForm.paymentDate,
                    notes: editForm.notes
                };

                const response = await updateInvoice(editForm._id, updateData);
                if (response && response.success) {
                    showNotification('success', 'Invoice updated successfully');
                    await fetchInvoices();
                    setSelectedInvoice(editForm);
                    setActiveTab('view');
                } else {
                    showNotification('error', 'Failed to update invoice');
                }
            } catch (error) {
                showNotification('error', 'Failed to update invoice');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="bg-white rounded-lg" >
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Edit Invoice</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveTab('view')}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 rounded-md transition-colors disabled:bg-gray-400"
                                style={primaryButtonStyle}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                                <input
                                    type="text"
                                    value={editForm.clientName}
                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
                                <input
                                    type="email"
                                    value={editForm.clientEmail}
                                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editForm.amount}
                                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={editForm.dueDate.split('T')[0]}
                                    onChange={(e) => handleInputChange('dueDate', e.target.value + 'T00:00:00Z')}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {editForm.status === 'paid' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                                    <input
                                        type="date"
                                        value={editForm.paymentDate ? editForm.paymentDate.split('T')[0] : ''}
                                        onChange={(e) => handleInputChange('paymentDate', e.target.value ? e.target.value + 'T00:00:00Z' : null)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Load ID</label>
                                <input
                                    type="text"
                                    value={editForm.loadId}
                                    onChange={(e) => handleInputChange('loadId', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                            value={editForm.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={4}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
        );
    };

    const CreateInvoice: React.FC = () => {
        const [newInvoice, setNewInvoice] = useState({
            clientName: '',
            clientEmail: '',
            tripId: '',
            amount: '',
            currency: 'USD',
            dueDate: '',
            notes: ''
        });

        const handleInputChange = (field: string, value: string) => {
            setNewInvoice(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleTripSelect = (tripId: string) => {
            console.log('Selected trip ID:', tripId);
            const selectedTrip = trips.find(trip => trip._id === tripId);
            console.log('Selected trip data:', selectedTrip);
            
            if (selectedTrip && selectedTrip.orders && selectedTrip.orders.length > 0) {
                // Get customer from first order (trips can have multiple orders with same customer)
                const firstOrder = selectedTrip.orders[0];
                const customer = firstOrder.customer;
                
                const customerName = customer?.name || '';
                const customerEmail = customer?.email || '';
                
                console.log('Auto-filling customer details from trip:', {
                    customerName,
                    customerEmail,
                    tripNumber: selectedTrip.tripNumber
                });
                
                setNewInvoice(prev => ({
                    ...prev,
                    tripId: tripId,
                    clientName: customerName,
                    clientEmail: customerEmail,
                }));
            } else {
                console.log('No trip found with ID or trip has no orders:', tripId);
                setNewInvoice(prev => ({
                    ...prev,
                    tripId: tripId
                }));
            }
        };

        const handleCreate = async () => {
            if (!newInvoice.clientName || !newInvoice.amount || !newInvoice.dueDate) {
                showNotification('error', 'Please fill in all required fields: Client Name, Amount, and Due Date');
                return;
            }

            setLoading(true);
            try {
                const response = await createInvoice(newInvoice);
                if (response && response.success) {
                    showNotification('success', 'Invoice created successfully');
                    await fetchInvoices();
                    setActiveTab('list');
                    setNewInvoice({
                        clientName: '',
                        clientEmail: '',
                        tripId: '',
                        amount: '',
                        currency: 'USD',
                        dueDate: '',
                        notes: ''
                    });
                } else {
                    showNotification('error', response?.message || 'Failed to create invoice');
                }
            } catch (error) {
                console.error('Create invoice error:', error);
                showNotification('error', 'Failed to create invoice');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="bg-white rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Create New Invoice</h2>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setActiveTab('list')}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="px-4 py-2 rounded-md transition-colors flex items-center gap-2 disabled:bg-gray-400"
                                style={primaryButtonStyle}
                            >
                                <Plus className="h-4 w-4" />
                                {loading ? 'Creating...' : 'Create Invoice'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Trip (Optional)
                                </label>
                                <select
                                    value={newInvoice.tripId}
                                    onChange={(e) => handleTripSelect(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loading}
                                >
                                    <option value="">
                                        {loading ? "Loading trips..." : trips.length === 0 ? "No trips available - Check console for details" : "Select a trip..."}
                                    </option>
                                    {trips.map((trip) => {
                                        const tripId = trip._id;
                                        const tripNumber = trip.tripNumber || 'Unknown Trip';
                                        const startLocation = trip.startLocation?.place || trip.orders?.[0]?.pickupLocation?.place || "N/A";
                                        const endLocation = trip.endLocation?.place || trip.orders?.[trip.orders.length - 1]?.deliveryLocation?.place || "N/A";
                                        const customer = trip.orders?.[0]?.customer;
                                        const customerName = customer?.name || '';
                                        const customerEmail = customer?.email || '';
                                        
                                        return (
                                            <option key={tripId} value={tripId}>
                                                {tripNumber} - {startLocation} → {endLocation}
                                                {customerName && ` (${customerName})`}
                                                {customerEmail && ` [Email: ${customerEmail}]`}
                                            </option>
                                        );
                                    })}
                                </select>

                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-500">
                                        Selecting a trip will auto-fill customer details if available
                                        {trips.length > 0 && ` (${trips.length} trips available)`}
                                    </p>
                                    {newInvoice.tripId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewInvoice(prev => ({
                                                    ...prev,
                                                    tripId: '',
                                                    clientName: '',
                                                    clientEmail: ''
                                                }));
                                            }}
                                            className="text-xs text-red-600 hover:text-red-800 underline"
                                        >
                                            Clear Selection
                                        </button>
                                    )}
                                </div>
                                {newInvoice.tripId && !newInvoice.clientName && (
                                    <p className="text-xs text-amber-600 mt-1">
                                        ⚠️ Selected trip has no customer name - please fill manually
                                    </p>
                                )}
                                {newInvoice.tripId && newInvoice.clientName && !newInvoice.clientEmail && (
                                    <p className="text-xs text-blue-600 mt-1">
                                        ℹ️ Customer name found, but no email available - please add email manually if needed
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client Name *
                                    {newInvoice.tripId && newInvoice.clientName && (
                                        <span className="text-xs text-green-600 ml-2">✓ Auto-filled from trip</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={newInvoice.clientName}
                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        newInvoice.tripId && newInvoice.clientName 
                                            ? 'border-green-300 bg-green-50' 
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="Enter client name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Client Email
                                    {newInvoice.tripId && newInvoice.clientEmail && (
                                        <span className="text-xs text-green-600 ml-2">✓ Auto-filled from trip</span>
                                    )}
                                </label>
                                <input
                                    type="email"
                                    value={newInvoice.clientEmail}
                                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        newInvoice.tripId && newInvoice.clientEmail 
                                            ? 'border-green-300 bg-green-50' 
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="client@example.com"
                                />
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newInvoice.amount}
                                    onChange={(e) => handleInputChange('amount', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                <select
                                    value={newInvoice.currency}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="USD">USD - US Dollar</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="GBP">GBP - British Pound</option>
                                    <option value="CAD">CAD - Canadian Dollar</option>
                                    <option value="AUD">AUD - Australian Dollar</option>
                                    <option value="INR">INR - Indian Rupee</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                                <input
                                    type="date"
                                    value={newInvoice.dueDate}
                                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={newInvoice.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    rows={8}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Add any additional notes or details about this invoice..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'view':
                return <InvoiceView />;
            case 'edit':
                return <InvoiceEdit />;
            case 'create':
                return <CreateInvoice />;
            default:
                return (
                    <>
                        <DashboardOverview />
                        <InvoiceList />
                    </>
                );
        }
    };

    if (!loading && emptyStateMessage) {
        return (
            <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center space-y-5" style={pageBackgroundStyle}>
                <NotificationContainer />
                <Building2 className="h-16 w-16 text-gray-400" />
                <div className="space-y-3 max-w-md">
                    <h2 className="text-2xl font-semibold text-gray-800">No invoice data available</h2>
                    <p className="text-gray-500">{emptyStateMessage}</p>
                </div>
                <button
                    onClick={fetchInvoices}
                    className="px-4 py-2 rounded-lg shadow text-sm font-medium"
                    style={primaryButtonStyle}
                >
                    Refresh
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-gray-50" >
            <NotificationContainer />
            <DeleteConfirmationModal />
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
                            <p className="mt-2 text-gray-600">Manage invoices, track payments, and monitor revenue</p>
                        </div>
                        {activeTab === 'list' && (
                            <div className="mt-4 sm:mt-0">
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className="px-4 py-2 rounded-md transition-colors flex items-center gap-2"
                                    style={primaryButtonStyle}
                                >
                                    <Plus className="h-4 w-4" />
                                    New Invoice
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {renderContent()}
            </div>
        </div>
    );
};

export default InvoiceManagement;