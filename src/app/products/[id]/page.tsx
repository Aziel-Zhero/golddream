
"use client";

import React, { use } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
import { ProductClient } from './ProductClient';
import { Loader2 } from 'lucide-react';

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
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando detalhes do produto...</p>
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
