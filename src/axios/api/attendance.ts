import apiClient from "../apiClient";

export const listAttendance = async (params?: { month?: number; year?: number; employee?: string }) => {
  const q = new URLSearchParams();
  if (params?.month) q.set("month", String(params.month));
  if (params?.year) q.set("year", String(params.year));
  if (params?.employee) q.set("employee", params.employee);
  const res = await apiClient.get(`/hr/attendance?${q.toString()}`);
  return res.data;
};

export const upsertAttendance = async (payload: {
  employee: string;
  date: string; // ISO date
  checkIn?: string;
  checkOut?: string;
  status: "present" | "absent" | "late" | "leave";
  notes?: string;
}) => {
  const res = await apiClient.post(`/hr/attendance`, payload);
  return res.data;
};

export const deleteAttendance = async (id: string) => {
  const res = await apiClient.delete(`/hr/attendance/${id}`);
  return res.data;
};


