/**
 * Traccar API Client
 * Handles all communication with Traccar API including authentication and request management
 */

const TRACCAR_API_URL =
  process.env.NEXT_PUBLIC_TRACCAR_API_URL || "http://localhost:8082/api";

/**
 * Creates Basic Auth header from email and password
 * Works in both browser and Node.js environments
 * @param {string} email
 * @param {string} password
 * @returns {string} Basic Auth header value
 */
function createBasicAuth(email, password) {
  const credentials = `${email}:${password}`;
  // Use btoa in browser, Buffer in Node.js
  let encoded;
  if (typeof btoa !== "undefined") {
    encoded = btoa(credentials);
  } else if (typeof Buffer !== "undefined") {
    encoded = Buffer.from(credentials).toString("base64");
  } else {
    throw new Error("No base64 encoding method available");
  }
  return `Basic ${encoded}`;
}

/**
 * Creates Bearer token header
 * @param {string} token
 * @returns {string} Bearer token header value
 */
function createBearerAuth(token) {
  return `Bearer ${token}`;
}

/**
 * Traccar API Client class
 */
class TraccarClient {
  constructor(baseUrl = TRACCAR_API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  /**
   * Makes a request to Traccar API
   * @param {string} endpoint - API endpoint (e.g., '/session', '/users')
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
   * @param {Object} options.body - Request body
   * @param {Object} options.headers - Additional headers
   * @param {string} options.authType - 'basic' or 'bearer'
   * @param {string} options.email - Email for Basic Auth
   * @param {string} options.password - Password for Basic Auth
   * @param {string} options.token - Token for Bearer Auth
   * @param {string} options.contentType - Content-Type header (default: 'application/json')
   * @returns {Promise<{data: any, headers: Headers, status: number}>}
   */
  async request(endpoint, options = {}) {
    const {
      method = "GET",
      body = null,
      headers = {},
      authType = null,
      email = null,
      password = null,
      token = null,
      cookie = null, // JSESSIONID cookie for authentication
      contentType = "application/json",
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = {
      ...headers,
      // Add Accept header for JSON responses (required by Traccar API)
      Accept: "application/json",
    };

    // Set Content-Type
    if (body && contentType) {
      // Ensure charset is included for form-urlencoded
      if (
        contentType.includes("application/x-www-form-urlencoded") &&
        !contentType.includes("charset")
      ) {
        requestHeaders["Content-Type"] =
          "application/x-www-form-urlencoded;charset=UTF-8";
      } else {
        requestHeaders["Content-Type"] = contentType;
      }
    }

    // Set authentication
    if (authType === "basic" && email && password) {
      requestHeaders["Authorization"] = createBasicAuth(email, password);
    } else if (authType === "bearer" && token) {
      requestHeaders["Authorization"] = createBearerAuth(token);
    } else if (cookie && cookie.trim() !== "") {
      // Use cookie-based authentication (JSESSIONID)
      // Only set cookie if it's not empty
      requestHeaders["Cookie"] = `JSESSIONID=${cookie.trim()}`;
    }

    // Prepare request body
    let requestBody = null;
    if (body) {
      // Check if content type is form-urlencoded (with or without charset)
      if (
        contentType &&
        contentType.includes("application/x-www-form-urlencoded")
      ) {
        // Convert object to URL-encoded string
        if (typeof body === "object" && !Array.isArray(body)) {
          // Use URLSearchParams to properly encode form data
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(body)) {
            // Only add non-null/undefined values
            if (value != null) {
              params.append(key, String(value));
            }
          }
          requestBody = params.toString();
        } else {
          requestBody = body;
        }
      } else if (contentType && contentType.includes("application/json")) {
        requestBody = JSON.stringify(body);
      } else {
        requestBody = body;
      }
    }

    // Debug logging (can be enabled via TRACCAR_DEBUG env var)
    const isDebug =
      process.env.TRACCAR_DEBUG === "true" ||
      process.env.NEXT_PUBLIC_TRACCAR_DEBUG === "true";

    // Always log session creation requests even without debug mode
    const isSessionRequest = endpoint === "/session" && method === "POST";
    // Always log device requests to debug authentication issues
    const isDeviceRequest = endpoint === "/devices" && method === "GET";

    if (isDebug || isSessionRequest || isDeviceRequest) {
      console.log("[Traccar API] Request:", {
        method,
        url,
        endpoint,
        headers: {
          ...requestHeaders,
          // Mask sensitive headers
          Authorization: requestHeaders.Authorization
            ? `${requestHeaders.Authorization.substring(0, 20)}...`
            : undefined,
          Cookie: requestHeaders.Cookie
            ? `${requestHeaders.Cookie.substring(0, 30)}...`
            : undefined,
        },
        body: requestBody
          ? contentType &&
            contentType.includes("application/x-www-form-urlencoded")
            ? requestBody
            : typeof requestBody === "string"
            ? requestBody.substring(0, 200) +
              (requestBody.length > 200 ? "..." : "")
            : requestBody
          : null,
        bodyType: typeof requestBody,
        bodyLength: requestBody?.length,
      });
    }

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
      });

