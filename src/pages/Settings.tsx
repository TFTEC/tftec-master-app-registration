import { useState } from "react";
import { Settings as SettingsIcon, Save, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AZURE_CONFIG, INTERNAL_JWT_CONFIG, DOWNSTREAM_APIS, AUTHSERVICE_API_URL } from "@/config/azure";

const Settings = () => {
  const [showSecret, setShowSecret] = useState(false);
  const [showSigningKey, setShowSigningKey] = useState(false);
  const { toast } = useToast();

  // Pre-populate with real tenant data
  const [azureConfig, setAzureConfig] = useState({
    instance: AZURE_CONFIG.instance,
    tenantId: AZURE_CONFIG.tenantId,
    clientId: AZURE_CONFIG.clientId,
    clientSecret: "", // Never expose secrets
    audience: AZURE_CONFIG.audience,
  });

  const [internalJwt, setInternalJwt] = useState({
    issuer: INTERNAL_JWT_CONFIG.issuer,
    audience: INTERNAL_JWT_CONFIG.audience,
    signingKey: "", // Never expose secrets
    expiryMinutes: INTERNAL_JWT_CONFIG.expiryMinutes.toString(),
  });

  const [allowedTenants, setAllowedTenants] = useState({
    allowAll: true,
    tenantIds: [""],
  });

  const [downstreamApis, setDownstreamApis] = useState([
    { 
      name: DOWNSTREAM_APIS.ApiA.name, 
      baseUrl: DOWNSTREAM_APIS.ApiA.baseUrl, 
      scopes: DOWNSTREAM_APIS.ApiA.scopes.join(", "), 
      clientId: DOWNSTREAM_APIS.ApiA.clientId 
    },
    { 
      name: DOWNSTREAM_APIS.ApiB.name, 
      baseUrl: DOWNSTREAM_APIS.ApiB.baseUrl, 
      scopes: DOWNSTREAM_APIS.ApiB.scopes.join(", "), 
      clientId: DOWNSTREAM_APIS.ApiB.clientId 
    },
  ]);

  const addTenant = () => {
    setAllowedTenants({
      ...allowedTenants,
      tenantIds: [...allowedTenants.tenantIds, ""],
    });
  };

  const removeTenant = (index: number) => {
    setAllowedTenants({
      ...allowedTenants,
      tenantIds: allowedTenants.tenantIds.filter((_, i) => i !== index),
    });
  };

  const addApi = () => {
    setDownstreamApis([
      ...downstreamApis,
      { name: "", baseUrl: "", scopes: "", clientId: "" },
    ]);
  };

  const removeApi = (index: number) => {
    setDownstreamApis(downstreamApis.filter((_, i) => i !== index));
  };

  const saveConfig = () => {
    toast({
      title: "Configuração salva!",
      description: "As alterações foram aplicadas (simulação)",
    });
  };

  const generateEnvVars = () => {
    const envVars = `# Azure AD
AzureAd__Instance=${azureConfig.instance}
AzureAd__TenantId=${azureConfig.tenantId}
AzureAd__ClientId=${azureConfig.clientId}
AzureAd__ClientSecret=${azureConfig.clientSecret}
AzureAd__Audience=${azureConfig.audience}

# Allowed Tenants
AllowedTenants__AllowAll=${allowedTenants.allowAll}
${allowedTenants.tenantIds.map((t, i) => `AllowedTenants__TenantIds__${i}=${t}`).join("\n")}

# Internal JWT
InternalJwt__Issuer=${internalJwt.issuer}
InternalJwt__Audience=${internalJwt.audience}
InternalJwt__SigningKey=${internalJwt.signingKey}
InternalJwt__ExpiryMinutes=${internalJwt.expiryMinutes}

# Downstream APIs
${downstreamApis.map((api, i) => `DownstreamApis__Apis__${api.name}__BaseUrl=${api.baseUrl}
DownstreamApis__Apis__${api.name}__Scopes__0=${api.scopes}
DownstreamApis__Apis__${api.name}__ClientId=${api.clientId}`).join("\n")}`;

    navigator.clipboard.writeText(envVars);
    toast({
      title: "Variáveis copiadas!",
      description: "ENV vars copiadas para a área de transferência",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure o AuthService para seu ambiente
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateEnvVars}>
            Copiar ENV Vars
          </Button>
          <Button onClick={saveConfig} className="btn-azure">
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="azure" className="space-y-4">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="azure">Azure AD</TabsTrigger>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="jwt">Token Interno</TabsTrigger>
          <TabsTrigger value="apis">APIs Downstream</TabsTrigger>
        </TabsList>

        <TabsContent value="azure">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Configuração Azure AD / Entra ID</CardTitle>
              <CardDescription>Parâmetros de autenticação com Microsoft Entra ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instance URL</Label>
                  <Input 
                    value={azureConfig.instance}
                    onChange={(e) => setAzureConfig({ ...azureConfig, instance: e.target.value })}
                    className="input-azure"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tenant ID</Label>
                  <Input 
                    value={azureConfig.tenantId}
                    onChange={(e) => setAzureConfig({ ...azureConfig, tenantId: e.target.value })}
                    placeholder="common, organizations ou GUID"
                    className="input-azure"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client ID (Application ID)</Label>
                  <Input 
                    value={azureConfig.clientId}
                    onChange={(e) => setAzureConfig({ ...azureConfig, clientId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="input-azure font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Client Secret</Label>
                    <Button variant="ghost" size="sm" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Input 
                    type={showSecret ? "text" : "password"}
                    value={azureConfig.clientSecret}
                    onChange={(e) => setAzureConfig({ ...azureConfig, clientSecret: e.target.value })}
                    className="input-azure"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Audience</Label>
                  <Input 
                    value={azureConfig.audience}
                    onChange={(e) => setAzureConfig({ ...azureConfig, audience: e.target.value })}
                    placeholder="api://seu-client-id"
                    className="input-azure"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Tenants Permitidos</CardTitle>
              <CardDescription>Configure quais tenants podem autenticar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <Label>Permitir todos os tenants</Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ativado, qualquer tenant do Azure AD pode autenticar
                  </p>
                </div>
                <Switch 
                  checked={allowedTenants.allowAll}
                  onCheckedChange={(checked) => setAllowedTenants({ ...allowedTenants, allowAll: checked })}
                />
              </div>

              {!allowedTenants.allowAll && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Whitelist de Tenants</Label>
                    <Button variant="ghost" size="sm" onClick={addTenant}>
                      <Plus className="w-4 h-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  {allowedTenants.tenantIds.map((tenant, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="tenant-guid-xxxx-xxxx"
                        value={tenant}
                        onChange={(e) => {
                          const newTenants = [...allowedTenants.tenantIds];
                          newTenants[index] = e.target.value;
                          setAllowedTenants({ ...allowedTenants, tenantIds: newTenants });
                        }}
                        className="input-azure font-mono"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeTenant(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jwt">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Token Interno (Modelo 2)</CardTitle>
              <CardDescription>Configuração do JWT emitido pelo AuthService</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issuer</Label>
                  <Input 
                    value={internalJwt.issuer}
                    onChange={(e) => setInternalJwt({ ...internalJwt, issuer: e.target.value })}
                    className="input-azure"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Input 
                    value={internalJwt.audience}
                    onChange={(e) => setInternalJwt({ ...internalJwt, audience: e.target.value })}
                    className="input-azure"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Signing Key (Base64)</Label>
                    <Button variant="ghost" size="sm" onClick={() => setShowSigningKey(!showSigningKey)}>
                      {showSigningKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Input 
                    type={showSigningKey ? "text" : "password"}
                    value={internalJwt.signingKey}
                    onChange={(e) => setInternalJwt({ ...internalJwt, signingKey: e.target.value })}
                    placeholder="Mínimo 32 bytes (256 bits)"
                    className="input-azure"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expiração (minutos)</Label>
                  <Input 
                    type="number"
                    value={internalJwt.expiryMinutes}
                    onChange={(e) => setInternalJwt({ ...internalJwt, expiryMinutes: e.target.value })}
                    className="input-azure"
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Dica:</strong> Gere uma chave segura com: <code>openssl rand -base64 32</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apis">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>APIs Downstream</CardTitle>
                  <CardDescription>Configure as APIs para OBO e Client Credentials</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={addApi}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar API
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {downstreamApis.map((api, index) => (
                <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">API #{index + 1}</h4>
                    <Button variant="ghost" size="sm" onClick={() => removeApi(index)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input 
                        value={api.name}
                        onChange={(e) => {
                          const newApis = [...downstreamApis];
                          newApis[index].name = e.target.value;
                          setDownstreamApis(newApis);
                        }}
                        placeholder="ApiA"
                        className="input-azure"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Base URL</Label>
                      <Input 
                        value={api.baseUrl}
                        onChange={(e) => {
                          const newApis = [...downstreamApis];
                          newApis[index].baseUrl = e.target.value;
                          setDownstreamApis(newApis);
                        }}
                        placeholder="https://api.example.com"
                        className="input-azure"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Scopes</Label>
                      <Input 
                        value={api.scopes}
                        onChange={(e) => {
                          const newApis = [...downstreamApis];
                          newApis[index].scopes = e.target.value;
                          setDownstreamApis(newApis);
                        }}
                        placeholder="api://client-id/.default"
                        className="input-azure"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input 
                        value={api.clientId}
                        onChange={(e) => {
                          const newApis = [...downstreamApis];
                          newApis[index].clientId = e.target.value;
                          setDownstreamApis(newApis);
                        }}
                        placeholder="xxxxxxxx-xxxx-xxxx"
                        className="input-azure font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
