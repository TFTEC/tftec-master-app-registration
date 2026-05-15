import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { msalConfig } from "@/config/msal";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Users from "./pages/Users";
import AppRegistrations from "./pages/AppRegistrations";
import TokenValidation from "./pages/TokenValidation";
import OboFlow from "./pages/OboFlow";
import ClientCredentials from "./pages/ClientCredentials";
import Settings from "./pages/Settings";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import LabHub from "./pages/lab/Hub";
import LabDemo from "./pages/lab/Demo";
import LabTokens from "./pages/lab/Tokens";
import LabFlows from "./pages/lab/Flows";
import LabTopologias from "./pages/lab/Topologias";
import LabPermissionsClaims from "./pages/lab/PermissionsClaims";
import LabCredenciais from "./pages/lab/Credenciais";
import LabMultiApp from "./pages/lab/MultiApp";
import LabProtocolos from "./pages/lab/Protocolos";
import LabRecipes from "./pages/lab/Recipes";
import LabComingSoon from "./pages/lab/ComingSoon";

const queryClient = new QueryClient();
const msalInstance = new PublicClientApplication(msalConfig);

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="min-h-screen flex w-full bg-grid">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  </SidebarProvider>
);

const App = () => (
  <MsalProvider instance={msalInstance}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout><Index /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute>
                  <AppLayout><Users /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/apps" element={
                <ProtectedRoute>
                  <AppLayout><AppRegistrations /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/validate" element={
                <ProtectedRoute>
                  <AppLayout><TokenValidation /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/obo" element={
                <ProtectedRoute>
                  <AppLayout><OboFlow /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/client-credentials" element={
                <ProtectedRoute>
                  <AppLayout><ClientCredentials /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <AppLayout><Settings /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/docs" element={
                <ProtectedRoute>
                  <AppLayout><Documentation /></AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/lab" element={<ProtectedRoute><AppLayout><LabHub /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/recipes" element={<ProtectedRoute><AppLayout><LabRecipes /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/demo" element={<ProtectedRoute><AppLayout><LabDemo /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/tokens" element={<ProtectedRoute><AppLayout><LabTokens /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/fluxos" element={<ProtectedRoute><AppLayout><LabFlows /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/protocolos" element={<ProtectedRoute><AppLayout><LabProtocolos /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/multi-app" element={<ProtectedRoute><AppLayout><LabMultiApp /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/credenciais" element={<ProtectedRoute><AppLayout><LabCredenciais /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/permissions-claims" element={<ProtectedRoute><AppLayout><LabPermissionsClaims /></AppLayout></ProtectedRoute>} />
              <Route path="/lab/topologias" element={<ProtectedRoute><AppLayout><LabTopologias /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </MsalProvider>
);

export default App;
