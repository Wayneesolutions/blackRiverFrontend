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

export const createUser = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('admin/user', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const updateUser = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`admin/user/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const deleteUser = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`admin/user/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const updateUserStatus = async (id: string, status: string) => {
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

export const updateCompany = async (data: any) =>{
  try {
    const res: AxiosResponse = await apiClient.post('admin/company',data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

// CVSA Inspection API Functions
export const getCvsaInspections = async (params?: { country?: string; status?: string; search?: string; page?: number; limit?: number }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.country) queryParams.append('country', params.country);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `admin/cvsa-inspections${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const getCvsaInspectionById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`admin/cvsa-inspections/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const getCvsaInspectionStats = async (country?: string) => {
  try {
    const url = country ? `admin/cvsa-inspections/stats?country=${country}` : 'admin/cvsa-inspections/stats';
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const createCvsaInspection = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('admin/cvsa-inspections', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const updateCvsaInspection = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`admin/cvsa-inspections/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const deleteCvsaInspection = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`admin/cvsa-inspections/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const getCvsaMonthlyReport = async (year?: number, country?: string) => {
  try {
    const queryParams = new URLSearchParams();
    if (year) queryParams.append('year', year.toString());
    if (country) queryParams.append('country', country);
    
    const url = `admin/cvsa-inspections/monthly-report${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// Ticket API Functions
export const getTickets = async (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `admin/tickets${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const getTicketById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`admin/tickets/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const getTicketStats = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('admin/tickets/stats');
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const createTicket = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('admin/tickets', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const updateTicket = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`admin/tickets/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

export const deleteTicket = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`admin/tickets/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};

// Shift API Functions
export const getShifts = async (params?: { driverId?: string; startDate?: string; endDate?: string }) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.driverId) queryParams.append('driverId', params.driverId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `admin/shift${queryString ? `?${queryString}` : ''}`;
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
};