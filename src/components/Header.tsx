import { Search, User, Menu, LogOut, Heart, FolderOpen, Upload, Music, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold gradient-hero bg-clip-text text-transparent">
            ListenFlow
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm hover:text-primary transition-colors">
              Início
            </Link>
            {user && (
              <>
                <button className="text-sm hover:text-primary transition-colors">
                  Categorias
                </button>
                <button className="text-sm hover:text-primary transition-colors">
                  Minha Biblioteca
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-2 bg-secondary rounded-full px-4 py-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar audiobooks..."
                  className="border-0 bg-transparent focus-visible:ring-0 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              
              <Button 
                size="icon" 
                variant="ghost" 
                className="lg:hidden"
                onClick={() => navigate('/search')}
              >
                <Search className="w-5 h-5" />
              </Button>
            </>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="w-4 h-4 mr-2" />
                      Painel Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => navigate('/my-audiobooks')}>
                  <Music className="w-4 h-4 mr-2" />
                  Meus Audiobooks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Audiobook
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/favorites')}>
                  <Heart className="w-4 h-4 mr-2" />
                  Favoritos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/lists')}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Minhas Coleções
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate('/auth')}
              className="gradient-hero border-0 h-10"
            >
              Entrar
            </Button>
          )}
          
          <Button size="icon" variant="ghost" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
