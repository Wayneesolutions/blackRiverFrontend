import { useState, useEffect } from 'react';
import { X, Truck, MapPin, Calendar, Hash, Tag } from 'lucide-react';
import { createTrailer } from '../../../../../axios/api/distapcher';

interface NewTrailerSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewTrailerSidebar: React.FC<NewTrailerSidebarProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        internalId: '',
        trailer: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        plateNumber: '',
        vinNumber: '',
        capacity: '',
        type: 'dry_van',
        status: 'stopped',
        operationStatus: 'available',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when sidebar opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                internalId: '',
                trailer: '',
                make: '',
                model: '',
                year: new Date().getFullYear(),
                plateNumber: '',
                vinNumber: '',
                capacity: '',
                type: 'dry_van',
                status: 'stopped',
                operationStatus: 'available',
                address: ''
            });
            setErrors({});
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                    type === 'number' ? parseInt(value) || 0 : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.internalId.trim()) newErrors.internalId = 'Internal ID is required';
        if (!formData.trailer.trim()) newErrors.trailer = 'Trailer name is required';
        if (!formData.make.trim()) newErrors.make = 'Make is required';
        if (!formData.model.trim()) newErrors.model = 'Model is required';
        if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required';
        if (!formData.vinNumber.trim()) newErrors.vinNumber = 'VIN number is required';
        if (!formData.capacity.trim()) newErrors.capacity = 'Capacity is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await createTrailer(formData);

            if (response.success) {
                onClose();
            } else {
                alert(response.message || 'Failed to create trailer');
            }
        } catch (error) {
            console.error('Error creating trailer:', error);
            alert('Error creating trailer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
            
            <div className="relative ml-auto h-full w-full max-w-2xl bg-white shadow-xl">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <Truck className="h-6 w-6 text-blue-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Add New Trailer
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-md p-2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Internal ID *
                                        </label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="internalId"
                                                value={formData.internalId}
                                                onChange={handleInputChange}
                                                className={`pl-10 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.internalId ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="TRL-001"
                                            />
                                        </div>
                                        {errors.internalId && <p className="text-red-500 text-xs mt-1">{errors.internalId}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Trailer Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="trailer"
                                            value={formData.trailer}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.trailer ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="Trailer Name"
                                        />
                                        {errors.trailer && <p className="text-red-500 text-xs mt-1">{errors.trailer}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Make *
                                            </label>
                                            <input
                                                type="text"
                                                name="make"
                                                value={formData.make}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.make ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Freightliner"
                                            />
                                            {errors.make && <p className="text-red-500 text-xs mt-1">{errors.make}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Model *
                                            </label>
                                            <input
                                                type="text"
                                                name="model"
                                                value={formData.model}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.model ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="Cascadia"
                                            />
                                            {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Year
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="number"
                                                name="year"
                                                value={formData.year}
                                                onChange={handleInputChange}
                                                min="1900"
                                                max={new Date().getFullYear() + 1}
                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Registration Details */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Registration Details</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Plate Number *
                                        </label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="plateNumber"
                                                value={formData.plateNumber}
                                                onChange={handleInputChange}
                                                className={`pl-10 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                    errors.plateNumber ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                placeholder="ABC-123"
                                            />
                                        </div>
                                        {errors.plateNumber && <p className="text-red-500 text-xs mt-1">{errors.plateNumber}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            VIN Number *
                                        </label>
                                        <input
                                            type="text"
                                            name="vinNumber"
                                            value={formData.vinNumber}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.vinNumber ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="1HGBH41JXMN109186"
                                        />
                                        {errors.vinNumber && <p className="text-red-500 text-xs mt-1">{errors.vinNumber}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Capacity *
                                        </label>
                                        <input
                                            type="text"
                                            name="capacity"
                                            value={formData.capacity}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                errors.capacity ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            placeholder="26,000 lbs"
                                        />
                                        {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Trailer Type
                                        </label>
                                        <select
                                            name="type"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="dry_van">Dry Van</option>
                                            <option value="refrigerated">Refrigerated</option>
                                            <option value="flatbed">Flatbed</option>
                                            <option value="tanker">Tanker</option>
                                            <option value="container">Container</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Status</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Status
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="moving">Moving</option>
                                            <option value="idle">Idle</option>
                                            <option value="stopped">Stopped</option>
                                            <option value="maintenance">Maintenance</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Operation Status
                                        </label>
                                        <select
                                            name="operationStatus"
                                            value={formData.operationStatus}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="available">Available</option>
                                            <option value="in_transit">In Transit</option>
                                            <option value="loading">Loading</option>
                                            <option value="idle">Idle</option>
                                            <option value="maintenance">Maintenance</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-4">Current Location</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="123 Main St, City, State"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Coordinates will be automatically fetched from this address
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="border-t border-gray-200 px-6 py-4">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? 'Creating...' : 'Create Trailer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewTrailerSidebar;
