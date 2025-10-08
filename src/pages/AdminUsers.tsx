import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, ArrowLeft, Mail, Calendar, Shield } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  status: string;
}

interface UserWithRole extends Profile {
  email?: string;
  isAdmin: boolean;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with role information
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => ({
        ...profile,
        isAdmin: roles?.some(r => r.user_id === profile.id && r.role === 'admin') || false
      }));

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

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso`,
      });

      loadUsers();
    } catch (error: any) {
      console.error("Error updating user status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do usuário",
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
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold">Gerenciar Usuários</h1>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-sm text-muted-foreground">Total de usuários</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">
                {users.filter(u => u.status === 'pending').length}
              </div>
              <p className="text-sm text-muted-foreground">Aguardando aprovação</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">
                {users.filter(u => u.status === 'approved').length}
              </div>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">Nenhum usuário cadastrado</CardTitle>
              <CardDescription>
                Os usuários cadastrados aparecerão aqui
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <CardTitle className="text-xl">
                          {user.display_name || 'Sem nome'}
                        </CardTitle>
                        {user.isAdmin && (
                          <Badge variant="default" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                        <Badge 
                          variant={
                            user.status === 'approved' ? 'default' : 
                            user.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }
                        >
                          {user.status === 'approved' ? 'Aprovado' : 
                           user.status === 'pending' ? 'Pendente' : 
                           'Rejeitado'}
                        </Badge>
                      </div>
                      <CardDescription className="space-y-1">
                        {user.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Cadastrado em {formatDate(user.created_at)}</span>
                        </div>
                      </CardDescription>
                      {user.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateUserStatus(user.id, 'approved')}
                          >
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateUserStatus(user.id, 'rejected')}
                          >
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                    {user.avatar_url && (
                      <img 
                        src={user.avatar_url} 
                        alt={user.display_name || 'Avatar'} 
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
