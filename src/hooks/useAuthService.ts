import { useState, useCallback } from "react";
import { AUTHSERVICE_API_URL, ENDPOINTS } from "@/config/azure";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface HealthStatus {
  status: string;
  timestamp: string;
}

interface EndpointStatus {
  path: string;
  method: string;
  status: "online" | "offline" | "checking";
  description: string;
  latency?: number;
}

export const useAuthService = () => {
  const [accessToken, setAccessToken] = useState<string>("");

  const checkEndpointHealth = useCallback(async (endpoint: string, method: string = "GET"): Promise<EndpointStatus> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${AUTHSERVICE_API_URL}${endpoint}`, {
        method: method === "GET" ? "GET" : "OPTIONS",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const latency = Date.now() - startTime;
      return {
        path: endpoint,
        method,
        status: response.ok || response.status === 401 ? "online" : "offline",
        description: "",
        latency,
      };
    } catch {
      return {
        path: endpoint,
        method,
        status: "offline",
        description: "",
      };
    }
  }, []);

  const checkAllEndpoints = useCallback(async (): Promise<EndpointStatus[]> => {
    const endpointList = [
      { method: "GET", path: ENDPOINTS.me, description: "Claims do usuário" },
      { method: "POST", path: ENDPOINTS.validate, description: "Validar token" },
      { method: "POST", path: ENDPOINTS.exchange, description: "Token interno" },
      { method: "POST", path: ENDPOINTS.obo, description: "On-Behalf-Of" },
      { method: "POST", path: ENDPOINTS.clientToken, description: "Client credentials" },
      { method: "GET", path: ENDPOINTS.jwks, description: "JWKS público" },
    ];

    const results = await Promise.all(
      endpointList.map(async (ep) => {
        const result = await checkEndpointHealth(ep.path, ep.method);
        return { ...result, description: ep.description };
      })
    );

    return results;
  }, [checkEndpointHealth]);

  const getJwks = useCallback(async () => {
    try {
      const response = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.jwks}`);
      if (!response.ok) throw new Error("Failed to fetch JWKS");
      return await response.json();
    } catch (error) {
      console.error("JWKS fetch error:", error);
      return null;
    }
  }, []);

  const validateToken = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.validate}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  const getUserClaims = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.me}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  const exchangeToken = useCallback(async (token: string) => {
    try {
      const response = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.exchange}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  const getOboToken = useCallback(async (token: string, targetApi: string, scopes: string[]) => {
    try {
      const response = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.obo}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ targetApi, scopes }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  const getClientToken = useCallback(async (adminToken: string, targetApi: string) => {
    try {
      const response = await fetch(`${AUTHSERVICE_API_URL}${ENDPOINTS.clientToken}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ targetApi }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }, []);

  return {
    accessToken,
    setAccessToken,
    checkAllEndpoints,
    getJwks,
    validateToken,
    getUserClaims,
    exchangeToken,
    getOboToken,
    getClientToken,
    apiUrl: AUTHSERVICE_API_URL,
  };
};
