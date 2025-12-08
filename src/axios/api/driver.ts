import apiClient from '../apiClient';
import type { AxiosResponse } from 'axios';

// Driver interfaces
export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  mobile?: string;
  company?: string;
  gender?: string;
  csa?: string;
  status: 'active' | 'inactive';
  address?: string;
  citizenship?: string;
  country?: string;
  employmentDetails?: string;
  wsib?: string;
  fastCard?: string;
  medicalTracking?: string;
  role?: string;
  internalId: string;
  joinDate: string;
  profileImageUrl?: string | null;
  policies?: string;
  lastModified?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Functions
export const getAllDrivers = async (page: number = 1, limit: number = 10, search?: string, status?: string) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const res: AxiosResponse = await apiClient.get(`hr/driver?${params.toString()}`);
    console.log('🔍 Driver API response:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching drivers:', error);
    return (error as any).response?.data;
  }
};

export const getDriverById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`hr/driver/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching driver:', error);
    return (error as any).response?.data;
  }
};

export const createDriver = async (data: FormData) => {
  try {
    console.log('🔍 Creating driver with data:', data);
    const res: AxiosResponse = await apiClient.post('hr/driver', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('✅ Driver created successfully:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error creating driver:', error);
    return (error as any).response?.data;
  }
};

export const updateDriver = async (id: string, data: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.put(`hr/driver/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    console.error('❌ Error updating driver:', error);
    return (error as any).response?.data;
  }
};

export const updateDriverStatus = async (id: string, status: string) => {
  try {
    const res: AxiosResponse = await apiClient.patch(`hr/driver/${id}/status`, { status });
    return res.data;
  } catch (error) {
    console.error('❌ Error updating driver status:', error);
    return (error as any).response?.data;
  }
};

export const deleteDriver = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`hr/driver/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error deleting driver:', error);
    return (error as any).response?.data;
  }
};

export const bulkDeleteDrivers = async (ids: string[]) => {
  try {
    const res: AxiosResponse = await apiClient.delete('hr/driver/bulk/delete', { data: { ids } });
    return res.data;
  } catch (error) {
    console.error('❌ Error bulk deleting drivers:', error);
    return (error as any).response?.data;
  }
};

export const getDriverStats = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('hr/driver/stats');
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching driver stats:', error);
    return (error as any).response?.data;
  }
};

// Generate internal ID for new drivers
export const generateInternalId = (role: string = 'driver') => {
  const timestamp = Date.now().toString().slice(-6);
  const rolePrefix = role === 'driver' ? 'DRV' : 'EMP';
  return `${rolePrefix}-${timestamp}`;
};
