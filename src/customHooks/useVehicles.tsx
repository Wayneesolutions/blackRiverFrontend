import { useEffect, useState } from "react";
import { listVehicle } from "../axios/api/distapcher";

// Hook to fetch vehicle list
export const useVehicles = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await listVehicle(); // returns { success, message, data }
      if (res?.success) {
        setVehicles(res.data.vehicles || []);
        setMessage(res.message || "Vehicles fetched successfully");
        setError(null);
      } else {
        setVehicles([]);
        setError(res?.message || "Failed to fetch vehicles");
      }
    } catch (err: any) {
      setVehicles([]);
      setError(err?.message || "Unknown error");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  return { vehicles, loading, error, message, refetch: fetchVehicles };
};
