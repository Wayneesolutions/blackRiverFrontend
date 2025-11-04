import React, { useState, useEffect } from 'react';
import { listCompanyDocuments, uploadCompanyDocument, deleteCompanyDocument } from '../../../../axios/api/companyDocuments';
import {
  FolderOpen,
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  File,
  Image,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Folder,
  Sheet
} from 'lucide-react';

interface Document {
  _id: string;
  name: string;
  category: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadDate: string;
  url: string;
  description?: string;
}

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'hr',
    description: ''
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null; name?: string }>({ open: false, id: null });

  const getExtension = (doc: Document) => {
    if (doc.type) return doc.type.toLowerCase();
    try {
      const url = new URL(doc.url);
      const ext = url.pathname.split('.').pop() || '';
      return ext.toLowerCase();
    } catch {
      return '';
    }
  };

  const isPubliclyAccessible = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Check if it's a public URL (not localhost, 127.0.0.1, or private IP)
      const hostname = urlObj.hostname.toLowerCase();
      return !hostname.includes('localhost') && 
             !hostname.includes('127.0.0.1') && 
             !hostname.startsWith('192.168.') &&
             !hostname.startsWith('10.') &&
             !hostname.startsWith('172.');
    } catch {
      return false;
    }
  };

  const getViewerUrl = (doc: Document) => {
    const ext = getExtension(doc);
    const encoded = encodeURIComponent(doc.url);
    
    // Only use external viewers if URL is publicly accessible
    if (!isPubliclyAccessible(doc.url)) {
      return null; // Will trigger download/open instead
    }
    
    // Office formats via Microsoft viewer
    const officeExts = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (officeExts.includes(ext)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}`;
    }
    // Fallback to Google viewer for other common docs (txt, csv, etc.)
    return `https://docs.google.com/gview?url=${encoded}&embedded=true`;
  };

  // Sample categories
  const categories = [
    { id: 'all', name: 'All Documents', icon: FolderOpen, count: 0 },
    { id: 'hr', name: 'HR Policies', icon: FileText, count: 0 },
    { id: 'offer', name: 'Offer Letters', icon: File, count: 0 },
    { id: 'safety', name: 'Safety Compliance', icon: AlertCircle, count: 0 },
    { id: 'hiring', name: 'Hiring Paperwork', icon: User, count: 0 },
    { id: 'legal', name: 'Legal Documents', icon: FileText, count: 0 },
    { id: 'other', name: 'Other', icon: Folder, count: 0 }
  ];

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await listCompanyDocuments({
        category: selectedCategory,
        search: searchQuery,
      });
      if (res?.success) {
        setDocuments(res.data || []);
      } else {
        setDocuments([]);
      }
    } catch (e) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  const handleView = (doc: Document) => {
    setViewDoc(doc);
    setShowViewModal(true);
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Attempt to open in new tab; if blocked or cross-origin restricted, fallback to fetch+download
      if (doc.url) {
        const a = document.createElement('a');
        a.href = doc.url;
        a.download = doc.name || 'document';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Download failed', e);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="text-red-600" size={24} />;
      case 'doc':
      case 'docx': return <FileText className="text-blue-600" size={24} />;
      case 'xls':
      case 'xlsx': return <Sheet className="text-green-600" size={24} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <Image className="text-purple-600" size={24} />;
      default: return <File className="text-gray-600" size={24} />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadCompanyDocument({
        name: uploadForm.name || selectedFile.name,
        category: uploadForm.category,
        description: uploadForm.description,
        file: selectedFile,
      });
      if (res?.success) {
        await fetchDocuments();
      } else {
        alert(res?.message || 'Failed to upload');
      }
      setUploadDialog(false);
      setSelectedFile(null);
      setUploadForm({ name: '', category: 'hr', description: '' });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAskDelete = (doc: Document) => {
    setConfirmDelete({ open: true, id: doc._id, name: doc.name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      const res = await deleteCompanyDocument(confirmDelete.id);
      if (res?.success) {
        setConfirmDelete({ open: false, id: null });
        await fetchDocuments();
      } else {
        alert(res?.message || 'Delete failed');
      }
    } catch (e) {
      alert('Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Documents</h1>
              <p className="text-gray-600">Manage and organize your company documents in one place</p>
            </div>
            <button
              onClick={() => setUploadDialog(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white rounded-lg transition-all font-medium flex items-center gap-2 shadow-md"
            >
              <Plus size={20} />
              Upload Document
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Categories</h3>
              </div>
              <div className="p-3 space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const count = documents.filter(d => d.category === category.id || category.id === 'all').length;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                        selectedCategory === category.id
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-medium shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="flex-1 text-left">{category.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        selectedCategory === category.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search documents by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
                  <Filter size={18} />
                  Filter
                </button>
              </div>
            </div>

            {/* Documents Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc._id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-gray-50 rounded-lg flex-shrink-0">
                        {getFileIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{doc.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(doc.size)} • {doc.type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    
                    {doc.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <User size={14} />
                      <span>{doc.uploadedBy}</span>
                      <span>•</span>
                      <Calendar size={14} />
                      <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleView(doc)} className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium">
                        <Eye size={16} />
                        View
                      </button>
                      <button onClick={() => handleDownload(doc)} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleAskDelete(doc)}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FolderOpen size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => setUploadDialog(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Upload First Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      {uploadDialog && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
                <button
                  onClick={() => setUploadDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* File Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select File</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, XLS, JPG up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={16} />
                    <span className="text-sm text-green-700">{selectedFile.name}</span>
                  </div>
                )}
              </div>

              {/* Document Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Document Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="Enter document name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hr">HR Policies</option>
                  <option value="offer">Offer Letters</option>
                  <option value="safety">Safety Compliance</option>
                  <option value="hiring">Hiring Paperwork</option>
                  <option value="legal">Legal Documents</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Enter a brief description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setUploadDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFileUpload}
                  disabled={uploading || !selectedFile}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 !text-white rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Upload Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewDoc && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{viewDoc.name}</h3>
                <p className="text-xs text-gray-500 mt-1 uppercase">{viewDoc.type}</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={22} />
              </button>
            </div>
            <div className="p-4 overflow-auto bg-gray-50">
              {(() => {
                const ext = getExtension(viewDoc);
                
                // PDFs - use iframe
                if (ext === 'pdf') {
                  return (
                    <iframe 
                      title="preview" 
                      src={viewDoc.url} 
                      className="w-full h-[70vh] border rounded-lg"
                      onError={(e) => {
                        console.error('PDF load error:', e);
                      }}
                    />
                  );
                }
                
                // Images - use img tag
                if (['jpg','jpeg','png','gif','webp'].includes(ext)) {
                  return (
                    <img 
                      src={viewDoc.url} 
                      alt={viewDoc.name} 
                      className="max-h-[70vh] w-auto mx-auto rounded-lg border"
                      onError={(e) => {
                        console.error('Image load error:', e);
                      }}
                    />
                  );
                }
                
                // For Office documents and other file types
                const viewerSrc = getViewerUrl(viewDoc);
                
                // If viewer URL is not available (private/local URL), show download option
                if (!viewerSrc) {
                  return (
                    <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="text-gray-400 mb-4" size={64} />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Preview Not Available</h3>
                      <p className="text-sm text-gray-600 mb-6 text-center max-w-md">
                        This document cannot be previewed in the browser. Please download it to view.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            window.open(viewDoc.url, '_blank');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                        >
                          <Download size={18} />
                          Open Document
                        </button>
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = viewDoc.url;
                            a.download = viewDoc.name || 'document';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
                        >
                          <Download size={18} />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                }
                
                // Try to use external viewer (only if URL is publicly accessible)
                return (
                  <div className="relative">
                    <iframe
                      title="preview"
                      src={viewerSrc}
                      className="w-full h-[70vh] border rounded-lg bg-white"
                      onError={(e) => {
                        console.error('Viewer load error:', e);
                      }}
                    />
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={() => {
                          window.open(viewDoc.url, '_blank');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg"
                      >
                        <Download size={16} />
                        Open Directly
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete.open && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Delete document?</h3>
              <p className="text-sm text-gray-600 mt-2">This action cannot be undone. You are about to delete <span className="font-medium text-gray-900">{confirmDelete.name}</span>.</p>
            </div>
            <div className="p-4 flex items-center justify-end gap-3">
              <button onClick={() => setConfirmDelete({ open: false, id: null })} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
