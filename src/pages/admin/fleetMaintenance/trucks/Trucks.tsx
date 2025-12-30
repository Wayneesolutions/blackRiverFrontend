import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Upload, ChevronUp, ChevronDown, Clock, X, Image as ImageIcon, Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface Truck {
    id: string;
    unitNumber: string;
    plateNumber: string;
    ownership: string;
    notes: string;
    operatingStatus: 'IN SERVICE' | 'OUT OF SERVICE' | 'MAINTENANCE';
    dispatchStatus: 'LOADED' | 'DELIVERED' | 'UNASSIGNED' | 'IN TRANSIT' | 'ASSIGNED';
    dispatchInfo: string;
    compliance: 'COMPLIANT' | 'NON-COMPLIANT' | 'EXPIRING SOON';
    category?: 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned';
}

// Static truck data based on the image
const staticTrucks: Truck[] = [
    {
        id: '1',
        unitNumber: '1304',
        plateNumber: 'CRS410',
        ownership: 'OWNER OPERATOR',
        notes: 'Has notes',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'LOADED',
        dispatchInfo: '12/31 TACOMA, WA',
        compliance: 'EXPIRING SOON',
        category: 'MB'
    },
    {
        id: '2',
        unitNumber: '1315',
        plateNumber: 'CRZ813',
        ownership: 'COMPANY ASSET',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'DELIVERED',
        dispatchInfo: '12/28 TORONTO, ON',
        compliance: 'COMPLIANT',
        category: 'MB'
    },
    {
        id: '3',
        unitNumber: '1319',
        plateNumber: 'CRZ782',
        ownership: 'COMPANY ASSET',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'UNASSIGNED',
        dispatchInfo: '12/31 N/A',
        compliance: 'COMPLIANT',
        category: 'AB'
    },
    {
        id: '4',
        unitNumber: '1320',
        plateNumber: 'CRZ783',
        ownership: 'OWNER OPERATOR',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'IN TRANSIT',
        dispatchInfo: '12/30 CHICAGO, IL',
        compliance: 'COMPLIANT',
        category: 'TX'
    },
    {
        id: '5',
        unitNumber: '1321',
        plateNumber: 'CRZ784',
        ownership: 'COMPANY ASSET',
        notes: 'Has notes',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'ASSIGNED',
        dispatchInfo: '12/31 DALLAS, TX',
        compliance: 'EXPIRING SOON',
        category: 'External'
    },
    {
        id: '6',
        unitNumber: '1322',
        plateNumber: 'CRZ785',
        ownership: 'COMPANY ASSET',
        notes: '',
        operatingStatus: 'IN SERVICE',
        dispatchStatus: 'LOADED',
        dispatchInfo: '12/31 WINNIPEG, MB',
        compliance: 'COMPLIANT',
        category: 'Unassigned'
    }
];

