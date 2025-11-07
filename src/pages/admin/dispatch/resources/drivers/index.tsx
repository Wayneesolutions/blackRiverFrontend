import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Search, MoreVertical, User, Filter } from 'lucide-react';
import NewDriverSidebar from './NewDriverSidebar';
import { listDriver } from '../../../../../axios/api/distapcher';

interface Driver {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  internalId?: string;
  vendor?: string;
  vehicle?: string;
  licenceNumber?: string;
  createdAt?: string;
}

const DriversTable = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [emptyStateMessage, setEmptyStateMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
      return null;
    }
  });
  const location = useLocation();

  const sanitizeMessage = useCallback((message?: string | null) => {
    if (!message) return null;
    return message.toLowerCase().includes('no company assigned') ? null : message;
  }, []);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      if (!userInfo) {
        setDrivers([]);
        setEmptyStateMessage(null);
        return;
      }

      const isSuperadmin = userInfo?.role === 'superadmin';
      const hasCompany = Boolean(userInfo?.company);

      if (!isSuperadmin && !hasCompany) {
        setDrivers([]);
        setEmptyStateMessage(null);
        return;
      }

      const res = await listDriver();
      const message = sanitizeMessage(res?.message || null);

      if (res?.success) {
        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];

        setDrivers(data);
        if (data.length === 0) {
          setEmptyStateMessage(message || 'No drivers found.');
        } else {
          setEmptyStateMessage(null);
        }
      } else {
        setDrivers([]);
        setEmptyStateMessage(message || 'Failed to load drivers.');
      }
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
      setEmptyStateMessage(sanitizeMessage(error?.message) || 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }, [userInfo, sanitizeMessage]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'userInfo' && event.newValue) {
        try {
          setUserInfo(JSON.parse(event.newValue));
        } catch (error) {
          console.error('Error parsing userInfo from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers, location.pathname]);

  const filteredDrivers = useMemo(() => {
    if (!searchQuery.trim()) {
      return drivers;
    }

    const query = searchQuery.toLowerCase();
    return drivers.filter((driver) => {
      const name = driver.name || '';
      const email = driver.email || '';
      const internalId = driver.internalId || '';
      const phone = driver.phone || '';
      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        internalId.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query)
      );
    });
  }, [drivers, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  const canCreateDriver = userInfo?.role === 'superadmin' || Boolean(userInfo?.company);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex-1">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search drivers..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Filter className="w-5 h-5" />
              </button>
              {canCreateDriver && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Driver</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {emptyStateMessage && filteredDrivers.length === 0 && (
          <div className="mx-6 mt-4 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <User />
            <span className="text-sm">{emptyStateMessage}</span>
          </div>
        )}

        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Internal ID</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDrivers.length > 0 ? (
                    filteredDrivers.map((driver) => (
                      <tr key={driver._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{driver.name || 'N/A'}</div>
                              {driver.email && <div className="text-xs text-gray-500">{driver.email}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.email || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{driver.internalId || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.phone || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-2">
                          <User className="w-10 h-10 text-gray-300" />
                          <p>No drivers found.</p>
                          {emptyStateMessage && (
                            <p className="text-xs text-gray-400">{emptyStateMessage}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <NewDriverSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
};

export default DriversTable;