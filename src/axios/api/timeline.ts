import apiClient from '../apiClient';
import type { AxiosResponse } from 'axios';

// Timeline / Notes APIs
// entityType is one of: drivers | trucks | trailers | employees

export type TimelineEntityType = 'drivers' | 'trucks' | 'trailers' | 'employees';

export interface TimelineAuthor {
  _id: string;
  name: string;
  role: string;
}

export interface TimelineEntry {
  _id: string;
  entityType: TimelineEntityType;
  entityId: string;
  note: string;
  author: TimelineAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineListResponse {
  success: boolean;
  message?: string;
  entries: TimelineEntry[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export const getTimeline = async (
  entityType: TimelineEntityType,
  entityId: string,
  page: number = 1,
  limit: number = 20
): Promise<TimelineListResponse> => {
  try {
    const res: AxiosResponse = await apiClient.get(
      `${entityType}/${entityId}/timeline?page=${page}&limit=${limit}`
    );
    return res.data;
  } catch (error) {
    console.error('❌ Error fetching timeline:', error);
    return (error as any).response?.data;
  }
};

export const addTimelineEntry = async (
  entityType: TimelineEntityType,
  entityId: string,
  note: string
) => {
  try {
    const res: AxiosResponse = await apiClient.post(`${entityType}/${entityId}/timeline`, { note });
    return res.data;
  } catch (error) {
    console.error('❌ Error adding timeline entry:', error);
    return (error as any).response?.data;
  }
};

export const updateTimelineEntry = async (
  entityType: TimelineEntityType,
  entityId: string,
  entryId: string,
  note: string
) => {
  try {
    const res: AxiosResponse = await apiClient.patch(
      `${entityType}/${entityId}/timeline/${entryId}`,
      { note }
    );
    return res.data;
  } catch (error) {
    console.error('❌ Error updating timeline entry:', error);
    return (error as any).response?.data;
  }
};

export const deleteTimelineEntry = async (
  entityType: TimelineEntityType,
  entityId: string,
  entryId: string
) => {
  try {
    const res: AxiosResponse = await apiClient.delete(
      `${entityType}/${entityId}/timeline/${entryId}`
    );
    return res.data;
  } catch (error) {
    console.error('❌ Error deleting timeline entry:', error);
    return (error as any).response?.data;
  }
};
