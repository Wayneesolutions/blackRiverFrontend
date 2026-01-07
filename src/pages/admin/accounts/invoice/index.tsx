import React, { useState, useEffect } from 'react';
import {
    FileText, Plus, Eye, Edit, Filter, Calendar, DollarSign, Users, TrendingUp,
    Trash2, X, CheckCircle, AlertCircle, Building2, Download
} from 'lucide-react';
import { createInvoice, listInvoices, updateInvoice, deleteInvoice, listTrips } from "../../../../axios/api/account.invoices";
import jsPDF from 'jspdf';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

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
    orderId?: {
        orderNumber: string;
        customerOrderNo?: string;
        pickupLocation?: { place?: string };
        deliveryLocation?: { place?: string };
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
    company?: CompanyInfo | string;
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
    orders?: Array<{
        _id: string;
        orderNumber: string;
        customerOrderNo?: string;
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
        customer?: {
            _id: string;
            name: string;
            email: string;
            phone?: string;
            address?: string;
            company?: string;
            location?: {
                address?: string;
                city?: string;
                state?: string;
                postalCode?: string;
            };
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
    route?: {
        totalDistance?: number;
    };
    plannedStartDate?: string;
    plannedEndDate?: string;
    actualStartDate?: string;
    actualEndDate?: string;
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

            // Get company info
            const company = typeof invoice.company === 'object' && invoice.company ? invoice.company : null;

            // Header with colored background
            doc.setFillColor(primaryR, primaryG, primaryB);
            doc.rect(0, 0, pageWidth, 50, 'F');

            // Company/Invoice Title
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text('INVOICE', pageWidth / 2, 25, { align: 'center' });



            // Reset text color
            doc.setTextColor(textR, textG, textB);

            // Company Details Section (Top Left)
            let yPos = 60;
            if (company) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(company.companyName || 'Company Name', margin, yPos);
                yPos += 7;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                if (company.address) {
                    const addressLines = doc.splitTextToSize(company.address, 80);
                    doc.text(addressLines, margin, yPos);
                    yPos += addressLines.length * 5;
                }
                if (company.contactPhone) {
                    doc.text(`Phone: ${company.contactPhone}`, margin, yPos);
                    yPos += 6;
                }
                if (company.contactEmail) {
                    doc.text(`Email: ${company.contactEmail}`, margin, yPos);
                    yPos += 6;
                }
                if (company.taxNumber) {
                    doc.text(`Tax Number: ${company.taxNumber}`, margin, yPos);
                    yPos += 6;
                }
                yPos += 5;
            }

            // Invoice Details Box (Top Right) - Properly positioned
            const boxX = pageWidth - margin - 90;
            const boxY = 60;
            const boxWidth = 90;
            const boxHeight = 55;

            doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
            doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 3, 3, 'F');

            doc.setFontSize(9);
            doc.setTextColor(107, 114, 128); // Gray-500
            doc.text('Invoice Number', boxX + 5, boxY + 8);
            doc.text('Invoice Date', boxX + 5, boxY + 18);
            doc.text('Due Date', boxX + 5, boxY + 28);
            doc.text('Status', boxX + 5, boxY + 38);

            doc.setFontSize(10);
            doc.setTextColor(textR, textG, textB);
            doc.setFont('helvetica', 'bold');
            doc.text(`#${invoice._id.slice(-8).toUpperCase()}`, boxX + 5, boxY + 15);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(invoice.invoiceDate), boxX + 5, boxY + 25);
            doc.text(formatDate(invoice.dueDate), boxX + 5, boxY + 35);

            // Status badge
            const statusR = invoice.status === 'paid' ? 34 : 251;
            const statusG = invoice.status === 'paid' ? 197 : 191;
            const statusB = invoice.status === 'paid' ? 94 : 36;
            doc.setFillColor(statusR, statusG, statusB);
            doc.roundedRect(boxX + 5, boxY + 40, 35, 6, 2, 2, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(invoice.status.toUpperCase(), boxX + 22.5, boxY + 44, { align: 'center' });
            doc.setTextColor(textR, textG, textB);

            // Company Details Section (Top Left) - Below header
            yPos = 60;
            if (company) {
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(company.companyName || 'Company Name', margin, yPos);
                yPos += 7;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                if (company.address) {
                    const addressLines = doc.splitTextToSize(company.address, 100);
                    doc.text(addressLines, margin, yPos);
                    yPos += addressLines.length * 5;
                }
                if (company.contactPhone) {
                    doc.text(`Phone: ${company.contactPhone}`, margin, yPos);
                    yPos += 6;
                }
                if (company.contactEmail) {
                    doc.text(`Email: ${company.contactEmail}`, margin, yPos);
                    yPos += 6;
                }
                if (company.taxNumber) {
                    doc.text(`Tax Number: ${company.taxNumber}`, margin, yPos);
                    yPos += 6;
                }
                yPos += 5;
            }

            // Bill To Section (Customer Details) - Below company, left side
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Bill To:', margin, yPos);
            yPos += 8;

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text(invoice.clientName, margin, yPos);
            yPos += 7;

            if (invoice.clientCompany) {
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128);
                doc.text(invoice.clientCompany, margin, yPos);
                doc.setTextColor(textR, textG, textB);
                yPos += 7;
            }

            if (invoice.clientAddress) {
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128);
                const addressLines = doc.splitTextToSize(invoice.clientAddress, 100);
                doc.text(addressLines, margin, yPos);
                yPos += addressLines.length * 5;
                doc.setTextColor(textR, textG, textB);
            }

            if (invoice.clientEmail) {
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128);
                doc.text(invoice.clientEmail, margin, yPos);
                doc.setTextColor(textR, textG, textB);
                yPos += 6;
            }

            if (invoice.clientPhone) {
                doc.setFontSize(10);
                doc.setTextColor(107, 114, 128);
                doc.text(`Phone: ${invoice.clientPhone}`, margin, yPos);
                doc.setTextColor(textR, textG, textB);
                yPos += 6;
            }

            yPos += 10;

            // Trip Information Section (if trip exists)
            const trip = typeof invoice.tripId === 'object' && invoice.tripId ? invoice.tripId : null;
            if (trip) {
                yPos += 10;
                doc.setDrawColor(229, 231, 235); // Gray-200
                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 12;

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Trip Information:', margin, yPos);
                yPos += 10;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                // Trip Number
                if (trip.tripNumber) {
                    doc.setTextColor(107, 114, 128); // Gray-500
                    doc.text('Trip Number:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    doc.text(trip.tripNumber, margin + 50, yPos);
                    yPos += 7;
                }

                // Vehicle Information (without internal IDs)
                if (trip.truck) {
                    doc.setTextColor(107, 114, 128);
                    doc.text('Truck:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    const plateNumber = trip.truck.plateNumber || trip.truck.licensePlate || trip.truck.unitNumber || 'N/A';
                    const makeModel = trip.truck.make && trip.truck.model
                        ? `${trip.truck.make} ${trip.truck.model}`
                        : (trip.truck.makeModel || '');
                    const vehicleType = trip.truck.type || trip.truck.unitType || '';
                    const vehicleInfo = [
                        plateNumber,
                        makeModel,
                        vehicleType ? `(${vehicleType})` : ''
                    ].filter(Boolean).join(' ');
                    doc.text(vehicleInfo || 'N/A', margin + 50, yPos);
                    yPos += 7;
                }

                // Trailer Type
                if (trip.trailer) {
                    doc.setTextColor(107, 114, 128);
                    doc.text('Trailer:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    const trailerTypeMap: { [key: string]: string } = {
                        'dry_van': 'Dry Van',
                        'refrigerated': 'Reefer',
                        'flatbed': 'Flatbed',
                        'tanker': 'Tanker',
                        'container': 'Container'
                    };
                    const trailerType = trip.trailer.type ? trailerTypeMap[trip.trailer.type] || trip.trailer.type : '';
                    const plateNumber = trip.trailer.plateNumber || trip.trailer.licensePlate || trip.trailer.unitNumber || 'N/A';
                    const trailerInfo = [
                        plateNumber,
                        trailerType,
                        trip.trailer.capacity ? `(${trip.trailer.capacity})` : ''
                    ].filter(Boolean).join(' ');
                    doc.text(trailerInfo || 'N/A', margin + 50, yPos);
                    yPos += 7;
                }

                // Origin and Destination
                if (trip.startLocation && trip.startLocation.place) {
                    doc.setTextColor(107, 114, 128);
                    doc.text('Origin:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    doc.text(trip.startLocation.place, margin + 50, yPos);
                    yPos += 7;
                }

                if (trip.endLocation && trip.endLocation.place) {
                    doc.setTextColor(107, 114, 128);
                    doc.text('Destination:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    doc.text(trip.endLocation.place, margin + 50, yPos);
                    yPos += 7;
                }

                // Distance (Miles covered)
                if (trip.route && trip.route.totalDistance) {
                    doc.setTextColor(107, 114, 128);
                    doc.text('Miles Covered:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    const distanceKm = trip.route.totalDistance.toFixed(2);
                    const distanceMiles = (trip.route.totalDistance * 0.621371).toFixed(2);
                    doc.text(`${distanceMiles} miles (${distanceKm} km)`, margin + 50, yPos);
                    yPos += 7;
                }

                // Load Details Section
                if (trip.orders && trip.orders.length > 0) {
                    yPos += 3;
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(textR, textG, textB);
                    doc.text('Load Details:', margin, yPos);
                    yPos += 8;
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');

                    // Calculate total weight
                    let totalWeight = 0;
                    const weightUnits: string[] = [];
                    const commodities: string[] = [];
                    const orderTypes: string[] = [];
                    const equipmentList: string[] = [];
                    let hasTemperature = false;
                    let temperatureValue: number | null = null;
                    const specialFlags: string[] = [];

                    trip.orders.forEach((order: any) => {
                        if (order.weight) {
                            totalWeight += order.weight;
                            if (order.weightUnit && !weightUnits.includes(order.weightUnit)) {
                                weightUnits.push(order.weightUnit);
                            }
                        }
                        if (order.commodity && !commodities.includes(order.commodity)) {
                            commodities.push(order.commodity);
                        }
                        if (order.orderType && !orderTypes.includes(order.orderType)) {
                            orderTypes.push(order.orderType);
                        }
                        if (order.equipment && Array.isArray(order.equipment)) {
                            order.equipment.forEach((eq: string) => {
                                if (!equipmentList.includes(eq)) {
                                    equipmentList.push(eq);
                                }
                            });
                        }
                        if (order.temperature !== null && order.temperature !== undefined) {
                            hasTemperature = true;
                            temperatureValue = order.temperature;
                        }
                        if (order.additionalInfo) {
                            if (order.additionalInfo.HAZMAT) specialFlags.push('HAZMAT');
                            if (order.additionalInfo.TARP) specialFlags.push('TARP');
                            if (order.additionalInfo.OverDimension) specialFlags.push('Over Dimension');
                            if (order.additionalInfo.CSA) specialFlags.push('CSA');
                        }
                    });

                    // Product/Load Type
                    if (commodities.length > 0) {
                        doc.setTextColor(107, 114, 128);
                        doc.text('Product/Load Type:', margin, yPos);
                        doc.setTextColor(textR, textG, textB);
                        doc.text(commodities.join(', '), margin + 50, yPos);
                        yPos += 7;
                    }

                    // Order Type
                    if (orderTypes.length > 0) {
                        doc.setTextColor(107, 114, 128);
                        doc.text('Order Type:', margin, yPos);
                        doc.setTextColor(textR, textG, textB);
                        doc.text(orderTypes.join(', '), margin + 50, yPos);
                        yPos += 7;
                    }

                    // Total Load Weight
                    if (totalWeight > 0) {
                        doc.setTextColor(107, 114, 128);
                        doc.text('Total Load Weight:', margin, yPos);
                        doc.setTextColor(textR, textG, textB);
                        const weightUnit = weightUnits.length > 0 ? weightUnits[0] : 'kg';
                        doc.text(`${totalWeight.toFixed(2)} ${weightUnit}`, margin + 50, yPos);
                        yPos += 7;
                    }

                    // Equipment
                    if (equipmentList.length > 0) {
                        doc.setTextColor(107, 114, 128);
                        doc.text('Equipment:', margin, yPos);
                        doc.setTextColor(textR, textG, textB);
                        doc.text(equipmentList.join(', '), margin + 50, yPos);
                        yPos += 7;
                    }

                    // Temperature (for refrigerated loads)
                    if (hasTemperature && temperatureValue !== null) {
                        doc.setTextColor(107, 114, 128);
                        doc.text('Temperature:', margin, yPos);
                        doc.setTextColor(textR, textG, textB);
                        doc.text(`${temperatureValue}°C`, margin + 50, yPos);
                        yPos += 7;
                    }

                    // Special Flags
                    if (specialFlags.length > 0) {
                        doc.setTextColor(107, 114, 128);
                        doc.text('Special Requirements:', margin, yPos);
                        doc.setTextColor(textR, textG, textB);
                        doc.text(specialFlags.join(', '), margin + 50, yPos);
                        yPos += 7;
                    }

                    yPos += 3;
                }

                // Trip Dates
                if (trip.actualStartDate) {
                    doc.setTextColor(107, 114, 128);
                    doc.text('Start Date:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    doc.text(formatDate(trip.actualStartDate), margin + 50, yPos);
                    yPos += 7;
                }

                if (trip.actualEndDate) {
                    doc.setTextColor(107, 114, 128);
                    doc.text('End Date:', margin, yPos);
                    doc.setTextColor(textR, textG, textB);
                    doc.text(formatDate(trip.actualEndDate), margin + 50, yPos);
                    yPos += 7;
                }

                // Orders Information (without internal IDs) - Show after load details
                if (trip.orders && trip.orders.length > 0) {
                    yPos += 3;
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(textR, textG, textB);
                    doc.text('Orders:', margin, yPos);
                    yPos += 7;
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    trip.orders.forEach((order: any, index: number) => {
                        if (yPos > pageHeight - 60) {
                            doc.addPage();
                            yPos = margin + 20;
                        }
                        doc.setTextColor(textR, textG, textB);
                        // Only show customer order number and customer name, not internal order number
                        const orderInfo = [
                            order.customerOrderNo || `Order ${index + 1}`,
                            order.customer?.name ? `- ${order.customer.name}` : ''
                        ].filter(Boolean).join(' ');
                        doc.text(`  ${index + 1}. ${orderInfo}`, margin + 5, yPos);
                        yPos += 6;
                    });
                }

                yPos += 5;
            }

            // Line separator
            yPos += 5;
            doc.setDrawColor(229, 231, 235); // Gray-200
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 15;

            // Service Breakdown Section
            doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
            doc.roundedRect(margin, yPos, contentWidth, 8, 2, 2, 'F');

            // Column positions - properly spaced to avoid overlap
            // Page width is typically 210mm, margin is 20mm
            // Column layout with generous spacing:
            // Description (25-80mm, 55mm max width) | Qty (90mm) | Unit Price (right 140mm) | Amount (right 170mm) | Tax (right 185mm)
            const colDesc = margin + 5; // Description column start (25mm)
            const colQty = margin + 85; // Quantity column start (105mm) - ensures Description ends at ~80mm with 5mm gap
            const colUnitPrice = pageWidth - margin - 50; // Unit Price column end (140mm) - right-aligned, ensures gap after Qty
            const colAmount = pageWidth - margin - 20; // Amount column end (170mm) - right-aligned, ensures gap after Unit Price
            const colTax = pageWidth - margin - 5; // Tax column end (185mm) - right-aligned

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Description', colDesc, yPos + 6);
            doc.text('Qty', colQty, yPos + 6);
            doc.text('Unit Price', colUnitPrice, yPos + 6, { align: 'right' });
            doc.text('Amount', colAmount, yPos + 6, { align: 'right' });
            doc.text('Tax', colTax, yPos + 6, { align: 'right' });

            yPos += 15;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);

            // Calculate totals
            let subtotal = 0;
            let totalTax = 0;

            if (invoice.serviceBreakdown && invoice.serviceBreakdown.length > 0) {
                // Use service breakdown
                invoice.serviceBreakdown.forEach((item) => {
                    if (yPos > pageHeight - 60) {
                        doc.addPage();
                        yPos = margin + 20;
                    }
                    const itemAmount = item.amount || (item.unitPrice * (item.quantity || 1));
                    const itemTax = item.taxAmount || (itemAmount * ((item.taxRate || 0) / 100));
                    subtotal += itemAmount;
                    totalTax += itemTax;

                    // Limit description width to prevent overflow into Qty column
                    const maxDescWidth = colQty - colDesc - 5; // Leave 5mm gap before Qty column
                    doc.text(item.description || 'Service', colDesc, yPos, { maxWidth: maxDescWidth });
                    doc.text((item.quantity || 1).toString(), colQty, yPos);
                    doc.text(`${invoice.currency} ${(item.unitPrice || 0).toFixed(2)}`, colUnitPrice, yPos, { align: 'right' });
                    doc.text(`${invoice.currency} ${itemAmount.toFixed(2)}`, colAmount, yPos, { align: 'right' });
                    doc.text(`${invoice.currency} ${itemTax.toFixed(2)}`, colTax, yPos, { align: 'right' });
                    yPos += 7;
                });
            } else {
                // Fallback to single line item
                const amount = parseFloat(invoice.amount.toString());
                subtotal = invoice.subtotal || amount;
                totalTax = invoice.taxAmount || 0;

                // Limit description width to prevent overflow into Qty column
                const maxDescWidth = colQty - colDesc - 5; // Leave 5mm gap before Qty column
                doc.text('Freight Services', colDesc, yPos, { maxWidth: maxDescWidth });
                doc.text('1', colQty, yPos);
                doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, colUnitPrice, yPos, { align: 'right' });
                doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, colAmount, yPos, { align: 'right' });
                doc.text(`${invoice.currency} ${totalTax.toFixed(2)}`, colTax, yPos, { align: 'right' });
                yPos += 7;
            }

            // Subtotal and Tax Section
            yPos += 5;
            doc.setDrawColor(209, 213, 219); // Gray-300
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Subtotal:', colAmount, yPos, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.text(`${invoice.currency} ${subtotal.toFixed(2)}`, colTax, yPos, { align: 'right' });
            yPos += 7;

            if (totalTax > 0) {
                doc.setFont('helvetica', 'bold');
                const taxLabel = invoice.taxNumber
                    ? `Tax (${invoice.taxNumber}):`
                    : (company && company.taxNumber ? `Tax (${company.taxNumber}):` : 'Tax (GST/HST):');
                doc.text(taxLabel, colAmount, yPos, { align: 'right' });
                doc.setFont('helvetica', 'normal');
                doc.text(`${invoice.currency} ${totalTax.toFixed(2)}`, colTax, yPos, { align: 'right' });
                yPos += 7;
            }

            // Total Section
            yPos += 5;
            doc.setDrawColor(209, 213, 219); // Gray-300
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;

            const totalAmount = subtotal + totalTax;
            doc.setFillColor(secondaryR, secondaryG, secondaryB);
            doc.roundedRect(margin, yPos, contentWidth, 20, 3, 3, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Total Amount Due', margin + 10, yPos + 8);
            doc.setFontSize(18);
            doc.text(`${invoice.currency} ${totalAmount.toFixed(2)}`, pageWidth - margin - 10, yPos + 15, { align: 'right' });
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
                            </div>
                        </div>
                    </div>

                    {selectedInvoice.notes && (
                        <div className="mt-6">
                            <label className="text-sm font-medium text-gray-500">Notes</label>
                            <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{selectedInvoice.notes}</p>
                        </div>
                    )}

                    {/* Trip/Load/Order Details Section */}
                    {(selectedInvoice.tripId || selectedInvoice.orderId || (selectedInvoice.notes && selectedInvoice.notes.includes('Auto-generated'))) && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {selectedInvoice.orderId ? 'Order Details' : 'Trip/Load Details'}
                            </h3>
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
                // Get customer address from customer.address or customer.location.address
                const customerAddress = customer?.address || customer?.location?.address || '';
                const customerPhone = customer?.phone || '';

                console.log('Auto-filling customer details from trip:', {
                    customerName,
                    customerEmail,
                    customerAddress,
                    customerPhone,
                    tripNumber: selectedTrip.tripNumber
                });

                setNewInvoice(prev => ({
                    ...prev,
                    tripId: tripId,
                    clientName: customerName,
                    clientEmail: customerEmail,
                    clientAddress: customerAddress,
                    clientPhone: customerPhone,
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
                        clientAddress: '',
                        clientPhone: '',
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
                                        <span className="text-xs text-green-600 ml-2">✓ Auto-filled from trip</span>
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