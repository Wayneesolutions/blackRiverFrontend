import type { AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
  response?: {
    data?: {
      message: string,
    }
  }
}

// ✅ Login
export const login = async (data:{email:string,password:string}) =>{
  try {
    const res: AxiosResponse = await apiClient.post(`login`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

// ✅ Get Current User Profile
export const getCurrentUserProfile = async () => {
  try {
    const res: AxiosResponse = await apiClient.get(`auth/me`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

// ✅ Update Current User Profile
export const updateCurrentUserProfile = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`auth/me`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

// ✅ Change Password
export const changePassword = async (data: {newPassword: string}) => {
  try {
    const res: AxiosResponse = await apiClient.put(`auth/change-password`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

// ✅ Super Admin Login
export const loginSuperAdmin = async (data: {email: string, password: string}) => {
  try {
    const res: AxiosResponse = await apiClient.post(`superadmin/login`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}