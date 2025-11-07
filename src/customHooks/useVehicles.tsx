import { useEffect, useState } from "react";
import { listVehicle } from "../axios/api/distapcher";

// Hook to fetch vehicle list
export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [userInfoReady, setUserInfoReady] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('userInfo');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error parsing userInfo from localStorage:', err);
    } finally {
      setUserInfoReady(true);
    }
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await listVehicle(); // returns { success, message, data }
      if (res?.success) {
        const data = Array.isArray(res?.data?.vehicles)
          ? res.data.vehicles
          : Array.isArray(res?.data)
            ? res.data
            : [];
        setVehicles(data);
        setMessage(res.message || "Vehicles fetched successfully");
        setError(null);
        if (res.message && data.length === 0) {
          setEmptyMessage(res.message);
        } else {
          setEmptyMessage(null);
        }
      } else {
        setVehicles([]);
        const errMessage = res?.message || "Failed to fetch vehicles";
        setError(errMessage);
        setEmptyMessage(errMessage);
      }
    } catch (err: any) {
      setVehicles([]);
      const errMessage = err?.message || "Unknown error";
      setError(errMessage);
      setEmptyMessage(errMessage);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userInfoReady) {
      return;
    }

    const isSuperadmin = userInfo?.role === 'superadmin';
    const hasCompany = Boolean(userInfo?.company);

    if (!isSuperadmin && !hasCompany) {
      setVehicles([]);
      setEmptyMessage('No company assigned to the current admin.');
      setLoading(false);
      return;
    }

    fetchVehicles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfoReady, userInfo]);

  return { vehicles, loading, error, message, emptyMessage, refetch: fetchVehicles };
};
