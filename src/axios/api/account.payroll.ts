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


export const listPayrolls = async (searchParam?: string) => {
    try {
        const url = searchParam ? `hr/list-payroll${searchParam}` : `hr/list-payroll`;
        const res: AxiosResponse = await apiClient.get(url);
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

export const deleteAllPayrolls = async () => {
    try {
        const res: AxiosResponse = await apiClient.delete(`hr/delete-all-payrolls`);
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

// Automated Payroll Generation
export const generateAutomatedPayroll = async (data: {
    userId: string;
    month: number;
    year: number;
    baseSalary?: number;
}) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/generate-payroll`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Bulk Generate Payrolls
export const bulkGeneratePayrolls = async (data: {
    employeeIds: string[];
    month: number;
    year: number;
}) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/bulk-generate-payrolls`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Monthly Salary Report
export const getMonthlySalaryReport = async (month: number, year: number) => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/monthly-salary-report?month=${month}&year=${year}`);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// AI-powered Driver Payroll Analysis
export const generateAIDriverPayroll = async (data: {
    driverId: string;
    startDate: string;
    endDate: string;
}) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/driver-payroll/ai-analysis`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Bulk AI-powered Driver Payroll Analysis (returns suggestions for review)
export const bulkAnalyzeAIDriverPayrolls = async (data: {
    startDate: string;
    endDate: string;
    payDate?: string;
}) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/driver-payroll/bulk-analyze-ai`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Bulk Create Driver Payrolls from AI suggestions (after user review)
export const bulkCreateDriverPayrolls = async (data: {
    payrolls: any[];
    startDate: string;
    endDate: string;
    payDate?: string;
}) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/driver-payroll/bulk-create`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Keep old function for backward compatibility
export const bulkGenerateAIDriverPayrolls = bulkAnalyzeAIDriverPayrolls;

// Bulk AI-powered payroll generation for ALL employees
export const bulkAIGenerateAllPayrolls = async (data: {
    startDate: string;
    endDate: string;
    payDate?: string;
}) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/bulk-ai-generate-all-payrolls`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};