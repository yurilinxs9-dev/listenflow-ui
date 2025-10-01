import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, X, Lock, ZoomIn, ZoomOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
  isPremium?: boolean;
  userIsPremium?: boolean;
  previewPages?: number;
}

export const PdfViewer = ({ 
  pdfUrl, 
  title, 
  onClose, 
  isPremium = false,
  userIsPremium = false,
  previewPages = 10 
}: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const maxPages = isPremium && !userIsPremium ? previewPages : numPages;
  const isRestricted = isPremium && !userIsPremium && pageNumber >= previewPages;

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    const maxAllowedPage = isPremium && !userIsPremium ? previewPages : numPages;
    setPageNumber((prev) => Math.min(prev + 1, maxAllowedPage));
  };

  const handleUpgradeToPremium = () => {
    // TODO: Implementar navegação para página de assinatura
    alert("Funcionalidade de upgrade em desenvolvimento!");
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${title}.pdf`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {isPremium && !userIsPremium && (
                <Badge variant="secondary" className="mt-1">
                  <Lock className="w-3 h-3 mr-1" />
                  Conteúdo Premium - Prévia até página {previewPages}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((s) => Math.max(s - 0.2, 0.5))}
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setScale((s) => Math.min(s + 0.2, 2.0))}
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            {(!isPremium || userIsPremium) && (
              <Button variant="secondary" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto flex flex-col items-center justify-center p-4 bg-muted/30 gap-4">
        <div className="bg-background shadow-2xl relative">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            }
            error={
              <div className="p-20 text-center">
                <p className="text-destructive">Erro ao carregar PDF</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Verifique sua conexão e tente novamente
                </p>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
          
          {/* Overlay de bloqueio para conteúdo premium */}
          {isRestricted && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center p-8 max-w-md">
                <Lock className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-2">Conteúdo Premium</h3>
                <p className="text-muted-foreground mb-6">
                  Esta página faz parte do conteúdo premium. Assine agora para acessar o livro completo!
                </p>
                <Button onClick={handleUpgradeToPremium} className="gradient-hero">
                  <Lock className="w-4 h-4 mr-2" />
                  Assinar Premium
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Aviso de preview limitado */}
        {isPremium && !userIsPremium && pageNumber < previewPages && (
          <div className="bg-card border border-border rounded-lg p-4 max-w-md text-center">
            <p className="text-sm text-muted-foreground">
              Você está visualizando uma prévia limitada. 
              Página {pageNumber} de {previewPages} disponíveis gratuitamente.
            </p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleUpgradeToPremium}
              className="mt-2"
            >
              Desbloquear todas as {numPages} páginas
            </Button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm">
            Página {pageNumber} de {isPremium && !userIsPremium ? `${previewPages} (${numPages} total)` : numPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={pageNumber >= maxPages}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
