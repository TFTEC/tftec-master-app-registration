import {
  LayoutDashboard,
  Shield,
  Users,
  Settings,
  BookOpen,
  Menu,
  ChevronLeft,
  AppWindow,
  LogOut,
  Beaker,
  PlayCircle,
  Code2,
  Workflow,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Usuários", url: "/users", icon: Users },
  { title: "App Registrations", url: "/apps", icon: AppWindow },
];

// Laboratório — apenas módulos LIVE.
// Roadmap dos próximos (Protocolos, Multi-App, Credenciais, Permissions, Topologias)
// está documentado em docs/aula/lab-modules-roadmap.md.
const labItems = [
  { title: "Hub do Lab", url: "/lab", icon: Beaker },
  { title: "Demo Interativa", url: "/lab/demo", icon: PlayCircle },
  { title: "Tokens & JWT", url: "/lab/tokens", icon: Code2 },
  { title: "Fluxos OAuth", url: "/lab/fluxos", icon: Workflow },
];

// Ferramentas — só Validar Token (OBO e Client Credentials redundantes
// com /lab/demo cenário equivalente; rotas existem ainda mas não no menu).
const toolItems = [
  { title: "Validar Token", url: "/validate", icon: Shield },
];

const configItems = [
  { title: "Configurações", url: "/settings", icon: Settings },
  { title: "Documentação", url: "/docs", icon: BookOpen },
];

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const collapsed = state === "collapsed";

  const userInitials = user?.name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "U";

  return (
    <Sidebar 
      className={cn(
        "border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-foreground">AuthService</h1>
                <p className="text-xs text-muted-foreground">Admin Console</p>
              </div>
            </div>
          )}
          <SidebarTrigger className="text-muted-foreground hover:text-foreground">
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </SidebarTrigger>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={cn("text-muted-foreground text-xs uppercase tracking-wider mb-2", collapsed && "sr-only")}>
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={cn(
                        "nav-link",
                        location.pathname === item.url && "active"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={cn("text-muted-foreground text-xs uppercase tracking-wider mb-2", collapsed && "sr-only")}>
            Laboratório
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {labItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/lab"}
                      className={cn(
                        "nav-link",
                        location.pathname === item.url && "active"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={cn("text-muted-foreground text-xs uppercase tracking-wider mb-2", collapsed && "sr-only")}>
            Ferramentas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={cn(
                        "nav-link",
                        location.pathname === item.url && "active"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={cn("text-muted-foreground text-xs uppercase tracking-wider mb-2", collapsed && "sr-only")}>
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={cn(
                        "nav-link",
                        location.pathname === item.url && "active"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("p-4 border-t border-sidebar-border", collapsed && "p-2")}>
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.username}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
