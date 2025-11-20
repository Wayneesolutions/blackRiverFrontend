import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
  response?: {
    data?: {
      message: string;
    };
  };
}

// Vehicle Service Data Types
export interface VehicleServiceData {
  vehicleId: string;
  serviceType: 'oil-change' | 'tire-rotation' | 'bike-inspection' | 'general-maintenance' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  dueMileage: number;
  assignedMechanic: string;
  description?: string;
}

export interface UpdateServiceData {
  vehicleId?: string;
  serviceType?: 'oil-change' | 'tire-rotation' | 'bike-inspection' | 'general-maintenance' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  dueMileage?: number;
  assignedMechanic?: string;
  description?: string;
}

export interface ServiceFilters {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in-progress' | 'completed';
  serviceType?: 'oil-change' | 'tire-rotation' | 'bike-inspection' | 'general-maintenance' | 'other';
  mechanic?: string;
  vehicleId?: string;
}

export interface VehicleServiceResponse {
  _id: string;
  vehicleId: {
    _id: string;
    plateNumber: string;
    internalId?: string;
    model?: string;
    make?: string;
    year?: number;
  };
  serviceType: string;
  priority: string;
  dueDate: string;
  dueMileage: number;
  assignedMechanic: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// ✅ CREATE VEHICLE SERVICE
export const createVehicleService = async (data: VehicleServiceData) => {
  try {
    console.log('🚀 FRONTEND: Creating vehicle service with data:', data);
    const res: AxiosResponse = await apiClient.post('admin/vehicle-service', data);
    console.log('✅ FRONTEND: Create service response:', res.data);
    return res.data;
  } catch (error) {
    console.log('❌ FRONTEND: Create service error:', error);
    return (error as Error).response?.data;
  }
};

// ✅ UPDATE VEHICLE SERVICE (full update)
export const updateVehicleService = async (id: string, data: UpdateServiceData) => {
  try {
    console.log('🚀 FRONTEND: Updating vehicle service:', id, 'with data:', data);
    const res: AxiosResponse = await apiClient.put(`admin/vehicle-service/${id}`, data);
    console.log('✅ FRONTEND: Update service response:', res.data);
    return res.data;
  } catch (error) {
    console.log('❌ FRONTEND: Update service error:', error);
    return (error as Error).response?.data;
  }
};

// ✅ UPDATE SERVICE STATUS
export const updateServiceStatus = async (id: string, status: 'pending' | 'in-progress' | 'completed') => {
  try {
    console.log('🚀 FRONTEND: Updating service status:', id, 'to:', status);
    const res: AxiosResponse = await apiClient.patch(`admin/vehicle-service/${id}/status`, { status });
    console.log('✅ FRONTEND: Update status response:', res.data);
    return res.data;
  } catch (error) {
    console.log('❌ FRONTEND: Update status error:', error);
    return (error as Error).response?.data;
  }
};

// ✅ DELETE VEHICLE SERVICE
export const deleteVehicleService = async (id: string) => {
  try {
    console.log('🚀 FRONTEND: Deleting vehicle service:', id);
    const res: AxiosResponse = await apiClient.delete(`admin/vehicle-service/${id}`);
    console.log('✅ FRONTEND: Delete service response:', res.data);
    return res.data;
  } catch (error) {
    console.log('❌ FRONTEND: Delete service error:', error);
    return (error as Error).response?.data;
  }
};

// ✅ LIST VEHICLE SERVICES WITH FILTERS
export const listVehicleServices = async (filters?: ServiceFilters) => {
  try {
    console.log('🚀 FRONTEND: Listing vehicle services with filters:', filters);
    const params = new URLSearchParams();
    
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.serviceType) params.append('serviceType', filters.serviceType);
    if (filters?.mechanic) params.append('mechanic', filters.mechanic);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);

    const queryString = params.toString();
    const url = `admin/vehicle-service${queryString ? `?${queryString}` : ''}`;
    
    console.log('📡 FRONTEND: Making request to:', url);
    const res: AxiosResponse = await apiClient.get(url);
    console.log('✅ FRONTEND: List services response:', res.data);
    return res.data;
  } catch (error) {
    console.log('❌ FRONTEND: List services error:', error);
    return (error as Error).response?.data;
  }
};

// ✅ GET SINGLE VEHICLE SERVICE
export const getVehicleServiceById = async (id: string) => {
  try {
    console.log('🚀 FRONTEND: Getting vehicle service by ID:', id);
    const res: AxiosResponse = await apiClient.get(`admin/vehicle-service/${id}`);
    console.log('✅ FRONTEND: Get service by ID response:', res.data);
    return res.data;
  } catch (error) {
    console.log('❌ FRONTEND: Get service by ID error:', error);
    return (error as Error).response?.data;
  }
};
