import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { traccarClient } from "@/utils/traccar/client";

/**
 * Helper function to get authenticated user and Traccar session token
 * @returns {Promise<{user: Object, profile: Object, traccarUser: Object} | {error: NextResponse}>}
 */
async function getAuthenticatedTraccarUser() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      ),
    };
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { error: "Perfil de usuario no encontrado" },
        { status: 404 }
      ),
    };
  }

  // Get Traccar session token
  const { data: traccarUser, error: traccarError } = await supabase
    .from("traccar_users")
    .select("session_token, token_expires_at")
    .eq("profile_id", profile.id)
    .single();

  if (traccarError || !traccarUser) {
    return {
      error: NextResponse.json(
        { error: "Usuario no sincronizado con Traccar" },
        { status: 404 }
      ),
    };
  }

  if (!traccarUser.session_token || traccarUser.session_token.trim() === "") {
    return {
      error: NextResponse.json(
        { error: "Token de sesión no disponible" },
        { status: 401 }
      ),
    };
  }

  // Check if token is expired
  if (
    traccarUser.token_expires_at &&
    new Date(traccarUser.token_expires_at) < new Date()
  ) {
    return {
      error: NextResponse.json(
        { error: "Token de sesión expirado" },
        { status: 401 }
      ),
    };
  }

  return { user, profile, traccarUser };
}

/**
 * Update an existing device
 */
export async function PUT(request, { params }) {
  try {
    const authResult = await getAuthenticatedTraccarUser();
    if (authResult.error) {
      return authResult.error;
    }

    const { traccarUser } = authResult;
    const { id } = await params;
    const deviceId = id;

    if (!deviceId) {
      return NextResponse.json(
        { error: "ID de dispositivo requerido" },
        { status: 400 }
      );
    }

    // Parse request body
    const deviceData = await request.json();

    console.log("[Traccar Devices API] Updating device with token:", {
      deviceId,
      hasToken: !!traccarUser.session_token,
      tokenLength: traccarUser.session_token?.length || 0,
      tokenPreview: traccarUser.session_token
        ? traccarUser.session_token.substring(0, 20) + "..."
        : null,
      deviceData,
    });

    // Update device using server-side client
    const device = await traccarClient.updateDevice(
      deviceId,
      deviceData,
      traccarUser.session_token
    );

    console.log("[Traccar Devices API] Device updated successfully:", device?.id);

    return NextResponse.json(device);
  } catch (error) {
    console.error("[Traccar Devices API] Error updating device:", error);

    // Handle Traccar API errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Sesión expirada. Por favor, inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error:
          error.data?.message ||
          error.message ||
          "Error al actualizar el dispositivo",
      },
      { status: error.status || 500 }
    );
  }
}

