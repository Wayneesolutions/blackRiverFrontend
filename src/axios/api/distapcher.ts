import  { type AxiosResponse } from 'axios'
import apiClient from '../apiClient'

interface Error {
  response?: {
    data?: {
      message: string,
    }
  }
}

export const listCustomer = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/customer`);
    console.log('==res ', res)
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: error?.message || 'Failed to fetch customers', data: null };
  }
}


export const deleteCustomer = async (id:string) =>{
    try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/customer/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateCustomer = async (id:string, data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/customer/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const createtCustomer = async (data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/customer`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const deleteContact = async (id:string) =>{
    try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/contact/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const updateContact = async (id:string, data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.put(`dispatcher/contact/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const listContact = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/contact`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const createContact = async (data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/contact`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateStatusVendor = async (id: string, status: any) =>{
    try {
    const res: AxiosResponse = await apiClient.patch(`dispatcher/vendor/${id}/status`,status);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const listVendor = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/vendor`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const deleteVendor = async (id:string) =>{
    try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/vendor/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const updateVendor = async (id:string, data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.put(`dispatcher/vendor/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const createVendor = async (data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/vendor`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const deleteFleet = async (id:string) =>{
    try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/fleet/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const updateStatusFleet = async (id:string) =>{
    try {
    const res: AxiosResponse = await apiClient.patch(`dispatcher/fleet/${id}/status`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const updateFleet = async (id:string, data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.put(`dispatcher/fleet/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const listFleet = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/fleet`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const createFleet = async (data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/fleet`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const listTrailers = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/trailer`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const createTrailer = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/trailer`, data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateTrailer = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`dispatcher/trailer/${id}`, data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const deleteTrailer = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/trailer/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getTrailerById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/trailer/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const searchTrailers = async (query: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/trailer/search?q=${query}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const getTrailerStats = async () => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/trailer/stats`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateTrailerStatus = async (id: string, status: string) => {
  try {
    const res: AxiosResponse = await apiClient.patch(`dispatcher/trailer/${id}/status`, { status });
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const deleteVehicle = async (id:string) =>{
  try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/vehicle/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

export const listVehicle = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/vehicle`);
    console.log('==res ', res)
    return res.data;
  } catch (error: any) {
    console.log(error);
    // Return error response data if available, otherwise return error structure
    return error?.response?.data || { success: false, message: error?.message || 'Failed to fetch vehicles', data: null };
  }
}

export const createVehicle = async (data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/vehicle`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const deleteServiceRate = async (id:string) =>{
    try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/service-rate/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const updateServiceRate = async (id:string, data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.put(`dispatcher/service-rate/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const listServiceRate = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/service-rate`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const createServiceRate = async (data: any) =>{
    try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/service-rate`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const listLoad = async () =>{
    try {

    const res: AxiosResponse = await apiClient.get(`dispatcher/load`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}
export const createLoad = async (data: any) =>{
    try {
    console.log('==res ', data)
    const res: AxiosResponse = await apiClient.post(`dispatcher/load`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const updateLoad = async (id: string, data: any) => {
  try {
    console.log('🔍 updateLoad API called with:', { id, data });
    const res: AxiosResponse = await apiClient.put(`dispatcher/load/${id}`, data);
    console.log('🔍 updateLoad API response:', res);
    console.log('🔍 updateLoad API response data:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ updateLoad API error:', error);
    return (error as Error).response?.data;
  }
}

export const assignDriverTruck = async (loadId: string, driverId: string, vehicleId: string, trailerId?: string, planDate?: string) => {
  try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/load/${loadId}/assign`, {
      driverId,
      vehicleId,
      trailerId,
      planDate
    });
    return res.data;
  } catch (error) {
    console.error('❌ assignDriverTruck API error:', error);
    return (error as Error).response?.data;
  }
}

export const deleteLoad = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/load/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}


export const listDriver = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/driver`);
    console.log('==res ', res)
    return res.data;
  } catch (error: any) {
    console.log(error);
    return error?.response?.data || { success: false, message: error?.message || 'Failed to fetch drivers', data: null };
  }
}






export const listFaciliator = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/faciliator`);
    console.log('==res ', res)
    return res.data;
  } catch (error: any) {
    console.log(error);
    return error?.response?.data || { success: false, message: error?.message || 'Failed to fetch facilitators', data: null };
  }
}

// Issue CRUD APIs
export const createIssue = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/issue`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

export const updateIssue = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`dispatcher/issue/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

export const deleteIssue = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/issue/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

export const getIssueById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/issue/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

export const listIssues = async (page: number = 1, limit: number = 10) => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/issue?page=${page}&limit=${limit}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

export const searchIssues = async (keyword: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/issue/search?keyword=${keyword}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as Error).response?.data;
  }
}

// Delivery management APIs
export const getDeliveryLoads = async () => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/delivery-loads`);
    return res.data;
  } catch (error) {
    console.error('❌ getDeliveryLoads API error:', error);
    return (error as Error).response?.data;
  }
}

export const uploadDeliveryDocument = async (loadId: string, documentType: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('document', file);
    
    const res: AxiosResponse = await apiClient.post(
      `dispatcher/load/${loadId}/delivery-document/${documentType}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return res.data;
  } catch (error) {
    console.error('❌ uploadDeliveryDocument API error:', error);
    return (error as Error).response?.data;
  }
}

export const updatePaymentStatus = async (
  loadId: string, 
  paymentMethod: string, 
  paymentReference: string, 
  paymentDate: string, 
  notes?: string
) => {
  try {
    const res: AxiosResponse = await apiClient.post(`dispatcher/load/${loadId}/payment`, {
      paymentMethod,
      paymentReference,
      paymentDate,
      notes
    });
    return res.data;
  } catch (error) {
    console.error('❌ updatePaymentStatus API error:', error);
    return (error as Error).response?.data;
  }
}

export const getDispatcherDashboard = async () => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/dashboard`);
    return res.data;
  } catch (error) {
    console.error('❌ getDispatcherDashboard API error:', error);
    return (error as Error).response?.data;
  }
}

export const getRouteAnalysis = async () => {
  try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/routes`);
    return res.data;
  } catch (error) {
    console.error('❌ getRouteAnalysis API error:', error);
    return (error as Error).response?.data;
  }
}
