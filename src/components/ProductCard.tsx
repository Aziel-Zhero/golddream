"use client";

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Usa propriedades em português e fornece fallbacks seguros
    const tamanho = product.tamanhosDisponiveis?.[0] || 'M';
    const cor = product.coresDisponiveis?.[0] || 'Padrão';
    addItem(product, 1, tamanho, cor);
  };

  return (
    <div className="group relative product-card-hover rounded-xl overflow-hidden bg-white border border-border/50">
      <Link href={`/products/${product.id}`} className="block">
        <div className="aspect-[4/5] w-full overflow-hidden bg-muted relative">
          <img
            src={product.imagens?.[0] || 'https://placehold.co/400x500?text=Sem+Imagem'}
            alt={product.nome || 'Produto'}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {product.estoque < 5 && product.estoque > 0 && (
            <Badge className="absolute top-3 left-3 bg-white/90 text-primary border-none shadow-sm" variant="outline">
              Apenas {product.estoque} restantes
            </Badge>
          )}
          
          {/* Quick Actions Overlay */}
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
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate pr-2">
              {product.nome}
            </h3>
            <p className="text-sm font-bold">R$ {product.preco?.toFixed(2)}</p>
          </div>
          <p className="text-xs text-muted-foreground capitalize">{product.categoriaId}</p>
        </div>
      </Link>
    </div>
  );
}
