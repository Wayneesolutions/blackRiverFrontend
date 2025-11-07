import { useEffect, useMemo, useState } from 'react';
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
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
    } finally {
      setUserInfoReady(true);
    }
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await listDriver();

      if (res?.success) {
        const data = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];
        setDrivers(data);
        if (res.message && data.length === 0) {
          setEmptyStateMessage(res.message);
        } else if (data.length > 0) {
          setEmptyStateMessage(null);
        }
      } else {
        setDrivers([]);
        setEmptyStateMessage(res?.message || 'Failed to load drivers.');
      }
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
      setEmptyStateMessage(error?.message || 'Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const isSuperadmin = userInfo?.role === 'superadmin';
    const hasCompany = Boolean(userInfo?.company);

    if (!isSuperadmin && !hasCompany) {
      setDrivers([]);
      setEmptyStateMessage('No company assigned to the current admin.');
      setLoading(false);
      return;
    }

    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoReady, userInfo]);

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

  if (emptyStateMessage && drivers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-5xl text-gray-300">🧑‍✈️</div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800">No driver data available</h2>
          <p className="text-gray-500">{emptyStateMessage}</p>
        </div>
      </div>
    );
  }

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
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-blue-600 !text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Driver</span>
              </button>
            </div>
          </div>
        </div>

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
                        No drivers found.
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