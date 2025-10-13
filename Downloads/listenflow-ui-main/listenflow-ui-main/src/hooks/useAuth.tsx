import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { loginSchema, signUpSchema, checkClientRateLimit } from '@/lib/validation';
import { checkEnhancedRateLimit, sanitizeErrorMessage } from '@/lib/securityUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // SEGURANÇA: Rate limiting aprimorado do lado do cliente
      if (!checkEnhancedRateLimit(`login_${email}`, 5, 60000)) {
        throw new Error('Muitas tentativas de login. Aguarde 1 minuto.');
      }

      // SEGURANÇA: Validação rigorosa com Zod
      const validated = loginSchema.parse({ email, password });

      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        // Mensagens de erro genéricas para prevenir enumeração de usuários
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos');
        }
        throw error;
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
      
      navigate('/');
    } catch (error: any) {
      // SEGURANÇA: Sanitizar mensagem de erro
      const safeMessage = sanitizeErrorMessage(error);
      toast({
        title: "Erro no login",
        description: safeMessage || "Não foi possível fazer login.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // SEGURANÇA: Rate limiting aprimorado do lado do cliente
      if (!checkEnhancedRateLimit(`signup_${email}`, 3, 300000)) {
        throw new Error('Muitas tentativas de registro. Aguarde 5 minutos.');
      }

      // SEGURANÇA: Validação rigorosa com Zod
      const validated = signUpSchema.parse({ email, password, displayName });
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: validated.displayName,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Conta criada!",
        description: "Você já pode começar a ouvir.",
      });
      
      navigate('/');
    } catch (error: any) {
      // SEGURANÇA: Sanitizar mensagem de erro
      const safeMessage = sanitizeErrorMessage(error);
      toast({
        title: "Erro no cadastro",
        description: safeMessage || "Não foi possível criar a conta.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Erro no logout",
        description: error.message || "Não foi possível sair.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
