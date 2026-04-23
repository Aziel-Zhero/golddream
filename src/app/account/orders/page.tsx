
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Pedido } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, Package, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const firestore = useFirestore();

  // Query otimizada para buscar apenas os pedidos do usuário atual
  // Isso deve coincidir exatamente com a regra de segurança para permitir a listagem
  const ordersQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    return query(
      collection(firestore, 'pedidos'),
      where('usuarioId', '==', user.uid),
      orderBy('dataCriacao', 'desc'),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: orders, isLoading, error } = useCollection<Pedido>(ordersQuery);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Carregando seu histórico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto border-2 border-red-100">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">Erro de Permissão</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Não conseguimos acessar seu histórico de compras. Verifique se você está logado corretamente.
        </p>
        <Button onClick={() => window.location.reload()} className="rounded-xl px-8">Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <Button asChild variant="ghost" className="mb-4 -ml-4 hover:bg-primary/5 text-primary font-bold">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Loja</Link>
          </Button>
          <h1 className="text-4xl font-headline font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground">Acompanhe o status de suas compras na Gold Dream.</p>
        </div>
        {orders && orders.length > 0 && (
          <div className="bg-primary/5 px-6 py-4 rounded-2xl border-2 border-primary/10 shadow-sm">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total de Compras</p>
            <p className="text-3xl font-black">{orders.length}</p>
          </div>
        )}
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-3xl space-y-6 bg-muted/5">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-40" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">Sua sacola está te esperando!</p>
            <p className="text-muted-foreground">Você ainda não realizou nenhum pedido em nossa loja.</p>
          </div>
          <Button asChild className="rounded-2xl h-14 px-10 text-lg font-bold shadow-lg">
            <Link href="/">Começar a Comprar</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <Card key={order.id} className="border-2 shadow-sm rounded-3xl overflow-hidden hover:border-primary/20 transition-all bg-white">
              <CardHeader className="bg-muted/20 border-b flex flex-row justify-between items-center py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-primary/5">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Pedido Identificado</p>
                    <p className="font-black text-primary text-lg">#{order.codigo}</p>
                  </div>
                </div>
                <Badge 
                  className={`rounded-full px-4 py-1.5 font-black text-[10px] shadow-sm ${
                    order.status === 'entregue' ? 'bg-green-500 hover:bg-green-600' : 
                    order.status === 'cancelado' ? 'bg-red-500 hover:bg-red-600' : 
                    order.status === 'confirmado' ? 'bg-blue-500 hover:bg-blue-600' :
                    'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {(order.status || 'pendente').replace('_', ' ').toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Produtos Selecionados
                    </p>
                    <div className="space-y-4">
                      {order.itens.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start group">
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{item.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase">
                              Tamanho: {item.tamanho} | Cor: {item.cor} (x{item.quantidade})
                            </p>
                          </div>
                          <p className="font-black text-sm text-foreground">R$ {(item.valor * item.quantidade).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Resumo Financeiro
                    </p>
                    <div className="bg-muted/10 p-5 rounded-2xl border-2 border-primary/5 space-y-3 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span className="font-bold">R$ {order.subtotal.toFixed(2)}</span></div>
                      {order.desconto > 0 && <div className="flex justify-between text-green-600"><span className="font-bold uppercase text-[10px] tracking-widest">Desconto Aplicado:</span><span className="font-bold">- R$ {order.desconto.toFixed(2)}</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">Taxa de Entrega:</span><span className="font-bold">R$ {order.frete.toFixed(2)}</span></div>
                      <Separator className="my-2 bg-primary/10" />
                      <div className="flex justify-between items-end"><span className="font-black text-xs uppercase tracking-tighter">Valor Final:</span><span className="font-black text-2xl text-primary leading-none">R$ {order.total.toFixed(2)}</span></div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 px-1">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        Realizado em: {new Date(order.dataCriacao).toLocaleDateString()} às {new Date(order.dataCriacao).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
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
