"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { traccarClient } from "@/utils/traccar/client";

/**
 * Custom hook for Traccar password reset
 * Handles two flows:
 * - With active session: Updates password via PUT /api/users/{id}
 * - Without session: Sends reset email via POST /api/password/reset
 * @param {Object} options - Configuration options
 * @returns {{ loading: boolean, error: Error | null, success: boolean, resetPassword: (currentPassword: string, newPassword: string, email?: string) => Promise<void>, sendResetEmail: (email: string) => Promise<void> }}
 */
export function useTraccarPasswordReset(options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  /**
   * Sends password reset email (for users without active session)
   * @param {string} email - User email
   */
  const sendResetEmail = useCallback(
    async (email) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Validate input
        if (!email) {
          throw new Error("Por favor, ingresa tu email.");
        }

        // Send password reset request to Traccar
        try {
          await traccarClient.resetPassword(email);
        } catch (err) {
          if (err.status === 404) {
            throw new Error(
              "No se encontró un usuario con ese email en Traccar."
            );
          } else if (err.status === 400) {
            throw new Error(
              "Error al solicitar el restablecimiento de contraseña. Por favor, verifica tu email."
            );
          }
          throw new Error(
            `Error al solicitar el restablecimiento de contraseña: ${err.message}`
          );
        }

        setSuccess(true);
        setError(null);
      } catch (err) {
        const errorMessage =
          err.message ||
          "Error desconocido al solicitar el restablecimiento de contraseña.";
        setError(new Error(errorMessage));
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Resets password (for users with active session)
   * @param {string} currentPassword - Current password for authentication
   * @param {string} newPassword - New password
   * @param {string} email - User email for Basic Auth (optional, will use auth user email if not provided)
   */
  const resetPassword = useCallback(
    async (currentPassword, newPassword, email = null) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Validate inputs
        if (!currentPassword || !newPassword) {
          throw new Error(
            "Por favor, completa todos los campos requeridos."
          );
        }

        if (newPassword.length < 6) {
          throw new Error(
            "La nueva contraseña debe tener al menos 6 caracteres."
          );
        }

        // Get current user from Supabase to verify session
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !authUser || !authUser.email) {
          throw new Error(
            "No hay una sesión activa. Por favor, inicia sesión primero."
          );
        }

        // Use provided email or fall back to auth user email
        const userEmail = email || authUser.email;

        // Get Traccar user record to get the Traccar user ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", authUser.id)
          .single();

        if (!profile) {
          throw new Error(
            "No se pudo encontrar el perfil del usuario."
          );
        }

        const { data: traccarUserRecord } = await supabase
          .from("traccar_users")
          .select("traccar_user_id, traccar_username")
          .eq("profile_id", profile.id)
          .single();

        if (!traccarUserRecord) {
          throw new Error(
            "No se encontró una cuenta de Traccar asociada. Por favor, regístrate primero en Traccar."
          );
        }

        const userId = traccarUserRecord.traccar_user_id;

        // Update password in Traccar using PUT /api/users/{id}
        // The API requires: { id, name, email, password } in JSON body
        // Auth: Basic Auth with email/password
        try {
          // First, get current user data to include name
          const session = await traccarClient.createSession(
            userEmail,
            currentPassword
          );

          if (!session.user) {
            throw new Error(
              "No se pudo verificar la contraseña actual."
            );
          }

          // Update user with new password
          const updatedUser = await traccarClient.updateUser(
            userId,
            {
              id: userId,
              name: session.user.name || traccarUserRecord.traccar_username,
              email: userEmail,
              password: newPassword,
            },
            userEmail,
            currentPassword
          );

          // Update session token in database (create new session with new password)
          let newToken = null;
          try {
            const newSession = await traccarClient.createSession(
              userEmail,
              newPassword
            );
            newToken = newSession.token;

            // Update token in database
            const tokenExpiresAt = new Date();
            tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

            await supabase
              .from("traccar_users")
              .update({
                session_token: newToken,
                token_expires_at: tokenExpiresAt.toISOString(),
                last_sync_at: new Date().toISOString(),
              })
              .eq("profile_id", profile.id);
          } catch (tokenError) {
            console.warn(
              "Contraseña actualizada pero no se pudo actualizar el token:",
              tokenError
            );
            // Don't fail if token update fails
          }

          setSuccess(true);
          setError(null);
        } catch (err) {
          if (err.status === 401) {
            throw new Error(
              "La contraseña actual no es correcta. Por favor, verifica e intenta nuevamente."
            );
          } else if (err.status === 400) {
            throw new Error(
              err.data?.message ||
                "Error al actualizar la contraseña. Por favor, verifica los datos."
            );
          }
          throw new Error(
            `Error al actualizar la contraseña: ${err.message}`
          );
        }
      } catch (err) {
        const errorMessage =
          err.message ||
          "Error desconocido al restablecer la contraseña.";
        setError(new Error(errorMessage));
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    error,
    success,
    resetPassword,
    sendResetEmail,
  };
}

