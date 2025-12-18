import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}

// Get HOS/ELD data for compliance dashboard
export const getHOSEldData = async (params?: {
    startDate?: string;
    endDate?: string;
}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        
        const url = `compliance/hos-eld${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res: AxiosResponse = await apiClient.get(url);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Sync HOS data from Geotab
export const syncHOSFromGeotab = async () => {
    try {
        const res: AxiosResponse = await apiClient.post(`compliance/hos-eld/sync`);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Get HOS data for a specific driver
export const getDriverHOS = async (driverId: string, params?: {
    startDate?: string;
    endDate?: string;
}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        
        const url = `compliance/hos-eld/driver/${driverId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res: AxiosResponse = await apiClient.get(url);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Get vehicle ELD status
export const getVehicleELDStatus = async (vehicleId: string) => {
    try {
        const res: AxiosResponse = await apiClient.get(`compliance/hos-eld/vehicle/${vehicleId}`);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

