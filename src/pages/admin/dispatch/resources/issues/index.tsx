import React, { useState, useEffect } from 'react';
import { 
  deleteIssue, 
  listIssues, 
  searchIssues,
  getIssueById 
} from '../../../../../axios/api/distapcher';
import NewIssueSidebar from './NewIssueSidebar';
import ViewIssueModal from './ViewIssueModal';
import ConfirmationModal from '../../../../../components/common/ConfirmationModal';
import { 
  MdAdd, 
  MdSearch, 
  MdEdit, 
  MdDelete, 
  MdVisibility,
  MdWarning,
  MdError,
  MdInfo
} from 'react-icons/md';
import { FaFilter } from 'react-icons/fa';

interface Issue {
  _id: string;
  reportedBy: string;
  assignedTo: string;
  vehicle?: {
    _id: string;
    plateNumber: string;
    make: string;
    model: string;
  };
  issueType: 'maintanance' | 'operational' | 'accident' | 'compilance';
  issueCategory: 'engine' | 'fuel' | 'paper-work' | 'minor-damage';
  issueReport: string;
  issueTags: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'closed';
  address?: string;
  cordinates?: {
    longitude: string;
    latitude: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewIssueSidebar, setShowNewIssueSidebar] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loadingView, setLoadingView] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10
  });
  // Fetch issues
  const fetchIssues = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await listIssues(page, 10);
      console.log('Issues API Response:', response);
      
      if (response.success) {
        const data = response.issues || [];
        setIssues(data);
        setPagination({
          current: response.page || 1,
          pages: response.pages || 1,
          total: response.total || 0,
          limit: 10
        });
      } else {
        console.error('API returned success: false', response);
        setIssues([]);
        setPagination({ current: 1, pages: 0, total: 0, limit: 10 });
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
      setPagination({ current: 1, pages: 0, total: 0, limit: 10 });
    } finally {
      setLoading(false);
    }
  };

  // Search issues
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchIssues();
      return;
    }

    setLoading(true);
    try {
      const response = await searchIssues(searchQuery);
      console.log('Search API Response:', response);
      
      if (response.success) {
        const data = response.issues || [];
        setIssues(data);
        setPagination({
          current: 1,
          pages: 1,
          total: response.total || 0,
          limit: 10
        });
      } else {
        console.error('Search API returned success: false', response);
        setIssues([]);
        setPagination({ current: 1, pages: 0, total: 0, limit: 10 });
      }
    } catch (error) {
      console.error('Error searching issues:', error);
      setIssues([]);
      setPagination({ current: 1, pages: 0, total: 0, limit: 10 });
    } finally {
      setLoading(false);
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; issueId: string | null }>({ show: false, issueId: null });

  // Delete issue
  const handleDelete = async (id: string) => {
    setDeleteConfirm({ show: true, issueId: id });
  };

  const confirmDeleteIssue = async () => {
    if (!deleteConfirm.issueId) return;

    try {
      const response = await deleteIssue(deleteConfirm.issueId);
      if (response.success) {
        setIssues(issues.filter(issue => issue._id !== deleteConfirm.issueId));
      }
    } catch (error) {
      console.error('Error deleting issue:', error);
    } finally {
      setDeleteConfirm({ show: false, issueId: null });
    }
  };

  // View issue details
  const handleView = async (id: string) => {
    if (!id) {
      console.error('No issue ID provided');
      return;
    }
    
    setLoadingView(true);
    try {
      const response = await getIssueById(id);
      console.log('View issue response:', response);
      
      if (response?.success) {
        // Handle different response structures
        const issueData = response.issue || response.data || response;
        if (issueData && issueData._id) {
          setSelectedIssue(issueData);
          setShowViewModal(true);
        } else {
          console.error('No issue data in response:', response);
          alert('Failed to load issue details. Please try again.');
        }
      } else {
        console.error('API returned success: false', response);
        // Handle both old format { message: "..." } and new format { success: false, message: "..." }
        const errorMsg = response?.message || 'Failed to load issue details. Please try again.';
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error('Error fetching issue:', error);
      // Handle error response structure
      const errorResponse = error?.response?.data;
      const errorMsg = errorResponse?.message || error?.message || 'Failed to load issue details. Please try again.';
      alert(errorMsg);
    } finally {
      setLoadingView(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'closed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get issue type icon
  const getIssueTypeIcon = (type: string) => {
    switch (type) {
      case 'maintanance': return <MdWarning className="text-orange-500" />;
      case 'operational': return <MdError className="text-red-500" />;
      case 'accident': return <MdError className="text-red-600" />;
      case 'compilance': return <MdInfo className="text-blue-500" />;
      default: return <MdWarning className="text-gray-500" />;
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issues Management</h1>
          <p className="text-gray-600">Manage and track fleet issues</p>
        </div>
        <button
          onClick={() => setShowNewIssueSidebar(true)}
          className="flex items-center gap-2 bg-blue-600 !text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MdAdd className="text-xl" />
          Add Issue
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues by type, category, priority, status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 bg-blue-600 !text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdSearch />
            Search
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              fetchIssues();
            }}
            className="flex items-center gap-2 bg-gray-600 !text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <FaFilter />
            Clear
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <MdWarning className="text-2xl text-gray-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Issues</p>
              <p className="text-2xl font-bold text-red-600">
                {issues.filter(i => i.status === 'open').length}
              </p>
            </div>
            <MdError className="text-2xl text-red-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">
                {issues.filter(i => i.status === 'in-progress').length}
              </p>
            </div>
            <MdInfo className="text-2xl text-blue-400" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Closed Issues</p>
              <p className="text-2xl font-bold text-green-600">
                {issues.filter(i => i.status === 'closed').length}
              </p>
            </div>
            <MdInfo className="text-2xl text-green-400" />
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading issues...
                  </td>
                </tr>
              ) : issues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No issues found
                  </td>
                </tr>
              ) : (
                issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getIssueTypeIcon(issue.issueType)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {issue.issueType.charAt(0).toUpperCase() + issue.issueType.slice(1)}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {issue.issueReport}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(issue.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {issue.issueCategory.replace('-', ' ').charAt(0).toUpperCase() + 
                         issue.issueCategory.replace('-', ' ').slice(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(issue.priority)}`}>
                        {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('-', ' ').charAt(0).toUpperCase() + 
                         issue.status.replace('-', ' ').slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {issue.vehicle ? `${issue.vehicle.make} ${issue.vehicle.model} (${issue.vehicle.plateNumber})` : 'No vehicle'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleView(issue._id);
                          }}
                          disabled={loadingView}
                          className="text-blue-600 hover:text-blue-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Details"
                        >
                          <MdVisibility />
                        </button>
                        <button
                          onClick={() => {
                            setEditingIssue(issue);
                            setShowNewIssueSidebar(true);
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Edit Issue"
                        >
                          <MdEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(issue._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete Issue"
                        >
                          <MdDelete />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => fetchIssues(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => fetchIssues(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(pagination.current - 1) * pagination.limit + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current * pagination.limit, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => fetchIssues(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchIssues(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.current
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => fetchIssues(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New/Edit Issue Sidebar */}
      {showNewIssueSidebar && (
        <NewIssueSidebar
          issue={editingIssue}
          onClose={() => {
            setShowNewIssueSidebar(false);
            setEditingIssue(null);
          }}
          onSave={() => {
            setShowNewIssueSidebar(false);
            setEditingIssue(null);
            fetchIssues();
          }}
        />
      )}

      {/* View Issue Modal */}
      {showViewModal && selectedIssue && (
        <ViewIssueModal
          issue={selectedIssue}
          onClose={() => {
            setShowViewModal(false);
            setSelectedIssue(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, issueId: null })}
        onConfirm={confirmDeleteIssue}
        title="Delete Issue"
        message="Are you sure you want to delete this issue? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Issues;