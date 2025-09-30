import { Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
            AudioStream
          </h1>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm hover:text-primary transition-colors">
              Início
            </a>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Novos
            </a>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Categorias
            </a>
            <a href="#" className="text-sm hover:text-primary transition-colors">
              Minha Lista
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar audiobooks..."
              className="border-0 bg-transparent focus-visible:ring-0 w-64"
            />
          </div>
          
          <Button size="icon" variant="ghost" className="lg:hidden">
            <Search className="w-5 h-5" />
          </Button>
          
          <Button size="icon" variant="ghost">
            <User className="w-5 h-5" />
          </Button>
          
          <Button size="icon" variant="ghost" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
