import type { AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
  response?: {
    data?: {
      message: string,
    }
  }
}

// ✅ Get All Admins (Customers)
export const getAllAdmins = async (search?: string, status?: string, page: number = 1, limit: number = 100) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    
    const res: AxiosResponse = await apiClient.get(`superadmin/admin?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Get Admin by ID
export const getAdminById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`superadmin/admin/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Create Admin
export const createAdmin = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('superadmin/admin', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Update Admin
export const updateAdmin = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`superadmin/admin/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Delete Admin
export const deleteAdmin = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`superadmin/admin/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ============ PLAN MANAGEMENT ============

// ✅ Get All Plans
export const getAllPlans = async (status?: string, planType?: string) => {
  try {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (planType && planType !== 'all') params.append('planType', planType);
    
    const res: AxiosResponse = await apiClient.get(`superadmin/plan?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Get Plan by ID
export const getPlanById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`superadmin/plan/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Create Plan
export const createPlan = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('superadmin/plan', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Update Plan
export const updatePlan = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`superadmin/plan/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// ✅ Delete Plan
export const deletePlan = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`superadmin/plan/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

