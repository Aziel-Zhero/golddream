
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
  Info,
  Power,
  PowerOff,
  Globe,
  Loader2,
  ChevronDown,
  Instagram,
  Facebook,
  Twitter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, doc, orderBy, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pedido, TelegramConfig, FreteRule, Cupom, SiteConfig } from '@/types';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_TEMPLATE = `🛍️ *NOVO PEDIDO - GOLD DREAM*

🧾 *Código:* #{{codigo}}

📦 *Itens:*
{{itens}}

👤 *Cliente:* {{clienteNome}}
📍 *Endereço:* {{clienteEndereco}}

💰 *TOTAL: R$ {{total}}*`;

export default function AdminDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const isAdmin = user?.papel === 'admin' || user?.papel === 'administrador';

  const ordersQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    return query(collection(firestore, 'pedidos'), orderBy('dataCriacao', 'desc'));
  }, [firestore, isAdmin]);
  
  const { data: allOrders, error: ordersError } = useCollection<Pedido>(ordersQuery);

  const configRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'configuracoes', 'geral') : null, [firestore, isAdmin]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const telegramRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'configuracoes', 'telegram') : null, [firestore, isAdmin]);
  const { data: telegramData } = useDoc<TelegramConfig>(telegramRef);

  const fretesQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'fretes') : null, [firestore, isAdmin]);
  const { data: fretes } = useCollection<FreteRule>(fretesQuery);

  const cuponsQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'cupons') : null, [firestore, isAdmin]);
  const { data: cupons } = useCollection<Cupom>(cuponsQuery);

  const [siteSettings, setSiteSettings] = useState<SiteConfig>({
    heroBadge: '', heroTitle: '', heroDescription: '', heroImage: '',
    telegramLink: '', instagramLink: '', facebookLink: '', twitterLink: '',
    b1_title: '', b1_sub: '', b1_icon: 'Truck', b1_active: true,
    b2_title: '', b2_sub: '', b2_icon: 'ShieldCheck', b2_active: true,
    b3_title: '', b3_sub: '', b3_icon: 'Zap', b3_active: true,
    b4_title: '', b4_sub: '', b4_icon: 'ArrowRight', b4_active: true
  });

  const [tgConfig, setTgConfig] = useState<TelegramConfig>({
    botToken: '', chatId: '', testChatId: '', messageTemplate: DEFAULT_TEMPLATE, isActive: false
  });

  const [newFrete, setNewFrete] = useState<Partial<FreteRule>>({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
  const [newCupom, setNewCupom] = useState<Partial<Cupom>>({ codigo: '', desconto: 0, expira: false, dataExpiracao: '' });

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
    if (config) setSiteSettings((prev) => ({ ...prev, ...config }));
  }, [config]);

  useEffect(() => {
    if (telegramData) setTgConfig((prev) => ({ ...prev, ...telegramData }));
  }, [telegramData]);

  const handleUpdateStatus = (id: string, newStatus: Pedido['status']) => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', id), { status: newStatus });
    toast({ title: `Status Atualizado`, description: `Pedido movido para ${newStatus.replace('_', ' ')}.` });
  };

  const handleSaveTelegram = () => {
    if (!telegramRef) return;
    setDoc(telegramRef, tgConfig, { merge: true });
    toast({ title: "Configurações Telegram Salvas" });
  };

  const handleTestTelegram = async () => {
    if (!tgConfig.botToken || !tgConfig.testChatId) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha o Token e o ID de Teste." });
      return;
    }

    const testItems = "1️⃣ *Camiseta Premium*\nTamanho: M\nCor: Preto\nQtd: 1\nValor: R$ 89,90";
    const message = (tgConfig.messageTemplate || DEFAULT_TEMPLATE)
      .replace('{{codigo}}', 'TEST-2024-001')
      .replace('{{itens}}', testItems)
      .replace('{{clienteNome}}', 'Administrador Teste')
      .replace('{{clienteEndereco}}', 'Endereço Teste')
      .replace('{{total}}', '89,90');

    try {
      const url = `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage?chat_id=${tgConfig.testChatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
      await fetch(url);
      toast({ title: "Teste Enviado!", description: "Verifique seu Telegram." });
    } catch (e) {
      toast({ variant: "destructive", title: "Falha no Teste" });
    }
  };

  const handleSaveSettings = () => {
    if (!configRef) return;
    setDoc(configRef, siteSettings, { merge: true });
    toast({ title: "Configurações Salvas!" });
  };

  const handleDeleteItem = (coll: string, id: string) => {
    if (confirm('Deseja realmente excluir permanentemente?')) {
      deleteDocumentNonBlocking(doc(firestore, coll, id));
      toast({ title: "Item Removido" });
    }
  };

  const toggleFreteStatus = (rule: FreteRule) => {
    updateDocumentNonBlocking(doc(firestore, 'fretes', rule.id), { ativo: !rule.ativo });
  };

  const disableAllFretes = async () => {
    if (!confirm('Deseja desativar todas as regras de frete?')) return;
    const batch = writeBatch(firestore);
    const snap = await getDocs(collection(firestore, 'fretes'));
    snap.docs.forEach(d => {
      batch.update(d.ref, { ativo: false });
    });
    await batch.commit();
    toast({ title: "Todos os fretes foram desativados." });
  };

  if (isAuthLoading) {
    return (
      <div className="p-24 text-center flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold">Validando acesso administrativo...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <ShieldCheck className="w-16 h-16 mx-auto text-destructive" />
        <h1 className="text-3xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Área exclusiva para administradores da Gold Dream.</p>
        <Button asChild><Link href="/">Voltar para a Loja</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Painel Gold Dream</h1>
          <p className="text-muted-foreground">Gestão operacional e automação.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/"><ExternalLink className="w-4 h-4 mr-2" /> Ver Loja</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo Produto</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card className="border-2 border-primary/10 bg-primary/5">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-inner">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendas no Mês</p>
              <h3 className="text-3xl font-black">{metrics.month}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-500/10 bg-green-50/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Entregues</p>
              <h3 className="text-3xl font-black">{metrics.delivered}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-red-500/10 bg-red-50/30">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-600">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Cancelados</p>
              <h3 className="text-3xl font-black">{metrics.cancelled}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-muted/50 p-1 rounded-2xl h-auto">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="home">Site</TabsTrigger>
          <TabsTrigger value="catalog">Estoque</TabsTrigger>
          <TabsTrigger value="frete">Fretes</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="api">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Vendas</CardTitle>
                <CardDescription>Gerencie o status dos pedidos recebidos.</CardDescription>
              </div>
              <ClipboardList className="w-8 h-8 text-primary opacity-20" />
            </CardHeader>
            <CardContent>
              {ordersError ? (
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border-2 border-red-100">
                  <XCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold">Erro de Permissão</p>
                  <p className="text-sm">Seu cargo de administrador ainda não foi confirmado no banco de dados.</p>
                </div>
              ) : (
                <div className="border rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!allOrders ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Carregando pedidos...</TableCell></TableRow>
                      ) : allOrders.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Aguardando novos pedidos...</TableCell></TableRow>
                      ) : allOrders.map(order => (
                        <TableRow key={order.id} className="hover:bg-muted/20">
                          <TableCell className="font-bold text-primary">{order.codigo}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">{order.clienteNome}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{order.clienteTelefone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-black text-foreground">R$ {order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={
                                order.status === 'entregue' ? 'bg-green-50 text-green-700 border-green-200' :
                                order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' :
                                order.status === 'confirmado' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                order.status === 'em_separacao' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }
                            >
                              {order.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                               <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline" className="rounded-xl h-9">Status <ChevronDown className="w-4 h-4 ml-1" /></Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl p-2">
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')}>Confirmado</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'em_separacao')}>Em Separação</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')}>Entregue</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelado')} className="text-red-600">Cancelado</DropdownMenuItem>
                                  </DropdownMenuContent>
                               </DropdownMenu>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteItem('pedidos', order.id)} className="text-muted-foreground hover:text-destructive rounded-xl">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="home" className="space-y-8">
           <Card className="border-2 shadow-sm">
            <CardHeader><CardTitle>Site & Banner</CardTitle><CardDescription>Personalize a aparência da sua loja.</CardDescription></CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label>Badge Principal</Label><Input value={siteSettings.heroBadge} onChange={e => setSiteSettings({...siteSettings, heroBadge: e.target.value})} placeholder="Nova Coleção 2024" /></div>
                <div className="space-y-2"><Label>URL da Imagem Banner</Label><Input value={siteSettings.heroImage} onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})} placeholder="https://..." /></div>
                <div className="space-y-2 md:col-span-2"><Label>Título Principal</Label><Input value={siteSettings.heroTitle} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} placeholder="Crie seu Estilo Único" /></div>
                <div className="space-y-2 md:col-span-2"><Label>Descrição do Banner</Label><Textarea value={siteSettings.heroDescription} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} placeholder="Texto que aparece abaixo do título principal..." /></div>
              </div>

              <div className="pt-8 border-t">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Redes Sociais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Send className="w-4 h-4 text-[#0088cc]" /> Telegram (Grupo VIP)</Label>
                    <Input value={siteSettings.telegramLink} onChange={e => setSiteSettings({...siteSettings, telegramLink: e.target.value})} placeholder="https://t.me/seu-grupo" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Instagram className="w-4 h-4 text-pink-600" /> Instagram</Label>
                    <Input value={siteSettings.instagramLink} onChange={e => setSiteSettings({...siteSettings, instagramLink: e.target.value})} placeholder="https://instagram.com/seu-perfil" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Facebook className="w-4 h-4 text-blue-600" /> Facebook</Label>
                    <Input value={siteSettings.facebookLink} onChange={e => setSiteSettings({...siteSettings, facebookLink: e.target.value})} placeholder="https://facebook.com/seu-perfil" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Twitter className="w-4 h-4 text-sky-500" /> Twitter (X)</Label>
                    <Input value={siteSettings.twitterLink} onChange={e => setSiteSettings({...siteSettings, twitterLink: e.target.value})} placeholder="https://twitter.com/seu-perfil" />
                  </div>
                </div>
              </div>
              
              <div className="pt-8 border-t">
                <Label className="text-lg font-bold mb-6 block">Cartões de Benefícios</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => {
                    const iconKey = `b${i}_icon` as keyof SiteConfig;
                    const activeKey = `b${i}_active` as keyof SiteConfig;
                    const titleKey = `b${i}_title` as keyof SiteConfig;
                    const subKey = `b${i}_sub` as keyof SiteConfig;
                    
                    const IconComp = ICON_MAP[siteSettings[iconKey] as string] || Truck;

                    return (
                      <div key={i} className={`p-6 border-2 rounded-2xl relative pt-10 transition-all ${siteSettings[activeKey] ? 'bg-muted/20 border-primary/20' : 'bg-muted/10 border-muted opacity-60 grayscale'}`}>
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                           <Label className="text-[10px] font-black uppercase">Ativo</Label>
                           <Switch 
                            checked={!!siteSettings[activeKey]} 
                            onCheckedChange={val => setSiteSettings({...siteSettings, [activeKey]: val})} 
                           />
                        </div>
                        <div className="absolute top-4 left-6 flex items-center gap-2">
                           <div className="p-2 bg-white rounded-lg shadow-sm border"><IconComp className="w-4 h-4 text-primary" /></div>
                           <span className="text-[10px] font-black uppercase text-primary">Card {i}</span>
                        </div>
                        <div className="space-y-3 pt-2">
                          <Input placeholder="Título do Benefício" value={siteSettings[titleKey] as string} onChange={e => setSiteSettings({...siteSettings, [titleKey]: e.target.value})} />
                          <Input placeholder="Texto Auxiliar" value={siteSettings[subKey] as string} onChange={e => setSiteSettings({...siteSettings, [subKey]: e.target.value})} />
                          <select 
                            className="w-full p-2.5 border-2 rounded-xl bg-background text-sm font-bold"
                            value={siteSettings[iconKey] as string}
                            onChange={e => setSiteSettings({...siteSettings, [iconKey]: e.target.value})}
                          >
                            {Object.keys(ICON_MAP).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full h-14 rounded-2xl font-bold"><Save className="w-5 h-5 mr-2" /> Salvar Alterações Visuais</Button>
            </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-6 h-6 text-[#0088cc]" />
                Automação de Notificações
              </CardTitle>
              <CardDescription>Receba alertas em tempo real no Telegram quando um cliente comprar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Bot Token</Label>
                  <Input type="password" value={tgConfig.botToken} onChange={e => setTgConfig({...tgConfig, botToken: e.target.value})} placeholder="00000000:AA..."/>
                </div>
                <div className="space-y-2">
                  <Label>Chat ID Principal</Label>
                  <Input value={tgConfig.chatId} onChange={e => setTgConfig({...tgConfig, chatId: e.target.value})} placeholder="-100..."/>
                </div>
                <div className="space-y-2">
                  <Label>Chat ID de Teste</Label>
                  <Input value={tgConfig.testChatId} onChange={e => setTgConfig({...tgConfig, testChatId: e.target.value})} placeholder="12345678"/>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-bold">Template da Mensagem (Markdown)</Label>
                <div className="flex flex-wrap gap-2">
                  {['codigo', 'itens', 'clienteNome', 'clienteEndereco', 'telefone', 'cupom', 'total'].map(tag => (
                    <Badge key={tag} variant="secondary" className="font-mono text-[10px]">{`{{${tag}}}`}</Badge>
                  ))}
                </div>
                <Textarea 
                  value={tgConfig.messageTemplate} 
                  onChange={e => setTgConfig({...tgConfig, messageTemplate: e.target.value})}
                  className="min-h-[250px] font-mono text-sm border-2"
                />
              </div>
              
              <div className="flex items-center gap-3 p-6 bg-muted/30 rounded-2xl border-2">
                <Switch id="tgactive" checked={tgConfig.isActive} onCheckedChange={checked => setTgConfig({...tgConfig, isActive: checked})} />
                <Label htmlFor="tgactive" className="cursor-pointer font-bold text-lg">Ativar Envio Automático</Label>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveTelegram} className="flex-1 h-14 rounded-2xl font-bold bg-[#0088cc] hover:bg-[#0088cc]/90">
                  <Save className="w-5 h-5 mr-2" /> Salvar
                </Button>
                <Button onClick={handleTestTelegram} variant="outline" className="h-14 px-8 rounded-2xl border-2 font-bold">
                  Testar Estrutura
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frete" className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Logística</h2>
            <Button variant="destructive" size="sm" onClick={disableAllFretes} className="rounded-xl">
              <PowerOff className="w-4 h-4 mr-2" /> Desativar Todos
            </Button>
          </div>
          <Card className="border-2 shadow-sm">
            <CardHeader><CardTitle>Nova Regra de Frete</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end bg-muted/30 p-6 rounded-2xl border-2 border-dashed">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select 
                    className="w-full p-2.5 border rounded-xl bg-background"
                    value={newFrete.isGlobal ? 'global' : 'local'}
                    onChange={e => setNewFrete({...newFrete, isGlobal: e.target.value === 'global', cidade: e.target.value === 'global' ? 'Toda a Loja' : ''})}
                  >
                    <option value="local">Cidade/Bairro</option>
                    <option value="global">Toda a Loja (Fixo)</option>
                  </select>
                </div>
                {!newFrete.isGlobal && (
                  <>
                    <div className="space-y-2"><Label>Cidade</Label><Input value={newFrete.cidade} onChange={e => setNewFrete({...newFrete, cidade: e.target.value})} placeholder="Pinda" /></div>
                    <div className="space-y-2"><Label>Bairro</Label><Input value={newFrete.bairro} onChange={e => setNewFrete({...newFrete, bairro: e.target.value})} placeholder="Centro" /></div>
                  </>
                )}
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={newFrete.valor} onChange={e => setNewFrete({...newFrete, valor: parseFloat(e.target.value)})} /></div>
                <Button onClick={() => {
                  const id = newFrete.isGlobal ? 'global-rule' : `${newFrete.cidade}-${newFrete.bairro}`;
                  setDoc(doc(firestore, 'fretes', id), { ...newFrete, id, ativo: true });
                  setNewFrete({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
                  toast({ title: "Regra Salva!" });
                }} className="rounded-xl h-10">Adicionar</Button>
              </div>
            </CardContent>
          </Card>
          <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
            <Table>
              <TableHeader className="bg-muted/50"><TableRow><TableHead>Tipo</TableHead><TableHead>Cidade/Bairro</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
              <TableBody>
                {fretes?.map(f => (
                  <TableRow key={f.id} className={!f.ativo ? 'opacity-50' : ''}>
                    <TableCell>{f.isGlobal ? <Badge className="bg-primary/10 text-primary"><Globe className="w-3 h-3 mr-1" /> Global</Badge> : <Badge variant="outline">Local</Badge>}</TableCell>
                    <TableCell className="font-medium">{f.cidade} {f.bairro ? `- ${f.bairro}` : ''}</TableCell>
                    <TableCell className="font-black text-primary">R$ {f.valor.toFixed(2)}</TableCell>
                    <TableCell><Switch checked={f.ativo} onCheckedChange={() => toggleFreteStatus(f)} /></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteItem('fretes', f.id)} className="text-destructive rounded-xl"><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader><CardTitle>Cupons</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-end bg-muted/30 p-6 rounded-2xl border-2 border-dashed">
                <div className="space-y-2"><Label>Código</Label><Input value={newCupom.codigo} onChange={e => setNewCupom({...newCupom, codigo: e.target.value.toUpperCase()})} placeholder="GOLD10" /></div>
                <div className="space-y-2"><Label>Desconto (%)</Label><Input type="number" value={newCupom.desconto} onChange={e => setNewCupom({...newCupom, desconto: parseInt(e.target.value)})} /></div>
                <div className="flex flex-col gap-2">
                   <Label>Configuração</Label>
                   <div className="flex items-center gap-2 h-10">
                     <input type="checkbox" checked={newCupom.expira} onChange={e => setNewCupom({...newCupom, expira: e.target.checked})} className="w-5 h-5 accent-primary" />
                     <Label>Expira em data?</Label>
                   </div>
                </div>
                {newCupom.expira && <div className="space-y-2"><Label>Data</Label><Input type="date" value={newCupom.dataExpiracao} onChange={e => setNewCupom({...newCupom, dataExpiracao: e.target.value})} /></div>}
                <Button onClick={() => {
                  if (!newCupom.codigo) return;
                  setDoc(doc(firestore, 'cupons', newCupom.codigo), { ...newCupom, id: newCupom.codigo });
                  setNewCupom({ codigo: '', desconto: 0, expira: false, dataExpiracao: '' });
                  toast({ title: "Cupom Criado!" });
                }} className="rounded-xl h-10">Criar</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {cupons?.map(c => (
                  <Card key={c.id} className="p-6 border-2 border-dashed hover:border-primary/40 relative">
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('cupons', c.id)} className="absolute top-2 right-2 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    <div className="flex items-center gap-2 mb-2"><Ticket className="w-4 h-4 text-primary" /><p className="font-black text-2xl">{c.codigo}</p></div>
                    <p className="text-sm font-bold text-muted-foreground uppercase">{c.desconto}% OFF</p>
                    {c.expira && c.dataExpiracao && <p className="mt-2 text-[10px] text-red-600 font-bold">VALIDADE: {new Date(c.dataExpiracao).toLocaleDateString()}</p>}
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <Card className="border-2 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button asChild size="lg" className="h-24 rounded-2xl text-xl font-black bg-primary/5 text-primary border-2 border-primary/20"><Link href="/admin/products">PRODUTOS</Link></Button>
            <Button asChild variant="outline" size="lg" className="h-24 rounded-2xl text-xl font-black bg-accent/5 text-accent border-2 border-accent/20"><Link href="/admin/promotions">CAMPANHAS</Link></Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const ICON_MAP: Record<string, any> = {
  Truck, ShieldCheck, Zap, ArrowRight, Star, Package, Heart
};
