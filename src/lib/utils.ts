import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Redimensiona e comprime uma imagem Base64.
 * Mudança crítica: Agora utiliza o formato image/webp para preservar a transparência (Alpha Channel),
 * evitando o fundo preto que ocorria com o image/jpeg.
 */
export async function compressImage(base64Str: string, maxWidth = 1200, maxHeight = 1200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      // Limpa o canvas para garantir que a transparência seja preservada
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Utilizamos image/webp com qualidade 0.8. 
      // O WebP é suportado por todos os navegadores modernos e mantém a transparência do PNG original.
      resolve(canvas.toDataURL('image/webp', 0.8));
    };
    img.onerror = () => resolve(base64Str);
  });
}
