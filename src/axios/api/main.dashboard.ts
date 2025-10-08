import type { AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface ApiError {
    response?: {
        data?: {
            message: string;
        };
    };
}


export const quickStats = async () => {
    try {
        const res: AxiosResponse = await apiClient.get("admin/stats");
        return res.data;
    } catch (error) {
        console.error(error);
        return (error as ApiError).response?.data;
    }
};


export const loadsPerMonth = async () => {
    try {
        const res: AxiosResponse = await apiClient.get("admin/loads-per-month");
        return res.data;
    } catch (error) {
        console.error(error);
        return (error as ApiError).response?.data;
    }
};


export const revenueTrend = async () => {
    try {
        const res: AxiosResponse = await apiClient.get("admin/revenue-trend");
        return res.data;
    } catch (error) {
        console.error(error);
        return (error as ApiError).response?.data;
    }
};


export const fuelEfficiency = async () => {
    try {
        const res: AxiosResponse = await apiClient.get("admin/fuel-efficiency");
        return res.data;
    } catch (error) {
        console.error(error);
        return (error as ApiError).response?.data;
    }
};


export const recentAlerts = async () => {
    try {
        const res: AxiosResponse = await apiClient.get("admin/alerts");
        return res.data;
    } catch (error) {
        console.error(error);
        return (error as ApiError).response?.data;
    }
};
