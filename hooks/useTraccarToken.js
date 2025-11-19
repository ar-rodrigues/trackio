"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

/**
 * Custom hook to get the Traccar session token for the current user
 * @param {Object} options - Configuration options
 * @returns {{ token: string | null, loading: boolean, error: Error | null, refetch: () => Promise<void> }}
 */
export function useTraccarToken(options = {}) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(new Error("Usuario no autenticado"));
        setToken(null);
        return;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        setError(new Error("Perfil de usuario no encontrado"));
        setToken(null);
        return;
      }

      // Get Traccar user record with session token
      const { data: traccarUser, error: traccarError } = await supabase
        .from("traccar_users")
        .select("session_token, token_expires_at, traccar_username")
        .eq("profile_id", profile.id)
        .single();

      if (traccarError || !traccarUser) {
        setError(new Error("Usuario no sincronizado con Traccar"));
        setToken(null);
        return;
      }

      // Check if token exists
      if (!traccarUser.session_token || traccarUser.session_token.trim() === "") {
        setError(new Error("Token de sesión no disponible. Por favor, inicia sesión nuevamente."));
        setToken(null);
        return;
      }

      // Check if token is expired
      if (
        traccarUser.token_expires_at &&
        new Date(traccarUser.token_expires_at) < new Date()
      ) {
        setError(new Error("Token de sesión expirado. Por favor, inicia sesión nuevamente."));
        setToken(null);
        return;
      }

      setToken(traccarUser.session_token);
      setError(null);
    } catch (err) {
      setError(err);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return {
    token,
    loading,
    error,
    refetch: fetchToken,
  };
}

