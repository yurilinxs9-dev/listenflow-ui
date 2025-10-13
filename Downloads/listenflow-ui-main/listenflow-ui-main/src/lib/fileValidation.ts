/**
 * SEGURANÇA: Validação robusta de arquivos
 * Verifica tipo MIME real, não apenas extensão
 */

// Magic numbers (assinaturas de arquivo) para tipos permitidos
const FILE_SIGNATURES = {
  // Áudio
  mp3: [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]], // MP3
  m4a: [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70]], // M4A/MP4
  wav: [[0x52, 0x49, 0x46, 0x46]], // WAV
  ogg: [[0x4F, 0x67, 0x67, 0x53]], // OGG
  flac: [[0x66, 0x4C, 0x61, 0x43]], // FLAC
  
  // Imagens
  jpg: [[0xFF, 0xD8, 0xFF]], // JPEG
  png: [[0x89, 0x50, 0x4E, 0x47]], // PNG
  gif: [[0x47, 0x49, 0x46, 0x38]], // GIF
  webp: [[0x52, 0x49, 0x46, 0x46]], // WEBP (precisa verificar mais bytes)
};

/**
 * Lê os primeiros bytes de um arquivo para verificar assinatura
 */
async function readFileHeader(file: File, bytesCount: number = 12): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      resolve(Array.from(arr));
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    
    // Lê apenas os primeiros bytes
    reader.readAsArrayBuffer(file.slice(0, bytesCount));
  });
}

/**
 * Verifica se bytes correspondem a uma assinatura
 */
function matchesSignature(bytes: number[], signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Verifica se um arquivo é realmente um arquivo de áudio
 */
export async function validateAudioFile(file: File): Promise<{ 
  valid: boolean; 
  error?: string; 
  detectedType?: string 
}> {
  // 1. Verificar tamanho (máximo 5GB)
  const MAX_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: 'Arquivo muito grande. Máximo: 5GB' 
    };
  }

  // 2. Verificar tipo MIME declarado
  const declaredType = file.type.toLowerCase();
  const validAudioTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/flac',
    'audio/x-flac',
  ];
  
  if (!validAudioTypes.includes(declaredType) && !declaredType.startsWith('audio/')) {
    return { 
      valid: false, 
      error: `Tipo de arquivo não suportado: ${declaredType}` 
    };
  }

  // 3. Verificar extensão
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['mp3', 'm4a', 'mp4', 'wav', 'ogg', 'flac', 'aac'];
  
  if (!extension || !validExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: 'Extensão de arquivo não suportada' 
    };
  }

  // 4. Verificar assinatura do arquivo (magic numbers)
  try {
    const header = await readFileHeader(file, 12);
    
    // Verificar MP3
    if (FILE_SIGNATURES.mp3.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'audio/mpeg' };
    }
    
    // Verificar M4A/MP4
    if (FILE_SIGNATURES.m4a.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'audio/mp4' };
    }
    
    // Verificar WAV
    if (FILE_SIGNATURES.wav.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'audio/wav' };
    }
    
    // Verificar OGG
    if (FILE_SIGNATURES.ogg.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'audio/ogg' };
    }
    
    // Verificar FLAC
    if (FILE_SIGNATURES.flac.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'audio/flac' };
    }
    
    // Se não encontrou assinatura conhecida, mas o tipo MIME é válido
    // (alguns formatos podem não ter assinatura clara)
    console.warn('[File Validation] Assinatura não reconhecida, confiando no MIME type:', declaredType);
    return { 
      valid: true, 
      detectedType: declaredType 
    };
    
  } catch (error) {
    console.error('[File Validation] Erro ao validar arquivo:', error);
    return { 
      valid: false, 
      error: 'Erro ao validar arquivo' 
    };
  }
}

/**
 * Verifica se um arquivo é realmente uma imagem
 */
export async function validateImageFile(file: File): Promise<{ 
  valid: boolean; 
  error?: string; 
  detectedType?: string 
}> {
  // 1. Verificar tamanho (máximo 10MB)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return { 
      valid: false, 
      error: 'Imagem muito grande. Máximo: 10MB' 
    };
  }

  // 2. Verificar tipo MIME declarado
  const declaredType = file.type.toLowerCase();
  const validImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  if (!validImageTypes.includes(declaredType)) {
    return { 
      valid: false, 
      error: `Tipo de imagem não suportado: ${declaredType}` 
    };
  }

  // 3. Verificar extensão
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  if (!extension || !validExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: 'Extensão de imagem não suportada' 
    };
  }

  // 4. Verificar assinatura do arquivo
  try {
    const header = await readFileHeader(file, 12);
    
    // Verificar JPEG
    if (FILE_SIGNATURES.jpg.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'image/jpeg' };
    }
    
    // Verificar PNG
    if (FILE_SIGNATURES.png.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'image/png' };
    }
    
    // Verificar GIF
    if (FILE_SIGNATURES.gif.some(sig => matchesSignature(header, sig))) {
      return { valid: true, detectedType: 'image/gif' };
    }
    
    // Verificar WEBP (RIFF + WEBP em offset 8)
    if (matchesSignature(header, FILE_SIGNATURES.webp[0])) {
      // Ler mais bytes para confirmar WEBP
      const extendedHeader = await readFileHeader(file, 16);
      if (extendedHeader[8] === 0x57 && extendedHeader[9] === 0x45 && 
          extendedHeader[10] === 0x42 && extendedHeader[11] === 0x50) {
        return { valid: true, detectedType: 'image/webp' };
      }
    }
    
    return { 
      valid: false, 
      error: 'Assinatura do arquivo não corresponde a uma imagem válida' 
    };
    
  } catch (error) {
    console.error('[File Validation] Erro ao validar imagem:', error);
    return { 
      valid: false, 
      error: 'Erro ao validar imagem' 
    };
  }
}

/**
 * Valida nome de arquivo contra path traversal
 */
export function validateFileName(filename: string): { valid: boolean; error?: string } {
  // Verificar path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return { 
      valid: false, 
      error: 'Nome de arquivo contém caracteres inválidos' 
    };
  }
  
  // Verificar caracteres especiais perigosos
  const dangerousChars = /[<>:"|?*\x00-\x1f]/;
  if (dangerousChars.test(filename)) {
    return { 
      valid: false, 
      error: 'Nome de arquivo contém caracteres proibidos' 
    };
  }
  
  // Verificar tamanho do nome
  if (filename.length > 255) {
    return { 
      valid: false, 
      error: 'Nome de arquivo muito longo' 
    };
  }
  
  return { valid: true };
}

