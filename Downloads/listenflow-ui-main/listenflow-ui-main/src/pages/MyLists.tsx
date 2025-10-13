import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Trash2, Edit2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUserLists } from '@/hooks/useUserLists';
import { useAuth } from '@/hooks/useAuth';
import { useUserStatus } from '@/hooks/useUserStatus';
import { AccessDenied } from '@/components/AccessDenied';

export default function MyLists() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lists, loading, createList, updateList, deleteList } = useUserLists();
  const { isApproved, isPending, isRejected, loading: statusLoading } = useUserStatus();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleCreateList = async () => {
    if (!formData.name.trim()) return;
    
    await createList(formData.name, formData.description);
    setFormData({ name: '', description: '' });
    setCreateDialogOpen(false);
  };

  const handleEditList = async () => {
    if (!selectedList || !formData.name.trim()) return;
    
    await updateList(selectedList.id, formData.name, formData.description);
    setFormData({ name: '', description: '' });
    setEditDialogOpen(false);
    setSelectedList(null);
  };

  const handleDeleteList = async () => {
    if (!selectedList) return;
    
    await deleteList(selectedList.id);
    setDeleteDialogOpen(false);
    setSelectedList(null);
  };

  const openEditDialog = (list: any) => {
    setSelectedList(list);
    setFormData({
      name: list.name,
      description: list.description || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (list: any) => {
    setSelectedList(list);
    setDeleteDialogOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Faça login para ver suas coleções</h1>
            <Button onClick={() => navigate('/auth')}>Fazer Login</Button>
          </div>
        </main>
      </div>
    );
  }

  // SEGURANÇA: Bloquear acesso de usuários não aprovados
  if (!statusLoading && (isPending || isRejected)) {
    return <AccessDenied status={isPending ? 'pending' : 'rejected'} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Minhas Coleções</h1>
            <p className="text-muted-foreground">
              Organize seus audiobooks em coleções personalizadas
            </p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Coleção
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Coleção</DialogTitle>
                <DialogDescription>
                  Dê um nome e descrição para sua coleção
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nome da Coleção</Label>
                  <Input
                    id="create-name"
                    placeholder="Ex: Livros para ler este mês"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-description">Descrição (opcional)</Label>
                  <Textarea
                    id="create-description"
                    placeholder="Adicione uma descrição..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateList}
                  disabled={!formData.name.trim()}
                >
                  Criar Coleção
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando coleções...</p>
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma coleção ainda</h2>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira coleção para organizar seus audiobooks
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Coleção
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{list.name}</CardTitle>
                      {list.description && (
                        <CardDescription>{list.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(list)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(list)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {list.items_count || 0} audiobook(s)
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/lists/${list.id}`)}
                  >
                    Ver Coleção
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Coleção</DialogTitle>
              <DialogDescription>
                Atualize o nome e descrição da coleção
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome da Coleção</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição (opcional)</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleEditList}
                disabled={!formData.name.trim()}
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Coleção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta coleção? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteList}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
