import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock, XCircle } from "lucide-react";
import { Header } from "@/components/Header";

interface AccessDeniedProps {
  status: 'pending' | 'rejected';
}

export const AccessDenied = ({ status }: AccessDeniedProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl mx-auto mt-20">
            <Card className="border-2">
              <CardHeader className="text-center">
                {status === 'pending' ? (
                  <>
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                    <CardTitle className="text-2xl">Aguardando Aprovação</CardTitle>
                    <CardDescription className="text-base mt-2">
                      Sua conta foi criada com sucesso e está aguardando aprovação do administrador.
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl">Acesso Negado</CardTitle>
                    <CardDescription className="text-base mt-2">
                      Sua conta não foi aprovada. Entre em contato com o administrador para mais informações.
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {status === 'pending' 
                      ? 'Você receberá acesso aos audiobooks assim que sua conta for aprovada.'
                      : 'Se você acredita que isso é um erro, entre em contato conosco.'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Enquanto isso, você pode explorar a plataforma, mas não poderá reproduzir audiobooks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
