
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
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, doc, orderBy, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pedido, TelegramConfig, FreteRule, Cupom } from '@/types';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';

const SUPPORT_PAGES = [
  { id: 'envio-e-frete', title: 'Envio e Frete' },
  { id: 'trocas-e-devolucoes', title: 'Trocas e Devoluções' },
  { id: 'guia-de-tamanhos', title: 'Guia de Tamanhos' },
  { id: 'faq', title: 'FAQ (Perguntas Frequentes)' }
];

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
  
  const { data: allOrders } = useCollection<Pedido>(ordersQuery);

  const configRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'configuracoes', 'geral') : null, [firestore, isAdmin]);
  const { data: config } = useDoc(configRef);

  const telegramRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'configuracoes', 'telegram') : null, [firestore, isAdmin]);
  const { data: telegramData } = useDoc(telegramRef);

  const fretesQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'fretes') : null, [firestore, isAdmin]);
  const { data: fretes } = useCollection<FreteRule>(fretesQuery);

  const cuponsQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'cupons') : null, [firestore, isAdmin]);
  const { data: cupons } = useCollection<Cupom>(cuponsQuery);

  const [siteSettings, setSiteSettings] = useState<any>({
    heroBadge: '', heroTitle: '', heroDescription: '', heroImage: '',
    telegramLink: '',
    b1_title: '', b1_sub: '', b1_icon: 'Truck',
    b2_title: '', b2_sub: '', b2_icon: 'ShieldCheck',
    b3_title: '', b3_sub: '', b3_icon: 'Zap',
    b4_title: '', b4_sub: '', b4_icon: 'ArrowRight'
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
    if (config) setSiteSettings((prev: any) => ({ ...prev, ...config }));
  }, [config]);

  useEffect(() => {
    if (telegramData) setTgConfig((prev: any) => ({ ...prev, ...telegramData }));
  }, [telegramData]);

  const handleUpdateStatus = (id: string, newStatus: 'entregue' | 'cancelado') => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', id), { status: newStatus });
    toast({ title: `Pedido ${newStatus === 'entregue' ? 'Entregue' : 'Cancelado'}` });
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

    const testItems = "1️⃣ *Camiseta Premium*\nTamanho: M\nCor: Preto\nQtd: 1\nValor: R$ 89,90\n\n2️⃣ *Calça Jeans*\nTamanho: 42\nCor: Azul\nQtd: 1\nValor: R$ 159,90";
    const testTotal = "249,80";
    const testPhone = "5512991862651";
    const testAddress = "Rua das Flores, 123 - Centro, Pinda - SP";

    const message = (tgConfig.messageTemplate || DEFAULT_TEMPLATE)
      .replace('{{codigo}}', 'TEST-2024-001')
      .replace('{{itens}}', testItems)
      .replace('{{clienteNome}}', 'Administrador Teste')
      .replace('{{clienteEndereco}}', testAddress)
      .replace('{{telefone}}', testPhone)
      .replace('{{cupom}}', 'BOASVINDAS10')
      .replace('{{total}}', testTotal);

    const waMessage = `Olá *Administrador Teste* 👋

Aqui é da *Gold Dream - Multimarcas*.

Seu pedido já está sendo preparado 🛍️

Poderia confirmar se este endereço está correto?

📍 ${testAddress}

E nos informar a forma de pagamento? 💳`;

    const waUrl = `https://wa.me/${testPhone}?text=${encodeURIComponent(waMessage)}`;

    const replyMarkup = JSON.stringify({
      inline_keyboard: [
        [{ text: "🚀 Chamar no WhatsApp", url: waUrl }]
      ]
    });

    try {
      const url = `https://api.telegram.org/bot${tgConfig.botToken}/sendMessage?chat_id=${tgConfig.testChatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown&reply_markup=${encodeURIComponent(replyMarkup)}`;
      await fetch(url);
      toast({ title: "Teste Enviado!", description: "Verifique seu Telegram com o botão de WhatsApp." });
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

  const [activeSupportTab, setActiveSupportTab] = useState(SUPPORT_PAGES[0].id);
  const supportRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'suporte', activeSupportTab) : null, [firestore, isAdmin, activeSupportTab]);
  const { data: supportPage } = useDoc(supportRef);
  const [supportContent, setSupportContent] = useState('');

  useEffect(() => {
    if (supportPage) setSupportContent(supportPage.conteudo || '');
    else setSupportContent('');
  }, [supportPage]);

  const handleSaveSupport = () => {
    if (!supportRef) return;
    setDoc(supportRef, {
      titulo: SUPPORT_PAGES.find(p => p.id === activeSupportTab)?.title,
      conteudo: supportContent,
      slug: activeSupportTab
    }, { merge: true });
    toast({ title: "Página de Suporte Salva!" });
  };

  if (isAuthLoading) {
    return <div className="p-24 text-center">Validando acesso...</div>;
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
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 bg-muted/50 p-1 rounded-2xl h-auto">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="home">Site</TabsTrigger>
          <TabsTrigger value="catalog">Estoque</TabsTrigger>
          <TabsTrigger value="frete">Fretes</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="api">API Telegram</TabsTrigger>
          <TabsTrigger value="support">Suporte</TabsTrigger>
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
                    {allOrders?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Aguardando novos pedidos...</TableCell></TableRow>
                    ) : allOrders?.map(order => (
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
                              'bg-yellow-50 text-yellow-700 border-yellow-200'
                            }
                          >
                            {order.status === 'entregue' ? 'Entregue' : order.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 h-9 rounded-xl border-green-200" onClick={() => handleUpdateStatus(order.id, 'entregue')}>
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Entregue
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 h-9 rounded-xl border-red-200" onClick={() => handleUpdateStatus(order.id, 'cancelado')}>
                              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancelar
                            </Button>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-6 h-6 text-[#0088cc]" />
                Configuração da Notificação
              </CardTitle>
              <CardDescription>O pedido será enviado automaticamente via bot para o chat configurado.</CardDescription>
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
                  <Label>Chat ID de Teste (Seu ID)</Label>
                  <Input value={tgConfig.testChatId} onChange={e => setTgConfig({...tgConfig, testChatId: e.target.value})} placeholder="12345678"/>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-bold">Estrutura da Mensagem</Label>
                  <Badge variant="outline" className="flex gap-1 items-center bg-primary/5 border-primary/20">
                    <Info className="w-3 h-3" /> Tags: {"{{codigo}}"}, {"{{itens}}"}, {"{{clienteNome}}"}, {"{{clienteEndereco}}"}, {"{{telefone}}"}, {"{{cupom}}"}, {"{{total}}"}
                  </Badge>
                </div>
                <Textarea 
                  value={tgConfig.messageTemplate} 
                  onChange={e => setTgConfig({...tgConfig, messageTemplate: e.target.value})}
                  placeholder="Escreva como a mensagem deve chegar..."
                  className="min-h-[250px] font-mono text-sm leading-relaxed border-2"
                />
              </div>
              
              <div className="flex items-center gap-3 p-6 bg-muted/30 rounded-2xl border-2 border-primary/5">
                <Switch id="tgactive" checked={tgConfig.isActive} onCheckedChange={checked => setTgConfig({...tgConfig, isActive: checked})} />
                <Label htmlFor="tgactive" className="cursor-pointer font-bold text-lg">Ativar Fluxo de Notificação Automática</Label>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSaveTelegram} className="flex-1 bg-[#0088cc] hover:bg-[#0088cc]/90 h-14 rounded-2xl shadow-xl shadow-[#0088cc]/20 text-lg font-bold">
                  <Save className="w-5 h-5 mr-2" /> Salvar API
                </Button>
                <Button onClick={handleTestTelegram} variant="outline" className="h-14 px-8 rounded-2xl border-2 font-bold">
                  <MessageSquare className="w-5 h-5 mr-2 text-[#0088cc]" /> Testar Estrutura
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

        <TabsContent value="home" className="space-y-8">
           <Card className="border-2 shadow-sm">
            <CardHeader><CardTitle>Banner Principal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Badge</Label><Input value={siteSettings.heroBadge} onChange={e => setSiteSettings({...siteSettings, heroBadge: e.target.value})} /></div>
                <div className="space-y-2"><Label>Imagem URL</Label><Input value={siteSettings.heroImage} onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Título</Label><Input value={siteSettings.heroTitle} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={siteSettings.heroDescription} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} /></div>
              <Button onClick={handleSaveSettings} className="w-full h-14 rounded-2xl font-bold"><Save className="w-5 h-5 mr-2" /> Salvar Alterações</Button>
            </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <Card className="border-2 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Button asChild size="lg" className="h-24 rounded-2xl text-xl font-black bg-primary/5 text-primary border-2 border-primary/20"><Link href="/admin/products">PRODUTOS</Link></Button>
            <Button asChild variant="outline" size="lg" className="h-24 rounded-2xl text-xl font-black bg-accent/5 text-accent border-2 border-accent/20"><Link href="/admin/promotions">CAMPANHAS</Link></Button>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              {SUPPORT_PAGES.map(page => (
                <Button key={page.id} variant={activeSupportTab === page.id ? "default" : "outline"} className="w-full justify-start h-12 rounded-xl" onClick={() => setActiveSupportTab(page.id)}>
                  <FileText className="w-4 h-4 mr-2" /> {page.title}
                </Button>
              ))}
            </div>
            <Card className="md:col-span-3 border-2 p-6 space-y-4">
              <h2 className="text-xl font-black">{SUPPORT_PAGES.find(p => p.id === activeSupportTab)?.title}</h2>
              <Textarea value={supportContent} onChange={e => setSupportContent(e.target.value)} className="min-h-[400px] border-2 rounded-2xl" />
              <Button onClick={handleSaveSupport} className="w-full h-14 rounded-2xl font-bold"><Save className="w-5 h-5 mr-2" /> Publicar</Button>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
