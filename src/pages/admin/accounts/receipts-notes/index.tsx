import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download, Upload, Filter, Receipt, FileText, Eye, Calendar, DollarSign, User, Tag, Paperclip, Image as ImageIcon, X } from 'lucide-react';
import { 
  listReceipts, 
  createReceipt, 
  updateReceipt, 
  deleteReceipt, 
  getReceiptStats,
  getReceiptSignedUrl,
  listFinancialNotes,
  createFinancialNote,
  updateFinancialNote,
  deleteFinancialNote,
  getFinancialNoteStats
} from '../../../../axios/api/account.receiptsNotes';

interface ReceiptData {
  _id: string;
  id?: number;
  date: string;
  amount: number;
  payeeVendor: string;
  expenseType: 'Fuel' | 'Repair' | 'Permit Fees' | 'Scales' | 'Other';
  fileType?: string;
  thumbnail?: string;
  fileName?: string;
  fileUrl?: string;
  uploadedBy?: {
    name?: string;
    email?: string;
  };
}

interface FinancialNoteData {
  _id: string;
  id?: number;
  date: string;
  user?: string;
  noteTitle: string;
  noteContent: string;
  linkedTransaction?: string | null;
  transactionId?: string | null;
  createdBy?: {
    name?: string;
    email?: string;
  };
  createdAt?: string;
}

