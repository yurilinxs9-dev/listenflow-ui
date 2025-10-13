import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useUserLists } from '@/hooks/useUserLists';
import { AudiobookCard } from '@/components/AudiobookCard';
import { supabase } from '@/integrations/supabase/client';

export default function ListDetails() {
  const { listId } = useParams<{ listId: string }>();
  const navigate = useNavigate();
  const { lists, getListItems, removeFromList, loading } = useUserLists();
  const [listItems, setListItems] = useState<any[]>([]);
  const [audiobooks, setAudiobooks] = useState<Record<string, any>>({});
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

    // Buscar dados reais dos audiobooks do Supabase
    if (items.length > 0) {
      const audiobookIds = items.map((item: any) => item.audiobook_id);
      const { data, error } = await supabase
        .from('audiobooks')
        .select('*')
        .in('id', audiobookIds);

      if (error) {
        console.error('Erro ao buscar audiobooks da lista:', error);
      } else if (data) {
        // Criar um objeto indexado por ID para acesso rápido
        const audiobooksMap = data.reduce((acc: any, book: any) => {
          acc[book.id] = {
            id: book.id,
            title: book.title,
            author: book.author,
            cover: book.cover_url || '/placeholder.svg',
            duration: formatDuration(book.duration_seconds),
          };
          return acc;
        }, {});
        setAudiobooks(audiobooksMap);
      }
    }

    setItemsLoading(false);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {listItems.map((item) => {
              const audiobook = audiobooks[item.audiobook_id];

              // Se o audiobook não foi encontrado, não renderizar
              if (!audiobook) return null;

              return (
                <div key={item.id} className="relative group">
                  <AudiobookCard {...audiobook} />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveItem(item.audiobook_id);
                    }}
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
