import { useState, useEffect } from 'react';
import { Search, Download, Calendar, FileText, Users, X } from 'lucide-react';
import { getPaystubs, getPaystubById } from '../../../../axios/api/account.payroll';
import jsPDF from 'jspdf';

interface Paystub {
  _id: string;
  payrollId: string;
  userId: {
    _id: string;
    name: string;
    email?: string;
    role?: string;
    internalId?: string;
  };
  employeeName: string;
  employeeId?: string;
  employeeEmail?: string;
  employeeRole?: string;
  workType?: 'Employee' | 'Driver' | 'Owner-Operator';
  payPeriod: {
    startDate: string;
    endDate: string;
    payDate: string;
  };
  paystubId?: string;
  summary: {
    grossPay: number;
    totalDeductions: number;
    totalTaxes: number;
    netPay: number;
  };
  status: 'draft' | 'issued' | 'void';
  createdAt: string;
  companyDetails?: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
}

const PaystubsList = () => {
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [filteredPaystubs, setFilteredPaystubs] = useState<Paystub[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'employees' | 'drivers' | 'ownerOperators'>('all');

  useEffect(() => {
    fetchPaystubs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [paystubs, searchQuery, activeTab]);

  const fetchPaystubs = async (dateParams?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      const params: any = {};
      // Use dateParams if provided, otherwise use state
      if (dateParams?.startDate || startDate) {
        params.startDate = dateParams?.startDate || startDate;
      }
      if (dateParams?.endDate || endDate) {
        params.endDate = dateParams?.endDate || endDate;
      }
      // Search is handled on frontend for better UX
      // if (searchQuery) params.search = searchQuery;

      const response = await getPaystubs(params);
      if (response?.success) {
        setPaystubs(response.data || []);
      } else {
        setPaystubs([]);
      }
    } catch (error) {
      console.error('Error fetching paystubs:', error);
      setPaystubs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...paystubs];

    // Apply tab filter (employees/drivers/owner operators)
    if (activeTab === 'employees') {
      filtered = filtered.filter(paystub => {
        const role = paystub.employeeRole?.toLowerCase() || paystub.userId?.role?.toLowerCase() || '';
        const workType = paystub.workType?.toLowerCase() || '';
        return role !== 'driver' && workType !== 'owner-operator';
      });
    } else if (activeTab === 'drivers') {
      filtered = filtered.filter(paystub => {
        const role = paystub.employeeRole?.toLowerCase() || paystub.userId?.role?.toLowerCase() || '';
        const workType = paystub.workType?.toLowerCase() || '';
        return role === 'driver' && workType !== 'owner-operator';
      });
    } else if (activeTab === 'ownerOperators') {
      filtered = filtered.filter(paystub => {
        const workType = paystub.workType?.toLowerCase() || '';
        return workType === 'owner-operator';
      });
    }

    // Apply search filter (frontend filtering for instant results)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paystub => 
        paystub.employeeName?.toLowerCase().includes(query) ||
        paystub.employeeId?.toLowerCase().includes(query) ||
        paystub.employeeEmail?.toLowerCase().includes(query) ||
        paystub.userId?.name?.toLowerCase().includes(query) ||
        paystub.userId?.internalId?.toLowerCase().includes(query)
      );
    }

    setFilteredPaystubs(filtered);
  };

  const handleDateFilter = () => {
    fetchPaystubs({ startDate, endDate });
    setShowDateFilter(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    fetchPaystubs();
  };

  const handleDownloadPDF = async (paystub: Paystub) => {
    try {
      // Fetch full paystub details for complete PDF
      const response = await getPaystubById(paystub._id);
      const fullPaystub = response?.success && response.data ? response.data : paystub;

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      const primaryR = 37, primaryG = 99, primaryB = 235;
      const textR = 31, textG = 41, textB = 55;
      const lightGrayR = 243, lightGrayG = 244, lightGrayB = 246;
      const greenR = 34, greenG = 197, greenB = 94;
      const redR = 239, redG = 68, redB = 68;

      let yPos = margin;

      // Header
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.rect(0, 0, pageWidth, 45, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const companyName = fullPaystub.companyDetails?.companyName || fullPaystub.company?.name || 'Company Name';
      doc.text(companyName, margin, 18);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      let companyY = 25;
      const companyAddress = fullPaystub.companyDetails?.companyAddress || fullPaystub.company?.address;
      if (companyAddress) {
        const addressLines = doc.splitTextToSize(companyAddress, 70);
        doc.text(addressLines, margin, companyY);
        companyY += addressLines.length * 4.5;
      }
      const companyPhone = fullPaystub.companyDetails?.companyPhone || fullPaystub.company?.phone;
      if (companyPhone) {
        doc.text(`Phone: ${companyPhone}`, margin, companyY);
        companyY += 4.5;
      }
      const companyEmail = fullPaystub.companyDetails?.companyEmail || fullPaystub.company?.email;
      if (companyEmail) {
        doc.text(`Email: ${companyEmail}`, margin, companyY);
      }

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('PAY STUB', pageWidth - margin, 18, { align: 'right' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('EARNINGS STATEMENT', pageWidth - margin, 25, { align: 'right' });
      if (fullPaystub.paystubId) {
        doc.setFontSize(7);
        doc.text(`ID: ${fullPaystub.paystubId}`, pageWidth - margin, 32, { align: 'right' });
      }

      doc.setTextColor(textR, textG, textB);
      yPos = 55;

      // Pay Period Box
      const boxWidth = 75;
      const boxHeight = 25;
      doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
      doc.roundedRect(pageWidth - margin - boxWidth, yPos, boxWidth, boxHeight, 2, 2, 'F');
      
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text('Pay Period Start', pageWidth - margin - boxWidth + 3, yPos + 6);
      doc.text('Pay Period End', pageWidth - margin - boxWidth + 3, yPos + 12);
      doc.text('Pay Date', pageWidth - margin - boxWidth + 3, yPos + 18);
      
      doc.setFontSize(8);
      doc.setTextColor(textR, textG, textB);
      doc.setFont('helvetica', 'bold');
      const startDate = new Date(fullPaystub.payPeriod.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const endDate = new Date(fullPaystub.payPeriod.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const payDate = new Date(fullPaystub.payPeriod.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.text(startDate, pageWidth - margin - 3, yPos + 6, { align: 'right' });
      doc.text(endDate, pageWidth - margin - 3, yPos + 12, { align: 'right' });
      doc.text(payDate, pageWidth - margin - 3, yPos + 18, { align: 'right' });

      yPos += boxHeight + 8;

      // Employee Information
      checkPageBreak(25);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Employee Information', margin, yPos);
      yPos += 7;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${fullPaystub.employeeName || fullPaystub.userId?.name || 'Unknown'}`, margin, yPos);
      yPos += 6;
      const empId = fullPaystub.employeeId || fullPaystub.userId?.internalId;
      if (empId) {
        doc.text(`Employee ID: ${empId}`, margin, yPos);
        yPos += 6;
      }
      doc.text(`Role: ${fullPaystub.employeeRole || fullPaystub.userId?.role || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Work Type: ${fullPaystub.workType || 'Employee'}`, margin, yPos);
      yPos += 6;
      if (fullPaystub.employeeAddress) {
        const addrLines = doc.splitTextToSize(`Address: ${fullPaystub.employeeAddress}`, contentWidth);
        doc.text(addrLines, margin, yPos);
        yPos += addrLines.length * 5;
      }
      yPos += 8;

      // Earnings Section (if available)
      if (fullPaystub.earnings && fullPaystub.earnings.earningsBreakdown && fullPaystub.earnings.earningsBreakdown.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Earnings', margin, yPos);
        yPos += 7;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
        doc.rect(margin, yPos - 2, contentWidth, 7, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Earning Type', margin + 2, yPos + 4);
        doc.text('Units', margin + 70, yPos + 4);
        doc.text('Rate', margin + 100, yPos + 4);
        doc.text('Amount', pageWidth - margin - 2, yPos + 4, { align: 'right' });
        yPos += 9;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        fullPaystub.earnings.earningsBreakdown.forEach((earning: any) => {
          checkPageBreak(6);
          const typeText = doc.splitTextToSize(earning.type || 'N/A', 60);
          doc.text(typeText, margin + 2, yPos + 4);
          doc.text(earning.units || '-', margin + 70, yPos + 4);
          doc.text(earning.rate > 0 ? `$${earning.rate.toFixed(2)}` : '-', margin + 100, yPos + 4);
          doc.text(`$${earning.amount.toFixed(2)}`, pageWidth - margin - 2, yPos + 4, { align: 'right' });
          yPos += Math.max(6, typeText.length * 5);
        });

        yPos += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Total Earnings', margin + 2, yPos + 4);
        doc.setTextColor(greenR, greenG, greenB);
        doc.text(`$${fullPaystub.earnings.totalEarnings.toFixed(2)}`, pageWidth - margin - 2, yPos + 4, { align: 'right' });
        doc.setTextColor(textR, textG, textB);
        yPos += 10;
      }

      // Deductions Section (if available)
      if (fullPaystub.deductions && fullPaystub.deductions.deductionsBreakdown && fullPaystub.deductions.deductionsBreakdown.length > 0) {
        checkPageBreak(40);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Deductions', margin, yPos);
        yPos += 7;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        doc.setFillColor(lightGrayR, lightGrayG, lightGrayB);
        doc.rect(margin, yPos - 2, contentWidth, 7, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Deduction Type', margin + 2, yPos + 4);
        doc.text('Amount', pageWidth - margin - 2, yPos + 4, { align: 'right' });
        yPos += 9;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        fullPaystub.deductions.deductionsBreakdown.forEach((deduction: any) => {
          checkPageBreak(6);
          const typeText = doc.splitTextToSize(deduction.type || 'N/A', 120);
          doc.text(typeText, margin + 2, yPos + 4);
          doc.setTextColor(redR, redG, redB);
          doc.text(`$${deduction.amount.toFixed(2)}`, pageWidth - margin - 2, yPos + 4, { align: 'right' });
          doc.setTextColor(textR, textG, textB);
          yPos += Math.max(6, typeText.length * 5);
        });

        yPos += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Total Deductions', margin + 2, yPos + 4);
        doc.setTextColor(redR, redG, redB);
        doc.text(`$${fullPaystub.deductions.totalDeductions.toFixed(2)}`, pageWidth - margin - 2, yPos + 4, { align: 'right' });
        doc.setTextColor(textR, textG, textB);
        yPos += 12;
      }

      // Summary Section
      checkPageBreak(40);
      doc.setFillColor(primaryR, primaryG, primaryB);
      doc.roundedRect(margin, yPos, contentWidth, 32, 2, 2, 'F');
      yPos += 8;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Pay Summary', margin + 3, yPos);
      yPos += 9;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Gross Earnings:', margin + 3, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${fullPaystub.summary.grossPay.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += 7;

      doc.setFont('helvetica', 'normal');
      doc.text('Total Deductions:', margin + 3, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`$${fullPaystub.summary.totalDeductions.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
      yPos += 6;

      doc.setDrawColor(255, 255, 255);
      doc.line(margin + 3, yPos, pageWidth - margin - 3, yPos);
      yPos += 6;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Net Pay', margin + 3, yPos);
      doc.setFontSize(13);
      doc.text(`$${fullPaystub.summary.netPay.toFixed(2)}`, pageWidth - margin - 3, yPos, { align: 'right' });
      doc.setTextColor(textR, textG, textB);
      yPos += 15;

      // YTD Summary (if available)
      if (fullPaystub.ytd) {
        checkPageBreak(25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Year-to-Date (YTD) Summary', margin, yPos);
        yPos += 7;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 7;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('YTD Earnings:', margin, yPos);
        doc.text(`$${fullPaystub.ytd.earnings.toFixed(2)}`, margin + 70, yPos);
        yPos += 6;
        doc.text('YTD Deductions:', margin, yPos);
        doc.text(`$${fullPaystub.ytd.deductions.toFixed(2)}`, margin + 70, yPos);
        yPos += 6;
        doc.text('YTD Net Pay:', margin, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${fullPaystub.ytd.netPay.toFixed(2)}`, margin + 70, yPos);
        yPos += 10;
      }

      // Footer
      const footerY = pageHeight - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      let footerTextY = footerY + 5;
      
      if (fullPaystub.notes) {
        const notesLines = doc.splitTextToSize(`Notes: ${fullPaystub.notes}`, contentWidth);
        doc.text(notesLines, margin, footerTextY);
        footerTextY += notesLines.length * 4;
      }
      if (fullPaystub.hrName) {
        doc.text(`HR Signature: ${fullPaystub.hrName}`, margin, footerTextY);
        footerTextY += 4;
      }
      doc.text(`Status: ${fullPaystub.status.charAt(0).toUpperCase() + fullPaystub.status.slice(1)}`, margin, footerTextY);
      doc.text(`Generated: ${new Date(fullPaystub.createdAt).toLocaleString()}`, pageWidth - margin, footerTextY, { align: 'right' });

      const fileName = `Paystub_${(fullPaystub.employeeName || fullPaystub.userId?.name || 'Unknown').replace(/\s+/g, '_')}_${fullPaystub.paystubId || fullPaystub._id.slice(-8)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF8FF] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-blue-600" size={28} />
                Paystubs
              </h1>
              <p className="text-sm text-gray-600 mt-1">View and download paystubs for employees, drivers, and owner operators</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Paystubs
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {paystubs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'employees'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={18} />
              Employees
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {paystubs.filter(p => {
                  const role = p.employeeRole?.toLowerCase() || p.userId?.role?.toLowerCase() || '';
                  return role !== 'driver';
                }).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'drivers'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={18} />
              Drivers
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {paystubs.filter(p => {
                  const role = p.employeeRole?.toLowerCase() || p.userId?.role?.toLowerCase() || '';
                  const workType = p.workType?.toLowerCase() || '';
                  return role === 'driver' && workType !== 'owner-operator';
                }).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ownerOperators')}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'ownerOperators'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={18} />
              Owner Operators
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {paystubs.filter(p => {
                  const workType = p.workType?.toLowerCase() || '';
                  return workType === 'owner-operator';
                }).length}
              </span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, employee ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date Filter Toggle */}
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Calendar size={18} />
              Date Filter
            </button>

            {/* Clear Filters */}
            {(searchQuery || startDate || endDate) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors text-red-600"
              >
                <X size={18} />
                Clear
              </button>
            )}
          </div>

          {/* Date Filter Panel */}
          {showDateFilter && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleDateFilter}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Paystubs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredPaystubs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg font-medium">
                No {activeTab === 'employees' ? 'employee' : activeTab === 'drivers' ? 'driver' : activeTab === 'ownerOperators' ? 'owner operator' : ''} paystubs found
              </p>
              <p className="text-sm">Try adjusting your filters, search query, or date range</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee / Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPaystubs.map((paystub) => (
                    <tr key={paystub._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-blue-500">
                            {paystub.employeeName?.charAt(0) || 'N'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{paystub.employeeName || 'Unknown'}</div>
                            {paystub.employeeEmail && (
                              <div className="text-sm text-gray-500">{paystub.employeeEmail}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {paystub.employeeId || paystub.userId?.internalId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            paystub.employeeRole?.toLowerCase() === 'driver' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {paystub.employeeRole || paystub.userId?.role || 'N/A'}
                          </span>
                          {paystub.workType && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {paystub.workType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(paystub.payPeriod.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500">to {new Date(paystub.payPeriod.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(paystub.payPeriod.payDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ${paystub.summary.netPay.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Gross: ${paystub.summary.grossPay.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          paystub.status === 'issued' 
                            ? 'bg-green-100 text-green-800' 
                            : paystub.status === 'void'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {paystub.status.charAt(0).toUpperCase() + paystub.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDownloadPDF(paystub)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Download PDF"
                        >
                          <Download size={18} />
                          <span className="hidden md:inline">Download</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Footer */}
          {filteredPaystubs.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredPaystubs.length}</span> paystub{filteredPaystubs.length !== 1 ? 's' : ''}
                  {activeTab !== 'all' && (
                    <span className="ml-2 text-blue-600">
                      ({activeTab === 'employees' ? 'Employees' : activeTab === 'drivers' ? 'Drivers' : activeTab === 'ownerOperators' ? 'Owner Operators' : ''})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-gray-600">
                    Total Net Pay: <span className="font-semibold text-gray-900">
                      ${filteredPaystubs.reduce((sum, p) => sum + p.summary.netPay, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Total Gross: <span className="font-semibold text-gray-900">
                      ${filteredPaystubs.reduce((sum, p) => sum + p.summary.grossPay, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaystubsList;

