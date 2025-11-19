import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { traccarClient } from "@/utils/traccar/client";

/**
 * Proxy API route for Traccar devices endpoint
 * This route makes server-side requests to Traccar API with proper cookie handling
 */
export async function GET(request) {
  try {
    const authResult = await getAuthenticatedTraccarUser();
    if (authResult.error) {
      return authResult.error;
    }

    const { traccarUser } = authResult;

    // Make request to Traccar API using server-side client
    // The server-side client can properly set Cookie headers
    console.log("[Traccar Devices API] Making request with token:", {
      hasToken: !!traccarUser.session_token,
      tokenLength: traccarUser.session_token?.length || 0,
      tokenPreview: traccarUser.session_token
        ? traccarUser.session_token.substring(0, 20) + "..."
        : null,
    });

    const devices = await traccarClient.getDevices(traccarUser.session_token);

    console.log(
      "[Traccar Devices API] Request successful, devices count:",
      devices?.length || 0
    );

    return NextResponse.json(devices || []);
  } catch (error) {
    console.error("[Traccar Devices API] Error:", error);

    // Handle Traccar API errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Sesión expirada. Por favor, inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al obtener los dispositivos" },
      { status: error.status || 500 }
    );
  }
}

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
 * Create a new device
 */
export async function POST(request) {
  try {
    const authResult = await getAuthenticatedTraccarUser();
    if (authResult.error) {
      return authResult.error;
    }

    const { traccarUser } = authResult;

    // Parse request body
    const deviceData = await request.json();

    console.log("[Traccar Devices API] Creating device with token:", {
      hasToken: !!traccarUser.session_token,
      tokenLength: traccarUser.session_token?.length || 0,
      tokenPreview: traccarUser.session_token
        ? traccarUser.session_token.substring(0, 20) + "..."
        : null,
      deviceData,
    });

    // Create device using server-side client
    const device = await traccarClient.createDevice(
      deviceData,
      traccarUser.session_token
    );

    console.log("[Traccar Devices API] Device created successfully:", device?.id);

    return NextResponse.json(device);
  } catch (error) {
    console.error("[Traccar Devices API] Error creating device:", error);

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
          "Error al crear el dispositivo",
      },
      { status: error.status || 500 }
    );
  }
}

