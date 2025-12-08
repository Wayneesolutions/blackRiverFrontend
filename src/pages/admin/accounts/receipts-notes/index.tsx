import  { useState } from 'react';
import { Search, Plus, Edit, Trash2, Download, Upload, Filter, Receipt, FileText, Eye, Calendar, DollarSign, User, Tag, Paperclip, Image as ImageIcon } from 'lucide-react';

export default function ReceiptsFinancialNotes() {
  const [activeTab, setActiveTab] = useState('receipts-archive');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpenseType, setSelectedExpenseType] = useState('All');

  // Receipts Archive Data
  const [receipts,] = useState([
    { 
      id: 1, 
      date: '2024-12-05', 
      amount: 425.50, 
      payeeVendor: 'Shell Gas Station', 
      expenseType: 'Fuel', 
      fileType: 'PDF',
      thumbnail: '🧾',
      fileName: 'fuel_receipt_001.pdf'
    },
    { 
      id: 2, 
      date: '2024-12-04', 
      amount: 1250.00, 
      payeeVendor: 'ABC Truck Repair', 
      expenseType: 'Repair', 
      fileType: 'JPG',
      thumbnail: '📸',
      fileName: 'repair_invoice_045.jpg'
    },
    { 
      id: 3, 
      date: '2024-12-03', 
      amount: 350.00, 
      payeeVendor: 'CA DOT', 
      expenseType: 'Permit Fees', 
      fileType: 'PDF',
      thumbnail: '🧾',
      fileName: 'permit_fee_receipt.pdf'
    },
    { 
      id: 4, 
      date: '2024-12-02', 
      amount: 85.00, 
      payeeVendor: 'Weigh Station #12', 
      expenseType: 'Scales', 
      fileType: 'PNG',
      thumbnail: '📸',
      fileName: 'scale_ticket_092.png'
    },
    { 
      id: 5, 
      date: '2024-12-01', 
      amount: 567.80, 
      payeeVendor: 'Chevron Fuel Stop', 
      expenseType: 'Fuel', 
      fileType: 'PDF',
      thumbnail: '🧾',
      fileName: 'fuel_receipt_002.pdf'
    }
  ]);

  // Financial Notes Data
  const [financialNotes,] = useState([
    { 
      id: 1, 
      date: '2024-12-05 10:30 AM', 
      user: 'John Admin', 
      noteTitle: 'Q4 Budget Review', 
      noteContent: 'Reviewed Q4 expenses. Fuel costs trending 15% higher than projected...', 
      linkedTransaction: 'Invoice #INV-2024-045',
      transactionId: 'INV-2024-045'
    },
    { 
      id: 2, 
      date: '2024-12-04 02:15 PM', 
      user: 'Sarah Manager', 
      noteTitle: 'Settlement Adjustment', 
      noteContent: 'Adjusted driver settlement STL-2024-003 due to missing fuel receipt...', 
      linkedTransaction: 'Settlement #STL-2024-003',
      transactionId: 'STL-2024-003'
    },
    { 
      id: 3, 
      date: '2024-12-03 09:45 AM', 
      user: 'Mike Accountant', 
      noteTitle: 'Tax Deduction Note', 
      noteContent: 'Marked repair expenses as tax deductible for end-of-year filing...', 
      linkedTransaction: null,
      transactionId: null
    },
    { 
      id: 4, 
      date: '2024-12-02 04:20 PM', 
      user: 'John Admin', 
      noteTitle: 'Vendor Payment Schedule', 
      noteContent: 'Scheduled payment to ABC Truck Repair for $1,250. Due date: Dec 15...', 
      linkedTransaction: 'Invoice #INV-2024-052',
      transactionId: 'INV-2024-052'
    }
  ]);

  const tabs = [
    { id: 'receipts-archive', label: 'Receipts Archive', icon: Receipt },
    { id: 'financial-notes', label: 'Financial Notes', icon: FileText }
  ];

  const expenseTypes = ['All', 'Fuel', 'Repair', 'Permit Fees', 'Scales'];

  // Summary Cards Data
  const summaryCards = [
    { title: 'Total Receipts', value: '127', change: '+12 this week', icon: Receipt, color: 'blue' },
    { title: 'Total Amount', value: '$2,678.30', change: 'Last 7 days', icon: DollarSign, color: 'green' },
    { title: 'Financial Notes', value: '48', change: '8 recent', icon: FileText, color: 'purple' },
    { title: 'Pending Reviews', value: '5', change: 'Needs attention', icon: Eye, color: 'orange' }
  ];

  const filteredReceipts = selectedExpenseType === 'All' 
    ? receipts 
    : receipts.filter(r => r.expenseType === selectedExpenseType);

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
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Receipt
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Note
              </button>
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
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-2xl">
                          {receipt.thumbnail}
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
                          <span className="truncate max-w-xs">{receipt.fileName}</span>
                          <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-medium">
                            {receipt.fileType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Receipt">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Financial Notes */}
          {activeTab === 'financial-notes' && (
            <div className="overflow-x-auto">
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
                  {financialNotes.map(note => (
                    <tr key={note.id} className="hover:bg-gray-50">
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
                          <button className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Note">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:bg-gray-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}