import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Copy,
  Search,
  MoreHorizontal,
  ExternalLink,
  Receipt,
} from 'lucide-react';
import { Modal, Button, message, Input, Select, Tag } from 'antd';
import { getSuperAdminInvoices, getSuperAdminSettings } from '../../../axios/api/superadmin';
import jsPDF from 'jspdf';
import Logo from '../../../assets/FleetGo.png';

interface Invoice {
  _id: string;
  company?: {
    _id: string;
    companyName: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  admin?: {
    _id: string;
    name: string;
    email: string;
    internalId?: string;
  };
  subscriptionPlan?: {
    _id: string;
    planName: string;
  };
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  invoiceNumber: string;
  currency: string;
  amount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;
  transactionId?: string;
  subscriptionStartDate: string;
  subscriptionEndDate: string;
  invoiceStatus: 'generated' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown && dropdownRefs.current[activeDropdown]) {
        const dropdownElement = dropdownRefs.current[activeDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveDropdown(null);
        }
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeDropdown) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [activeDropdown]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSuperAdminInvoices();
      
      console.log('Invoices API Response:', response);
      
      if (response?.success && response?.data) {
        setInvoices(response.data);
      } else {
        setError(response?.message || 'Failed to load invoices');
      }
    } catch (err: any) {
      console.error('Invoices fetch error:', err);
      setError(err?.message || 'An error occurred while fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'CAD') => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-primary';
      default: return 'bg-gray-100 text-primary';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'refunded': return <AlertCircle className="w-4 h-4 text-secondary" />;
      default: return <Clock className="w-4 h-4 text-secondary" />;
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    message.success('ID copied to clipboard');
  };

  const handleCopyInvoiceNumber = (invoiceNumber: string) => {
    navigator.clipboard.writeText(invoiceNumber);
    message.success('Invoice number copied to clipboard');
  };

  const handleExport = async (invoice: Invoice) => {
    try {
      // Fetch superadmin settings for company information
      let companyInfo: any = null;
      try {
        const settingsResponse = await getSuperAdminSettings();
        if (settingsResponse?.success && settingsResponse?.data) {
          companyInfo = settingsResponse.data;
        }
      } catch (err) {
        console.log('Could not fetch superadmin settings, using defaults');
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Color scheme
      const textR = 31, textG = 41, textB = 55; // Gray-800
      const lightGrayR = 243, lightGrayG = 244, lightGrayB = 246; // Gray-100
      const grayR = 107, grayG = 114, grayB = 128; // Gray-500
      const greenR = 34, greenG = 197, greenB = 94; // Green-500

      let yPos = margin;

      // Add Logo (top left)
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = Logo;
        await new Promise<void>((resolve) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                const imgData = canvas.toDataURL('image/png');
                const logoWidth = 50;
                const logoHeight = (img.height / img.width) * logoWidth;
                doc.addImage(imgData, 'PNG', margin, yPos, logoWidth, logoHeight);
              }
            } catch (e) {
              console.log('Could not add logo to PDF');
            }
            resolve();
          };
          img.onerror = () => resolve();
          setTimeout(() => resolve(), 2000);
        });
      } catch (err) {
        console.log('Could not load logo');
      }

      // Invoice Title (top right)
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textR, textG, textB);
      doc.text('SUBSCRIPTION INVOICE', pageWidth - margin, yPos + 15, { align: 'right' });

      yPos += 25; // Space after logo/title

      // Logistiq Company Information (Left side)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(companyInfo?.name || 'Logistiq', margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayR, grayG, grayB);
      if (companyInfo?.address) {
        const addressLines = doc.splitTextToSize(companyInfo.address, 70);
        doc.text(addressLines, margin, yPos);
        yPos += addressLines.length * 4;
      }
      if (companyInfo?.phone) {
        doc.text(`Phone: ${companyInfo.phone}`, margin, yPos);
        yPos += 4;
      }
      if (companyInfo?.email) {
        doc.text(`Email: ${companyInfo.email}`, margin, yPos);
        yPos += 4;
      }
      if (companyInfo?.taxNumber) {
        doc.text(`GST/HST: ${companyInfo.taxNumber}`, margin, yPos);
        yPos += 4;
      }
      doc.setTextColor(textR, textG, textB);

      // Invoice Details Box (Right side)
      const boxX = pageWidth - margin - 75;
      const boxY = margin + 25;
      const boxWidth = 75;
      const boxHeight = 45;

      doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
      doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'F');

      doc.setFontSize(8);
      doc.setTextColor(grayR, grayG, grayB);
      doc.text('Invoice Number', boxX + 4, boxY + 6);
      doc.text('Invoice Date', boxX + 4, boxY + 16);
      doc.text('Status', boxX + 4, boxY + 26);

      doc.setFontSize(9);
      doc.setTextColor(textR, textG, textB);
      doc.setFont('helvetica', 'bold');
      const invoiceNum = invoice.invoiceNumber.length > 18 
        ? invoice.invoiceNumber.substring(0, 15) + '...' 
        : invoice.invoiceNumber;
      doc.text(invoiceNum, boxX + 4, boxY + 13);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), boxX + 4, boxY + 23);

      // Payment Status badge
      const statusR = invoice.paymentStatus === 'paid' ? greenR : 251;
      const statusG = invoice.paymentStatus === 'paid' ? greenG : 191;
      const statusB = invoice.paymentStatus === 'paid' ? greenB : 36;
      doc.setFillColor(statusR, statusG, statusB);
      doc.roundedRect(boxX + 4, boxY + 28, 30, 5, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(invoice.paymentStatus.toUpperCase(), boxX + 19, boxY + 31, { align: 'center' });
      doc.setTextColor(textR, textG, textB);

      yPos = Math.max(yPos, boxY + boxHeight + 15);

      // Bill To Section (Customer Details)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', margin, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.admin?.name || 'N/A', margin, yPos);
      yPos += 6;

      if (invoice.admin?.email) {
        doc.setFontSize(9);
        doc.setTextColor(grayR, grayG, grayB);
        doc.text(invoice.admin.email, margin, yPos);
        doc.setTextColor(textR, textG, textB);
        yPos += 5;
      }

      if (invoice.company?.companyName) {
        doc.setFontSize(9);
        doc.setTextColor(grayR, grayG, grayB);
        doc.text(invoice.company.companyName, margin, yPos);
        doc.setTextColor(textR, textG, textB);
        yPos += 5;
      }

      yPos += 15; // Spacing before subscription info

      // Subscription Information Section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Subscription Information:', margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Plan Name
      doc.setTextColor(grayR, grayG, grayB);
      doc.text('Plan Name:', margin, yPos);
      doc.setTextColor(textR, textG, textB);
      doc.text(invoice.planName, margin + 45, yPos);
      yPos += 6;

      // Billing Cycle
      doc.setTextColor(grayR, grayG, grayB);
      doc.text('Billing Cycle:', margin, yPos);
      doc.setTextColor(textR, textG, textB);
      doc.text(invoice.billingCycle.charAt(0).toUpperCase() + invoice.billingCycle.slice(1), margin + 45, yPos);
      yPos += 6;

      // Subscription Period
      doc.setTextColor(grayR, grayG, grayB);
      doc.text('Subscription Period:', margin, yPos);
      doc.setTextColor(textR, textG, textB);
      const startDate = new Date(invoice.subscriptionStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const endDate = new Date(invoice.subscriptionEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.text(`${startDate} - ${endDate}`, margin + 45, yPos);
      yPos += 15; // Spacing before payment details

      // Payment Details Section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Details:', margin, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Payment Method
      if (invoice.paymentMethod) {
        doc.setTextColor(grayR, grayG, grayB);
        doc.text('Payment Method:', margin, yPos);
        doc.setTextColor(textR, textG, textB);
        doc.text(invoice.paymentMethod, margin + 45, yPos);
        yPos += 6;
      }

      // Transaction ID
      if (invoice.transactionId) {
        doc.setTextColor(grayR, grayG, grayB);
        doc.text('Transaction ID:', margin, yPos);
        doc.setTextColor(textR, textG, textB);
        const transId = invoice.transactionId.length > 35 
          ? invoice.transactionId.substring(0, 32) + '...' 
          : invoice.transactionId;
        doc.text(transId, margin + 45, yPos);
        yPos += 6;
      }

      yPos += 15; // Spacing before summary table

      // Invoice Items/Summary Table
      // Table Header
      doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
      doc.rect(margin, yPos, contentWidth, 7, 'F');
      yPos += 5;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', margin + 3, yPos);
      doc.text('Amount', pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += 8;

      // Subscription Item
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${invoice.planName} - ${invoice.billingCycle} subscription`, margin + 3, yPos);
      doc.text(formatCurrency(invoice.amount, invoice.currency), pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += 8;

      // Calculate GST (5%) and PST (7%) from subtotal
      const subtotal = invoice.amount - (invoice.discountAmount || 0);
      const gstRate = 0.05; // 5% GST
      const pstRate = 0.07; // 7% PST
      const gstAmount = subtotal * gstRate;
      const pstAmount = subtotal * pstRate;

      // Use invoice taxAmount if available, otherwise calculate

      const gst = invoice.taxAmount > 0 ? (invoice.taxAmount * (gstRate / (gstRate + pstRate))) : gstAmount;
      const pst = invoice.taxAmount > 0 ? (invoice.taxAmount * (pstRate / (gstRate + pstRate))) : pstAmount;

      // GST
      doc.setTextColor(grayR, grayG, grayB);
      doc.text('GST (5%)', margin + 3, yPos);
      doc.setTextColor(textR, textG, textB);
      doc.text(formatCurrency(gst, invoice.currency), pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += 8;

      // PST
      doc.setTextColor(grayR, grayG, grayB);
      doc.text('PST (7%)', margin + 3, yPos);
      doc.setTextColor(textR, textG, textB);
      doc.text(formatCurrency(pst, invoice.currency), pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += 8;

      // Discount (if exists)
      if (invoice.discountAmount > 0) {
        doc.setTextColor(grayR, grayG, grayB);
        doc.text('Discount', margin + 3, yPos);
        doc.setTextColor(greenR, greenG, greenB);
        doc.text(`-${formatCurrency(invoice.discountAmount, invoice.currency)}`, pageWidth - margin - 3, yPos, { align: 'right' });
        doc.setTextColor(textR, textG, textB);
        yPos += 8;
      }

      yPos += 5;

      // Total
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Amount:', margin + 3, yPos);
      doc.text(formatCurrency(invoice.totalAmount, invoice.currency), pageWidth - margin - 3, yPos, { align: 'right' });

      // Notes Section (if exists)
      if (invoice.notes) {
        yPos += 20;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(grayR, grayG, grayB);
        const notesLines = doc.splitTextToSize(invoice.notes, contentWidth);
        doc.text(notesLines, margin, yPos);
      }

      // Footer - Thank you message (bottom of page with proper spacing)
      const footerY = pageHeight - 25;
      doc.setFontSize(9);
      doc.setTextColor(grayR, grayG, grayB);
      doc.setFont('helvetica', 'italic');
      doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      const fileName = `Invoice_${invoice.invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      message.success('Invoice exported successfully');
    } catch (error: any) {
      console.error('Error exporting invoice:', error);
      message.error('Failed to export invoice. Please try again.');
    }
  };

  const handleMoreActions = (invoiceId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveDropdown(activeDropdown === invoiceId ? null : invoiceId);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        invoice.admin?.name?.toLowerCase().includes(searchLower) ||
        invoice.admin?.email?.toLowerCase().includes(searchLower) ||
        invoice.company?.companyName?.toLowerCase().includes(searchLower) ||
        invoice.planName.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Payment status filter
    if (paymentStatusFilter !== 'all' && invoice.paymentStatus !== paymentStatusFilter) {
      return false;
    }

    // Invoice status filter
    if (invoiceStatusFilter !== 'all' && invoice.invoiceStatus !== invoiceStatusFilter) {
      return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.paymentStatus === 'paid').length,
    pending: invoices.filter(i => i.paymentStatus === 'pending').length,
    failed: invoices.filter(i => i.paymentStatus === 'failed').length,
    totalAmount: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
    paidAmount: invoices.filter(i => i.paymentStatus === 'paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A855F7] mb-4">{error}</p>
          <button
            onClick={fetchInvoices}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <div className="bg-card border-b border-theme px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary flex items-center">
              <Receipt className="w-8 h-8 text-purple-600 mr-3" />
              Subscription Invoices
            </h1>
            <p className="text-secondary mt-1">View and manage all subscription invoices</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-card rounded-xl shadow-sm border border-theme p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary mb-1">Total Invoices</p>
                <p className="text-2xl font-bold text-primary">{stats.total}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-theme p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary mb-1">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-theme p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary mb-1">Pending Invoices</p>
                <p className="text-2xl font-bold text-[#00FFA3]">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-[#00FFA3]" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-theme p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(stats.totalAmount)}
                </p>
                <p className="text-xs text-secondary mt-1">
                  Paid: {formatCurrency(stats.paidAmount)}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-[#00D1FF]" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl shadow-sm border border-theme p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
              <Input
                placeholder="Search by invoice number, admin name, company, or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                size="large"
              />
            </div>
            <Select
              value={paymentStatusFilter}
              onChange={setPaymentStatusFilter}
              className="w-48"
              size="large"
              placeholder="Payment Status"
            >
              <Select.Option value="all">All Payment Status</Select.Option>
              <Select.Option value="paid">Paid</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="failed">Failed</Select.Option>
              <Select.Option value="refunded">Refunded</Select.Option>
            </Select>
            <Select
              value={invoiceStatusFilter}
              onChange={setInvoiceStatusFilter}
              className="w-48"
              size="large"
              placeholder="Invoice Status"
            >
              <Select.Option value="all">All Invoice Status</Select.Option>
              <Select.Option value="generated">Generated</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
            </Select>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-card rounded-xl shadow-sm border border-theme overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-card border-b border-theme">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Subscription Period
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-theme">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <FileText className="w-12 h-12 text-secondary mx-auto mb-4" />
                      <p className="text-secondary font-medium">No invoices found</p>
                      <p className="text-secondary text-sm mt-1">
                        {searchTerm || paymentStatusFilter !== 'all' || invoiceStatusFilter !== 'all'
                          ? 'Try adjusting your filters'
                          : 'No invoices have been generated yet'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-[rgba(255,255,255,0.03)]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="bg-purple-100 p-2 rounded-lg mr-3">
                            <Receipt className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-primary">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-xs text-secondary">
                              {invoice.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <Building2 className="w-5 h-5 text-[#00D1FF]" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-primary">
                              {invoice.admin?.name || 'N/A'}
                            </div>
                            {invoice.company?.companyName && (
                              <div className="text-xs text-secondary">
                                {invoice.company.companyName}
                              </div>
                            )}
                            {invoice.admin?.email && (
                              <div className="text-xs text-secondary">
                                {invoice.admin.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-primary">
                          {invoice.planName}
                        </div>
                        {invoice.subscriptionPlan && (
                          <div className="text-xs text-secondary">
                            Plan ID: {invoice.subscriptionPlan._id.slice(-8)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-primary">
                          {formatCurrency(invoice.totalAmount, invoice.currency)}
                        </div>
                        {invoice.taxAmount > 0 && (
                          <div className="text-xs text-secondary">
                            Tax: {formatCurrency(invoice.taxAmount, invoice.currency)}
                          </div>
                        )}
                        {invoice.discountAmount > 0 && (
                          <div className="text-xs text-green-600">
                            Discount: -{formatCurrency(invoice.discountAmount, invoice.currency)}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPaymentStatusIcon(invoice.paymentStatus)}
                          <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                            {invoice.paymentStatus.charAt(0).toUpperCase() + invoice.paymentStatus.slice(1)}
                          </span>
                        </div>
                        {invoice.paymentMethod && (
                          <div className="text-xs text-secondary mt-1">
                            {invoice.paymentMethod}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary">
                          {new Date(invoice.subscriptionStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-secondary">
                          to {new Date(invoice.subscriptionEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-primary">
                          {new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-secondary">
                          {new Date(invoice.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(invoice)}
                            className="text-secondary hover:text-purple-600 p-1 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <div className="relative" ref={(el) => { dropdownRefs.current[invoice._id] = el; }}>
                            <button
                              onClick={(e) => handleMoreActions(invoice._id, e)}
                              className="text-secondary hover:text-secondary p-1 rounded transition-colors"
                              title="More Actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {activeDropdown === invoice._id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[9998]" 
                                  onClick={() => setActiveDropdown(null)}
                                />
                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-card rounded-lg shadow-xl border border-theme z-[9999] py-1 overflow-hidden">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyInvoiceNumber(invoice.invoiceNumber);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-[rgba(255,255,255,0.03)] flex items-center space-x-2 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Invoice #</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyId(invoice._id);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-[rgba(255,255,255,0.03)] flex items-center space-x-2 transition-colors"
                                  >
                                    <Copy className="w-4 h-4" />
                                    <span>Copy Invoice ID</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExport(invoice);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-[rgba(255,255,255,0.03)] flex items-center space-x-2 transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>Export Invoice</span>
                                  </button>
                                  {invoice.admin?._id && (
                                    <>
                                      <div className="border-t border-theme my-1"></div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveDropdown(null);
                                          navigate('/superadmin/viewalladmins');
                                          setTimeout(() => {
                                            message.info({
                                              content: `Navigate to Admin Accounts page. Search for admin ID: ${invoice.admin?._id}`,
                                              duration: 5,
                                            });
                                          }, 300);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-[rgba(255,255,255,0.03)] flex items-center space-x-2 transition-colors"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        <span>View Admin Profile</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary */}
        {filteredInvoices.length > 0 && (
          <div className="mt-4 text-sm text-secondary">
            Showing <span className="font-medium">{filteredInvoices.length}</span> of{' '}
            <span className="font-medium">{invoices.length}</span> invoices
          </div>
        )}
      </div>

      {/* View Invoice Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-purple-600" />
            <span>Invoice Details</span>
          </div>
        }
        open={showViewModal}
        onCancel={() => {
          setShowViewModal(false);
          setSelectedInvoice(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setShowViewModal(false);
            setSelectedInvoice(null);
          }}>
            Close
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={() => {
              if (selectedInvoice) handleExport(selectedInvoice);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Export
          </Button>
        ]}
        width={800}
      >
        {selectedInvoice && (
          <div className="space-y-6 py-4">
            {/* Invoice Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-primary">{selectedInvoice.invoiceNumber}</h3>
                  <p className="text-sm text-secondary">Invoice ID: {selectedInvoice._id}</p>
                </div>
                <div className="text-right">
                  <Tag color={selectedInvoice.paymentStatus === 'paid' ? 'success' : selectedInvoice.paymentStatus === 'pending' ? 'warning' : 'error'}>
                    {selectedInvoice.paymentStatus.charAt(0).toUpperCase() + selectedInvoice.paymentStatus.slice(1)}
                  </Tag>
                  <Tag color={selectedInvoice.invoiceStatus === 'generated' ? 'blue' : 'red'} className="mt-2">
                    {selectedInvoice.invoiceStatus.charAt(0).toUpperCase() + selectedInvoice.invoiceStatus.slice(1)}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-theme">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Customer Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary mb-1">Admin Name</p>
                  <p className="text-sm font-medium text-primary">{selectedInvoice.admin?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Admin Email</p>
                  <p className="text-sm font-medium text-primary">{selectedInvoice.admin?.email || 'N/A'}</p>
                </div>
                {selectedInvoice.company?.companyName && (
                  <div className="col-span-2">
                    <p className="text-xs text-secondary mb-1">Company Name</p>
                    <p className="text-sm font-medium text-primary">{selectedInvoice.company.companyName}</p>
                  </div>
                )}
                {selectedInvoice.admin?.internalId && (
                  <div>
                    <p className="text-xs text-secondary mb-1">Admin ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-primary">{selectedInvoice.admin.internalId}</p>
                      <button
                        onClick={() => handleCopyId(selectedInvoice.admin!._id)}
                        className="text-secondary hover:text-secondary"
                        title="Copy ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Information */}
            <div className="bg-card rounded-lg p-4 border border-theme">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Plan Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary mb-1">Plan Name</p>
                  <p className="text-sm font-medium text-primary">{selectedInvoice.planName}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Billing Cycle</p>
                  <p className="text-sm font-medium text-primary capitalize">{selectedInvoice.billingCycle}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Subscription Start</p>
                  <p className="text-sm font-medium text-primary">
                    {new Date(selectedInvoice.subscriptionStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Subscription End</p>
                  <p className="text-sm font-medium text-primary">
                    {new Date(selectedInvoice.subscriptionEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Payment Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary">Subtotal</span>
                  <span className="text-sm font-medium text-primary">
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </span>
                </div>
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary">Tax</span>
                    <span className="text-sm font-medium text-primary">
                      {formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}
                    </span>
                  </div>
                )}
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary">Discount</span>
                    <span className="text-sm font-medium text-green-600">
                      -{formatCurrency(selectedInvoice.discountAmount, selectedInvoice.currency)}
                    </span>
                  </div>
                )}
                <div className="border-t border-green-200 pt-3 flex justify-between items-center">
                  <span className="text-base font-semibold text-primary">Total Amount</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                  </span>
                </div>
                {selectedInvoice.paymentMethod && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary">Payment Method</span>
                    <span className="text-sm font-medium text-primary">{selectedInvoice.paymentMethod}</span>
                  </div>
                )}
                {selectedInvoice.transactionId && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-secondary">Transaction ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-primary font-mono">
                        {selectedInvoice.transactionId}
                      </span>
                      <button
                        onClick={() => handleCopyId(selectedInvoice.transactionId!)}
                        className="text-secondary hover:text-secondary"
                        title="Copy Transaction ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-card rounded-lg p-4 border border-theme">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Additional Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-secondary mb-1">Created At</p>
                  <p className="text-sm font-medium text-primary">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(selectedInvoice.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-secondary mb-1">Last Updated</p>
                  <p className="text-sm font-medium text-primary">
                    {new Date(selectedInvoice.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} {new Date(selectedInvoice.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                {selectedInvoice.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-secondary mb-1">Notes</p>
                    <p className="text-sm text-primary bg-card p-2 rounded border border-theme">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesPage;

