"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { traccarClient } from "@/utils/traccar/client";

/**
 * Custom hook for Traccar user registration
 * @param {Object} options - Configuration options
 * @returns {{ data: Object | null, loading: boolean, error: Error | null, register: (userData: Object) => Promise<void> }}
 */
export function useTraccarRegister(options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const supabase = createClient();

  const register = useCallback(
    async (userData) => {
      try {
        setLoading(true);
        setError(null);
        setData(null);

        // Validate required fields
        if (!userData.email || !userData.password || !userData.name) {
          throw new Error(
            "Por favor, completa todos los campos requeridos (email, contraseña, nombre)."
          );
        }

        // Get current Supabase user and profile
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !authUser) {
          throw new Error(
            "No hay una sesión activa. Por favor, inicia sesión primero."
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

        // Check if user already has a Traccar account
        const { data: existingTraccarUser } = await supabase
          .from("traccar_users")
          .select("traccar_user_id")
          .eq("profile_id", profile.id)
          .single();

        if (existingTraccarUser) {
          throw new Error(
            "Este usuario ya tiene una cuenta en Traccar asociada."
          );
        }

        // Get admin credentials from environment
        // Note: These should be server-side only, but we check both for flexibility
        const adminEmail =
          process.env.NEXT_PUBLIC_TRACCAR_API_USER ||
          process.env.TRACCAR_API_USER ||
          process.env.NEXT_PUBLIC_TRACCAR_ADMIN_EMAIL ||
          process.env.TRACCAR_ADMIN_EMAIL;
        const adminPassword =
          process.env.NEXT_PUBLIC_TRACCAR_API_PASSWORD ||
          process.env.TRACCAR_API_PASSWORD ||
          process.env.NEXT_PUBLIC_TRACCAR_ADMIN_PASSWORD ||
          process.env.TRACCAR_ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          throw new Error(
            "Las credenciales de administrador de Traccar no están configuradas. Por favor, contacta al administrador."
          );
        }

        // Create user in Traccar
        let traccarUser;
        try {
          traccarUser = await traccarClient.createUser(
            {
              name: userData.name,
              email: userData.email,
              password: userData.password,
              administrator: userData.administrator || false,
              readonly: userData.readonly || false,
            },
            adminEmail,
            adminPassword
          );
        } catch (err) {
          if (err.status === 401) {
            throw new Error(
              "Credenciales de administrador inválidas. Por favor, contacta al administrador."
            );
          } else if (err.status === 400) {
            throw new Error(
              err.data?.message ||
                "Error al crear el usuario en Traccar. Verifica que el email no esté en uso."
            );
          }
          throw new Error(
            `Error al crear el usuario en Traccar: ${err.message}`
          );
        }

        // Create session to get token
        let sessionToken = null;
        try {
          const session = await traccarClient.createSession(
            userData.email,
            userData.password
          );
          sessionToken = session.token;
        } catch (err) {
          console.warn(
            "Usuario creado en Traccar pero no se pudo obtener el token de sesión:",
            err
          );
          // Continue even if token generation fails - user can login later
        }

        // Save to database
        const { data: traccarUserRecord, error: dbError } = await supabase
          .from("traccar_users")
          .insert({
            profile_id: profile.id,
            traccar_user_id: traccarUser.id,
            traccar_username: traccarUser.email || userData.email,
            session_token: sessionToken,
            is_synced: true,
            last_sync_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (dbError) {
          // User was created in Traccar but failed to save in DB
          // Log this error but don't fail completely
          console.error("Error al guardar en la base de datos:", dbError);
          throw new Error(
            "Usuario creado en Traccar pero hubo un error al guardar la información. Por favor, contacta al administrador."
          );
        }

        setData({
          traccarUser,
          traccarUserRecord,
          token: sessionToken,
        });
        setError(null);
      } catch (err) {
        const errorMessage =
          err.message ||
          "Error desconocido al registrar el usuario en Traccar.";
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
    register,
  };
}