const Trucks: React.FC = () => {
    const { category: routeCategory } = useParams<{ category?: string }>();
    const navigate = useNavigate();
    
    // Initialize activeTab from route params, default to 'All'
    const getInitialTab = (cat?: string): 'All' | 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned' => {
        if (cat && ['MB', 'AB', 'TX', 'External', 'Unassigned'].includes(cat)) {
            return cat as 'All' | 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned';
        }
        return 'All';
    };
    
    const [activeTab, setActiveTab] = useState<'All' | 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned'>(getInitialTab(routeCategory));
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [complianceStatus, setComplianceStatus] = useState('All');
    const [category, setCategory] = useState('In Service Only');

    // Sidebar modal state
    const [showSidebar, setShowSidebar] = useState(false);
    const [activeStep, setActiveStep] = useState<'Details' | 'Inspections' | 'Documents' | 'Incidents' | 'Notes' | 'Payroll' | 'Deductions' | 'Additions'>('Details');
    const [inspectionType, setInspectionType] = useState<'One Time' | 'Recurring'>('One Time');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Inspections data
    const [oneTimeInspections, setOneTimeInspections] = useState<Array<{
        id: string;
        expiryDate: string;
        description: string;
        ignoreExpiration: boolean;
    }>>([]);

    const [recurringInspections, setRecurringInspections] = useState<Array<{
        id: string;
        scheduledOn: string;
        after: string;
        unit: string;
        description: string;
        ignoreExpiration: boolean;
    }>>([]);

    const [inspectionForm, setInspectionForm] = useState({
        expiryDate: '',
        description: '',
        ignoreExpiration: false,
        scheduledOn: '',
        after: '',
        unit: ''
    });

    // Documents data
    const [documentType, setDocumentType] = useState<'General' | 'Ownership' | 'Cab Card' | 'Plate' | 'Safety' | 'Insurance'>('General');
    const [documents, setDocuments] = useState<Record<string, Array<{
        id: string;
        expiryDate: string;
        description: string;
        file: File | null;
        ignoreExpiration: boolean;
    }>>>({
        General: [],
        Ownership: [],
        'Cab Card': [],
        Plate: [],
        Safety: [],
        Insurance: []
    });
    const [documentForm, setDocumentForm] = useState({
        expiryDate: '',
        description: '',
        file: null as File | null,
        ignoreExpiration: false
    });

    // Incidents data
    const [incidents, setIncidents] = useState<Array<{
        id: string;
        accidentNumber: string;
        driver: string;
        coDriver: string;
        location: string;
        date: string;
        time: string;
        weather: string;
        policeReport: string;
        accidentReport: string;
        thirdPartyInfo: string;
        files: File[];
    }>>([]);
    const [incidentForm, setIncidentForm] = useState({
        accidentNumber: '',
        driver: '',
        coDriver: '',
        location: '',
        date: '',
        time: '',
        weather: '',
        policeReport: '',
        accidentReport: '',
        thirdPartyInfo: '',
        files: [] as File[]
    });

    // Notes data
    const [notes, setNotes] = useState<Array<{
        id: string;
        note: string;
        category: string;
    }>>([]);
    const [noteForm, setNoteForm] = useState({
        note: '',
        category: 'Category'
    });

    // Payroll data
    const [paymentMethod, setPaymentMethod] = useState<'PAID PER MILE' | 'PAID PERCENT' | 'PAID BY TRIP' | 'PAID PER HOUR'>('PAID PER MILE');
    const [payrollForm, setPayrollForm] = useState({
        corporationName: '',
        fullAddress: '',
        driverName: '',
        email: '',
        alone: '0',
        team: '0',
        empty: '0',
        emptyTeam: '0',
        percentRate: '0',
        perTripAmount: '0',
        perHour: '0',
        companyPaysFuel: false,
        gstNo: '',
        customHst: ''
    });

    // Deductions data
    const [deductions, setDeductions] = useState<Array<{
        id: string;
        startDate: string;
        description: string;
        fee: string;
        interval: string;
        currency: string;
    }>>([]);
    const [deductionForm, setDeductionForm] = useState({
        startDate: '',
        description: '',
        fee: '0',
        interval: 'Interval',
        currency: 'CAD'
    });

    // Additions data
    const [additions, setAdditions] = useState<Array<{
        id: string;
        startDate: string;
        description: string;
        amount: string;
        interval: string;
        currency: string;
    }>>([]);
    const [additionForm, setAdditionForm] = useState({
        startDate: '',
        description: '',
        amount: '0',
        interval: 'Interval',
        currency: 'CAD'
    });

    // Form data
    const [formData, setFormData] = useState({
        unitNumber: '',
        vinNumber: '',
        plateNumber: '',
        registrationCountry: '',
        registrationProvince: '',
        make: '',
        model: '',
        year: '',
        type: 'Truck',
        weight: '0',
        uom: 'Kg',
        assetValue: '0',
        status: 'In Service',
        odometer: '',
        trackingKey: '',
        trailer: '',
        ownership: 'COMPANY ASSET' as 'COMPANY ASSET' | 'OWNER OPERATOR',
        operator: '',
        coOperator: '',
        fleet: ''
    });

    // Update activeTab when route changes
    useEffect(() => {
        const newTab = getInitialTab(routeCategory);
        setActiveTab(newTab);
    }, [routeCategory]);

    // Column filters
    const [filters, setFilters] = useState({
        unitNumber: '',
        plateNumber: '',
        ownership: 'All',
        notes: '',
        operatingStatus: 'All',
        dispatchStatus: 'All',
        dispatchInfo: '',
        compliance: 'All'
    });

    // Sort configuration
    const [sortConfig, setSortConfig] = useState<{ key: keyof Truck | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });

    // Get filtered trucks
    const getFilteredTrucks = () => {
        let filtered = [...staticTrucks];

        // Filter by active tab
        if (activeTab !== 'All') {
            filtered = filtered.filter(truck => truck.category === activeTab);
        }

        // Filter by search term (Unit #, Plate #, Make, VIN)
        if (searchTerm) {
            filtered = filtered.filter(truck =>
                truck.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                truck.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by compliance status
        if (complianceStatus !== 'All') {
            filtered = filtered.filter(truck => {
                if (complianceStatus === 'Compliant') return truck.compliance === 'COMPLIANT';
                if (complianceStatus === 'Non-Compliant') return truck.compliance === 'NON-COMPLIANT';
                if (complianceStatus === 'Expiring Soon') return truck.compliance === 'EXPIRING SOON';
                return true;
            });
        }

        // Filter by category
        if (category === 'In Service Only') {
            filtered = filtered.filter(truck => truck.operatingStatus === 'IN SERVICE');
        }

        // Apply column filters
        if (filters.unitNumber) {
            filtered = filtered.filter(t => t.unitNumber.toLowerCase().includes(filters.unitNumber.toLowerCase()));
        }
        if (filters.plateNumber) {
            filtered = filtered.filter(t => t.plateNumber.toLowerCase().includes(filters.plateNumber.toLowerCase()));
        }
        if (filters.ownership !== 'All') {
            filtered = filtered.filter(t => t.ownership === filters.ownership);
        }
        if (filters.notes) {
            filtered = filtered.filter(t => t.notes.toLowerCase().includes(filters.notes.toLowerCase()));
        }
        if (filters.operatingStatus !== 'All') {
            filtered = filtered.filter(t => t.operatingStatus === filters.operatingStatus);
        }
        if (filters.dispatchStatus !== 'All') {
            filtered = filtered.filter(t => t.dispatchStatus === filters.dispatchStatus);
        }
        if (filters.dispatchInfo) {
            filtered = filtered.filter(t => t.dispatchInfo.toLowerCase().includes(filters.dispatchInfo.toLowerCase()));
        }
        if (filters.compliance !== 'All') {
            filtered = filtered.filter(t => t.compliance === filters.compliance);
        }

        // Sort
        if (sortConfig.key) {
            filtered = [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key!] ?? '';
                const bValue = b[sortConfig.key!] ?? '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    };

    const filteredTrucks = getFilteredTrucks();

    // Count trucks by category
    const getCountByCategory = (category: string) => {
        if (category === 'All') return staticTrucks.length;
        return staticTrucks.filter(t => t.category === category).length;
    };

    const handleSort = (key: keyof Truck) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key: keyof Truck) => {
        if (sortConfig.key !== key) {
            return (
                <div className="flex flex-col">
                    <ChevronUp className="w-3 h-3 text-gray-400" />
                    <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
                </div>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-700" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-700" />
        );
    };

    const getStatusBadgeColor = (status: string, type: 'operating' | 'dispatch' | 'compliance') => {
        if (type === 'operating') {
            if (status === 'IN SERVICE') return 'bg-green-500 text-white';
            if (status === 'OUT OF SERVICE') return 'bg-red-500 text-white';
            if (status === 'MAINTENANCE') return 'bg-yellow-500 text-white';
        }
        if (type === 'dispatch') {
            if (status === 'LOADED') return 'bg-green-500 text-white';
            if (status === 'DELIVERED') return 'bg-green-500 text-white';
            if (status === 'UNASSIGNED') return 'bg-gray-500 text-white';
            if (status === 'IN TRANSIT') return 'bg-gray-500 text-white';
            if (status === 'ASSIGNED') return 'bg-orange-500 text-white';
        }
        if (type === 'compliance') {
            if (status === 'COMPLIANT') return 'bg-green-500 text-white';
            if (status === 'NON-COMPLIANT') return 'bg-red-500 text-white';
            if (status === 'EXPIRING SOON') return 'bg-orange-500 text-white';
        }
        return 'bg-gray-500 text-white';
    };

    const formatStatusText = (status: string, type: 'operating' | 'compliance') => {
        if (type === 'operating' && status === 'IN SERVICE') {
            return (
                <span className="block leading-tight">
                    <span className="block">IN</span>
                    <span className="block">SERVICE</span>
                </span>
            );
        }
        if (type === 'compliance' && status === 'EXPIRING SOON') {
            return (
                <span className="block leading-tight">
                    <span className="block">EXPIRING</span>
                    <span className="block">SOON</span>
                </span>
            );
        }
        return status;
    };

    // Navigation helper functions for sidebar steps
    const steps: Array<'Details' | 'Inspections' | 'Documents' | 'Incidents' | 'Notes'> = ['Details', 'Inspections', 'Documents', 'Incidents', 'Notes'];
    
    const getNextStep = () => {
        // If on a conditional step (Payroll, Deductions, Additions), return null (no next step)
        if (['Payroll', 'Deductions', 'Additions'].includes(activeStep)) {
            return null;
        }
        const currentIndex = steps.indexOf(activeStep);
        if (currentIndex < steps.length - 1) {
            return steps[currentIndex + 1];
        }
        return null;
    };

    const getPreviousStep = () => {
        // If on a conditional step (Payroll, Deductions, Additions), navigate back to Notes
        if (['Payroll', 'Deductions', 'Additions'].includes(activeStep)) {
            return 'Notes';
        }
        const currentIndex = steps.indexOf(activeStep);
        if (currentIndex > 0) {
            return steps[currentIndex - 1];
        }
        return null;
    };

    const handleNext = () => {
        const next = getNextStep();
        if (next) {
            setActiveStep(next);
        }
    };

    const handlePrevious = () => {
        const previous = getPreviousStep();
        if (previous) {
            setActiveStep(previous);
        }
    };

    return (
        <div className="min-h-screen bg-[#EDF8FF] p-6">
            <div className="max-w-full mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Trucks</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-700">({filteredTrucks.length})</span>
                            <button className="text-gray-600 hover:text-gray-900 transition-colors">
                                <Upload className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setShowSidebar(true)}
                                className="w-10 h-10 bg-[#42aeec] !text-white rounded-lg flex items-center justify-center hover:bg-[#1db5f5] transition-colors shadow-md"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {(['All', 'MB', 'AB', 'TX', 'External', 'Unassigned'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => {
                                    setActiveTab(tab);
                                    const basePath = '/admin/fleetmaintenance/trucks';
                                    if (tab === 'All') {
                                        navigate(basePath);
                                    } else {
                                        navigate(`${basePath}/${tab}`);
                                    }
                                }}
                                className={`flex-1 px-6 py-4 text-center font-medium transition-colors relative ${activeTab === tab
                                        ? 'text-[#42aeec] border-b-2 border-[#42aeec]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <div>
                                    <div className="font-semibold">
                                        {tab} ({getCountByCategory(tab)})
                                    </div>
                                    {tab === 'MB' && <div className="text-xs text-gray-500 mt-1">Home to Winnipeg Yard</div>}
                                    {tab === 'AB' && <div className="text-xs text-gray-500 mt-1">Home to Calgary Yard / Ocean, Impact freight services - Acheson</div>}
                                    {tab === 'TX' && <div className="text-xs text-gray-500 mt-1">Home to Laredo Yard - Santos</div>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search Input */}
                        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Unit #, Plate #, Make, VIN:</label>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            />
                           
                        </div>

                        {/* Global Filters */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Category:</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            >
                                <option value="In Service Only">In Service Only</option>
                                <option value="All">All</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Compliance Status:</label>
                            <select
                                value={complianceStatus}
                                onChange={(e) => setComplianceStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            >
                                <option value="All">All</option>
                                <option value="Compliant">Compliant</option>
                                <option value="Non-Compliant">Non-Compliant</option>
                                <option value="Expiring Soon">Expiring Soon</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Sort By:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent bg-white"
                            >
                                <option value="">Select</option>
                                <option value="unitNumber">Unit #</option>
                                <option value="plateNumber">Plate #</option>
                                <option value="dispatchInfo">Dispatch Info</option>
                            </select>
                        </div>

                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {/* Unit # */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Unit #</span>
                                            <button onClick={() => handleSort('unitNumber')} className="flex flex-col">
                                                {getSortIcon('unitNumber')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.unitNumber}
                                            onChange={(e) => setFilters({ ...filters, unitNumber: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Plate # */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Plate #</span>
                                            <button onClick={() => handleSort('plateNumber')} className="flex flex-col">
                                                {getSortIcon('plateNumber')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.plateNumber}
                                            onChange={(e) => setFilters({ ...filters, plateNumber: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Ownership */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Ownership</span>
                                            <button onClick={() => handleSort('ownership')} className="flex flex-col">
                                                {getSortIcon('ownership')}
                                            </button>
                                        </div>
                                        <select
                                            value={filters.ownership}
                                            onChange={(e) => setFilters({ ...filters, ownership: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="COMPANY ASSET">Company Asset</option>
                                            <option value="OWNER OPERATOR">Owner Operator</option>
                                        </select>
                                    </th>

                                    {/* Notes */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Notes</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.notes}
                                            onChange={(e) => setFilters({ ...filters, notes: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Operating Status */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Operating Status</span>
                                        </div>
                                        <select
                                            value={filters.operatingStatus}
                                            onChange={(e) => setFilters({ ...filters, operatingStatus: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="IN SERVICE">In Service</option>
                                            <option value="OUT OF SERVICE">Out of Service</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                        </select>
                                    </th>

                                    {/* Dispatch Status */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Dispatch Status</span>
                                        </div>
                                        <select
                                            value={filters.dispatchStatus}
                                            onChange={(e) => setFilters({ ...filters, dispatchStatus: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="LOADED">Loaded</option>
                                            <option value="DELIVERED">Delivered</option>
                                            <option value="UNASSIGNED">Unassigned</option>
                                            <option value="IN TRANSIT">In Transit</option>
                                            <option value="ASSIGNED">Assigned</option>
                                        </select>
                                    </th>

                                    {/* Dispatch Info */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Dispatch Info</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.dispatchInfo}
                                            onChange={(e) => setFilters({ ...filters, dispatchInfo: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        />
                                    </th>

                                    {/* Compliance */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Compliance</span>
                                        </div>
                                        <select
                                            value={filters.compliance}
                                            onChange={(e) => setFilters({ ...filters, compliance: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="COMPLIANT">Compliant</option>
                                            <option value="NON-COMPLIANT">Non-Compliant</option>
                                            <option value="EXPIRING SOON">Expiring Soon</option>
                                        </select>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTrucks.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                            No trucks found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTrucks.map((truck) => (
                                        <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.unitNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.plateNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.ownership}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {truck.notes ? (
                                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <span className="text-xs">!</span>
                                                    </div>
                                                ) : (
                                                    ''
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2.5 py-1.5 text-xs font-semibold rounded text-center min-w-[60px] ${getStatusBadgeColor(truck.operatingStatus, 'operating')}`}>
                                                    {formatStatusText(truck.operatingStatus, 'operating')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusBadgeColor(truck.dispatchStatus, 'dispatch')}`}>
                                                    {truck.dispatchStatus === 'LOADED' && <Clock className="w-3 h-3" />}
                                                    {truck.dispatchStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{truck.dispatchInfo}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2.5 py-1.5 text-xs font-semibold rounded text-center min-w-[70px] ${getStatusBadgeColor(truck.compliance, 'compliance')}`}>
                                                    {formatStatusText(truck.compliance, 'compliance')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* New Truck Sidebar Modal */}
            {showSidebar && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-all duration-300"
                        onClick={() => setShowSidebar(false)}
                    />
                    <div className="fixed top-0 right-0 h-full w-full sm:w-[75vw] lg:w-[70vw] xl:w-[65vw] bg-white shadow-2xl z-[101] flex overflow-hidden">
                        {/* Left Sidebar - Image Upload & Navigation */}
                        <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
                            {/* Image Upload Section */}
                            <div className="p-3 border-b border-gray-200 bg-white">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e: any) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    setSelectedImage(event.target?.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        };
                                        input.click();
                                    }}
                                >
                                    {selectedImage ? (
                                        <img src={selectedImage} alt="Truck" className="w-full h-20 object-cover rounded" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                                            <span className="text-xs text-gray-500">Select Image</span>
                                        </>
                                    )}
                                </div>
                                <button className="w-full !mt-2 px-3 py-1.5 bg-gray-700 !text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                                    UPLOAD
                                </button>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="flex-1 overflow-y-auto p-2">
                                <nav className="flex flex-col gap-1.5">
                                    {(['Details', 'Inspections', 'Documents', 'Incidents', 'Notes'] as const).map((step) => (
                                        <button
                                            key={step}
                                            onClick={() => setActiveStep(step)}
                                            className={`w-full px-3 py-2 text-left text-xs font-medium rounded-lg transition-colors ${activeStep === step
                                                ? 'bg-[#42aeec] !text-white shadow-sm'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            {step}
                                        </button>
                                    ))}
                                    {/* Conditional tabs - only show when Owner Operator is selected */}
                                    {formData.ownership === 'OWNER OPERATOR' && (
                                        <>
                                            {(['Payroll', 'Deductions', 'Additions'] as const).map((step) => (
                                                <button
                                                    key={step}
                                                    onClick={() => setActiveStep(step)}
                                                    className={`w-full px-3 py-2 text-left text-xs font-medium rounded-lg transition-colors ${activeStep === step
                                                        ? 'bg-[#42aeec] !text-white shadow-sm'
                                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                        }`}
                                                >
                                                    {step}
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </nav>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                                <h2 className="text-xl font-bold text-gray-900">New Truck</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            // Handle save logic here
                                            setShowSidebar(false);
                                        }}
                                        className="px-4 py-1.5 bg-gray-700 !text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                                    >
                                        SAVE
                                    </button>
                                    <button
                                        onClick={() => setShowSidebar(false)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {/* Details Step */}
                                {activeStep === 'Details' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit #<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Unit #"
                                                    value={formData.unitNumber}
                                                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    VIN
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="VIN"
                                                    value={formData.vinNumber}
                                                    onChange={(e) => setFormData({ ...formData, vinNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Plate #<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Plate #"
                                                    value={formData.plateNumber}
                                                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Registration Country<span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.registrationCountry}
                                                    onChange={(e) => setFormData({ ...formData, registrationCountry: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="">Select Registration Country</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Registration Province/State
                                                </label>
                                                <select
                                                    value={formData.registrationProvince}
                                                    onChange={(e) => setFormData({ ...formData, registrationProvince: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="">Select Registration Province/State</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Make<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Make"
                                                    value={formData.make}
                                                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Model<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Model"
                                                    value={formData.model}
                                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Year
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Year"
                                                    value={formData.year}
                                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Type<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.type}
                                                    readOnly
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Weight<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.weight}
                                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    UoM
                                                </label>
                                                <select
                                                    value={formData.uom}
                                                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="Kg">Kg</option>
                                                    <option value="Lbs">Lbs</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Asset Value
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.assetValue}
                                                    onChange={(e) => setFormData({ ...formData, assetValue: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Status<span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="In Service">In Service</option>
                                                    <option value="Out of Service">Out of Service</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Odometer
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Odometer"
                                                    value={formData.odometer}
                                                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tracking Key
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Tracking Key"
                                                    value={formData.trackingKey}
                                                    onChange={(e) => setFormData({ ...formData, trackingKey: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Trailer
                                                </label>
                                                <select
                                                    value={formData.trailer}
                                                    onChange={(e) => setFormData({ ...formData, trailer: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="">Select Trailer</option>
                                                </select>
                                            </div>
                                        </div>

                                        <h3 className="text-base font-semibold text-gray-900 mt-6">Ownership Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setFormData({ ...formData, ownership: 'COMPANY ASSET' });
                                                        // If switching to Company Asset and currently on conditional tabs, switch to Details
                                                        if (['Payroll', 'Deductions', 'Additions'].includes(activeStep)) {
                                                            setActiveStep('Details');
                                                        }
                                                    }}
                                                    className={`px-6 py-2 rounded-sm font-medium transition-colors ${formData.ownership === 'COMPANY ASSET'
                                                        ? 'bg-gray-700 !text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    COMPANY ASSET
                                                </button>
                                                <button
                                                    onClick={() => setFormData({ ...formData, ownership: 'OWNER OPERATOR' })}
                                                    className={`px-6 py-2 rounded-sm font-medium transition-colors ${formData.ownership === 'OWNER OPERATOR'
                                                        ? 'bg-gray-700 !text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    OWNER OPERATOR
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Operator
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Operator"
                                                            value={formData.operator}
                                                            onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Co-Operator
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Co-Operator"
                                                            value={formData.coOperator}
                                                            onChange={(e) => setFormData({ ...formData, coOperator: e.target.value })}
                                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Fleet
                                                    </label>
                                                    <select
                                                        value={formData.fleet}
                                                        onChange={(e) => setFormData({ ...formData, fleet: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                    >
                                                        <option value="">Select</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Inspections Step */}
                                {activeStep === 'Inspections' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Truck Inspections</h3>

                                        {/* Inspection Type Tabs */}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setInspectionType('One Time')}
                                                className={`px-6 py-2 rounded-lg font-medium transition-colors border-2 ${inspectionType === 'One Time'
                                                    ? 'bg-white border-gray-700 text-gray-900'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                One Time
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInspectionType('Recurring')}
                                                className={`px-6 py-2 rounded-lg font-medium transition-colors border-2 ${inspectionType === 'Recurring'
                                                    ? 'bg-white border-gray-700 text-gray-900'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                Recurring
                                            </button>
                                        </div>

                                        {/* One Time Inspections */}
                                        {inspectionType === 'One Time' && (
                                            <div className="space-y-4">
                                                <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                value={inspectionForm.expiryDate}
                                                                onChange={(e) => setInspectionForm({ ...inspectionForm, expiryDate: e.target.value })}
                                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            value={inspectionForm.description}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, description: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={inspectionForm.ignoreExpiration}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, ignoreExpiration: e.target.checked })}
                                                            className="w-4 h-4"
                                                        />
                                                        <label className="text-sm text-gray-700">Ignore Expiration</label>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (inspectionForm.expiryDate && inspectionForm.description) {
                                                                setOneTimeInspections([...oneTimeInspections, {
                                                                    id: Date.now().toString(),
                                                                    ...inspectionForm
                                                                }]);
                                                                setInspectionForm({ expiryDate: '', description: '', ignoreExpiration: false, scheduledOn: '', after: '', unit: '' });
                                                            }
                                                        }}
                                                        className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-500">Click row to edit • Drag to reorder</p>
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Expiry Date</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ignore Expiration</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {oneTimeInspections.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No Data</td>
                                                                </tr>
                                                            ) : (
                                                                oneTimeInspections.map((inspection) => (
                                                                    <tr key={inspection.id} className="border-t border-gray-200 hover:bg-gray-50">
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.expiryDate}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.description}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.ignoreExpiration ? 'Yes' : 'No'}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Recurring Inspections */}
                                        {inspectionType === 'Recurring' && (
                                            <div className="space-y-4">
                                                <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled On</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                value={inspectionForm.scheduledOn}
                                                                onChange={(e) => setInspectionForm({ ...inspectionForm, scheduledOn: e.target.value })}
                                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">After</label>
                                                        <input
                                                            type="text"
                                                            placeholder="After"
                                                            value={inspectionForm.after}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, after: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                                        <select
                                                            value={inspectionForm.unit}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, unit: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        >
                                                            <option value="">Select Unit</option>
                                                            <option value="Days">Days</option>
                                                            <option value="Weeks">Weeks</option>
                                                            <option value="Months">Months</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            value={inspectionForm.description}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, description: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={inspectionForm.ignoreExpiration}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, ignoreExpiration: e.target.checked })}
                                                            className="w-4 h-4"
                                                        />
                                                        <label className="text-sm text-gray-700">Ignore Expiration</label>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (inspectionForm.scheduledOn && inspectionForm.description) {
                                                                setRecurringInspections([...recurringInspections, {
                                                                    id: Date.now().toString(),
                                                                    scheduledOn: inspectionForm.scheduledOn,
                                                                    after: inspectionForm.after,
                                                                    unit: inspectionForm.unit,
                                                                    description: inspectionForm.description,
                                                                    ignoreExpiration: inspectionForm.ignoreExpiration
                                                                }]);
                                                                setInspectionForm({ expiryDate: '', description: '', ignoreExpiration: false, scheduledOn: '', after: '', unit: '' });
                                                            }
                                                        }}
                                                        className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Scheduled On</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">After</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Unit</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ignore Expiration</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {recurringInspections.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No Data</td>
                                                                </tr>
                                                            ) : (
                                                                recurringInspections.map((inspection) => (
                                                                    <tr key={inspection.id} className="border-t border-gray-200 hover:bg-gray-50">
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.scheduledOn}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.after}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.unit}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.description}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.ignoreExpiration ? 'Yes' : 'No'}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Documents Step */}
                                {activeStep === 'Documents' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Documents</h3>

                                        {/* Document Type Tabs */}
                                        <div className="flex gap-2 border-b border-gray-200">
                                            {(['General', 'Ownership', 'Cab Card', 'Plate', 'Safety', 'Insurance'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setDocumentType(type)}
                                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${documentType === type
                                                        ? 'border-gray-700 text-gray-900'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Document Form */}
                                        <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={documentForm.expiryDate}
                                                        onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={documentForm.description}
                                                    onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'file';
                                                        input.onchange = (e: any) => {
                                                            setDocumentForm({ ...documentForm, file: e.target.files[0] });
                                                        };
                                                        input.click();
                                                    }}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                                >
                                                    Select File <Upload className="w-4 h-4 inline ml-1" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={documentForm.ignoreExpiration}
                                                    onChange={(e) => setDocumentForm({ ...documentForm, ignoreExpiration: e.target.checked })}
                                                    className="w-4 h-4"
                                                />
                                                <label className="text-sm text-gray-700">Ignore Expiration</label>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (documentForm.expiryDate && documentForm.description) {
                                                        const newDoc = {
                                                            id: Date.now().toString(),
                                                            expiryDate: documentForm.expiryDate,
                                                            description: documentForm.description,
                                                            file: documentForm.file,
                                                            ignoreExpiration: documentForm.ignoreExpiration
                                                        };
                                                        setDocuments({
                                                            ...documents,
                                                            [documentType]: [...documents[documentType], newDoc]
                                                        });
                                                        setDocumentForm({ expiryDate: '', description: '', file: null, ignoreExpiration: false });
                                                    }
                                                }}
                                                className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Documents Table */}
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Expiry Date</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ignore Expiration</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {documents[documentType].length === 0 ? (
                                                        <tr>
                                                            <td colSpan={3} className="px-4 py-8 text-center text-gray-500">No Data</td>
                                                        </tr>
                                                    ) : (
                                                        documents[documentType].map((doc) => (
                                                            <tr key={doc.id} className="border-t border-gray-200 hover:bg-gray-50">
                                                                <td className="px-4 py-2 text-sm text-gray-900">{doc.expiryDate}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{doc.description}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{doc.ignoreExpiration ? 'Yes' : 'No'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Incidents Step */}
                                {activeStep === 'Incidents' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Claims / Accidents</h3>

                                        {/* Incident Form */}
                                        <div className="bg-gray-100 p-4 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Accident Number</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Accident Number"
                                                        value={incidentForm.accidentNumber}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, accidentNumber: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Driver"
                                                            value={incidentForm.driver}
                                                            onChange={(e) => setIncidentForm({ ...incidentForm, driver: e.target.value })}
                                                            className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Co-Driver</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            placeholder="Co-Driver"
                                                            value={incidentForm.coDriver}
                                                            onChange={(e) => setIncidentForm({ ...incidentForm, coDriver: e.target.value })}
                                                            className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Location"
                                                        value={incidentForm.location}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        <input
                                                            type="date"
                                                            value={incidentForm.date}
                                                            onChange={(e) => setIncidentForm({ ...incidentForm, date: e.target.value })}
                                                            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                                    <input
                                                        type="time"
                                                        value={incidentForm.time}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, time: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Weather</label>
                                                    <div className="relative">
                                                        <select
                                                            value={incidentForm.weather}
                                                            onChange={(e) => setIncidentForm({ ...incidentForm, weather: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none pr-8"
                                                        >
                                                            <option value="">Select Weather</option>
                                                            <option value="Clear">Clear</option>
                                                            <option value="Rainy">Rainy</option>
                                                            <option value="Snowy">Snowy</option>
                                                            <option value="Foggy">Foggy</option>
                                                            <option value="Windy">Windy</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Police Report #</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Police Report #"
                                                        value={incidentForm.policeReport}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, policeReport: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Accident Report #</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Accident Report #"
                                                        value={incidentForm.accidentReport}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, accidentReport: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Third Party Info</label>
                                                <textarea
                                                    placeholder="Third Party Info"
                                                    value={incidentForm.thirdPartyInfo}
                                                    onChange={(e) => setIncidentForm({ ...incidentForm, thirdPartyInfo: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] min-h-[100px] text-sm resize-none"
                                                />
                                            </div>
                                            <div className="flex items-end gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select files</label>
                                                    <div className="relative">
                                                        <Upload className="absolute left-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        <input
                                                            type="file"
                                                            multiple
                                                            onChange={(e) => {
                                                                const files = Array.from(e.target.files || []);
                                                                setIncidentForm({ ...incidentForm, files });
                                                            }}
                                                            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        if (incidentForm.accidentNumber && incidentForm.location && incidentForm.date) {
                                                            setIncidents([...incidents, {
                                                                id: Date.now().toString(),
                                                                ...incidentForm
                                                            }]);
                                                            setIncidentForm({
                                                                accidentNumber: '',
                                                                driver: '',
                                                                coDriver: '',
                                                                location: '',
                                                                date: '',
                                                                time: '',
                                                                weather: '',
                                                                policeReport: '',
                                                                accidentReport: '',
                                                                thirdPartyInfo: '',
                                                                files: []
                                                            });
                                                        }
                                                    }}
                                                    className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Incidents Table */}
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Claim/Accident No.</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Driver/Co-Driver</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date Time</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Weather</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {incidents.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">No Data</td>
                                                        </tr>
                                                    ) : (
                                                        incidents.map((incident) => (
                                                            <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 text-sm text-gray-900">{incident.accidentNumber}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {incident.driver || '-'}{incident.coDriver ? ` / ${incident.coDriver}` : ''}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{incident.location}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {incident.date ? `${incident.date}${incident.time ? ` ${incident.time}` : ''}` : '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{incident.weather || '-'}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Notes Step */}
                                {activeStep === 'Notes' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Notes</h3>

                                        {/* Note Form */}
                                        <div className="flex gap-4 items-end bg-gray-100 p-4 rounded-lg">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                                <input
                                                    type="text"
                                                    placeholder="Note"
                                                    value={noteForm.note}
                                                    onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                                <div className="relative">
                                                    <select
                                                        value={noteForm.category}
                                                        onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                                                        className="px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none min-w-[150px]"
                                                    >
                                                        <option value="Category">Category</option>
                                                        <option value="Safety">Safety</option>
                                                        <option value="Attitude">Attitude</option>
                                                        <option value="Ops">Ops</option>
                                                        <option value="General">General</option>
                                                        <option value="Maintenance">Maintenance</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (noteForm.note && noteForm.category !== 'Category') {
                                                        setNotes([...notes, {
                                                            id: Date.now().toString(),
                                                            note: noteForm.note,
                                                            category: noteForm.category
                                                        }]);
                                                        setNoteForm({ note: '', category: 'Category' });
                                                    }
                                                }}
                                                className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Notes Table */}
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Note</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {notes.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={2} className="px-4 py-12 text-center text-gray-500 text-sm">No Data</td>
                                                        </tr>
                                                    ) : (
                                                        notes.map((note) => (
                                                            <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 text-sm text-gray-900">{note.note}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{note.category}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Conditional steps - only show when Owner Operator is selected */}
                                {formData.ownership === 'OWNER OPERATOR' && (
                                    <>
                                        {/* Payroll Step */}
                                        {activeStep === 'Payroll' && (
                                            <div className="space-y-4">
                                                <div className="mb-2">
                                                    <span className="text-sm text-gray-600">Ownership: Owner Operator</span>
                                                </div>
                                                <h3 className="text-base font-semibold text-gray-900">Truck Ownership Information</h3>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Corportation Name<span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="Corportation Name"
                                                            value={payrollForm.corporationName}
                                                            onChange={(e) => setPayrollForm({ ...payrollForm, corporationName: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Full Address"
                                                            value={payrollForm.fullAddress}
                                                            onChange={(e) => setPayrollForm({ ...payrollForm, fullAddress: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Driver Name"
                                                            value={payrollForm.driverName}
                                                            onChange={(e) => setPayrollForm({ ...payrollForm, driverName: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                        <input
                                                            type="email"
                                                            placeholder="Email"
                                                            value={payrollForm.email}
                                                            onChange={(e) => setPayrollForm({ ...payrollForm, email: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Payment Method Tabs */}
                                                <div className="flex gap-2 mt-6">
                                                    {(['PAID PER MILE', 'PAID PERCENT', 'PAID BY TRIP', 'PAID PER HOUR'] as const).map((method) => (
                                                        <button
                                                            key={method}
                                                            onClick={() => setPaymentMethod(method)}
                                                            className={`px-4 py-2 rounded-sm font-medium transition-colors text-sm ${
                                                                paymentMethod === method
                                                                    ? 'bg-gray-700 !text-white'
                                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            {method}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Conditional Fields based on Payment Method */}
                                                {paymentMethod === 'PAID PER MILE' && (
                                                    <div className="space-y-4 mt-4">
                                                        <h4 className="text-sm font-semibold text-gray-900">$/Mile</h4>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    ALONE<span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={payrollForm.alone}
                                                                    onChange={(e) => setPayrollForm({ ...payrollForm, alone: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    TEAM<span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={payrollForm.team}
                                                                    onChange={(e) => setPayrollForm({ ...payrollForm, team: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    EMPTY<span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={payrollForm.empty}
                                                                    onChange={(e) => setPayrollForm({ ...payrollForm, empty: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                    EMPTY-TEAM<span className="text-red-500">*</span>
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={payrollForm.emptyTeam}
                                                                    onChange={(e) => setPayrollForm({ ...payrollForm, emptyTeam: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {paymentMethod === 'PAID PERCENT' && (
                                                    <div className="space-y-4 mt-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Percent Rate<span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={payrollForm.percentRate}
                                                                    onChange={(e) => setPayrollForm({ ...payrollForm, percentRate: e.target.value })}
                                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                                />
                                                                <span className="text-sm font-medium text-gray-700">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {paymentMethod === 'PAID BY TRIP' && (
                                                    <div className="space-y-4 mt-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Per Trip Amount<span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={payrollForm.perTripAmount}
                                                                onChange={(e) => setPayrollForm({ ...payrollForm, perTripAmount: e.target.value })}
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {paymentMethod === 'PAID PER HOUR' && (
                                                    <div className="space-y-4 mt-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                PER HOUR<span className="text-red-500">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={payrollForm.perHour}
                                                                onChange={(e) => setPayrollForm({ ...payrollForm, perHour: e.target.value })}
                                                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Common Fields */}
                                                <div className="grid grid-cols-2 gap-4 mt-4">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={payrollForm.companyPaysFuel}
                                                            onChange={(e) => setPayrollForm({ ...payrollForm, companyPaysFuel: e.target.checked })}
                                                            className="w-4 h-4"
                                                        />
                                                        <label className="text-sm text-gray-700">Company Pays Fuel</label>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">GST No.</label>
                                                        <input
                                                            type="text"
                                                            placeholder="GST No."
                                                            value={payrollForm.gstNo}
                                                            onChange={(e) => setPayrollForm({ ...payrollForm, gstNo: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Custom HST %</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Leave Empty To Use Company"
                                                            value={payrollForm.customHst}
                                                            onChange={(e) => setPayrollForm({ ...payrollForm, customHst: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Deductions Step */}
                                        {activeStep === 'Deductions' && (
                                            <div className="space-y-4">
                                                <h3 className="text-base font-semibold text-gray-900">Payroll Deductions</h3>

                                                {/* Deduction Form */}
                                                <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                value={deductionForm.startDate}
                                                                onChange={(e) => setDeductionForm({ ...deductionForm, startDate: e.target.value })}
                                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            value={deductionForm.description}
                                                            onChange={(e) => setDeductionForm({ ...deductionForm, description: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fee</label>
                                                        <input
                                                            type="text"
                                                            value={deductionForm.fee}
                                                            onChange={(e) => setDeductionForm({ ...deductionForm, fee: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                                                        <div className="relative">
                                                            <select
                                                                value={deductionForm.interval}
                                                                onChange={(e) => setDeductionForm({ ...deductionForm, interval: e.target.value })}
                                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none"
                                                            >
                                                                <option value="Interval">Interval</option>
                                                                <option value="Annual">Annual</option>
                                                                <option value="Monthly">Monthly</option>
                                                                <option value="Per Mile">Per Mile</option>
                                                                <option value="One Time">One Time</option>
                                                                <option value="Weekly">Weekly</option>
                                                                <option value="Biweekly">Biweekly</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                                        <div className="relative">
                                                            <select
                                                                value={deductionForm.currency}
                                                                onChange={(e) => setDeductionForm({ ...deductionForm, currency: e.target.value })}
                                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none"
                                                            >
                                                                <option value="CAD">CAD</option>
                                                                <option value="USD">USD</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (deductionForm.startDate && deductionForm.description && deductionForm.interval !== 'Interval') {
                                                                setDeductions([...deductions, {
                                                                    id: Date.now().toString(),
                                                                    ...deductionForm
                                                                }]);
                                                                setDeductionForm({ startDate: '', description: '', fee: '0', interval: 'Interval', currency: 'CAD' });
                                                            }
                                                        }}
                                                        className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Deductions Table */}
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Start Date</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Fee</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Interval</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Currency</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {deductions.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">No Data</td>
                                                                </tr>
                                                            ) : (
                                                                deductions.map((deduction) => (
                                                                    <tr key={deduction.id} className="hover:bg-gray-50 transition-colors">
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{deduction.startDate}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{deduction.description}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{deduction.fee}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{deduction.interval}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{deduction.currency}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Additions Step */}
                                        {activeStep === 'Additions' && (
                                            <div className="space-y-4">
                                                <h3 className="text-base font-semibold text-gray-900">Payroll Additions</h3>

                                                {/* Addition Form */}
                                                <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                value={additionForm.startDate}
                                                                onChange={(e) => setAdditionForm({ ...additionForm, startDate: e.target.value })}
                                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            value={additionForm.description}
                                                            onChange={(e) => setAdditionForm({ ...additionForm, description: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                                        <input
                                                            type="text"
                                                            value={additionForm.amount}
                                                            onChange={(e) => setAdditionForm({ ...additionForm, amount: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Interval</label>
                                                        <div className="relative">
                                                            <select
                                                                value={additionForm.interval}
                                                                onChange={(e) => setAdditionForm({ ...additionForm, interval: e.target.value })}
                                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none"
                                                            >
                                                                <option value="Interval">Interval</option>
                                                                <option value="Annual">Annual</option>
                                                                <option value="Monthly">Monthly</option>
                                                                <option value="Per Mile">Per Mile</option>
                                                                <option value="One Time">One Time</option>
                                                                <option value="Weekly">Weekly</option>
                                                                <option value="Biweekly">Biweekly</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                                        <div className="relative">
                                                            <select
                                                                value={additionForm.currency}
                                                                onChange={(e) => setAdditionForm({ ...additionForm, currency: e.target.value })}
                                                                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none"
                                                            >
                                                                <option value="CAD">CAD</option>
                                                                <option value="USD">USD</option>
                                                            </select>
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (additionForm.startDate && additionForm.description && additionForm.interval !== 'Interval') {
                                                                setAdditions([...additions, {
                                                                    id: Date.now().toString(),
                                                                    ...additionForm
                                                                }]);
                                                                setAdditionForm({ startDate: '', description: '', amount: '0', interval: 'Interval', currency: 'CAD' });
                                                            }
                                                        }}
                                                        className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>

                                                {/* Additions Table */}
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Start Date</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Interval</th>
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Currency</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {additions.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500 text-sm">No Data</td>
                                                                </tr>
                                                            ) : (
                                                                additions.map((addition) => (
                                                                    <tr key={addition.id} className="hover:bg-gray-50 transition-colors">
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{addition.startDate}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{addition.description}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{addition.amount}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{addition.interval}</td>
                                                                        <td className="px-4 py-3 text-sm text-gray-900">{addition.currency}</td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Navigation Buttons */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between gap-3">
                                        <button
                                            onClick={handlePrevious}
                                            disabled={!getPreviousStep()}
                                            className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                getPreviousStep()
                                                    ? 'bg-gray-700 !text-white hover:bg-gray-800'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                            Previous
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            disabled={!getNextStep()}
                                            className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                getNextStep()
                                                    ? 'bg-gray-700 !text-white hover:bg-gray-800'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            Next
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Trucks;
