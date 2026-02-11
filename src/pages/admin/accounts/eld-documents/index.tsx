import { useState, useEffect } from 'react';
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Search,
    RefreshCw,
    X,
    AlertCircle,
    CheckCircle,
    Eye,
    Calendar,
    User
} from 'lucide-react';
import {
    uploadELDDocument,
    getELDDocuments,
    deleteELDDocument,
    downloadELDDocument,
    updateELDDocument,
    getELDDocumentSignedUrl
} from '../../../../axios/api/eld.document';

interface ELDDocument {
    _id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    title?: string;
    description?: string;
    isActive: boolean;
    uploadedAt: string;
    uploadedBy?: {
        _id: string;
        name: string;
        email?: string;
    };
    mimeType?: string;
}

const ELDDocuments = () => {
    const [documents, setDocuments] = useState<ELDDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFormData, setUploadFormData] = useState({
        title: '',
        description: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; documentId: string | null; fileName: string }>({
        show: false,
        documentId: null,
        fileName: ''
    });
    const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const response = await getELDDocuments({
                search: searchTerm || undefined
            });
            if (response?.success && response?.data) {
                setDocuments(Array.isArray(response.data) ? response.data : response.data.documents || []);
            } else {
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching ELD documents:', error);
            showNotification('Failed to fetch ELD documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                showNotification('File size must be less than 50MB', 'error');
                return;
            }
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowedTypes.includes(file.type)) {
                showNotification('Only PDF, Word, and Image files are allowed', 'error');
                return;
            }
            setSelectedFile(file);
            // Auto-fill title if empty
            if (!uploadFormData.title) {
                setUploadFormData(prev => ({
                    ...prev,
                    title: file.name.replace(/\.[^/.]+$/, '') // Remove extension
                }));
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            showNotification('Please select a file to upload', 'error');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            if (uploadFormData.title) {
                formData.append('title', uploadFormData.title);
            }
            if (uploadFormData.description) {
                formData.append('description', uploadFormData.description);
            }

            const response = await uploadELDDocument(formData);
            if (response?.success) {
                showNotification('ELD document uploaded successfully', 'success');
                setShowUploadModal(false);
                setSelectedFile(null);
                setUploadFormData({ title: '', description: '' });
                fetchDocuments();
            } else {
                showNotification(response?.message || 'Failed to upload document', 'error');
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            showNotification('Failed to upload document', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.documentId) return;

        try {
            const response = await deleteELDDocument(deleteConfirm.documentId);
            if (response?.success) {
                showNotification('ELD document deleted successfully', 'success');
                setDeleteConfirm({ show: false, documentId: null, fileName: '' });
                fetchDocuments();
            } else {
                showNotification(response?.message || 'Failed to delete document', 'error');
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            showNotification('Failed to delete document', 'error');
        }
    };

    const handleViewDocument = async (doc: ELDDocument) => {
        try {
            // Get signed URL with 'inline' disposition to open in browser, not download
            const response = await getELDDocumentSignedUrl(doc._id, 'inline');
            if (response?.success && response?.url) {
                // Open in new tab for viewing (not download)
                const newWindow = window.open(response.url, '_blank', 'noopener,noreferrer');
                if (!newWindow) {
                    showNotification('Please allow popups to view documents', 'error');
                }
            } else {
                showNotification(response?.message || 'Failed to get document URL', 'error');
            }
        } catch (error) {
            console.error('Error viewing document:', error);
            showNotification('Failed to view document', 'error');
        }
    };

    const handleDownload = async (doc: ELDDocument) => {
        try {
            const blob = await downloadELDDocument(doc._id);
            const url = window.URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = doc.fileName;
            window.document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading document:', error);
            showNotification('Failed to download document', 'error');
        }
    };

    const handleToggleActive = async (document: ELDDocument) => {
        try {
            const response = await updateELDDocument(document._id, {
                isActive: !document.isActive
            });
            if (response?.success) {
                showNotification(
                    document.isActive ? 'Document deactivated' : 'Document activated',
                    'success'
                );
                fetchDocuments();
            } else {
                showNotification(response?.message || 'Failed to update document', 'error');
            }
        } catch (error) {
            console.error('Error updating document:', error);
            showNotification('Failed to update document', 'error');
        }
    };

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ show: true, message, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 3000);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredDocuments = documents.filter(doc =>
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#EDF8FF] p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <FileText className="text-blue-600" size={32} />
                            ELD Documents
                        </h1>
                        <p className="text-sm text-gray-600 mt-2">
                            Manage ELD documents for driver access. Uploaded documents will be available to all drivers in the mobile app.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        style={{
                            background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                        }}
                        className="flex items-center gap-2 px-6 py-3 !text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
                    >
                        <Upload size={20} />
                        Upload Document
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search documents by name, title, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={fetchDocuments}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        Uploaded Documents ({filteredDocuments.length})
                        <span className="ml-2 text-xs font-normal text-gray-500">
                            (Only active documents are visible to drivers)
                        </span>
                    </h3>
                </div>

                {loading ? (
                    <div className="px-6 py-12 text-center">
                        <RefreshCw className="animate-spin h-8 w-8 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">Loading documents...</p>
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                        <p className="text-gray-500 text-lg mb-2">No ELD documents found</p>
                        <p className="text-gray-400 text-sm">
                            {searchTerm ? 'Try adjusting your search terms' : 'Upload your first ELD document to get started'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-gray-600 uppercase text-xs font-semibold border-r border-gray-200">Document</th>
                                    <th className="px-6 py-4 text-gray-600 uppercase text-xs font-semibold border-r border-gray-200">Title</th>
                                    <th className="px-6 py-4 text-gray-600 uppercase text-xs font-semibold border-r border-gray-200">Status</th>
                                    <th className="px-6 py-4 text-gray-600 uppercase text-xs font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredDocuments.map((doc) => (
                                    <tr key={doc._id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-100">
                                        <td className="px-6 py-4 border-r border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center border border-gray-200">
                                                    <FileText className="text-blue-600" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{doc.fileName}</p>
                                                    {doc.description && (
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                            {doc.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-100">
                                            <span className="text-gray-700">
                                                {doc.title || 'Untitled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 border-r border-gray-100">
                                            <button
                                                onClick={() => handleToggleActive(doc)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                    doc.isActive
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                                                }`}
                                            >
                                                {doc.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                    title="Download"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleViewDocument(doc)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                                                    title="View"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm({
                                                        show: true,
                                                        documentId: doc._id,
                                                        fileName: doc.fileName
                                                    })}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
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

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Upload className="text-blue-600" size={24} />
                                Upload ELD Document
                            </h2>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setSelectedFile(null);
                                    setUploadFormData({ title: '', description: '' });
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* File Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select File <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <div className="px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors text-center">
                                            {selectedFile ? (
                                                <div className="flex items-center justify-center gap-3">
                                                    <FileText className="text-blue-600" size={24} />
                                                    <div className="text-left">
                                                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatFileSize(selectedFile.size)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedFile(null);
                                                        }}
                                                        className="ml-2 text-red-500 hover:text-red-700"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-gray-500">
                                                    <Upload className="mx-auto mb-2" size={32} />
                                                    <p className="font-medium">Click to select file or drag and drop</p>
                                                    <p className="text-xs mt-1">PDF, Word, Images (Max 50MB)</p>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={uploadFormData.title}
                                    onChange={(e) => setUploadFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Enter document title (optional)"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={uploadFormData.description}
                                    onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Enter document description (optional)"
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setSelectedFile(null);
                                        setUploadFormData({ title: '', description: '' });
                                    }}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                    style={{
                                        background: (!selectedFile || uploading) ? '#9CA3AF' : 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                    }}
                                    className="px-6 py-2 !text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="text-red-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Delete Document</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to delete <span className="font-semibold">"{deleteConfirm.fileName}"</span>?
                                This document will no longer be accessible to drivers.
                            </p>
                            <div className="flex justify-end gap-4">
                                <button
                                    onClick={() => setDeleteConfirm({ show: false, documentId: null, fileName: '' })}
                                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification.show && (
                <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
                        notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                        {notification.type === 'success' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}
                        <span className="font-medium">{notification.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ELDDocuments;

