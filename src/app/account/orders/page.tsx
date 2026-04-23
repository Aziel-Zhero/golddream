
"use client";

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
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

  const ordersQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'pedidos'),
      where('usuarioId', '==', user.uid),
      orderBy('dataCriacao', 'desc')
    );
  }, [firestore, user]);

  const { data: orders, isLoading } = useCollection<Pedido>(ordersQuery);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando seus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Início</Link>
          </Button>
          <h1 className="text-4xl font-headline font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground">Acompanhe o status das suas compras na Gold Dream.</p>
        </div>
        <div className="bg-primary/5 px-6 py-4 rounded-2xl border border-primary/10">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Total de Pedidos</p>
          <p className="text-3xl font-black">{orders?.length || 0}</p>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-3xl space-y-6">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
          <p className="text-muted-foreground text-lg">Você ainda não realizou nenhum pedido.</p>
          <Button asChild className="rounded-xl h-12 px-8">
            <Link href="/">Começar a Comprar</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => (
            <Card key={order.id} className="border-2 shadow-sm rounded-3xl overflow-hidden hover:border-primary/20 transition-colors">
              <CardHeader className="bg-muted/30 border-b flex flex-row justify-between items-center py-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-xl shadow-sm border">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Código do Pedido</p>
                    <p className="font-black text-primary">#{order.codigo}</p>
                  </div>
                </div>
                <Badge 
                  className={`rounded-full px-4 py-1 font-black text-[10px] ${
                    order.status === 'entregue' ? 'bg-green-500 hover:bg-green-600' : 
                    order.status === 'cancelado' ? 'bg-red-500 hover:bg-red-600' : 
                    'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  {order.status === 'entregue' ? 'ENTREGUE' : order.status === 'cancelado' ? 'CANCELADO' : 'PENDENTE'}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Itens do Pedido</p>
                    <div className="space-y-3">
                      {order.itens.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm">{item.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-black uppercase">{item.tamanho} | {item.cor} (x{item.quantidade})</p>
                          </div>
                          <p className="font-black text-sm">R$ {(item.valor * item.quantidade).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resumo e Entrega</p>
                    <div className="bg-muted/20 p-4 rounded-2xl border space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span className="font-bold">R$ {order.subtotal.toFixed(2)}</span></div>
                      {order.desconto > 0 && <div className="flex justify-between text-green-600"><span className="font-bold">Desconto:</span><span className="font-bold">- R$ {order.desconto.toFixed(2)}</span></div>}
                      <div className="flex justify-between"><span className="text-muted-foreground">Frete:</span><span className="font-bold">R$ {order.frete.toFixed(2)}</span></div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-lg"><span className="font-black">Total:</span><span className="font-black text-primary">R$ {order.total.toFixed(2)}</span></div>
                    </div>
                    <div className="flex items-start gap-2 pt-2">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Realizado em: {new Date(order.dataCriacao).toLocaleString()}</p>
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
