import { useState } from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserLists } from '@/hooks/useUserLists';
import { Separator } from '@/components/ui/separator';

interface AddToListDialogProps {
  audiobookId: string;
  trigger?: React.ReactNode;
}

export const AddToListDialog = ({ audiobookId, trigger }: AddToListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const { lists, loading, createList, addToList } = useUserLists();

  const handleAddToList = async (listId: string) => {
    const success = await addToList(listId, audiobookId);
    if (success) {
      setOpen(false);
    }
  };

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return;

    const newList = await createList(newListName, newListDescription);
    if (newList) {
      await addToList(newList.id, audiobookId);
      setNewListName('');
      setNewListDescription('');
      setShowCreateForm(false);
      setOpen(false);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={handleTriggerClick}>
          {trigger}
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={handleTriggerClick}>
          <FolderPlus className="w-4 h-4 mr-2" />
          Adicionar à Coleção
        </Button>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Coleção</DialogTitle>
          <DialogDescription>
            Escolha uma coleção existente ou crie uma nova
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!showCreateForm ? (
            <>
              <ScrollArea className="h-[200px] rounded-md border p-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground p-2">Carregando...</p>
                ) : lists.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    Você ainda não tem coleções
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lists.map((list) => (
                      <Button
                        key={list.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleAddToList(list.id)}
                      >
                        <div className="text-left">
                          <p className="font-medium">{list.name}</p>
                          {list.description && (
                            <p className="text-xs text-muted-foreground">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Coleção
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="list-name">Nome da Coleção</Label>
                <Input
                  id="list-name"
                  placeholder="Ex: Livros para ler este mês"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="list-description">Descrição (opcional)</Label>
                <Textarea
                  id="list-description"
                  placeholder="Adicione uma descrição..."
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateAndAdd}
                  disabled={!newListName.trim()}
                >
                  Criar e Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
