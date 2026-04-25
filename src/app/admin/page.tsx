
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
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Users as UsersIcon,
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
  Twitter,
  Mail,
  MessageCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  FileText,
  Upload,
  Phone,
  Layout,
  Layers,
  X,
  Play,
  Percent,
  Calendar
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
import { collection, query, doc, orderBy, setDoc, sufferings, where, deleteField } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pedido, TelegramConfig, FreteRule, Cupom, SiteConfig, User as AppUser, Product, Promocao } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { sendCustomEmail } from '@/ai/flows/send-custom-email';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { compressImage } from '@/lib/utils';

export default function AdminDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const isAdmin = useMemo(() => {
    return user?.papel === 'admin' || user?.papel === 'administrador';
  }, [user]);

  // Queries
  const ordersQuery = useMemoFirebase(() => isAdmin ? query(collection(firestore, 'pedidos'), orderBy('dataCriacao', 'desc')) : null, [firestore, isAdmin]);
  const { data: allOrders } = useCollection<Pedido>(ordersQuery);

  const usersQuery = useMemoFirebase(() => isAdmin ? query(collection(firestore, 'usuarios'), orderBy('dataCriacao', 'desc')) : null, [firestore, isAdmin]);
  const { data: allUsers } = useCollection<AppUser>(usersQuery);

  const productsQuery = useMemoFirebase(() => isAdmin ? query(collection(firestore, 'produtos'), orderBy('dataCriacao', 'desc')) : null, [firestore, isAdmin]);
  const { data: allProducts } = useCollection<Product>(productsQuery);

  const fretesQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'fretes') : null, [firestore, isAdmin]);
  const { data: allFretes } = useCollection<FreteRule>(fretesQuery);

  const cuponsQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'cupons') : null, [firestore, isAdmin]);
  const { data: allCupons } = useCollection<Cupom>(cuponsQuery);

  const promosQuery = useMemoFirebase(() => isAdmin ? query(collection(firestore, 'promocoes'), orderBy('dataCriacao', 'desc')) : null, [firestore, isAdmin]);
  const { data: allPromotions } = useCollection<Promocao>(promosQuery);

  const configRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'configuracoes', 'geral') : null, [firestore, isAdmin]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const tgRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'configuracoes', 'telegram') : null, [firestore, isAdmin]);
  const { data: tgConfig } = useDoc<TelegramConfig>(tgRef);

  // States
  const [siteSettings, setSiteSettings] = useState<SiteConfig>({});
  const [tgSettings, setTgSettings] = useState<TelegramConfig>({});
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const [newFrete, setNewFrete] = useState<Partial<FreteRule>>({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
  const [newCupom, setNewCupom] = useState<Partial<Cupom>>({ codigo: '', desconto: 0, expira: false });
  const [newPromo, setNewPromo] = useState<Partial<Promocao>>({ nome: '', dataInicio: '', dataFim: '', valorDesconto: 0, ativo: true, isBlackFriday: false });
  const [isUploading, setIsUploading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (config) setSiteSettings(config);
    if (tgConfig) setTgSettings(tgConfig);
  }, [config, tgConfig]);

  // Handlers
  const handleUpdateStatus = (id: string, newStatus: Pedido['status']) => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', id), { status: newStatus });
    toast({ title: `Status do pedido atualizado para ${newStatus}` });
  };

  const handleSendEmailInvite = async (u: AppUser) => {
    const userId = u.id || (u as any).uid;
    setIsSendingEmail(userId);
    try {
      await sendCustomEmail({
        clienteNome: u.nome,
        clienteEmail: u.email,
        tipo: u.emailVerificado ? 'boas_vindas' : 'confirmacao'
      });
      toast({ title: "Convite Enviado!", description: `E-mail premium enviado para ${u.email}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao enviar", description: "Falha na geração do e-mail IA." });
    } finally {
      setIsSendingEmail(null);
    }
  };

  const handleSaveSiteSettings = () => {
    if (!configRef) return;
    setDoc(configRef, siteSettings, { merge: true });
    toast({ title: "Configurações do Site Salvas!" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof SiteConfig) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        let size = 1200;
        if (field === 'faviconUrl' || field === 'whatsappIconUrl') size = 256;
        
        const compressed = await compressImage(base64, size, size);
        
        if (configRef) {
          await setDoc(configRef, { [field]: compressed }, { merge: true });
        }
        
        setSiteSettings(prev => ({ ...prev, [field]: compressed }));
        setIsUploading(false);
        toast({ title: "Imagem carregada e otimizada!" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async (field: keyof SiteConfig) => {
    if (!configRef) return;
    
    if (confirm('Deseja remover esta imagem permanentemente?')) {
      await setDoc(configRef, { [field]: deleteField() }, { merge: true });
      const newSettings = { ...siteSettings };
      delete newSettings[field];
      setSiteSettings(newSettings);
      toast({ title: "Imagem removida permanentemente!" });
    }
  };

  const handleSaveTgSettings = () => {
    if (!tgRef) return;
    setDoc(tgRef, tgSettings, { merge: true });
    toast({ title: "Configurações de Notificação Salvas no Banco!" });
  };

  const handleTestTelegram = async () => {
    if (!tgSettings.botToken || !tgSettings.chatId) {
      toast({ 
        variant: "destructive", 
        title: "Configuração Incompleta", 
        description: "Informe o Token e o Chat ID antes de testar." 
      });
      return;
    }

    setIsTesting(true);
    try {
      const message = "🔔 *TESTE DE CONFIGURAÇÃO - GOLD DREAM*\n\nSua integração com o Telegram está funcionando corretamente! 🚀\n\n_Se você recebeu esta mensagem, as vendas serão notificadas aqui._";
      const url = `https://api.telegram.org/bot${tgSettings.botToken}/sendMessage?chat_id=${tgSettings.chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.ok) {
        toast({ title: "Teste Enviado!", description: "Verifique seu Telegram para confirmar o recebimento." });
      } else {
        throw new Error(data.description || "Erro na API do Telegram");
      }
    } catch (e: any) {
      toast({ 
        variant: "destructive", 
        title: "Falha no Teste", 
        description: e.message || "Verifique o Token e o Chat ID." 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddFrete = () => {
    if (!newFrete.valor || (!newFrete.cidade && !newFrete.isGlobal)) return;
    addDocumentNonBlocking(collection(firestore, 'fretes'), newFrete);
    setNewFrete({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
    toast({ title: "Regra de Frete Adicionada" });
  };

  const handleAddCupom = () => {
    if (!newCupom.codigo || !newCupom.desconto) return;
    addDocumentNonBlocking(collection(firestore, 'cupons'), { ...newCupom, codigo: newCupom.codigo.toUpperCase() });
    setNewCupom({ codigo: '', desconto: 0, expira: false });
    toast({ title: "Cupom de Desconto Criado" });
  };

  const handleAddPromo = () => {
    if (!newPromo.nome || !newPromo.valorDesconto || !newPromo.dataInicio || !newPromo.dataFim) return;
    addDocumentNonBlocking(collection(firestore, 'promocoes'), {
      ...newPromo,
      dataCriacao: new Date().toISOString()
    });
    setNewPromo({ nome: '', dataInicio: '', dataFim: '', valorDesconto: 0, ativo: true, isBlackFriday: false });
    toast({ title: "Promoção Ativada!" });
  };

  const handleDeleteItem = (col: string, id: string) => {
    if (confirm('Deseja realmente excluir este item?')) {
      deleteDocumentNonBlocking(doc(firestore, col, id));
      toast({ title: "Item excluído com sucesso" });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Autenticando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <XCircle className="w-20 h-20 mx-auto text-destructive" />
        <h1 className="text-4xl font-headline font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Esta área é exclusiva para administradores da Gold Dream.</p>
        <Button asChild className="rounded-2xl h-14 px-8"><Link href="/">Voltar para a Loja</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="h-20 w-20 rounded-2xl border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center relative">
             {isUploading && (
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
                 <Loader2 className="w-6 h-6 animate-spin text-white" />
               </div>
             )}
             {siteSettings.logoUrl ? (
               <img src={siteSettings.logoUrl} className="w-full h-full object-contain" alt="Logo" />
             ) : (
               <LayoutDashboard className="w-10 h-10 text-primary" />
             )}
          </div>
          <div>
            <h1 className="text-5xl font-headline font-bold text-primary mb-2">Painel Admin</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4" />
              <p className="text-sm font-medium">Gestão centralizada Gold Dream Multimarcas</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-xl border-2"><Link href="/">Ver Loja</Link></Button>
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20"><Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo Produto</Link></Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-8">
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <TabsList className="inline-flex w-full md:grid md:grid-cols-8 bg-muted/50 p-1 rounded-2xl h-auto border">
            <TabsTrigger value="orders" className="rounded-xl font-bold">Pedidos</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold">Usuários</TabsTrigger>
            <TabsTrigger value="home" className="rounded-xl font-bold">Site</TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-xl font-bold">Estoque</TabsTrigger>
            <TabsTrigger value="frete" className="rounded-xl font-bold">Fretes</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-xl font-bold">Cupons</TabsTrigger>
            <TabsTrigger value="promos" className="rounded-xl font-bold">Promoções</TabsTrigger>
            <TabsTrigger value="api" className="rounded-xl font-bold">Notificações</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="orders">
          <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Vendas Recentes</CardTitle>
              <CardDescription>Acompanhe e gerencie todos os pedidos realizados.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders?.map(order => (
                    <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-black text-primary">#{order.codigo}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{order.clienteNome}</span>
                          <span className="text-[10px] text-muted-foreground">{order.clienteTelefone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-lg">R$ {order.total?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={`rounded-full px-3 ${
                          order.status === 'entregue' ? 'bg-green-500' : 
                          order.status === 'cancelado' ? 'bg-red-500' : 'bg-primary'
                        }`}>
                          {(order.status || 'pendente').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(order.dataCriacao).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="rounded-xl">Gerenciar</Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-2">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')}>Confirmar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')}>Marcar como Entregue</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelado')} className="text-destructive font-bold">Cancelar Pedido</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!allOrders || allOrders.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground font-medium">Nenhum pedido registrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Base de Clientes</CardTitle>
              <CardDescription>Gerencie usuários e envie e-mails de confirmação VIP.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers?.map(u => {
                    const userId = u.id || (u as any).uid;
                    return (
                    <TableRow key={userId} className="hover:bg-muted/5 transition-colors">
                      <TableCell className="font-bold">{u.nome}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.emailVerificado ? (
                          <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">VERIFICADO</Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-200 text-yellow-700 bg-yellow-50">PENDENTE</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(u.dataCriacao).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          disabled={isSendingEmail === userId}
                          onClick={() => handleSendEmailInvite(u)}
                          className="rounded-xl"
                        >
                          {isSendingEmail === userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                          Convite VIP
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="home">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-2 shadow-sm rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Identidade Visual</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                   <Label className="flex justify-between">Logo Principal <span className="text-[10px] text-muted-foreground">Rec: 250x80px</span></Label>
                   <div className="flex gap-4 items-center p-4 border-2 border-dashed rounded-2xl bg-muted/10 relative">
                     <div className="h-16 w-32 bg-white rounded border flex items-center justify-center overflow-hidden relative group">
                       {siteSettings.logoUrl ? (
                         <>
                           <img src={siteSettings.logoUrl} className="max-h-full" alt="Logo preview" />
                           <button onClick={() => handleRemoveImage('logoUrl')} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                             <Trash2 size={20} />
                           </button>
                         </>
                       ) : <Layers className="text-muted-foreground opacity-20" />}
                     </div>
                     <div className="flex-1 space-y-2">
                       <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logoUrl')} className="hidden" id="logo-up" />
                       <Button asChild variant="outline" className="w-full cursor-pointer rounded-xl" disabled={isUploading}>
                         <label htmlFor="logo-up">Trocar Logo</label>
                       </Button>
                       {siteSettings.logoUrl && (
                         <Button variant="ghost" onClick={() => handleRemoveImage('logoUrl')} className="w-full text-destructive text-xs font-bold h-8 rounded-xl">
                            <Trash2 size={14} className="mr-2" /> Excluir Logo
                         </Button>
                       )}
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="flex justify-between">Favicon <span className="text-[10px] text-muted-foreground">Rec: 32x32px</span></Label>
                     <div className="flex gap-2 items-center p-3 border-2 border-dashed rounded-2xl relative group">
                        {siteSettings.faviconUrl ? (
                          <div className="relative">
                            <img src={siteSettings.faviconUrl} className="w-8 h-8 object-contain" />
                            <button onClick={() => handleRemoveImage('faviconUrl')} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"><X size={10} /></button>
                          </div>
                        ) : <div className="w-8 h-8 bg-muted rounded" />}
                        <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'faviconUrl')} className="hidden" id="fav-up" />
                        <label htmlFor="fav-up" className="text-xs font-bold text-primary cursor-pointer hover:underline">Upload</label>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label className="flex justify-between">Ícone WhatsApp <span className="text-[10px] text-muted-foreground">Rec: 64x64px</span></Label>
                     <div className="flex gap-2 items-center p-3 border-2 border-dashed rounded-2xl relative group">
                        {siteSettings.whatsappIconUrl ? (
                          <div className="relative">
                            <img src={siteSettings.whatsappIconUrl} className="w-8 h-8 rounded-full" />
                            <button onClick={() => handleRemoveImage('whatsappIconUrl')} className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5"><X size={10} /></button>
                          </div>
                        ) : <MessageCircle className="w-8 h-8 text-muted" />}
                        <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'whatsappIconUrl')} className="hidden" id="wa-up" />
                        <label htmlFor="wa-up" className="text-xs font-bold text-primary cursor-pointer hover:underline">Upload</label>
                     </div>
                   </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex justify-between">Imagem Hero (Fundo) <span className="text-[10px] text-muted-foreground">Rec: 1920x1080px</span></Label>
                  <div className="flex flex-col gap-2">
                     {siteSettings.heroImage && (
                       <div className="relative h-24 w-full rounded-xl overflow-hidden border">
                         <img src={siteSettings.heroImage} className="w-full h-full object-cover" />
                         <Button variant="destructive" size="sm" className="absolute top-2 right-2 h-8 px-3 rounded-lg" onClick={() => handleRemoveImage('heroImage')}>
                           Remover Imagem de Fundo
                         </Button>
                       </div>
                     )}
                     <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'heroImage')} className="hidden" id="hero-up" />
                     <Button asChild variant="secondary" className="w-full h-12 cursor-pointer border-2 border-dashed rounded-xl" disabled={isUploading}>
                       <label htmlFor="hero-up">
                         {isUploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" size={16} />}
                         Substituir Imagem de Destaque
                       </label>
                     </Button>
                  </div>
                </div>

                <div className="space-y-2">
                   <Label>WhatsApp de Contato (Botão e Pedidos)</Label>
                   <Input value={siteSettings.whatsappNumber || ''} onChange={e => setSiteSettings({...siteSettings, whatsappNumber: e.target.value})} placeholder="551299186..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Badge do Hero</Label>
                    <Input value={siteSettings.heroBadge || ''} onChange={e => setSiteSettings({...siteSettings, heroBadge: e.target.value})} placeholder="Nova Coleção 2024" />
                  </div>
                  <div className="space-y-2">
                    <Label>Título do Hero</Label>
                    <Input value={siteSettings.heroTitle || ''} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição do Hero</Label>
                  <Textarea value={siteSettings.heroDescription || ''} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} />
                </div>

                <Button onClick={handleSaveSiteSettings} className="w-full h-14 rounded-2xl shadow-xl shadow-primary/10">Salvar Alterações Visuais</Button>
              </div>
            </Card>

            <Card className="border-2 shadow-sm rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Fluxo de Experiência (4 Passos)</h2>
              </div>
              <div className="space-y-8 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {[1, 2, 3, 4].map(num => (
                  <div key={num} className="space-y-4 p-5 border-2 rounded-2xl bg-muted/20">
                    <p className="font-black text-xs text-primary uppercase tracking-widest">Passo {num}</p>
                    <div className="space-y-2">
                      <Label>Título do Passo</Label>
                      <Input 
                        value={siteSettings[`step${num}_title` as keyof SiteConfig] as string || ''} 
                        onChange={e => setSiteSettings({...siteSettings, [`step${num}_title` as keyof SiteConfig]: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição Curta</Label>
                      <Textarea 
                        value={siteSettings[`step${num}_desc` as keyof SiteConfig] as string || ''} 
                        onChange={e => setSiteSettings({...siteSettings, [`step${num}_desc` as keyof SiteConfig]: e.target.value})} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveSiteSettings} className="w-full h-14 rounded-2xl">Salvar Textos do Fluxo</Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Gestão de Estoque</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProducts?.map(prod => (
                    <TableRow key={prod.id}>
                      <TableCell>
                        <img src={prod.imagens?.[0] || 'https://placehold.co/50'} className="w-10 h-10 object-cover rounded-lg" />
                      </TableCell>
                      <TableCell className="font-bold">{prod.nome}</TableCell>
                      <TableCell>R$ {prod.preco?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={prod.estoque < 5 ? "destructive" : "outline"}>{prod.estoque} un</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline" className="rounded-xl"><Link href={`/admin/products/${prod.id}`}>Editar</Link></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItem('produtos', prod.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="frete">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="border-2 shadow-sm rounded-3xl p-6 h-fit space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Nova Regra</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Cidade</Label>
                  <Input disabled={newFrete.isGlobal} value={newFrete.cidade} onChange={e => setNewFrete({...newFrete, cidade: e.target.value})} placeholder="Ex: São Paulo" />
                </div>
                <div className="space-y-1">
                  <Label>Bairro</Label>
                  <Input disabled={newFrete.isGlobal} value={newFrete.bairro} onChange={e => setNewFrete({...newFrete, bairro: e.target.value})} placeholder="Ex: Centro" />
                </div>
                <div className="space-y-1">
                  <Label>Valor (R$)</Label>
                  <Input type="number" value={newFrete.valor} onChange={e => setNewFrete({...newFrete, valor: parseFloat(e.target.value)})} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                  <Label>Frete Global (Padrão)</Label>
                  <Switch checked={newFrete.isGlobal} onCheckedChange={checked => setNewFrete({...newFrete, isGlobal: checked, cidade: checked ? 'Global' : '', bairro: checked ? 'Global' : ''})} />
                </div>
                <Button onClick={handleAddFrete} className="w-full rounded-xl">Adicionar Regra</Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 border-2 shadow-sm rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead>Local</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFretes?.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-bold">{f.isGlobal ? <span className="flex items-center gap-1 text-primary"><Globe className="w-3.5 h-3.5" /> GLOBAL</span> : f.cidade}</TableCell>
                      <TableCell>{f.bairro}</TableCell>
                      <TableCell className="font-bold">R$ {f.valor.toFixed(2)}</TableCell>
                      <TableCell><Badge className={f.ativo ? 'bg-green-500' : 'bg-muted'}>{f.ativo ? 'ATIVO' : 'OFF'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteItem('fretes', f.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coupons">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="border-2 shadow-sm rounded-3xl p-6 h-fit space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" /> Novo Cupom</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Código do Cupom</Label>
                  <Input value={newCupom.codigo} onChange={e => setNewCupom({...newCupom, codigo: e.target.value})} placeholder="EX: GOLD10" />
                </div>
                <div className="space-y-1">
                  <Label>Desconto (%)</Label>
                  <Input type="number" value={newCupom.desconto} onChange={e => setNewCupom({...newCupom, desconto: parseInt(e.target.value)})} />
                </div>
                <Button onClick={handleAddCupom} className="w-full rounded-xl">Criar Cupom</Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 border-2 shadow-sm rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCupons?.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-black text-primary">{c.codigo}</TableCell>
                      <TableCell className="font-bold">{c.desconto}% OFF</TableCell>
                      <TableCell><Badge>ATIVO</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteItem('cupons', c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="promos">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="border-2 shadow-sm rounded-3xl p-6 h-fit space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Nova Promoção</h2>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Nome da Campanha</Label>
                  <Input value={newPromo.nome} onChange={e => setNewPromo({...newPromo, nome: e.target.value})} placeholder="Ex: Liquida Verão" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Início</Label>
                    <Input type="datetime-local" value={newPromo.dataInicio} onChange={e => setNewPromo({...newPromo, dataInicio: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Fim</Label>
                    <Input type="datetime-local" value={newPromo.dataFim} onChange={e => setNewPromo({...newPromo, dataFim: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Desconto (%)</Label>
                  <Input type="number" value={newPromo.valorDesconto} onChange={e => setNewPromo({...newPromo, valorDesconto: parseInt(e.target.value)})} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                  <Label className="font-bold">Modo Black Friday</Label>
                  <Switch checked={newPromo.isBlackFriday || false} onCheckedChange={checked => setNewPromo({...newPromo, isBlackFriday: checked})} />
                </div>
                <Button onClick={handleAddPromo} className="w-full rounded-xl">Ativar Promoção</Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 border-2 shadow-sm rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPromotions?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">
                        {p.nome}
                        {p.isBlackFriday && <Badge className="ml-2 bg-black text-yellow-500">BF</Badge>}
                      </TableCell>
                      <TableCell className="font-black text-primary">-{p.valorDesconto}%</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {new Date(p.dataInicio).toLocaleDateString()} - {new Date(p.dataFim).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge className={p.ativo ? 'bg-green-500' : 'bg-muted'}>{p.ativo ? 'ATIVO' : 'OFF'}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => handleDeleteItem('promocoes', p.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!allPromotions || allPromotions.length === 0) && (
                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Nenhuma promoção ativa.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border-2 shadow-sm rounded-3xl p-8 space-y-8">
             <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-3xl">
                   <Zap className="w-8 h-8 text-primary" />
                </div>
                <div>
                   <h2 className="text-3xl font-headline font-bold">Automação de Notificações</h2>
                   <p className="text-muted-foreground">Configure seu bot do Telegram para receber alertas de novos pedidos.</p>
                </div>
             </div>

             <Separator />

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Bot Token (Telegram API)</Label>
                      <Input type="password" value={tgSettings.botToken || ''} onChange={e => setTgSettings({...tgSettings, botToken: e.target.value})} placeholder="000000000:AAAAA-BBBBB" />
                   </div>
                   <div className="space-y-2">
                      <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Chat ID (Grupo ou Privado)</Label>
                      <Input value={tgSettings.chatId || ''} onChange={e => setTgSettings({...tgSettings, chatId: e.target.value})} placeholder="-100000000" />
                   </div>
                   <div className="flex items-center justify-between p-4 border-2 rounded-2xl bg-muted/10">
                      <div>
                         <p className="font-bold">Notificações Ativas</p>
                         <p className="text-xs text-muted-foreground">Enviar alertas instantâneos de vendas.</p>
                      </div>
                      <Switch checked={tgSettings.isActive || false} onCheckedChange={checked => setTgSettings({...tgSettings, isActive: checked})} />
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Template da Mensagem (Markdown)</Label>
                      <Textarea 
                        value={tgSettings.messageTemplate || ''} 
                        onChange={e => setTgSettings({...tgSettings, messageTemplate: e.target.value})} 
                        className="min-h-[220px] font-mono text-xs"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <Button onClick={handleSaveTgSettings} className="w-full h-14 rounded-2xl">
                         <Save className="w-4 h-4 mr-2" /> Salvar Configurações
                      </Button>
                      <Button 
                        variant="secondary" 
                        disabled={isTesting}
                        onClick={handleTestTelegram} 
                        className="w-full h-14 rounded-2xl border-2 border-primary/20"
                      >
                         {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                         Testar Notificação
                      </Button>
                   </div>
                   <p className="text-[10px] text-muted-foreground text-center">
                     Dica: Clique em "Testar Notificação" para enviar uma mensagem agora e verificar se o Bot está funcionando.
                   </p>
                </div>
             </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
