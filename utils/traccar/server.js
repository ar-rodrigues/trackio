"use server";

import TraccarClient, { traccarClient } from "./client";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-side Traccar client instance
 * Uses server-side environment variables
 */
const getTraccarClient = () => {
  const baseUrl =
    process.env.NEXT_PUBLIC_TRACCAR_API_URL || "http://localhost:8082/api";
  return new TraccarClient(baseUrl);
};

/**
 * Get Traccar admin credentials from server-side environment variables
 */
function getTraccarAdminCredentials() {
  const adminEmail =
    process.env.TRACCAR_API_USER ||
    process.env.TRACCAR_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_TRACCAR_API_USER ||
    process.env.NEXT_PUBLIC_TRACCAR_ADMIN_EMAIL;

  const adminPassword =
    process.env.TRACCAR_API_PASSWORD ||
    process.env.TRACCAR_ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_TRACCAR_API_PASSWORD ||
    process.env.NEXT_PUBLIC_TRACCAR_ADMIN_PASSWORD;

  return { adminEmail, adminPassword };
}

/**
 * Register a new user in Traccar (server-side)
 * @param {Object} userData - User data { name, firstName?, lastName?, email, password, administrator?, readonly? }
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function registerTraccarUser(userData) {
  const isDebug = process.env.TRACCAR_DEBUG === "true" || process.env.NEXT_PUBLIC_TRACCAR_DEBUG === "true";
  
  if (isDebug) {
    console.log("[Traccar Server] registerTraccarUser called for:", userData.email);
  }

  try {
    // Validate required fields
    if (!userData.email || !userData.password || !userData.name) {
      if (isDebug) {
        console.error("[Traccar Server] Validation failed - missing required fields");
      }
      return {
        success: false,
        error:
          "Por favor, completa todos los campos requeridos (email, contraseña, nombre).",
      };
    }

    // Get admin credentials
    const { adminEmail, adminPassword } = getTraccarAdminCredentials();

    if (!adminEmail || !adminPassword) {
      console.error("[Traccar Server] Admin credentials not configured");
      return {
        success: false,
        error:
          "Las credenciales de administrador de Traccar no están configuradas. Por favor, contacta al administrador.",
      };
    }

    if (isDebug) {
      console.log("[Traccar Server] Admin credentials found, creating client...");
    }

    const client = getTraccarClient();

    // Create user in Traccar
    // Build user object with name and attributes for first_name/last_name
    const traccarUserData = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      administrator: userData.administrator || false,
      readonly: userData.readonly || false,
    };

    // Add attributes with first_name and last_name if provided
    if (userData.firstName || userData.lastName) {
      traccarUserData.attributes = {};
      if (userData.firstName) {
        traccarUserData.attributes.first_name = userData.firstName;
      }
      if (userData.lastName) {
        traccarUserData.attributes.last_name = userData.lastName;
      }
    }

    let traccarUser;
    try {
      if (isDebug) {
        console.log("[Traccar Server] Creating user in Traccar...");
      }
      traccarUser = await client.createUser(
        traccarUserData,
        adminEmail,
        adminPassword
      );
      if (isDebug) {
        console.log("[Traccar Server] User created successfully:", {
          id: traccarUser?.id,
          email: traccarUser?.email,
          name: traccarUser?.name,
        });
      }
    } catch (err) {
      console.error("[Traccar Server] Error registering user in Traccar:", {
        status: err.status,
        message: err.message,
        data: err.data,
      });
      if (err.status === 401) {
        return {
          success: false,
          error:
            "Credenciales de administrador inválidas. Por favor, contacta al administrador.",
        };
      } else if (err.status === 400) {
        return {
          success: false,
          error:
            err.data?.message ||
            "Error al crear el usuario en Traccar. Verifica que el email no esté en uso.",
        };
      }
      return {
        success: false,
        error: `Error al crear el usuario en Traccar: ${err.message}`,
      };
    }

    // Create session to get token (required for API access)
    let sessionToken = null;
    try {
      if (isDebug) {
        console.log("[Traccar Server] Creating session to get token...");
      }
      const session = await client.createSession(
        userData.email,
        userData.password
      );
      sessionToken = session.token;
      
      if (isDebug) {
        console.log("[Traccar Server] Session created:", {
          hasUser: !!session.user,
          userId: session.user?.id,
          hasToken: !!sessionToken,
          tokenLength: sessionToken?.length || 0,
        });
      }
      
      if (!sessionToken) {
        console.warn(
          "[Traccar Server] Sesión creada en Traccar pero el token es null. Intentando generar token explícitamente..."
        );
        // Try to generate token explicitly using /session/token endpoint
        try {
          if (isDebug) {
            console.log("[Traccar Server] Attempting explicit token generation...");
          }
          const tokenResponse = await client.request("/session/token", {
            method: "POST",
            authType: "basic",
            email: userData.email,
            password: userData.password,
          });
          sessionToken = tokenResponse.data;
          if (isDebug) {
            console.log("[Traccar Server] Token generated explicitly:", sessionToken ? "Success" : "Failed");
          }
        } catch (tokenErr) {
          console.error("[Traccar Server] Error generando token explícitamente:", {
            status: tokenErr.status,
            message: tokenErr.message,
            data: tokenErr.data,
          });
        }
      }
    } catch (err) {
      console.error(
        "[Traccar Server] Error al crear sesión en Traccar:",
        {
          status: err.status,
          message: err.message,
          data: err.data,
        }
      );
      // Don't fail registration if token generation fails - user can login later
      // But log it so we can debug
    }

    return {
      success: true,
      data: {
        traccarUser,
        token: sessionToken,
      },
    };
  } catch (err) {
    console.error("Unexpected error in registerTraccarUser:", err);
    return {
      success: false,
      error:
        err.message ||
        "Error desconocido al registrar el usuario en Traccar.",
    };
  }
}

/**
 * Refresh or create a Traccar session token for an existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} profileId - Supabase profile ID
 * @returns {Promise<{success: boolean, token?: string, error?: string}>}
 */
