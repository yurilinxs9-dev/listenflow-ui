import { Header } from "@/components/Header";
import { AudiobookCard } from "@/components/AudiobookCard";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { mockAudiobooks } from "@/data/mockAudiobooks";

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const filteredAudiobooks = searchQuery.trim()
    ? mockAudiobooks.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const categories = searchQuery.trim()
    ? Array.from(new Set(filteredAudiobooks.map((book) => book.category)))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 container mx-auto px-4">
        <div className="max-w-4xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-6 gradient-hero bg-clip-text text-transparent">
            Buscar Audiobooks
          </h1>

          <form onSubmit={handleSearch} className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Digite o título, autor, categoria..."
              className="pl-12 h-14 text-lg bg-secondary border-border"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </form>
        </div>

        {searchQuery.trim() && (
          <>
            {filteredAudiobooks.length > 0 ? (
              <div className="space-y-12">
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold">
                      {filteredAudiobooks.length} resultado
                      {filteredAudiobooks.length !== 1 ? "s" : ""} encontrado
                      {filteredAudiobooks.length !== 1 ? "s" : ""}
                    </h2>
                    <p className="text-muted-foreground">
                      para "{searchQuery}"
                    </p>
                  </div>

                  {categories.length > 1 ? (
                    categories.map((category) => {
                      const booksInCategory = filteredAudiobooks.filter(
                        (book) => book.category === category
                      );
                      return (
                        <div key={category} className="mb-12">
                          <h3 className="text-xl font-semibold mb-6">
                            {category} ({booksInCategory.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {booksInCategory.map((audiobook) => (
                              <AudiobookCard
                                key={audiobook.id}
                                id={audiobook.id}
                                title={audiobook.title}
                                author={audiobook.author}
                                duration={audiobook.duration}
                                cover={audiobook.cover}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                      {filteredAudiobooks.map((audiobook) => (
                        <AudiobookCard
                          key={audiobook.id}
                          id={audiobook.id}
                          title={audiobook.title}
                          author={audiobook.author}
                          duration={audiobook.duration}
                          cover={audiobook.cover}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">
                  Nenhum resultado encontrado
                </h2>
                <p className="text-muted-foreground">
                  Tente buscar com palavras-chave diferentes
                </p>
              </div>
            )}
          </>
        )}

        {!searchQuery.trim() && (
          <div className="text-center py-20">
            <SearchIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Comece a buscar audiobooks
            </h2>
            <p className="text-muted-foreground">
              Digite o título, autor ou categoria que deseja encontrar
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
