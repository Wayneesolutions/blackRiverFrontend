import { type AxiosResponse } from 'axios'
import apiClient from '../apiClient'

interface Error {
    response?: {
        data?: {
            message: string,
        }
    }
}

export const getVehicleDocument = async (data: any) => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/vehicle-document`, data);
        console.log("==res ", res);
        return res.data;
    } catch (error: any) {
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