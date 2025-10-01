import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserLists } from '@/hooks/useUserLists';
import { AudiobookCard } from '@/components/AudiobookCard';

// Mock audiobooks data - in production, fetch from API
const mockAudiobooks: Record<string, any> = {
  'autoajuda-1': {
    id: 'autoajuda-1',
    title: 'O Poder do Hábito',
    author: 'Charles Duhigg',
    cover: '/placeholder.svg',
    duration: '10h 53min',
    rating: 4.7,
  },
  'ficcao-1': {
    id: 'ficcao-1',
    title: '1984',
    author: 'George Orwell',
    cover: '/placeholder.svg',
    duration: '11h 22min',
    rating: 4.8,
  },
};

export default function ListDetails() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { lists, getListItems, removeFromList, loading } = useUserLists();
  const [listItems, setListItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const currentList = lists.find(l => l.id === listId);

  useEffect(() => {
    if (listId) {
      loadListItems();
    }
  }, [listId]);

  const loadListItems = async () => {
    if (!listId) return;
    
    setItemsLoading(true);
    const items = await getListItems(listId);
    setListItems(items);
    setItemsLoading(false);
  };

  const handleRemoveItem = async (audiobookId: string) => {
    if (!listId) return;
    
    const success = await removeFromList(listId, audiobookId);
    if (success) {
      await loadListItems();
    }
  };

  if (loading || itemsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </main>
      </div>
    );
  }

  if (!currentList) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Coleção não encontrada</h1>
            <Button onClick={() => navigate('/lists')}>Voltar para Coleções</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/lists')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{currentList.name}</h1>
          {currentList.description && (
            <p className="text-muted-foreground">{currentList.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {listItems.length} audiobook(s)
          </p>
        </div>

        {listItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Esta coleção ainda não tem audiobooks
            </p>
            <Button onClick={() => navigate('/')}>
              Explorar Audiobooks
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listItems.map((item) => {
              // In production, fetch actual audiobook data
              const audiobook = mockAudiobooks[item.audiobook_id] || {
                id: item.audiobook_id,
                title: 'Audiobook',
                author: 'Autor',
                cover: '/placeholder.svg',
                duration: '0h 0min',
                rating: 0,
              };

              return (
                <div key={item.id} className="relative group">
                  <AudiobookCard {...audiobook} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveItem(item.audiobook_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