export default function ReceiptsFinancialNotes() {
  const [activeTab, setActiveTab] = useState('receipts-archive');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('All');
  const [loading, setLoading] = useState(false);

  // Receipts Archive Data
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  
  // Financial Notes Data
  const [financialNotes, setFinancialNotes] = useState<FinancialNoteData[]>([]);

  // Stats
  const [receiptStats, setReceiptStats] = useState({
    totalReceipts: 0,
    totalAmount: 0,
    thisWeekCount: 0,
    pendingReviews: 0
  });
  const [noteStats, setNoteStats] = useState({
    totalNotes: 0,
    recentCount: 0
  });

  // Modals
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<ReceiptData | null>(null);
  const [editingNote, setEditingNote] = useState<FinancialNoteData | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<ReceiptData | null>(null);
  const [viewingNote, setViewingNote] = useState<FinancialNoteData | null>(null);
  const [receiptViewUrl, setReceiptViewUrl] = useState<string | null>(null);
  const [loadingReceiptUrl, setLoadingReceiptUrl] = useState(false);

  // Form data
  const [receiptFormData, setReceiptFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    payeeVendor: '',
    expenseType: 'Other' as 'Fuel' | 'Repair' | 'Permit Fees' | 'Scales' | 'Other',
    description: '',
    file: null as File | null
  });

  const [noteFormData, setNoteFormData] = useState({
    noteTitle: '',
    noteContent: '',
    linkedTransactionType: '',
    linkedTransactionId: '',
    linkedTransaction: ''
  });

  const tabs = [
    { id: 'receipts-archive', label: 'Receipts Archive', icon: Receipt },
    { id: 'financial-notes', label: 'Financial Notes', icon: FileText }
  ];

  const expenseTypes = ['All', 'Fuel', 'Repair', 'Permit Fees', 'Scales', 'Other'];

  // Fetch all data on mount
  useEffect(() => {
    // Fetch stats first (these should show ALL data, not filtered)
    fetchReceiptStats();
    fetchFinancialNoteStats();
    
    // Then fetch the actual lists
    fetchAllReceipts();
    fetchAllFinancialNotes();
  }, []);

  // Fetch filtered data when tab, search, or filter changes
  useEffect(() => {
    if (activeTab === 'receipts-archive') {
      fetchReceipts();
    } else {
      fetchFinancialNotes();
    }
  }, [activeTab, searchTerm, selectedExpenseType]);

  // Fetch ALL receipts for stats calculation
  const fetchAllReceipts = async () => {
    try {
      const response = await listReceipts();
      if (response?.success && Array.isArray(response.data)) {
        const formattedReceipts = response.data.map((r: any) => ({
          _id: r._id,
          date: new Date(r.date).toISOString().split('T')[0],
          amount: r.amount,
          payeeVendor: r.payeeVendor,
          expenseType: r.expenseType || 'Other',
          fileType: r.fileType || (r.fileName?.split('.').pop()?.toUpperCase() || 'PDF'),
          thumbnail: r.fileType === 'PDF' || r.fileName?.endsWith('.pdf') ? '🧾' : '📸',
          fileName: r.fileName,
          fileUrl: r.fileUrl,
          uploadedBy: r.uploadedBy
        }));
        
        // Calculate stats from all receipts
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);
        const thisWeekCount = formattedReceipts.filter((r: ReceiptData) => {
          const receiptDate = new Date(r.date);
          receiptDate.setHours(0, 0, 0, 0);
          return receiptDate >= oneWeekAgo;
        }).length;
        
        const lastWeekAmount = formattedReceipts
          .filter((r: ReceiptData) => {
            const receiptDate = new Date(r.date);
            receiptDate.setHours(0, 0, 0, 0);
            return receiptDate >= oneWeekAgo;
          })
          .reduce((sum: number, r: ReceiptData) => sum + (r.amount || 0), 0);
        
        setReceiptStats({
          totalReceipts: formattedReceipts.length,
          totalAmount: lastWeekAmount, // Last 7 days amount
          thisWeekCount: thisWeekCount,
          pendingReviews: 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching all receipts:', error);
    }
  };

  // Fetch ALL financial notes for stats calculation
  const fetchAllFinancialNotes = async () => {
    try {
      const response = await listFinancialNotes();
      if (response?.success && Array.isArray(response.data)) {
        const formattedNotes = response.data.map((n: any) => ({
          _id: n._id,
          date: new Date(n.createdAt || n.date).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          user: n.createdBy?.name || 'Unknown User',
          noteTitle: n.noteTitle,
          noteContent: n.noteContent,
          linkedTransaction: n.linkedTransaction,
          transactionId: n.linkedTransactionId,
          createdBy: n.createdBy,
          createdAt: n.createdAt || n.date
        }));
        
        // Calculate stats from all notes
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        oneWeekAgo.setHours(0, 0, 0, 0);
        const recentCount = formattedNotes.filter((n: FinancialNoteData) => {
          const noteDate = new Date(n.createdAt || n.date);
          noteDate.setHours(0, 0, 0, 0);
          return noteDate >= oneWeekAgo;
        }).length;
        
        setNoteStats({
          totalNotes: formattedNotes.length,
          recentCount: recentCount
        });
      }
    } catch (error: any) {
      console.error('Error fetching all financial notes:', error);
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const response = await listReceipts({
        search: searchTerm || undefined,
        expenseType: selectedExpenseType !== 'All' ? selectedExpenseType : undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        const formattedReceipts = response.data.map((r: any) => ({
          _id: r._id,
          date: new Date(r.date).toISOString().split('T')[0],
          amount: r.amount,
          payeeVendor: r.payeeVendor,
          expenseType: r.expenseType || 'Other',
          fileType: r.fileType || (r.fileName?.split('.').pop()?.toUpperCase() || 'PDF'),
          thumbnail: r.fileType === 'PDF' || r.fileName?.endsWith('.pdf') ? '🧾' : '📸',
          fileName: r.fileName,
          fileUrl: r.fileUrl,
          uploadedBy: r.uploadedBy
        }));
        setReceipts(formattedReceipts);
      }
    } catch (error: any) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialNotes = async () => {
    setLoading(true);
    try {
      const response = await listFinancialNotes({
        search: searchTerm || undefined
      });
      if (response?.success && Array.isArray(response.data)) {
        const formattedNotes = response.data.map((n: any) => ({
          _id: n._id,
          date: new Date(n.createdAt || n.date).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          user: n.createdBy?.name || 'Unknown User',
          noteTitle: n.noteTitle,
          noteContent: n.noteContent,
          linkedTransaction: n.linkedTransaction,
          transactionId: n.linkedTransactionId,
          createdBy: n.createdBy,
          createdAt: n.createdAt || n.date
        }));
        setFinancialNotes(formattedNotes);
      }
    } catch (error: any) {
      console.error('Error fetching financial notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiptStats = async () => {
    try {
      const response = await getReceiptStats();
      if (response?.success && response.data) {
        setReceiptStats({
          totalReceipts: response.data.totalReceipts || 0,
          totalAmount: response.data.totalAmount || 0,
          thisWeekCount: response.data.thisWeekCount || 0,
          pendingReviews: response.data.pendingReviews || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching receipt stats:', error);
    }
  };

  const fetchFinancialNoteStats = async () => {
    try {
      const response = await getFinancialNoteStats();
      if (response?.success && response.data) {
        setNoteStats({
          totalNotes: response.data.totalNotes || 0,
          recentCount: response.data.recentCount || 0
        });
      }
    } catch (error: any) {
      console.error('Error fetching financial note stats:', error);
    }
  };

  // Summary Cards Data - using real stats
  const summaryCards = [
    { 
      title: 'Total Receipts', 
      value: receiptStats.totalReceipts.toString(), 
      change: `+${receiptStats.thisWeekCount} this week`, 
      icon: Receipt, 
      color: 'blue' 
    },
    { 
      title: 'Total Amount', 
      value: `$${receiptStats.totalAmount.toFixed(2)}`, 
      change: 'Last 7 days', 
      icon: DollarSign, 
      color: 'green' 
    },
    { 
      title: 'Financial Notes', 
      value: noteStats.totalNotes.toString(), 
      change: `${noteStats.recentCount} recent`, 
      icon: FileText, 
      color: 'purple' 
    },
    { 
      title: 'Pending Reviews', 
      value: receiptStats.pendingReviews.toString(), 
      change: 'Needs attention', 
      icon: Eye, 
      color: 'orange' 
    }
  ];

  const filteredReceipts = selectedExpenseType === 'All' 
    ? receipts 
    : receipts.filter(r => r.expenseType === selectedExpenseType);

  const filteredNotes = financialNotes.filter(note => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      note.noteTitle.toLowerCase().includes(search) ||
      note.noteContent.toLowerCase().includes(search) ||
      note.user?.toLowerCase().includes(search) ||
      note.linkedTransaction?.toLowerCase().includes(search)
    );
  });

  // Receipt handlers
  const handleCreateReceipt = () => {
    setEditingReceipt(null);
    setReceiptFormData({
      date: new Date().toISOString().split('T')[0],
      amount: '',
      payeeVendor: '',
      expenseType: 'Other',
      description: '',
      file: null
    });
    setShowReceiptModal(true);
  };

  const handleEditReceipt = (receipt: ReceiptData) => {
    setEditingReceipt(receipt);
    setReceiptFormData({
      date: receipt.date,
      amount: receipt.amount.toString(),
      payeeVendor: receipt.payeeVendor,
      expenseType: receipt.expenseType,
      description: '',
      file: null
    });
    setShowReceiptModal(true);
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return;
    try {
      const response = await deleteReceipt(id);
      if (response?.success) {
        fetchReceipts();
        fetchReceiptStats();
      }
    } catch (error: any) {
      console.error('Error deleting receipt:', error);
      alert('Failed to delete receipt');
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFormData.file && !editingReceipt) {
      alert('Please upload a receipt file');
      return;
    }

    const formData = new FormData();
    formData.append('date', receiptFormData.date);
    formData.append('amount', receiptFormData.amount);
    formData.append('payeeVendor', receiptFormData.payeeVendor);
    formData.append('expenseType', receiptFormData.expenseType);
    if (receiptFormData.description) formData.append('description', receiptFormData.description);
    if (receiptFormData.file) formData.append('file', receiptFormData.file);

    try {
      let response;
      if (editingReceipt) {
        response = await updateReceipt(editingReceipt._id, formData);
      } else {
        response = await createReceipt(formData);
      }
      if (response?.success) {
        setShowReceiptModal(false);
        await fetchAllReceipts();
        await fetchReceiptStats();
        if (activeTab === 'receipts-archive') {
          await fetchReceipts();
        }
      }
    } catch (error: any) {
      console.error('Error saving receipt:', error);
      alert('Failed to save receipt');
    }
  };

  const handleViewReceipt = async (receipt: ReceiptData) => {
    setViewingReceipt(receipt);
    setReceiptViewUrl(null);
    setShowViewModal(true);
    
    // Fetch signed URL for viewing
    if (receipt._id) {
      setLoadingReceiptUrl(true);
      try {
        const response = await getReceiptSignedUrl(receipt._id, 'inline');
        if (response?.success && response.url) {
          setReceiptViewUrl(response.url);
        } else {
          // Fallback to direct URL if signed URL fails
          setReceiptViewUrl(receipt.fileUrl || null);
        }
      } catch (error: any) {
        console.error('Error fetching receipt signed URL:', error);
        // Fallback to direct URL
        setReceiptViewUrl(receipt.fileUrl || null);
      } finally {
        setLoadingReceiptUrl(false);
      }
    }
  };

  const handleDownloadReceipt = async (receipt: ReceiptData) => {
    try {
      const response = await getReceiptSignedUrl(receipt._id, 'attachment');
      if (response?.success && response.url) {
        window.open(response.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt');
    }
  };

  // Note handlers
  const handleCreateNote = () => {
    setEditingNote(null);
    setNoteFormData({
      noteTitle: '',
      noteContent: '',
      linkedTransactionType: '',
      linkedTransactionId: '',
      linkedTransaction: ''
    });
    setShowNoteModal(true);
  };

  const handleEditNote = (note: FinancialNoteData) => {
    setEditingNote(note);
    setNoteFormData({
      noteTitle: note.noteTitle,
      noteContent: note.noteContent,
      linkedTransactionType: '',
      linkedTransactionId: note.transactionId || '',
      linkedTransaction: note.linkedTransaction || ''
    });
    setShowNoteModal(true);
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      const response = await deleteFinancialNote(id);
      if (response?.success) {
        fetchFinancialNotes();
        fetchFinancialNoteStats();
      }
    } catch (error: any) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      const data = {
        noteTitle: noteFormData.noteTitle,
        noteContent: noteFormData.noteContent,
        linkedTransactionType: noteFormData.linkedTransactionType || undefined,
        linkedTransactionId: noteFormData.linkedTransactionId || undefined,
        linkedTransaction: noteFormData.linkedTransaction || undefined
      };
      if (editingNote) {
        response = await updateFinancialNote(editingNote._id, data);
      } else {
        response = await createFinancialNote(data);
      }
      if (response?.success) {
        setShowNoteModal(false);
        await fetchAllFinancialNotes();
        await fetchFinancialNoteStats();
        if (activeTab === 'financial-notes') {
          await fetchFinancialNotes();
        }
      }
    } catch (error: any) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const handleViewNote = (note: FinancialNoteData) => {
    setViewingNote(note);
    setShowViewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">📋 Receipts & Financial Notes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Store and manage digital receipts, and log internal finance comments
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'receipts-archive' && (
                <button 
                  onClick={handleCreateReceipt}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Receipt
                </button>
              )}
              {activeTab === 'financial-notes' && (
                <button 
                  onClick={handleCreateNote}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Note
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <div className="flex gap-1 border-b border-gray-200">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                    <Icon className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">{card.change}</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={activeTab === 'receipts-archive' ? 'Search by date, amount, payee/vendor, expense type...' : 'Search notes by title, content, user...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                </div>
                {activeTab === 'receipts-archive' && (
                  <select 
                    value={selectedExpenseType}
                    onChange={(e) => setSelectedExpenseType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {expenseTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                )}
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Filter className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Receipts Archive */}
          {activeTab === 'receipts-archive' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading receipts...</div>
              ) : filteredReceipts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No receipts found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payee/Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expense Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReceipts.map(receipt => (
                      <tr key={receipt._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-2xl">
                            {receipt.thumbnail || '🧾'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {receipt.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            ${receipt.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {receipt.payeeVendor}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            receipt.expenseType === 'Fuel' ? 'bg-blue-100 text-blue-800' :
                            receipt.expenseType === 'Repair' ? 'bg-orange-100 text-orange-800' :
                            receipt.expenseType === 'Permit Fees' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {receipt.expenseType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-xs">{receipt.fileName || 'receipt'}</span>
                            {receipt.fileType && (
                              <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                                {receipt.fileType}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewReceipt(receipt)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                              title="View Receipt"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDownloadReceipt(receipt)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded" 
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditReceipt(receipt)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteReceipt(receipt._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded" 
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Financial Notes */}
          {activeTab === 'financial-notes' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading notes...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No notes found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note Content</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Transaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNotes.map(note => (
                      <tr key={note._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {note.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            {note.user}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {note.noteTitle}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          <div className="truncate">{note.noteContent}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {note.linkedTransaction ? (
                            <div className="flex items-center gap-2">
                              <Tag className="w-4 h-4 text-purple-600" />
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                {note.linkedTransaction}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">No link</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewNote(note)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded" 
                              title="View Note"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditNote(note)}
                              className="p-1 text-gray-600 hover:bg-gray-50 rounded" 
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteNote(note._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded" 
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                {activeTab === 'receipts-archive' ? 'Receipt Management' : 'Financial Notes'}
              </h4>
              <p className="text-sm text-blue-800">
                {activeTab === 'receipts-archive' 
                  ? 'Store digital receipts for fuel, repair, permit fees, and scales. All files are securely stored and can be previewed with thumbnail images. Supported formats: PNG, JPG, PDF.'
                  : 'Log internal finance comments and link them to specific transactions like invoices or settlements. Use notes to track adjustments, reviews, and important financial decisions.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingReceipt ? 'Edit Receipt' : 'Upload Receipt'}</h2>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitReceipt} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={receiptFormData.date}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={receiptFormData.amount}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payee/Vendor *</label>
                <input
                  type="text"
                  value={receiptFormData.payeeVendor}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, payeeVendor: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type *</label>
                <select
                  value={receiptFormData.expenseType}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, expenseType: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  {expenseTypes.filter(t => t !== 'All').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={receiptFormData.description}
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receipt File {!editingReceipt && '*'}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFormData({ ...receiptFormData, file: e.target.files?.[0] || null })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required={!editingReceipt}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingReceipt ? 'Update' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{editingNote ? 'Edit Note' : 'New Note'}</h2>
              <button onClick={() => setShowNoteModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Title *</label>
                <input
                  type="text"
                  value={noteFormData.noteTitle}
                  onChange={(e) => setNoteFormData({ ...noteFormData, noteTitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note Content *</label>
                <textarea
                  value={noteFormData.noteContent}
                  onChange={(e) => setNoteFormData({ ...noteFormData, noteContent: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={5}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Linked Transaction</label>
                <input
                  type="text"
                  value={noteFormData.linkedTransaction}
                  onChange={(e) => setNoteFormData({ ...noteFormData, linkedTransaction: e.target.value })}
                  placeholder="e.g., Invoice #INV-2024-045"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                <input
                  type="text"
                  value={noteFormData.linkedTransactionId}
                  onChange={(e) => setNoteFormData({ ...noteFormData, linkedTransactionId: e.target.value })}
                  placeholder="e.g., INV-2024-045"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingNote ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {viewingReceipt ? 'Receipt Details' : 'Note Details'}
              </h2>
              <button 
                onClick={() => {
                  setShowViewModal(false);
                  setViewingReceipt(null);
                  setViewingNote(null);
                  setReceiptViewUrl(null);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewingReceipt && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <p>{viewingReceipt.date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <p>${viewingReceipt.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payee/Vendor</label>
                  <p>{viewingReceipt.payeeVendor}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type</label>
                  <p>{viewingReceipt.expenseType}</p>
                </div>
                {viewingReceipt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                    {loadingReceiptUrl ? (
                      <div className="w-full h-96 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Loading receipt...</p>
                      </div>
                    ) : receiptViewUrl ? (
                      <div className="w-full border border-gray-300 rounded-lg overflow-hidden">
                        {receiptViewUrl.toLowerCase().endsWith('.pdf') || viewingReceipt.fileType === 'PDF' ? (
                          <iframe 
                            src={receiptViewUrl} 
                            className="w-full h-96"
                            title="Receipt Preview"
                          />
                        ) : (
                          <img 
                            src={receiptViewUrl} 
                            alt="Receipt" 
                            className="w-full h-auto max-h-96 object-contain"
                            onError={(e) => {
                              // If image fails to load, try as iframe
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const iframe = document.createElement('iframe');
                              iframe.src = receiptViewUrl;
                              iframe.className = 'w-full h-96';
                              iframe.title = 'Receipt Preview';
                              target.parentElement?.appendChild(iframe);
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-96 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                        <p className="text-gray-500">Receipt file not available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {viewingNote && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                  <p>{viewingNote.date}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <p>{viewingNote.user}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note Title</label>
                  <p>{viewingNote.noteTitle}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
                  <p className="whitespace-pre-wrap">{viewingNote.noteContent}</p>
                </div>
                {viewingNote.linkedTransaction && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Linked Transaction</label>
                    <p>{viewingNote.linkedTransaction}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
