import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategoryRow } from "@/components/CategoryRow";
import mysteryBook from "@/assets/book-mystery.jpg";
import fantasyBook from "@/assets/book-fantasy.jpg";
import scifiBook from "@/assets/book-scifi.jpg";
import romanceBook from "@/assets/book-romance.jpg";
import businessBook from "@/assets/book-business.jpg";
import biographyBook from "@/assets/book-biography.jpg";

const Index = () => {
  const continueListening = [
    {
      id: "1",
      title: "O Mistério da Noite Escura",
      author: "Ana Silva",
      duration: "8h 45min",
      cover: mysteryBook,
      progress: 65,
    },
    {
      id: "2",
      title: "Reinos Perdidos",
      author: "Carlos Mendes",
      duration: "12h 30min",
      cover: fantasyBook,
      progress: 32,
    },
    {
      id: "3",
      title: "Estrelas Distantes",
      author: "Maria Costa",
      duration: "10h 15min",
      cover: scifiBook,
      progress: 78,
    },
  ];

  const recommendations = [
    {
      id: "4",
      title: "Amor em Paris",
      author: "Beatriz Santos",
      duration: "6h 20min",
      cover: romanceBook,
    },
    {
      id: "5",
      title: "O Código do Sucesso",
      author: "João Almeida",
      duration: "7h 10min",
      cover: businessBook,
    },
    {
      id: "6",
      title: "Vida de um Gênio",
      author: "Pedro Rocha",
      duration: "9h 45min",
      cover: biographyBook,
    },
    {
      id: "7",
      title: "Segredos Antigos",
      author: "Laura Dias",
      duration: "11h 05min",
      cover: mysteryBook,
    },
    {
      id: "8",
      title: "Dragões e Magia",
      author: "Ricardo Pinto",
      duration: "14h 25min",
      cover: fantasyBook,
    },
  ];

  const newReleases = [
    {
      id: "9",
      title: "Viagem Interestelar",
      author: "Sofia Martins",
      duration: "8h 30min",
      cover: scifiBook,
    },
    {
      id: "10",
      title: "Corações Entrelaçados",
      author: "Miguel Ferreira",
      duration: "5h 55min",
      cover: romanceBook,
    },
    {
      id: "11",
      title: "Liderança Transformadora",
      author: "André Oliveira",
      duration: "6h 40min",
      cover: businessBook,
    },
    {
      id: "12",
      title: "Memórias de Guerra",
      author: "Cristina Lima",
      duration: "10h 20min",
      cover: biographyBook,
    },
    {
      id: "13",
      title: "O Assassino Silencioso",
      author: "Bruno Carvalho",
      duration: "9h 10min",
      cover: mysteryBook,
    },
  ];

  const mostListened = [
    {
      id: "14",
      title: "Império das Sombras",
      author: "Helena Ribeiro",
      duration: "13h 15min",
      cover: fantasyBook,
    },
    {
      id: "15",
      title: "Futuro Alternativo",
      author: "Lucas Gomes",
      duration: "7h 50min",
      cover: scifiBook,
    },
    {
      id: "16",
      title: "Encontros do Destino",
      author: "Mariana Castro",
      duration: "6h 30min",
      cover: romanceBook,
    },
    {
      id: "17",
      title: "Estratégias de Vitória",
      author: "Fernando Souza",
      duration: "8h 00min",
      cover: businessBook,
    },
    {
      id: "18",
      title: "O Grande Inventor",
      author: "Isabela Moreira",
      duration: "11h 30min",
      cover: biographyBook,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <HeroCarousel />
        
        <div className="space-y-8 pb-20">
          <CategoryRow title="Continue Ouvindo" audiobooks={continueListening} />
          <CategoryRow title="Recomendações para Você" audiobooks={recommendations} />
          <CategoryRow title="Novos Lançamentos" audiobooks={newReleases} />
          <CategoryRow title="Mais Ouvidos" audiobooks={mostListened} />
        </div>
      </main>
    </div>
  );
};

export default Index;
