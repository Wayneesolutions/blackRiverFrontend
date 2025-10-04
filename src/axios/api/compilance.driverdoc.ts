import { type AxiosResponse } from 'axios'
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}


export const getAllDriverDocuments = async () => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/driver-document`);
        console.log("==getAllDriverDocuments res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const getDriverDocumentsById = async (driverId: string) => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/driver-document/${driverId}`);
        console.log("==getDriverDocumentsById res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const createDriverDocument = async (driverId: string, data: FormData) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/driver-document/${driverId}`, data, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("==createDriverDocument res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const updateDriverDocument = async (id: string, data: FormData) => {
    try {
        const res: AxiosResponse = await apiClient.put(`hr/driver-document/${id}`, data, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("==updateDriverDocument res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const deleteDriverDocument = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.delete(`hr/driver-document/${id}`);
        console.log("==deleteDriverDocument res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};
