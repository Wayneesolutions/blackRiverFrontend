import axios, { AxiosResponse, AxiosError } from 'axios'
import apiClient from '../apiClient'
interface Error {
  response?: {
    data?: {
      message: string,
    }
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
