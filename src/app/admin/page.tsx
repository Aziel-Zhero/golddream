
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings, 
  Tag, 
  Package, 
  ArrowRight,
  PlusCircle,
  Megaphone,
  Send,
  Save,
  Loader2,
  Globe,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // Queries do dashboard
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'produtos'), limit(5)), [firestore]);
  const { data: recentProducts } = useCollection(productsQuery);
  
  const promosQuery = useMemoFirebase(() => query(collection(firestore, 'promocoes'), limit(2)), [firestore]);
  const { data: activePromos } = useCollection(promosQuery);

  // Configurações do site
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config, isLoading: isConfigLoading } = useDoc(configRef);

  const [siteSettings, setSiteSettings] = useState({
    telegramLink: '',
    freteInfo: '',
    entregaInfo: '',
    pagamentoInfo: ''
  });

  useEffect(() => {
    if (config) {
      setSiteSettings({
        telegramLink: config.telegramLink || '',
        freteInfo: config.freteInfo || '',
        entregaInfo: config.entregaInfo || '',
        pagamentoInfo: config.pagamentoInfo || ''
      });
    }
  }, [config]);

  const handleSaveSettings = () => {
    setDocumentNonBlocking(configRef, siteSettings, { merge: true });
    toast({
      title: "Configurações Salvas!",
      description: "As alterações já estão ativas no site público.",
    });
  };

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
              <Package className="w-4 h-4 mr-2" /> Gerenciar Estoque
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90">
            <Link href="/admin/products/new">
              <PlusCircle className="w-4 h-4 mr-2" /> Novo Produto
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Produtos e Promos */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Produtos Recentes</CardTitle>
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentProducts?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span className="truncate flex-1">{product.nome}</span>
                    <span className="font-bold ml-4">R$ {product.preco?.toFixed(2)}</span>
                  </div>
                ))}
                <Button asChild variant="link" size="sm" className="w-full">
                  <Link href="/admin/products">Ver todos os produtos <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Promoções Ativas</CardTitle>
                  <Tag className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activePromos?.map(promo => (
                  <div key={promo.id} className="flex items-center justify-between text-sm">
                    <span>{promo.nome}</span>
                    <Badge variant="secondary">{promo.valorDesconto}%</Badge>
                  </div>
                ))}
                <Button asChild variant="link" size="sm" className="w-full">
                  <Link href="/admin/promotions">Gerenciar campanhas <ArrowRight className="ml-1 w-3 h-3" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-primary/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle>Configurações Globais do Site</CardTitle>
              </div>
              <CardDescription>Edite links e informações de rodapé/benefícios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Link do Grupo Telegram</Label>
                  <div className="relative">
                    <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      className="pl-10" 
                      value={siteSettings.telegramLink} 
                      onChange={e => setSiteSettings({...siteSettings, telegramLink: e.target.value})}
                      placeholder="https://t.me/..." 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Informação de Frete</Label>
                  <Input 
                    value={siteSettings.freteInfo} 
                    onChange={e => setSiteSettings({...siteSettings, freteInfo: e.target.value})}
                    placeholder="Ex: Em pedidos acima de R$250" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Informação de Pagamento</Label>
                  <Input 
                    value={siteSettings.pagamentoInfo} 
                    onChange={e => setSiteSettings({...siteSettings, pagamentoInfo: e.target.value})}
                    placeholder="Ex: 100% criptografado" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Informação de Entrega</Label>
                  <Input 
                    value={siteSettings.entregaInfo} 
                    onChange={e => setSiteSettings({...siteSettings, entregaInfo: e.target.value})}
                    placeholder="Ex: Todo o Brasil em 3-5 dias" 
                  />
                </div>
              </div>
              <Button onClick={handleSaveSettings} className="w-full">
                <Save className="w-4 h-4 mr-2" /> Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Resumo */}
        <div className="space-y-8">
          <Card className="bg-primary text-white">
            <CardHeader>
              <CardTitle className="text-lg">Dicas Administrativas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4 opacity-90">
              <p>Mantenha as fotos dos produtos atualizadas para aumentar a conversão.</p>
              <p>O link do Telegram é exibido no botão azul no rodapé de todas as páginas.</p>
              <p>Durante a Black Friday, ative o selo específico nas configurações da campanha.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild size="sm">
                <Link href="/admin/products/new">Novo Item</Link>
              </Button>
              <Button variant="outline" asChild size="sm">
                <Link href="/admin/promotions">Nova Promo</Link>
              </Button>
              <Button variant="outline" asChild size="sm" className="col-span-2">
                <Link href="/" target="_blank">Ver Loja <ExternalLink className="ml-2 w-3 h-3" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
