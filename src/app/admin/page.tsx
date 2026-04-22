"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings, 
  Tag, 
  Package, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  Megaphone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';

export default function AdminDashboard() {
  const firestore = useFirestore();
  
  // Queries simplificadas para o dashboard
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'produtos'), limit(5)), [firestore]);
  const { data: recentProducts } = useCollection(productsQuery);
  
  const promosQuery = useMemoFirebase(() => query(collection(firestore, 'promocoes'), limit(2)), [firestore]);
  const { data: activePromos } = useCollection(promosQuery);

  const stats = [
    { label: 'Vendas Totais', value: 'R$ 12.450,00', icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Novos Pedidos', value: '24', icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Clientes', value: '1.205', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Produtos Ativos', value: '158', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-headline font-bold">Painel Administrativo</h1>
          <p className="text-muted-foreground">Controle total da sua loja VogueCraft.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/products">
              <Package className="w-4 h-4 mr-2" /> Ver Produtos
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/admin/products/new">
              <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2 border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" /> Marketing e Campanhas
                  </CardTitle>
                  <CardDescription>Gerencie promoções e descontos ativos.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  {activePromos?.length || 0} Ativas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activePromos?.map(promo => (
                <div key={promo.id} className={`p-4 rounded-xl border-2 ${promo.isBlackFriday ? 'border-black bg-black/5' : 'border-border'} flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${promo.isBlackFriday ? 'bg-black text-white' : 'bg-primary/10 text-primary'} rounded-lg flex items-center justify-center font-bold`}>
                      {promo.isBlackFriday ? 'BF' : <Tag className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold">{promo.nome}</h4>
                      <p className="text-sm text-muted-foreground">Desconto: {promo.valorDesconto}%</p>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/admin/promotions">Gerenciar</Link>
                  </Button>
                </div>
              ))}
              <Button asChild variant="link" className="w-full text-primary font-bold">
                <Link href="/admin/promotions">Ver Todas as Campanhas <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProducts?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded border overflow-hidden">
                        <img src={product.imagens?.[0] || 'https://placehold.co/100'} alt={product.nome} className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{product.nome}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{product.categoriaId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-sm">R$ {product.preco?.toFixed(2)}</p>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/products/${product.id}`}>Editar</Link>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/products">Ver Todo o Estoque</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <CardHeader>
              <CardTitle className="text-lg">Inteligência de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                Seus produtos em destaque estão gerando 40% mais cliques. Considere adicionar novos itens à categoria 'Acessórios' para a próxima semana.
              </p>
              <Button variant="secondary" size="sm" className="w-full">Analisar Tendências</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" /> Alertas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Jaqueta Jeans (M)</span>
                <Badge variant="destructive" className="h-5">2 restando</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Tênis Sport (42)</span>
                <Badge variant="destructive" className="h-5">Esgotado</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
