
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShoppingBag, 
  Settings, 
  Tag, 
  Package, 
  ArrowRight,
  PlusCircle,
  Save,
  MapPin,
  Ticket,
  Truck,
  Zap,
  ShieldCheck,
  Star,
  Heart,
  LayoutDashboard,
  ExternalLink,
  ClipboardList,
  CheckCircle2,
  Clock,
  User as UserIcon,
  HelpCircle,
  FileText,
  Trash2,
  XCircle,
  TrendingUp,
  MessageSquare,
  Send,
  Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, limit, doc, orderBy, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pedido, TelegramConfig } from '@/types';

const ICONS = ['Truck', 'ShieldCheck', 'Zap', 'ArrowRight', 'Star', 'Package', 'Heart'];

const SUPPORT_PAGES = [
  { id: 'envio-e-frete', title: 'Envio e Frete' },
  { id: 'trocas-e-devolucoes', title: 'Trocas e Devoluções' },
  { id: 'guia-de-tamanhos', title: 'Guia de Tamanhos' },
  { id: 'faq', title: 'FAQ (Perguntas Frequentes)' }
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  // Queries
  const ordersQuery = useMemoFirebase(() => query(collection(firestore, 'pedidos'), orderBy('dataCriacao', 'desc')), [firestore]);
  const { data: allOrders } = useCollection<Pedido>(ordersQuery);

  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc(configRef);

  const telegramRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'telegram'), [firestore]);
  const { data: telegramData } = useDoc(telegramRef);

  const fretesQuery = useMemoFirebase(() => collection(firestore, 'fretes'), [firestore]);
  const { data: fretes } = useCollection(fretesQuery);

  const cuponsQuery = useMemoFirebase(() => collection(firestore, 'cupons'), [firestore]);
  const { data: cupons } = useCollection(cuponsQuery);

  // States
  const [siteSettings, setSiteSettings] = useState<any>({
    heroBadge: '', heroTitle: '', heroDescription: '', heroImage: '',
    telegramLink: '',
    b1_title: '', b1_sub: '', b1_icon: 'Truck',
    b2_title: '', b2_sub: '', b2_icon: 'ShieldCheck',
    b3_title: '', b3_sub: '', b3_icon: 'Zap',
    b4_title: '', b4_sub: '', b4_icon: 'ArrowRight'
  });

  const [tgConfig, setTgConfig] = useState<TelegramConfig>({
    botToken: '', chatId: '', testChatId: '', headerImage: '', isActive: false
  });

  const [supportContents, setSupportContents] = useState<Record<string, string>>({});
  const [newFrete, setNewFrete] = useState({ cidade: '', bairro: '', valor: 0 });
  const [newCupom, setNewCupom] = useState({ codigo: '', desconto: 0, expira: false, dataExpiracao: '' });

  // Dashboard Metrics
  const metrics = useMemo(() => {
    if (!allOrders) return { month: 0, delivered: 0, cancelled: 0 };
    const now = new Date();
    const thisMonth = allOrders.filter(o => {
      const date = new Date(o.dataCriacao);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    const delivered = allOrders.filter(o => o.status === 'entregue').length;
    const cancelled = allOrders.filter(o => o.status === 'cancelado').length;
    return { month: thisMonth, delivered, cancelled };
  }, [allOrders]);

  useEffect(() => {
    if (config) setSiteSettings({ ...siteSettings, ...config });
  }, [config]);

  useEffect(() => {
    if (telegramData) setTgConfig({ ...tgConfig, ...telegramData });
  }, [telegramData]);

  const handleUpdateStatus = (id: string, newStatus: 'entregue' | 'cancelado') => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', id), { status: newStatus });
    toast({ title: `Pedido ${newStatus === 'entregue' ? 'Entregue' : 'Cancelado'}` });
  };

  const handleSaveTelegram = () => {
    setDoc(telegramRef, tgConfig, { merge: true });
    toast({ title: "Configurações Telegram Salvas" });
  };

  const handleTestTelegram = async () => {
    if (!tgConfig.botToken || !tgConfig.testChatId) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha o Token e o ID de Teste." });
      return;
    }
    try {
      const text = encodeURIComponent("🔔 *TESTE GOLD DREAM*\nIntegração configurada com sucesso!");
      const url = `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage?chat_id=${tgConfig.testChatId}&text=${text}&parse_mode=Markdown`;
      await fetch(url);
      toast({ title: "Teste Enviado!", description: "Verifique seu Telegram." });
    } catch (e) {
      toast({ variant: "destructive", title: "Falha no Teste" });
    }
  };

  const handleSaveSettings = () => {
    setDoc(configRef, siteSettings, { merge: true });
    toast({ title: "Configurações Salvas!" });
  };

  const handleDeleteItem = (coll: string, id: string) => {
    if (confirm('Deseja realmente excluir permanentemente?')) {
      deleteDocumentNonBlocking(doc(firestore, coll, id));
      toast({ title: "Item Removido" });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-headline font-bold">Admin Gold Dream</h1>
          <p className="text-muted-foreground">Gestão completa da Multimarcas.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/"><ExternalLink className="w-4 h-4 mr-2" /> Ver Loja</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo Produto</Link>
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-2 border-primary/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pedidos no Mês</p>
              <h3 className="text-3xl font-black">{metrics.month}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Entregues</p>
              <h3 className="text-3xl font-black">{metrics.delivered}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-500/10">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cancelados</p>
              <h3 className="text-3xl font-black">{metrics.cancelled}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 bg-muted p-1 rounded-xl h-auto">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="home">Home</TabsTrigger>
          <TabsTrigger value="catalog">Produtos</TabsTrigger>
          <TabsTrigger value="frete">Fretes</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="api">API/Telegram</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Pedidos</CardTitle>
                <CardDescription>Gerencie o fluxo de entrega e status.</CardDescription>
              </div>
              <ClipboardList className="w-8 h-8 text-primary opacity-20" />
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum pedido registrado.</TableCell></TableRow>
                    ) : allOrders?.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-bold">{order.codigo}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.clienteNome}</span>
                            <span className="text-[10px] text-muted-foreground">{order.clienteTelefone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              order.status === 'entregue' ? 'bg-green-50 text-green-700 border-green-200' :
                              order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }
                          >
                            {order.status === 'entregue' ? 'Entregue' : order.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 h-8" onClick={() => handleUpdateStatus(order.id, 'entregue')}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Entregue
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 h-8" onClick={() => handleUpdateStatus(order.id, 'cancelado')}>
                              <XCircle className="w-3 h-3 mr-1" /> Cancelar
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteItem('pedidos', order.id)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-6 h-6 text-[#0088cc]" />
                Integração Telegram Bot
              </CardTitle>
              <CardDescription>Configure as notificações de pedidos para seu grupo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Bot Token (HTTP API)</Label>
                  <Input type="password" value={tgConfig.botToken} onChange={e => setTgConfig({...tgConfig, botToken: e.target.value})} placeholder="00000000:AA..."/>
                </div>
                <div className="space-y-2">
                  <Label>Chat ID Principal</Label>
                  <Input value={tgConfig.chatId} onChange={e => setTgConfig({...tgConfig, chatId: e.target.value})} placeholder="-100..."/>
                </div>
                <div className="space-y-2">
                  <Label>Chat ID de Teste (Seu ID Pessoal)</Label>
                  <Input value={tgConfig.testChatId} onChange={e => setTgConfig({...tgConfig, testChatId: e.target.value})} placeholder="12345678"/>
                </div>
                <div className="space-y-2">
                  <Label>Imagem de Cabeçalho (URL)</Label>
                  <div className="flex gap-2">
                    <Input value={tgConfig.headerImage} onChange={e => setTgConfig({...tgConfig, headerImage: e.target.value})} placeholder="https://..."/>
                    <div className="w-10 h-10 border rounded bg-muted flex items-center justify-center shrink-0">
                      {tgConfig.headerImage ? <img src={tgConfig.headerImage} className="w-full h-full object-cover" /> : <Camera className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-xl">
                <input type="checkbox" id="tgactive" checked={tgConfig.isActive} onChange={e => setTgConfig({...tgConfig, isActive: e.target.checked})} className="w-5 h-5 accent-[#0088cc]" />
                <Label htmlFor="tgactive" className="cursor-pointer font-bold">Ativar Notificações no Telegram</Label>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveTelegram} className="flex-1 bg-[#0088cc] hover:bg-[#0088cc]/90 h-12">
                  <Save className="w-4 h-4 mr-2" /> Salvar Configurações
                </Button>
                <Button onClick={handleTestTelegram} variant="outline" className="h-12">
                  <MessageSquare className="w-4 h-4 mr-2" /> Enviar Teste
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="home" className="space-y-8">
           {/* Conteúdo já existente de home settings */}
           <Card className="border-2">
            <CardHeader><CardTitle>Seção Hero (Banner)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Badge</Label><Input value={siteSettings.heroBadge} onChange={e => setSiteSettings({...siteSettings, heroBadge: e.target.value})} /></div>
              <div className="space-y-2"><Label>Título</Label><Input value={siteSettings.heroTitle} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Input value={siteSettings.heroDescription} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} /></div>
              <div className="space-y-2"><Label>Hero Image URL</Label><Input value={siteSettings.heroImage} onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})} /></div>
              <Button onClick={handleSaveSettings} className="w-full mt-4"><Save className="w-4 h-4 mr-2" /> Salvar Hero</Button>
            </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <div className="space-y-6">
             <Card><CardHeader><CardTitle>Catálogo Gold Dream</CardTitle></CardHeader>
             <CardContent className="flex flex-wrap gap-4">
               <Button asChild size="lg" className="rounded-xl"><Link href="/admin/products">Gerenciar Lista de Produtos</Link></Button>
               <Button asChild variant="outline" size="lg" className="rounded-xl"><Link href="/admin/promotions">Promoções e Black Friday</Link></Button>
             </CardContent></Card>
          </div>
        </TabsContent>

        {/* ... manter abas de frete, cupons e suporte ... */}
        <TabsContent value="frete" className="space-y-6">
          <Card className="border-2">
            <CardHeader><CardTitle>Tabela de Fretes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end bg-muted/30 p-4 rounded-xl">
                <div className="space-y-2"><Label>Cidade</Label><Input value={newFrete.cidade} onChange={e => setNewFrete({...newFrete, cidade: e.target.value})} /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={newFrete.bairro} onChange={e => setNewFrete({...newFrete, bairro: e.target.value})} /></div>
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={newFrete.valor} onChange={e => setNewFrete({...newFrete, valor: parseFloat(e.target.value)})} /></div>
                <Button onClick={() => {
                  setDoc(doc(firestore, 'fretes', `${newFrete.cidade}-${newFrete.bairro}`), newFrete);
                  setNewFrete({ cidade: '', bairro: '', valor: 0 });
                }} className="rounded-xl">Adicionar</Button>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted"><TableRow><TableHead>Cidade</TableHead><TableHead>Bairro</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fretes?.map(f => (
                      <TableRow key={f.id}><TableCell>{f.cidade}</TableCell><TableCell>{f.bairro}</TableCell><TableCell>R$ {f.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleDeleteItem('fretes', f.id)} className="text-destructive">Remover</Button></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
