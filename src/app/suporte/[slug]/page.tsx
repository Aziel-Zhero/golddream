
"use client";

import React, { use } from 'react';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, ArrowLeft, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function SuportePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const firestore = useFirestore();

  const suporteRef = useMemoFirebase(() => doc(firestore, 'suporte', slug), [firestore, slug]);
  const { data: page, isLoading } = useDoc(suporteRef);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando informações...</p>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <HelpCircle className="w-20 h-20 text-muted-foreground mx-auto" />
        <h1 className="text-4xl font-headline font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          O conteúdo que você está procurando ainda não foi cadastrado ou foi removido.
        </p>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Loja</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="mb-12">
        <Button asChild variant="ghost" className="mb-6 -ml-4">
          <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Início</Link>
        </Button>
        <h1 className="text-5xl font-headline font-bold text-primary mb-4">{page.titulo}</h1>
        <Separator className="h-[4px] w-24 bg-primary/20 rounded-full" />
      </div>

      <div className="bg-white rounded-3xl border shadow-sm p-8 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {page.conteudo}
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-muted/30 p-6 rounded-2xl border border-primary/5">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold uppercase tracking-tight text-sm">Sua Segurança é Prioridade</p>
              <p className="text-xs text-muted-foreground">Gold Dream Multimarcas - Transparência total com você.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-2">
            <Link href="/checkout">Ir para o Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
