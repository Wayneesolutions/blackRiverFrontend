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
    companyFlag?: boolean;
    details?: {
      companyFlag?: boolean;
    };
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
  const [downloadingBulk, setDownloadingBulk] = useState<boolean>(false);
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
        // Company drivers: must be a driver role AND companyFlag should be false
        // Note: Based on backend logic: companyFlag=true = Owner Operator, companyFlag=false = Company Driver
        const role = paystub.employeeRole?.toLowerCase() || paystub.userId?.role?.toLowerCase() || '';
        if (role !== 'driver') return false;
        // Check both direct property and nested details
        const companyFlag = paystub.userId?.companyFlag ?? paystub.userId?.details?.companyFlag ?? false;
        // Company drivers have companyFlag = false
        return companyFlag === false;
      });
    } else if (activeTab === 'ownerOperators') {
      filtered = filtered.filter(paystub => {
        // Owner operators: must be a driver role AND companyFlag should be true
        // Note: Based on backend logic: companyFlag=true = Owner Operator, companyFlag=false = Company Driver
        const role = paystub.employeeRole?.toLowerCase() || paystub.userId?.role?.toLowerCase() || '';
        if (role !== 'driver') return false;
        // Check both direct property and nested details
        const companyFlag = paystub.userId?.companyFlag ?? paystub.userId?.details?.companyFlag ?? false;
        // Owner operators have companyFlag = true
        return companyFlag === true;
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
      
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      const textR = 31, textG = 41, textB = 55;

      let yPos = margin;

      // Determine if this is an employee (not a driver)
      const isEmployee = (fullPaystub.employeeRole?.toLowerCase() !== 'driver' && 
                         fullPaystub.userId?.role?.toLowerCase() !== 'driver') ||
                         (fullPaystub.workType?.toLowerCase() === 'employee');

      if (isEmployee) {
        // Employee Pay Statement Format - Matching the image structure exactly
        doc.setTextColor(textR, textG, textB);
        
        const companyName = fullPaystub.companyDetails?.companyName || fullPaystub.company?.name || 'Company Name';
        const companyAddress = fullPaystub.companyDetails?.companyAddress || fullPaystub.company?.address || '';
        const companyPhone = fullPaystub.companyDetails?.companyPhone || fullPaystub.company?.phone || '';
        const companyLogo = fullPaystub.companyDetails?.companyLogo || fullPaystub.company?.logoUrl || ''; // Signed URL from backend
        
        // Format phone number: +1 (204) 306-4881 format if it's a 10-digit number
        let formattedPhone = companyPhone;
        if (companyPhone && /^\d{10}$/.test(companyPhone.replace(/\D/g, ''))) {
          const digits = companyPhone.replace(/\D/g, '');
          if (digits.length === 10) {
            formattedPhone = `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
          }
        } else if (companyPhone && !companyPhone.startsWith('+')) {
          formattedPhone = `+${companyPhone}`;
        }
        
        // TOP SECTION - Company Logo and Name at the top (outside boxes, one line, half size of left box)
        let topY = margin;
        let logoWidth = 0;
        let logoHeight = 0;
        
        // Calculate box dimensions first
        const boxHeight = 45;
        const boxWidth = (pageWidth - (margin * 2)) / 2;
        
        // Company logo at the top left - fixed small size (200px = ~70mm, but using smaller 20mm for header)
        // Converting 200px to mm: 200px at 96dpi = ~53mm, but for header use 20mm (small)
        const logoSizeMm = 20; // Small fixed size in mm
        
        if (companyLogo) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = companyLogo; // Use signed URL from backend
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
                    logoWidth = logoSizeMm; // Fixed small width
                    logoHeight = logoSizeMm; // Fixed small height (square)
                    doc.addImage(imgData, 'PNG', margin, topY, logoWidth, logoHeight);
                  }
                } catch (e) {
                  console.log('Could not add logo to PDF:', e);
                }
                resolve();
              };
              img.onerror = (err) => {
                console.log('Could not load logo image:', err);
                resolve();
              };
              setTimeout(() => resolve(), 3000); // Increased timeout
            });
          } catch (err) {
            console.log('Could not load logo:', err);
          }
        }
        
        // Company name split into two lines - next to logo at the top
        // Format: "Logistiq" (first line) and "Innovations Ltd." (second line)
        const nameX = margin + logoWidth + (logoWidth > 0 ? 5 : 0);
        let nameY = topY;
        
        // Split company name - look for "Logistiq" pattern
        let firstLine = '';
        let secondLine = '';
        
        // Check if name contains "Logistiq" - split there
        const logistiqIndex = companyName.toLowerCase().indexOf('logistiq');
        if (logistiqIndex !== -1) {
          // Split at "Logistiq"
          const beforeLogistiq = companyName.substring(0, logistiqIndex + 'Logistiq'.length).trim();
          const afterLogistiq = companyName.substring(logistiqIndex + 'Logistiq'.length).trim();
          
          if (beforeLogistiq) {
            firstLine = beforeLogistiq;
            secondLine = afterLogistiq || '';
          } else {
            // If "Logistiq" is at the start
            firstLine = 'Logistiq';
            secondLine = afterLogistiq || '';
          }
        } else {
          // Fallback: split at first space or roughly in half
          const nameWords = companyName.split(' ');
          if (nameWords.length === 1) {
            const mid = Math.ceil(companyName.length / 2);
            firstLine = companyName.substring(0, mid);
            secondLine = companyName.substring(mid);
          } else if (nameWords.length === 2) {
            firstLine = nameWords[0];
            secondLine = nameWords[1];
          } else {
            // Split at first word
            firstLine = nameWords[0];
            secondLine = nameWords.slice(1).join(' ');
          }
        }
        
        // First line - bigger and bold
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        nameY = topY + (logoHeight > 0 ? logoHeight / 2 - 4 : 4);
        doc.text(firstLine, nameX, nameY);
        
        // Second line - a little bit smaller but still bold
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        nameY += 6;
        doc.text(secondLine, nameX, nameY);
        
        // TOP SECTION - Two boxes side by side (full width, no gap) - below logo/name
        const boxY = topY + Math.max(logoHeight, 8) + 8;
        // boxHeight and boxWidth already declared above
        
        // LEFT BOX - Company Information
        const leftBoxX = margin;
        doc.setDrawColor(0, 0, 0);
        doc.rect(leftBoxX, boxY, boxWidth, boxHeight, 'S'); // Draw box border
        
        let leftBoxY = boxY + 5;
        
        // Company name in left box (bold)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, leftBoxX + 3, leftBoxY);
        leftBoxY += 6;
        
        // Company address
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyAddress) {
          const addressLines = doc.splitTextToSize(companyAddress, boxWidth - 6);
          doc.text(addressLines, leftBoxX + 3, leftBoxY);
          leftBoxY += addressLines.length * 4;
        }
        
        // Company phone
        if (formattedPhone) {
          doc.text(formattedPhone, leftBoxX + 3, leftBoxY);
        }
        
        // CENTER VERTICAL LINE
        const centerX = margin + boxWidth;
        doc.setDrawColor(0, 0, 0);
        doc.line(centerX, boxY, centerX, boxY + boxHeight);
        
        // RIGHT BOX - Employee Information
        const rightBoxX = centerX; // Start right at the center line
        doc.rect(rightBoxX, boxY, boxWidth, boxHeight, 'S'); // Draw box border
        
        let rightBoxY = boxY + 5;
        
        // "COMPANY PAY STATEMENT" title (bold)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPANY PAY STATEMENT', rightBoxX + 3, rightBoxY);
        rightBoxY += 5;
        
        // Employee name (bold)
        const employeeName = fullPaystub.employeeName || fullPaystub.userId?.name || 'Unknown';
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(employeeName, rightBoxX + 3, rightBoxY);
        rightBoxY += 5;
        
        // Employee address
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (fullPaystub.employeeAddress) {
          const addrLines = doc.splitTextToSize(fullPaystub.employeeAddress, boxWidth - 6);
          doc.text(addrLines, rightBoxX + 3, rightBoxY);
          rightBoxY += addrLines.length * 4;
        }
        
        // Employee ID with "#" symbol
        const empId = fullPaystub.employeeId || fullPaystub.userId?.internalId;
        if (empId) {
          doc.text('#', rightBoxX + 3, rightBoxY);
          rightBoxY += 5;
        }
        
        // PAY PERIOD
        const startDate = new Date(fullPaystub.payPeriod.startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const endDate = new Date(fullPaystub.payPeriod.endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const periodText = `PAY PERIOD ${startDate} - ${endDate}`;
        doc.text(periodText, rightBoxX + 3, rightBoxY);
        
        // Set yPos below the boxes
        yPos = boxY + boxHeight + 8;
        
      } else {
        // Driver/Owner Operator Format - Matching employee format structure
        doc.setTextColor(textR, textG, textB);
        
        const companyName = fullPaystub.companyDetails?.companyName || fullPaystub.company?.name || 'Company Name';
        const companyAddress = fullPaystub.companyDetails?.companyAddress || fullPaystub.company?.address || '';
        const companyPhone = fullPaystub.companyDetails?.companyPhone || fullPaystub.company?.phone || '';
        const companyLogo = fullPaystub.companyDetails?.companyLogo || fullPaystub.company?.logoUrl || ''; // Signed URL from backend
        
        // Format phone number: +1 (204) 306-4881 format if it's a 10-digit number
        let formattedPhone = companyPhone;
        if (companyPhone && /^\d{10}$/.test(companyPhone.replace(/\D/g, ''))) {
          const digits = companyPhone.replace(/\D/g, '');
          if (digits.length === 10) {
            formattedPhone = `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
          }
        } else if (companyPhone && !companyPhone.startsWith('+')) {
          formattedPhone = `+${companyPhone}`;
        }
        
        // TOP SECTION - Company Logo and Name at the top (outside boxes, one line, half size of left box)
        let topY = margin;
        let logoWidth = 0;
        let logoHeight = 0;
        
        // Calculate box dimensions first
        const boxHeight = 45;
        const boxWidth = (pageWidth - (margin * 2)) / 2;
        
        // Company logo at the top left - fixed small size
        const logoSizeMm = 20; // Small fixed size in mm
        
        if (companyLogo) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = companyLogo; // Use signed URL from backend
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
                    logoWidth = logoSizeMm; // Fixed small width
                    logoHeight = logoSizeMm; // Fixed small height (square)
                    doc.addImage(imgData, 'PNG', margin, topY, logoWidth, logoHeight);
                  }
                } catch (e) {
                  console.log('Could not add logo to PDF:', e);
                }
                resolve();
              };
              img.onerror = (err) => {
                console.log('Could not load logo image:', err);
                resolve();
              };
              setTimeout(() => resolve(), 3000);
            });
          } catch (err) {
            console.log('Could not load logo:', err);
          }
        }
        
        // Company name split into two lines - next to logo at the top
        const nameX = margin + logoWidth + (logoWidth > 0 ? 5 : 0);
        let nameY = topY;
        
        // Split company name - look for "Logistiq" pattern
        let firstLine = '';
        let secondLine = '';
        
        const logistiqIndex = companyName.toLowerCase().indexOf('logistiq');
        if (logistiqIndex !== -1) {
          const beforeLogistiq = companyName.substring(0, logistiqIndex + 'Logistiq'.length).trim();
          const afterLogistiq = companyName.substring(logistiqIndex + 'Logistiq'.length).trim();
          
          if (beforeLogistiq) {
            firstLine = beforeLogistiq;
            secondLine = afterLogistiq || '';
          } else {
            firstLine = 'Logistiq';
            secondLine = afterLogistiq || '';
          }
        } else {
          const nameWords = companyName.split(' ');
          if (nameWords.length === 1) {
            const mid = Math.ceil(companyName.length / 2);
            firstLine = companyName.substring(0, mid);
            secondLine = companyName.substring(mid);
          } else if (nameWords.length === 2) {
            firstLine = nameWords[0];
            secondLine = nameWords[1];
          } else {
            firstLine = nameWords[0];
            secondLine = nameWords.slice(1).join(' ');
          }
        }
        
        // First line - bigger and bold
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        nameY = topY + (logoHeight > 0 ? logoHeight / 2 - 4 : 4);
        doc.text(firstLine, nameX, nameY);
        
        // Second line - a little bit smaller but still bold
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        nameY += 6;
        doc.text(secondLine, nameX, nameY);
        
        // TOP SECTION - Two boxes side by side (full width, no gap) - below logo/name
        const boxY = topY + Math.max(logoHeight, 8) + 8;
        
        // LEFT BOX - Company Information
        const leftBoxX = margin;
        doc.setDrawColor(0, 0, 0);
        doc.rect(leftBoxX, boxY, boxWidth, boxHeight, 'S'); // Draw box border
        
        let leftBoxY = boxY + 5;
        
        // Company name in left box (bold)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyName, leftBoxX + 3, leftBoxY);
        leftBoxY += 6;
        
        // Company address
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (companyAddress) {
          const addressLines = doc.splitTextToSize(companyAddress, boxWidth - 6);
          doc.text(addressLines, leftBoxX + 3, leftBoxY);
          leftBoxY += addressLines.length * 4;
        }
        
        // Company phone
        if (formattedPhone) {
          doc.text(formattedPhone, leftBoxX + 3, leftBoxY);
        }
        
        // CENTER VERTICAL LINE
        const centerX = margin + boxWidth;
        doc.setDrawColor(0, 0, 0);
        doc.line(centerX, boxY, centerX, boxY + boxHeight);
        
        // RIGHT BOX - Driver Information
        const rightBoxX = centerX; // Start right at the center line
        doc.rect(rightBoxX, boxY, boxWidth, boxHeight, 'S'); // Draw box border
        
        let rightBoxY = boxY + 5;
        
        // "COMPANY PAY STATEMENT" title (bold)
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPANY PAY STATEMENT', rightBoxX + 3, rightBoxY);
        rightBoxY += 5;
        
        // Driver name (bold)
        const driverName = fullPaystub.employeeName || fullPaystub.userId?.name || 'Unknown';
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(driverName, rightBoxX + 3, rightBoxY);
        rightBoxY += 5;
        
        // Driver address
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (fullPaystub.employeeAddress) {
          const addrLines = doc.splitTextToSize(fullPaystub.employeeAddress, boxWidth - 6);
          doc.text(addrLines, rightBoxX + 3, rightBoxY);
          rightBoxY += addrLines.length * 4;
        }
        
        // City and State (if available)
        const city = fullPaystub.userId?.city || '';
        const state = fullPaystub.userId?.state || '';
        if (city || state) {
          const cityState = [city, state].filter(Boolean).join(' ');
          doc.text(cityState, rightBoxX + 3, rightBoxY);
          rightBoxY += 4;
        }
        
        // Employee ID with "#" symbol (BILL: #757 | #1308 format)
        const empId = fullPaystub.employeeId || fullPaystub.userId?.internalId;
        if (empId) {
          const billText = `BILL: #${empId}`;
          doc.text(billText, rightBoxX + 3, rightBoxY);
          rightBoxY += 5;
        }
        
        // PAY PERIOD
        const startDate = new Date(fullPaystub.payPeriod.startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const endDate = new Date(fullPaystub.payPeriod.endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const periodText = `PAY PERIOD ${startDate} - ${endDate}`;
        doc.text(periodText, rightBoxX + 3, rightBoxY);
        rightBoxY += 5;
        
        // PAYROLL DUE
        const payDate = new Date(fullPaystub.payPeriod.payDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        doc.text(`PAYROLL DUE: ${payDate}`, rightBoxX + 3, rightBoxY);
        rightBoxY += 5;
        
        // CHEQUE # (if available from payment info)
        const chequeNumber = fullPaystub.payment?.chequeNumber || fullPaystub.payment?.bankLast4Digits || '';
        if (chequeNumber) {
          doc.text(`CHEQUE #: ${chequeNumber}`, rightBoxX + 3, rightBoxY);
        }
        
        // Set yPos below the boxes
        yPos = boxY + boxHeight + 8;

        // Full line below boxes
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 8;

        // Trip Details Table (only for drivers/owner operators)
        if (fullPaystub.tripDetails && fullPaystub.tripDetails.length > 0) {
          // Helper function to extract city and state from full address
          const extractCityState = (address: string): string => {
            if (!address) return '';
            
            // Canadian provinces (prioritize these)
            const canadianProvinces = ['AB', 'BC', 'MB', 'NB', 'NL', 'NT', 'NS', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'];
            // US states
            const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY',
              'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND',
              'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
            
            const stateNames: { [key: string]: string } = {
              'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB', 'new brunswick': 'NB',
              'newfoundland': 'NL', 'northwest territories': 'NT', 'nova scotia': 'NS', 'nunavut': 'NU',
              'ontario': 'ON', 'prince edward island': 'PE', 'quebec': 'QC', 'saskatchewan': 'SK', 'yukon': 'YT',
              'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA', 'colorado': 'CO',
              'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
              'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA',
              'maine': 'ME', 'maryland': 'MD', 'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN',
              'mississippi': 'MS', 'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
              'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
              'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
              'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX',
              'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
              'wisconsin': 'WI', 'wyoming': 'WY'
            };
            
            // Remove postal codes (patterns like T2A 7X6, R2X 2Y9, etc.)
            let cleaned = address.replace(/\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi, '').trim();
            // Remove country codes (Canada, USA, United States) - but keep CA as it might be California
            cleaned = cleaned.replace(/\b(Canada|USA|United States)\b/gi, '').trim();
            
            // Remove street addresses (numbers followed by street names)
            cleaned = cleaned.replace(/^\d+\s+[A-Za-z0-9\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Place|Pl|Crescent|Cres)\s*/i, '').trim();
            
            // Split by spaces, commas, and newlines
            const words = cleaned.split(/[\s,\n]+/).filter(w => w && w.length > 0);
            
            let city = '';
            let state = '';
            let stateIndex = -1;
            
            // Look backwards for state/province - prioritize Canadian provinces
            for (let i = words.length - 1; i >= 0; i--) {
              const word = words[i].toUpperCase();
              const wordLower = words[i].toLowerCase();
              
              // Check if it's a Canadian province first
              if (canadianProvinces.includes(word) && word.length === 2) {
                state = word;
                stateIndex = i;
                break;
              }
              
              // Check if it's a US state (but not CA if we see other Canadian provinces)
              if (usStates.includes(word) && word.length === 2 && word !== 'CA') {
                state = word;
                stateIndex = i;
                break;
              }
              
              // Handle CA specially - if we see other Canadian provinces, CA is likely Canada, not California
              if (word === 'CA' && i < words.length - 1) {
                // Check if previous word is a Canadian province
                const prevWord = words[i - 1]?.toUpperCase();
                if (prevWord && canadianProvinces.includes(prevWord)) {
                  // CA is Canada, skip it
                  continue;
                }
                // Otherwise, CA might be California
                state = word;
                stateIndex = i;
                break;
              }
              
              // Check if it's a state name
              if (stateNames[wordLower]) {
                state = stateNames[wordLower];
                stateIndex = i;
                break;
              }
            }
            
            // If we found a state, get the city (word before state)
            if (state && stateIndex > 0) {
              // City is the word before the state
              city = words[stateIndex - 1];
              // If city looks like a state code, try to get the word before that
              if (canadianProvinces.includes(city.toUpperCase()) || usStates.includes(city.toUpperCase())) {
                if (stateIndex > 1) {
                  city = words[stateIndex - 2];
                } else {
                  city = '';
                }
              }
            }
            
            // If we found city and state, return them
            if (city && state) {
              return `${city}, ${state}`;
            }
            
            // Fallback: try to find last two words where second might be state
            if (words.length >= 2) {
              const lastWord = words[words.length - 1].toUpperCase();
              const secondLastWord = words[words.length - 2];
              
              // If last word is a valid state code (2 letters)
              if (lastWord.length === 2 && (canadianProvinces.includes(lastWord) || usStates.includes(lastWord))) {
                // Check if second last is also a state code
                if (secondLastWord.length === 2 && (canadianProvinces.includes(secondLastWord.toUpperCase()) || usStates.includes(secondLastWord.toUpperCase()))) {
                  // Both are state codes, need to go back further
                  if (words.length >= 3) {
                    return `${words[words.length - 3]}, ${lastWord}`;
                  }
                } else {
                  return `${secondLastWord}, ${lastWord}`;
                }
              }
            }
            
            // Final fallback: return last meaningful word (likely city)
            if (words.length > 0) {
              return words[words.length - 1];
            }
            
            return '';
          };

          // Table headers
          doc.setFontSize(6); // Reduced font size for better fit
          doc.setFont('helvetica', 'bold');
          const tableStartX = margin;
          // Calculate available width (page width - margins)
          const availableWidth = pageWidth - (margin * 2); // ~180mm for A4 with 15mm margins
          
          // Calculate column widths to use full available width
          // Total padding: 10 gaps * padding amount
          const colPadding = 2; // More spacing between columns
          const totalPadding = colPadding * 10; // 10 gaps between 11 columns
          const totalColumnWidth = availableWidth - totalPadding;
          
          // Distribute width proportionally based on content needs
          // Proportional widths (sum = 100)
          const truckColWidth = (totalColumnWidth * 8) / 100;      // 8%
          const payTypeColWidth = (totalColumnWidth * 10) / 100;  // 10%
          const loadColWidth = (totalColumnWidth * 9) / 100;       // 9%
          const typeColWidth = (totalColumnWidth * 6) / 100;       // 6%
          const periodColWidth = (totalColumnWidth * 12) / 100;     // 12%
          const fromColWidth = (totalColumnWidth * 12) / 100;       // 12%
          const toColWidth = (totalColumnWidth * 12) / 100;         // 12%
          const rateColWidth = (totalColumnWidth * 8) / 100;       // 8%
          const milesColWidth = (totalColumnWidth * 9) / 100;       // 9%
          const cadColWidth = (totalColumnWidth * 7) / 100;         // 7%

          let headerX = tableStartX;
          doc.text('Truck #', headerX, yPos);
          headerX += truckColWidth + colPadding;
          doc.text('Pay Type', headerX, yPos);
          headerX += payTypeColWidth + colPadding;
          doc.text('Load #', headerX, yPos);
          headerX += loadColWidth + colPadding;
          doc.text('Type', headerX, yPos);
          headerX += typeColWidth + colPadding;
          doc.text('Period', headerX, yPos);
          headerX += periodColWidth + colPadding;
          doc.text('From', headerX, yPos);
          headerX += fromColWidth + colPadding;
          doc.text('To', headerX, yPos);
          headerX += toColWidth + colPadding;
          doc.text('Pay Rate', headerX, yPos);
          headerX += rateColWidth + colPadding;
          doc.text('Miles/Hours', headerX, yPos);
          headerX += milesColWidth + colPadding;
          doc.text('CAD', headerX, yPos);
          headerX += cadColWidth + colPadding;
          doc.text('USD', headerX, yPos);
          yPos += 5;

          // Full line below headers
          doc.setDrawColor(0, 0, 0);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;

          // Trip details rows
          doc.setFontSize(5.5); // Slightly smaller font for data rows
          doc.setFont('helvetica', 'normal');
          fullPaystub.tripDetails.forEach((trip: any) => {
            checkPageBreak(8);
            const rowStartY = yPos;
            let rowX = tableStartX;

            // Truck # (with # prefix if not already present)
            let truckNum = trip.truckNumber || '';
            if (truckNum && !truckNum.startsWith('#')) {
              truckNum = `#${truckNum}`;
            } else if (!truckNum) {
              truckNum = '#1308';
            }
            doc.text(truckNum, rowX, rowStartY);
            rowX += truckColWidth + colPadding;

            // Pay Type - truncate if too long
            const payType = trip.payType || 'Paid Per Mile';
            const payTypeTruncated = payType.length > 12 ? payType.substring(0, 10) + '..' : payType;
            doc.text(payTypeTruncated, rowX, rowStartY);
            rowX += payTypeColWidth + colPadding;

            // Load # (with # prefix if not already present and not EMPTY-T)
            let loadNum = trip.loadNumber || '';
            if (loadNum && loadNum !== 'EMPTY-T' && !loadNum.startsWith('#')) {
              loadNum = `#${loadNum}`;
            } else if (!loadNum) {
              loadNum = 'EMPTY-T';
            }
            // Truncate if too long
            const loadNumTruncated = loadNum.length > 10 ? loadNum.substring(0, 8) + '..' : loadNum;
            doc.text(loadNumTruncated, rowX, rowStartY);
            rowX += loadColWidth + colPadding;

            // Type
            const tripType = trip.tripType || 'TEAM';
            doc.text(tripType, rowX, rowStartY);
            rowX += typeColWidth + colPadding;

            // Period From (first line)
            const periodFrom = trip.periodFrom ? new Date(trip.periodFrom).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
            doc.text(periodFrom, rowX, rowStartY);
            
            // Period To (second line, below From)
            const periodTo = trip.periodTo ? new Date(trip.periodTo).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
            doc.text(periodTo, rowX, rowStartY + 4);
            rowX += periodColWidth + colPadding;

            // From (Origin) - simplified to city, state only
            const origin = trip.origin || '';
            const originSimple = extractCityState(origin);
            if (originSimple) {
              // Truncate if too long (city, state should be short)
              const originDisplay = originSimple.length > 14 ? originSimple.substring(0, 12) + '..' : originSimple;
              doc.text(originDisplay, rowX, rowStartY);
            }
            rowX += fromColWidth + colPadding;

            // To (Destination) - simplified to city, state only
            const destination = trip.destination || '';
            const destSimple = extractCityState(destination);
            if (destSimple) {
              // Truncate if too long (city, state should be short)
              const destDisplay = destSimple.length > 14 ? destSimple.substring(0, 12) + '..' : destSimple;
              doc.text(destDisplay, rowX, rowStartY);
            }
            rowX += toColWidth + colPadding;

            // Pay Rate
            const payRate = trip.payRate || 0;
            doc.text(payRate > 0 ? `$${payRate.toFixed(2)}` : '-', rowX, rowStartY);
            rowX += rateColWidth + colPadding;

            // Miles/Hours
            const miles = trip.miles || trip.hours || 0;
            const milesFormatted = miles > 0 ? miles.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '-';
            doc.text(milesFormatted, rowX, rowStartY);
            rowX += milesColWidth + colPadding;

            // CAD - show amount in CAD
            const amountCAD = trip.amountCAD || 0;
            if (amountCAD > 0) {
              doc.text(`$${amountCAD.toFixed(2)}`, rowX, rowStartY);
            } else {
              doc.text('-', rowX, rowStartY);
            }
            rowX += cadColWidth + colPadding;

            // USD - show empty or dash
            doc.text('-', rowX, rowStartY);

            // Row height - fixed for single line addresses, but period has 2 lines
            yPos += 8; // Fixed height for rows
          });
          
          // Summary section below the table
          yPos += 5; // Space after table
          
          // Calculate total miles
          const totalMiles = fullPaystub.tripDetails.reduce((sum: number, trip: any) => {
            return sum + (trip.miles || trip.hours || 0);
          }, 0);
          
          // Format the value
          const totalMilesValue = totalMiles.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          
          // Set font for width calculation
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          
          // Calculate width of the value (which will be the widest part)
          const valueWidth = doc.getTextWidth(totalMilesValue);
          const labelWidth = doc.getTextWidth('Total Miles: ');
          const totalTextWidth = Math.max(labelWidth, valueWidth); // Use the wider of the two
          
          // Draw first line with same width as the text (right-aligned)
          const lineStartX = pageWidth - margin - totalTextWidth;
          doc.setDrawColor(0, 0, 0);
          doc.line(lineStartX, yPos, pageWidth - margin, yPos);
          yPos += 5;
          
          // Total Miles label (right-aligned, bold, black)
          doc.setTextColor(0, 0, 0); // Black color
          doc.text('Total Miles:', pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
          
          // Total Miles value (right-aligned, bold, black)
          doc.text(totalMilesValue, pageWidth - margin, yPos, { align: 'right' });
          yPos += 5;
          
          // Draw second line with same width as the first line (right-aligned)
          doc.setDrawColor(0, 0, 0);
          doc.line(lineStartX, yPos, pageWidth - margin, yPos);
        }
        
        // Additions section below Total Miles (only show if additions exist in backend response)
        if (fullPaystub.additions && Array.isArray(fullPaystub.additions) && fullPaystub.additions.length > 0) {
          yPos += 10; // Space after Total Miles or after trip details table
          
          // Additions title (left-aligned, bold, black)
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Additions', margin, yPos);
          yPos += 5;
          
          // Full line below title (spanning full page width)
          doc.setDrawColor(0, 0, 0);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
          
          // Table headers - spanning full width
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          const additionsTableStartX = margin;
          const availableWidth = pageWidth - (margin * 2);
          const additionsColPadding = 2;
          
          // Distribute width proportionally across full available width
          const loadColWidth = (availableWidth * 8) / 100;
          const dateColWidth = (availableWidth * 12) / 100;
          const memoColWidth = (availableWidth * 35) / 100;
          const amountColWidth = (availableWidth * 12) / 100;
          const perColWidth = (availableWidth * 10) / 100;
          const gstColWidth = (availableWidth * 10) / 100;
          // Last column takes remaining space to ensure full width coverage
          
          // Draw headers
          let headerX = additionsTableStartX;
          doc.text('Load', headerX, yPos);
          headerX += loadColWidth + additionsColPadding;
          doc.text('Date', headerX, yPos);
          headerX += dateColWidth + additionsColPadding;
          doc.text('Memo', headerX, yPos);
          headerX += memoColWidth + additionsColPadding;
          doc.text('Amount', headerX, yPos);
          headerX += amountColWidth + additionsColPadding;
          doc.text('Per', headerX, yPos);
          headerX += perColWidth + additionsColPadding;
          doc.text('GST', headerX, yPos);
          headerX += gstColWidth + additionsColPadding;
          doc.text('Total (CAD)', headerX, yPos);
          yPos += 5;
          
          // Full line below headers (spanning full page width from margin to margin)
          doc.setDrawColor(0, 0, 0);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
          
          // Additions data rows (from backend response)
          console.log('Checking additions:', fullPaystub.additions);
          console.log('Additions length:', fullPaystub.additions?.length);
          console.log('Is array?', Array.isArray(fullPaystub.additions));
          
          if (fullPaystub.additions && Array.isArray(fullPaystub.additions) && fullPaystub.additions.length > 0) {
          console.log('Rendering additions data rows, count:', fullPaystub.additions.length);
          // Additions data rows
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          fullPaystub.additions.forEach((addition: any, index: number) => {
            console.log(`Processing addition ${index}:`, addition);
            checkPageBreak(8);
            const rowStartY = yPos;
            let rowX = additionsTableStartX;
            
            // Load (empty in examples)
            const loadNum = addition.loadNumber || '';
            doc.text(loadNum || '', rowX, rowStartY);
            rowX += loadColWidth + additionsColPadding;
            
            // Date (format: MM/DD/YYYY)
            const addDate = addition.loadDate || addition.date ? 
              new Date(addition.loadDate || addition.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
            if (addDate) {
              doc.text(addDate, rowX, rowStartY);
            }
            rowX += dateColWidth + additionsColPadding;
            
            // Memo (may wrap if long) - format like "Delivery: TRIP 7876, LAREDO, TX"
            const memo = addition.memo || addition.description || '';
            let memoLines: string[] = [];
            let memoHeight = 4; // Default height for memo column
            if (memo) {
              memoLines = doc.splitTextToSize(memo, memoColWidth - 2);
              memoLines.forEach((line: string, idx: number) => {
                doc.text(line, rowX, rowStartY + (idx * 4));
              });
              memoHeight = memoLines.length * 4;
            }
            const amountX = rowX + memoColWidth + additionsColPadding;
            const perX = amountX + amountColWidth + additionsColPadding;
            const gstX = perX + perColWidth + additionsColPadding;
            const totalX = gstX + gstColWidth + additionsColPadding;
            
            // Amount (format: $12.00) - align to top of row
            const amount = addition.amount || 0;
            doc.text(`$${amount.toFixed(2)}`, amountX, rowStartY);
            
            // Per (format: One Time) - align to top of row
            const per = addition.per || addition.perUnit || 'One Time';
            doc.text(per, perX, rowStartY);
            
            // GST (format: $0.00) - align to top of row
            const gst = addition.gst || 0;
            doc.text(`$${gst.toFixed(2)}`, gstX, rowStartY);
            
            // Total (CAD) (format: $12.00) - align to top of row
            const totalCAD = addition.totalCAD || (addition.amount || 0) + (addition.gst || 0);
            doc.text(`$${totalCAD.toFixed(2)}`, totalX, rowStartY);
            
            // Calculate row height based on memo wrapping
            yPos += Math.max(6, memoHeight);
          });
          console.log('Finished rendering additions data rows');
          }
        }
        
        // Deductions section below additions table (only show if deductions exist in backend response)
        // Check if deductions is an array (new format) or if deductionsBreakdown exists (old format)
        const deductionsArray = Array.isArray(fullPaystub.deductions) 
          ? fullPaystub.deductions 
          : (fullPaystub.deductions?.deductionsBreakdown && Array.isArray(fullPaystub.deductions.deductionsBreakdown) 
            ? fullPaystub.deductions.deductionsBreakdown 
            : []);
        
        if (deductionsArray && deductionsArray.length > 0) {
          yPos += 10; // Space after additions table or after trip details
          
          // Deductions title (left-aligned, bold, black)
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('Deductions', margin, yPos);
          yPos += 5;
          
          // Full line below title (spanning full page width)
          doc.setDrawColor(0, 0, 0);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
          
          // Table headers - spanning full width (same as additions)
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          const deductionsTableStartX = margin;
          const deductionsAvailableWidth = pageWidth - (margin * 2);
          const deductionsColPadding = 2;
          
          // Distribute width proportionally across full available width (same as additions)
          const deductionsLoadColWidth = (deductionsAvailableWidth * 8) / 100;
          const deductionsDateColWidth = (deductionsAvailableWidth * 12) / 100;
          const deductionsMemoColWidth = (deductionsAvailableWidth * 35) / 100;
          const deductionsAmountColWidth = (deductionsAvailableWidth * 12) / 100;
          const deductionsPerColWidth = (deductionsAvailableWidth * 10) / 100;
          const deductionsGstColWidth = (deductionsAvailableWidth * 10) / 100;
          
          // Draw headers
          let deductionsHeaderX = deductionsTableStartX;
          doc.text('Load', deductionsHeaderX, yPos);
          deductionsHeaderX += deductionsLoadColWidth + deductionsColPadding;
          doc.text('Date', deductionsHeaderX, yPos);
          deductionsHeaderX += deductionsDateColWidth + deductionsColPadding;
          doc.text('Memo', deductionsHeaderX, yPos);
          deductionsHeaderX += deductionsMemoColWidth + deductionsColPadding;
          doc.text('Amount', deductionsHeaderX, yPos);
          deductionsHeaderX += deductionsAmountColWidth + deductionsColPadding;
          doc.text('Per', deductionsHeaderX, yPos);
          deductionsHeaderX += deductionsPerColWidth + deductionsColPadding;
          doc.text('GST', deductionsHeaderX, yPos);
          deductionsHeaderX += deductionsGstColWidth + deductionsColPadding;
          doc.text('Total (CAD)', deductionsHeaderX, yPos);
          yPos += 5;
          
          // Full line below headers (spanning full page width from margin to margin)
          doc.setDrawColor(0, 0, 0);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
          
          // Deductions data rows (from backend response, same format as additions)
          doc.setFontSize(5.5);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          deductionsArray.forEach((deduction: any) => {
            checkPageBreak(8);
            const rowStartY = yPos;
            let rowX = deductionsTableStartX;
            
            // Load (empty in examples, but check if it exists)
            const loadNum = deduction.loadNumber || '';
            doc.text(loadNum || '', rowX, rowStartY);
            rowX += deductionsLoadColWidth + deductionsColPadding;
            
            // Date (format: MM/DD/YYYY) - use loadDate if available, otherwise empty
            const dedDate = deduction.loadDate || deduction.date ? 
              new Date(deduction.loadDate || deduction.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
            if (dedDate) {
              doc.text(dedDate, rowX, rowStartY);
            }
            rowX += deductionsDateColWidth + deductionsColPadding;
            
            // Memo (deduction description/type) - may wrap if long
            const memo = deduction.memo || deduction.type || deduction.description || '';
            let memoLines: string[] = [];
            let memoHeight = 4; // Default height for memo column
            if (memo) {
              memoLines = doc.splitTextToSize(memo, deductionsMemoColWidth - 2);
              memoLines.forEach((line: string, idx: number) => {
                doc.text(line, rowX, rowStartY + (idx * 4));
              });
              memoHeight = memoLines.length * 4;
            }
            const amountX = rowX + deductionsMemoColWidth + deductionsColPadding;
            const perX = amountX + deductionsAmountColWidth + deductionsColPadding;
            const gstX = perX + deductionsPerColWidth + deductionsColPadding;
            const totalX = gstX + deductionsGstColWidth + deductionsColPadding;
            
            // Amount (format: $XX.XX) - align to top of row
            const amount = deduction.amount || 0;
            doc.text(`$${amount.toFixed(2)}`, amountX, rowStartY);
            
            // Per (format: One Time, Monthly, etc.) - align to top of row
            const per = deduction.per || deduction.perUnit || 'One Time';
            doc.text(per, perX, rowStartY);
            
            // GST (format: $0.00) - align to top of row
            const gst = deduction.gst || 0;
            doc.text(`$${gst.toFixed(2)}`, gstX, rowStartY);
            
            // Total (CAD) (format: $XX.XX) - align to top of row
            const totalCAD = deduction.totalCAD || (deduction.amount || 0) + (deduction.gst || 0);
            doc.text(`$${totalCAD.toFixed(2)}`, totalX, rowStartY);
            
            // Calculate row height based on memo wrapping
            yPos += Math.max(6, memoHeight);
          });
        }
        
        // Summary section below deductions table
        yPos += 10; // Space after deductions table
        
        // Check for page break before summary
        checkPageBreak(50);
        
        // Full line after deductions table
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Calculate line width (35% of page width)
        const summaryLineWidth = (pageWidth - (margin * 2)) * 0.35;
        const summaryLineStartX = pageWidth - margin - summaryLineWidth;
        
        // "Amount" text on the right side
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text('Amount', pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        
        // First 35% width line (right-aligned)
        doc.setDrawColor(0, 0, 0);
        doc.line(summaryLineStartX, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Gross Pay (right-aligned) - format: "Gross Pay 2,159.64"
        // For drivers/owner operators: Calculate Gross Pay as sum of all trip amounts (CAD)
        let grossPay = 0;
        if (fullPaystub.tripDetails && Array.isArray(fullPaystub.tripDetails) && fullPaystub.tripDetails.length > 0) {
          // Sum all trip amounts (amountCAD) from tripDetails
          grossPay = fullPaystub.tripDetails.reduce((sum: number, trip: any) => {
            return sum + (trip.amountCAD || 0);
          }, 0);
        } else {
          // Fallback to summary/earnings if no trip details
          grossPay = fullPaystub.summary?.grossPay || fullPaystub.earnings?.totalEarnings || 0;
        }
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const grossPayText = `Gross Pay ${grossPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        doc.text(grossPayText, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        
        // Second 35% width line (right-aligned)
        doc.setDrawColor(0, 0, 0);
        doc.line(summaryLineStartX, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Additions (+) (right-aligned) - total of all additions - format: "Additions (+) 105.25"
        const additionsTotal = fullPaystub.additions && Array.isArray(fullPaystub.additions) && fullPaystub.additions.length > 0
          ? fullPaystub.additions.reduce((sum: number, add: any) => sum + (add.totalCAD || (add.amount || 0) + (add.gst || 0)), 0)
          : 0;
        const additionsText = `Additions (+) ${additionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        doc.text(additionsText, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        
        // Third 35% width line (right-aligned)
        doc.setDrawColor(0, 0, 0);
        doc.line(summaryLineStartX, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Deductions (-) (right-aligned) - total of driver profile deductions only (NOT tax deductions)
        // Calculate total deductions from deductions array (driver profile only)
        const driverDeductionsArray = Array.isArray(fullPaystub.deductions) 
          ? fullPaystub.deductions 
          : [];
        const totalDeductions = driverDeductionsArray.length > 0
          ? driverDeductionsArray.reduce((sum: number, ded: any) => sum + (ded.totalCAD || (ded.amount || 0) + (ded.gst || 0)), 0)
          : 0;
        
        const deductionsText = `Deductions (-) ${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        doc.text(deductionsText, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        
        // Full line
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Net Pay (label left, value right)
        // Net Pay = Gross Pay + Additions - Driver Deductions (tax deductions not included)
        // Calculate Net Pay: Gross Pay + Additions - Driver Deductions
        const calculatedNetPay = grossPay + additionsTotal - totalDeductions;
        // Use calculated Net Pay
        const netPay = calculatedNetPay;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        // "Net Pay" on the left
        doc.text('Net Pay', margin, yPos);
        // Value on the right
        const netPayText = `$${netPay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        doc.text(netPayText, pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        
        // Final full line
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
      }

      if (isEmployee) {
        // Employee format - Period table (matching image structure exactly)
        
        // Draw FIRST horizontal line
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Table header - BETWEEN the two lines
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const tableStartX = margin;
        const periodColWidth = 70;
        const rateColWidth = 35;
        const hoursColWidth = 30;
        const amountColWidth = 40;
        
        doc.text('Period', tableStartX, yPos);
        doc.text('Pay Rate', tableStartX + periodColWidth, yPos);
        doc.text('Hours', tableStartX + periodColWidth + rateColWidth, yPos);
        doc.text('Amount', tableStartX + periodColWidth + rateColWidth + hoursColWidth + amountColWidth, yPos, { align: 'right' });
        yPos += 5;
        
        // Draw SECOND horizontal line (below headers)
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;
        
        // Table row - VALUES below the second line
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const periodStart = new Date(fullPaystub.payPeriod.startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const periodEnd = new Date(fullPaystub.payPeriod.endDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const periodText = `${periodStart} - ${periodEnd}`;
        doc.text(periodText, tableStartX, yPos);
        
        // Calculate hourly rate and hours from payroll or user details
        const hourlyRate = fullPaystub.payrollId?.hourlyRate || 
                          fullPaystub.userId?.details?.payRate || 
                          fullPaystub.earnings?.hourlyRate || 
                          0;
        const totalHours = fullPaystub.payrollId?.totalHours || 
                          (fullPaystub.payrollId?.regularHours || 0) + (fullPaystub.payrollId?.overtimeHours || 0) ||
                          (fullPaystub.earnings?.regularHours || 0) + (fullPaystub.earnings?.overtimeHours || 0) ||
                          0;
        const grossAmount = fullPaystub.summary?.grossPay || fullPaystub.earnings?.totalEarnings || 0;
        
        doc.text(hourlyRate > 0 ? `$${hourlyRate.toFixed(2)}` : '-', tableStartX + periodColWidth, yPos);
        doc.text(totalHours > 0 ? totalHours.toFixed(2) : '-', tableStartX + periodColWidth + rateColWidth, yPos);
        doc.text(`$${grossAmount.toFixed(2)}`, tableStartX + periodColWidth + rateColWidth + hoursColWidth + amountColWidth, yPos, { align: 'right' });
        yPos += 10; // Space after table
        
        // Summary section - matching image structure
        const lineWidth = (pageWidth - margin * 2) * 0.35; // 35% width line
        const lineStartX = pageWidth - margin - lineWidth; // Right-aligned line
        
        // First 35% width line
        doc.setDrawColor(0, 0, 0);
        doc.line(lineStartX, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // "Amount" text below the line
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Amount', pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;
        
        // Line below "Amount" field (35% width, same as above)
        doc.setDrawColor(0, 0, 0);
        doc.line(lineStartX, yPos, pageWidth - margin, yPos);
        yPos += 6;
        
        // Gross Pay and value (both right side) with space between - same line
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const grossPayText = `Gross Pay    ${grossAmount.toFixed(2)}`;
        doc.text(grossPayText, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        
        // Full line below Gross Pay
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;
        
        // Net Pay (left aligned label, right aligned value with $)
        // Calculate Net Pay: Gross Pay - Total Deductions (which includes taxes)
        // totalDeductions from paystub already includes both deductions and taxes
        const totalDeductions = fullPaystub.deductions?.totalDeductions || fullPaystub.summary?.totalDeductions || 0;
        const calculatedNetPay = grossAmount - totalDeductions;
        // Use backend Net Pay (should already be correct), but verify with calculation
        const netPay = fullPaystub.summary?.netPay || calculatedNetPay || 0;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Net Pay', margin, yPos);
        doc.setFontSize(11);
        doc.text(`$${netPay.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
        yPos += 6;
        
        // Full line at the bottom
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
      }

      const fileName = `Paystub_${(fullPaystub.employeeName || fullPaystub.userId?.name || 'Unknown').replace(/\s+/g, '_')}_${fullPaystub.paystubId || fullPaystub._id.slice(-8)}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handleBulkDownload = async () => {
    if (filteredPaystubs.length === 0) {
      alert('No paystubs to download.');
      return;
    }

    setDownloadingBulk(true);
    try {
      // Download all paystubs sequentially using the same handleDownloadPDF logic
      // This ensures all paystubs use the same PDF format
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < filteredPaystubs.length; i++) {
        const paystub = filteredPaystubs[i];
        try {
          // Use the same handleDownloadPDF function to ensure consistent PDF format
          await handleDownloadPDF(paystub);
          successCount++;
          
          // Small delay between downloads to prevent browser blocking
          if (i < filteredPaystubs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        } catch (error) {
          console.error(`Error downloading paystub ${paystub._id}:`, error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        alert(`Successfully downloaded ${successCount} paystub(s).${errorCount > 0 ? ` ${errorCount} failed.` : ''}`);
      } else {
        alert('Failed to download paystubs. Please try again.');
      }
    } catch (error) {
      console.error('Error in bulk download:', error);
      alert('Error downloading paystubs. Please try again.');
    } finally {
      setDownloadingBulk(false);
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
                Gross Payroll
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
                  ? 'border-blue-600 !text-blue-600'
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
                  ? 'border-blue-600 !text-blue-600'
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
                  // Company drivers: must be a driver role AND companyFlag should be false
                  const role = p.employeeRole?.toLowerCase() || p.userId?.role?.toLowerCase() || '';
                  if (role !== 'driver') return false;
                  const companyFlag = p.userId?.companyFlag ?? p.userId?.details?.companyFlag ?? false;
                  return companyFlag === false;
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
                  // Owner operators: must be a driver role AND companyFlag should be true
                  const role = p.employeeRole?.toLowerCase() || p.userId?.role?.toLowerCase() || '';
                  if (role !== 'driver') return false;
                  const companyFlag = p.userId?.companyFlag ?? p.userId?.details?.companyFlag ?? false;
                  return companyFlag === true;
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

            {/* Bulk Download */}
            {filteredPaystubs.length > 0 && (
              <button
                onClick={handleBulkDownload}
                disabled={downloadingBulk}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {downloadingBulk ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Download All ({filteredPaystubs.length})
                  </>
                )}
              </button>
            )}

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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 !text-white rounded-lg font-medium transition-colors"
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
                    {activeTab !== 'employees' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee Code</th>
                    )}
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
                      {activeTab !== 'employees' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {paystub.employeeId || paystub.userId?.internalId || 'N/A'}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            paystub.employeeRole?.toLowerCase() === 'driver' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {paystub.employeeRole || paystub.userId?.role || 'N/A'}
                          </span>
                          {paystub.employeeRole?.toLowerCase() === 'driver' || paystub.userId?.role?.toLowerCase() === 'driver' ? (
                            (() => {
                              // Determine workType based on companyFlag (not stored workType which may be incorrect)
                              const companyFlag = paystub.userId?.companyFlag ?? paystub.userId?.details?.companyFlag ?? false;
                              // companyFlag=false = Company Driver, companyFlag=true = Owner Operator
                              const displayWorkType = companyFlag === false ? 'Driver' : 'Owner-Operator';
                              return (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                  {displayWorkType}
                                </span>
                              );
                            })()
                          ) : paystub.workType ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {paystub.workType}
                            </span>
                          ) : null}
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

