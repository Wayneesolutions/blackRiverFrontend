import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, User } from 'lucide-react';
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
  joinDate?: string;
  status?: string;
  role?: string;
  country?: string;
}

const DriversTable = () => {
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

      // Handle different userInfo structures (userData.company or direct company)
      const userRole = userInfo?.role || userInfo?.userData?.role;
      const userCompany = userInfo?.company || userInfo?.userData?.company;
      const isSuperadmin = userRole === 'superadmin';
      const isDispatcher = userRole === 'dispatcher';
      const hasCompany = Boolean(userCompany);

      // Allow dispatchers to call API even if company is not visible in localStorage
      // The backend will handle company filtering based on the authenticated user
      if (!isSuperadmin && !isDispatcher && !hasCompany) {
        setDrivers([]);
        setEmptyStateMessage('No company assigned. Please complete company settings to view drivers.');
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
      const country = driver.country || '';
      return (
        name.toLowerCase().includes(query) ||
        email.toLowerCase().includes(query) ||
        internalId.toLowerCase().includes(query) ||
        phone.toLowerCase().includes(query) ||
        country.toLowerCase().includes(query)
      );
    });
  }, [drivers, searchQuery]);

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusConfig: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
      suspended: { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
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
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Internal ID
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Country
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Join Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDrivers.length > 0 ? (
                    filteredDrivers.map((driver) => (
                      <tr key={driver._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {driver.name || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {driver.role ? driver.role.charAt(0).toUpperCase() + driver.role.slice(1) : 'Driver'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {driver.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {driver.internalId || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {driver.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {driver.country || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(driver.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {driver.joinDate 
                            ? new Date(driver.joinDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : driver.createdAt 
                              ? new Date(driver.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : 'N/A'
                          }
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-300" />
                          </div>
                          <div>
                            <p className="text-base font-medium text-gray-700">No drivers found</p>
                            {emptyStateMessage && (
                              <p className="text-sm text-gray-400 mt-1">{emptyStateMessage}</p>
                            )}
                          </div>
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
    </div>
  );
};

export default DriversTable;