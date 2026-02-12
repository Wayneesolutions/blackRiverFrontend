import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Eye, Edit, Filter, Calendar, DollarSign, Users, TrendingUp,
    Trash2, X, CheckCircle, AlertCircle, Building2, Download
} from 'lucide-react';
import { createInvoice, listInvoices, updateInvoice, deleteInvoice, listTrips } from "../../../../axios/api/account.invoices";
import jsPDF from 'jspdf';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';
import type { Trip } from '../../../../axios/api/main.dashboard';

interface CompanyInfo {
    _id?: string;
    companyName?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    taxNumber?: string;
    logoUrl?: string;
}

interface ServiceBreakdownItem {
    description: string;
    quantity?: number;
    unitPrice: number;
    amount: number;
    taxRate?: number;
    taxAmount?: number;
}

interface Invoice {
    _id: string;
    clientName: string;
    clientEmail: string;
    clientCompany?: string;
    clientAddress?: string;
    clientPhone?: string;
    loadId?: string; // Legacy field
    tripId?: string | Trip; // New field - can be populated
    orderId?: Order | {
        orderNumber: string;
        customerOrderNo?: string;
        pickupLocation?: { place?: string };
        deliveryLocation?: { place?: string };
        driver?: {
            _id: string;
            name: string;
            email?: string;
            phone?: string;
        };
        coDriver?: {
            _id: string;
            name: string;
            email?: string;
            phone?: string;
        };
        truck?: {
            _id: string;
            unitNumber?: string;
            plateNumber?: string;
            licensePlate?: string;
            internalId?: string;
            make?: string;
            model?: string;
            makeModel?: string;
            type?: string;
            unitType?: string;
        };
        trailer?: {
            _id: string;
            unitNumber?: string;
            plateNumber?: string;
            licensePlate?: string;
            make?: string;
            model?: string;
            makeModel?: string;
            type?: string;
            unitType?: string;
            capacity?: string;
        };
    };
    amount: number | string;
    currency: string;
    status: 'paid' | 'pending';
    invoiceDate: string;
    dueDate: string;
    paymentDate: string | null;
    paymentTerms?: string;
    invoiceUrl: string;
    notes: string;
    serviceBreakdown?: ServiceBreakdownItem[];
    subtotal?: number;
    taxAmount?: number;
    taxNumber?: string;
    gst?: number;
    gstRate?: number;
    pst?: number;
    pstRate?: number;
    company?: CompanyInfo | string;
    createdAt: string;
    updatedAt: string;
}

