"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook to fetch all devices from Traccar
 * Uses server-side proxy API route to avoid CORS and cookie header issues
 * @param {Object} options - Configuration options
 * @returns {{ data: Array | null, loading: boolean, error: Error | null, refetch: () => Promise<void> }}
 */
export function useDevices(options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use server-side proxy API route
      const response = await fetch("/api/traccar/devices", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Error ${response.status}: ${response.statusText}`;

        if (response.status === 401) {
          throw new Error(
            "Sesión expirada. Por favor, inicia sesión nuevamente."
          );
        }

        throw new Error(errorMessage);
      }

      const devices = await response.json();
      setData(devices || []);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || "Error al obtener los dispositivos";
      setError(new Error(errorMessage));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  return {
    data,
    loading,
    error,
    refetch: fetchDevices,
  };
}
