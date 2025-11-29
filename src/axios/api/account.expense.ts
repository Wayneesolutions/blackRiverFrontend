import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
    response?: {
        data?: {
            message: string;
        };
    };
}

// Create Expense (with file upload)
export const createExpense = async (data: FormData) => {
    try {
        const res: AxiosResponse = await apiClient.post(`hr/create-expense`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        console.log("==createExpense res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// List Expenses
export const listExpenses = async () => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/list-expense`);
        console.log("==listExpenses res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Update Expense
export const updateExpense = async (id: string, data: FormData | Record<string, any>) => {
    try {
        const res: AxiosResponse = await apiClient.put(`hr/update-expense/${id}`, data, {
            headers: data instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
        });
        console.log("==updateExpense res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Delete Expense
export const deleteExpense = async (id: string) => {
    try {
        const res: AxiosResponse = await apiClient.delete(`hr/delete-expense/${id}`);
        console.log("==deleteExpense res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};

// Get Expense Receipt Signed URL
export const getExpenseReceiptSignedUrl = async (expenseId: string, disposition: 'inline' | 'attachment' = 'inline') => {
    try {
        const res: AxiosResponse = await apiClient.get(`hr/expense/${expenseId}/receipt-signed-url`, {
            params: { disposition }
        });
        console.log("==getExpenseReceiptSignedUrl res", res);
        return res.data;
    } catch (error: any) {
        const err = error as Error;
        return err.response?.data;
    }
};