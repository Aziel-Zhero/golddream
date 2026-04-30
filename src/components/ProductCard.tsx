"use client";

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, XCircle, Zap, Sparkles, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const isOutOfStock = (product.estoque || 0) <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    const variation = product.variacoes?.find(v => v.estoque > 0) || product.variacoes?.[0];
    if (!variation) return;

    const tamanho = product.tamanhosDisponiveis?.[0] || 'M';
    addItem(product, 1, tamanho, variation.cor);
  };

  const displayImage = product.variacoes?.[0]?.imagens?.[0] || 'https://placehold.co/800x1000?text=Sem+Imagem';

  return (
    <div className={`group relative product-card-hover rounded-2xl md:rounded-[2rem] overflow-hidden bg-card border border-border/50 h-full flex flex-col ${isOutOfStock ? 'opacity-80' : ''}`}>
      <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        <div className="aspect-[4/5] w-full overflow-hidden bg-muted relative shrink-0">
          <img
            src={displayImage}
            alt={product.nome || 'Produto'}
            className={`h-full w-full object-cover object-center transition-all duration-700 ${!isOutOfStock ? 'md:group-hover:scale-105' : 'grayscale-[0.3]'} animate-in fade-in`}
            loading="lazy"
            decoding="async"
          />
          
          <div className="absolute top-2 left-2 md:top-4 md:left-4 flex flex-col gap-1.5 md:gap-2 z-10">
            {isOutOfStock ? (
              <Badge className="bg-destructive text-white border-none shadow-sm font-black uppercase tracking-widest text-[8px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1" variant="destructive">
                ESGOTADO
              </Badge>
            ) : (
              <>
                {product.isNovidade && (
                  <Badge className="bg-green-500 text-white border-none shadow-sm font-black uppercase tracking-widest text-[8px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 animate-pulse flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3" /> NOVIDADE
                  </Badge>
                )}
                {product.isLancamento && (
                  <Badge className="bg-yellow-400 text-black border-none shadow-sm font-black uppercase tracking-widest text-[8px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-current" /> LANÇAMENTO
                  </Badge>
                )}
                {product.isUltimasPecas && (
                  <Badge className="bg-red-600 text-white border-none shadow-sm font-black uppercase tracking-widest text-[8px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 md:w-3 md:h-3" /> ÚLTIMAS PEÇAS
                  </Badge>
                )}
              </>
            )}
          </div>
          
          {!isOutOfStock && (
            <div className="absolute inset-0 bg-black/5 opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button size="icon" variant="secondary" className="rounded-full shadow-lg hover:scale-110 h-10 w-10 md:h-12 md:w-12" onClick={handleQuickAdd}>
                <ShoppingCart className="w-5 h-5" />
              </Button>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] flex items-center justify-center">
               <div className="bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2">
                 <XCircle size={14} className="md:w-4 md:h-4" />
                 <span className="text-[9px] md:text-[10px] font-black uppercase">Indisponível</span>
               </div>
            </div>
          )}
        </div>

        <div className="p-3 md:p-6 flex flex-col flex-1 text-left">
          <h3 className={`text-xs md:text-lg font-bold mb-2 leading-tight ${!isOutOfStock ? 'text-foreground group-hover:text-primary transition-colors' : 'text-muted-foreground'}`}>
            {product.nome}
          </h3>
          
          <div className="mt-auto space-y-1">
            <p className="text-[8px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
              {product.categoriaId}
            </p>
            <p className={`text-sm md:text-xl font-black ${isOutOfStock ? 'text-muted-foreground' : 'text-primary'}`}>
              R$ {product.preco?.toFixed(2)}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