export async function refreshTraccarSession(email, password, profileId) {
  const isDebug = process.env.TRACCAR_DEBUG === "true" || process.env.NEXT_PUBLIC_TRACCAR_DEBUG === "true";
  
  if (isDebug) {
    console.log("[Traccar Server] refreshTraccarSession called:", {
      email,
      profileId,
    });
  }

  try {
    const client = getTraccarClient();

    // Create session in Traccar
    let sessionToken = null;
    let traccarUserId = null;
    let traccarUsername = email;
    try {
      if (isDebug) {
        console.log("[Traccar Server] Creating new session...");
      }
      const session = await client.createSession(email, password);
      sessionToken = session.token || session.jsessionId; // Support both token and jsessionId
      traccarUserId = session.user?.id;
      traccarUsername = session.user?.email || email;
      
      // Always log session creation result
      console.log("[Traccar Server] Session result:", {
        hasUser: !!session.user,
        userId: session.user?.id,
        userEmail: session.user?.email,
        hasToken: !!sessionToken,
        tokenLength: sessionToken?.length || 0,
        tokenPreview: sessionToken ? sessionToken.substring(0, 30) + "..." : null,
        hasJsessionId: !!session.jsessionId,
        jsessionIdLength: session.jsessionId?.length || 0,
      });
      
      if (!sessionToken) {
        console.warn(
          "[Traccar Server] Sesión creada en Traccar pero el token es null. Intentando generar token explícitamente..."
        );
        // Try to generate token explicitly using /session/token endpoint
        try {
          if (isDebug) {
            console.log("[Traccar Server] Attempting explicit token generation...");
          }
          const tokenResponse = await client.request("/session/token", {
            method: "POST",
            authType: "basic",
            email,
            password,
          });
          sessionToken = tokenResponse.data;
          if (isDebug) {
            console.log("[Traccar Server] Explicit token generation result:", sessionToken ? "Success" : "Failed");
          }
        } catch (tokenErr) {
          console.error("[Traccar Server] Error generando token explícitamente:", {
            status: tokenErr.status,
            message: tokenErr.message,
            data: tokenErr.data,
          });
          return {
            success: false,
            error: "No se pudo generar el token de sesión de Traccar.",
          };
        }
      }

      if (!sessionToken) {
        if (isDebug) {
          console.error("[Traccar Server] No token obtained after all attempts");
        }
        return {
          success: false,
          error: "No se pudo obtener el token de sesión de Traccar.",
        };
      }

      if (!traccarUserId && session.user?.id) {
        traccarUserId = session.user.id;
      }

      // Update or create token in database
      if (isDebug) {
        console.log("[Traccar Server] Updating/creating token in database for profile:", profileId);
      }
      const supabase = await createClient();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

      // Check if record exists
      const { data: existingRecord } = await supabase
        .from("traccar_users")
        .select("traccar_user_id, traccar_username")
        .eq("profile_id", profileId)
        .single();

      if (existingRecord) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("traccar_users")
          .update({
            session_token: sessionToken,
            token_expires_at: tokenExpiresAt.toISOString(),
            last_sync_at: new Date().toISOString(),
            sync_error: null,
            // Update traccar_user_id if we got it from session
            ...(traccarUserId && { traccar_user_id: traccarUserId }),
            ...(traccarUsername && { traccar_username: traccarUsername }),
          })
          .eq("profile_id", profileId);

        if (updateError) {
          console.error("[Traccar Server] Error actualizando token en base de datos:", updateError);
          return {
            success: false,
            error: "Error al guardar el token de sesión.",
          };
        }
      } else {
        // Create new record if it doesn't exist
        if (!traccarUserId) {
          if (isDebug) {
            console.warn("[Traccar Server] No traccar_user_id available, record will be created without it");
          }
        }

        const { error: insertError } = await supabase
          .from("traccar_users")
          .insert({
            profile_id: profileId,
            traccar_user_id: traccarUserId,
            traccar_username: traccarUsername,
            session_token: sessionToken,
            token_expires_at: tokenExpiresAt.toISOString(),
            is_synced: true,
            last_sync_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error("[Traccar Server] Error creando registro en base de datos:", insertError);
          return {
            success: false,
            error: "Error al crear el registro de Traccar.",
          };
        }
        
        if (isDebug) {
          console.log("[Traccar Server] New traccar_users record created successfully");
        }
      }

      if (isDebug) {
        console.log("[Traccar Server] Token successfully updated in database");
      }

      return {
        success: true,
        token: sessionToken,
      };
    } catch (err) {
      console.error("[Traccar Server] Error al crear sesión en Traccar:", {
        status: err.status,
        message: err.message,
        data: err.data,
      });
      if (err.status === 401) {
        return {
          success: false,
          error: "Credenciales inválidas para Traccar.",
        };
      }
      return {
        success: false,
        error: `Error al crear sesión en Traccar: ${err.message || err}`,
      };
    }
  } catch (err) {
    console.error("[Traccar Server] Error inesperado en refreshTraccarSession:", {
      message: err.message,
      stack: err.stack,
    });
    return {
      success: false,
      error: err.message || "Error desconocido al refrescar la sesión de Traccar.",
    };
  }
}

