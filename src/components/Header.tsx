import { Search, User, Menu, LogOut, Heart, FolderOpen, Upload, Music, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useState } from "react";
import logo from "@/assets/rendacast-logo-transparent.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Header = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <Link to="/" className="flex items-center bg-transparent">
            <img src={logo} alt="RendaCast" className="h-20 w-auto object-contain mix-blend-normal" style={{ background: 'transparent' }} />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm hover:text-primary transition-colors">
              Início
            </Link>
            {user && (
              <>
                <Link to="/search" className="text-sm hover:text-primary transition-colors">
                  Categorias
                </Link>
                <Link to="/my-audiobooks" className="text-sm hover:text-primary transition-colors">
                  Minha Biblioteca
                </Link>
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
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] z-50">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <Link 
                  to="/" 
                  className="text-base hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Início
                </Link>
                {user && (
                  <>
                    <Link 
                      to="/search" 
                      className="text-base hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Categorias
                    </Link>
                    <Link 
                      to="/my-audiobooks" 
                      className="text-base hover:text-primary transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Minha Biblioteca
                    </Link>
                    <div className="border-t border-border my-2" />
                    <Link 
                      to="/favorites" 
                      className="text-base hover:text-primary transition-colors py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="w-4 h-4" />
                      Favoritos
                    </Link>
                    <Link 
                      to="/lists" 
                      className="text-base hover:text-primary transition-colors py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FolderOpen className="w-4 h-4" />
                      Minhas Coleções
                    </Link>
                    <Link 
                      to="/upload" 
                      className="text-base hover:text-primary transition-colors py-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Upload className="w-4 h-4" />
                      Enviar Audiobook
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t border-border my-2" />
                        <Link 
                          to="/admin" 
                          className="text-base hover:text-primary transition-colors py-2 flex items-center gap-2"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Painel Admin
                        </Link>
                      </>
                    )}
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
