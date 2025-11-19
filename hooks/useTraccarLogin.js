"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { traccarClient } from "@/utils/traccar/client";

/**
 * Custom hook for Traccar login
 * @param {Object} options - Configuration options
 * @returns {{ data: Object | null, loading: boolean, error: Error | null, login: (email: string, password: string) => Promise<void> }}
 */
export function useTraccarLogin(options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();

  const login = useCallback(
    async (email, password) => {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        // Validate inputs
        if (!email || !password) {
          throw new Error(
            "Por favor, ingresa tu email y contraseña."
          );
        }

        // Create session in Traccar
        let session;
        try {
          session = await traccarClient.createSession(email, password);
        } catch (err) {
          if (err.status === 401) {
            throw new Error(
              "Credenciales inválidas. Por favor, verifica tu email y contraseña."
            );
          } else if (err.status === 404) {
            throw new Error(
              "Usuario no encontrado en Traccar."
            );
          }
          throw new Error(
            `Error al iniciar sesión en Traccar: ${err.message}`
          );
        }

        if (!session.user || !session.user.id) {
          throw new Error(
            "Error: No se recibió información del usuario desde Traccar."
          );
        }

        // Get current Supabase user and profile
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !authUser) {
          throw new Error(
            "No hay una sesión activa en la plataforma. Por favor, inicia sesión primero."
          );
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", authUser.id)
          .single();

        if (profileError || !profile) {
          throw new Error(
            "No se pudo encontrar el perfil del usuario. Por favor, contacta al administrador."
          );
        }

        // Check if traccar_users record exists
        const { data: existingTraccarUser } = await supabase
          .from("traccar_users")
          .select("*")
          .eq("profile_id", profile.id)
          .single();

        // Calculate token expiration (typically 30 days, but we'll set it to 7 days for safety)
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

        if (existingTraccarUser) {
          // Update existing record
          const { data: updatedRecord, error: updateError } = await supabase
            .from("traccar_users")
            .update({
              traccar_user_id: session.user.id,
              traccar_username: session.user.email || email,
              session_token: session.token,
              token_expires_at: tokenExpiresAt.toISOString(),
              is_synced: true,
              last_sync_at: new Date().toISOString(),
              sync_error: null,
            })
            .eq("profile_id", profile.id)
            .select()
            .single();

          if (updateError) {
            throw new Error(
              `Error al actualizar la información de Traccar: ${updateError.message}`
            );
          }

          setData({
            user: session.user,
            traccarUserRecord: updatedRecord,
            token: session.token,
          });
        } else {
          // Create new record
          const { data: newRecord, error: insertError } = await supabase
            .from("traccar_users")
            .insert({
              profile_id: profile.id,
              traccar_user_id: session.user.id,
              traccar_username: session.user.email || email,
              session_token: session.token,
              token_expires_at: tokenExpiresAt.toISOString(),
              is_synced: true,
              last_sync_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) {
            throw new Error(
              `Error al guardar la información de Traccar: ${insertError.message}`
            );
          }

          setData({
            user: session.user,
            traccarUserRecord: newRecord,
            token: session.token,
          });
        }

        setError(null);
      } catch (err) {
        const errorMessage =
          err.message || "Error desconocido al iniciar sesión en Traccar.";
        setError(new Error(errorMessage));
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    data,
    loading,
    error,
    login,
  };
}


