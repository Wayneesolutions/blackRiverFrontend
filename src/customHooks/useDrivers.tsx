import { useEffect, useState } from "react";
import { listDriver } from "../axios/api/distapcher";

// Hook to fetch driver list
export const useDrivers = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchDrivers = async () => {
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
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  return { drivers, loading, error, message, refetch: fetchDrivers };
};
