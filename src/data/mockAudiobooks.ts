export interface Audiobook {
  id: string;
  title: string;
  author: string;
  cover: string;
  duration: string;
  description: string;
  category: string;
  rating: number;
  narrator?: string;
  chapters?: Array<{ id: string; title: string; duration: string }>;
}

export const mockAudiobooks: Audiobook[] = [
  // Desenvolvimento Pessoal (20 livros)
  {
    id: "1",
    title: "A Tríade do Tempo",
    author: "Christian Barbosa",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=A+Triade+do+Tempo",
    duration: "5h 30m",
    description: "Um livro sobre como gerenciar seu tempo entre vida pessoal, profissional e familiar.",
    category: "Desenvolvimento Pessoal",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "2",
    title: "Quem Pensa Enriquece",
    author: "Napoleon Hill",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Quem+Pensa+Enriquece",
    duration: "7h 15m",
    description: "Clássico da literatura de sucesso, sobre como desenvolver a mentalidade de riqueza.",
    category: "Desenvolvimento Pessoal",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "3",
    title: "O Poder do Hábito",
    author: "Charles Duhigg",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Poder+do+Habito",
    duration: "8h 00m",
    description: "Como os hábitos funcionam e como mudá-los para melhorar sua vida.",
    category: "Desenvolvimento Pessoal",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "4",
    title: "O Segredo",
    author: "Rhonda Byrne",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Segredo",
    duration: "6h 45m",
    description: "O poder da Lei da Atração na criação da realidade desejada.",
    category: "Desenvolvimento Pessoal",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "5",
    title: "O Milagre da Manhã",
    author: "Hal Elrod",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Milagre+da+Manha",
    duration: "5h 00m",
    description: "Como transformar sua vida começando o dia de forma poderosa.",
    category: "Desenvolvimento Pessoal",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "6",
    title: "Como Fazer Amigos e Influenciar Pessoas",
    author: "Dale Carnegie",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Como+Fazer+Amigos",
    duration: "6h 00m",
    description: "Clássico sobre como melhorar relacionamentos e influenciar positivamente as pessoas.",
    category: "Desenvolvimento Pessoal",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "7",
    title: "Desperte Seu Gigante Interior",
    author: "Tony Robbins",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Desperte+Seu+Gigante",
    duration: "9h 30m",
    description: "Como tomar controle imediato do seu destino mental, emocional, físico e financeiro.",
    category: "Desenvolvimento Pessoal",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "8",
    title: "O Poder da Ação",
    author: "Paulo Vieira",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Poder+da+Acao",
    duration: "4h 30m",
    description: "Como transformar sua vida através da ação e da tomada de decisões.",
    category: "Desenvolvimento Pessoal",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "9",
    title: "As 5 Linguagens do Amor",
    author: "Gary Chapman",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=5+Linguagens+do+Amor",
    duration: "5h 15m",
    description: "Descubra como expressar e receber amor de forma mais eficaz.",
    category: "Desenvolvimento Pessoal",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "10",
    title: "Desbloqueie o Seu Potencial",
    author: "John C. Maxwell",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Desbloqueie+Potencial",
    duration: "6h 20m",
    description: "Estratégias para liberar seu potencial máximo.",
    category: "Desenvolvimento Pessoal",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "11",
    title: "Poder Sem Limites",
    author: "Tony Robbins",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Poder+Sem+Limites",
    duration: "10h 00m",
    description: "O novo caminho para a excelência pessoal.",
    category: "Desenvolvimento Pessoal",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "12",
    title: "A Mente Organizada",
    author: "Daniel J. Levitin",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=A+Mente+Organizada",
    duration: "8h 15m",
    description: "Como organizar sua mente e melhorar a tomada de decisões.",
    category: "Desenvolvimento Pessoal",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "13",
    title: "O Vendedor de Sonhos",
    author: "Augusto Cury",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Vendedor+de+Sonhos",
    duration: "7h 00m",
    description: "Uma reflexão sobre a importância de acreditar nos nossos sonhos.",
    category: "Desenvolvimento Pessoal",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "14",
    title: "O Monge e o Executivo",
    author: "James C. Hunter",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Monge+e+Executivo",
    duration: "5h 30m",
    description: "Uma história sobre a essência da liderança.",
    category: "Desenvolvimento Pessoal",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "15",
    title: "A Arte da Felicidade",
    author: "Dalai Lama",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=A+Arte+da+Felicidade",
    duration: "6h 30m",
    description: "Ensinamentos sobre como alcançar a verdadeira felicidade.",
    category: "Desenvolvimento Pessoal",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "16",
    title: "O Corpo Fala",
    author: "Pierre Weil e Roland Tompakow",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Corpo+Fala",
    duration: "4h 45m",
    description: "A linguagem silenciosa da comunicação não verbal.",
    category: "Desenvolvimento Pessoal",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "17",
    title: "Pense e Enriqueça",
    author: "Napoleon Hill",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Pense+e+Enriqueca",
    duration: "7h 00m",
    description: "Os 13 passos para o sucesso e a riqueza.",
    category: "Desenvolvimento Pessoal",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "18",
    title: "O Lado Difícil das Situações Difíceis",
    author: "Ben Horowitz",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=O+Lado+Dificil",
    duration: "7h 45m",
    description: "Lições sobre como gerenciar negócios e lidar com situações difíceis.",
    category: "Desenvolvimento Pessoal",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "19",
    title: "Os 7 Hábitos das Pessoas Altamente Eficazes",
    author: "Stephen R. Covey",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=7+Habitos+Eficazes",
    duration: "9h 00m",
    description: "Lições poderosas para transformação pessoal.",
    category: "Desenvolvimento Pessoal",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "20",
    title: "Vença Seus Limites",
    author: "Christian Barbosa",
    cover: "https://via.placeholder.com/400x600/4F46E5/FFFFFF?text=Venca+Seus+Limites",
    duration: "5h 00m",
    description: "Como superar barreiras mentais e alcançar seus objetivos.",
    category: "Desenvolvimento Pessoal",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },

  // Finanças Pessoais (20 livros)
  {
    id: "21",
    title: "Pai Rico, Pai Pobre",
    author: "Robert Kiyosaki",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Pai+Rico+Pai+Pobre",
    duration: "6h 00m",
    description: "Aprenda a mentalidade de um milionário e como sair da corrida dos ratos.",
    category: "Finanças Pessoais",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "22",
    title: "O Homem Mais Rico da Babilônia",
    author: "George S. Clason",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Homem+Rico+Babilonia",
    duration: "5h 30m",
    description: "Princípios antigos sobre como administrar dinheiro e alcançar a prosperidade.",
    category: "Finanças Pessoais",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "23",
    title: "O Lado Certo da História",
    author: "Ricardo Amorim",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Lado+Certo+Historia",
    duration: "6h 15m",
    description: "Como aproveitar as oportunidades em tempos de crise.",
    category: "Finanças Pessoais",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "24",
    title: "O Investidor Inteligente",
    author: "Benjamin Graham",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Investidor+Inteligente",
    duration: "10h 30m",
    description: "O livro definitivo sobre investimento de valor.",
    category: "Finanças Pessoais",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "25",
    title: "Os Segredos da Mente Milionária",
    author: "T. Harv Eker",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Segredos+Mente",
    duration: "5h 00m",
    description: "Como mudar sua mentalidade para alcançar a riqueza.",
    category: "Finanças Pessoais",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "26",
    title: "A Psicologia Financeira",
    author: "Morgan Housel",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Psicologia+Financeira",
    duration: "5h 45m",
    description: "Lições eternas sobre riqueza, ganância e felicidade.",
    category: "Finanças Pessoais",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "27",
    title: "A Ciência de Ficar Rico",
    author: "Wallace D. Wattles",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Ciencia+Ficar+Rico",
    duration: "3h 30m",
    description: "O método certeiro para enriquecer.",
    category: "Finanças Pessoais",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "28",
    title: "A Mente Milionária",
    author: "T. Harv Eker",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Mente+Milionaria",
    duration: "4h 45m",
    description: "Domine o jogo interior da riqueza.",
    category: "Finanças Pessoais",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "29",
    title: "Como Investir Dinheiro",
    author: "Gustavo Cerbasi",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Como+Investir",
    duration: "5h 15m",
    description: "Guia prático de investimentos para brasileiros.",
    category: "Finanças Pessoais",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "30",
    title: "Me Poupe!",
    author: "Nathalia Arcuri",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Me+Poupe",
    duration: "6h 00m",
    description: "10 passos para nunca mais faltar dinheiro no seu bolso.",
    category: "Finanças Pessoais",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "31",
    title: "Investimentos Inteligentes",
    author: "Thiago Nigro",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Investimentos",
    duration: "7h 30m",
    description: "Estratégias para multiplicar seu patrimônio.",
    category: "Finanças Pessoais",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "32",
    title: "O Segredo da Mente Milionária",
    author: "T. Harv Eker",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Segredo+Mente",
    duration: "5h 00m",
    description: "Aprenda a pensar como os ricos.",
    category: "Finanças Pessoais",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "33",
    title: "Riqueza",
    author: "Jim Rohn",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Riqueza",
    duration: "4h 30m",
    description: "Filosofia sobre prosperidade e sucesso.",
    category: "Finanças Pessoais",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "34",
    title: "Investindo em Ações",
    author: "Décio Bazin",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Investindo+Acoes",
    duration: "6h 15m",
    description: "O método que fez de Luiz Barsi o maior investidor da Bolsa.",
    category: "Finanças Pessoais",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "35",
    title: "O Jeito Warren Buffett de Investir",
    author: "Robert G. Hagstrom",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Warren+Buffett",
    duration: "8h 00m",
    description: "As estratégias de mercado do maior investidor do mundo.",
    category: "Finanças Pessoais",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "36",
    title: "Mentalidade Milionária",
    author: "T. Harv Eker",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Mentalidade",
    duration: "5h 30m",
    description: "Transforme sua relação com o dinheiro.",
    category: "Finanças Pessoais",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "37",
    title: "O Milionário Mora ao Lado",
    author: "Thomas Stanley e William Danko",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Milionario+ao+Lado",
    duration: "7h 15m",
    description: "Os surpreendentes segredos dos ricos da América.",
    category: "Finanças Pessoais",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "38",
    title: "Você é Rico",
    author: "Wallace D. Wattles",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Voce+e+Rico",
    duration: "3h 45m",
    description: "A riqueza está em sua mente.",
    category: "Finanças Pessoais",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "39",
    title: "Investindo Como Warren Buffett",
    author: "Robert G. Hagstrom",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Como+Warren",
    duration: "7h 45m",
    description: "Os segredos do maior investidor do mundo.",
    category: "Finanças Pessoais",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "40",
    title: "A Psicologia do Dinheiro",
    author: "Morgan Housel",
    cover: "https://via.placeholder.com/400x600/059669/FFFFFF?text=Psicologia+Dinheiro",
    duration: "5h 30m",
    description: "Histórias sobre riqueza, ganância e felicidade.",
    category: "Finanças Pessoais",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },

  // Empreendedorismo (20 livros)
  {
    id: "41",
    title: "A Startup Enxuta",
    author: "Eric Ries",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=A+Startup+Enxuta",
    duration: "8h 30m",
    description: "Como empreendedores usam inovação contínua para criar negócios de sucesso.",
    category: "Empreendedorismo",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "42",
    title: "O Segredo das Apresentações Poderosas",
    author: "Carmine Gallo",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Apresentacoes",
    duration: "6h 00m",
    description: "Como Steve Jobs, Bill Gates e outros líderes conquistam o público.",
    category: "Empreendedorismo",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "43",
    title: "De Zero a Um",
    author: "Peter Thiel",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=De+Zero+a+Um",
    duration: "5h 45m",
    description: "O que aprender sobre empreendedorismo com o Vale do Silício.",
    category: "Empreendedorismo",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "44",
    title: "Empreendedorismo Para Subversivos",
    author: "Bel Pesce",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Para+Subversivos",
    duration: "4h 30m",
    description: "Como construir sua carreira do seu jeito.",
    category: "Empreendedorismo",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "45",
    title: "A Lei do Triunfo",
    author: "Napoleon Hill",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Lei+do+Triunfo",
    duration: "12h 00m",
    description: "Os 16 segredos do sucesso.",
    category: "Empreendedorismo",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "46",
    title: "Geração de Valor",
    author: "Flávio Augusto da Silva",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Geracao+de+Valor",
    duration: "7h 15m",
    description: "Compartilhando inspiração, conhecimento e experiências.",
    category: "Empreendedorismo",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "47",
    title: "O Poder do Agora",
    author: "Eckhart Tolle",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Poder+do+Agora",
    duration: "7h 30m",
    description: "Um guia para a iluminação espiritual.",
    category: "Empreendedorismo",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "48",
    title: "A Arte da Guerra",
    author: "Sun Tzu",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Arte+da+Guerra",
    duration: "3h 15m",
    description: "Estratégias milenares aplicadas aos negócios.",
    category: "Empreendedorismo",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "49",
    title: "Empreender com Sucesso",
    author: "José Salibi Neto e Sandro Magaldi",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Empreender+Sucesso",
    duration: "6h 30m",
    description: "Guia prático para empreendedores brasileiros.",
    category: "Empreendedorismo",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "50",
    title: "O Milionário da Porta ao Lado",
    author: "Thomas Stanley e William Danko",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Milionario+Porta",
    duration: "7h 00m",
    description: "Os surpreendentes segredos dos milionários americanos.",
    category: "Empreendedorismo",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "51",
    title: "O Efeito Sombra",
    author: "Deepak Chopra",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Efeito+Sombra",
    duration: "5h 45m",
    description: "Iluminando os lados ocultos da sua personalidade.",
    category: "Empreendedorismo",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "52",
    title: "Superinteligente",
    author: "Nick Bostrom",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Superinteligente",
    duration: "9h 30m",
    description: "Caminhos, perigos, estratégias para a inteligência artificial.",
    category: "Empreendedorismo",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "53",
    title: "A Arte de Começar",
    author: "Guy Kawasaki",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Arte+de+Comecar",
    duration: "6h 15m",
    description: "O guia definitivo para iniciar qualquer projeto.",
    category: "Empreendedorismo",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "54",
    title: "A Mente do Empreendedor",
    author: "Kevin D. Johnson",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Mente+Empreendedor",
    duration: "5h 30m",
    description: "100 características essenciais para o sucesso.",
    category: "Empreendedorismo",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "55",
    title: "O Poder da Inovação",
    author: "Clayton Christensen",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Poder+da+Inovacao",
    duration: "8h 00m",
    description: "O dilema da inovação nos negócios.",
    category: "Empreendedorismo",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "56",
    title: "O Livro do Empreendedor",
    author: "Robert Kiyosaki",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Livro+Empreendedor",
    duration: "6h 45m",
    description: "Guia para quem quer montar seu próprio negócio.",
    category: "Empreendedorismo",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "57",
    title: "Criatividade S.A.",
    author: "Ed Catmull",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Criatividade+SA",
    duration: "9h 15m",
    description: "Superando as forças invisíveis que ficam no caminho da verdadeira inspiração.",
    category: "Empreendedorismo",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "58",
    title: "Trabalhe 4 Horas por Semana",
    author: "Tim Ferriss",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=4+Horas+Semana",
    duration: "10h 30m",
    description: "Fuja da rotina, viva onde quiser e fique rico.",
    category: "Empreendedorismo",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "59",
    title: "Faça Acontecer",
    author: "Sheryl Sandberg",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Faca+Acontecer",
    duration: "6h 00m",
    description: "Mulheres, trabalho e a vontade de liderar.",
    category: "Empreendedorismo",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "60",
    title: "Autobiografia de Steve Jobs",
    author: "Walter Isaacson",
    cover: "https://via.placeholder.com/400x600/DC2626/FFFFFF?text=Steve+Jobs",
    duration: "16h 00m",
    description: "A história do homem que revolucionou a tecnologia.",
    category: "Empreendedorismo",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },

  // Psicologia (20 livros)
  {
    id: "61",
    title: "Influência - A Psicologia da Persuasão",
    author: "Robert B. Cialdini",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Influencia",
    duration: "8h 45m",
    description: "As armas da persuasão e como usá-las.",
    category: "Psicologia",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "62",
    title: "Inteligência Emocional",
    author: "Daniel Goleman",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Inteligencia+Emocional",
    duration: "9h 30m",
    description: "A teoria revolucionária que redefine o que é ser inteligente.",
    category: "Psicologia",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "63",
    title: "O Jeito Harvard de Ser Feliz",
    author: "Shawn Achor",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Jeito+Harvard",
    duration: "6h 00m",
    description: "Como a felicidade pode melhorar sua performance e aumentar o sucesso.",
    category: "Psicologia",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "64",
    title: "Pessoas Desafiadoras",
    author: "Robert Sutton",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Pessoas+Desafiadoras",
    duration: "5h 30m",
    description: "Como lidar com pessoas difíceis no trabalho.",
    category: "Psicologia",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "65",
    title: "Foco",
    author: "Daniel Goleman",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Foco",
    duration: "7h 15m",
    description: "A atenção e seu papel fundamental para o sucesso.",
    category: "Psicologia",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "66",
    title: "Os Enganos de Meu Pai",
    author: "Augusto Cury",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Enganos+Pai",
    duration: "6h 30m",
    description: "Reflexões sobre relacionamento pai e filho.",
    category: "Psicologia",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "67",
    title: "O Poder da Mente Subconsciente",
    author: "Joseph Murphy",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Mente+Subconsciente",
    duration: "8h 00m",
    description: "Como usar o poder da sua mente para alcançar seus objetivos.",
    category: "Psicologia",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "68",
    title: "Mindset",
    author: "Carol S. Dweck",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Mindset",
    duration: "7h 30m",
    description: "A nova psicologia do sucesso.",
    category: "Psicologia",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "69",
    title: "O Andar do Bêbado",
    author: "Leonard Mlodinow",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Andar+do+Bebado",
    duration: "9h 00m",
    description: "Como o acaso determina nossas vidas.",
    category: "Psicologia",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "70",
    title: "O Cérebro Autista",
    author: "Temple Grandin",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Cerebro+Autista",
    duration: "6h 45m",
    description: "Pensando através do espectro.",
    category: "Psicologia",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "71",
    title: "Rápido e Devagar",
    author: "Daniel Kahneman",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Rapido+Devagar",
    duration: "14h 30m",
    description: "Duas formas de pensar.",
    category: "Psicologia",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "72",
    title: "Psicologia Positiva",
    author: "Martin Seligman",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Psicologia+Positiva",
    duration: "8h 15m",
    description: "A ciência da felicidade e das forças humanas.",
    category: "Psicologia",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "73",
    title: "O Código da Mente Extraordinária",
    author: "Vishen Lakhiani",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Codigo+Mente",
    duration: "7h 00m",
    description: "10 regras não convencionais para uma vida extraordinária.",
    category: "Psicologia",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "74",
    title: "A Arte de Ser Feliz",
    author: "Arthur Schopenhauer",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Arte+Ser+Feliz",
    duration: "5h 30m",
    description: "Aforismos para uma vida sábia.",
    category: "Psicologia",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "75",
    title: "O Lado Sombrio do Mercado",
    author: "Michael Lewis",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Lado+Sombrio",
    duration: "9h 45m",
    description: "Alta frequência, comerciantes e o mercado secreto.",
    category: "Psicologia",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "76",
    title: "A Vida Secreta das Mentes Brilhantes",
    author: "Kevin Dutton",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Mentes+Brilhantes",
    duration: "8h 30m",
    description: "A surpreendente ciência dos psicopatas.",
    category: "Psicologia",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "77",
    title: "O Impacto do Hábito",
    author: "Charles Duhigg",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Impacto+Habito",
    duration: "8h 15m",
    description: "Por que fazemos o que fazemos na vida e nos negócios.",
    category: "Psicologia",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "78",
    title: "A Mente de um Vencedor",
    author: "Marcus Buckingham",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Mente+Vencedor",
    duration: "6h 00m",
    description: "Descubra seus pontos fortes.",
    category: "Psicologia",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "79",
    title: "A Coragem de Ser Imperfeito",
    author: "Brené Brown",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Coragem+Imperfeito",
    duration: "7h 30m",
    description: "Como aceitar a própria vulnerabilidade.",
    category: "Psicologia",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "80",
    title: "O Poder da Intenção",
    author: "Wayne Dyer",
    cover: "https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Poder+Intencao",
    duration: "9h 00m",
    description: "Aprenda a co-criar seu mundo do seu jeito.",
    category: "Psicologia",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },

  // Motivação e Autodescoberta (20 livros)
  {
    id: "81",
    title: "O Menino do Pijama Listrado",
    author: "John Boyne",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Menino+Pijama",
    duration: "4h 15m",
    description: "Uma fábula sobre amizade em tempos difíceis.",
    category: "Motivação",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "82",
    title: "Você Pode Curar Sua Vida",
    author: "Louise Hay",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Curar+Sua+Vida",
    duration: "5h 30m",
    description: "O poder do pensamento positivo na cura.",
    category: "Motivação",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "83",
    title: "A Jornada do Herói",
    author: "Joseph Campbell",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Jornada+Heroi",
    duration: "10h 00m",
    description: "O herói de mil faces.",
    category: "Motivação",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "84",
    title: "A Lei da Atração",
    author: "Esther e Jerry Hicks",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Lei+da+Atracao",
    duration: "6h 45m",
    description: "Os ensinamentos de Abraham.",
    category: "Motivação",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "85",
    title: "Mude Sua Vida em 7 Dias",
    author: "Paul McKenna",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Mude+em+7+Dias",
    duration: "4h 30m",
    description: "Técnicas de PNL para transformação pessoal.",
    category: "Motivação",
    rating: 4.5,
    narrator: "Narrador Profissional"
  },
  {
    id: "86",
    title: "A Vida é Curta, Mas Dá Tempo",
    author: "Roberto Shinyashiki",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Vida+Curta",
    duration: "5h 15m",
    description: "Como aproveitar ao máximo cada momento.",
    category: "Motivação",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "87",
    title: "Quem Mexeu no Meu Queijo?",
    author: "Spencer Johnson",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Mexeu+Queijo",
    duration: "2h 30m",
    description: "Uma maneira incrível de lidar com mudanças.",
    category: "Motivação",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "88",
    title: "Segredos da Mente Milionária",
    author: "T. Harv Eker",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Segredos+Mente",
    duration: "5h 00m",
    description: "Aprenda a pensar como os ricos e fique rico!",
    category: "Motivação",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "89",
    title: "Eu Sou o Que Eu Quero Ser",
    author: "Louise Hay",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Eu+Sou",
    duration: "4h 45m",
    description: "Afirmações positivas para transformação.",
    category: "Motivação",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "90",
    title: "Desperte Seu Gigante Interior",
    author: "Tony Robbins",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Desperte+Gigante",
    duration: "9h 30m",
    description: "Como tomar controle do seu destino.",
    category: "Motivação",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "91",
    title: "O Poder do Agora",
    author: "Eckhart Tolle",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Poder+Agora",
    duration: "7h 30m",
    description: "Um guia para iluminação espiritual.",
    category: "Motivação",
    rating: 4.9,
    narrator: "Narrador Profissional"
  },
  {
    id: "92",
    title: "A Vida Secreta das Mentes Brilhantes",
    author: "Kevin Dutton",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Vida+Secreta",
    duration: "8h 30m",
    description: "A surpreendente ciência dos psicopatas.",
    category: "Motivação",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "93",
    title: "O Vendedor de Sonhos",
    author: "Augusto Cury",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Vendedor+Sonhos",
    duration: "7h 00m",
    description: "A revolução dos anônimos.",
    category: "Motivação",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "94",
    title: "Faça Acontecer",
    author: "Sheryl Sandberg",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Faca+Acontecer",
    duration: "6h 00m",
    description: "Mulheres, trabalho e a vontade de liderar.",
    category: "Motivação",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "95",
    title: "O Impacto do Hábito",
    author: "Charles Duhigg",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Impacto+Habito",
    duration: "8h 15m",
    description: "Por que fazemos o que fazemos.",
    category: "Motivação",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "96",
    title: "Segredos da Mente Milionária",
    author: "T. Harv Eker",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Segredos+2",
    duration: "5h 00m",
    description: "Domine o jogo interior da riqueza.",
    category: "Motivação",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "97",
    title: "O Poder da Intenção",
    author: "Wayne Dyer",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Poder+Intencao",
    duration: "9h 00m",
    description: "Aprenda a co-criar seu mundo.",
    category: "Motivação",
    rating: 4.7,
    narrator: "Narrador Profissional"
  },
  {
    id: "98",
    title: "Eu Sou o Que Eu Quero Ser",
    author: "Louise Hay",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Quero+Ser",
    duration: "4h 45m",
    description: "O poder das afirmações positivas.",
    category: "Motivação",
    rating: 4.6,
    narrator: "Narrador Profissional"
  },
  {
    id: "99",
    title: "A Coragem de Ser Imperfeito",
    author: "Brené Brown",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Coragem+Imperfeito",
    duration: "7h 30m",
    description: "Como aceitar a própria vulnerabilidade.",
    category: "Motivação",
    rating: 4.8,
    narrator: "Narrador Profissional"
  },
  {
    id: "100",
    title: "Vença Seus Limites",
    author: "Christian Barbosa",
    cover: "https://via.placeholder.com/400x600/EA580C/FFFFFF?text=Venca+Limites",
    duration: "5h 00m",
    description: "Como superar barreiras e alcançar seus objetivos.",
    category: "Motivação",
    rating: 4.5,
    narrator: "Narrador Profissional"
  }
];

// Helper function to get audiobooks by category
export const getAudiobooksByCategory = (category: string): Audiobook[] => {
  return mockAudiobooks.filter(book => book.category === category);
};

// Helper function to get audiobook by ID
export const getAudiobookById = (id: string): Audiobook | undefined => {
  return mockAudiobooks.find(book => book.id === id);
};

// Helper function to get all categories
export const getAllCategories = (): string[] => {
  const categories = new Set(mockAudiobooks.map(book => book.category));
  return Array.from(categories);
};

// Helper function to get random audiobooks
export const getRandomAudiobooks = (count: number): Audiobook[] => {
  const shuffled = [...mockAudiobooks].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
