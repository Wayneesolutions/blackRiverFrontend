import { type AxiosResponse } from 'axios'
import apiClient from '../apiClient'

interface Error {
    response?: {
        data?: {
            message: string,
        }
    }
}

export const getVehicleDocument = async () => {
    try {
        console.log('🚀 FRONTEND: Fetching vehicle documents from hr/vehicle-document');
        const res: AxiosResponse = await apiClient.get(`hr/vehicle-document`);
        console.log("📡 FRONTEND: Vehicle documents response:", res.data);
        return res.data;
    } catch (error: any) {
        console.error("❌ FRONTEND: Vehicle documents error:", error);
        const err = error as Error;
        return err.response?.data;
    }
};


export const createVehicleDocument = async (data: any) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/vehicle-document`, data);
        console.log("==res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const updateVehicleDocument = async (id: string, data: any) => {
    try {
        const res: AxiosResponse = await apiClient.put(`hr/vehicle-document/${id}`, data);
        console.log("==update res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const deleteVehicleDocument = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.delete(`hr/vehicle-document/${id}`);
        console.log("==delete res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const getExpiringVehicleDocuments = async (days: number = 30) => {
  try {
    const response: AxiosResponse<{
      success: boolean;
      data: any[];
    }> = await apiClient.get(`/hr/vehicle-document/expiring?days=${days}`);
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching expiring vehicle documents:', error);
    // Return error structure instead of throwing
    return error?.response?.data || { success: false, message: error?.message || 'Failed to fetch expiring vehicle documents', data: [] };
  }
};

export const getSignedVehicleDocumentUrl = async (id: string, fileIndex: number = 0, disposition: 'inline' | 'attachment' = 'inline') => {
  try {
    const res = await apiClient.get(`hr/vehicle-document/${id}/signed-url?fileIndex=${fileIndex}&disposition=${disposition}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};