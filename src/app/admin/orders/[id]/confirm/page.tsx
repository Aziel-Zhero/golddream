
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Loader2, CheckCircle, ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ConfirmOrderAction() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function confirmOrder() {
      if (!id) return;
      
      try {
        // Busca o pedido pelo código (que é usado no link do Telegram)
        const q = query(collection(firestore, 'pedidos'), where('codigo', '==', id));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const orderDoc = snap.docs[0];
          await updateDoc(orderDoc.ref, { status: 'confirmado' });
          setStatus('success');
          toast({ title: "Pedido Confirmado!", description: `O pedido #${id} agora está com status Confirmado.` });
        } else {
          // Tenta buscar pelo ID direto se não achar pelo código
          const docRef = doc(firestore, 'pedidos', id);
          await updateDoc(docRef, { status: 'confirmado' });
          setStatus('success');
          toast({ title: "Pedido Confirmado!" });
        }
      } catch (e) {
        console.error(e);
        setStatus('error');
      }
    }

    confirmOrder();
  }, [id, firestore, toast]);

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center space-y-6">
      {status === 'loading' && (
        <>
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <h1 className="text-3xl font-bold">Processando confirmação...</h1>
          <p className="text-muted-foreground">Estamos atualizando o status do pedido #{id}.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-green-700">PEDIDO CONFIRMADO!</h1>
          <p className="text-muted-foreground text-lg max-w-md">O status foi atualizado com sucesso no banco de dados.</p>
          <div className="flex gap-4 pt-8">
            <Button asChild className="rounded-xl h-12 px-8">
              <Link href="/admin">Ir para o Painel</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">Você já pode fechar esta aba.</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold">Erro ao confirmar</h1>
          <p className="text-muted-foreground">Não conseguimos localizar ou atualizar o pedido #{id}.</p>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel</Link>
          </Button>
        </>
      )}
    </div>
  );
}
