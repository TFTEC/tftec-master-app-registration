import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { graphConfig } from "@/config/msal";

export interface GraphUser {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  jobTitle: string | null;
  department: string | null;
  accountEnabled: boolean;
  createdDateTime: string;
}

export interface AppRegistration {
  id: string;
  appId: string;
  displayName: string;
  createdDateTime: string;
  signInAudience: string;
  passwordCredentials: PasswordCredential[];
}

export interface PasswordCredential {
  keyId: string;
  displayName: string | null;
  startDateTime: string;
  endDateTime: string;
  hint: string;
}

export interface SignInLog {
  id: string;
  createdDateTime: string;
  userDisplayName: string;
  userPrincipalName: string;
  appDisplayName: string;
  status: {
    errorCode: number;
    failureReason: string | null;
  };
  ipAddress: string;
  location: {
    city: string;
    countryOrRegion: string;
  };
}

export interface DashboardMetrics {
  totalUsers: number;
  totalApps: number;
  signInSuccess: number;
  signInFailure: number;
  recentSignIns: SignInLog[];
  appUsage: { appName: string; count: number }[];
  signInTrend: { date: string; success: number; failure: number }[];
}

export const useGraphApi = () => {
  const { getAccessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callGraph = useCallback(async <T>(endpoint: string, options?: RequestInit): Promise<T | null> => {
    const token = await getAccessToken();
    if (!token) {
      setError("Não foi possível obter token de acesso");
      return null;
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      throw err;
    }
  }, [getAccessToken]);

  // Users
  const getUsers = useCallback(async (): Promise<GraphUser[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await callGraph<{ value: GraphUser[] }>(
        `${graphConfig.graphUsersEndpoint}?$select=id,displayName,mail,userPrincipalName,jobTitle,department,accountEnabled,createdDateTime&$top=100`
      );
      return result?.value || [];
    } finally {
      setLoading(false);
    }
  }, [callGraph]);

  const createUser = useCallback(async (userData: {
    displayName: string;
    userPrincipalName: string;
    mailNickname: string;
    password: string;
    accountEnabled: boolean;
  }): Promise<GraphUser | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await callGraph<GraphUser>(graphConfig.graphUsersEndpoint, {
        method: "POST",
        body: JSON.stringify({
          ...userData,
          passwordProfile: {
            password: userData.password,
            forceChangePasswordNextSignIn: true,
          },
        }),
      });
      return result;
    } finally {
      setLoading(false);
    }
  }, [callGraph]);

  const updateUser = useCallback(async (userId: string, userData: Partial<GraphUser>): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await callGraph(`${graphConfig.graphUsersEndpoint}/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(userData),
      });
    } finally {
      setLoading(false);
    }
  }, [callGraph]);

  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Token não disponível");

      const response = await fetch(`${graphConfig.graphUsersEndpoint}/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar usuário: HTTP ${response.status}`);
      }
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  // App Registrations
  const getAppRegistrations = useCallback(async (): Promise<AppRegistration[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await callGraph<{ value: AppRegistration[] }>(
        `${graphConfig.graphAppsEndpoint}?$select=id,appId,displayName,createdDateTime,signInAudience,passwordCredentials&$top=100`
      );
      return result?.value || [];
    } finally {
      setLoading(false);
    }
  }, [callGraph]);

  const createAppSecret = useCallback(async (appId: string, displayName: string, expiryMonths: number = 12): Promise<{ secretText: string; keyId: string } | null> => {
    setLoading(true);
    setError(null);
    try {
      const endDateTime = new Date();
      endDateTime.setMonth(endDateTime.getMonth() + expiryMonths);

      const result = await callGraph<{ secretText: string; keyId: string }>(
        `${graphConfig.graphAppsEndpoint}/${appId}/addPassword`,
        {
          method: "POST",
          body: JSON.stringify({
            passwordCredential: {
              displayName,
              endDateTime: endDateTime.toISOString(),
            },
          }),
        }
      );
      return result;
    } finally {
      setLoading(false);
    }
  }, [callGraph]);

  const deleteAppSecret = useCallback(async (appId: string, keyId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await callGraph(`${graphConfig.graphAppsEndpoint}/${appId}/removePassword`, {
        method: "POST",
        body: JSON.stringify({ keyId }),
      });
    } finally {
      setLoading(false);
    }
  }, [callGraph]);

  // Dashboard Metrics
  const getDashboardMetrics = useCallback(async (): Promise<DashboardMetrics> => {
    setLoading(true);
    setError(null);
    try {
      // Parallel fetches for better performance
      const [usersResult, appsResult, signInsResult] = await Promise.all([
        callGraph<{ "@odata.count": number; value: GraphUser[] }>(
          `${graphConfig.graphUsersEndpoint}?$count=true&$top=1`,
        ).catch(() => null),
        callGraph<{ "@odata.count": number; value: AppRegistration[] }>(
          `${graphConfig.graphAppsEndpoint}?$count=true&$top=1`,
        ).catch(() => null),
        callGraph<{ value: SignInLog[] }>(
          `${graphConfig.graphSignInLogsEndpoint}?$top=100&$orderby=createdDateTime desc`
        ).catch(() => null),
      ]);

      const signIns = signInsResult?.value || [];
      
      // Calculate metrics
      const signInSuccess = signIns.filter(s => s.status.errorCode === 0).length;
      const signInFailure = signIns.filter(s => s.status.errorCode !== 0).length;

      // App usage aggregation
      const appUsageMap = new Map<string, number>();
      signIns.forEach(s => {
        const count = appUsageMap.get(s.appDisplayName) || 0;
        appUsageMap.set(s.appDisplayName, count + 1);
      });
      const appUsage = Array.from(appUsageMap.entries())
        .map(([appName, count]) => ({ appName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Sign-in trend (last 7 days)
      const trendMap = new Map<string, { success: number; failure: number }>();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();

      last7Days.forEach(date => {
        trendMap.set(date, { success: 0, failure: 0 });
      });

      signIns.forEach(s => {
        const date = s.createdDateTime.split("T")[0];
        if (trendMap.has(date)) {
          const current = trendMap.get(date)!;
          if (s.status.errorCode === 0) {
            current.success++;
          } else {
            current.failure++;
          }
        }
      });

      const signInTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      return {
        totalUsers: usersResult?.["@odata.count"] || usersResult?.value?.length || 0,
        totalApps: appsResult?.["@odata.count"] || appsResult?.value?.length || 0,
        signInSuccess,
        signInFailure,
        recentSignIns: signIns.slice(0, 10),
        appUsage,
        signInTrend,
      };
    } finally {
      setLoading(false);
    }
  }, [callGraph]);

  return {
    loading,
    error,
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    getAppRegistrations,
    createAppSecret,
    deleteAppSecret,
    getDashboardMetrics,
  };
};
