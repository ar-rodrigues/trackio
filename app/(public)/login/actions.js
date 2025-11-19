"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { registerTraccarUser, refreshTraccarSession } from "@/utils/traccar/server";
import { sendWelcomeEmail } from "@/utils/mailer/mailer";

export async function login(formData) {
  const supabase = await createClient();

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const { data: signInData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    // Return error object instead of throwing
    // This allows the client to handle the error gracefully
    return {
      error: true,
      message: getErrorMessage(error.message),
    };
  }

  // After successful Supabase login, MANDATORY: Create/refresh Traccar session
  // User MUST have a valid Traccar session to be allowed to login
  if (signInData?.user) {
    try {
      // Wait a bit for the profile to be available
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", signInData.user.id)
        .single();

      if (profileError || !profile) {
        console.error("[Login] Profile not found for user:", signInData.user.id);
        // Sign out the user since we can't proceed without a profile
        await supabase.auth.signOut();
        return {
          error: true,
          message: "Error: Perfil de usuario no encontrado. Por favor, contacta al administrador.",
        };
      }

      // MANDATORY: Create/refresh Traccar session - this will create the record if it doesn't exist
      // This will fail if user doesn't exist in Traccar or credentials are wrong
      const refreshResult = await refreshTraccarSession(
        data.email,
        data.password,
        profile.id
      );
      
      if (!refreshResult.success) {
        console.error("[Login] Failed to create/refresh Traccar session:", refreshResult.error);
        // Sign out the user since Traccar session creation failed
        await supabase.auth.signOut();
        
        // Provide specific error messages based on the error
        if (refreshResult.error?.includes("Credenciales inválidas") || refreshResult.error?.includes("401")) {
          return {
            error: true,
            message: "Credenciales inválidas para Traccar. Por favor, verifica tu email y contraseña.",
          };
        }
        
        return {
          error: true,
          message: refreshResult.error || "No se pudo crear la sesión en Traccar. Por favor, verifica tus credenciales o contacta al administrador.",
        };
      }
    } catch (traccarError) {
      console.error("[Login] Unexpected error during Traccar session creation:", traccarError);
      // Sign out the user since we can't create a Traccar session
      await supabase.auth.signOut();
      return {
        error: true,
        message: "Error al crear la sesión en Traccar. Por favor, intenta nuevamente o contacta al administrador.",
      };
    }
  }

  revalidatePath("/", "layout");
  redirect("/private");
}

/**
 * Converts Supabase error messages to user-friendly Spanish messages
 */
function getErrorMessage(errorMessage) {
  const errorMap = {
    "Invalid login credentials":
      "Credenciales inválidas. Por favor, verifica tu email y contraseña.",
    "Email not confirmed":
      "Por favor, confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.",
    "Too many requests":
      "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.",
    "User not found": "No se encontró una cuenta con este email.",
    "Invalid email": "El email proporcionado no es válido.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al iniciar sesión. Por favor, intenta nuevamente.";
}

export async function signup(formData) {
  const supabase = await createClient();

  // Get form data
  const email = formData.get("email");
  const password = formData.get("password");
  const firstName = formData.get("firstName") || "";
  const lastName = formData.get("lastName") || "";
  const name = `${firstName} ${lastName}`.trim() || email?.split("@")[0] || "Usuario"; // Use full name or email prefix as name

  // Validate inputs
  if (!email || !password || !firstName || !lastName) {
    return {
      error: true,
      message: "Por favor, completa todos los campos requeridos.",
    };
  }

  // STEP 1: Register user in Traccar FIRST (before Supabase signup)
  // This ensures we don't create a Supabase user if Traccar registration fails
  const traccarResult = await registerTraccarUser({
    name,
    firstName,
    lastName,
    email,
    password,
  });

  if (!traccarResult.success) {
    // Traccar registration failed - return error and don't proceed with Supabase signup
    return {
      error: true,
      message: traccarResult.error || "Error al registrar el usuario en Traccar.",
    };
  }

  // STEP 2: Only proceed with Supabase signup if Traccar registration succeeded
  const data = {
    email,
    password,
    options: {
      emailRedirectTo: `/auth/confirm?next=/private`,
      data: {
        traccar_user_id: traccarResult.data?.traccarUser?.id,
        traccar_token: traccarResult.data?.token,
      },
    },
  };

  const { data: signupData, error } = await supabase.auth.signUp(data);

  if (error) {
    // Supabase signup failed - but user was already created in Traccar
    // This is a problem, but we'll return the error
    // In production, you might want to delete the Traccar user here
    console.error(
      "Supabase signup failed after Traccar registration:",
      error
    );
    return {
      error: true,
      message: getSignupErrorMessage(error.message),
    };
  }

  // STEP 3: Save Traccar user mapping to database and update profile
  // Get the created user's profile
  if (signupData?.user) {
    try {
      // Wait a bit for the profile to be created by trigger
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", signupData.user.id)
        .single();

      if (profile) {
        // Update profile with first_name and last_name
        await supabase
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
          })
          .eq("id", profile.id);

        // Save Traccar user mapping
        if (traccarResult.data?.traccarUser) {
          const sessionToken = traccarResult.data.token;
          
          // Only save token if we have one, otherwise save without token (user will need to login)
          const traccarUserData = {
            profile_id: profile.id,
            traccar_user_id: traccarResult.data.traccarUser.id,
            traccar_username: traccarResult.data.traccarUser.email || email,
            is_synced: true,
            last_sync_at: new Date().toISOString(),
          };

          // If we have a token, add it with expiration
          if (sessionToken) {
            const tokenExpiresAt = new Date();
            tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);
            traccarUserData.session_token = sessionToken;
            traccarUserData.token_expires_at = tokenExpiresAt.toISOString();
          } else {
            console.warn(
              `Usuario ${email} registrado en Traccar pero no se obtuvo token de sesión. El usuario necesitará iniciar sesión en Traccar.`
            );
          }

          await supabase.from("traccar_users").insert(traccarUserData);
        }
      }
    } catch (dbError) {
      console.error(
        "Error saving user data to database:",
        dbError
      );
      // Don't fail signup if DB mapping fails - it can be fixed later
    }
  }

  // STEP 4: Send welcome email
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : "http://localhost:3000");

    await sendWelcomeEmail(email, name, password, baseUrl);
  } catch (emailError) {
    console.error("Error sending welcome email:", emailError);
    // Don't fail signup if email fails - it's not critical
  }

  // STEP 5: Revalidate and redirect to private route
  revalidatePath("/", "layout");
  redirect("/private");
}

/**
 * Converts Supabase signup error messages to user-friendly Spanish messages
 */
function getSignupErrorMessage(errorMessage) {
  const errorMap = {
    "User already registered":
      "Este email ya está registrado. Por favor, inicia sesión en su lugar.",
    "Password should be at least 6 characters":
      "La contraseña debe tener al menos 6 caracteres.",
    "Invalid email": "El email proporcionado no es válido.",
    "Email rate limit exceeded":
      "Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.",
    "Signup is disabled":
      "El registro está deshabilitado temporalmente. Por favor, contacta al administrador.",
  };

  // Try to find a matching error message
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default to a generic error message
  return "Ocurrió un error al crear la cuenta. Por favor, intenta nuevamente.";
}
