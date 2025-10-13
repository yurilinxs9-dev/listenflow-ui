/**
 * OTIMIZAÇÃO: Indicador visual de qualidade de rede
 * Mostra ao usuário a qualidade da conexão e otimizações ativas
 */

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getNetworkInfo, getDeviceInfo, type NetworkQuality } from '@/lib/networkDetection';

export const NetworkQualityIndicator = () => {
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(() => getNetworkInfo().quality);
  const [downlink, setDownlink] = useState(() => getNetworkInfo().downlink);
  const [deviceType, setDeviceType] = useState(() => getDeviceInfo().type);

  useEffect(() => {
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      const info = getNetworkInfo();
      setNetworkQuality(info.quality);
      setDownlink(info.downlink);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getIcon = () => {
    switch (networkQuality) {
      case 'excellent': return <SignalHigh className="w-4 h-4" />;
      case 'good': return <Signal className="w-4 h-4" />;
      case 'moderate': return <SignalMedium className="w-4 h-4" />;
      case 'poor': return <SignalLow className="w-4 h-4" />;
      default: return <Wifi className="w-4 h-4" />;
    }
  };

  const getColor = () => {
    switch (networkQuality) {
      case 'excellent': return 'default'; // Verde
      case 'good': return 'default';
      case 'moderate': return 'secondary'; // Amarelo
      case 'poor': return 'destructive'; // Vermelho
      default: return 'secondary';
    }
  };

  const getLabel = () => {
    switch (networkQuality) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Boa';
      case 'moderate': return 'Moderada';
      case 'poor': return 'Lenta';
      default: return 'Desconhecida';
    }
  };

  const getDescription = () => {
    return `Conexão ${getLabel()} • ${downlink.toFixed(1)} Mbps • ${deviceType === 'mobile' ? '📱 Mobile' : '💻 Desktop'}`;
  };

  const getOptimizationTip = () => {
    switch (networkQuality) {
      case 'excellent':
        return 'Streaming em qualidade máxima com prefetch ativo';
      case 'good':
        return 'Streaming otimizado com buffer adaptativo';
      case 'moderate':
        return 'Modo economia: preload reduzido para evitar travamentos';
      case 'poor':
        return 'Conexão lenta: use apenas metadados, cache agressivo ativo';
      default:
        return 'Otimizações automáticas ativas';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getColor()} className="gap-1 cursor-help">
            {getIcon()}
            <span className="hidden sm:inline">{getLabel()}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{getDescription()}</p>
            <p className="text-xs text-muted-foreground">{getOptimizationTip()}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

