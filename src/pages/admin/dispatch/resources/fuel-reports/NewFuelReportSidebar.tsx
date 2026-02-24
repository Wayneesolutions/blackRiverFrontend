import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { CSSProperties, FC } from "react";
import { createFuelReport } from '../../../../../axios/api/dispatcher.places';
import { getFuelTypes, createFuelType, getUnits, createUnit, getFuelVendors, createFuelVendor } from '../../../../../axios/api/dispatcher.fuelreport';
import { FLEET_COLORS } from '../../../fleetMaintenance/colorUtils';
import AddressSearch from '../../../../../components/common/AddressSearch';

interface FleetUnitOption {
    id: string;
    unitNo: string;
    unitType?: string;
    makeModel?: string;
    licensePlate?: string;
}

interface NewFuelReportSidebarProps {
    isOpen: boolean;
    onClose: (shouldRefresh?: boolean) => void;
    units: FleetUnitOption[];
    unitsLoading: boolean;
    currentUser: any;
}

// US States
const US_STATES = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' }
];

const NewFuelReportSidebar: FC<NewFuelReportSidebarProps> = ({ isOpen, onClose, units, unitsLoading, currentUser }) => {
    const [formData, setFormData] = useState({
        reporter: '',
        state: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        latitude: '',
        longitude: '',
        fullAddress: '',
        unit: '',
        type: '',
        transactionAmount: '',
        currentOdometer: '',
        measurementUnit: '',
        currency: 'USA',
        date: new Date().toISOString().split('T')[0],
        fuelVendor: '',
        fuelAmount: '',
        status: 'pending',
    });

    const [openDetails, setOpenDetails] = useState(true);
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [fuelTypes, setFuelTypes] = useState<Array<{ _id: string; name: string }>>([]);
    const [loadingFuelTypes, setLoadingFuelTypes] = useState(false);
    const [showAddTypeModal, setShowAddTypeModal] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    const [addingType, setAddingType] = useState(false);
    const [measurementUnits, setMeasurementUnits] = useState<Array<{ _id: string; name: string }>>([]);
    const [loadingMeasurementUnits, setLoadingMeasurementUnits] = useState(false);
    const [showAddUnitModal, setShowAddUnitModal] = useState(false);
    const [newUnitName, setNewUnitName] = useState('');
    const [addingUnit, setAddingUnit] = useState(false);
    const [fuelVendors, setFuelVendors] = useState<Array<{ _id: string; name: string }>>([]);
    const [loadingFuelVendors, setLoadingFuelVendors] = useState(false);
    const [showAddVendorModal, setShowAddVendorModal] = useState(false);
    const [newVendorName, setNewVendorName] = useState('');
    const [addingVendor, setAddingVendor] = useState(false);

    const { focusRingStyle } = useMemo(
        () =>
            ({
                '--tw-ring-color': FLEET_COLORS.primary
            }) as CSSProperties & { '--tw-ring-color': string },
        []
    );

    const reporterId = currentUser?._id || currentUser?.userData?._id || '';
    const reporterName =
        currentUser?.name ||
        currentUser?.userData?.name ||
        [currentUser?.userData?.firstName, currentUser?.userData?.lastName].filter(Boolean).join(' ').trim() ||
        'N/A';
    const reporterEmail = currentUser?.email || currentUser?.userData?.email || '—';

    const formatUnitLabel = (unit: FleetUnitOption) => {
        const base = [unit.unitNo, unit.makeModel].filter(Boolean).join(' - ');
        return unit.unitType ? `${base} (${unit.unitType})` : base || 'Unit';
    };

    // Fetch fuel types
    const fetchFuelTypes = useCallback(async () => {
        setLoadingFuelTypes(true);
        try {
            const response = await getFuelTypes();
            if (response?.success) {
                setFuelTypes(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching fuel types:', error);
        } finally {
            setLoadingFuelTypes(false);
        }
    }, []);

    // Fetch measurement units
    const fetchMeasurementUnits = useCallback(async () => {
        setLoadingMeasurementUnits(true);
        try {
            const response = await getUnits();
            if (response?.success) {
                setMeasurementUnits(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching measurement units:', error);
        } finally {
            setLoadingMeasurementUnits(false);
        }
    }, []);

    // Fetch fuel vendors
    const fetchFuelVendors = useCallback(async () => {
        setLoadingFuelVendors(true);
        try {
            const response = await getFuelVendors();
            if (response?.success) {
                setFuelVendors(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching fuel vendors:', error);
        } finally {
            setLoadingFuelVendors(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchFuelTypes();
            fetchMeasurementUnits();
            fetchFuelVendors();
            setFormData({
                reporter: reporterId,
                state: '',
                address: '',
                city: '',
                postalCode: '',
                country: '',
                latitude: '',
                longitude: '',
                fullAddress: '',
                unit: '',
                type: '',
                transactionAmount: '',
                currentOdometer: '',
                measurementUnit: '',
                currency: 'USA',
                date: new Date().toISOString().split('T')[0],
                fuelVendor: '',
                fuelAmount: '',
                status: 'pending',
            });
        }
    }, [isOpen, reporterId, fetchFuelTypes, fetchMeasurementUnits, fetchFuelVendors]);

    // Handle adding new fuel type
    const handleAddNewType = async () => {
        if (!newTypeName.trim()) {
            alert('Please enter a fuel type name');
            return;
        }

        setAddingType(true);
        try {
            const response = await createFuelType(newTypeName.trim());
            if (response?.success) {
                // Refresh fuel types list
                await fetchFuelTypes();
                // Close modal and reset
                setShowAddTypeModal(false);
                setNewTypeName('');
                // Select the newly created type
                if (response.data) {
                    setFormData(prev => ({
                        ...prev,
                        type: response.data.name
                    }));
                }
            } else {
                alert(response?.message || 'Failed to create fuel type');
            }
        } catch (error: any) {
            alert(error?.message || 'Failed to create fuel type');
        } finally {
            setAddingType(false);
        }
    };

    // Handle adding new measurement unit
    const handleAddNewUnit = async () => {
        if (!newUnitName.trim()) {
            alert('Please enter a unit name');
            return;
        }

        setAddingUnit(true);
        try {
            const response = await createUnit(newUnitName.trim());
            if (response?.success) {
                // Refresh measurement units list
                await fetchMeasurementUnits();
                // Close modal and reset
                setShowAddUnitModal(false);
                setNewUnitName('');
                // Select the newly created unit
                if (response.data) {
                    setFormData(prev => ({
                        ...prev,
                        measurementUnit: response.data.name
                    }));
                }
            } else {
                alert(response?.message || 'Failed to create unit');
            }
        } catch (error: any) {
            alert(error?.message || 'Failed to create unit');
        } finally {
            setAddingUnit(false);
        }
    };

    // Handle adding new fuel vendor
    const handleAddNewVendor = async () => {
        if (!newVendorName.trim()) {
            alert('Please enter a fuel vendor name');
            return;
        }

        setAddingVendor(true);
        try {
            const response = await createFuelVendor(newVendorName.trim());
            if (response?.success) {
                // Refresh fuel vendors list
                await fetchFuelVendors();
                // Close modal and reset
                setShowAddVendorModal(false);
                setNewVendorName('');
                // Select the newly created vendor
                if (response.data) {
                    setFormData(prev => ({
                        ...prev,
                        fuelVendor: response.data.name
                    }));
                }
            } else {
                alert(response?.message || 'Failed to create fuel vendor');
            }
        } catch (error: any) {
            alert(error?.message || 'Failed to create fuel vendor');
        } finally {
            setAddingVendor(false);
        }
    };

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.unit) {
            alert('Please select a unit');
            return;
        }

        if (!formData.fullAddress && !formData.state) {
            alert('Please select a location');
            return;
        }

        if (!formData.type || !formData.type.trim()) {
            alert('Please select a fuel type');
            return;
        }

        try {
            setLoadingSubmit(true);
            const payload = {
                reporter: reporterId || formData.reporter,
                state: formData.state,
                address: formData.address || formData.fullAddress,
                location: {
                    address: formData.fullAddress || formData.address || '',
                    latitude: formData.latitude || '',
                    longitude: formData.longitude || ''
                },
                unit: formData.unit,
                type: formData.type,
                transactionAmount: formData.transactionAmount ? parseFloat(formData.transactionAmount) : null,
                currentOdometer: formData.currentOdometer || null,
                measurementUnit: formData.measurementUnit,
                currency: formData.currency,
                date: formData.date || new Date().toISOString(),
                fuelVendor: formData.fuelVendor,
                fuelAmount: formData.fuelAmount ? parseFloat(formData.fuelAmount) : null,
                status: formData.status || 'pending',
            };
            const response = await createFuelReport(payload);
            if (!response?.success) {
                throw new Error(response?.message || 'Failed to create fuel report');
            }
            setLoadingSubmit(false);
            onClose(true);
        } catch (error: any) {
            console.error('Error creating fuel report:', error);
            alert(error?.message || 'Failed to create fuel report. Please try again.');
            setLoadingSubmit(false);
        }
    };

    if (!isOpen) return null;

    const handleClose = () => {
        onClose(false);
    };

    return (
        <>
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={handleClose}></div>

            <div className="fixed right-0 top-0 h-full w-full sm:w-[600px] bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex-shrink-0" style={{ background: FLEET_COLORS.gradient }}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-white">New Fuel Report</h2>
                        <button onClick={handleClose} className="text-white/80 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                    <div className="bg-gray-50 p-4 rounded-md shadow-sm">
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4"
                            onClick={() => setOpenDetails(!openDetails)}
                        >
                            <h3 className="text-lg font-medium text-gray-900">Fuel Report Details</h3>
                            <svg
                                className={`w-5 h-5 text-gray-500 transform transition-transform ${openDetails ? "rotate-180" : ""}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>

                        {openDetails && (
                            <div className="space-y-4">
                                <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                                    <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Reporter</p>
                                    <p className="text-gray-900 font-semibold">{reporterName}</p>
                                    <p className="text-xs text-gray-500">{reporterEmail}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                                    <AddressSearch
                                        placeholder="Search for an address..."
                                        value={formData.fullAddress}
                                        onAddressSelect={(addressData) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                state: addressData.state || '',
                                                address: addressData.address || '',
                                                city: addressData.city || '',
                                                postalCode: addressData.postalCode || '',
                                                country: addressData.country || '',
                                                latitude: addressData.latitude || '',
                                                longitude: addressData.longitude || '',
                                                fullAddress: addressData.fullAddress || ''
                                            }));
                                        }}
                                        onChange={(value) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                fullAddress: value
                                            }));
                                        }}
                                        className="w-full"
                                    />
                                    {formData.state && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Selected: {formData.state} {formData.city && `- ${formData.city}`}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit <span className="text-red-500">*</span></label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    >
                                        <option value="">Select Unit</option>
                                        {unitsLoading ? (
                                            <option>Loading units...</option>
                                        ) : (
                                            units?.map(unit => (
                                                <option key={unit.id} value={unit.id}>
                                                    {formatUnitLabel(unit)}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
                                        >
                                            <option value="">Select Fuel Type</option>
                                            {loadingFuelTypes ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                fuelTypes.map((ft) => (
                                                    <option key={ft._id} value={ft.name}>
                                                        {ft.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddTypeModal(true);
                                                setNewTypeName('');
                                            }}
                                            className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors whitespace-nowrap"
                                            title="Add new fuel type"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="transactionAmount"
                                        value={formData.transactionAmount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Odometer</label>
                                    <input
                                        type="text"
                                        name="currentOdometer"
                                        value={formData.currentOdometer}
                                        onChange={handleInputChange}
                                        placeholder="Enter odometer reading"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <div className="flex gap-2">
                                        <select
                                            name="measurementUnit"
                                            value={formData.measurementUnit}
                                            onChange={handleInputChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
                                        >
                                            <option value="">Select Unit</option>
                                            {loadingMeasurementUnits ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                measurementUnits.map((u) => (
                                                    <option key={u._id} value={u.name}>
                                                        {u.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddUnitModal(true);
                                                setNewUnitName('');
                                            }}
                                            className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors whitespace-nowrap"
                                            title="Add new unit"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                                    <select
                                        name="currency"
                                        value={formData.currency}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    >
                                        <option value="USA">USA</option>
                                        <option value="CAD">CAD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Vendor</label>
                                    <div className="flex gap-2">
                                        <select
                                            name="fuelVendor"
                                            value={formData.fuelVendor}
                                            onChange={handleInputChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                            style={focusRingStyle}
                                        >
                                            <option value="">Select Fuel Vendor</option>
                                            {loadingFuelVendors ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                fuelVendors.map((v) => (
                                                    <option key={v._id} value={v.name}>
                                                        {v.name}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddVendorModal(true);
                                                setNewVendorName('');
                                            }}
                                            className="px-3 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors whitespace-nowrap"
                                            title="Add new fuel vendor"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="fuelAmount"
                                        value={formData.fuelAmount}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                    <button
                        onClick={handleClose}
                        disabled={loadingSubmit}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loadingSubmit}
                        className="px-6 py-2 rounded-lg !text-white font-semibold transition-colors disabled:opacity-60"
                        style={{ background: FLEET_COLORS.gradient }}
                    >
                        {loadingSubmit ? 'Saving...' : 'Submit Fuel Report'}
                    </button>
                </div>
            </div>

            {/* Add Fuel Type Modal */}
            {showAddTypeModal && (
                <>
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[102]" onClick={() => setShowAddTypeModal(false)}></div>
                    <div className="fixed inset-0 flex items-center justify-center z-[103] px-4">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Fuel Type</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fuel Type Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                        placeholder="e.g., Diesel, Gasoline, Electric"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddNewType();
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowAddTypeModal(false);
                                            setNewTypeName('');
                                        }}
                                        disabled={addingType}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddNewType}
                                        disabled={addingType || !newTypeName.trim()}
                                        className="px-4 py-2 rounded-lg !text-white transition-colors disabled:opacity-60"
                                        style={{ background: FLEET_COLORS.gradient }}
                                    >
                                        {addingType ? 'Adding...' : 'Add Type'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Add Unit Modal */}
            {showAddUnitModal && (
                <>
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[102]" onClick={() => setShowAddUnitModal(false)}></div>
                    <div className="fixed inset-0 flex items-center justify-center z-[103] px-4">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Unit</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unit Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newUnitName}
                                        onChange={(e) => setNewUnitName(e.target.value)}
                                        placeholder="e.g., L, gal, ml"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddNewUnit();
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowAddUnitModal(false);
                                            setNewUnitName('');
                                        }}
                                        disabled={addingUnit}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddNewUnit}
                                        disabled={addingUnit || !newUnitName.trim()}
                                        className="px-4 py-2 rounded-lg !text-white transition-colors disabled:opacity-60"
                                        style={{ background: FLEET_COLORS.gradient }}
                                    >
                                        {addingUnit ? 'Adding...' : 'Add Unit'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Add Fuel Vendor Modal */}
            {showAddVendorModal && (
                <>
                    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[102]" onClick={() => setShowAddVendorModal(false)}></div>
                    <div className="fixed inset-0 flex items-center justify-center z-[103] px-4">
                        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Fuel Vendor</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fuel Vendor Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newVendorName}
                                        onChange={(e) => setNewVendorName(e.target.value)}
                                        placeholder="e.g., Shell, Chevron, Petro-Canada"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:border-transparent"
                                        style={focusRingStyle}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddNewVendor();
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowAddVendorModal(false);
                                            setNewVendorName('');
                                        }}
                                        disabled={addingVendor}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddNewVendor}
                                        disabled={addingVendor || !newVendorName.trim()}
                                        className="px-4 py-2 rounded-lg !text-white transition-colors disabled:opacity-60"
                                        style={{ background: FLEET_COLORS.gradient }}
                                    >
                                        {addingVendor ? 'Adding...' : 'Add Vendor'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default NewFuelReportSidebar;
