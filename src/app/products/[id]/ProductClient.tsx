"use client";

import React, { useState } from 'react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star, Share2, Heart, ShieldCheck, RefreshCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';

export function ProductClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const tamanhos = product.tamanhosDisponiveis || ['P', 'M', 'G'];
  const cores = product.coresDisponiveis || ['Padrão'];
  
  const [selectedSize, setSelectedSize] = useState(tamanhos[0]);
  const [selectedColor, setSelectedColor] = useState(cores[0]);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product, quantity, selectedSize, selectedColor);
  };

  return (
    <div className="space-y-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] overflow-hidden rounded-2xl border bg-muted group">
            <img 
              src={product.imagens?.[0] || 'https://placehold.co/800x1000?text=Sem+Imagem'} 
              alt={product.nome} 
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.imagens?.map((img, idx) => (
              <div key={idx} className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:border-primary transition-colors">
                <img src={img} alt={`${product.nome} ${idx}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="uppercase tracking-widest text-[10px] px-3 py-1 text-primary border-primary">{product.categoriaId}</Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10"><Share2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50 hover:text-pink-500"><Heart className="w-4 h-4" /></Button>
              </div>
            </div>
            <h1 className="text-4xl font-headline font-bold">{product.nome}</h1>
            <div className="flex items-center gap-4">
              <p className="text-3xl font-bold text-primary">R$ {product.preco?.toFixed(2)}</p>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 fill-current" />
                <Star className="w-4 h-4 text-muted" />
                <span className="text-xs text-muted-foreground ml-2">(128 avaliações)</span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.descricao}</p>

          <Separator />

          {/* Variants */}
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase tracking-wider">Cor: <span className="text-muted-foreground font-normal normal-case">{selectedColor}</span></label>
              <div className="flex gap-3">
                {cores.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 px-4 rounded-full border text-xs font-medium transition-all ${selectedColor === color ? 'border-primary bg-primary text-white shadow-lg' : 'hover:border-primary'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold uppercase tracking-wider">Tamanho</label>
                <button className="text-xs text-primary underline font-medium">Guia de Medidas</button>
              </div>
              <div className="flex gap-3">
                {tamanhos.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl border flex items-center justify-center text-sm font-medium transition-all ${selectedSize === size ? 'border-primary bg-primary text-white shadow-lg' : 'hover:border-primary'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <div className="flex items-center border rounded-xl px-2 h-14">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 hover:text-primary">-</button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="px-3 hover:text-primary">+</button>
            </div>
            <Button size="lg" className="flex-1 h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform" onClick={handleAddToCart}>
              <ShoppingBag className="mr-2 w-5 h-5" /> Adicionar à Sacola
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div className="text-xs">
                <p className="font-bold">Garantia Premium</p>
                <p className="text-muted-foreground">Qualidade assegurada</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <RefreshCcw className="w-5 h-5 text-primary" />
              <div className="text-xs">
                <p className="font-bold">30 Dias para Troca</p>
                <p className="text-muted-foreground">Processo sem custos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-headline font-bold">Você também pode gostar</h2>
          <p className="text-muted-foreground">Complete o look com estas peças curadas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {relatedProducts.slice(0, 4).map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
