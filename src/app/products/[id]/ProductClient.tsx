
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function ProductClient({ product, relatedProducts }: { product: Product, relatedProducts: Product[] }) {
  const firestore = useFirestore();
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const exchangeDays = config?.exchangeDays || 30;
  const variacoes = product.variacoes || [];

  // Mapeia todas as imagens
  const allImages = useMemo(() => {
    return variacoes.flatMap(v => 
      (v.imagens || []).map(img => ({ url: img, variation: v }))
    );
  }, [variacoes]);

  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(variacoes[0] || null);
  const [selectedSize, setSelectedSize] = useState(product.tamanhosDisponiveis?.[0] || '');
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCart();

  // Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
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

  const handleAddToCart = () => {
    if (!selectedVariation || selectedVariation.estoque <= 0) return;
    addItem(product, quantity, selectedSize, selectedVariation.cor);
  };

  const isHexColor = (color: string) => /^#[0-9A-F]{6}$/i.test(color);
  const isOutOfStock = !selectedVariation || selectedVariation.estoque <= 0;

  const handleColorSelection = (v: ProductVariation) => {
    if (!emblaApi) return;
    const index = allImages.findIndex(info => info.variation.cor === v.cor);
    if (index !== -1) {
      emblaApi.scrollTo(index);
    }
    setSelectedVariation(v);
  };

  // Carregar avaliações
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
    <div className="space-y-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery Section */}
        <div className="space-y-4">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border bg-muted shadow-sm group">
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
                {allImages.map((imgInfo, idx) => (
                  <div key={idx} className="flex-[0_0_100%] min-w-0 relative h-full">
                    <img src={imgInfo.url} alt={`${product.nome} ${idx}`} className={`w-full h-full object-cover transition-transform duration-700 ${imgInfo.variation.estoque > 0 ? 'group-hover:scale-105' : 'grayscale'}`} />
                  </div>
                ))}
              </div>
            </div>

            {allImages.length > 1 && (
              <>
                <button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-primary hover:bg-white transition-all opacity-0 group-hover:opacity-100"><ChevronLeft className="w-6 h-6" /></button>
                <button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-primary hover:bg-white transition-all opacity-0 group-hover:opacity-100"><ChevronRight className="w-6 h-6" /></button>
              </>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                <Badge className="bg-destructive text-white px-8 py-3 text-xl font-black rotate-[-5deg]">ESGOTADO</Badge>
              </div>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
            {allImages.map((imgInfo, idx) => (
              <button key={idx} onClick={() => emblaApi?.scrollTo(idx)} className={`flex-shrink-0 w-20 h-24 rounded-xl border-2 overflow-hidden transition-all ${idx === selectedIndex ? 'border-primary scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={imgInfo.url} className="w-full h-full object-cover" alt="" />
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
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-4 h-4 ${i <= Number(averageRating) ? 'fill-current' : 'text-muted'}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-2 font-bold">({reviews?.length || 0} avaliações)</span>
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
                  onClick={() => handleColorSelection(v)}
                  className={`relative w-14 h-14 rounded-2xl border-2 transition-all flex items-center justify-center overflow-hidden ${
                    selectedVariation?.cor === v.cor ? 'border-primary ring-4 ring-primary/10 scale-110 shadow-lg' : 'border-muted hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: isHexColor(v.cor) ? v.cor : undefined }}
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
            <label className="text-sm font-black uppercase tracking-widest">Tamanho</label>
            <div className="flex flex-wrap gap-3">
              {(product.tamanhosDisponiveis || []).map(size => (
                <button key={size} onClick={() => setSelectedSize(size)} className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-sm font-black transition-all ${selectedSize === size ? 'border-primary bg-primary text-white shadow-xl scale-105' : 'border-muted hover:border-primary/50'}`}>
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {!isOutOfStock && (
              <div className="flex items-center border-2 rounded-2xl px-2 h-16 bg-muted/20">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary">-</button>
                <span className="w-12 text-center font-black text-lg">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(selectedVariation?.estoque || 1, quantity + 1))} className="w-10 h-10 flex items-center justify-center font-bold text-xl hover:text-primary">+</button>
              </div>
            )}
            <Button size="lg" disabled={isOutOfStock} className={`flex-1 h-16 rounded-2xl text-xl font-black shadow-2xl transition-all ${!isOutOfStock ? 'shadow-primary/30 hover:scale-[1.02]' : 'bg-muted text-muted-foreground grayscale cursor-not-allowed'}`} onClick={handleAddToCart}>
              {isOutOfStock ? "PRODUTO ESGOTADO" : <><ShoppingBag className="mr-3 w-6 h-6" /> ADICIONAR À SACOLA</>}
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

      {/* Reviews Section */}
      <section className="bg-muted/10 rounded-[3rem] p-8 md:p-16 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-4xl font-headline font-bold">O que dizem os clientes</h2>
            <p className="text-muted-foreground">Avaliações reais de quem já comprou este produto.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border-2 flex items-center gap-6">
             <div className="text-center">
               <p className="text-5xl font-black text-primary">{averageRating}</p>
               <p className="text-[10px] font-black uppercase text-muted-foreground">Média Geral</p>
             </div>
             <Separator orientation="vertical" className="h-12" />
             <div className="flex flex-col gap-1">
               <div className="flex items-center gap-1 text-yellow-500">
                  {[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= Number(averageRating) ? 'fill-current' : 'text-muted'}`} />)}
               </div>
               <p className="text-xs font-bold">{reviews?.length || 0} compradores satisfeitos</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews?.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl bg-white/50">
               <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
               <p className="text-muted-foreground font-medium">Ainda não há avaliações para este produto.</p>
               <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a avaliar após receber sua compra!</p>
            </div>
          ) : (
            reviews?.map((review) => (
              <Card key={review.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{review.userName}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-yellow-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">"{review.comment}"</p>
                  <div className="flex items-center gap-1.5 pt-2">
                     <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-green-600" />
                     </div>
                     <span className="text-[9px] font-black text-green-600 uppercase tracking-tighter">Compra Verificada</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

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
