import { useEffect, useState, useCallback } from "react";
import { listDriver } from "../axios/api/distapcher";

// Hook to fetch driver list
export const useDrivers = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any | undefined>(undefined);

  const fetchDrivers = useCallback(async () => {
    if (!userInfo) {
      setDrivers([]);
      setLoading(false);
      return;
    }

    const isSuperadmin = userInfo?.role === "superadmin";
    const hasCompany = Boolean(userInfo?.company);

    if (!isSuperadmin && !hasCompany) {
      setDrivers([]);
      setLoading(false);
      setMessage(null);
      return;
    }

    setLoading(true);
    try {
      const res = await listDriver(); // this returns { success, message, data }
      if (res?.success) {
        setDrivers(res.data || []);
        setMessage(res.message || "Drivers fetched successfully");
        setError(null);
      } else {
        setDrivers([]);
        setError(res?.message || "Failed to fetch drivers");
      }
    } catch (err: any) {
      setDrivers([]);
      setError(err?.message || "Unknown error");
    }
    setLoading(false);
  }, [userInfo]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("userInfo");
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to parse userInfo for useDrivers hook", err);
    }
  }, []);

  useEffect(() => {
    if (userInfo === undefined) return;
    fetchDrivers();
  }, [fetchDrivers, userInfo]);

  return { drivers, loading, error, message, refetch: fetchDrivers };
};
