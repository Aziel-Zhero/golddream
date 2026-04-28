
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, SiteConfig, ProductVariation, Review } from '@/types';
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
  Zap,
  Sparkles,
  AlertTriangle,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from '@/components/ProductCard';
import { Separator } from '@/components/ui/separator';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';

export function ProductClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const exchangeDays = config?.exchangeDays || 30;
  const variacoes = product.variacoes || [];

  const allImages = useMemo(() => {
    return variacoes.flatMap(v => 
      (v.imagens || []).map(img => ({ url: img, variation: v }))
    );
  }, [variacoes]);

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(variacoes[0] || null);
  const [selectedSize, setSelectedSize] = useState(product.tamanhosDisponiveis?.[0] || '');
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, skipSnaps: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    
    const currentImageInfo = allImages[index];
    if (currentImageInfo && currentImageInfo.variation.cor !== selectedVariation?.cor) {
      setSelectedVariation(currentImageInfo.variation);
    }
  }, [emblaApi, allImages, selectedVariation]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const isSizeAvailableForCurrentColor = (size: string) => {
    if (!selectedVariation?.estoquePorTamanho) return selectedVariation?.estoque > 0;
    return (selectedVariation.estoquePorTamanho[size] || 0) > 0;
  };

  const isColorAvailableForCurrentSize = (v: ProductVariation) => {
    if (!selectedSize) return v.estoque > 0;
    if (!v.estoquePorTamanho) return v.estoque > 0;
    return (v.estoquePorTamanho[selectedSize] || 0) > 0;
  };

  const handleAddToCart = () => {
    if (!selectedVariation || !selectedSize) return;
    addItem(product, quantity, selectedSize, selectedVariation.cor);
  };

  const isHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);
  
  const currentChoiceOutOfStock = useMemo(() => {
    if (!selectedVariation || !selectedSize) return true;
    if (!selectedVariation.estoquePorTamanho) return selectedVariation.estoque <= 0;
    return (selectedVariation.estoquePorTamanho[selectedSize] || 0) <= 0;
  }, [selectedVariation, selectedSize]);

  const handleColorSelection = (v: ProductVariation) => {
    if (!emblaApi) return;
    const index = allImages.findIndex(info => info.variation.cor === v.cor);
    if (index !== -1) {
      emblaApi.scrollTo(index);
    }
    setSelectedVariation(v);
  };

  const reviewsQuery = useMemoFirebase(() => 
    query(collection(firestore, 'produtos', product.id, 'avaliacoes'), orderBy('createdAt', 'desc'), limit(10))
  , [firestore, product.id]);
  const { data: reviews } = useCollection<Review>(reviewsQuery);

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="space-y-16 md:space-y-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] md:rounded-[3rem] border bg-muted shadow-sm group">
            <div className="absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-2 z-20">
              {product.isNovidade && (
                <Badge className="bg-green-500 text-white border-none shadow-xl font-black uppercase tracking-widest text-[9px] md:text-xs px-3 py-1.5 md:px-5 md:py-2 animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> NOVIDADE
                </Badge>
              )}
              {product.isLancamento && (
                <Badge className="bg-yellow-400 text-black border-none shadow-xl font-black uppercase tracking-widest text-[9px] md:text-xs px-3 py-1.5 md:px-5 md:py-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" /> LANÇAMENTO
                </Badge>
              )}
              {product.isUltimasPecas && (
                <Badge className="bg-red-600 text-white border-none shadow-xl font-black uppercase tracking-widest text-[9px] md:text-xs px-3 py-1.5 md:px-5 md:py-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> ÚLTIMAS PEÇAS
                </Badge>
              )}
            </div>

            <div className="w-full h-full cursor-grab active:cursor-grabbing" ref={emblaRef}>
              <div className="flex h-full">
                {allImages.map((imgInfo, idx) => (
                  <div key={idx} className="flex-[0_0_100%] min-w-0 relative h-full">
                    <img 
                      src={imgInfo.url} 
                      alt={`${product.nome} ${idx}`} 
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-700",
                        imgInfo.variation.estoque > 0 ? 'md:group-hover:scale-105' : 'grayscale'
                      )} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {allImages.length > 1 && (
              <div className="hidden md:block">
                <button onClick={scrollPrev} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-xl flex items-center justify-center text-primary hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-30"><ChevronLeft className="w-8 h-8" /></button>
                <button onClick={scrollNext} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur shadow-xl flex items-center justify-center text-primary hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-30"><ChevronRight className="w-8 h-8" /></button>
              </div>
            )}

            {currentChoiceOutOfStock && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-30">
                <Badge className="bg-destructive text-white px-10 py-4 text-2xl font-black rotate-[-5deg] shadow-2xl border-4 border-white/20">ESGOTADO</Badge>
              </div>
            )}
            
            {/* Indicador de Bolinhas Mobile */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20 md:hidden">
              {allImages.map((_, idx) => (
                <div key={idx} className={cn("h-1.5 transition-all rounded-full bg-white shadow-sm", idx === selectedIndex ? "w-6" : "w-1.5 opacity-50")} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-3 px-1 custom-scrollbar">
            {allImages.map((imgInfo, idx) => (
              <button key={idx} onClick={() => emblaApi?.scrollTo(idx)} className={cn("flex-shrink-0 w-16 h-20 md:w-24 md:h-32 rounded-xl border-2 overflow-hidden transition-all", idx === selectedIndex ? 'border-primary scale-105 shadow-lg' : 'border-transparent opacity-60')}>
                <img src={imgInfo.url} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-8 md:space-y-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="uppercase tracking-[0.2em] text-[10px] md:text-xs px-4 py-1.5 text-primary border-primary font-black">{product.categoriaId}</Badge>
              <div className="flex gap-1 md:gap-2">
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12"><Share2 className="w-5 h-5" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 md:h-12 md:w-12 hover:text-pink-500"><Heart className="w-5 h-5" /></Button>
              </div>
            </div>
            <h1 className="text-4xl md:text-7xl font-headline font-bold text-foreground leading-tight text-balance">{product.nome}</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
              <p className="text-4xl md:text-6xl font-black text-primary">R$ {product.preco?.toFixed(2)}</p>
              <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50/50 w-fit px-4 py-2 rounded-2xl border border-yellow-100">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-4 h-4 md:w-5 md:h-5 ${i <= Number(averageRating) ? 'fill-current' : 'text-muted'}`} />
                ))}
                <span className="text-xs md:text-sm text-muted-foreground ml-2 font-black">({reviews?.length || 0})</span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground text-base md:text-xl leading-relaxed max-w-xl">{product.descricao}</p>

          <Separator />

          {/* Color Variations */}
          <div className="space-y-5">
            <label className="text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-between">
              <span>Escolha a Cor: <span className="text-primary font-bold normal-case ml-1">{selectedVariation?.cor}</span></span>
              <Badge variant="secondary" className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter">Variedade Premium</Badge>
            </label>
            <div className="flex flex-wrap gap-3 md:gap-5">
              {variacoes.map((v, idx) => {
                const available = isColorAvailableForCurrentSize(v);
                return (
                  <button
                    key={idx}
                    onClick={() => handleColorSelection(v)}
                    className={cn(
                      "relative w-12 h-12 md:w-16 md:h-16 rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden",
                      selectedVariation?.cor === v.cor 
                        ? 'border-primary ring-4 ring-primary/10 scale-110 shadow-xl' 
                        : 'border-muted hover:border-primary/50',
                      !available && 'opacity-40 border-dashed grayscale cursor-not-allowed'
                    )}
                    style={{ backgroundColor: isHexColor(v.cor) ? v.cor : undefined }}
                    title={v.cor}
                  >
                    {selectedVariation?.cor === v.cor && (
                      <Check className={`w-6 h-6 md:w-8 md:h-8 ${isHexColor(v.cor) && v.cor.toLowerCase() !== '#ffffff' ? 'text-white' : 'text-primary'}`} />
                    )}
                    {!isHexColor(v.cor) && <span className="text-[8px] md:text-[10px] font-black uppercase text-center px-1 leading-tight">{v.cor}</span>}
                    {!available && <div className="absolute inset-0 flex items-center justify-center"><XCircle className="w-6 h-6 text-destructive/50" /></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-5">
            <label className="text-xs md:text-sm font-black uppercase tracking-widest">Tamanho / Numeração</label>
            <div className="flex flex-wrap gap-3 md:gap-4">
              {(product.tamanhosDisponiveis || []).map(size => {
                const available = isSizeAvailableForCurrentColor(size);
                return (
                  <button 
                    key={size} 
                    onClick={() => setSelectedSize(size)} 
                    disabled={!available}
                    className={cn(
                      "min-w-[3.5rem] h-12 md:min-w-[4.5rem] md:h-16 rounded-2xl border-2 flex items-center justify-center text-sm md:text-lg font-black transition-all px-4",
                      selectedSize === size 
                        ? 'border-primary bg-primary text-white shadow-xl scale-105' 
                        : 'border-muted hover:border-primary/50',
                      !available && 'opacity-30 border-dashed border-2 text-muted-foreground grayscale cursor-not-allowed'
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {!currentChoiceOutOfStock && (
              <div className="flex items-center border-2 rounded-2xl px-2 h-14 md:h-16 bg-muted/20 w-full sm:w-auto justify-between sm:justify-start">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 flex items-center justify-center font-bold text-2xl hover:text-primary transition-colors">-</button>
                <span className="w-12 text-center font-black text-lg md:text-xl">{quantity}</span>
                <button 
                  onClick={() => {
                    const maxStock = selectedVariation?.estoquePorTamanho 
                      ? (selectedVariation.estoquePorTamanho[selectedSize] || 1)
                      : (selectedVariation?.estoque || 1);
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }} 
                  className="w-12 h-12 flex items-center justify-center font-bold text-2xl hover:text-primary transition-colors"
                >+</button>
              </div>
            )}
            <Button 
              size="lg" 
              disabled={currentChoiceOutOfStock} 
              className={cn(
                "flex-1 h-14 md:h-16 rounded-2xl text-lg md:text-2xl font-black shadow-2xl transition-all",
                !currentChoiceOutOfStock ? 'shadow-primary/30 hover:scale-[1.02]' : 'bg-muted text-muted-foreground grayscale cursor-not-allowed'
              )} 
              onClick={handleAddToCart}
            >
              {currentChoiceOutOfStock ? "PRODUTO ESGOTADO" : <><ShoppingBag className="mr-3 w-6 h-6 md:w-8 md:h-8" /> ADICIONAR À SACOLA</>}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
            <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-3xl border border-primary/5">
              <div className="bg-primary/10 p-2.5 rounded-xl"><ShieldCheck className="w-6 h-6 text-primary" /></div>
              <div><p className="font-black uppercase text-[10px] tracking-widest text-primary">Qualidade Gold</p><p className="text-xs text-muted-foreground font-medium">Original e Curado</p></div>
            </div>
            <div className="flex items-center gap-4 p-5 bg-muted/30 rounded-3xl border border-primary/5">
              <div className="bg-primary/10 p-2.5 rounded-xl"><RefreshCcw className="w-6 h-6 text-primary" /></div>
              <div><p className="font-black uppercase text-[10px] tracking-widest text-primary">Troca VIP</p><p className="text-xs text-muted-foreground font-medium">Até {exchangeDays} dias corridos</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="bg-muted/10 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-20 space-y-12 md:space-y-20 border border-primary/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="space-y-3">
            <Badge className="bg-primary text-white border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Feedback Real</Badge>
            <h2 className="text-3xl md:text-6xl font-headline font-bold">O que dizem os clientes</h2>
            <p className="text-muted-foreground text-sm md:text-xl">Opiniões de quem já vive a experiência Gold Dream.</p>
          </div>
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border-2 flex items-center gap-8 md:gap-12 w-full md:w-auto justify-center">
             <div className="text-center">
               <p className="text-5xl md:text-7xl font-black text-primary leading-none">{averageRating}</p>
               <p className="text-[10px] md:text-xs font-black uppercase text-muted-foreground mt-2 tracking-widest">Média Geral</p>
             </div>
             <Separator orientation="vertical" className="h-16 md:h-24 bg-primary/10" />
             <div className="flex flex-col gap-2">
               <div className="flex items-center gap-1 text-yellow-500">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 md:w-6 md:h-6 ${i <= Number(averageRating) ? 'fill-current' : 'text-muted'}`} />)}
               </div>
               <p className="text-xs md:text-base font-bold text-muted-foreground">{reviews?.length || 0} compradores verificados</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {reviews?.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-[3rem] bg-white/50 space-y-4">
               <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground/20" />
               <div className="space-y-1">
                 <p className="text-muted-foreground font-bold text-lg">Ainda não há avaliações.</p>
                 <p className="text-sm text-muted-foreground">Seja o primeiro a avaliar após receber sua compra!</p>
               </div>
            </div>
          ) : (
            reviews?.map((review) => (
              <div key={review.id} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white hover:shadow-xl transition-all p-8 md:p-12 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                      <UserIcon className="w-6 h-6 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <p className="font-black text-base md:text-lg">{review.userName}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground font-black uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 text-yellow-500">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm md:text-lg leading-relaxed italic">"{review.comment}"</p>
                <div className="flex items-center gap-2 pt-2">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Compra Verificada</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products Section */}
      <section className="space-y-12 md:space-y-20">
        <div className="text-center space-y-4">
          <Badge variant="outline" className="text-accent border-accent px-6 py-1.5 rounded-full font-black uppercase text-[10px] tracking-widest">RECOMENDAÇÕES</Badge>
          <h2 className="text-4xl md:text-6xl font-headline font-bold">Complete seu Look</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-12">
          {relatedProducts.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
