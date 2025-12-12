import { type AxiosResponse } from "axios";
import apiClient from "../apiClient";

// ==================== INCIDENT APIs ====================
export const createIncident = async (formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/incident', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getIncidents = async (params?: {
  status?: string;
  type?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = queryParams.toString() 
      ? `health-safety/incident?${queryParams.toString()}`
      : 'health-safety/incident';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getIncidentById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/incident/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateIncident = async (id: string, formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/incident/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteIncident = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/incident/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateInvestigation = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/incident/${id}/investigation`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateInjuryRecord = async (id: string, formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/incident/${id}/injury-record`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== EMERGENCY CONTACT APIs ====================
export const createEmergencyContact = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/emergency-contact', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getEmergencyContacts = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('health-safety/emergency-contact');
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateEmergencyContact = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/emergency-contact/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteEmergencyContact = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/emergency-contact/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== EMERGENCY PROCEDURE APIs ====================
export const createEmergencyProcedure = async (formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/emergency-procedure', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getEmergencyProcedures = async (type?: string) => {
  try {
    const url = type && type !== 'all' 
      ? `health-safety/emergency-procedure?type=${type}`
      : 'health-safety/emergency-procedure';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateEmergencyProcedure = async (id: string, formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/emergency-procedure/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteEmergencyProcedure = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/emergency-procedure/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== FIRST AID LOG APIs ====================
export const createFirstAidLog = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/first-aid-log', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getFirstAidLogs = async (params?: {
  search?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
      ? `health-safety/first-aid-log?${queryParams.toString()}`
      : 'health-safety/first-aid-log';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getFirstAidLogById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/first-aid-log/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateFirstAidLog = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/first-aid-log/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteFirstAidLog = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/first-aid-log/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== INSPECTION APIs ====================
export const createInspection = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/inspection', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getInspections = async (params?: {
  status?: string;
  type?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = queryParams.toString() 
      ? `health-safety/inspection?${queryParams.toString()}`
      : 'health-safety/inspection';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getInspectionById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/inspection/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateInspection = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/inspection/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteInspection = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/inspection/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== HAZARD APIs ====================
export const createHazard = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/hazard', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getHazards = async (params?: {
  status?: string;
  severity?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.severity) queryParams.append('severity', params.severity);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = queryParams.toString() 
      ? `health-safety/hazard?${queryParams.toString()}`
      : 'health-safety/hazard';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getHazardById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/hazard/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateHazard = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/hazard/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteHazard = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/hazard/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== TRAINING APIs ====================
export const createTraining = async (formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/training', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getTrainings = async (params?: {
  status?: string;
  type?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = queryParams.toString() 
      ? `health-safety/training?${queryParams.toString()}`
      : 'health-safety/training';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getTrainingById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/training/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateTraining = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/training/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteTraining = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/training/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getTrainingMaterialSignedUrl = async (id: string, materialIndex: number, disposition: 'inline' | 'attachment' = 'inline') => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/training/${id}/material/${materialIndex}/signed-url?disposition=${disposition}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== COMPLIANCE RECORDS APIs ====================
export const getComplianceRecords = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('health-safety/compliance-records');
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== CERTIFICATE APIs ====================
export const createCertificate = async (formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getCertificates = async (params?: {
  status?: string;
  type?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = queryParams.toString() 
      ? `health-safety/certificate?${queryParams.toString()}`
      : 'health-safety/certificate';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getCertificateById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/certificate/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateCertificate = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/certificate/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteCertificate = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/certificate/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getCertificateSignedUrl = async (id: string, disposition: 'inline' | 'attachment' = 'inline') => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/certificate/${id}/signed-url?disposition=${disposition}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== POLICY DOCUMENT APIs ====================
export const createPolicyDocument = async (formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/policy-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getPolicyDocuments = async (params?: {
  status?: string;
  category?: string;
  documentType?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.documentType) queryParams.append('documentType', params.documentType);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = queryParams.toString() 
      ? `health-safety/policy-document?${queryParams.toString()}`
      : 'health-safety/policy-document';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getPolicyDocumentById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/policy-document/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updatePolicyDocument = async (id: string, formData: FormData) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/policy-document/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deletePolicyDocument = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/policy-document/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getPolicyDocumentSignedUrl = async (id: string, disposition: 'inline' | 'attachment' = 'inline') => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/policy-document/${id}/signed-url?disposition=${disposition}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== COMMITTEE MEMBER APIs ====================
export const createCommitteeMember = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/committee-member', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getCommitteeMembers = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('health-safety/committee-member');
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getCommitteeMemberById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/committee-member/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateCommitteeMember = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/committee-member/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteCommitteeMember = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/committee-member/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== CAPA APIs ====================
export const createCAPA = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/capa', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getCAPAs = async (params?: {
  status?: string;
  type?: string;
  priority?: string;
  search?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.search) queryParams.append('search', params.search);
    
    const url = queryParams.toString() 
      ? `health-safety/capa?${queryParams.toString()}`
      : 'health-safety/capa';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getCAPAById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/capa/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const updateCAPA = async (id: string, data: any) => {
  try {
    const res: AxiosResponse = await apiClient.put(`health-safety/capa/${id}`, data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteCAPA = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/capa/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

// ==================== REPORT & ANALYTICS APIs ====================
export const getAnalyticsStats = async (params?: {
  periodType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.periodType) queryParams.append('periodType', params.periodType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
      ? `health-safety/analytics/stats?${queryParams.toString()}`
      : 'health-safety/analytics/stats';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getIncidentTrends = async (params?: {
  periodType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.periodType) queryParams.append('periodType', params.periodType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
      ? `health-safety/analytics/incident-trends?${queryParams.toString()}`
      : 'health-safety/analytics/incident-trends';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getInspectionStatus = async (params?: {
  periodType?: string;
  startDate?: string;
  endDate?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.periodType) queryParams.append('periodType', params.periodType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    
    const url = queryParams.toString() 
      ? `health-safety/analytics/inspection-status?${queryParams.toString()}`
      : 'health-safety/analytics/inspection-status';
    
    const res: AxiosResponse = await apiClient.get(url);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getReports = async () => {
  try {
    const res: AxiosResponse = await apiClient.get('health-safety/report');
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const getReportById = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.get(`health-safety/report/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const generateReport = async (data: any) => {
  try {
    const res: AxiosResponse = await apiClient.post('health-safety/report/generate', data);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

export const deleteReport = async (id: string) => {
  try {
    const res: AxiosResponse = await apiClient.delete(`health-safety/report/${id}`);
    return res.data;
  } catch (error) {
    console.log(error);
    return (error as any).response?.data;
  }
};

