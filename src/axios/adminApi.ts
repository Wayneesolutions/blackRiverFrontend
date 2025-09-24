import axios, { AxiosResponse, AxiosError } from 'axios'

const adminBaseUrl = import.meta.env.VITE_APP_BASE_URL

export const adminApi = axios.create({
  baseURL: adminBaseUrl
})
interface Error {
  response?: {
    data?: {
      message: string,
    }
  }
}

adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      //     setRecoil(authState, {
      //       accessToken: '',
      //       firstName: '',
      //       lastName: '',
      //       email: '',
      //       role: '',
      //       id: '',
      //       permissions: {},
      //     });

      //     localStorage.removeItem('token');
      //     window.location.href = '/admin/adminLogin';
      //   }

      return Promise.reject(error);
    }
  });

export default adminApi;


export const createContact = async (data) =>{
  try {

    const res: AxiosResponse = await adminApi.post(`admin/contact`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}
export const updateContact = async (id:string,data) =>{
  try {

    const res: AxiosResponse = await adminApi.put(`admin/contact/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const  deleteContact = async (id:string) =>{
  try {

    const res: AxiosResponse = await adminApi.delete(`admin/contact/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const  listContact = async (id:string) =>{
  try {

    const res: AxiosResponse = await adminApi.get(`admin/contact`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const  searchContact = async (name:string) =>{
  try {

    const res: AxiosResponse = await adminApi.get(`admin/contact/search?name=${name}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const createCustomer = async (data) =>{
  try {

    const res: AxiosResponse = await adminApi.post(`admin/customer`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const updateCustomer = async (id,data) =>{
  try {

    const res: AxiosResponse = await adminApi.put(`admin/customer/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const deleteCustomer = async (id) =>{
  try {

    const res: AxiosResponse = await adminApi.delete(`admin/customer/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const searchCustomer = async (name) =>{
  try {

    const res: AxiosResponse = await adminApi.post(`admin/customer/search?name=${name}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}


export const listCustomer = async () =>{
  try {

    const res: AxiosResponse = await adminApi.get(`admin/customer`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}


export const listVehicle = async () =>{
  try {

    const res: AxiosResponse = await adminApi.get(`admin/vehicle`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const createDriver = async (data) =>{
    try {

    const res: AxiosResponse = await adminApi.post(`admin/driver`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const updateDriver = async (id,data) =>{
    try {

    const res: AxiosResponse = await adminApi.put(`admin/driver/${id}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const deleteDriver = async (id) =>{
    try {

    const res: AxiosResponse = await adminApi.delete(`admin/driver/${id}`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}
export const listDriver = async () =>{
    try {

    const res: AxiosResponse = await adminApi.get(`admin/driver`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}
export const updateDriverStatus = async (id) =>{
    try {

    const res: AxiosResponse = await adminApi.patch(`admin/driver/${id}/status`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}



export const listLoad = async () =>{
    try {

    const res: AxiosResponse = await adminApi.get(`admin/load`);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const createUsers = async (data:any) =>{
    try {

    const res: AxiosResponse = await adminApi.post(`hr/user`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}

export const getUsers = async (role:any) =>{
    try {

    const res: AxiosResponse = await adminApi.patch(`hr/user?role=${role}`,data);
    console.log('==res ', res)
    return res.data;
  } catch (error) {
    console.log(error);

    return (error as Error).response?.data;
  }
}