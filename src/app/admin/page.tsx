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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
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
          <p className="text-muted-foreground">Gerencie sua loja, produtos e campanhas em um só lugar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full">
            <Settings className="w-4 h-4 mr-2" /> Configurações
          </Button>
          <Button asChild className="rounded-full bg-accent hover:bg-accent/90">
            <Link href="/admin/products/new">
              <Package className="w-4 h-4 mr-2" /> Novo Produto
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
        {/* Quick Actions & Marketing */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2 border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" /> Campanhas e Promoções
                  </CardTitle>
                  <CardDescription>Ative ofertas especiais e Black Friday.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">2 Ativas</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-dashed border-red-200 bg-red-50/30 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center font-bold italic">BF</div>
                  <div>
                    <h4 className="font-bold">Campanha Black Friday</h4>
                    <p className="text-sm text-muted-foreground">Status: Programada para 24/11</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-100">Configurar</Button>
              </div>
              <div className="p-4 rounded-xl border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-lg flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
                  <div>
                    <h4 className="font-bold">Desconto Progressivo Verão</h4>
                    <p className="text-sm text-muted-foreground">Status: Ativa no site</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Editar</Button>
              </div>
              <Button variant="link" className="w-full text-primary font-bold">Ver Todas as Campanhas <ArrowRight className="ml-2 w-4 h-4" /></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 hover:bg-muted/30 rounded-lg transition-colors border-b last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded border overflow-hidden">
                        <img src={`https://picsum.photos/seed/${i}/100/100`} alt="Product" className="object-cover w-full h-full" />
                      </div>
                      <div>
                        <p className="font-medium">Camiseta Classic V{i}</p>
                        <p className="text-xs text-muted-foreground">ID: #PROD-00{i}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold">R$ 89,90</p>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </div>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/products">Gerenciar Todo o Estoque</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Alerts & Tasks */}
        <div className="space-y-8">
          <Card className="bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <CardHeader>
              <CardTitle className="text-lg">Dica do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                Sua loja teve um aumento de 15% nas visitas após a integração com a IA Stylist. Tente adicionar mais descrições detalhadas aos produtos para melhorar as recomendações.
              </p>
              <Button variant="secondary" size="sm" className="w-full">Ler Relatório</Button>
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
              <div className="flex items-center justify-between text-sm">
                <span>Boné Classic</span>
                <Badge variant="outline" className="h-5 text-orange-600 bg-orange-50 border-orange-200">5 restando</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
