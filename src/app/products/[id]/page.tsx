
"use client";

import React, { use } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { ProductClient } from './ProductClient';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: Props) {
  const { id } = use(params);
  const firestore = useFirestore();
  
  const productRef = useMemoFirebase(() => doc(firestore, 'produtos', id), [firestore, id]);
  const { data: product, isLoading: isProductLoading } = useDoc(productRef);

  const relatedQuery = useMemoFirebase(() => {
    if (!product) return null;
    return query(
      collection(firestore, 'produtos'),
      where('categoriaId', '==', product.categoriaId),
      limit(5)
    );
  }, [firestore, product?.categoriaId]);

  const { data: relatedProducts, isLoading: isRelatedLoading } = useCollection(relatedQuery);

  if (isProductLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-[4/5] w-full rounded-3xl" />
          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-12 w-full max-w-md rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-1 bg-muted w-full" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-headline font-bold">Produto não encontrado</h1>
        <p className="text-muted-foreground mt-4">O item que você está procurando não existe ou foi removido.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <ProductClient 
        product={product} 
        relatedProducts={(relatedProducts || []).filter(p => p.id !== product.id)} 
      />
    </div>
  );
}
