import React, { useState, useEffect } from 'react';
import { FileText, Search, Eye, Trash2, Plus, Edit } from 'lucide-react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { getAllDrivers } from '../../../../axios/api/driver';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
    id: number;
    type: NotificationType;
    message: string;
}

interface TrainingCertificate {
    _id?: string;
    driverId: string;
    driverName?: string;
    certificateName: string;
    certificateType: string;
    issuedDate: string;
    expiryDate?: string;
    issuingAuthority: string;
    certificateNumber?: string;
    fileUrl?: string;
    fileName?: string;
    status: 'active' | 'expired' | 'expiring_soon';
    notes?: string;
}

const Notification = ({ notification, onClose }: { notification: Notification; onClose: (id: number) => void }) => {
    const icons = {
        success: <FaCheckCircle className="text-green-500" size={24} />,
        error: <FaExclamationCircle className="text-red-500" size={24} />,
        info: <FaCheckCircle className="text-blue-500" size={24} />
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200'
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
            <div className="flex-shrink-0 mt-0.5">
                {icons[notification.type]}
            </div>
            <p className="flex-1 text-sm font-medium text-gray-900">{notification.message}</p>
            <button
                onClick={() => onClose(notification.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <FaTimes size={16} />
            </button>
        </div>
    );
};

const TrainingCertificates = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<string>('');
    const [certificates, setCertificates] = useState<TrainingCertificate[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCertificate, setEditingCertificate] = useState<TrainingCertificate | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const certificateForm = {
        driverId: '',
        certificateName: '',
        certificateType: '',
        issuedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        issuingAuthority: '',
        certificateNumber: '',
        notes: ''
    };

    const [formData, setFormData] = useState(certificateForm);

    const certificateTypes = [
        'CDL License',
        'Hazmat Endorsement',
        'DOT Medical Certificate',
        'First Aid/CPR',
        'Defensive Driving',
        'Hazmat Training',
        'Forklift Certification',
        'Safety Training',
        'Other'
    ];

    useEffect(() => {
        fetchDrivers();
        fetchCertificates();
    }, []);

    const fetchDrivers = async () => {
        try {
            const response = await getAllDrivers(1, 1000);
            if (response?.success && response?.data) {
                const driverList = Array.isArray(response.data) ? response.data : [];
                setDrivers(driverList.map((d: any) => ({
                    _id: d._id,
                    name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown Driver'
                })));
            }
        } catch (error) {
            console.error('Error fetching drivers:', error);
        }
    };

    const fetchCertificates = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual API call when backend is ready
            // const response = await getTrainingCertificates();
            // setCertificates(response.data || []);
            
            // Mock data for now
            setCertificates([]);
        } catch (error) {
            console.error('Error fetching certificates:', error);
            showNotification('error', 'Failed to load training certificates');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: NotificationType, message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleAddClick = () => {
        setEditingCertificate(null);
        setFormData(certificateForm);
        setSelectedFile(null);
        setShowAddModal(true);
    };

    const handleEditClick = (certificate: TrainingCertificate) => {
        setEditingCertificate(certificate);
        setFormData({
            driverId: certificate.driverId,
            certificateName: certificate.certificateName,
            certificateType: certificate.certificateType,
            issuedDate: certificate.issuedDate,
            expiryDate: certificate.expiryDate || '',
            issuingAuthority: certificate.issuingAuthority,
            certificateNumber: certificate.certificateNumber || '',
            notes: certificate.notes || ''
        });
        setSelectedFile(null);
        setShowAddModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.driverId || !formData.certificateName || !formData.issuedDate) {
            showNotification('error', 'Please fill in all required fields');
            return;
        }

        try {
            // TODO: Replace with actual API call when backend is ready
            // const formDataToSend = new FormData();
            // Object.keys(formData).forEach(key => {
            //     formDataToSend.append(key, formData[key]);
            // });
            // if (selectedFile) {
            //     formDataToSend.append('file', selectedFile);
            // }
            // 
            // if (editingCertificate?._id) {
            //     await updateTrainingCertificate(editingCertificate._id, formDataToSend);
            // } else {
            //     await createTrainingCertificate(formDataToSend);
            // }

            showNotification('success', editingCertificate ? 'Certificate updated successfully' : 'Certificate added successfully');
            setShowAddModal(false);
            setFormData(certificateForm);
            setSelectedFile(null);
            fetchCertificates();
        } catch (error) {
            console.error('Error saving certificate:', error);
            showNotification('error', 'Failed to save certificate');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this certificate?')) {
            return;
        }

        try {
            // TODO: Replace with actual API call when backend is ready
            // await deleteTrainingCertificate(id);
            showNotification('success', 'Certificate deleted successfully');
            fetchCertificates();
        } catch (error) {
            console.error('Error deleting certificate:', error);
            showNotification('error', 'Failed to delete certificate');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-700';
            case 'expired':
                return 'bg-red-100 text-red-700';
            case 'expiring_soon':
                return 'bg-yellow-100 text-yellow-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const filteredCertificates = certificates.filter(cert => {
        const matchesSearch = searchQuery === '' || 
            cert.certificateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            cert.certificateNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDriver = selectedDriver === '' || cert.driverId === selectedDriver;
        
        return matchesSearch && matchesDriver;
    });

    return (
        <div className="min-h-screen bg-[#EDF8FF] p-6">
            {/* Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map(notification => (
                    <Notification
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FileText className="text-blue-600" size={32} />
                            Training Certificates
                        </h1>
                        <p className="text-gray-600 mt-2">Manage driver training certificates and certifications</p>
                    </div>
                    <button
                        onClick={handleAddClick}
                        style={{
                            background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                        }}
                        className="flex items-center gap-2 px-6 py-3 !text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus size={20} />
                        Add Certificate
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search certificates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Driver</label>
                        <select
                            value={selectedDriver}
                            onChange={(e) => setSelectedDriver(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Drivers</option>
                            {drivers.map(driver => (
                                <option key={driver._id} value={driver._id}>
                                    {driver.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <div className="text-sm text-gray-600">
                            Showing {filteredCertificates.length} certificate(s)
                        </div>
                    </div>
                </div>
            </div>

            {/* Certificates Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-gray-600">Loading certificates...</p>
                    </div>
                ) : filteredCertificates.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-600 text-lg mb-2">No certificates found</p>
                        <p className="text-gray-500 text-sm">Click "Add Certificate" to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Driver</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Certificate</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Issued Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Expiry Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredCertificates.map((cert) => (
                                    <tr key={cert._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{cert.driverName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{cert.certificateName}</div>
                                            {cert.certificateNumber && (
                                                <div className="text-xs text-gray-500">#{cert.certificateNumber}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{cert.certificateType}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(cert.issuedDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(cert.status)}`}>
                                                {cert.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-3">
                                                {cert.fileUrl && (
                                                    <button
                                                        onClick={() => window.open(cert.fileUrl, '_blank')}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="View Certificate"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEditClick(cert)}
                                                    className="text-indigo-600 hover:text-indigo-800"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => cert._id && handleDelete(cert._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAddModal(false);
                        }
                    }}
                >
                    <div 
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingCertificate ? 'Edit Certificate' : 'Add Certificate'}
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Driver <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.driverId}
                                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a driver</option>
                                    {drivers.map(driver => (
                                        <option key={driver._id} value={driver._id}>
                                            {driver.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Certificate Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.certificateName}
                                    onChange={(e) => setFormData({ ...formData, certificateName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Commercial Driver License"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Certificate Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.certificateType}
                                    onChange={(e) => setFormData({ ...formData, certificateType: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select type</option>
                                    {certificateTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Issued Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.issuedDate}
                                        onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Expiry Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Issuing Authority <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.issuingAuthority}
                                    onChange={(e) => setFormData({ ...formData, issuingAuthority: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Department of Motor Vehicles"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Certificate Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.certificateNumber}
                                    onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Certificate number or license number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Certificate File
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <div className="px-4 py-2 border border-gray-300 rounded-lg border-dashed hover:bg-gray-50 text-center">
                                            {selectedFile ? (
                                                <span className="text-blue-600">{selectedFile.name}</span>
                                            ) : (
                                                <span className="text-gray-500">Click to upload certificate file</span>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Additional notes or comments..."
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                    }}
                                    className="px-6 py-2 !text-white font-semibold rounded-lg hover:opacity-90"
                                >
                                    {editingCertificate ? 'Update' : 'Save'} Certificate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrainingCertificates;

