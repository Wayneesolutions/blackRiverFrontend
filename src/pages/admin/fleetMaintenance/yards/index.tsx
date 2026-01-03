import { useState, useEffect } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheckCircle,
  FaExclamationCircle,
  FaSearch,
  FaWarehouse
} from 'react-icons/fa';
import {
  getAllYards,
  createYard,
  updateYard,
  deleteYard,
  type Yard,
  type CreateYardData
} from '../../../../axios/api/fleet.yards';

type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

const YardManagement = () => {
  const [yards, setYards] = useState<Yard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingYard, setEditingYard] = useState<Yard | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formData, setFormData] = useState<CreateYardData>({
    yardName: '',
    yardCode: '',
    yardType: 'parking',
    status: 'active'
  });

  const yardTypes = ['parking', 'drop yard', 'terminal', 'maintenance', 'warehouse'];
  const statusOptions = ['active', 'inactive'];

  useEffect(() => {
    fetchYards();
  }, []);

  const fetchYards = async () => {
    try {
      setLoading(true);
      const response = await getAllYards();
      if (response.success) {
        setYards(response.data || []);
      } else {
        addNotification('error', 'Failed to fetch yards');
      }
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to fetch yards');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleOpenModal = (yard?: Yard) => {
    if (yard) {
      setEditingYard(yard);
      setFormData({
        yardName: yard.yardName,
        yardCode: yard.yardCode,
        yardType: yard.yardType,
        status: yard.status
      });
    } else {
      setEditingYard(null);
      setFormData({
        yardName: '',
        yardCode: '',
        yardType: 'parking',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingYard(null);
    setFormData({
      yardName: '',
      yardCode: '',
      yardType: 'parking',
      status: 'active'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.yardName.trim() || !formData.yardCode.trim()) {
      addNotification('error', 'Yard name and code are required');
      return;
    }

    try {
      let response;
      if (editingYard) {
        response = await updateYard(editingYard._id!, formData);
      } else {
        response = await createYard(formData);
      }

      if (response.success) {
        addNotification('success', response.message || `Yard ${editingYard ? 'updated' : 'created'} successfully`);
        handleCloseModal();
        fetchYards();
      } else {
        addNotification('error', response.message || `Failed to ${editingYard ? 'update' : 'create'} yard`);
      }
    } catch (error: any) {
      addNotification('error', error.message || `Failed to ${editingYard ? 'update' : 'create'} yard`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this yard?')) {
      return;
    }

    try {
      const response = await deleteYard(id);
      if (response.success) {
        addNotification('success', response.message || 'Yard deleted successfully');
        fetchYards();
      } else {
        addNotification('error', response.message || 'Failed to delete yard');
      }
    } catch (error: any) {
      addNotification('error', error.message || 'Failed to delete yard');
    }
  };

  const filteredYards = yards.filter(yard =>
    yard.yardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    yard.yardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    yard.yardType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaWarehouse className="text-[#42aeec]" />
                Yard Management
              </h1>
              <p className="text-gray-600 mt-2">Manage fleet yards and locations</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-[#42aeec] text-white rounded-lg hover:bg-[#3598c7] transition-colors flex items-center gap-2"
            >
              <FaPlus /> Add Yard
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, code, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] ${
                notification.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : notification.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              {notification.type === 'success' ? (
                <FaCheckCircle />
              ) : notification.type === 'error' ? (
                <FaExclamationCircle />
              ) : (
                <FaExclamationCircle />
              )}
              <span>{notification.message}</span>
            </div>
          ))}
        </div>

        {/* Yards Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#42aeec]"></div>
            <p className="mt-2 text-gray-600">Loading yards...</p>
          </div>
        ) : filteredYards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FaWarehouse className="mx-auto text-gray-400 text-4xl mb-4" />
            <p className="text-gray-600">No yards found</p>
            {searchTerm && (
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yard ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yard Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yard Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredYards.map((yard) => (
                    <tr key={yard._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {yard.yardId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {yard.yardName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {yard.yardCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {yard.yardType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            yard.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {yard.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleOpenModal(yard)}
                            className="text-[#42aeec] hover:text-[#3598c7]"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(yard._id!)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingYard ? 'Edit Yard' : 'Add New Yard'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yard Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.yardName}
                    onChange={(e) => setFormData({ ...formData, yardName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                    placeholder="Enter yard name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yard Code / Short Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.yardCode}
                    onChange={(e) => setFormData({ ...formData, yardCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                    placeholder="Enter yard code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yard Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.yardType}
                    onChange={(e) => setFormData({ ...formData, yardType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                  >
                    {yardTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#42aeec] text-white rounded-lg hover:bg-[#3598c7] transition-colors"
                  >
                    {editingYard ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YardManagement;

