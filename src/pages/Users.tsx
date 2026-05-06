import { useEffect, useState } from "react";
import { Users as UsersIcon, Plus, Pencil, Trash2, RefreshCw, Search, UserCheck, UserX, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGraphApi, GraphUser } from "@/hooks/useGraphApi";
import { useAuth } from "@/contexts/AuthContext";

const Users = () => {
  const { user: currentUser } = useAuth();
  const { getUsers, createUser, updateUser, deleteUser, loading, error } = useGraphApi();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<GraphUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<GraphUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    displayName: "",
    userPrincipalName: "",
    mailNickname: "",
    password: "",
    accountEnabled: true,
  });

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      toast({
        title: "Erro ao carregar usuários",
        description: error || "Não foi possível carregar a lista de usuários",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userPrincipalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.mail && user.mail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateUser = async () => {
    try {
      await createUser(formData);
      toast({
        title: "Usuário criado",
        description: `${formData.displayName} foi criado com sucesso`,
      });
      setIsCreateDialogOpen(false);
      setFormData({ displayName: "", userPrincipalName: "", mailNickname: "", password: "", accountEnabled: true });
      loadUsers();
    } catch (err) {
      toast({
        title: "Erro ao criar usuário",
        description: error || "Não foi possível criar o usuário",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    try {
      await updateUser(selectedUser.id, {
        displayName: formData.displayName,
        accountEnabled: formData.accountEnabled,
      });
      toast({
        title: "Usuário atualizado",
        description: `${formData.displayName} foi atualizado com sucesso`,
      });
      setIsEditDialogOpen(false);
      loadUsers();
    } catch (err) {
      toast({
        title: "Erro ao atualizar usuário",
        description: error || "Não foi possível atualizar o usuário",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await deleteUser(selectedUser.id);
      toast({
        title: "Usuário removido",
        description: `${selectedUser.displayName} foi removido com sucesso`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      toast({
        title: "Erro ao remover usuário",
        description: error || "Não foi possível remover o usuário",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: GraphUser) => {
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName,
      userPrincipalName: user.userPrincipalName,
      mailNickname: "",
      password: "",
      accountEnabled: user.accountEnabled,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: GraphUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  // Get tenant domain from current user
  const tenantDomain = currentUser?.username?.split("@")[1] || "seudominio.onmicrosoft.com";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários do seu tenant Microsoft Entra ID
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário ao seu tenant Entra ID
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mailNickname">Nome de Usuário (mail nickname)</Label>
                  <Input
                    id="mailNickname"
                    value={formData.mailNickname}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      mailNickname: e.target.value,
                      userPrincipalName: `${e.target.value}@${tenantDomain}`
                    })}
                    placeholder="joao.silva"
                  />
                  <p className="text-xs text-muted-foreground">
                    UPN: {formData.mailNickname ? `${formData.mailNickname}@${tenantDomain}` : "..."}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha Temporária</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Senha forte..."
                  />
                  <p className="text-xs text-muted-foreground">
                    O usuário será solicitado a alterar a senha no primeiro login
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="accountEnabled">Conta Ativa</Label>
                  <Switch
                    id="accountEnabled"
                    checked={formData.accountEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, accountEnabled: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateUser} disabled={loading || !formData.displayName || !formData.mailNickname || !formData.password}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Criar Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                <p className="text-3xl font-bold text-success">{users.filter(u => u.accountEnabled).length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Usuários Inativos</p>
                <p className="text-3xl font-bold text-destructive">{users.filter(u => !u.accountEnabled).length}</p>
              </div>
              <UserX className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários do Tenant</CardTitle>
              <CardDescription>Lista de todos os usuários do Microsoft Entra ID</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email/UPN</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{user.mail || user.userPrincipalName}</TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={user.accountEnabled ? "default" : "secondary"}>
                        {user.accountEnabled ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(user)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Nome de Exibição</Label>
              <Input
                id="editDisplayName"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="editAccountEnabled">Conta Ativa</Label>
              <Switch
                id="editAccountEnabled"
                checked={formData.accountEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, accountEnabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{selectedUser?.displayName}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
