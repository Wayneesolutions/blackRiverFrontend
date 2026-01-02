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

// Get all users for drug test (excluding admin and superadmin)
export const getAllUsersForDrugTest = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('hr/users-for-drug-test');
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching users for drug test:', error);
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

// ==================== TRAINING CERTIFICATE APIs ====================
export interface TrainingCertificate {
  _id?: string;
  driverId: string;
  driverName?: string;
  certificateName: string;
  certificateType: string;
  issuedDate: string;
  expiryDate?: string;
  issuingAuthority: string;
  certificateNumber?: string;
  fileUrl?: string;
  fileName?: string;
  status: 'active' | 'expired' | 'expiring_soon';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getTrainingCertificates = async (params?: {
  search?: string;
  driverId?: string;
  certificateType?: string;
  status?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.driverId) queryParams.append('driverId', params.driverId);
    if (params?.certificateType) queryParams.append('certificateType', params.certificateType);
    if (params?.status) queryParams.append('status', params.status);
    
    const queryString = queryParams.toString();
    const url = `hr/driver/training-certificate${queryString ? `?${queryString}` : ''}`;
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching training certificates:', error);
    return (error as any).response?.data;
  }
};

export const getTrainingCertificateById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`hr/driver/training-certificate/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching training certificate:', error);
    return (error as any).response?.data;
  }
};

export const createTrainingCertificate = async (formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.post('hr/driver/training-certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.error('❌ Error creating training certificate:', error);
    return (error as any).response?.data;
  }
};

export const updateTrainingCertificate = async (id: string, formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.put(`hr/driver/training-certificate/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.error('❌ Error updating training certificate:', error);
    return (error as any).response?.data;
  }
};

export const deleteTrainingCertificate = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`hr/driver/training-certificate/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error deleting training certificate:', error);
    return (error as any).response?.data;
  }
};

export const getTrainingCertificateSignedUrl = async (id: string, disposition: 'inline' | 'attachment' = 'inline') => {
  try {
    const res: AxiosResponse = await apiClient.get(`hr/driver/training-certificate/${id}/signed-url?disposition=${disposition}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error getting training certificate signed URL:', error);
    return (error as any).response?.data;
  }
};

// ==================== DRUG TEST APIs ====================
export interface DrugTestRequest {
  _id?: string;
  driverId: string;
  driverName?: string;
  testType: string;
  reason: string;
  scheduledDate: string;
  scheduledTime?: string;
  labName: string;
  collectionSiteName?: string;
  collectionSiteAddress?: string;
  collectionSitePhone?: string;
  importantDetails?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export const getDrugTests = async (params?: {
  search?: string;
  driverId?: string;
  status?: string;
  testType?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.driverId) queryParams.append('driverId', params.driverId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.testType) queryParams.append('testType', params.testType);
    
    const queryString = queryParams.toString();
    const url = `hr/driver/drug-test${queryString ? `?${queryString}` : ''}`;
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching drug tests:', error);
    return (error as any).response?.data;
  }
};

export const getDrugTestById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`hr/driver/drug-test/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching drug test:', error);
    return (error as any).response?.data;
  }
};

export const createDrugTest = async (data: DrugTestRequest) => {
  try {
    const res: AxiosResponse = await apiClient.post('hr/driver/drug-test', data);
    return res.data;
  } catch (error) {
    console.error('❌ Error creating drug test:', error);
    return (error as any).response?.data;
  }
};

export const updateDrugTest = async (id: string, data: Partial<DrugTestRequest>) => {
  try {
    const res: AxiosResponse = await apiClient.put(`hr/driver/drug-test/${id}`, data);
    return res.data;
  } catch (error) {
    console.error('❌ Error updating drug test:', error);
    return (error as any).response?.data;
  }
};

export const deleteDrugTest = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`hr/driver/drug-test/${id}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error deleting drug test:', error);
    return (error as any).response?.data;
  }
};