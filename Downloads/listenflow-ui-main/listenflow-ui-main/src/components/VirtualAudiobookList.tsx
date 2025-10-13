/**
 * OTIMIZAÇÃO: Virtual scrolling para listas longas
 * Renderiza apenas itens visíveis = -90% DOM + scroll suave
 */

import { FixedSizeList as List } from 'react-window';
import { AudiobookCard } from './AudiobookCard';
import { useEffect, useState } from 'react';

interface Audiobook {
  id: string;
  title: string;
  author: string;
  duration: string;
  cover: string;
  progress?: number;
  viewCount?: number;
  isTopRated?: boolean;
}

interface VirtualAudiobookListProps {
  audiobooks: Audiobook[];
  itemsPerRow?: number; // Quantos cards por linha
  className?: string;
}

export const VirtualAudiobookList = ({
  audiobooks,
  itemsPerRow,
  className = '',
}: VirtualAudiobookListProps) => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Detectar quantos itens por linha baseado no tamanho da tela
  const getItemsPerRow = () => {
    if (itemsPerRow) return itemsPerRow;
    
    const width = dimensions.width;
    if (width < 640) return 2;      // Mobile: 2 colunas
    if (width < 768) return 3;      // Tablet pequeno: 3 colunas
    if (width < 1024) return 4;     // Tablet grande: 4 colunas
    if (width < 1280) return 5;     // Desktop pequeno: 5 colunas
    return 6;                        // Desktop grande: 6 colunas
  };

  const columns = getItemsPerRow();
  
  // Calcular altura de cada linha baseado na viewport
  const getItemHeight = () => {
    const cardWidth = (dimensions.width - 64) / columns; // -64 para padding
    const cardHeight = cardWidth * 1.8; // Aspecto 2:3 + informações
    return cardHeight + 20; // +20 para gap
  };

  const itemHeight = getItemHeight();
  const totalRows = Math.ceil(audiobooks.length / columns);

  // Atualizar dimensões ao resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Renderizar uma linha de cards
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const startIndex = index * columns;
    const rowItems = audiobooks.slice(startIndex, startIndex + columns);

    return (
      <div style={style} className="flex gap-4 px-4">
        {rowItems.map((audiobook) => (
          <div key={audiobook.id} style={{ width: `${100 / columns}%` }}>
            <AudiobookCard
              id={audiobook.id}
              title={audiobook.title}
              author={audiobook.author}
              duration={audiobook.duration}
              cover={audiobook.cover}
              progress={audiobook.progress}
              viewCount={audiobook.viewCount}
              isTopRated={audiobook.isTopRated}
            />
          </div>
        ))}
      </div>
    );
  };

  // Se poucos itens, não usar virtual scroll (overhead desnecessário)
  if (audiobooks.length < 20) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${className}`}>
        {audiobooks.map((audiobook) => (
          <AudiobookCard
            key={audiobook.id}
            id={audiobook.id}
            title={audiobook.title}
            author={audiobook.author}
            duration={audiobook.duration}
            cover={audiobook.cover}
            progress={audiobook.progress}
            viewCount={audiobook.viewCount}
            isTopRated={audiobook.isTopRated}
          />
        ))}
      </div>
    );
  }

  // Virtual scrolling para listas longas
  return (
    <div className={className}>
      <List
        height={Math.min(dimensions.height - 200, totalRows * itemHeight)} // Máximo viewport -200px para header
        itemCount={totalRows}
        itemSize={itemHeight}
        width="100%"
        overscanCount={2} // Renderizar 2 linhas extra fora da viewport (smooth scroll)
      >
        {Row}
      </List>
    </div>
  );
};

/**
 * Versão horizontal para carrosséis
 */
export const VirtualHorizontalList = ({
  audiobooks,
  className = '',
}: Omit<VirtualAudiobookListProps, 'itemsPerRow'>) => {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Largura do card no carrossel
  const itemWidth = width < 640 ? 160 : 200;

  const Column = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const audiobook = audiobooks[index];

    return (
      <div style={style} className="px-2">
        <AudiobookCard
          id={audiobook.id}
          title={audiobook.title}
          author={audiobook.author}
          duration={audiobook.duration}
          cover={audiobook.cover}
          progress={audiobook.progress}
          viewCount={audiobook.viewCount}
          isTopRated={audiobook.isTopRated}
        />
      </div>
    );
  };

  return (
    <List
      layout="horizontal"
      height={itemWidth * 1.8 + 80} // Altura do card
      itemCount={audiobooks.length}
      itemSize={itemWidth + 16} // +16 para gap
      width={width}
      className={className}
      overscanCount={3}
    >
      {Column}
    </List>
  );
};

