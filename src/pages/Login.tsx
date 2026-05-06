import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Processando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-grid p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gradient">
              AuthService Console
            </CardTitle>
            <CardDescription className="mt-2">
              Gateway de Autenticação com Microsoft Entra ID
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <h3 className="font-medium text-sm mb-2">Funcionalidades disponíveis:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Dashboard com métricas de acesso</li>
                <li>• Gerenciamento de usuários do tenant</li>
                <li>• Gestão de App Registrations</li>
                <li>• Criação de secrets para aplicações</li>
                <li>• Testes de fluxos OBO e Client Credentials</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={handleLogin} 
            className="w-full h-12 text-base gap-3"
            size="lg"
          >
            <LogIn className="w-5 h-5" />
            Entrar com Microsoft
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Você será redirecionado para o Microsoft Entra ID para autenticação segura.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
