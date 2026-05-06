import { useEffect, useState } from "react";
import { AppWindow, Plus, Key, Trash2, RefreshCw, Search, Copy, Eye, EyeOff, Loader2, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useGraphApi, AppRegistration, PasswordCredential } from "@/hooks/useGraphApi";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const AppRegistrations = () => {
  const { getAppRegistrations, createAppSecret, deleteAppSecret, loading, error } = useGraphApi();
  const { toast } = useToast();
  
  const [apps, setApps] = useState<AppRegistration[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<AppRegistration | null>(null);
  const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false);
  const [isDeleteSecretDialogOpen, setIsDeleteSecretDialogOpen] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<PasswordCredential | null>(null);
  const [newSecretName, setNewSecretName] = useState("");
  const [newSecretExpiry, setNewSecretExpiry] = useState("12");
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const loadApps = async () => {
    try {
      const data = await getAppRegistrations();
      setApps(data);
    } catch (err) {
      toast({
        title: "Erro ao carregar aplicações",
        description: error || "Não foi possível carregar a lista de App Registrations",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const filteredApps = apps.filter(app =>
    app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.appId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSecret = async () => {
    if (!selectedApp) return;
    try {
      const result = await createAppSecret(selectedApp.id, newSecretName, parseInt(newSecretExpiry));
      if (result) {
        setCreatedSecret(result.secretText);
        toast({
          title: "Secret criada",
          description: "A secret foi criada com sucesso. Copie-a agora, pois não será exibida novamente.",
        });
        loadApps();
      }
    } catch (err) {
      toast({
        title: "Erro ao criar secret",
        description: error || "Não foi possível criar a secret",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSecret = async () => {
    if (!selectedApp || !selectedSecret) return;
    try {
      await deleteAppSecret(selectedApp.id, selectedSecret.keyId);
      toast({
        title: "Secret removida",
        description: "A secret foi removida com sucesso",
      });
      setIsDeleteSecretDialogOpen(false);
      setSelectedSecret(null);
      loadApps();
    } catch (err) {
      toast({
        title: "Erro ao remover secret",
        description: error || "Não foi possível remover a secret",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Valor copiado para a área de transferência",
    });
  };

  const openSecretDialog = (app: AppRegistration) => {
    setSelectedApp(app);
    setNewSecretName("");
    setNewSecretExpiry("12");
    setCreatedSecret(null);
    setShowSecret(false);
    setIsSecretDialogOpen(true);
  };

  const openDeleteSecretDialog = (app: AppRegistration, secret: PasswordCredential) => {
    setSelectedApp(app);
    setSelectedSecret(secret);
    setIsDeleteSecretDialogOpen(true);
  };

  const getSecretStatus = (endDateTime: string) => {
    const daysUntilExpiry = differenceInDays(parseISO(endDateTime), new Date());
    if (daysUntilExpiry < 0) return { status: "expired", label: "Expirada", variant: "destructive" as const };
    if (daysUntilExpiry < 30) return { status: "expiring", label: `${daysUntilExpiry}d`, variant: "secondary" as const };
    return { status: "valid", label: `${daysUntilExpiry}d`, variant: "default" as const };
  };

  const totalSecrets = apps.reduce((acc, app) => acc + app.passwordCredentials.length, 0);
  const expiringSecrets = apps.reduce((acc, app) => 
    acc + app.passwordCredentials.filter(s => {
      const days = differenceInDays(parseISO(s.endDateTime), new Date());
      return days >= 0 && days < 30;
    }).length, 0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">App Registrations</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie aplicações e suas secrets no Microsoft Entra ID
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadApps} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Apps</p>
                <p className="text-3xl font-bold">{apps.length}</p>
              </div>
              <AppWindow className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Secrets</p>
                <p className="text-3xl font-bold">{totalSecrets}</p>
              </div>
              <Key className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expirando em 30 dias</p>
                <p className="text-3xl font-bold text-warning">{expiringSecrets}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou App ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Apps List */}
      {loading && apps.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {filteredApps.map((app) => (
            <AccordionItem key={app.id} value={app.id} className="glass-card border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <AppWindow className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{app.displayName}</p>
                      <p className="text-xs text-muted-foreground font-mono">{app.appId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{app.signInAudience}</Badge>
                    <Badge variant="secondary">{app.passwordCredentials.length} secrets</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span>Criado em: </span>
                      <span className="text-foreground">
                        {format(parseISO(app.createdDateTime), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <Button size="sm" onClick={() => openSecretDialog(app)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Secret
                    </Button>
                  </div>

                  {app.passwordCredentials.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Hint</TableHead>
                          <TableHead>Expira em</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {app.passwordCredentials.map((secret) => {
                          const secretStatus = getSecretStatus(secret.endDateTime);
                          return (
                            <TableRow key={secret.keyId}>
                              <TableCell className="font-medium">
                                {secret.displayName || "Sem nome"}
                              </TableCell>
                              <TableCell className="font-mono text-muted-foreground">
                                {secret.hint}***
                              </TableCell>
                              <TableCell>
                                {format(parseISO(secret.endDateTime), "dd/MM/yyyy", { locale: ptBR })}
                              </TableCell>
                              <TableCell>
                                <Badge variant={secretStatus.variant}>
                                  {secretStatus.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeleteSecretDialog(app, secret)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground border rounded-lg bg-secondary/20">
                      <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma secret configurada</p>
                      <p className="text-xs">Crie uma nova secret para esta aplicação</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {filteredApps.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <AppWindow className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma aplicação encontrada</p>
        </div>
      )}

      {/* Create Secret Dialog */}
      <Dialog open={isSecretDialogOpen} onOpenChange={setIsSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Secret</DialogTitle>
            <DialogDescription>
              Crie uma nova secret para <strong>{selectedApp?.displayName}</strong>
            </DialogDescription>
          </DialogHeader>
          
          {createdSecret ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <p className="text-sm font-medium text-success mb-2">Secret criada com sucesso!</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Copie esta secret agora. Ela não será exibida novamente.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type={showSecret ? "text" : "password"}
                    value={createdSecret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(createdSecret)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="secretName">Nome da Secret</Label>
                <Input
                  id="secretName"
                  value={newSecretName}
                  onChange={(e) => setNewSecretName(e.target.value)}
                  placeholder="Ex: Produção, Desenvolvimento..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretExpiry">Validade</Label>
                <Select value={newSecretExpiry} onValueChange={setNewSecretExpiry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 meses</SelectItem>
                    <SelectItem value="12">12 meses</SelectItem>
                    <SelectItem value="24">24 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSecretDialogOpen(false)}>
              {createdSecret ? "Fechar" : "Cancelar"}
            </Button>
            {!createdSecret && (
              <Button onClick={handleCreateSecret} disabled={loading || !newSecretName}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Secret
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Secret Confirmation */}
      <Dialog open={isDeleteSecretDialogOpen} onOpenChange={setIsDeleteSecretDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a secret <strong>{selectedSecret?.displayName || "sem nome"}</strong>?
              Aplicações que usam esta secret deixarão de funcionar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteSecretDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteSecret} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppRegistrations;
