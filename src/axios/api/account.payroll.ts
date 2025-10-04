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
        console.log("==getEmployees res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const createPayroll = async (data: any) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/create-payroll`, data);
        console.log("==createPayroll res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const listPayrolls = async () => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/list-payroll`);
        console.log("==listPayrolls res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const updatePayroll = async (id: string, data: any) => {
    try {
        const res: AxiosResponse = await apiClient.put(`hr/update-payroll/${id}`, data);
        console.log("==updatePayroll res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};


export const deletePayroll = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.delete(`hr/delete-payroll/${id}`);
        console.log("==deletePayroll res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};
