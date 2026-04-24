"use client";

import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, Zap, Star, Package, Heart, Search, ShoppingBag, MessageCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { SiteConfig } from '@/types';

const ICON_MAP: Record<string, any> = {
  Truck, ShieldCheck, Zap, ArrowRight, Star, Package, Heart
};

export default function Home() {
  const firestore = useFirestore();

  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const featuredQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'produtos'),
      where('isFeatured', '==', true),
      limit(8)
    );
  }, [firestore]);

  const { data: featuredProducts, isLoading } = useCollection(featuredQuery);

  const heroImage = config?.heroImage || 'https://picsum.photos/seed/fashion-hero/1200/600';

  const benefits = [
    { icon: ICON_MAP[config?.b1_icon || 'Truck'] || Truck, title: config?.b1_title || 'Frete Grátis', sub: config?.b1_sub || 'Em pedidos acima de R$250', active: config?.b1_active !== false },
    { icon: ICON_MAP[config?.b2_icon || 'ShieldCheck'] || ShieldCheck, title: config?.b2_title || 'Pagamento Seguro', sub: config?.b2_sub || '100% criptografado', active: config?.b2_active !== false },
    { icon: ICON_MAP[config?.b3_icon || 'Zap'] || Zap, title: config?.b3_title || 'Entrega Rápida', sub: config?.b3_sub || 'Todo o Brasil em 3-5 dias', active: config?.b3_active !== false },
    { icon: ICON_MAP[config?.b4_icon || 'ArrowRight'] || ArrowRight, title: config?.b4_title || 'Novidades', sub: config?.b4_sub || 'Lançamentos semanais exclusivos', active: config?.b4_active !== false },
  ].filter(b => b.active);

  const flowSteps = [
    {
      icon: Search,
      title: config?.step1_title || "Escolha seu Estilo",
      desc: config?.step1_desc || "Navegue por nossa curadoria de marcas premium e selecione suas peças favoritas."
    },
    {
      icon: ShoppingBag,
      title: config?.step2_title || "Finalize o Pedido",
      desc: config?.step2_desc || "Adicione à sacola e finalize o checkout em segundos. É rápido e seguro."
    },
    {
      icon: MessageCircle,
      title: config?.step3_title || "Confirmação VIP",
      desc: config?.step3_desc || "Nossa equipe entrará em contato via WhatsApp para confirmar o pagamento e entrega."
    },
    {
      icon: CheckCircle,
      title: config?.step4_title || "Receba em Casa",
      desc: config?.step4_desc || "Pronto! Seu pedido será enviado com todo cuidado e embalagem exclusiva."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Moda Moderna" 
            className="w-full h-full object-cover brightness-[0.8]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-background/20 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
            <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              {config?.heroBadge || 'Nova Coleção 2024'}
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight">
              {config?.heroTitle || 'Crie seu Estilo Único'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed text-balance">
              {config?.heroDescription || 'Descubra moda curada que combina artesanato de alta qualidade com silhuetas modernas. Elegância sem esforço para quem sabe o que quer.'}
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" asChild className="rounded-full px-10 h-14 text-base shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
                <Link href="/category/all">
                  Comprar Agora <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="text-primary border-primary rounded-full px-4 py-1 font-bold">GUIA DE COMPRA</Badge>
            <h2 className="text-4xl md:text-5xl font-headline font-bold">Como funciona a sua experiência?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Na Gold Dream, unimos a facilidade do digital com o atendimento personalizado exclusivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {flowSteps.map((step, idx) => (
              <div key={idx} className="group relative bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all hover:-translate-y-2">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border-4 border-white">
                  {idx + 1}
                </div>
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {benefits.length > 0 && (
        <section className="py-20 bg-white border-y">
          <div className="container mx-auto px-4">
            <div className={`grid grid-cols-2 ${benefits.length === 4 ? 'md:grid-cols-4' : benefits.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-12`}>
              {benefits.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary mb-2 shadow-sm">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-sm uppercase tracking-wider">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed px-4">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="space-y-4">
              <Badge variant="outline" className="border-accent text-accent rounded-full px-4 py-1">Destaques</Badge>
              <h2 className="text-4xl md:text-5xl font-headline font-bold">Peças Favoritas</h2>
              <p className="text-muted-foreground max-w-xl">Explore nossos designs mais populares, escolhidos por qualidade e estilo.</p>
            </div>
            <Button variant="link" asChild className="text-primary font-bold group">
              <Link href="/category/all">Ver tudo <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-2xl" />
              ))
            ) : (featuredProducts && featuredProducts.length > 0) ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">
                Nenhum produto em destaque encontrado.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}