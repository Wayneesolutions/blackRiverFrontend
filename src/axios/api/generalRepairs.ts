import apiClient from "../apiClient";

export interface GeneralRepairDto {
  _id: string;
  serviceDate: string;
  unitNumber: string;
  makeModel?: string;
  vinLicensePlate?: string;
  description: string;
  odometer?: number;
  parts?: string;
  notes?: string;
  serviceProvider: string;
  invoiceNumber: string;
  amount?: number;
  unitSource?: string;
  unitReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralRepairPayload {
  serviceDate: string;
  unitNumber: string;
  makeModel?: string;
  vinLicensePlate?: string;
  description: string;
  odometer?: number | string;
  parts?: string;
  notes?: string;
  serviceProvider: string;
  invoiceNumber: string;
  amount?: number;
  unitSource?: string;
  unitReference?: string;
}

export interface GeneralRepairResponse {
  success: boolean;
  data: GeneralRepairDto[];
  message?: string;
  requiresCompanySetup?: boolean;
}

export const listGeneralRepairs = async (search?: string) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const res = await apiClient.get<GeneralRepairResponse>(
    `/admin/fleet-maintenance/general-repairs${params.toString() ? `?${params.toString()}` : ""}`
  );
  return res.data;
};

export const createGeneralRepair = async (payload: GeneralRepairPayload) => {
  const res = await apiClient.post<{ success: boolean; data: GeneralRepairDto; message?: string }>(
    `/admin/fleet-maintenance/general-repairs`,
    payload
  );
  return res.data;
};

export const updateGeneralRepair = async (id: string, payload: GeneralRepairPayload) => {
  const res = await apiClient.put<{ success: boolean; data: GeneralRepairDto; message?: string }>(
    `/admin/fleet-maintenance/general-repairs/${id}`,
    payload
  );
  return res.data;
};

export const deleteGeneralRepair = async (id: string) => {
  const res = await apiClient.delete<{ success: boolean; message?: string }>(
    `/admin/fleet-maintenance/general-repairs/${id}`
  );
  return res.data;
};

