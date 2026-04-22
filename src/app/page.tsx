
"use client";

import Link from 'next/link';
import { ArrowRight, Truck, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const firestore = useFirestore();
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-fashion')?.imageUrl;

  // Busca configurações globais
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc(configRef);

  // Consulta para produtos em destaque
  const featuredQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'produtos'),
      where('isFeatured', '==', true),
      limit(8)
    );
  }, [firestore]);

  const { data: featuredProducts, isLoading } = useCollection(featuredQuery);

  const valueProps = [
    { 
      icon: Truck, 
      label: 'Frete Grátis', 
      sub: config?.freteInfo || 'Em pedidos acima de R$250' 
    },
    { 
      icon: ShieldCheck, 
      label: 'Pagamento Seguro', 
      sub: config?.pagamentoInfo || '100% criptografado' 
    },
    { 
      icon: Zap, 
      label: 'Entrega Rápida', 
      sub: config?.entregaInfo || 'Todo o Brasil em 3-5 dias' 
    },
    { 
      icon: ArrowRight, 
      label: 'Novidades', 
      sub: 'Lançamentos semanais exclusivos' 
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Moda Moderna" 
            className="w-full h-full object-cover brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              Nova Coleção 2024
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight">
              Crie seu Estilo <span className="text-primary italic">Único</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Descubra moda curada que combina artesanato de alta qualidade com silhuetas modernas. Elegância sem esforço para quem sabe o que quer.
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" asChild className="rounded-full px-8 h-12 text-base shadow-xl hover:scale-105 transition-transform">
                <Link href="/category/feminino">
                  Comprar Agora <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {valueProps.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary mb-2">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm uppercase tracking-wider">{item.label}</h4>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="border-accent text-accent rounded-full px-4 py-1">Destaques</Badge>
            <h2 className="text-4xl font-headline font-bold">Peças Favoritas</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Explore nossos designs mais populares, escolhidos por qualidade e estilo.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-xl" />
              ))
            ) : (featuredProducts && featuredProducts.length > 0) ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                Nenhum produto em destaque encontrado.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
