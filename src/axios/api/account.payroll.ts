import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}


export const getEmployees = async () => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/get-employees`);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const createPayroll = async (data: any) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/create-payroll`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const listPayrolls = async () => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/list-payroll`);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const updatePayroll = async (id: string, data: any) => {
    try {
        const res: AxiosResponse = await apiClient.put(`hr/update-payroll/${id}`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const deletePayroll = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.delete(`hr/delete-payroll/${id}`);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const getDriverCompletedLoads = async (driverId: string, startDate?: string, endDate?: string) => {
    try {
        let url = `hr/completed-loads/${driverId}`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const res: AxiosResponse = await apiClient.get(url);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const getDriverCompletedTrips = async (driverId: string, startDate?: string, endDate?: string) => {
    try {
        let url = `hr/completed-trips/${driverId}`;
        if (startDate && endDate) {
            url += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const res: AxiosResponse = await apiClient.get(url);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};