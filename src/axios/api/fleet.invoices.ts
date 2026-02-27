import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}

// Fleet Invoice Summary
export interface FleetInvoiceSummary {
  paidAmount: number;
  paidCount: number;
  unpaidAmount: number;
  unpaidCount: number;
  overdueAmount: number;
  overdueCount: number;
  totalAmount: number;
  totalCount: number;
}

export const getFleetInvoiceSummary = async (): Promise<{ success: boolean; data?: FleetInvoiceSummary; message?: string }> => {
  try {
    const res: AxiosResponse = await apiClient.get('admin/fleet-invoices/summary');
    return res.data;
  } catch (error: unknown) {
    const err = error as Error;
    const data = err.response?.data as { success?: boolean; message?: string } | undefined;
    return { success: false, ...data, message: data?.message || 'Failed to load invoice summary' };
  }
};

// Fleet Invoices API
export const getFleetInvoices = async (params?: { status?: string; search?: string }): Promise<any> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);
        
        const url = `admin/fleet-invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const res: AxiosResponse = await apiClient.get(url);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const getFleetInvoiceById = async (id: string): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.get(`admin/fleet-invoices/${id}`);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const createFleetInvoice = async (data: any): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.post(`admin/fleet-invoices`, data);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const updateFleetInvoice = async (id: string, data: any): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.put(`admin/fleet-invoices/${id}`, data);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const updateFleetInvoiceStatus = async (id: string, status: string): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.patch(`admin/fleet-invoices/${id}/status`, { status });
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const deleteFleetInvoice = async (id: string): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.delete(`admin/fleet-invoices/${id}`);
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};

export const emailFleetInvoice = async (id: string): Promise<any> => {
    try {
        const res: AxiosResponse = await apiClient.post(`admin/fleet-invoices/${id}/email`, {});
        return res.data;
    } catch (error: unknown) {
        const err = error as Error;
        return err.response?.data;
    }
};

