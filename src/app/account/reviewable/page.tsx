
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { EligibleReviewItem, Review } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2, PackageSearch, ArrowLeft, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ReviewableItemsPage() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [rating, setRating] = useState<Record<string, number>>({});
  const [comment, setComment] = useState<Record<string, string>>({});

  const elegiveisQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(collection(firestore, 'usuarios', user.uid, 'itens_elegiveis_avaliacao'), orderBy('deliveryDate', 'desc'));
  }, [user?.uid, firestore]);

  const { data: items, isLoading } = useCollection<EligibleReviewItem>(elegiveisQuery);

  const handleSubmitReview = async (item: EligibleReviewItem) => {
    const itemRating = rating[item.id] || 5;
    const itemComment = comment[item.id] || "";

    if (!user) return;
    setIsSubmitting(item.id);

    try {
      // 1. Criar a avaliação na coleção do produto
      const reviewRef = doc(collection(firestore, 'produtos', item.productId, 'avaliacoes'));
      await setDoc(reviewRef, {
        id: reviewRef.id,
        userId: user.uid,
        userName: user.nome,
        productId: item.productId,
        orderId: item.orderId,
        rating: itemRating,
        comment: itemComment,
        createdAt: new Date().toISOString()
      });

      // 2. Marcar como avaliado (remover da lista de elegíveis)
      await deleteDoc(doc(firestore, 'usuarios', user.uid, 'itens_elegiveis_avaliacao', item.id));

      toast({ title: "Avaliação Enviada!", description: "Obrigado por ajudar a comunidade Gold Dream!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao enviar", description: "Tente novamente em instantes." });
    } finally {
      setIsSubmitting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Carregando seus produtos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="mb-12">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link href="/account/orders"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos Pedidos</Link>
        </Button>
        <h1 className="text-4xl font-headline font-bold">Avaliar Compras</h1>
        <p className="text-muted-foreground">Sua opinião é fundamental para mantermos o padrão Gold Dream.</p>
      </div>

      {items?.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-[3rem] bg-muted/5 space-y-6">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
            <PackageSearch className="w-10 h-10 text-muted-foreground opacity-30" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">Nenhum item pendente</p>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Você só pode avaliar produtos de pedidos marcados como **Entregue** e em até 40 dias após o recebimento.
            </p>
          </div>
          <Button asChild className="rounded-2xl h-12 px-8">
            <Link href="/">Continuar Comprando</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {items?.map((item) => (
            <Card key={item.id} className="border-2 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-32 h-40 md:h-32 bg-muted rounded-2xl overflow-hidden border shrink-0">
                    <img src={item.productImage || 'https://placehold.co/200x200?text=Gold+Dream'} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-6">
                    <div>
                       <h3 className="text-xl font-black text-primary leading-tight">{item.productName}</h3>
                       <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Pedido: #{item.orderId.slice(-6)}</p>
                    </div>

                    <div className="space-y-4 pt-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sua Nota</Label>
                       <div className="flex gap-2">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <button
                             key={star}
                             onClick={() => setRating({...rating, [item.id]: star})}
                             className="hover:scale-110 transition-transform"
                           >
                             <Star 
                               className={`w-8 h-8 ${star <= (rating[item.id] || 5) ? 'text-yellow-500 fill-current' : 'text-muted'}`} 
                             />
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">O que você achou?</Label>
                      <Textarea 
                        placeholder="Conte-nos sobre o caimento, tecido e sua satisfação..." 
                        className="rounded-2xl min-h-[100px] border-2 focus-visible:ring-primary/20"
                        value={comment[item.id] || ""}
                        onChange={(e) => setComment({...comment, [item.id]: e.target.value})}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-4">
                       <div className="flex items-center gap-2 text-[10px] text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-full">
                          <Clock className="w-3 h-3" /> EXPIRE EM: {new Date(item.expiresAt).toLocaleDateString()}
                       </div>
                       <Button 
                         disabled={isSubmitting === item.id}
                         onClick={() => handleSubmitReview(item)}
                         className="rounded-2xl h-14 px-10 font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                       >
                         {isSubmitting === item.id ? <Loader2 className="animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                         ENVIAR AVALIAÇÃO
                       </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
