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

// Bulk AI-powered Driver Payroll Generation (processes all drivers automatically)
export const bulkGenerateAIDriverPayrolls = async (data: {
    startDate: string;
    endDate: string;
    payDate?: string;
}) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/driver-payroll/bulk-generate-ai`, data);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};