import apiClient from "../apiClient";

export interface MechanicOrder {
  _id: string;
  serviceDate?: string;
  unitNumber?: string;
  makeModel?: string;
  vinLicensePlate?: string;
  description?: string;
  odometer?: number;
  status?: string;
  customer?: string;
  serviceProvider?: string;
  invoiceNumber?: string;
  amount?: number;
  repairDetails?: string;
  verificationStatus?: string;
  [key: string]: unknown;
}

export interface ListMechanicOrdersResponse {
  success: boolean;
  data: MechanicOrder[];
  count: number;
  message?: string;
}

export const listMechanicOrders = async (params?: {
  status?: string;
  mechanicId?: string;
}): Promise<ListMechanicOrdersResponse> => {
  const res = await apiClient.get("admin/fleet-maintenance/mechanic/orders", {
    params,
  });
  return res.data;
};