interface Order {
    _id: string;
    orderNumber: string;
    customerOrderNo?: string;
    status: string;
    driver?: {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
    };
    coDriver?: {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
    };
    truck?: {
        _id: string;
        unitNumber?: string;
        plateNumber?: string;
        licensePlate?: string; // Legacy field
        internalId?: string;
        make?: string;
        model?: string;
        makeModel?: string; // Legacy field
        type?: string;
        unitType?: string; // Legacy field
    };
    trailer?: {
        _id: string;
        unitNumber?: string;
        plateNumber?: string;
        licensePlate?: string; // Legacy field
        make?: string;
        model?: string;
        makeModel?: string; // Legacy field
        type?: string;
        unitType?: string; // Legacy field
        capacity?: string;
    };
    customer?: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        address?: string;
        company?: string;
        city?: string;
        state?: string;
        country?: string;
        location?: {
            address?: string;
            city?: string;
            state?: string;
            postalCode?: string;
        };
    };
    pickupLocation?: {
        place?: string;
        placeId?: {
            name?: string;
            currentLocation?: {
                address?: string;
                city?: string;
                state?: string;
            };
        };
    };
    deliveryLocation?: {
        place?: string;
        placeId?: {
            name?: string;
            currentLocation?: {
                address?: string;
                city?: string;
                state?: string;
            };
        };
    };
    commodity?: string;
    weight?: number;
    weightUnit?: string;
    orderType?: string;
    equipment?: string[];
    noOfPackages?: number;
    noOfPackagesType?: string;
    temperature?: number;
    additionalInfo?: {
        HAZMAT?: boolean;
        TARP?: boolean;
        OverDimension?: boolean;
        CSA?: boolean;
    };
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
        unit?: string;
    };
    pickupDate?: string;
    deliveryDate?: string;
    createdAt?: string;
    updatedAt?: string;
    notes?: string;
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
    const [orders, setOrders] = useState<Order[]>([]);
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
        fetchOrders();
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

    const handleDownloadPDF = async (invoice: Invoice) => {
        try {
          const doc = new jsPDF();
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
      
          const margin = 20;
          const contentWidth = pageWidth - margin * 2;
          const bottomMargin = 20;
      
          let yPos = 15;
      
          const textColor: [number, number, number] = [31, 41, 55];
          const grayColor: [number, number, number] = [107, 114, 128];
      
          /* ---------------- PAGE BREAK ---------------- */
          const checkPageBreak = (requiredHeight: number) => {
            if (yPos + requiredHeight > pageHeight - bottomMargin) {
              doc.addPage();
              yPos = margin;
            }
          };
      
          /* ---------------- TEXT ROW PRINTER ---------------- */
          const printRow = (
            label: string,
            value: string | undefined,
            labelX: number,
            valueX: number,
            maxWidth: number
          ) => {
            const lines = doc.splitTextToSize(value || "N/A", maxWidth);
      
            checkPageBreak(lines.length * 5 + 2);
      
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...grayColor);
            doc.text(label, labelX, yPos);
      
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textColor);
            doc.text(lines, valueX, yPos);
      
            yPos += lines.length * 5 + 2;
          };
      
          /* ---------------- COMPANY ---------------- */
          const company =
            typeof invoice.company === "object" ? invoice.company : null;
      
          /* ---------------- HEADER ---------------- */
          if (company?.logoUrl) {
            try {
              const res = await fetch(company.logoUrl);
              const blob = await res.blob();
              const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
      
              doc.addImage(base64, "PNG", margin, yPos, 45, 25);
            } catch {}
          }
      
          doc.setFontSize(32);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...textColor);
          doc.text("INVOICE", pageWidth - margin, yPos + 12, { align: "right" });
      
          /* ---------------- COMPANY & BILL TO ---------------- */
          yPos = 55;
      
          const leftCol = margin;
          const rightCol = pageWidth / 2 + 10;
          const colWidth = (pageWidth - margin * 2) / 2 - 10;
      
          if (company) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(company.companyName || "Company Name", leftCol, yPos);
            yPos += 7;
      
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
      
            if (company.address) {
              const lines = doc.splitTextToSize(company.address, colWidth);
              doc.text(lines, leftCol, yPos);
              yPos += lines.length * 5;
            }
      
            if (company.contactPhone) {
              doc.text(`Phone: ${company.contactPhone}`, leftCol, yPos);
              yPos += 6;
            }
      
            if (company.contactEmail) {
              doc.text(`Email: ${company.contactEmail}`, leftCol, yPos);
              yPos += 6;
            }
      
            if (company.taxNumber) {
              doc.text(`GST No: ${company.taxNumber}`, leftCol, yPos);
              yPos += 6;
            }
          }
      
          /* -------- BILL TO -------- */
          let rightY = 55;
      
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Bill To:", rightCol, rightY);
          rightY += 8;
      
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
      
          doc.text(invoice.clientName, rightCol, rightY);
          rightY += 7;
      
          if (invoice.clientAddress) {
            const lines = doc.splitTextToSize(invoice.clientAddress, colWidth);
            doc.text(lines, rightCol, rightY);
            rightY += lines.length * 5;
          }
      
          if (invoice.clientEmail) {
            doc.text(invoice.clientEmail, rightCol, rightY);
            rightY += 6;
          }
      
          if (invoice.clientPhone) {
            doc.text(`Phone: ${invoice.clientPhone}`, rightCol, rightY);
            rightY += 6;
          }
      
          yPos = Math.max(yPos, rightY) + 10;
      
          /* ---------------- LOAD DETAILS ---------------- */
          const trip = typeof invoice.tripId === "object" ? invoice.tripId : null;
          const order = invoice.orderId;
      
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("Load Details:", margin, yPos);
          yPos += 8;
      
          doc.setFontSize(10);
      
          const pickup =
            trip?.startLocation?.place || order?.pickupLocation?.place;
          const dropoff =
            trip?.endLocation?.place || order?.deliveryLocation?.place;
      
          if (pickup)
            printRow(
              "Pickup Location:",
              pickup,
              margin,
              margin + 55,
              pageWidth - margin - 60
            );
      
          if (dropoff)
            printRow(
              "Dropoff Location:",
              dropoff,
              margin,
              margin + 55,
              pageWidth - margin - 60
            );
      
          /* ---------------- VEHICLE SECTIONS ---------------- */
          const renderVehicleSection = (title: string, data: any) => {
            if (!data) return;
      
            checkPageBreak(25);
      
            yPos += 3;
      
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...textColor);
            doc.text(title, margin, yPos);
      
            yPos += 7;
            doc.setFontSize(9);
      
            const number =
              data.plateNumber ||
              data.licensePlate ||
              data.unitNumber ||
              data.internalId ||
              (data._id ? data._id.slice(-8) : "N/A");
      
            printRow("Unit/Plate:", number, margin, margin + 55, 80);
      
            if (data.make) printRow("Make:", data.make, margin, margin + 55, 80);
            if (data.model) printRow("Model:", data.model, margin, margin + 55, 80);
            if (data.type || data.unitType)
              printRow("Type:", data.type || data.unitType, margin, margin + 55, 80);
            if (data.year)
              printRow("Year:", String(data.year), margin, margin + 55, 80);
            if (data.vin) printRow("VIN:", data.vin, margin, margin + 55, 80);
          };
      
          renderVehicleSection("TRUCK DETAILS:", trip?.truck || order?.truck);
          renderVehicleSection("TRAILER DETAILS:", trip?.trailer || order?.trailer);
      
          /* ---------------- DRIVER SECTION ---------------- */
          const renderDriverSection = () => {
            const driver = trip?.driver || order?.driver;
            const coDriver = trip?.coDriver || order?.coDriver;
      
            if (!driver && !coDriver) return;
      
            checkPageBreak(30);
      
            yPos += 3;
      
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text("DRIVER INFORMATION:", margin, yPos);
            yPos += 7;
      
            doc.setFontSize(9);
      
            if (driver) {
              const driverName = typeof driver === 'object' ? driver.name : driver;
              const driverId = typeof driver === 'object' 
                ? (driver._id?.slice(-8) || (driver as any).internalId || 'N/A')
                : (typeof driver === 'string' ? driver.slice(-8) : 'N/A');
              printRow("Driver Name:", driverName, margin, margin + 55, 80);
              printRow(
                "Driver ID:",
                driverId,
                margin,
                margin + 55,
                80
              );
            }
      
            if (coDriver) {
              const coDriverName = typeof coDriver === 'object' ? coDriver.name : (typeof coDriver === 'string' ? coDriver : 'N/A');
              let coDriverId = 'N/A';
              if (typeof coDriver === 'object') {
                coDriverId = coDriver._id?.slice(-8) || (coDriver as any).internalId || 'N/A';
              } else if (typeof coDriver === 'string') {
                coDriverId = coDriver.slice(-8);
              }
              printRow("Co-Driver Name:", coDriverName, margin, margin + 55, 80);
              printRow(
                "Co-Driver ID:",
                coDriverId,
                margin,
                margin + 55,
                80
              );
            }
          };
      
          renderDriverSection();
      
          /* ---------------- TABLE ---------------- */
          yPos += 10;
          checkPageBreak(20);
      
          const colDesc = margin;
          const colQty = margin + 90;
          const colPrice = pageWidth - margin - 40;
          const colAmount = pageWidth - margin;
      
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
      
          doc.text("DESCRIPTION", colDesc, yPos);
          doc.text("QTY", colQty, yPos);
          doc.text("UNIT PRICE", colPrice, yPos, { align: "right" });
          doc.text("AMOUNT", colAmount, yPos, { align: "right" });
      
          doc.line(colDesc, yPos + 3, colAmount, yPos + 3);
          yPos += 8;
      
          doc.setFont("helvetica", "normal");
      
          let subtotal = Number(invoice.subtotal || invoice.amount);
      
          checkPageBreak(10);
      
          doc.text("Freight Service", colDesc, yPos);
          doc.text("1", colQty, yPos);
          doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, colPrice, yPos, {
            align: "right",
          });
          doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, colAmount, yPos, {
            align: "right",
          });
      
          yPos += 10;
      
          /* ---------------- TAX + TOTAL ---------------- */
          const gst = invoice.gst || 0;
          const pst = invoice.pst || 0;
          const total = Number(invoice.amount);
      
          checkPageBreak(40);
      
          doc.setFont("helvetica", "bold");
          doc.text("Subtotal:", colPrice, yPos, { align: "right" });
          doc.setFont("helvetica", "normal");
          doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, colAmount, yPos, {
            align: "right",
          });
      
          yPos += 7;
      
          doc.setFont("helvetica", "bold");
          doc.text("GST:", colPrice, yPos, { align: "right" });
          doc.setFont("helvetica", "normal");
          doc.text(`${invoice.currency} ${gst.toFixed(2)}`, colAmount, yPos, {
            align: "right",
          });
      
          yPos += 7;
      
          doc.setFont("helvetica", "bold");
          doc.text("PST:", colPrice, yPos, { align: "right" });
          doc.setFont("helvetica", "normal");
          doc.text(`${invoice.currency} ${pst.toFixed(2)}`, colAmount, yPos, {
            align: "right",
          });
      
          /* -------- TOTAL BOX -------- */
          yPos += 12;
      
          doc.rect(margin, yPos, contentWidth, 20);
      
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.text("TOTAL AMOUNT DUE", margin + 5, yPos + 13);
      
          doc.setFontSize(18);
          doc.text(`${invoice.currency} ${total.toFixed(2)}`, pageWidth - margin - 5, yPos + 13, {
            align: "right",
          });
      
          /* ---------------- SAVE ---------------- */
          doc.save(`Invoice_${invoice._id.slice(-8)}.pdf`);
        } catch (err) {
          console.error(err);
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

    const fetchOrders = async () => {
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
                setOrders([]);
                return;
            }

            console.log('🔍 Starting to fetch orders...');
            const response = await listTrips();
            console.log('📡 Order API Response:', response);
            console.log('📡 Response type:', typeof response);
            console.log('📡 Response keys:', response ? Object.keys(response) : 'null');

            // Handle different response structures
            let orderData = null;
            if (response && response.data) {
                orderData = response.data;
                console.log('✅ Found data in response.data:', orderData);
            } else if (response && Array.isArray(response)) {
                orderData = response;
                console.log('✅ Response is array:', orderData);
            } else if (response && response.success && response.data) {
                orderData = response.data;
                console.log('✅ Found data in response.success.data:', orderData);
            } else {
                console.log('❌ No data found in response structure');
            }

            if (orderData && Array.isArray(orderData)) {
                console.log('✅ Setting orders with data:', orderData);
                console.log('✅ Number of orders:', orderData.length);
                setOrders(orderData);
            } else {
                console.log('❌ No valid order data found in response:', response);
                setOrders([]);
            }
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            console.error('❌ Error details:', error);
            setOrders([]);
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
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40  ">
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
                                className="px-4 py-2 !text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
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
            <div className="bg-[#E3F2FD] rounded-lg p-6 border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-[#063f6f]">Total Revenue</p>
                        <p className="text-2xl font-bold text-[#016ab2]">
                            {formatCurrency(stats.totalAmount)}
                        </p>
                        <p className="text-xs text-[#063f6f]">{invoices.length} invoices</p>
                    </div>
                    <div className="bg-white p-3 rounded-full">
                        <DollarSign className="h-6 w-6 text-[#42aeec]" />
                    </div>
                </div>
            </div>

            <div className="bg-[#E8F5E9] rounded-lg p-6 border border-green-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-[#063f6f]">Paid</p>
                        <p className="text-2xl font-bold text-[#016ab2]">
                            {formatCurrency(stats.paidAmount)}
                        </p>
                        <p className="text-xs text-[#063f6f]">{stats.paidCount} invoices</p>
                    </div>
                    <div className="bg-white p-3 rounded-full">
                        <TrendingUp className="h-6 w-6 text-[#0ea3d8]" />
                    </div>
                </div>
            </div>

            <div className="bg-[#FFF8E1] rounded-lg p-6 border border-yellow-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-[#063f6f]">Pending</p>
                        <p className="text-2xl font-bold text-[#016ab2]">
                            {formatCurrency(stats.pendingAmount)}
                        </p>
                        <p className="text-xs text-[#063f6f]">{stats.pendingCount} invoices</p>
                    </div>
                    <div className="bg-white p-3 rounded-full">
                        <Calendar className="h-6 w-6 text-[#f59e0b]" />
                    </div>
                </div>
            </div>

            <div className="bg-[#F3E5F5] rounded-lg p-6 border border-purple-100 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-[#063f6f]">Collection Rate</p>
                        <p className="text-2xl font-bold text-[#016ab2]">
                            {stats.totalAmount > 0 ? ((stats.paidAmount / stats.totalAmount) * 100).toFixed(1) : 0}%
                        </p>
                        <p className="text-xs text-[#063f6f]">Payment efficiency</p>
                    </div>
                    <div className="bg-white p-3 rounded-full">
                        <Users className="h-6 w-6 text-[#1db5f5]" />
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
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Trip Details</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Amount</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Due Date</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                                <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredInvoices.map((invoice) => {
                                // Extract trip number from notes if tripId is null
                                const extractTripNumberFromNotes = (notes: string): string | null => {
                                    if (!notes) return null;
                                    const match = notes.match(/trip\s+([A-Z0-9]+)/i);
                                    return match ? match[1] : null;
                                };

                                const trip = typeof invoice.tripId === 'object' && invoice.tripId ? invoice.tripId : null;
                                const order = invoice.orderId;
                                const tripNumberFromNotes = !trip && invoice.notes ? extractTripNumberFromNotes(invoice.notes) : null;
                                const displayId = trip?.tripNumber || order?.orderNumber || tripNumberFromNotes || (typeof invoice.tripId === 'string' ? invoice.tripId.slice(-8) : null);
                                const startLocation = trip?.startLocation?.place || trip?.orders?.[0]?.pickupLocation?.place || order?.pickupLocation?.place || 'N/A';
                                const endLocation = trip?.endLocation?.place || trip?.orders?.[trip?.orders?.length - 1]?.deliveryLocation?.place || order?.deliveryLocation?.place || 'N/A';
                                const ordersCount = trip?.orders?.length || (order ? 1 : 0);

                                return (
                                    <tr
                                        key={invoice._id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => {
                                            setSelectedInvoice(invoice);
                                            setActiveTab('view');
                                        }}
                                    >
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
                                            {trip ? (
                                                <div className="space-y-1">
                                                    {trip?.tripNumber && (
                                                        <div className="font-medium text-gray-900 text-sm">
                                                            {trip?.tripNumber}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-600">
                                                        {startLocation} → {endLocation}
                                                    </div>
                                                    {ordersCount > 0 && (
                                                        <div className="text-xs text-gray-500">
                                                            {ordersCount} {ordersCount === 1 ? 'order' : 'orders'}
                                                        </div>
                                                    )}
                                                    {trip.truck && (
                                                        <div className="text-xs text-gray-500">
                                                            Truck: {trip.truck.plateNumber || trip.truck.licensePlate || trip.truck.unitNumber || trip.truck.internalId || 'N/A'}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : displayId ? (
                                                <div className="space-y-1">
                                                    <div className="font-medium text-gray-900 text-sm">
                                                        {displayId}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        {startLocation} → {endLocation}
                                                    </div>
                                                    {order && (
                                                        <div className="text-xs text-gray-400">
                                                            Order Invoice
                                                        </div>
                                                    )}
                                                    {invoice.notes && invoice.notes.includes('Auto-generated') && (
                                                        <div className="text-xs text-gray-400">
                                                            Auto-generated
                                                        </div>
                                                    )}
                                                </div>
                                            ) : invoice.tripId ? (
                                                <div className="text-sm text-gray-500">
                                                    Trip: {typeof invoice.tripId === 'string' ? invoice.tripId.slice(-8) : 'N/A'}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400">-</div>
                                            )}
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
                                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadPDF(invoice);
                                                    }}
                                                    className="p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
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
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );

    const InvoiceView: React.FC = () => {
        if (!selectedInvoice) return null;

        const company = typeof selectedInvoice.company === "object" && selectedInvoice.company
            ? selectedInvoice.company
            : null;

        const subtotal = Number(selectedInvoice.subtotal || selectedInvoice.amount);
        const gstRate = selectedInvoice.gstRate || 0;
        const pstRate = selectedInvoice.pstRate || 0;
        const gstAmount = selectedInvoice.gst || (subtotal * (gstRate / 100));
        const pstAmount = selectedInvoice.pst || (subtotal * (pstRate / 100));
        const totalAmount = Number(selectedInvoice.amount);

        // Get trip/order details for description
        const trip = typeof selectedInvoice.tripId === 'object' && selectedInvoice.tripId ? selectedInvoice.tripId : null;
        const order = selectedInvoice.orderId;
        // Type guard to check if order is a full Order object
        const isFullOrder = (o: any): o is Order => {
            return o && typeof o === 'object' && '_id' in o;
        };
        const tripNumber = trip?.tripNumber || order?.orderNumber || null;
        const description = tripNumber 
            ? `Freight Charges - Order #${tripNumber}`
            : selectedInvoice.serviceBreakdown?.[0]?.description || 'Freight Service';


        return (
            <div className="bg-white rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Invoice Preview</h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleDownloadPDF(selectedInvoice)}
                                className="px-5 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 !text-white rounded-md hover:from-gray-800 hover:to-gray-900 transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 duration-200 font-medium"
                            >
                                <Download className="h-4 w-4" />
                                Download PDF
                            </button>
                            <button
                                onClick={() => setActiveTab('list')}
                                className="text-gray-500 hover:text-gray-700 transition-colors px-3 py-2 hover:bg-gray-100 rounded-lg"
                            >
                                ← Back to List
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-100">
                    {/* Invoice Document Preview */}
                    <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-200">
                        {/* Header - White Background with Logo and Title */}
                        <div className="bg-white px-10 py-6 border-b-2 border-gray-300 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {company?.logoUrl && (
                                    <img 
                                        src={company.logoUrl} 
                                        alt="Company Logo" 
                                        className="h-16 w-auto object-contain max-w-[200px]"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900 tracking-wider uppercase" style={{ letterSpacing: '0.1em' }}>INVOICE</h1>
                        </div>

                        {/* Body */}
                        <div className="px-10 py-8">
                            {/* Company Details (Left) & Bill To (Right) */}
                            <div className="grid grid-cols-2 gap-12 mb-8">
                                {/* Left Column - Company Details */}
                                {company && (
                                    <div className="space-y-1.5">
                                        <h3 className="font-bold text-gray-900 text-base leading-tight mb-3">{company.companyName || 'Company Name'}</h3>
                                        {company.address && (
                                            <p className="text-sm text-gray-700 leading-relaxed">{company.address}</p>
                                        )}
                                        {company.contactPhone && (
                                            <p className="text-sm text-gray-700">Phone: {company.contactPhone}</p>
                                        )}
                                        {company.contactEmail && (
                                            <p className="text-sm text-gray-700">Email: {company.contactEmail}</p>
                                        )}
                                        {company.taxNumber && (
                                            <p className="text-sm text-gray-700">GST No: {company.taxNumber}</p>
                                        )}
                                    </div>
                                )}

                                {/* Right Column - Bill To Section */}
                                <div>
                                    <h3 className="font-bold text-gray-900 mb-3 text-base">Bill To:</h3>
                                    <div className="space-y-1.5">
                                        <p className="text-sm font-semibold text-gray-900">{selectedInvoice.clientName}</p>
                                        {selectedInvoice.clientAddress && (
                                            <p className="text-sm text-gray-700 leading-relaxed">{selectedInvoice.clientAddress}</p>
                                        )}
                                        {selectedInvoice.clientEmail && (
                                            <p className="text-sm text-gray-700">{selectedInvoice.clientEmail}</p>
                                        )}
                                        {selectedInvoice.clientPhone && (
                                            <p className="text-sm text-gray-700">Phone: {selectedInvoice.clientPhone}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Load/Trip Details Section */}
                            {(trip || order) && (
                                <div className="mt-8 p-5 border border-gray-200">
                                    <h3 className="font-bold text-gray-900 mb-4 text-base">Load Details:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Trip/Order Number */}
                                        {(trip?.tripNumber || order?.orderNumber) && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Trip/Order Number</p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {trip?.tripNumber || order?.orderNumber}
                                                </p>
                                            </div>
                                        )}

                                        {/* Customer Order Number */}
                                        {order?.customerOrderNo && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Customer PO Number</p>
                                                <p className="text-sm font-semibold text-gray-900">{order.customerOrderNo}</p>
                                            </div>
                                        )}

                                        {/* Pickup Location */}
                                        {(trip?.startLocation?.place || trip?.orders?.[0]?.pickupLocation?.place || order?.pickupLocation?.place) && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Pickup Location</p>
                                                <p className="text-sm text-gray-900">
                                                    {trip?.startLocation?.place || trip?.orders?.[0]?.pickupLocation?.place || order?.pickupLocation?.place}
                                                </p>
                                            </div>
                                        )}

                                        {/* Dropoff Location */}
                                        {(trip?.endLocation?.place || trip?.orders?.[trip?.orders?.length - 1]?.deliveryLocation?.place || order?.deliveryLocation?.place) && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">Dropoff Location</p>
                                                <p className="text-sm text-gray-900">
                                                    {trip?.endLocation?.place || trip?.orders?.[trip?.orders?.length - 1]?.deliveryLocation?.place || order?.deliveryLocation?.place}
                                                </p>
                                            </div>
                                        )}

                                    </div>

                                    {/* Truck Details Section */}
                                    {(() => {
                                        // Check multiple sources for truck data
                                        let truckInfo = trip?.truck;
                                        if (!truckInfo && isFullOrder(order) && order.truck) {
                                            truckInfo = order.truck;
                                        }
                                        // Also check trip's orders for truck data
                                        if (!truckInfo && trip?.orders && trip.orders.length > 0) {
                                            truckInfo = trip.orders[0]?.truck;
                                        }
                                        // Show section if truck object exists (even if empty)
                                        return truckInfo ? (
                                            <div className="mt-6 pt-6 border-t border-gray-300">
                                                <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                                                    Truck Details
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Unit/Plate Number</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {truckInfo.plateNumber || truckInfo.licensePlate || truckInfo.unitNumber || truckInfo.internalId || (truckInfo._id ? truckInfo._id.slice(-8) : 'N/A')}
                                                        </p>
                                                    </div>
                                                    {truckInfo.make && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Make</p>
                                                            <p className="text-sm text-gray-900">{truckInfo.make}</p>
                                                        </div>
                                                    )}
                                                    {truckInfo.model && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Model</p>
                                                            <p className="text-sm text-gray-900">{truckInfo.model}</p>
                                                        </div>
                                                    )}
                                                    {truckInfo.makeModel && !truckInfo.make && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Make/Model</p>
                                                            <p className="text-sm text-gray-900">{truckInfo.makeModel}</p>
                                                        </div>
                                                    )}
                                                    {(truckInfo.type || truckInfo.unitType) && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Type</p>
                                                            <p className="text-sm text-gray-900">{truckInfo.type || truckInfo.unitType}</p>
                                                        </div>
                                                    )}
                                                    {truckInfo.year && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Year</p>
                                                            <p className="text-sm text-gray-900">{truckInfo.year}</p>
                                                        </div>
                                                    )}
                                                    {truckInfo.vin && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">VIN</p>
                                                            <p className="text-sm text-gray-900 font-mono">{truckInfo.vin}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}

                                    {/* Trailer Details Section */}
                                    {(() => {
                                        // Check multiple sources for trailer data
                                        let trailerInfo = trip?.trailer;
                                        if (!trailerInfo && isFullOrder(order) && order.trailer) {
                                            trailerInfo = order.trailer;
                                        }
                                        // Also check trip's orders for trailer data
                                        if (!trailerInfo && trip?.orders && trip.orders.length > 0) {
                                            trailerInfo = trip.orders[0]?.trailer;
                                        }
                                        // Show section if trailer object exists (even if empty)
                                        return trailerInfo ? (
                                            <div className="mt-6 pt-6 border-t border-gray-300">
                                                <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                                                    Trailer Details
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Unit/Plate Number</p>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {trailerInfo.plateNumber || trailerInfo.licensePlate || trailerInfo.unitNumber || trailerInfo.internalId || (trailerInfo._id ? trailerInfo._id.slice(-8) : 'N/A')}
                                                        </p>
                                                    </div>
                                                    {trailerInfo.make && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Make</p>
                                                            <p className="text-sm text-gray-900">{trailerInfo.make}</p>
                                                        </div>
                                                    )}
                                                    {trailerInfo.model && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Model</p>
                                                            <p className="text-sm text-gray-900">{trailerInfo.model}</p>
                                                        </div>
                                                    )}
                                                    {trailerInfo.makeModel && !trailerInfo.make && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Make/Model</p>
                                                            <p className="text-sm text-gray-900">{trailerInfo.makeModel}</p>
                                                        </div>
                                                    )}
                                                    {trailerInfo.type && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Type</p>
                                                            <p className="text-sm text-gray-900">{trailerInfo.type}</p>
                                                        </div>
                                                    )}
                                                    {trailerInfo.capacity && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Capacity</p>
                                                            <p className="text-sm text-gray-900">{trailerInfo.capacity}</p>
                                                        </div>
                                                    )}
                                                    {trailerInfo.year && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">Year</p>
                                                            <p className="text-sm text-gray-900">{trailerInfo.year}</p>
                                                        </div>
                                                    )}
                                                    {trailerInfo.vin && (
                                                        <div>
                                                            <p className="text-xs text-gray-600 mb-1">VIN</p>
                                                            <p className="text-sm text-gray-900 font-mono">{trailerInfo.vin}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}

                                    {/* Driver & Co-Driver Section */}
                                    {(() => {
                                        // Check multiple sources for driver data
                                        let driverInfo = trip?.driver;
                                        let coDriverInfo = trip?.coDriver;
                                        
                                        if (!driverInfo && isFullOrder(order) && order.driver) {
                                            driverInfo = order.driver;
                                        }
                                        if (!coDriverInfo && isFullOrder(order) && order.coDriver) {
                                            coDriverInfo = order.coDriver;
                                        }
                                        
                                        // Also check trip's orders for driver data
                                        if ((!driverInfo || !coDriverInfo) && trip?.orders && trip.orders.length > 0) {
                                            if (!driverInfo) driverInfo = trip.orders[0]?.driver;
                                            if (!coDriverInfo) coDriverInfo = trip.orders[0]?.coDriver;
                                        }
                                        
                                        // Show section if driver or coDriver exists
                                        return (driverInfo || coDriverInfo) ? (
                                            <div className="mt-6 pt-6 border-t border-gray-300">
                                                <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                                                    Driver Information
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Driver */}
                                                    {driverInfo && (
                                                        <div className="bg-white rounded-md p-4 border border-gray-200">
                                                            <p className="text-xs text-gray-600 mb-3 font-semibold uppercase">Driver</p>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <p className="text-xs text-gray-600 mb-1">Name</p>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {typeof driverInfo === 'object' ? (driverInfo?.name || 'N/A') : (driverInfo || 'N/A')}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-600 mb-1">Driver ID</p>
                                                                    <p className="text-sm text-gray-900 font-mono">
                                                                        {(() => {
                                                                            if (typeof driverInfo === 'string') {
                                                                                return driverInfo.slice(-8) || 'N/A';
                                                                            }
                                                                            const driverId = driverInfo?._id;
                                                                            const driverInternalId = driverInfo?.internalId;
                                                                            return driverId ? driverId.slice(-8) : (driverInternalId || 'N/A');
                                                                        })()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Co-Driver */}
                                                    {coDriverInfo && (
                                                        <div className="bg-white rounded-md p-4 border border-gray-200">
                                                            <p className="text-xs text-gray-600 mb-3 font-semibold uppercase">Co-Driver</p>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <p className="text-xs text-gray-600 mb-1">Name</p>
                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {coDriverInfo.name || 'N/A'}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-gray-600 mb-1">Driver ID</p>
                                                                    <p className="text-sm text-gray-900 font-mono">
                                                                        {(() => {
                                                                            const coDriverId = coDriverInfo._id;
                                                                            const coDriverInternalId = (coDriverInfo as any)?.internalId;
                                                                            return coDriverId ? coDriverId.slice(-8) : (coDriverInternalId || 'N/A');
                                                                        })()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null;
                                    })()}

                                    {/* Additional Trip Information */}
                                    {(trip?.route?.totalDistance || trip?.plannedStartDate || trip?.actualStartDate) && (
                                        <div className="mt-6 pt-6 border-t border-gray-300">
                                                <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                                                    Trip Information
                                                </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {trip?.route?.totalDistance && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Total Distance</p>
                                                        <p className="text-sm text-gray-900">
                                                            {trip.route.totalDistance.toFixed(2)} km ({(trip.route.totalDistance * 0.621371).toFixed(2)} miles)
                                                        </p>
                                                    </div>
                                                )}
                                                {trip?.plannedStartDate && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Planned Start Date</p>
                                                        <p className="text-sm text-gray-900">{formatDate(trip.plannedStartDate)}</p>
                                                    </div>
                                                )}
                                                {trip?.actualStartDate && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Actual Start Date</p>
                                                        <p className="text-sm text-gray-900">{formatDate(trip.actualStartDate)}</p>
                                                    </div>
                                                )}
                                                {trip?.plannedEndDate && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Planned End Date</p>
                                                        <p className="text-sm text-gray-900">{formatDate(trip.plannedEndDate)}</p>
                                                    </div>
                                                )}
                                                {trip?.actualEndDate && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Actual End Date</p>
                                                        <p className="text-sm text-gray-900">{formatDate(trip.actualEndDate)}</p>
                                                    </div>
                                                )}
                                                {trip?.status && (
                                                    <div>
                                                        <p className="text-xs text-gray-600 mb-1">Trip Status</p>
                                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                            trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            trip.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Invoice Details Table */}
                            <div className="mt-10">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-gray-300">
                                            <th className="text-left py-4 px-5 font-bold text-gray-900 text-sm uppercase tracking-wide">Description</th>
                                            <th className="text-center py-4 px-5 font-bold text-gray-900 text-sm uppercase tracking-wide">Qty</th>
                                            <th className="text-right py-4 px-5 font-bold text-gray-900 text-sm uppercase tracking-wide">Unit Price</th>
                                            <th className="text-right py-4 px-5 font-bold text-gray-900 text-sm uppercase tracking-wide">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.serviceBreakdown && selectedInvoice.serviceBreakdown.length > 0 ? (
                                            selectedInvoice.serviceBreakdown.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                    <td className="py-4 px-5 text-sm text-gray-800">{item.description || 'Service'}</td>
                                                    <td className="py-4 px-5 text-sm text-gray-800 text-center">{item.quantity || 1}</td>
                                                    <td className="py-4 px-5 text-sm text-gray-800 text-right font-mono">
                                                        {selectedInvoice.currency} {item.unitPrice.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-5 text-sm text-gray-800 text-right font-semibold font-mono">
                                                        {selectedInvoice.currency} {(item.amount || item.unitPrice * (item.quantity || 1)).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-5 text-sm text-gray-800">{description}</td>
                                                <td className="py-4 px-5 text-sm text-gray-800 text-center">1</td>
                                                <td className="py-4 px-5 text-sm text-gray-800 text-right font-mono">
                                                    {selectedInvoice.currency} {subtotal.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-5 text-sm text-gray-800 text-right font-semibold font-mono">
                                                    {selectedInvoice.currency} {subtotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals Section */}
                            <div className="mt-8 flex justify-end">
                                <div className="w-72 space-y-3">
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="font-semibold text-gray-800">Subtotal:</span>
                                        <span className="text-gray-800 font-mono">{selectedInvoice.currency} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="font-semibold text-gray-800">GST ({gstRate > 0 ? `${gstRate}%` : '0%'}):</span>
                                        <span className="text-gray-800 font-mono">{selectedInvoice.currency} {gstAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-1">
                                        <span className="font-semibold text-gray-800">PST ({pstRate > 0 ? `${pstRate}%` : '0%'}):</span>
                                        <span className="text-gray-800 font-mono">{selectedInvoice.currency} {pstAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Total Amount Box */}
                            <div className="mt-6 border-2 border-gray-900 rounded-sm p-5 bg-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-900 font-bold text-lg uppercase tracking-wide">Total Amount Due</span>
                                    <span className="text-gray-900 font-bold text-2xl font-mono">
                                        {selectedInvoice.currency} {totalAmount.toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* GST Details Section */}
                            {company && (company.taxNumber || gstRate > 0 || pstRate > 0) && (
                                <div className="mt-8 pt-6 border-t border-gray-300">
                                    <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">
                                        Tax Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {company.taxNumber && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">GST/HST Number</p>
                                                <p className="text-sm font-semibold text-gray-900">{company.taxNumber}</p>
                                            </div>
                                        )}
                                        {gstRate > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">GST Rate</p>
                                                <p className="text-sm font-semibold text-gray-900">{gstRate}%</p>
                                            </div>
                                        )}
                                        {pstRate > 0 && (
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">PST Rate</p>
                                                <p className="text-sm font-semibold text-gray-900">{pstRate}%</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">GST Amount</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedInvoice.currency} {gstAmount.toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">PST Amount</p>
                                            <p className="text-sm font-semibold text-gray-900">{selectedInvoice.currency} {pstAmount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Invoice Metadata */}
                            <div className="mt-10 pt-6 border-t-2 border-gray-300 grid grid-cols-2 gap-6 text-sm">
                                <div>
                                    <span className="font-semibold text-gray-700">Invoice Date:</span>
                                    <span className="ml-2 text-gray-800">{formatDate(selectedInvoice.invoiceDate)}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Due Date:</span>
                                    <span className="ml-2 text-gray-800">{formatDate(selectedInvoice.dueDate)}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Invoice ID:</span>
                                    <span className="ml-2 text-gray-800 font-mono">{selectedInvoice._id.slice(-8)}</span>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-700">Status:</span>{' '}
                                    <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                                        {selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                                    </span>
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedInvoice.notes && (
                                <div className="mt-8 pt-6 border-t-2 border-gray-300">
                                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Notes:</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedInvoice.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Details Section (Collapsible) */}
                    {(selectedInvoice.tripId || selectedInvoice.orderId) && (
                        <div className="max-w-4xl mx-auto mt-6 bg-white rounded-lg shadow-lg p-6">
                            <details className="group">
                                <summary className="cursor-pointer flex items-center justify-between text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors">
                                    <span>{selectedInvoice.orderId ? 'Order Details' : 'Trip Details'}</span>
                                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="mt-4 space-y-4">
                                    {selectedInvoice.orderId ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Order Number</label>
                                                    <p className="text-sm font-medium">{selectedInvoice.orderId.orderNumber}</p>
                                                </div>
                                                {selectedInvoice.orderId.customerOrderNo && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">Customer Ref</label>
                                                        <p className="text-sm">{selectedInvoice.orderId.customerOrderNo}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedInvoice.orderId.pickupLocation?.place && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">Pickup Location</label>
                                                        <p className="text-sm">{selectedInvoice.orderId.pickupLocation.place}</p>
                                                    </div>
                                                )}
                                                {selectedInvoice.orderId.deliveryLocation?.place && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">Delivery Location</label>
                                                        <p className="text-sm">{selectedInvoice.orderId.deliveryLocation.place}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : typeof selectedInvoice.tripId === 'object' && selectedInvoice.tripId ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedInvoice.tripId.tripNumber && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">Trip Number</label>
                                                        <p className="text-sm font-medium">{selectedInvoice.tripId.tripNumber}</p>
                                                    </div>
                                                )}
                                                {selectedInvoice.tripId.status && (
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-500">Trip Status</label>
                                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${selectedInvoice.tripId.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            selectedInvoice.tripId.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {selectedInvoice.tripId.status.charAt(0).toUpperCase() + selectedInvoice.tripId.status.slice(1)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {selectedInvoice.tripId.truck && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Truck</label>
                                                    <p className="text-sm">
                                                        {selectedInvoice.tripId.truck.plateNumber || selectedInvoice.tripId.truck.licensePlate || selectedInvoice.tripId.truck.unitNumber || selectedInvoice.tripId.truck.internalId || 'N/A'}
                                                        {(() => {
                                                            const makeModel = selectedInvoice.tripId.truck.make && selectedInvoice.tripId.truck.model
                                                                ? `${selectedInvoice.tripId.truck.make} ${selectedInvoice.tripId.truck.model}`
                                                                : (selectedInvoice.tripId.truck.makeModel || '');
                                                            return makeModel ? ` - ${makeModel}` : '';
                                                        })()}
                                                        {(selectedInvoice.tripId.truck.type || selectedInvoice.tripId.truck.unitType) && ` (${selectedInvoice.tripId.truck.type || selectedInvoice.tripId.truck.unitType})`}
                                                    </p>
                                                </div>
                                            )}

                                            {selectedInvoice.tripId.trailer && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Trailer</label>
                                                    <p className="text-sm">
                                                        {selectedInvoice.tripId.trailer.plateNumber || selectedInvoice.tripId.trailer.licensePlate || selectedInvoice.tripId.trailer.unitNumber || 'N/A'}
                                                        {(() => {
                                                            const makeModel = selectedInvoice.tripId.trailer.make && selectedInvoice.tripId.trailer.model
                                                                ? `${selectedInvoice.tripId.trailer.make} ${selectedInvoice.tripId.trailer.model}`
                                                                : (selectedInvoice.tripId.trailer.makeModel || '');
                                                            return makeModel ? ` - ${makeModel}` : '';
                                                        })()}
                                                        {selectedInvoice.tripId.trailer.type && ` (${selectedInvoice.tripId.trailer.type})`}
                                                        {selectedInvoice.tripId.trailer.capacity && ` - ${selectedInvoice.tripId.trailer.capacity}`}
                                                    </p>
                                                </div>
                                            )}

                                            {selectedInvoice.tripId.startLocation?.place && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Pickup Location</label>
                                                    <p className="text-sm">{selectedInvoice.tripId.startLocation.place}</p>
                                                </div>
                                            )}

                                            {selectedInvoice.tripId.endLocation?.place && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Delivery Location</label>
                                                    <p className="text-sm">{selectedInvoice.tripId.endLocation.place}</p>
                                                </div>
                                            )}

                                            {selectedInvoice.tripId.route?.totalDistance && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500">Distance</label>
                                                    <p className="text-sm">
                                                        {selectedInvoice.tripId.route.totalDistance.toFixed(2)} km
                                                        ({(selectedInvoice.tripId.route.totalDistance * 0.621371).toFixed(2)} miles)
                                                    </p>
                                                </div>
                                            )}

                                            {selectedInvoice.tripId.orders && selectedInvoice.tripId.orders.length > 0 && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 mb-2 block">Orders ({selectedInvoice.tripId.orders.length})</label>
                                                    <div className="space-y-2">
                                                        {selectedInvoice.tripId.orders.map((order: any, index: number) => (
                                                            <div key={order._id || index} className="p-3 bg-gray-50 rounded-md">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="font-medium text-sm">{order.orderNumber || `Order ${index + 1}`}</span>
                                                                    {order.customerOrderNo && (
                                                                        <span className="text-xs text-gray-500">PO: {order.customerOrderNo}</span>
                                                                    )}
                                                                </div>
                                                                {order.commodity && (
                                                                    <p className="text-xs text-gray-600">Commodity: {order.commodity}</p>
                                                                )}
                                                                {order.weight && (
                                                                    <p className="text-xs text-gray-600">
                                                                        Weight: {order.weight} {order.weightUnit || 'lbs'}
                                                                    </p>
                                                                )}
                                                                {order.pickupLocation?.place && (
                                                                    <p className="text-xs text-gray-600">Pickup: {order.pickupLocation.place}</p>
                                                                )}
                                                                {order.deliveryLocation?.place && (
                                                                    <p className="text-xs text-gray-600">Delivery: {order.deliveryLocation.place}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {(selectedInvoice.tripId.plannedStartDate || selectedInvoice.tripId.actualStartDate) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {selectedInvoice.tripId.plannedStartDate && (
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-500">Planned Start Date</label>
                                                            <p className="text-sm">{formatDate(selectedInvoice.tripId.plannedStartDate)}</p>
                                                        </div>
                                                    )}
                                                    {selectedInvoice.tripId.actualStartDate && (
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-500">Actual Start Date</label>
                                                            <p className="text-sm">{formatDate(selectedInvoice.tripId.actualStartDate)}</p>
                                                        </div>
                                                    )}
                                                    {selectedInvoice.tripId.plannedEndDate && (
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-500">Planned End Date</label>
                                                            <p className="text-sm">{formatDate(selectedInvoice.tripId.plannedEndDate)}</p>
                                                        </div>
                                                    )}
                                                    {selectedInvoice.tripId.actualEndDate && (
                                                        <div>
                                                            <label className="text-sm font-medium text-gray-500">Actual End Date</label>
                                                            <p className="text-sm">{formatDate(selectedInvoice.tripId.actualEndDate)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedInvoice.tripId ? (
                                        <div>
                                            <p className="text-sm text-gray-500">Trip ID: {typeof selectedInvoice.tripId === 'string' ? selectedInvoice.tripId : String(selectedInvoice.tripId)}</p>
                                            <p className="text-xs text-gray-400 mt-1">Trip details not loaded. Please refresh the invoice.</p>
                                        </div>
                                    ) : selectedInvoice.notes && selectedInvoice.notes.includes('Auto-generated invoice for trip') ? (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500">Trip Number</label>
                                                <p className="text-sm font-medium">
                                                    {(() => {
                                                        const match = selectedInvoice.notes.match(/trip\s+([A-Z0-9]+)/i);
                                                        return match ? match[1] : 'N/A';
                                                    })()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 italic">
                                                    Trip details are not available. This invoice was auto-generated when the trip was completed.
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {selectedInvoice.notes}
                                                </p>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </details>
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
                // Calculate GST and PST amounts
                const subtotal = parseFloat(editForm.subtotal?.toString() || editForm.amount.toString()) || 0;
                const gstRate = editForm.gstRate || 0;
                const pstRate = editForm.pstRate || 0;
                const gstAmount = subtotal * (gstRate / 100);
                const pstAmount = subtotal * (pstRate / 100);
                const totalAmount = subtotal + gstAmount + pstAmount;

                const updateData = {
                    clientName: editForm.clientName,
                    clientEmail: editForm.clientEmail,
                    amount: totalAmount.toString(),
                    currency: editForm.currency,
                    status: editForm.status,
                    dueDate: editForm.dueDate,
                    paymentDate: editForm.paymentDate,
                    notes: editForm.notes,
                    subtotal: subtotal,
                    gst: gstAmount,
                    gstRate: gstRate,
                    pst: pstAmount,
                    pstRate: pstRate,
                    taxAmount: gstAmount + pstAmount
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editForm.gstRate || ''}
                                    onChange={(e) => handleInputChange('gstRate', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PST Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editForm.pstRate || ''}
                                    onChange={(e) => handleInputChange('pstRate', parseFloat(e.target.value) || 0)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
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
            clientAddress: '',
            clientPhone: '',
            tripId: '',
            orderId: '',
            amount: '',
            currency: 'USD',
            dueDate: '',
            notes: '',
            gstRate: '',
            pstRate: ''
        });

        const handleInputChange = (field: string, value: string) => {
            setNewInvoice(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleOrderSelect = (orderId: string) => {
            console.log('Selected order ID:', orderId);
            const selectedOrder = orders.find(order => order._id === orderId);
            console.log('Selected order data:', selectedOrder);

            if (selectedOrder) {
                const customer = selectedOrder.customer;

                const customerName = customer?.name || '';
                const customerEmail = customer?.email || '';
                // Get customer address from customer.address or customer.location.address
                const customerAddress = customer?.address || customer?.location?.address || '';
                const customerPhone = customer?.phone || '';

                console.log('Auto-filling customer details from order:', {
                    customerName,
                    customerEmail,
                    customerAddress,
                    customerPhone,
                    orderNumber: selectedOrder.orderNumber
                });

                setNewInvoice(prev => ({
                    ...prev,
                    tripId: orderId, // Keep tripId field name for backend compatibility
                    orderId: orderId, // Also set orderId
                    clientName: customerName,
                    clientEmail: customerEmail,
                    clientAddress: customerAddress,
                    clientPhone: customerPhone,
                }));
            } else {
                console.log('No order found with ID:', orderId);
                setNewInvoice(prev => ({
                    ...prev,
                    tripId: orderId, // Keep tripId field name for backend compatibility
                    orderId: orderId
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
                // Calculate GST and PST amounts
                const subtotal = parseFloat(newInvoice.amount) || 0;
                const gstRate = parseFloat(newInvoice.gstRate) || 0;
                const pstRate = parseFloat(newInvoice.pstRate) || 0;
                const gstAmount = subtotal * (gstRate / 100);
                const pstAmount = subtotal * (pstRate / 100);
                const totalAmount = subtotal + gstAmount + pstAmount;

                const invoiceData = {
                    ...newInvoice,
                    amount: totalAmount.toString(),
                    subtotal: subtotal,
                    gst: gstAmount,
                    gstRate: gstRate,
                    pst: pstAmount,
                    pstRate: pstRate,
                    taxAmount: gstAmount + pstAmount
                };

                const response = await createInvoice(invoiceData);
                if (response && response.success) {
                    showNotification('success', 'Invoice created successfully');
                    await fetchInvoices();
                    setActiveTab('list');
                    setNewInvoice({
                        clientName: '',
                        clientEmail: '',
                        clientAddress: '',
                        clientPhone: '',
                        tripId: '',
                        orderId: '',
                        amount: '',
                        currency: 'USD',
                        dueDate: '',
                        notes: '',
                        gstRate: '',
                        pstRate: ''
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
                                    Select Order (Optional)
                                </label>
                                <select
                                    value={newInvoice.tripId}
                                    onChange={(e) => handleOrderSelect(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    disabled={loading}
                                >
                                    <option value="">
                                        {loading ? "Loading orders..." : orders.length === 0 ? "No completed orders available" : "Select an order..."}
                                    </option>
                                    {orders.map((order) => {
                                        const orderId = order._id;
                                        const orderNumber = order.orderNumber || 'Unknown Order';
                                        const pickupLocation = order.pickupLocation?.place || order.pickupLocation?.placeId?.name || order.pickupLocation?.placeId?.currentLocation?.address || "N/A";
                                        const deliveryLocation = order.deliveryLocation?.place || order.deliveryLocation?.placeId?.name || order.deliveryLocation?.placeId?.currentLocation?.address || "N/A";
                                        const customer = order.customer;
                                        const customerName = customer?.name || '';
                                        const customerEmail = customer?.email || '';
                                        const customerOrderNo = order.customerOrderNo || '';

                                        return (
                                            <option key={orderId} value={orderId}>
                                                {orderNumber} {customerOrderNo && `(PO: ${customerOrderNo})`} - {pickupLocation} → {deliveryLocation}
                                                {customerName && ` (${customerName})`}
                                                {customerEmail && ` [${customerEmail}]`}
                                            </option>
                                        );
                                    })}
                                </select>

                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-500">
                                        Selecting an order will auto-fill customer details if available
                                        {orders.length > 0 && ` (${orders.length} completed orders available)`}
                                    </p>
                                    {newInvoice.tripId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewInvoice(prev => ({
                                                    ...prev,
                                                    tripId: '',
                                                    orderId: '',
                                                    clientName: '',
                                                    clientEmail: '',
                                                    clientAddress: '',
                                                    clientPhone: ''
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
                                        ⚠️ Selected order has no customer name - please fill manually
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
                                        <span className="text-xs text-green-600 ml-2">✓ Auto-filled from order</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={newInvoice.clientName}
                                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${newInvoice.tripId && newInvoice.clientName
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
                                        <span className="text-xs text-green-600 ml-2">✓ Auto-filled from order</span>
                                    )}
                                </label>
                                <input
                                    type="email"
                                    value={newInvoice.clientEmail}
                                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                                    className={`w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${newInvoice.tripId && newInvoice.clientEmail
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={newInvoice.gstRate}
                                    onChange={(e) => handleInputChange('gstRate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">PST Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={newInvoice.pstRate}
                                    onChange={(e) => handleInputChange('pstRate', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.00"
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
        <div className="min-h-screen p-6 bg-[#EDF8FF]" >
            <NotificationContainer />
            <DeleteConfirmationModal />
            <div className="w-full mx-auto">
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold" style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Invoice Management</h1>
                            <p className="mt-2 text-gray-600">Manage invoices, track payments, and monitor revenue</p>
                        </div>
                        {activeTab === 'list' && (
                            <div className="mt-4 sm:mt-0">
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className="px-4 py-2 rounded-lg transition-all flex items-center gap-2 hover:shadow-lg hover:scale-105 transform duration-200 !text-white"
                                    style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}
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