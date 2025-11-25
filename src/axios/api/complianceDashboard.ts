import apiClient from "../apiClient";

export interface ComplianceSafetyAlert {
  unitNo: string;
  makeModel?: string;
  safetyExpiry: string;
  daysUntilExpiry: number;
  status: "expired" | "warning";
}

export interface CompliancePmService {
  type: string;
  dueAt: number;
  kmRemaining: number;
  status: "due" | "overdue" | "ok";
}

export interface CompliancePmUnit {
  unitNo: string;
  makeModel?: string;
  currentOdometer: number;
  nextServices: CompliancePmService[];
  overdueCount: number;
  dueCount: number;
}

export interface ComplianceInvoiceSummary {
  total: number;
  byType: {
    scheduled: number;
    general: number;
    safety: number;
  };
  count: number;
}

export interface ComplianceDashboardResponse {
  success: boolean;
  requiresCompanySetup?: boolean;
  data: {
    safetyAlerts: ComplianceSafetyAlert[];
    pmStatus: CompliancePmUnit[];
    invoiceSummary: {
      month: ComplianceInvoiceSummary;
      ytd: ComplianceInvoiceSummary;
    };
    inactiveUnits: number;
  };
  message?: string;
}

export const fetchComplianceDashboard = async () => {
  const res = await apiClient.get<ComplianceDashboardResponse>('/admin/compliance/dashboard');
  return res.data;
};

