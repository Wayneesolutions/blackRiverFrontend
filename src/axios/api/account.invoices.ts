import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}


export const createInvoice = async (data: any) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/create-invoice`, data);
        console.log("==createInvoice res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// List All Invoices
export const listInvoices = async () => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/list-invoice`);
        console.log("==listInvoices res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Get Invoice by ID
export const getInvoiceById = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/list-invoice/${id}`);
        console.log("==getInvoiceById res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Update Invoice
export const updateInvoice = async (id: string, data: any) => {
    try {
        const res: AxiosResponse = await apiClient.put(`hr/update-invoice/${id}`, data);
        console.log("==updateInvoice res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Delete Invoice
export const deleteInvoice = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.delete(`hr/delete-invoice/${id}`);
        console.log("==deleteInvoice res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const listLoad = async () =>{
    try {

    const res: AxiosResponse = await apiClient.get(`dispatcher/load`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}