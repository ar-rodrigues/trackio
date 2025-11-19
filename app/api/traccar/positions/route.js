import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { traccarClient } from "@/utils/traccar/client";

/**
 * Proxy API route for Traccar positions endpoint
 * This route makes server-side requests to Traccar API with proper cookie handling
 */
export async function GET(request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Perfil de usuario no encontrado" },
        { status: 404 }
      );
    }

    // Get Traccar session token
    const { data: traccarUser, error: traccarError } = await supabase
      .from("traccar_users")
      .select("session_token, token_expires_at")
      .eq("profile_id", profile.id)
      .single();

    if (traccarError || !traccarUser) {
      return NextResponse.json(
        { error: "Usuario no sincronizado con Traccar" },
        { status: 404 }
      );
    }

    if (!traccarUser.session_token || traccarUser.session_token.trim() === "") {
      return NextResponse.json(
        { error: "Token de sesión no disponible" },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (
      traccarUser.token_expires_at &&
      new Date(traccarUser.token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: "Token de sesión expirado" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get("deviceId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Make request to Traccar API using server-side client
    const positions = await traccarClient.getPositions(
      deviceId ? parseInt(deviceId) : null,
      traccarUser.session_token,
      from,
      to
    );

    return NextResponse.json(positions || []);
  } catch (error) {
    console.error("[Traccar Positions API] Error:", error);
    
    // Handle Traccar API errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: "Sesión expirada. Por favor, inicia sesión nuevamente." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Error al obtener las posiciones" },
      { status: error.status || 500 }
    );
  }
}


