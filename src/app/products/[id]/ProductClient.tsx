
"use client";

import React, { useState } from 'react';
import { Product, SiteConfig } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Star, Share2, Heart, ShieldCheck, RefreshCcw, Check, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function ProductClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const exchangeDays = config?.exchangeDays || 30;
  const isOutOfStock = product.estoque <= 0;

  const tamanhos = product.tamanhosDisponiveis || ['P', 'M', 'G'];
  const cores = product.coresDisponiveis || [];
  
  const [selectedSize, setSelectedSize] = useState(tamanhos[0]);
  const [selectedColor, setSelectedColor] = useState(cores[0] || 'Única');
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addItem(product, quantity, selectedSize, selectedColor);
  };

  const isHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

  return (
    <div className="space-y-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl border bg-muted group shadow-sm relative">
            <img 
              src={product.imagens?.[0] || 'https://placehold.co/800x1000?text=Sem+Imagem'} 
              alt={product.nome} 
              className={`w-full h-full object-cover transition-transform duration-700 ${!isOutOfStock ? 'hover:scale-110' : 'grayscale-[0.5]'}`}
            />
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                <Badge className="bg-destructive text-destructive-foreground px-8 py-4 text-2xl font-black uppercase tracking-tighter shadow-2xl rotate-[-5deg]">
                  ESGOTADO
                </Badge>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.imagens?.map((img, idx) => (
              <div key={idx} className="aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer hover:border-primary transition-colors">
                <img src={img} alt={`${product.nome} ${idx}`} className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale' : ''}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="uppercase tracking-widest text-[10px] px-3 py-1 text-primary border-primary font-black">{product.categoriaId}</Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10"><Share2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-50 hover:text-pink-500"><Heart className="w-4 h-4" /></Button>
              </div>
            </div>
            <h1 className="text-5xl font-headline font-bold text-foreground leading-tight">{product.nome}</h1>
            <div className="flex items-center gap-4">
              <p className={`text-4xl font-black ${isOutOfStock ? 'text-muted-foreground line-through opacity-50' : 'text-primary'}`}>R$ {product.preco?.toFixed(2)}</p>
              {!isOutOfStock && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 text-muted" />
                  <span className="text-xs text-muted-foreground ml-2 font-bold">(128)</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-muted-foreground text-lg leading-relaxed">{product.descricao}</p>

          <Separator className="h-[2px]" />

          {/* Variants */}
          {!isOutOfStock ? (
            <div className="space-y-8">
              {cores.length > 0 && (
                <div className="space-y-4">
                  <label className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    Cor Selecionada: <span className="text-muted-foreground font-medium normal-case">{selectedColor}</span>
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {cores.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedColor === color ? 'border-primary ring-4 ring-primary/10 scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ 
                          backgroundColor: isHexColor(color) ? color : undefined,
                          backgroundImage: !isHexColor(color) ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : undefined,
                          backgroundSize: '8px 8px'
                        }}
                        title={color}
                      >
                        {selectedColor === color && (
                          <Check className={`w-5 h-5 ${isHexColor(color) && color.toLowerCase() !== '#ffffff' ? 'text-white' : 'text-primary'}`} />
                        )}
                        {!isHexColor(color) && <span className="text-[10px] font-bold">{color}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-black uppercase tracking-widest">Tamanho</label>
                  <button className="text-xs text-primary underline font-black hover:text-accent transition-colors">TABELA DE MEDIDAS</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {tamanhos.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-sm font-black transition-all ${
                        selectedSize === size 
                        ? 'border-primary bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                        : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl flex items-center gap-4 text-red-800">
               <XCircle className="w-10 h-10 text-red-500" />
               <div>
                 <p className="font-black uppercase tracking-widest">Indisponível no Momento</p>
                 <p className="text-sm opacity-80">Este item acabou de sair do estoque. Fique atento às reposições!</p>
               </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {!isOutOfStock && (
              <div className="flex items-center border-2 rounded-2xl px-2 h-16 bg-muted/20">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary transition-colors">-</button>
                <span className="w-12 text-center font-black text-lg">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary transition-colors">+</button>
              </div>
            )}
            <Button 
              size="lg" 
              disabled={isOutOfStock}
              className={`flex-1 h-16 rounded-2xl text-xl font-black shadow-2xl transition-all ${!isOutOfStock ? 'shadow-primary/30 hover:scale-[1.02] active:scale-95' : 'bg-muted text-muted-foreground grayscale cursor-not-allowed'}`} 
              onClick={handleAddToCart}
            >
              {isOutOfStock ? (
                <>PRODUTO ESGOTADO</>
              ) : (
                <><ShoppingBag className="mr-3 w-6 h-6" /> ADICIONAR À SACOLA</>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-3xl border border-primary/5">
              <div className="bg-primary/10 p-2 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-black uppercase tracking-tighter">Qualidade Gold</p>
                <p className="text-muted-foreground text-xs font-medium">Originalidade Garantida</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-3xl border border-primary/5">
              <div className="bg-primary/10 p-2 rounded-xl">
                <RefreshCcw className="w-6 h-6 text-primary" />
              </div>
              <div className="text-sm">
                <p className="font-black uppercase tracking-tighter">Troca Sem Custo</p>
                <p className="text-muted-foreground text-xs font-medium">Até {exchangeDays} dias corridos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-accent border-accent px-4 py-1 rounded-full font-bold">RECOMENDAÇÕES</Badge>
          <h2 className="text-4xl font-headline font-bold">Complete seu Look</h2>
          <p className="text-muted-foreground text-lg">Peças que combinam perfeitamente com sua escolha.</p>
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
