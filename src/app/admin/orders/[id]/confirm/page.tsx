
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { Loader2, CheckCircle, ArrowLeft, XCircle, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export default function ConfirmOrderAction() {
  const params = useParams();
  const id = params.id as string;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');

  useEffect(() => {
    async function confirmOrder() {
      // Aguarda o carregamento do usuário para verificar permissão
      if (isAuthLoading) return;
      
      // Verifica se o usuário é admin
      if (!user || (user.papel !== 'admin' && user.papel !== 'administrador')) {
        setStatus('unauthorized');
        return;
      }

      if (!id) return;
      
      try {
        // Busca o pedido pelo código (PED-...) ou pelo ID do documento
        let orderDocRef = null;
        
        const q = query(collection(firestore, 'pedidos'), where('codigo', '==', id));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          orderDocRef = snap.docs[0].ref;
        } else {
          // Se não achar pelo código, tenta pelo ID direto (caso seja um teste)
          const directDoc = doc(firestore, 'pedidos', id);
          orderDocRef = directDoc;
        }

        await updateDoc(orderDocRef, { status: 'confirmado' });
        setStatus('success');
        toast({ title: "Pedido Confirmado!", description: `O pedido #${id} agora está com status Confirmado.` });
      } catch (e: any) {
        console.error(e);
        // Se for erro de permissão do Firebase, tratamos especificamente
        if (e.message?.includes('permission')) {
          setStatus('unauthorized');
        } else {
          setStatus('error');
        }
      }
    }

    confirmOrder();
  }, [id, firestore, toast, user, isAuthLoading]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold">Verificando credenciais...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center space-y-6">
      {status === 'loading' && (
        <>
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <h1 className="text-3xl font-bold font-headline">Confirmando Pedido...</h1>
          <p className="text-muted-foreground">Processando alteração de status para o pedido #{id}.</p>
        </>
      )}

      {status === 'unauthorized' && (
        <>
          <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold font-headline">Acesso Necessário</h1>
          <p className="text-muted-foreground max-w-md">Você precisa estar logado como **Administrador** para confirmar este pedido.</p>
          <div className="flex gap-4">
            <Button asChild className="rounded-xl h-12 px-8">
              <Link href="/auth/login">Fazer Login</Link>
            </Button>
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-inner animate-in zoom-in duration-300">
            <CheckCircle className="w-14 h-14" />
          </div>
          <h1 className="text-5xl font-black text-green-700 font-headline">PEDIDO PEGO!</h1>
          <p className="text-muted-foreground text-lg max-w-md">O status foi atualizado para **Confirmado** com sucesso.</p>
          <div className="flex gap-4 pt-8">
            <Button asChild className="rounded-2xl h-14 px-10 text-lg font-bold shadow-lg">
              <Link href="/admin">Ir para o Painel</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground animate-pulse">Você já pode fechar esta aba e seguir com a entrega.</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold">Erro na Operação</h1>
          <p className="text-muted-foreground">Não conseguimos localizar ou atualizar o pedido #{id}.</p>
          <Button asChild variant="outline" className="rounded-xl border-2">
            <Link href="/admin"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel</Link>
          </Button>
        </>
      )}
    </div>
  );
}
