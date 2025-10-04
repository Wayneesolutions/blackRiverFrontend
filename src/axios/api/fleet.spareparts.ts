import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}


export const getAllSpareParts = async (): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.get(`admin/spareparts`);
        console.log("==getAllSpareParts res ", res);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const createSparePart = async (data: any): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.post(`admin/spareparts`, data);
        console.log("==createSparePart res ", res);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const useSparePart = async (id: string, data?: any): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.put(`admin/spareparts/${id}/use`, data);
        console.log("==useSparePart res ", res);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};
