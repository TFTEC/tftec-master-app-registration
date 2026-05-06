import { useEffect, useState } from "react";
import { 
  Activity, 
  Users, 
  AppWindow, 
  TrendingUp, 
  TrendingDown,
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Clock,
  MapPin,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGraphApi, DashboardMetrics, SignInLog } from "@/hooks/useGraphApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const CHART_COLORS = {
  success: "hsl(var(--success))",
  failure: "hsl(var(--destructive))",
  primary: "hsl(var(--primary))",
  accent: "hsl(var(--accent))",
};

const Index = () => {
  const { user } = useAuth();
  const { getDashboardMetrics, loading, error } = useGraphApi();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadMetrics = async () => {
    try {
      const data = await getDashboardMetrics();
      setMetrics(data);
      setLastRefresh(new Date());
    } catch (err) {
      toast({
        title: "Erro ao carregar métricas",
        description: error || "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const successRate = metrics 
    ? Math.round((metrics.signInSuccess / (metrics.signInSuccess + metrics.signInFailure || 1)) * 100)
    : 0;

  const pieData = metrics ? [
    { name: "Sucesso", value: metrics.signInSuccess },
    { name: "Falha", value: metrics.signInFailure },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo, {user?.name || "Administrador"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Atualizado: {format(lastRefresh, "HH:mm:ss")}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={loadMetrics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando métricas do tenant...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Usuários</p>
                    <p className="text-3xl font-bold">{metrics?.totalUsers || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">No tenant</p>
                  </div>
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">App Registrations</p>
                    <p className="text-3xl font-bold">{metrics?.totalApps || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Configurados</p>
                  </div>
                  <div className="p-3 rounded-xl bg-accent/20">
                    <AppWindow className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Login com Sucesso</p>
                    <p className="text-3xl font-bold text-success">{metrics?.signInSuccess || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      <p className="text-xs text-success">{successRate}% taxa</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-success/20">
                    <CheckCircle2 className="w-6 h-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Login com Falha</p>
                    <p className="text-3xl font-bold text-destructive">{metrics?.signInFailure || 0}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingDown className="w-3 h-3 text-destructive" />
                      <p className="text-xs text-destructive">{100 - successRate}% taxa</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-destructive/20">
                    <XCircle className="w-6 h-6 text-destructive" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sign-in Trend */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Tendência de Sign-ins</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics?.signInTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => format(parseISO(value), "dd/MM")}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        labelFormatter={(value) => format(parseISO(value as string), "dd/MM/yyyy")}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="success" 
                        stackId="1"
                        stroke={CHART_COLORS.success}
                        fill={CHART_COLORS.success}
                        fillOpacity={0.6}
                        name="Sucesso"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="failure" 
                        stackId="1"
                        stroke={CHART_COLORS.failure}
                        fill={CHART_COLORS.failure}
                        fillOpacity={0.6}
                        name="Falha"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* App Usage */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Uso por Aplicação</CardTitle>
                <CardDescription>Top apps por sign-ins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics?.appUsage?.slice(0, 5) || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                      <YAxis 
                        type="category" 
                        dataKey="appName" 
                        stroke="hsl(var(--muted-foreground))" 
                        tick={{ fontSize: 11 }}
                        width={120}
                        tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + "..." : value}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill={CHART_COLORS.primary}
                        radius={[0, 4, 4, 0]}
                        name="Sign-ins"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Rate Pie + Recent Sign-ins */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Success Rate Pie */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Taxa de Sucesso</CardTitle>
                <CardDescription>Proporção de logins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill={CHART_COLORS.success} />
                        <Cell fill={CHART_COLORS.failure} />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <span className="text-sm">Sucesso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <span className="text-sm">Falha</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Sign-ins */}
            <Card className="glass-card lg:col-span-2">
              <CardHeader>
                <CardTitle>Sign-ins Recentes</CardTitle>
                <CardDescription>Últimos logins no tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-auto">
                  {metrics?.recentSignIns?.slice(0, 8).map((signIn) => (
                    <div 
                      key={signIn.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {signIn.status.errorCode === 0 ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{signIn.userDisplayName}</p>
                          <p className="text-xs text-muted-foreground">{signIn.appDisplayName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(parseISO(signIn.createdDateTime), "HH:mm", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {signIn.location?.city || "Desconhecido"}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!metrics?.recentSignIns || metrics.recentSignIns.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum sign-in recente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
