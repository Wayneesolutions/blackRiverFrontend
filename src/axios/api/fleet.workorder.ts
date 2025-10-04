import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}

export const getAllWorkOrders = async () => {
    try {
        const res: AxiosResponse = await apiClient.get(`admin/workorders`);
        console.log("==getAllWorkOrders res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const getWorkOrderById = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.get(`admin/workorders/${id}`);
        console.log("==getWorkOrderById res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const createWorkOrder = async (data: any) => {
    try {
        const res: AxiosResponse = await apiClient.post(`admin/workorders`, data);
        console.log("==createWorkOrder res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const updateWorkOrder = async (id: string, data: any) => {
    try {
        const res: AxiosResponse = await apiClient.put(`admin/workorders/${id}`, data);
        console.log("==updateWorkOrder res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const deleteWorkOrder = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.delete(`admin/workorders/${id}`);
        console.log("==deleteWorkOrder res ", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};
