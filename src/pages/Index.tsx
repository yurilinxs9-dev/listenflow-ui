import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { CategoryRow } from "@/components/CategoryRow";
import { 
  mockAudiobooks, 
  getAudiobooksByCategory, 
  getRandomAudiobooks 
} from "@/data/mockAudiobooks";

const Index = () => {
  // Buscar audiobooks por categoria
  const desenvolvimentoPessoal = getAudiobooksByCategory("Desenvolvimento Pessoal").slice(0, 6);
  const financasPessoais = getAudiobooksByCategory("Finanças Pessoais").slice(0, 6);
  const empreendedorismo = getAudiobooksByCategory("Empreendedorismo").slice(0, 6);
  const psicologia = getAudiobooksByCategory("Psicologia").slice(0, 6);
  const motivacao = getAudiobooksByCategory("Motivação").slice(0, 6);
  
  // Audiobooks aleatórios para "Recomendações"
  const recommendations = getRandomAudiobooks(6);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        <HeroCarousel />
        
        <div className="space-y-8 pb-20">
          <CategoryRow title="Recomendações para Você" audiobooks={recommendations} />
          <CategoryRow title="Desenvolvimento Pessoal" audiobooks={desenvolvimentoPessoal} />
          <CategoryRow title="Finanças Pessoais" audiobooks={financasPessoais} />
          <CategoryRow title="Empreendedorismo" audiobooks={empreendedorismo} />
          <CategoryRow title="Psicologia" audiobooks={psicologia} />
          <CategoryRow title="Motivação e Autodescoberta" audiobooks={motivacao} />
        </div>
      </main>
    </div>
  );
};

export default Index;
