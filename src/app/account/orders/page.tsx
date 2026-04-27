'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, Package, Clock, XCircle, ArrowLeft, MailWarning, Send, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface PedidoItem {
  nome: string;
  tamanho: string;
  cor: string;
  quantidade: number;
  valor: number;
}

interface Pedido {
  id: string;
  codigo: string;
  status: string;
  dataCriacao: string;
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
  itens: PedidoItem[];
  clienteNome?: string;
  clienteTelefone?: string;
  usuarioId: string;
}

export default function OrdersPage() {
  const { user, sendVerification, isAdmin, isLoading: isAuthLoading } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPedidos() {
      if (!user?.uid) {
        if (!isAuthLoading) setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let pedidosQuery;
        
        if (isAdmin) {
          pedidosQuery = query(
            collection(firestore, 'pedidos'),
            limit(100)
          );
        } else {
          pedidosQuery = query(
            collection(firestore, 'pedidos'),
            where('usuarioId', '==', user.uid),
            limit(50)
          );
        }

        const querySnapshot = await getDocs(pedidosQuery);
        
        const pedidosData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pedido[];
        
        const sortedPedidos = pedidosData.sort((a, b) => 
          new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
        );
        
        setPedidos(sortedPedidos);
      } catch (err: any) {
        console.error('Erro ao buscar pedidos:', err);
        setError(err.message || 'Erro ao carregar pedidos');
      } finally {
        setIsLoading(false);
      }
    }

    if (!isAuthLoading) {
      fetchPedidos();
    }
  }, [user?.uid, isAdmin, isAuthLoading, firestore]);

  const handleSendVerification = async () => {
    setIsSendingVerification(true);
    try {
      await sendVerification();
      toast({
        title: "E-mail Enviado!",
        description: "Verifique sua caixa de entrada e spam para confirmar sua conta.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Aguarde alguns minutos antes de tentar novamente.",
      });
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Carregando seus pedidos...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <p className="text-muted-foreground">Faça login para ver seus pedidos.</p>
        <Button asChild className="mt-4">
          <Link href="/auth/login">Entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      {/* Banner de Verificação de E-mail */}
      {user && !user.emailVerified && (
        <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-yellow-800">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <MailWarning className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold">Confirme seu E-mail</p>
              <p className="text-sm opacity-80">Você precisa confirmar seu e-mail para garantir a segurança total da sua conta.</p>
            </div>
          </div>
          <Button 
            onClick={handleSendVerification} 
            disabled={isSendingVerification}
            className="rounded-2xl h-12 px-6 bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
          >
            {isSendingVerification ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar Confirmação
          </Button>
        </div>
      )}

      {isAdmin && (
        <div className="mb-8 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center gap-3 text-blue-800">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <p className="text-sm font-bold">👑 Modo Administrativo: Visualizando todos os pedidos</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
        <div>
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a Loja</Link>
          </Button>
          <h1 className="text-4xl font-bold">
            {isAdmin ? 'Gestão de Pedidos' : 'Meus Pedidos'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Acompanhe as vendas em tempo real.' : 'Acompanhe o status de suas compras.'}
          </p>
        </div>
        {pedidos.length > 0 && (
          <div className="bg-primary/5 px-6 py-4 rounded-2xl">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Total</p>
            <p className="text-3xl font-black">{pedidos.length}</p>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-24 border-2 border-red-100 rounded-3xl space-y-6 bg-red-50/50">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-red-800">Erro ao carregar</p>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              {error}
            </p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline">
            Tentar Novamente
          </Button>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-3xl space-y-6 bg-muted/5">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 text-muted-foreground opacity-40" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold text-muted-foreground">Nenhum pedido encontrado</p>
            <p className="text-muted-foreground">Você ainda não realizou nenhum pedido.</p>
          </div>
          {!isAdmin && (
            <Button asChild>
              <Link href="/">Começar a Comprar</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {pedidos.map((order) => (
            <Card key={order.id} className="border-2 rounded-3xl overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/20 border-b flex flex-row justify-between items-center py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Pedido</p>
                    <p className="font-black text-primary text-lg">#{order.codigo}</p>
                  </div>
                </div>
                <Badge 
                  className={`rounded-full px-4 py-1.5 font-black text-[10px] ${
                    order.status === 'entregue' ? 'bg-green-500' : 
                    order.status === 'cancelado' ? 'bg-red-500' : 
                    order.status === 'confirmado' ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}
                >
                  {(order.status || 'pendente').toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {/* Correção de Hydration: div em vez de p para conter div */}
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      Produtos Selecionados
                    </div>
                    <div className="space-y-4">
                      {order.itens?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-sm">{item.nome}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {item.tamanho} | {item.cor} (x{item.quantidade})
                            </p>
                          </div>
                          <p className="font-black text-sm">R$ {(item.valor * item.quantidade).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                       Resumo Financeiro
                    </div>
                    <div className="bg-muted/10 p-5 rounded-2xl space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span className="font-bold">R$ {order.subtotal?.toFixed(2)}</span>
                      </div>
                      {order.desconto > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Desconto:</span>
                          <span>- R$ {order.desconto?.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span className="font-bold">R$ {order.frete?.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="font-black">Total:</span>
                        <span className="font-black text-2xl text-primary">R$ {order.total?.toFixed(2)}</span>
                      </div>
                    </div>
                    {isAdmin && order.clienteNome && (
                      <div className="text-xs text-blue-600 font-bold bg-blue-50 p-3 rounded-xl border border-blue-100">
                        Cliente: {order.clienteNome} ({order.clienteTelefone})
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold">
                      <Clock className="w-3 h-3" />
                      DATA: {new Date(order.dataCriacao).toLocaleString()}
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
