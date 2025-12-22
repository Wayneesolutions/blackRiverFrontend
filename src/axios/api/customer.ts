import apiClient from '../apiClient';
import type { AxiosResponse } from 'axios';

// Customer Management APIs

// Get all customers with filters and pagination
export const getAllCustomers = async (page: number = 1, limit: number = 10, search?: string, status?: string) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    params.append('role', 'customer');
    
    const res: AxiosResponse = await apiClient.get(`employee?${params.toString()}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// Create customer
export const createCustomer = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('customer', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// Update customer
export const updateCustomer = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`customer/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// Delete customer
export const deleteCustomer = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`customer/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

