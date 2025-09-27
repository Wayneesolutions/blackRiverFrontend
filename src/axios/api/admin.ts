import type { AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
  response?: {
    data?: {
      message: string,
    }
  }
}


export const compilancsummary = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('admin/compilance-summary');
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const createUser = async (data) => {
  try {
    const res: AxiosResponse = await apiClient.post('admin/user', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const updateUser = async (id, data) => {
  try {
    const res: AxiosResponse = await apiClient.put(`admin/user/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const deleteUser = async (id) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`admin/user/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const updateUserStatus = async (id, status) => {
  try {
    const res: AxiosResponse = await apiClient.patch(`admin/user/${id}/status`, { status });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const listUsers = async (role?: string) => {
  try {
    const url = role && role !== 'all' ? `admin/user?role=${role}` : 'admin/user';
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};



export const getCompany = async () =>{
  try {
    const res: AxiosResponse = await apiClient.get('admin/company');
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

export const updateCompany = async (data) =>{
  try {
    const res: AxiosResponse = await apiClient.post('admin/company',data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}