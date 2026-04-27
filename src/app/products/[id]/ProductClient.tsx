
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Product, SiteConfig, ProductVariation } from '@/types';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  Star, 
  Share2, 
  Heart, 
  ShieldCheck, 
  RefreshCcw, 
  Check, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Zap,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import useEmblaCarousel from 'embla-carousel-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ProductClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const exchangeDays = config?.exchangeDays || 30;

  const variacoes = product.variacoes || [];
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(variacoes[0] || null);
  const [selectedSize, setSelectedSize] = useState(product.tamanhosDisponiveis?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { addItem } = useCart();

  // Embla Carousel para as fotos do produto
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const handleAddToCart = () => {
    if (!selectedVariation || selectedVariation.estoque <= 0) return;
    addItem(product, quantity, selectedSize, selectedVariation.cor);
  };

  const isHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);

  const currentImages = selectedVariation?.imagens || [];
  const isOutOfStock = !selectedVariation || selectedVariation.estoque <= 0;

  return (
    <div className="space-y-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border bg-muted shadow-sm group">
            {/* Selos Dinâmicos na Galeria */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
              {product.isNovidade && (
                <Badge className="bg-green-500 text-white border-none shadow-lg font-black uppercase tracking-widest text-[10px] px-4 py-1.5 animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> NOVIDADE
                </Badge>
              )}
              {product.isLancamento && (
                <Badge className="bg-yellow-400 text-black border-none shadow-lg font-black uppercase tracking-widest text-[10px] px-4 py-1.5 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" /> LANÇAMENTO
                </Badge>
              )}
              {product.isUltimasPecas && (
                <Badge className="bg-red-600 text-white border-none shadow-lg font-black uppercase tracking-widest text-[10px] px-4 py-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> ÚLTIMAS PEÇAS
                </Badge>
              )}
            </div>

            <div className="w-full h-full" ref={emblaRef}>
              <div className="flex h-full">
                {currentImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="flex-[0_0_100%] min-w-0 relative h-full cursor-zoom-in"
                    onClick={() => {
                      setLightboxIndex(idx);
                      setIsLightboxOpen(true);
                    }}
                  >
                    <img 
                      src={img} 
                      alt={`${product.nome} ${idx}`} 
                      className={`w-full h-full object-cover transition-transform duration-700 ${!isOutOfStock ? 'group-hover:scale-105' : 'grayscale'}`}
                    />
                  </div>
                ))}
                {currentImages.length === 0 && (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground italic">
                    Nenhuma imagem disponível para esta cor.
                  </div>
                )}
              </div>
            </div>

            {/* Carousel Controls */}
            {currentImages.length > 1 && (
              <>
                <button 
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-primary hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-primary hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {currentImages.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all ${i === selectedIndex ? 'w-8 bg-primary' : 'w-1.5 bg-primary/20'}`} />
                  ))}
                </div>
              </>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                <Badge className="bg-destructive text-white px-8 py-3 text-xl font-black rotate-[-5deg]">ESGOTADO</Badge>
              </div>
            )}

            <button 
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-4 right-4 p-3 bg-white/50 backdrop-blur rounded-2xl text-primary hover:bg-white transition-all shadow-sm"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {currentImages.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => emblaApi?.scrollTo(idx)}
                className={`flex-shrink-0 w-20 h-24 rounded-xl border-2 overflow-hidden transition-all ${idx === selectedIndex ? 'border-primary scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="uppercase tracking-widest text-[10px] px-3 py-1 text-primary border-primary font-black">{product.categoriaId}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="rounded-full"><Share2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:text-pink-500"><Heart className="w-4 h-4" /></Button>
              </div>
            </div>
            <h1 className="text-5xl font-headline font-bold text-foreground leading-tight">{product.nome}</h1>
            <div className="flex items-center gap-4">
              <p className="text-4xl font-black text-primary">R$ {product.preco?.toFixed(2)}</p>
              <div className="flex items-center gap-1 text-yellow-500">
                {[1,2,3,4].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                <Star className="w-4 h-4 text-muted" />
                <span className="text-xs text-muted-foreground ml-2 font-bold">(42 avaliações)</span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-lg leading-relaxed">{product.descricao}</p>

          <Separator className="h-[1px]" />

          {/* Color Variations */}
          <div className="space-y-4">
            <label className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              Escolha a Cor: <span className="text-primary font-bold normal-case">{selectedVariation?.cor}</span>
            </label>
            <div className="flex flex-wrap gap-4">
              {variacoes.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedVariation(v);
                    setSelectedIndex(0);
                    emblaApi?.scrollTo(0);
                  }}
                  className={`relative w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden ${
                    selectedVariation?.cor === v.cor ? 'border-primary ring-4 ring-primary/10 scale-110 shadow-lg' : 'border-muted hover:border-primary/50'
                  }`}
                  style={{ 
                    backgroundColor: isHexColor(v.cor) ? v.cor : undefined,
                    backgroundImage: !isHexColor(v.cor) ? 'none' : undefined
                  }}
                  title={v.cor}
                >
                  {selectedVariation?.cor === v.cor && (
                    <Check className={`w-6 h-6 ${isHexColor(v.cor) && v.cor.toLowerCase() !== '#ffffff' ? 'text-white' : 'text-primary'}`} />
                  )}
                  {!isHexColor(v.cor) && <span className="text-[10px] font-black uppercase text-center px-1 leading-tight">{v.cor}</span>}
                  {v.estoque <= 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><XCircle className="w-6 h-6 text-destructive" /></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-black uppercase tracking-widest">Tamanho</label>
            </div>
            <div className="flex flex-wrap gap-3">
              {(product.tamanhosDisponiveis || []).map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-sm font-black transition-all ${
                    selectedSize === size 
                    ? 'border-primary bg-primary text-white shadow-xl scale-105' 
                    : 'border-muted hover:border-primary/50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {!isOutOfStock && (
              <div className="flex items-center border-2 rounded-2xl px-2 h-16 bg-muted/20">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary">-</button>
                <span className="w-12 text-center font-black text-lg">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(selectedVariation?.estoque || 1, quantity + 1))} className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary">+</button>
              </div>
            )}
            <Button 
              size="lg" 
              disabled={isOutOfStock}
              className={`flex-1 h-16 rounded-2xl text-xl font-black shadow-2xl transition-all ${!isOutOfStock ? 'shadow-primary/30 hover:scale-[1.02]' : 'bg-muted text-muted-foreground grayscale cursor-not-allowed'}`} 
              onClick={handleAddToCart}
            >
              {isOutOfStock ? "COR INDISPONÍVEL" : <><ShoppingBag className="mr-3 w-6 h-6" /> ADICIONAR À SACOLA</>}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-primary/5">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div className="text-[10px]"><p className="font-black uppercase">Qualidade Gold</p><p className="text-muted-foreground">Original Garantido</p></div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-primary/5">
              <RefreshCcw className="w-5 h-5 text-primary" />
              <div className="text-[10px]"><p className="font-black uppercase">Troca Grátis</p><p className="text-muted-foreground">Até {exchangeDays} dias</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Gallery Viewer */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0 bg-black/95 border-none flex flex-col items-center justify-center rounded-none sm:rounded-none">
          <div className="relative w-full h-full flex items-center justify-center">
             <img 
               src={currentImages[lightboxIndex]} 
               className="max-w-full max-h-full object-contain" 
               alt="Zoom view"
             />
             
             {currentImages.length > 1 && (
               <>
                 <button 
                   onClick={() => setLightboxIndex(prev => (prev === 0 ? currentImages.length - 1 : prev - 1))}
                   className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                 >
                   <ChevronLeft size={32} />
                 </button>
                 <button 
                   onClick={() => setLightboxIndex(prev => (prev === currentImages.length - 1 ? 0 : prev + 1))}
                   className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                 >
                   <ChevronRight size={32} />
                 </button>
               </>
             )}

             <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 overflow-x-auto p-2 bg-white/10 backdrop-blur rounded-2xl max-w-[80%]">
               {currentImages.map((img, i) => (
                 <button 
                   key={i} 
                   onClick={() => setLightboxIndex(i)}
                   className={`w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === lightboxIndex ? 'border-primary' : 'border-transparent opacity-50'}`}
                 >
                   <img src={img} className="w-full h-full object-cover" alt="" />
                 </button>
               ))}
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Related Products Section */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-accent border-accent px-4 py-1 rounded-full font-bold">RECOMENDAÇÕES</Badge>
          <h2 className="text-4xl font-headline font-bold">Complete seu Look</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {relatedProducts.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
