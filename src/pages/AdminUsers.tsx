import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Shield, User } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
      return;
    }
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => r.role) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdminRole = async (userId: string, currentRoles: string[]) => {
    try {
      const isCurrentlyAdmin = currentRoles.includes('admin');

      if (isCurrentlyAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;
      }

      await loadUsers();
      toast({
        title: "Sucesso",
        description: `Permissões atualizadas com sucesso`,
      });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as permissões",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (adminLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Gerenciar Usuários</h1>
            <p className="text-muted-foreground">Todos os usuários cadastrados na plataforma</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Nenhum usuário cadastrado</CardTitle>
              <CardDescription>
                Os usuários aparecerão aqui quando se cadastrarem
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Usuários Cadastrados ({users.length})</CardTitle>
              <CardDescription>
                Gerencie permissões e visualize informações dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data de Cadastro</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.display_name || 'Usuário'}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                          <span>{user.display_name || 'Usuário sem nome'}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        {user.roles.includes('admin') ? (
                          <Badge variant="default">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <User className="h-3 w-3 mr-1" />
                            Usuário
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={user.roles.includes('admin') ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdminRole(user.id, user.roles)}
                        >
                          {user.roles.includes('admin') ? 'Remover Admin' : 'Tornar Admin'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
