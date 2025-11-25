import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Users, DollarSign, Clock, TrendingUp, MapPin, FileText, Eye, X, User as UserIcon, Mail, Briefcase, AlertCircle, Download } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import ExcelJS from 'exceljs';

type TimePeriod = '1week' | '2weeks' | '1month';
type UserRole = 'driver' | 'dispatcher' | 'hr' | 'reporter' | 'Maintenance Crew (Mechanics)' | 'Fleet Maintenance Manager' | 'Compliance Manager' | 'all';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  // Payroll data
  totalEarnings: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  invoices: number; // Number of invoices/transactions
  // Driver-specific
  milesDriven?: number;
  tripsCompleted?: number;
  // Attendance data
  daysWorked: number;
  totalHours: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  // Additional details
  notes?: string;
  joinDate?: string;
  phone?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  citizenshipStatus?: 'Citizen' | 'Permanent Resident' | 'Work Permit' | 'Student Visa' | 'Visitor Visa';
  sinNumber?: string;
  dateOfBirth?: string;
}

// Static data for user profiles
const staticUserProfiles: UserProfile[] = [
  // Drivers
  {
    _id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    role: 'driver',
    totalEarnings: 12500.00,
    baseSalary: 8000.00,
    bonus: 2500.00,
    deductions: 2000.00,
    invoices: 15,
    milesDriven: 12500,
    tripsCompleted: 12,
    daysWorked: 20,
    totalHours: 160,
    presentDays: 18,
    absentDays: 1,
    lateDays: 1,
    leaveDays: 0,
    phone: '+1 (555) 123-4567',
    joinDate: '2023-01-15',
    address: '123 Main Street',
    city: 'Toronto',
    province: 'Ontario',
    postalCode: 'M5H 2N2',
    country: 'Canada',
    citizenshipStatus: 'Citizen',
    sinNumber: '123-456-789',
    dateOfBirth: '1985-05-15',
    notes: 'Excellent driver with consistent performance. Always on time and maintains good communication. Has completed all safety training courses.'
  },
  {
    _id: '2',
    name: 'Michael Johnson',
    email: 'michael.j@example.com',
    role: 'driver',
    totalEarnings: 9800.00,
    baseSalary: 7000.00,
    bonus: 1500.00,
    deductions: 1700.00,
    invoices: 11,
    milesDriven: 9800,
    tripsCompleted: 9,
    daysWorked: 18,
    totalHours: 144,
    presentDays: 17,
    absentDays: 0,
    lateDays: 1,
    leaveDays: 0,
    phone: '+1 (555) 234-5678',
    joinDate: '2023-03-20',
    address: '456 Oak Avenue',
    city: 'Vancouver',
    province: 'British Columbia',
    postalCode: 'V6B 1A1',
    country: 'Canada',
    citizenshipStatus: 'Permanent Resident',
    sinNumber: '234-567-890',
    dateOfBirth: '1988-08-22',
    notes: 'Reliable driver with good track record. Occasionally arrives late but makes up for it with excellent work quality.'
  },
  {
    _id: '3',
    name: 'David Williams',
    email: 'david.w@example.com',
    role: 'driver',
    totalEarnings: 11200.00,
    baseSalary: 7500.00,
    bonus: 2200.00,
    deductions: 1500.00,
    invoices: 13,
    milesDriven: 11200,
    tripsCompleted: 10,
    daysWorked: 19,
    totalHours: 152,
    presentDays: 18,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 1,
    phone: '+1 (555) 345-6789',
    joinDate: '2023-02-10',
    address: '789 Pine Street',
    city: 'Calgary',
    province: 'Alberta',
    postalCode: 'T2P 1J1',
    country: 'Canada',
    citizenshipStatus: 'Citizen',
    sinNumber: '345-678-901',
    dateOfBirth: '1983-11-30',
    notes: 'Top performer with excellent safety record. Takes initiative and shows strong leadership qualities.'
  },
  // Dispatchers
  {
    _id: '4',
    name: 'Sarah Davis',
    email: 'sarah.d@example.com',
    role: 'dispatcher',
    totalEarnings: 6500.00,
    baseSalary: 6000.00,
    bonus: 500.00,
    deductions: 0,
    invoices: 0,
    daysWorked: 22,
    totalHours: 176,
    presentDays: 21,
    absentDays: 0,
    lateDays: 1,
    leaveDays: 0,
    phone: '+1 (555) 456-7890',
    joinDate: '2022-11-05',
    address: '321 Elm Road',
    city: 'Montreal',
    province: 'Quebec',
    postalCode: 'H3A 0G4',
    country: 'Canada',
    citizenshipStatus: 'Citizen',
    sinNumber: '456-789-012',
    dateOfBirth: '1990-03-15',
    notes: 'Efficient dispatcher with excellent communication skills. Handles multiple routes simultaneously with precision.'
  },
  {
    _id: '5',
    name: 'Emily Brown',
    email: 'emily.b@example.com',
    role: 'dispatcher',
    totalEarnings: 6200.00,
    baseSalary: 5800.00,
    bonus: 400.00,
    deductions: 0,
    invoices: 0,
    daysWorked: 21,
    totalHours: 168,
    presentDays: 20,
    absentDays: 1,
    lateDays: 0,
    leaveDays: 0,
    phone: '+1 (555) 567-8901',
    joinDate: '2023-04-12',
    address: '654 Maple Drive',
    city: 'Ottawa',
    province: 'Ontario',
    postalCode: 'K1A 0A6',
    country: 'Canada',
    citizenshipStatus: 'Work Permit',
    sinNumber: '567-890-123',
    dateOfBirth: '1992-07-08',
    notes: 'New dispatcher showing great potential. Quick learner and adapts well to changing schedules.'
  },
  // HR
  {
    _id: '6',
    name: 'Robert Miller',
    email: 'robert.m@example.com',
    role: 'hr',
    totalEarnings: 7200.00,
    baseSalary: 7000.00,
    bonus: 200.00,
    deductions: 0,
    invoices: 0,
    daysWorked: 22,
    totalHours: 176,
    presentDays: 22,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    phone: '+1 (555) 678-9012',
    joinDate: '2022-08-15',
    address: '987 Cedar Lane',
    city: 'Toronto',
    province: 'Ontario',
    postalCode: 'M5J 2N8',
    country: 'Canada',
    citizenshipStatus: 'Citizen',
    sinNumber: '678-901-234',
    dateOfBirth: '1987-12-20',
    notes: 'Dedicated HR professional. Maintains excellent employee relations and ensures compliance with all policies.'
  },
  // Reporter
  {
    _id: '7',
    name: 'Jennifer Wilson',
    email: 'jennifer.w@example.com',
    role: 'reporter',
    totalEarnings: 5500.00,
    baseSalary: 5500.00,
    bonus: 0,
    deductions: 0,
    invoices: 0,
    daysWorked: 20,
    totalHours: 160,
    presentDays: 19,
    absentDays: 0,
    lateDays: 1,
    leaveDays: 0,
    phone: '+1 (555) 789-0123',
    joinDate: '2023-05-01',
    address: '147 Birch Street',
    city: 'Edmonton',
    province: 'Alberta',
    postalCode: 'T5J 2R1',
    country: 'Canada',
    citizenshipStatus: 'Permanent Resident',
    sinNumber: '789-012-345',
    dateOfBirth: '1991-04-25',
    notes: 'Detail-oriented reporter. Produces accurate and timely reports. Occasionally late but work quality is exceptional.'
  },
  // Maintenance Crew
  {
    _id: '8',
    name: 'James Anderson',
    email: 'james.a@example.com',
    role: 'Maintenance Crew (Mechanics)',
    totalEarnings: 6800.00,
    baseSalary: 6500.00,
    bonus: 300.00,
    deductions: 0,
    invoices: 0,
    daysWorked: 21,
    totalHours: 168,
    presentDays: 20,
    absentDays: 0,
    lateDays: 1,
    leaveDays: 0,
    phone: '+1 (555) 890-1234',
    joinDate: '2022-09-20',
    address: '258 Spruce Avenue',
    city: 'Winnipeg',
    province: 'Manitoba',
    postalCode: 'R3C 0V8',
    country: 'Canada',
    citizenshipStatus: 'Citizen',
    sinNumber: '890-123-456',
    dateOfBirth: '1986-09-12',
    notes: 'Experienced mechanic with extensive knowledge of fleet vehicles. Ensures all maintenance is completed on schedule.'
  },
  {
    _id: '9',
    name: 'Thomas Martinez',
    email: 'thomas.m@example.com',
    role: 'Maintenance Crew (Mechanics)',
    totalEarnings: 6400.00,
    baseSalary: 6200.00,
    bonus: 200.00,
    deductions: 0,
    invoices: 0,
    daysWorked: 20,
    totalHours: 160,
    presentDays: 19,
    absentDays: 1,
    lateDays: 0,
    leaveDays: 0,
    phone: '+1 (555) 901-2345',
    joinDate: '2023-01-08',
    address: '369 Willow Way',
    city: 'Halifax',
    province: 'Nova Scotia',
    postalCode: 'B3H 4R2',
    country: 'Canada',
    citizenshipStatus: 'Work Permit',
    sinNumber: '901-234-567',
    dateOfBirth: '1989-06-18',
    notes: 'Skilled mechanic specializing in engine diagnostics. Takes pride in keeping vehicles in optimal condition.'
  },
  // Fleet Maintenance Manager
  {
    _id: '10',
    name: 'Patricia Taylor',
    email: 'patricia.t@example.com',
    role: 'Fleet Maintenance Manager',
    totalEarnings: 8500.00,
    baseSalary: 8000.00,
    bonus: 500.00,
    deductions: 0,
    invoices: 0,
    daysWorked: 22,
    totalHours: 176,
    presentDays: 22,
    absentDays: 0,
    lateDays: 0,
    leaveDays: 0,
    phone: '+1 (555) 012-3456',
    joinDate: '2022-06-10',
    address: '741 Ash Boulevard',
    city: 'Toronto',
    province: 'Ontario',
    postalCode: 'M4B 1B3',
    country: 'Canada',
    citizenshipStatus: 'Citizen',
    sinNumber: '012-345-678',
    dateOfBirth: '1984-02-14',
    notes: 'Outstanding manager with strong organizational skills. Maintains excellent fleet uptime and manages team effectively.'
  },
  // Compliance Manager
  {
    _id: '11',
    name: 'Christopher Lee',
    email: 'christopher.l@example.com',
    role: 'Compliance Manager',
    totalEarnings: 8200.00,
    baseSalary: 7800.00,
    bonus: 400.00,
    deductions: 0,
    invoices: 0,
    daysWorked: 22,
    totalHours: 176,
    presentDays: 21,
    absentDays: 0,
    lateDays: 1,
    leaveDays: 0,
    phone: '+1 (555) 123-4567',
    joinDate: '2022-07-22',
    address: '852 Fir Court',
    city: 'Vancouver',
    province: 'British Columbia',
    postalCode: 'V5K 0A1',
    country: 'Canada',
    citizenshipStatus: 'Permanent Resident',
    sinNumber: '123-456-789',
    dateOfBirth: '1985-10-05',
    notes: 'Expert in regulatory compliance. Ensures all operations meet industry standards and regulations. Highly knowledgeable.'
  }
];

