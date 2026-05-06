import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { AccountInfo, InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "@/config/msal";

interface AuthContextType {
  user: AccountInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<AccountInfo | null>(null);

  useEffect(() => {
    if (accounts.length > 0) {
      setUser(accounts[0]);
    } else {
      setUser(null);
    }
  }, [accounts]);

  const login = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    instance.logoutRedirect({
      postLogoutRedirectUri: window.location.origin,
    });
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (accounts.length === 0) return null;

    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: accounts[0],
      });
      return response.accessToken;
    } catch (error) {
      console.error("Token acquisition failed:", error);
      // Try interactive if silent fails
      try {
        const response = await instance.acquireTokenRedirect(loginRequest);
        return null; // Will redirect, so return null
      } catch (interactiveError) {
        console.error("Interactive token acquisition failed:", interactiveError);
        return null;
      }
    }
  };

  const isLoading = inProgress !== InteractionStatus.None;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
