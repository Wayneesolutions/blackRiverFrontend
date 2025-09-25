import  { type AxiosResponse } from 'axios'
import apiClient from '../apiClient'

interface Error {
  response?: {
    data?: {
      message: string,
    }
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
export const updateFleet = async (id:string,data) =>{
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
export const createFleet = async (data) =>{
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
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const createVehicle = async (data) =>{
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
export const updateServiceRate = async (id:string,data) =>{
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
export const createServiceRate = async (data) =>{
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
export const createLoad = async (data) =>{
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


export const listDriver = async () =>{
    try {

    const res: AxiosResponse = await apiClient.get(`dispatcher/driver`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}




export const listCustomer = async () =>{
    try {

    const res: AxiosResponse = await apiClient.get(`dispatcher/customer`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const listFaciliator = async () =>{
    try {

    const res: AxiosResponse = await apiClient.get(`dispatcher/faciliator`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}
