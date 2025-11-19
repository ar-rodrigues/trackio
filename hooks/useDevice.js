"use client";

import { useState, useEffect, useCallback } from "react";
import { traccarClient } from "@/utils/traccar/client";
import { useTraccarToken } from "@/hooks/useTraccarToken";

/**
 * Custom hook to fetch a single device from Traccar by ID
 * @param {number} deviceId - Device ID to fetch
 * @param {Object} options - Configuration options
 * @returns {{ data: Object | null, loading: boolean, error: Error | null, refetch: () => Promise<void> }}
 */
export function useDevice(deviceId, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, loading: tokenLoading, error: tokenError } = useTraccarToken();

  const fetchDevice = useCallback(async () => {
    if (!deviceId) {
      setData(null);
      setLoading(false);
      return;
    }

    if (!token) {
      if (tokenError) {
        setError(tokenError);
      } else if (!tokenLoading) {
        setError(new Error("Token de sesión no disponible"));
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const device = await traccarClient.getDevice(deviceId, token);
      setData(device);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || "Error al obtener el dispositivo";
      setError(new Error(errorMessage));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [deviceId, token, tokenLoading, tokenError]);

  useEffect(() => {
    if (!tokenLoading) {
      fetchDevice();
    }
  }, [deviceId, tokenLoading, fetchDevice]);

  return {
    data,
    loading: loading || tokenLoading,
    error,
    refetch: fetchDevice,
  };
}

