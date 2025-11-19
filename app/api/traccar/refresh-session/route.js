import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { refreshTraccarSession } from "@/utils/traccar/server";

/**
 * API route to refresh Traccar session token
 * This endpoint attempts to refresh the Traccar session using the user's stored credentials
 * Note: This requires the user to have logged in recently with their password
 */
export async function POST(request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
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

    // Get request body with password
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Contraseña requerida para refrescar la sesión" },
        { status: 400 }
      );
    }

    // Refresh Traccar session
    const result = await refreshTraccarSession(
      user.email,
      password,
      profile.id
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al refrescar la sesión" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.token,
    });
  } catch (error) {
    console.error("[Refresh Session API] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}


