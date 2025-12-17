import React, { useState, useMemo, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { Search, Filter, Calendar, Users, DollarSign, Clock, TrendingUp, MapPin, FileText, Eye, X, User as UserIcon, Mail, Briefcase, AlertCircle, Download } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import ExcelJS from 'exceljs';
import { fetchUserProfiles, type UserProfileDto, type UserProfilesTimeRange } from '../../../../axios/api/hr.userProfiles';
import { FLEET_COLORS } from '../../fleetMaintenance/colorUtils';

type TimePeriod = UserProfilesTimeRange;
type UserRole =
    | 'driver'
    | 'dispatcher'
    | 'hr'
    | 'reporter'
    | 'Maintenance Crew (Mechanics)'
    | 'Fleet Maintenance Manager'
    | 'Compliance Manager'
    | 'all';

type UserProfile = UserProfileDto & { role: UserRole | string };

type ProfileTimePeriod = '1week' | '2weeks' | '1month' | '6months' | '1year' | '2years';

const UserProfilesPortfolio: React.FC = () => {
    const ACCENT_PRIMARY = FLEET_COLORS.primary;
    const ACCENT_DARK = FLEET_COLORS.dark;
    const ACCENT_GRADIENT = FLEET_COLORS.gradient;
    const ACCENT_VARS = {
        '--accent-color': ACCENT_PRIMARY,
        '--accent-dark': ACCENT_DARK
    } as CSSProperties & { '--accent-color': string; '--accent-dark': string };
    const focusRingStyle = {
        '--tw-ring-color': ACCENT_PRIMARY
    } as CSSProperties & { '--tw-ring-color': string };

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('1month');
    const [selectedRole, setSelectedRole] = useState<UserRole>('all');
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requiresCompanySetup, setRequiresCompanySetup] = useState(false);
    const [lastFetchedRange, setLastFetchedRange] = useState<{ startDate?: string; endDate?: string } | null>(null);
    const [, setPagination] = useState<{ currentPage: number; totalItems: number; totalPages: number }>({
        currentPage: 1,
        totalItems: 0,
        totalPages: 0
    });
    const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
    const [showProfileSidebar, setShowProfileSidebar] = useState(false);
    const [profileTimePeriod, setProfileTimePeriod] = useState<ProfileTimePeriod>('1month');
    const PAGE_SIZE = 100;

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
        }, 400);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        let isMounted = true;

        const loadProfiles = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetchUserProfiles({
                    search: debouncedSearchTerm || undefined,
                    role: selectedRole !== 'all' ? selectedRole : undefined,
                    timeRange: timePeriod,
                    page: 1,
                    limit: PAGE_SIZE
                });

                if (!isMounted) return;

                if (response.success) {
                    // Filter out drivers for Employee Portfolio (drivers should use Driver Portfolio)
                    const filteredData = ((response.data as UserProfileDto[]) || []).filter(
                        (profile) => profile.role !== 'driver'
                    ) as UserProfile[];
                    setProfiles(filteredData);
                    setRequiresCompanySetup(!!response.requiresCompanySetup);
                    setPagination({
                        currentPage: response.pagination?.currentPage || 1,
                        totalItems: filteredData.length,
                        totalPages: response.pagination?.totalPages || 1
                    });
                    setLastFetchedRange(response.filters || null);
                } else {
                    setProfiles([]);
                    setRequiresCompanySetup(!!response.requiresCompanySetup);
                    setError(response.message || 'Failed to fetch employee profiles');
                }
            } catch (err: any) {
                if (!isMounted) return;
                const message = err?.response?.data?.message || err?.message || 'Failed to fetch employee profiles';
                setError(message);
                setProfiles([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadProfiles();

        return () => {
            isMounted = false;
        };
    }, [debouncedSearchTerm, selectedRole, timePeriod]);

    useEffect(() => {
        if (!selectedProfile) return;
        const updated = profiles.find((profile) => profile._id === selectedProfile._id);
        if (!updated) {
            setShowProfileSidebar(false);
            setSelectedProfile(null);
        } else if (updated !== selectedProfile) {
            setSelectedProfile(updated);
        }
    }, [profiles, selectedProfile]);

    const filteredProfiles = profiles;
    const showDriverColumns = selectedRole === 'driver';
    const summaryGridCols = showDriverColumns ? 'lg:grid-cols-5' : 'lg:grid-cols-4';
    const emptyStateMessage = requiresCompanySetup
        ? 'Complete your company setup to start seeing employee records.'
        : 'No employees found matching your criteria';

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        const totalUsers = filteredProfiles.length;
        const totalEarnings = filteredProfiles.reduce((sum, p) => sum + p.totalEarnings, 0);
        const totalHours = filteredProfiles.reduce((sum, p) => sum + p.totalHours, 0);
        const totalMiles = filteredProfiles.reduce((sum, p) => {
            if (p.role !== 'driver') return sum;
            return sum + (p.milesDriven || 0);
        }, 0);
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

    const formatNumber = (num?: number) => {
        return new Intl.NumberFormat('en-US').format(Math.round(num || 0));
    };

    const formatDateLabel = (date?: string) => {
        if (!date) return null;
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toLocaleDateString();
    };

    const fetchedRangeLabel = lastFetchedRange
        ? `${formatDateLabel(lastFetchedRange.startDate) || '—'} to ${formatDateLabel(lastFetchedRange.endDate) || '—'}`
        : null;

    const getRoleBadgeColor = (role: string) => {
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
            const worksheet = workbook.addWorksheet('Employee Profiles Portfolio');

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
            link.download = `Employee_Portfolio_${timePeriod}_${selectedRole === 'all' ? 'AllRoles' : selectedRole}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        <div
            className="min-h-screen p-6"
            style={{
                ...ACCENT_VARS,
                background: 'linear-gradient(135deg, #f8fafc 0%, rgba(1, 106, 178, 0.08) 45%, rgba(6, 63, 111, 0.12) 100%)',

            }}
        >
            <div className="w-full mx-auto p-2">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl shadow-lg" style={{ background: ACCENT_GRADIENT }}>
                                <Users className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1
                                    className="text-4xl font-bold bg-clip-text text-transparent"
                                    style={{ backgroundImage: ACCENT_GRADIENT }}
                                >
                                    Employee Portfolio
                                </h1>
                                <p className="text-gray-600 mt-1 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Comprehensive view of employee performance, payroll, and attendance
                                </p>
                                {fetchedRangeLabel && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Showing payroll & attendance data from {fetchedRangeLabel}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleExportToExcel}
                            className="flex items-center gap-2 px-6 py-3 !text-white rounded-lg shadow-lg transition-all duration-200 font-medium"
                            style={{ background: ACCENT_GRADIENT }}
                        >
                            <Download className="w-5 h-5" />
                            Export to Excel
                        </button>
                    </div>
                </div>

                {requiresCompanySetup && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                        Please complete your company setup to view and manage employee profiles.
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                <div
                    className={`grid grid-cols-1 md:grid-cols-2 ${summaryGridCols} gap-4 mb-6`}
                >
                    {/* Total Employees */}
                    <div className="rounded-lg p-4 bg-purple-50 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-purple-600 mb-0.5">
                                    Total Employees
                                </p>
                                <p className="text-2xl font-semibold text-purple-700">
                                    {summaryStats.totalUsers}
                                </p>
                            </div>
                            <Users className="text-purple-600" size={20} />
                        </div>
                    </div>

                    {/* Total Earnings */}
                    <div className="rounded-lg p-4 bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-green-600 mb-0.5">
                                    Total Earnings
                                </p>
                                <p className="text-xl font-semibold text-green-700 break-words">
                                    {formatCurrency(summaryStats.totalEarnings)}
                                </p>
                            </div>
                            <DollarSign className="text-green-600 flex-shrink-0" size={20} />
                        </div>
                    </div>

                    {/* Total Hours */}
                    <div className="rounded-lg p-4 bg-amber-50 border border-amber-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-amber-600 mb-0.5">
                                    Total Hours
                                </p>
                                <p className="text-2xl font-semibold text-amber-700">
                                    {formatNumber(summaryStats.totalHours)}
                                </p>
                            </div>
                            <Clock className="text-amber-600" size={20} />
                        </div>
                    </div>

                    {/* Driver Miles */}
                    {showDriverColumns && (
                        <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-orange-600 mb-0.5">
                                        Driver Miles
                                    </p>
                                    <p className="text-2xl font-semibold text-orange-700">
                                        {formatNumber(summaryStats.totalMiles)}
                                    </p>
                                </div>
                                <MapPin className="text-orange-600" size={20} />
                            </div>
                        </div>
                    )}

                    {/* Total Invoices */}
                    <div className="rounded-lg p-4 bg-indigo-50 border border-indigo-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-indigo-600 mb-0.5">
                                    Total Invoices
                                </p>
                                <p className="text-2xl font-semibold text-indigo-700">
                                    {summaryStats.totalInvoices}
                                </p>
                            </div>
                            <FileText className="text-indigo-600" size={20} />
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
                                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                                style={focusRingStyle}
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
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${timePeriod === period ? '!text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        style={timePeriod === period ? { background: ACCENT_GRADIENT } : undefined}
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
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                                style={focusRingStyle}
                            >
                                <option value="all">All Roles</option>
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

                {loading && (
                    <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-indigo-700">
                        Loading employee profiles...
                    </div>
                )}

                {/* User Profiles Table */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="text-white" style={{ background: ACCENT_GRADIENT }}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Employee</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Role</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Earnings</th>
                                    {showDriverColumns ? (
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
                                {loading ? (
                                    <tr>
                                        <td colSpan={showDriverColumns ? 10 : 7} className="px-6 py-12 text-center text-gray-500">
                                            Loading employee profiles...
                                        </td>
                                    </tr>
                                ) : filteredProfiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={showDriverColumns ? 10 : 7} className="px-6 py-12 text-center text-gray-500">
                                            {emptyStateMessage}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProfiles.map((profile) => (
                                        <tr key={profile._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                                        style={{ background: ACCENT_GRADIENT }}
                                                    >
                                                        {profile.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{profile.name}</p>
                                                        <p className="text-sm text-gray-500">{profile.email}</p>
                                                    </div>
                                                </div>
                                                {!showDriverColumns && profile.role === 'driver' && (
                                                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                                                        {profile.milesDriven != null && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 text-orange-500" />
                                                                {formatNumber(profile.milesDriven)} mi
                                                            </span>
                                                        )}
                                                        {profile.tripsCompleted != null && (
                                                            <span className="inline-flex items-center gap-1 text-[var(--accent-color)]">
                                                                <TrendingUp className="w-3 h-3" />
                                                                {formatNumber(profile.tripsCompleted)} trips
                                                            </span>
                                                        )}
                                                        {profile.invoices != null && (
                                                            <span className="inline-flex items-center gap-1">
                                                                <FileText className="w-3 h-3 text-indigo-500" />
                                                                {profile.invoices} invoices
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
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
                                            {showDriverColumns && (
                                                <>
                                                    <td className="px-6 py-4">
                                                        {profile.milesDriven != null ? (
                                                            <div className="flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-orange-500" />
                                                                <span className="font-medium text-gray-900">{formatNumber(profile.milesDriven)}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {profile.tripsCompleted != null ? (
                                                            <span className="font-medium text-gray-900">{formatNumber(profile.tripsCompleted)}</span>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {profile.invoices != null ? (
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
                                                    className="p-2 rounded-lg transition-colors text-[var(--accent-color)] hover:text-[var(--accent-dark)]"
                                                    style={{ backgroundColor: 'rgba(1, 106, 178, 0.08)' }}
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
                            <div className="sticky top-0  text-white p-6 z-10"
                                style={{
                                    background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                                }}>
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
                                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full mt-1 ${selectedProfile.citizenshipStatus === 'Citizen' ? 'bg-green-100 text-green-800' :
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
                                <div
                                    className="rounded-xl p-4"
                                    style={{ backgroundColor: 'rgba(1, 106, 178, 0.05)', border: '1px solid rgba(1, 106, 178, 0.2)' }}
                                >
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-[var(--accent-color)]" />
                                            <span className="text-sm font-semibold text-gray-700">Filter Period:</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(['1week', '2weeks', '1month', '6months', '1year', '2years'] as ProfileTimePeriod[]).map((period) => (
                                                <button
                                                    key={period}
                                                    onClick={() => setProfileTimePeriod(period)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${profileTimePeriod === period
                                                        ? '!text-white shadow-md'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                                                        }`}
                                                    style={profileTimePeriod === period ? { background: ACCENT_GRADIENT, borderColor: 'transparent' } : undefined}
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



