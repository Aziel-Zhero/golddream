
"use client";

import React, { use } from 'react';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { ProductCard } from '@/components/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const firestore = useFirestore();

  const categoryTitle: Record<string, string> = {
    feminino: 'Moda Feminina',
    masculino: 'Moda Masculina',
    acessorios: 'Acessórios Premium',
    all: 'Toda a Coleção'
  };

  const productsQuery = useMemoFirebase(() => {
    if (slug === 'all') return collection(firestore, 'produtos');
    return query(collection(firestore, 'produtos'), where('categoriaId', '==', slug));
  }, [firestore, slug]);

  const { data: products, isLoading } = useCollection(productsQuery);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12 space-y-4">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início</Link>
        </Button>
        <h1 className="text-5xl font-headline font-bold capitalize">{categoryTitle[slug] || slug}</h1>
        <p className="text-muted-foreground text-lg">Descubra nossa seleção exclusiva de {slug}.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl">
          <p className="text-muted-foreground">Nenhum produto encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products?.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
