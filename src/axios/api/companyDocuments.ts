import apiClient from "../apiClient";

export interface CompanyDocumentPayload {
  name: string;
  category: string;
  description?: string;
  file: File;
}

export const listCompanyDocuments = async (params?: { category?: string; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.search) query.append("search", params.search);
  const res = await apiClient.get(`/company-documents?${query.toString()}`);
  return res.data;
};

export const uploadCompanyDocument = async (payload: CompanyDocumentPayload) => {
  const form = new FormData();
  form.append("name", payload.name);
  form.append("category", payload.category);
  if (payload.description) form.append("description", payload.description);
  form.append("file", payload.file);
  const res = await apiClient.post(`/company-documents`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteCompanyDocument = async (id: string) => {
  const res = await apiClient.delete(`/company-documents/${id}`);
  return res.data;
};


