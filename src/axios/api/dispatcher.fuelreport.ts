import  { type AxiosResponse } from 'axios'
import apiClient from '../apiClient'

interface Error {
  response?: {
    data?: {
      message: string,
    }
  }
}



export const listFuelReport = async () =>{
    try {
    const res: AxiosResponse = await apiClient.get(`dispatcher/fuel-report`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateFuelReport = async (id:string,data) =>{
    try {
    const res: AxiosResponse = await apiClient.put(`dispatcher/fuel-report/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}
export const deleteFuelReport = async (id:string) =>{
    try {
    const res: AxiosResponse = await apiClient.delete(`dispatcher/fuel-report/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}

export const updateStatusFuelReport = async (id:string,status) =>{
    try {
    const res: AxiosResponse = await apiClient.patch(`dispatcher/fuel-report/${id}/status`,status);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    return (error as Error).response?.data;
  }
}