import apiClient from '../apiClient';
import type { AxiosResponse } from 'axios';

// Form auto-save draft APIs
// entityType is one of: drivers | trucks | trailers | employees
// entityId is the record's id, or the literal string "new" for a creation-form draft

export type DraftEntityType = 'drivers' | 'trucks' | 'trailers' | 'employees';

export interface DraftRecord {
  formData: Record<string, any>;
  updatedAt: string;
}

export interface DraftResponse {
  success: boolean;
  message?: string;
  draft?: DraftRecord | null;
}

export const getDraft = async (
  entityType: DraftEntityType,
  entityId: string
): Promise<DraftResponse> => {
  try {
    const res: AxiosResponse = await apiClient.get(`drafts/${entityType}/${entityId}`);
    return res.data;
  } catch (error) {
    // A missing draft is a normal "nothing saved yet" state, not an error worth surfacing.
    const status = (error as any)?.response?.status;
    if (status === 404) {
      return { success: true, draft: null };
    }
    console.error('❌ Error fetching draft:', error);
    return (error as any).response?.data || { success: false };
  }
};

export const saveDraft = async (
  entityType: DraftEntityType,
  entityId: string,
  formData: Record<string, any>
): Promise<DraftResponse> => {
  try {
    const res: AxiosResponse = await apiClient.put(`drafts/${entityType}/${entityId}`, { formData });
    return res.data;
  } catch (error) {
    console.error('❌ Error saving draft:', error);
    return (error as any).response?.data || { success: false };
  }
};

export const deleteDraft = async (
  entityType: DraftEntityType,
  entityId: string
): Promise<DraftResponse> => {
  try {
    const res: AxiosResponse = await apiClient.delete(`drafts/${entityType}/${entityId}`);
    return res.data;
  } catch (error) {
    console.error('❌ Error deleting draft:', error);
    return (error as any).response?.data || { success: false };
  }
};