      // Debug: Log response status and headers
      const isDebug =
        process.env.TRACCAR_DEBUG === "true" ||
        process.env.NEXT_PUBLIC_TRACCAR_DEBUG === "true";

      // Always log device requests to debug authentication issues
      const isDeviceRequest = endpoint === "/devices" && method === "GET";
      // Always log session requests
      const isSessionRequest = endpoint === "/session" && method === "POST";

      if (isDebug || isDeviceRequest || isSessionRequest) {
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] =
            key.toLowerCase() === "set-cookie"
              ? value.substring(0, 100) + (value.length > 100 ? "..." : "")
              : value;
        });
        console.log(
          "[Traccar API] Response Status:",
          response.status,
          response.statusText
        );
        console.log("[Traccar API] Response Headers:", responseHeaders);

        // Log all Set-Cookie headers specifically
        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        if (setCookieHeaders.length > 0) {
          console.log(
            "[Traccar API] Set-Cookie headers (all):",
            setCookieHeaders
          );
        }
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        if (isDebug) {
          console.log("[Traccar API] Response: 204 No Content");
        }
        return {
          data: null,
          headers: response.headers,
          status: response.status,
        };
      }

      // Try to parse response body
      let data = null;
      let rawBody = null;
      const contentType = response.headers.get("content-type");

      try {
        // First, get the raw text to see what we're dealing with
        rawBody = await response.text();

        if (isDebug) {
          console.log(
            "[Traccar API] Raw Response Body:",
            rawBody ? rawBody.substring(0, 1000) : "(empty)"
          );
        }

        // If body is empty, set data to null
        if (!rawBody || rawBody.trim() === "") {
          data = null;
        } else {
          // Try to parse as JSON if content-type suggests it, or if it looks like JSON
          if (contentType && contentType.includes("application/json")) {
            try {
              data = JSON.parse(rawBody);
            } catch (parseError) {
              // Only log error if body is not empty and looks like it should be JSON
              // Don't log errors for empty responses or "{}"
              const trimmedBody = rawBody?.trim() || "";
              if (trimmedBody !== "" && trimmedBody !== "{}") {
                console.error("[Traccar API] Failed to parse JSON response:", {
                  error: parseError.message,
                  rawBody: rawBody.substring(0, 500),
                  status: response.status,
                });
              }
              // Keep rawBody as data if JSON parsing fails
              data = rawBody;
            }
          } else if (contentType && contentType.includes("text/plain")) {
            data = rawBody;
          } else {
            // Try to parse as JSON anyway, fallback to text
            try {
              data = JSON.parse(rawBody);
            } catch {
              data = rawBody;
            }
          }
        }
      } catch (bodyError) {
        console.error("[Traccar API] Error reading response body:", bodyError);
        data = null;
      }

      if (isDebug) {
        console.log(
          "[Traccar API] Parsed Response Body:",
          typeof data === "string"
            ? data.substring(0, 500) + (data.length > 500 ? "..." : "")
            : JSON.stringify(data, null, 2).substring(0, 1000)
        );
      }

      // Check for errors
      if (!response.ok) {
        // Build error message from response
        let errorMessage = `Traccar API error: ${response.statusText}`;

        // Handle specific status codes
        if (response.status === 401) {
          errorMessage =
            "No autorizado. El JSESSIONID puede ser inválido o haber expirado. Por favor, inicia sesión nuevamente.";
        } else if (response.status === 403) {
          errorMessage =
            "Acceso prohibido. No tienes permisos para realizar esta acción.";
        } else if (response.status === 404) {
          errorMessage = "Recurso no encontrado.";
        }

        if (rawBody && rawBody.trim() !== "" && rawBody.trim() !== "{}") {
          // If we have raw body, try to extract meaningful error message
          if (typeof data === "string") {
            errorMessage = data.substring(0, 500);
          } else if (data?.message) {
            errorMessage = data.message;
          } else if (data?.error) {
            errorMessage = data.error;
          } else {
            errorMessage = rawBody.substring(0, 500);
          }
        } else if (data?.message) {
          errorMessage = data.message;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        error.rawBody = rawBody;

        // Log errors with status code and cookie info
        // Only log detailed info if body has meaningful content
        const trimmedBody = rawBody?.trim() || "";
        const hasMeaningfulBody = trimmedBody !== "" && trimmedBody !== "{}";
        
        if (hasMeaningfulBody || response.status === 401) {
          // Always log 401 errors (authentication issues) and errors with meaningful bodies
          console.error("[Traccar API] Error Response:", {
            status: error.status,
            statusText: response.statusText,
            message: error.message,
            endpoint,
            hasCookie: !!requestHeaders.Cookie,
            cookiePreview: requestHeaders.Cookie
              ? requestHeaders.Cookie.substring(0, 40) + "..."
              : "none",
            rawBody: hasMeaningfulBody
              ? rawBody.substring(0, 500)
              : "(empty or {})",
          });
        }

        throw error;
      }

      return {
        data,
        headers: response.headers,
        status: response.status,
      };
    } catch (error) {
      // Enhance error with more context
      if (error.status) {
        // This is already a Traccar API error with status
        throw error;
      }

      // Network or parsing errors
      const isDebug =
        process.env.TRACCAR_DEBUG === "true" ||
        process.env.NEXT_PUBLIC_TRACCAR_DEBUG === "true";

      // Always log connection/parsing errors
      console.error("[Traccar API] Connection/Parsing Error:", {
        message: error.message,
        stack: error.stack?.substring(0, 500),
      });

      throw new Error(`Error connecting to Traccar API: ${error.message}`);
    }
  }

  /**
   * Creates a new session (login)
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: Object, token: string | null}>}
   */
  async createSession(email, password) {
    const isDebug =
      process.env.TRACCAR_DEBUG === "true" ||
      process.env.NEXT_PUBLIC_TRACCAR_DEBUG === "true";

    // Validate inputs
    if (!email || typeof email !== "string") {
      throw new Error("Email is required and must be a string");
    }
    if (!password || typeof password !== "string") {
      throw new Error("Password is required and must be a string");
    }

    // Always log session creation attempts
    console.log("[Traccar Session] Creating session for:", email);

    // Ensure body values are strings (trimmed)
    const body = {
      email: String(email).trim(),
      password: String(password),
    };

    if (isDebug) {
      console.log("[Traccar Session] Request body prepared:", {
        email: body.email,
        passwordLength: body.password.length,
      });
    }

    const response = await this.request("/session", {
      method: "POST",
      body,
      contentType: "application/x-www-form-urlencoded;charset=UTF-8",
    });

    if (isDebug) {
      console.log("[Traccar Session] Session response received:", {
        status: response.status,
        hasUserData: !!response.data,
        userId: response.data?.id,
        userEmail: response.data?.email,
      });
    }

    // Extract JSESSIONID from response headers
    let jsessionId = null;

    // Try to get Set-Cookie header (may be a string or array in different environments)
    // In Node.js, getSetCookie() returns an array, get() might return a string
    let setCookieHeader = null;

    // Try getSetCookie() first (Node.js 18+)
    if (response.headers.getSetCookie) {
      const setCookieArray = response.headers.getSetCookie();
      if (setCookieArray && setCookieArray.length > 0) {
        setCookieHeader = setCookieArray.join("; ");
        if (isDebug) {
          console.log(
            "[Traccar Session] Set-Cookie headers (getSetCookie):",
            setCookieArray
          );
        }
      }
    }

    // Fallback to get() method
    if (!setCookieHeader) {
      setCookieHeader = response.headers.get("set-cookie");
      if (Array.isArray(setCookieHeader)) {
        setCookieHeader = setCookieHeader.join("; ");
      }
    }

    // Always log Set-Cookie for debugging
    console.log(
      "[Traccar Session] Set-Cookie header:",
      setCookieHeader || "Not found"
    );

    if (setCookieHeader) {
      // Extract JSESSIONID from cookie
      const jsessionMatch = setCookieHeader.match(/JSESSIONID=([^;]+)/);
      if (jsessionMatch) {
        jsessionId = jsessionMatch[1];
        console.log(
          "[Traccar Session] JSESSIONID extracted successfully:",
          jsessionId.substring(0, 30) + "...",
          `(length: ${jsessionId.length})`
        );
      } else {
        console.warn(
          "[Traccar Session] JSESSIONID not found in Set-Cookie header",
          {
            setCookieHeader: setCookieHeader.substring(0, 200),
          }
        );
      }
    } else {
      console.warn("[Traccar Session] No Set-Cookie header found in response");
    }

    if (!jsessionId && response.data?.id) {
      if (isDebug) {
        console.warn(
          "[Traccar Session] Session created but JSESSIONID not found. API calls may fail."
        );
      }
    }

    if (isDebug) {
      console.log("[Traccar Session] Final result:", {
        hasUser: !!response.data,
        hasJsessionId: !!jsessionId,
        jsessionIdLength: jsessionId?.length || 0,
      });
    }

    return {
      user: response.data,
      token: jsessionId, // Return JSESSIONID as token (for backward compatibility)
      jsessionId, // Also return as jsessionId for clarity
    };
  }

  /**
   * Gets current session information
   * @param {string} token - Optional session token
   * @returns {Promise<Object>} User object
   */
  async getSession(token = null) {
    const options = {};
    if (token) {
      options.authType = "bearer";
      options.token = token;
    }

    const response = await this.request("/session", {
      method: "GET",
      ...options,
    });

    return response.data;
  }

  /**
   * Closes the current session (logout)
   * @param {string} token - Session token
   * @returns {Promise<void>}
   */
  async closeSession(token) {
    await this.request("/session", {
      method: "DELETE",
      authType: "bearer",
      token,
    });
  }

  /**
   * Generates a session token
   * @param {string} email
   * @param {string} password
   * @param {string} expiration - Optional expiration date
   * @returns {Promise<string>} Token string
   */
  async generateToken(email, password, expiration = null) {
    const body = expiration ? { expiration } : {};
    const response = await this.request("/session/token", {
      method: "POST",
      body,
      contentType: "application/x-www-form-urlencoded",
      authType: "basic",
      email,
      password,
    });

    return response.data;
  }

  /**
   * Creates a new user (requires admin authentication)
   * @param {Object} userData - User data
   * @param {string} adminEmail - Admin email for authentication
   * @param {string} adminPassword - Admin password for authentication
   * @returns {Promise<Object>} Created user object
   */
  async createUser(userData, adminEmail, adminPassword) {
    const response = await this.request("/users", {
      method: "POST",
      body: userData,
      authType: "basic",
      email: adminEmail,
      password: adminPassword,
    });

    return response.data;
  }

  /**
   * Updates a user
   * @param {number} userId - User ID
   * @param {Object} userData - User data to update
   * @param {string} email - Email for Basic Auth
   * @param {string} password - Password for Basic Auth
   * @returns {Promise<Object>} Updated user object
   */
  async updateUser(userId, userData, email, password) {
    const response = await this.request(`/users/${userId}`, {
      method: "PUT",
      body: userData,
      authType: "basic",
      email,
      password,
    });

    return response.data;
  }

  /**
   * Sends password reset email
   * @param {string} email - User email
   * @returns {Promise<void>}
   */
  async resetPassword(email) {
    await this.request("/password/reset", {
      method: "POST",
      body: { email },
      contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    });
  }

  /**
   * Fetches a list of devices
   * @param {string} jsessionId - JSESSIONID cookie for authentication
   * @returns {Promise<Array>} Array of device objects
   */
  async getDevices(jsessionId) {
    // Validate jsessionId before making request
    if (!jsessionId || jsessionId.trim() === "") {
      throw new Error("JSESSIONID no válido. Por favor, inicia sesión nuevamente.");
    }

    const response = await this.request("/devices", {
      method: "GET",
      cookie: jsessionId,
    });

    return response.data;
  }

  /**
   * Fetches a single device by ID
   * @param {number} id - Device ID
   * @param {string} jsessionId - JSESSIONID cookie for authentication
   * @returns {Promise<Object>} Device object
   */
  async getDevice(id, jsessionId) {
    const response = await this.request(`/devices?id=${id}`, {
      method: "GET",
      cookie: jsessionId,
    });

    return response.data?.[0] || null;
  }

  /**
   * Creates a new device
   * @param {Object} deviceData - Device data
   * @param {string} jsessionId - JSESSIONID cookie for authentication
   * @returns {Promise<Object>} Created device object
   */
  async createDevice(deviceData, jsessionId) {
    const response = await this.request("/devices", {
      method: "POST",
      body: deviceData,
      cookie: jsessionId,
    });

    return response.data;
  }

  /**
   * Updates an existing device
   * @param {number} id - Device ID
   * @param {Object} deviceData - Device data to update
   * @param {string} jsessionId - JSESSIONID cookie for authentication
   * @returns {Promise<Object>} Updated device object
   */
  async updateDevice(id, deviceData, jsessionId) {
    const response = await this.request(`/devices/${id}`, {
      method: "PUT",
      body: deviceData,
      cookie: jsessionId,
    });

    return response.data;
  }

  /**
   * Deletes a device
   * @param {number} id - Device ID
   * @param {string} jsessionId - JSESSIONID cookie for authentication
   * @returns {Promise<void>}
   */
  async deleteDevice(id, jsessionId) {
    await this.request(`/devices/${id}`, {
      method: "DELETE",
      cookie: jsessionId,
    });
  }

  /**
   * Fetches positions for a device or all devices
   * @param {number|null} deviceId - Optional device ID. If null, returns last known positions for all devices
   * @param {string} jsessionId - JSESSIONID cookie for authentication
   * @param {string|null} from - Optional start date in ISO 8601 format
   * @param {string|null} to - Optional end date in ISO 8601 format
   * @returns {Promise<Array>} Array of position objects
   */
  async getPositions(deviceId = null, jsessionId, from = null, to = null) {
    let endpoint = "/positions";
    const params = [];

    if (deviceId) {
      params.push(`deviceId=${deviceId}`);
    }
    if (from) {
      params.push(`from=${encodeURIComponent(from)}`);
    }
    if (to) {
      params.push(`to=${encodeURIComponent(to)}`);
    }

    if (params.length > 0) {
      endpoint += `?${params.join("&")}`;
    }

    const response = await this.request(endpoint, {
      method: "GET",
      cookie: jsessionId,
    });

    return response.data;
  }
}

// Export singleton instance
export const traccarClient = new TraccarClient();

// Export class for custom instances
export default TraccarClient;