type ProfileTimePeriod = '1week' | '2weeks' | '1month' | '6months' | '1year' | '2years';

const UserProfilesPortfolio: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1month');
  const [selectedRole, setSelectedRole] = useState<UserRole>('all');
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showProfileSidebar, setShowProfileSidebar] = useState(false);
  const [profileTimePeriod, setProfileTimePeriod] = useState<ProfileTimePeriod>('1month');

  // Filter profiles based on search, time period, and role
  const filteredProfiles = useMemo(() => {
    let filtered = staticUserProfiles;

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(profile => profile.role === selectedRole);
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(profile =>
        profile.name.toLowerCase().includes(searchLower) ||
        profile.email.toLowerCase().includes(searchLower)
      );
    }

    // Time period filter (simulate different data based on period)
    // In a real app, this would filter actual date ranges
    // For static data, we'll apply a multiplier to simulate different periods
    const periodMultiplier: Record<TimePeriod, number> = {
      '1week': 0.25,
      '2weeks': 0.5,
      '1month': 1.0
    };

    const multiplier = periodMultiplier[timePeriod];
    filtered = filtered.map(profile => ({
      ...profile,
      totalEarnings: profile.totalEarnings * multiplier,
      baseSalary: profile.baseSalary * multiplier,
      bonus: profile.bonus * multiplier,
      deductions: profile.deductions * multiplier,
      invoices: Math.round(profile.invoices * multiplier),
      milesDriven: profile.milesDriven ? profile.milesDriven * multiplier : undefined,
      tripsCompleted: profile.tripsCompleted ? Math.round(profile.tripsCompleted * multiplier) : undefined,
      daysWorked: Math.round(profile.daysWorked * multiplier),
      totalHours: profile.totalHours * multiplier,
      presentDays: Math.round(profile.presentDays * multiplier),
      absentDays: Math.round(profile.absentDays * multiplier),
      lateDays: Math.round(profile.lateDays * multiplier),
      leaveDays: Math.round(profile.leaveDays * multiplier)
    }));

    return filtered;
  }, [searchTerm, timePeriod, selectedRole]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalUsers = filteredProfiles.length;
    const totalEarnings = filteredProfiles.reduce((sum, p) => sum + p.totalEarnings, 0);
    const totalHours = filteredProfiles.reduce((sum, p) => sum + p.totalHours, 0);
    const totalMiles = filteredProfiles.reduce((sum, p) => sum + (p.milesDriven || 0), 0);
    const totalInvoices = filteredProfiles.reduce((sum, p) => sum + p.invoices, 0);

    return {
      totalUsers,
      totalEarnings,
      totalHours,
      totalMiles,
      totalInvoices
    };
  }, [filteredProfiles]);

  const formatCurrency = (amount: number) => {
    return `CA$${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(amount)}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<string, string> = {
      driver: 'bg-blue-100 text-blue-800',
      dispatcher: 'bg-purple-100 text-purple-800',
      hr: 'bg-green-100 text-green-800',
      reporter: 'bg-yellow-100 text-yellow-800',
      'Maintenance Crew (Mechanics)': 'bg-orange-100 text-orange-800',
      'Fleet Maintenance Manager': 'bg-indigo-100 text-indigo-800',
      'Compliance Manager': 'bg-pink-100 text-pink-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const handleExportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('User Profiles Portfolio');

      // Define columns
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 25 },
        { header: 'Phone', key: 'phone', width: 18 },
        { header: 'Join Date', key: 'joinDate', width: 15 },
        { header: 'Date of Birth', key: 'dateOfBirth', width: 15 },
        { header: 'Address', key: 'address', width: 25 },
        { header: 'City', key: 'city', width: 15 },
        { header: 'Province', key: 'province', width: 15 },
        { header: 'Postal Code', key: 'postalCode', width: 12 },
        { header: 'Country', key: 'country', width: 12 },
        { header: 'Citizenship Status', key: 'citizenshipStatus', width: 20 },
        { header: 'SIN Number', key: 'sinNumber', width: 15 },
        { header: 'Total Earnings', key: 'totalEarnings', width: 15 },
        { header: 'Base Salary', key: 'baseSalary', width: 15 },
        { header: 'Bonus', key: 'bonus', width: 12 },
        { header: 'Deductions', key: 'deductions', width: 12 },
        { header: 'Invoices', key: 'invoices', width: 10 },
        { header: 'Miles Driven', key: 'milesDriven', width: 15 },
        { header: 'Trips Completed', key: 'tripsCompleted', width: 15 },
        { header: 'Days Worked', key: 'daysWorked', width: 12 },
        { header: 'Total Hours', key: 'totalHours', width: 12 },
        { header: 'Present Days', key: 'presentDays', width: 12 },
        { header: 'Absent Days', key: 'absentDays', width: 12 },
        { header: 'Late Days', key: 'lateDays', width: 12 },
        { header: 'Leave Days', key: 'leaveDays', width: 12 },
        { header: 'Notes', key: 'notes', width: 50 }
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6366F1' }
      };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      // Add data rows
      filteredProfiles.forEach((profile) => {
        worksheet.addRow({
          name: profile.name,
          email: profile.email,
          role: profile.role,
          phone: profile.phone || 'N/A',
          joinDate: profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'N/A',
          dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A',
          address: profile.address || 'N/A',
          city: profile.city || 'N/A',
          province: profile.province || 'N/A',
          postalCode: profile.postalCode || 'N/A',
          country: profile.country || 'N/A',
          citizenshipStatus: profile.citizenshipStatus || 'N/A',
          sinNumber: profile.sinNumber || 'N/A',
          totalEarnings: formatCurrency(profile.totalEarnings),
          baseSalary: formatCurrency(profile.baseSalary),
          bonus: formatCurrency(profile.bonus),
          deductions: formatCurrency(profile.deductions),
          invoices: profile.invoices || 0,
          milesDriven: profile.milesDriven ? formatNumber(profile.milesDriven) : 'N/A',
          tripsCompleted: profile.tripsCompleted || 'N/A',
          daysWorked: profile.daysWorked,
          totalHours: formatNumber(profile.totalHours),
          presentDays: profile.presentDays,
          absentDays: profile.absentDays,
          lateDays: profile.lateDays,
          leaveDays: profile.leaveDays,
          notes: profile.notes || 'N/A'
        });
      });

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        if (column.header) {
          column.width = Math.max(column.width || 10, column.header.length + 2);
        }
      });

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `User_Portfolio_${timePeriod}_${selectedRole === 'all' ? 'AllRoles' : selectedRole}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data to Excel. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  User Portfolio
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Comprehensive view of user performance, payroll, and attendance
                </p>
              </div>
            </div>
            <button
              onClick={handleExportToExcel}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 !text-white rounded-lg shadow-lg transition-all duration-200 font-medium"
            >
              <Download className="w-5 h-5" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">{summaryStats.totalUsers}</p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-gray-600 text-sm mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600 break-words leading-tight">{formatCurrency(summaryStats.totalEarnings)}</p>
              </div>
              <DollarSign className="text-green-600 flex-shrink-0" size={28} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(summaryStats.totalHours)}</p>
              </div>
              <Clock className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Miles</p>
                <p className="text-3xl font-bold text-orange-600">{formatNumber(summaryStats.totalMiles)}</p>
              </div>
              <MapPin className="text-orange-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Invoices</p>
                <p className="text-3xl font-bold text-indigo-600">{summaryStats.totalInvoices}</p>
              </div>
              <FileText className="text-indigo-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Time Period Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Period:</span>
              <div className="flex gap-2">
                {(['1week', '2weeks', '1month'] as TimePeriod[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timePeriod === period
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 !text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period === '1week' ? '1 Week' : period === '2weeks' ? '2 Weeks' : '1 Month'}
                  </button>
                ))}
              </div>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="driver">Driver</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="hr">HR</option>
                <option value="reporter">Reporter</option>
                <option value="Maintenance Crew (Mechanics)">Maintenance Crew</option>
                <option value="Fleet Maintenance Manager">Fleet Maintenance Manager</option>
                <option value="Compliance Manager">Compliance Manager</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Profiles Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Earnings</th>
                  {selectedRole === 'driver' || selectedRole === 'all' ? (
                    <>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Miles</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Trips</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Invoices</th>
                    </>
                  ) : null}
                  <th className="px-6 py-4 text-left text-sm font-semibold">Days Worked</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Hours</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Attendance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={selectedRole === 'driver' || selectedRole === 'all' ? 10 : 7} className="px-6 py-12 text-center text-gray-500">
                      No users found matching your criteria
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((profile) => (
                    <tr key={profile._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                            {profile.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{profile.name}</p>
                            <p className="text-sm text-gray-500">{profile.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(profile.role)}`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{formatCurrency(profile.totalEarnings)}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            <span>Base: {formatCurrency(profile.baseSalary)}</span>
                            {profile.bonus > 0 && <span className="ml-2 text-green-600">+{formatCurrency(profile.bonus)}</span>}
                            {profile.deductions > 0 && <span className="ml-2 text-red-600">-{formatCurrency(profile.deductions)}</span>}
                          </div>
                        </div>
                      </td>
                      {(selectedRole === 'driver' || selectedRole === 'all') && (
                        <>
                          <td className="px-6 py-4">
                            {profile.milesDriven ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-orange-500" />
                                <span className="font-medium text-gray-900">{formatNumber(profile.milesDriven)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {profile.tripsCompleted ? (
                              <span className="font-medium text-gray-900">{profile.tripsCompleted}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {profile.invoices > 0 ? (
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium text-gray-900">{profile.invoices}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{profile.daysWorked} days</p>
                          <div className="text-xs text-gray-500 mt-1 flex gap-2">
                            <span className="text-green-600">✓ {profile.presentDays}</span>
                            {profile.absentDays > 0 && <span className="text-red-600">✗ {profile.absentDays}</span>}
                            {profile.lateDays > 0 && <span className="text-yellow-600">⚠ {profile.lateDays}</span>}
                            {profile.leaveDays > 0 && <span className="text-blue-600">L {profile.leaveDays}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{formatNumber(profile.totalHours)} hrs</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {profile.presentDays > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                              <FaCheckCircle size={12} />
                              {profile.presentDays}
                            </span>
                          )}
                          {profile.absentDays > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                              <FaTimes size={12} />
                              {profile.absentDays}
                            </span>
                          )}
                          {profile.lateDays > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                              <FaExclamationCircle size={12} />
                              {profile.lateDays}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedProfile(profile);
                            setShowProfileSidebar(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Profile Detail Sidebar */}
        {showProfileSidebar && selectedProfile && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9998] transition-opacity"
              onClick={() => setShowProfileSidebar(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-out overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedProfile.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedProfile.name}</h2>
                      <p className="text-purple-100 flex items-center gap-2 mt-1">
                        <Briefcase className="w-4 h-4" />
                        {selectedProfile.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProfileSidebar(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
               

                {/* Basic Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-purple-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900 font-medium">{selectedProfile.email}</p>
                      </div>
                    </div>
                    {selectedProfile.phone && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-gray-900 font-medium">{selectedProfile.phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.joinDate && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Join Date</p>
                          <p className="text-gray-900 font-medium">{new Date(selectedProfile.joinDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.dateOfBirth && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Date of Birth</p>
                          <p className="text-gray-900 font-medium">{new Date(selectedProfile.dateOfBirth).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Address Information */}
                  {(selectedProfile.address || selectedProfile.city || selectedProfile.province || selectedProfile.postalCode) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedProfile.address && (
                          <div>
                            <p className="text-xs text-gray-500">Street Address</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.address}</p>
                          </div>
                        )}
                        {selectedProfile.city && (
                          <div>
                            <p className="text-xs text-gray-500">City</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.city}</p>
                          </div>
                        )}
                        {selectedProfile.province && (
                          <div>
                            <p className="text-xs text-gray-500">Province</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.province}</p>
                          </div>
                        )}
                        {selectedProfile.postalCode && (
                          <div>
                            <p className="text-xs text-gray-500">Postal Code</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.postalCode}</p>
                          </div>
                        )}
                        {selectedProfile.country && (
                          <div>
                            <p className="text-xs text-gray-500">Country</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.country}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Citizenship & Legal Information */}
                  {(selectedProfile.citizenshipStatus || selectedProfile.sinNumber) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Citizenship & Legal Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedProfile.citizenshipStatus && (
                          <div>
                            <p className="text-xs text-gray-500">Citizenship Status</p>
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-1 ${
                              selectedProfile.citizenshipStatus === 'Citizen' ? 'bg-green-100 text-green-800' :
                              selectedProfile.citizenshipStatus === 'Permanent Resident' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {selectedProfile.citizenshipStatus}
                            </span>
                          </div>
                        )}
                        {selectedProfile.sinNumber && (
                          <div>
                            <p className="text-xs text-gray-500">SIN Number</p>
                            <p className="text-gray-900 font-medium">{selectedProfile.sinNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
 {/* Time Period Filter */}
 <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-gray-700">Filter Period:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['1week', '2weeks', '1month', '6months', '1year', '2years'] as ProfileTimePeriod[]).map((period) => (
                        <button
                          key={period}
                          onClick={() => setProfileTimePeriod(period)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            profileTimePeriod === period
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 !text-white shadow-md'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {period === '1week' ? '1 Week' : 
                           period === '2weeks' ? '2 Weeks' : 
                           period === '1month' ? '1 Month' : 
                           period === '6months' ? '6 Months' : 
                           period === '1year' ? '1 Year' : '2 Years'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Payment Breakdown by Period */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Payment Breakdown - {profileTimePeriod === '1week' ? '1 Week' : profileTimePeriod === '2weeks' ? '2 Weeks' : profileTimePeriod === '1month' ? '1 Month' : profileTimePeriod === '6months' ? '6 Months' : profileTimePeriod === '1year' ? '1 Year' : '2 Years'}
                  </h3>
                  {(() => {
                    const multipliers: Record<ProfileTimePeriod, number> = {
                      '1week': 0.25,
                      '2weeks': 0.5,
                      '1month': 1.0,
                      '6months': 6.0,
                      '1year': 12.0,
                      '2years': 24.0
                    };
                    const multiplier = multipliers[profileTimePeriod];
                    const periodEarnings = selectedProfile.totalEarnings * multiplier;
                    const periodBase = selectedProfile.baseSalary * multiplier;
                    const periodBonus = selectedProfile.bonus * multiplier;
                    const periodDeductions = selectedProfile.deductions * multiplier;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                          <p className="text-sm font-medium text-green-600 mb-2">Total Earnings</p>
                          <p className="text-2xl font-bold text-green-700 mb-2">{formatCurrency(periodEarnings)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                          <p className="text-sm font-medium text-blue-600 mb-2">Base Salary</p>
                          <p className="text-2xl font-bold text-blue-700 mb-2">{formatCurrency(periodBase)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                          <p className="text-sm font-medium text-purple-600 mb-2">Bonus</p>
                          <p className="text-2xl font-bold text-purple-700 mb-2">{formatCurrency(periodBonus)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                          <p className="text-sm font-medium text-red-600 mb-2">Deductions</p>
                          <p className="text-2xl font-bold text-red-700 mb-2">{formatCurrency(periodDeductions)}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Attendance Details */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Attendance & Working Hours - {profileTimePeriod === '1week' ? '1 Week' : profileTimePeriod === '2weeks' ? '2 Weeks' : profileTimePeriod === '1month' ? '1 Month' : profileTimePeriod === '6months' ? '6 Months' : profileTimePeriod === '1year' ? '1 Year' : '2 Years'}
                  </h3>
                  {(() => {
                    const multipliers: Record<ProfileTimePeriod, number> = {
                      '1week': 0.25,
                      '2weeks': 0.5,
                      '1month': 1.0,
                      '6months': 6.0,
                      '1year': 12.0,
                      '2years': 24.0
                    };
                    const multiplier = multipliers[profileTimePeriod];
                    const periodDaysWorked = Math.round(selectedProfile.daysWorked * multiplier);
                    const periodPresentDays = Math.round(selectedProfile.presentDays * multiplier);
                    const periodAbsentDays = Math.round(selectedProfile.absentDays * multiplier);
                    const periodLateDays = Math.round(selectedProfile.lateDays * multiplier);
                    const periodLeaveDays = Math.round(selectedProfile.leaveDays * multiplier);
                    const periodTotalHours = selectedProfile.totalHours * multiplier;

                    return (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                            <p className="text-sm text-blue-600 mb-1">Working Days</p>
                            <p className="text-2xl font-bold text-blue-700">{periodDaysWorked}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                            <p className="text-sm text-green-600 mb-1">Present Days</p>
                            <p className="text-2xl font-bold text-green-700">{periodPresentDays}</p>
                          </div>
                          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <p className="text-sm text-red-600 mb-1">Absent Days</p>
                            <p className="text-2xl font-bold text-red-700">{periodAbsentDays}</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                            <p className="text-sm text-yellow-600 mb-1">Late Days</p>
                            <p className="text-2xl font-bold text-yellow-700">{periodLateDays}</p>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <p className="text-sm text-purple-600 mb-1">Total Hours</p>
                            <p className="text-2xl font-bold text-purple-700">{formatNumber(periodTotalHours)} hrs</p>
                          </div>
                          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                            <p className="text-sm text-indigo-600 mb-1">Leave Days</p>
                            <p className="text-2xl font-bold text-indigo-700">{periodLeaveDays}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Driver-Specific Information */}
                {(selectedProfile.role === 'driver' || selectedProfile.milesDriven) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-orange-600" />
                      Driver Performance - {profileTimePeriod === '1week' ? '1 Week' : profileTimePeriod === '2weeks' ? '2 Weeks' : profileTimePeriod === '1month' ? '1 Month' : profileTimePeriod === '6months' ? '6 Months' : profileTimePeriod === '1year' ? '1 Year' : '2 Years'}
                    </h3>
                    {(() => {
                      const multipliers: Record<ProfileTimePeriod, number> = {
                        '1week': 0.25,
                        '2weeks': 0.5,
                        '1month': 1.0,
                        '6months': 6.0,
                        '1year': 12.0,
                        '2years': 24.0
                      };
                      const multiplier = multipliers[profileTimePeriod];
                      const periodMiles = selectedProfile.milesDriven ? selectedProfile.milesDriven * multiplier : 0;
                      const periodTrips = selectedProfile.tripsCompleted ? Math.round(selectedProfile.tripsCompleted * multiplier) : 0;
                      const periodInvoices = Math.round(selectedProfile.invoices * multiplier);

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {selectedProfile.milesDriven && (
                            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                              <p className="text-sm text-orange-600 mb-1">Miles Driven</p>
                              <p className="text-2xl font-bold text-orange-700">{formatNumber(periodMiles)}</p>
                            </div>
                          )}
                          {selectedProfile.tripsCompleted && (
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                              <p className="text-sm text-blue-600 mb-1">Trips Completed</p>
                              <p className="text-2xl font-bold text-blue-700">{periodTrips}</p>
                            </div>
                          )}
                          {selectedProfile.invoices > 0 && (
                            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                              <p className="text-sm text-indigo-600 mb-1">Invoices</p>
                              <p className="text-2xl font-bold text-indigo-700">{periodInvoices}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Notes */}
                {selectedProfile.notes && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                      Notes
                    </h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-gray-700 leading-relaxed">{selectedProfile.notes}</p>
                    </div>
                  </div>
                )}

              
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserProfilesPortfolio;

