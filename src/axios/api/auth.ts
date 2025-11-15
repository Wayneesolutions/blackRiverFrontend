import type { AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
  response?: {
    data?: {
      message: string,
    }
  }
}

export const login = async (data: { email: string; password: string }) => {
  try {
    const res: AxiosResponse = await apiClient.post('admin/login', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const registerAdmin = async (data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  policies?: string;
}) => {
  try {
    const res: AxiosResponse = await apiClient.post('admin/register', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const loginSuperAdmin = async (data: { email: string; password: string }) => {
  try {
    const res: AxiosResponse = await apiClient.post('superadmin/login', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};