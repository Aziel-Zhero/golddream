
"use client";

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye, XCircle, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const isOutOfStock = product.estoque <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    const tamanho = product.tamanhosDisponiveis?.[0] || 'M';
    const cor = product.coresDisponiveis?.[0] || 'Padrão';
    addItem(product, 1, tamanho, cor);
  };

  return (
    <div className={`group relative product-card-hover rounded-xl overflow-hidden bg-white border border-border/50 h-full flex flex-col ${isOutOfStock ? 'opacity-80' : ''}`}>
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        {/* Container da Imagem com proporção fixa */}
        <div className="aspect-[4/5] w-full overflow-hidden bg-muted relative shrink-0">
          {product.imagens?.[0] ? (
            <img
              src={product.imagens[0]}
              alt={product.nome || 'Produto'}
              className={`h-full w-full object-cover object-center transition-all duration-700 ${!isOutOfStock ? 'group-hover:scale-105' : 'grayscale-[0.3]'} animate-in fade-in`}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <ImageIcon className="w-10 h-10 text-muted-foreground opacity-10" />
            </div>
          )}
          
          {/* Selos de Estoque */}
          {isOutOfStock ? (
            <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground border-none shadow-sm font-black uppercase tracking-widest text-[10px]" variant="destructive">
              ESGOTADO
            </Badge>
          ) : product.estoque < 5 && (
            <Badge className="absolute top-3 left-3 bg-white/90 text-primary border-none shadow-sm" variant="outline">
              Apenas {product.estoque} restantes
            </Badge>
          )}
          
          {/* Ações Rápidas em Hover */}
          {!isOutOfStock && (
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full shadow-lg hover:scale-110 transition-transform"
                onClick={handleQuickAdd}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg hover:scale-110 transition-transform">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Overlay de Esgotado */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center">
               <div className="bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2">
                 <XCircle size={16} />
                 <span className="text-[10px] font-black uppercase">Indisponível</span>
               </div>
            </div>
          )}
        </div>

        {/* Informações do Produto - flex-1 garante que o conteúdo cresça igualmente */}
        <div className="p-4 flex flex-col flex-1 text-left">
          {/* Título sem truncate: permite quebra de linha */}
          <h3 className={`text-sm font-semibold mb-1 leading-tight ${!isOutOfStock ? 'text-foreground group-hover:text-primary transition-colors' : 'text-muted-foreground'}`}>
            {product.nome}
          </h3>
          
          {/* Categoria */}
          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-3">
            {product.categoriaId}
          </p>
          
          {/* Preço - mt-auto força o elemento para o fundo do container flex */}
          <div className="mt-auto">
            <p className={`text-base font-black ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>
              R$ {product.preco?.toFixed(2)}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
