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
  ImageIcon,
  Link as LinkIcon,
  FileText,
  Upload,
  Phone,
  Layout,
  Layers,
  X,
  Play,
  Percent,
  Calendar,
  DollarSign,
  BarChart3,
  Receipt,
  Heart,
  Star
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
import { collection, query, doc, orderBy, setDoc, where, deleteField } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pedido, TelegramConfig, FreteRule, Cupom, SiteConfig, User as AppUser, Product, Promocao } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { sendCustomEmail } from '@/ai/flows/send-custom-email';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { compressImage } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ICON_MAP: Record<string, any> = {
  Truck, ShieldCheck, Zap, ArrowRight, Star, Package, Heart, ShoppingBag, 
  Settings, Tag, MapPin, Ticket, Globe, Instagram, Facebook, Twitter, 
  Mail, MessageCircle, ImageIcon, FileText, Phone, Layout, Layers, X, 
  Play, Percent, Calendar, DollarSign, BarChart3, Receipt, Clock, 
  ClipboardList, CheckCircle2, User: UserIcon, Users: UsersIcon
};

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
  const [newCupom, setNewCupom] = useState<Partial<Cupom>>({ codigo: '', desconto: 0, tipo: 'porcentagem', expira: false });
  const [newPromo, setNewPromo] = useState<Partial<Promocao>>({ nome: '', dataInicio: '', dataFim: '', valorDesconto: 0, tipo: 'porcentagem', ativo: true, isBlackFriday: false });
  const [isUploading, setIsUploading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [itemToDelete, setItemToDelete] = useState<{ col: string; id: string } | null>(null);

  useEffect(() => {
    if (config) setSiteSettings(config);
    if (tgConfig) setTgSettings(tgConfig);
  }, [config, tgConfig]);

  // Dashboard Statistics
  const stats = useMemo(() => {
    if (!allOrders) return { totalMes: 0, entregues: 0, pendentes: 0, cancelados: 0 };
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return allOrders.reduce((acc, order) => {
      const orderDate = new Date(order.dataCriacao);
      const isThisMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      
      if (isThisMonth && order.status !== 'cancelado') {
        acc.totalMes += order.total || 0;
      }

      if (order.status === 'entregue') {
        acc.entregues += 1;
      } else if (order.status === 'cancelado') {
        acc.cancelados += 1;
      } else {
        acc.pendentes += 1;
      }

      return acc;
    }, { totalMes: 0, entregues: 0, pendentes: 0, cancelados: 0 });
  }, [allOrders]);

  // Handlers
  const handleUpdateStatus = (id: string, newStatus: Pedido['status']) => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', id), { status: newStatus });
    toast({ title: `Status atualizado para ${newStatus}` });
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
      toast({ title: "Convite Enviado!", description: `E-mail enviado para ${u.email}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao enviar", description: "Falha na geração do e-mail." });
    } finally {
      setIsSendingEmail(null);
    }
  };

  const handleSaveSiteSettings = () => {
    if (!configRef) return;
    setDoc(configRef, siteSettings, { merge: true });
    toast({ title: "Configurações Salvas!" });
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
        toast({ title: "Imagem carregada!" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async (field: keyof SiteConfig) => {
    if (!configRef) return;
    setDoc(configRef, { [field]: deleteField() }, { merge: true });
    const newSettings = { ...siteSettings };
    delete newSettings[field];
    setSiteSettings(newSettings);
    toast({ title: "Imagem removida!" });
  };

  const handleSaveTgSettings = () => {
    if (!tgRef) return;
    setDoc(tgRef, tgSettings, { merge: true });
    toast({ title: "Notificações Salvas!" });
  };

  const handleTestTelegram = async () => {
    if (!tgSettings.botToken || !tgSettings.chatId) {
      toast({ variant: "destructive", title: "Configuração Incompleta" });
      return;
    }
    setIsTesting(true);
    try {
      const message = "🔔 *TESTE DE CONFIGURAÇÃO - GOLD DREAM*";
      const url = `https://api.telegram.org/bot${tgSettings.botToken}/sendMessage?chat_id=${tgSettings.chatId}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.ok) toast({ title: "Teste Enviado!" });
      else throw new Error(data.description);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Falha no Teste", description: e.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddFrete = () => {
    if (!newFrete.valor || (!newFrete.cidade && !newFrete.isGlobal)) return;
    addDocumentNonBlocking(collection(firestore, 'fretes'), newFrete);
    setNewFrete({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
    toast({ title: "Frete Adicionado" });
  };

  const handleAddCupom = () => {
    if (!newCupom.codigo || !newCupom.desconto) return;
    addDocumentNonBlocking(collection(firestore, 'cupons'), { 
      ...newCupom, 
      codigo: newCupom.codigo.toUpperCase()
    });
    setNewCupom({ codigo: '', desconto: 0, tipo: 'porcentagem', expira: false });
    toast({ title: "Cupom Criado" });
  };

  const handleAddPromo = () => {
    if (!newPromo.nome || !newPromo.valorDesconto || !newPromo.dataInicio || !newPromo.dataFim) return;
    addDocumentNonBlocking(collection(firestore, 'promocoes'), { ...newPromo, dataCriacao: new Date().toISOString() });
    setNewPromo({ nome: '', dataInicio: '', dataFim: '', valorDesconto: 0, tipo: 'porcentagem', ativo: true, isBlackFriday: false });
    toast({ title: "Promoção Ativada!" });
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteDocumentNonBlocking(doc(firestore, itemToDelete.col, itemToDelete.id));
      toast({ title: "Registro excluído permanentemente" });
      setItemToDelete(null);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-muted-foreground uppercase text-xs">Autenticando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <XCircle className="w-20 h-20 mx-auto text-destructive" />
        <h1 className="text-4xl font-headline font-bold">Acesso Restrito</h1>
        <Button asChild className="rounded-2xl h-14 px-8"><Link href="/">Voltar para a Loja</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center relative">
             {siteSettings.logoUrl ? (
               <img src={siteSettings.logoUrl} className="w-full h-full object-contain" alt="Logo" />
             ) : (
               <LayoutDashboard className="w-8 h-8 md:w-10 md:h-10 text-primary" />
             )}
          </div>
          <div>
            <h1 className="text-3xl md:text-5xl font-headline font-bold text-primary mb-1">Painel Admin</h1>
            <p className="text-xs md:text-sm font-medium text-muted-foreground">Gestão Gold Dream</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 w-full lg:w-auto">
          <Button asChild variant="outline" className="flex-1 lg:flex-none rounded-xl border-2"><Link href="/">Ver Loja</Link></Button>
          <Button asChild className="flex-1 lg:flex-none rounded-xl shadow-lg shadow-primary/20"><Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo Produto</Link></Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6 md:space-y-8">
        <div className="relative">
          <div className="overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar">
            <TabsList className="inline-flex w-max min-w-full md:grid md:grid-cols-8 bg-muted/50 p-1 rounded-2xl h-auto border">
              <TabsTrigger value="orders" className="rounded-xl font-bold px-6 md:px-3">Pedidos</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl font-bold px-6 md:px-3">Usuários</TabsTrigger>
              <TabsTrigger value="home" className="rounded-xl font-bold px-6 md:px-3">Site</TabsTrigger>
              <TabsTrigger value="catalog" className="rounded-xl font-bold px-6 md:px-3">Estoque</TabsTrigger>
              <TabsTrigger value="frete" className="rounded-xl font-bold px-6 md:px-3">Fretes</TabsTrigger>
              <TabsTrigger value="coupons" className="rounded-xl font-bold px-6 md:px-3">Cupons</TabsTrigger>
              <TabsTrigger value="promos" className="rounded-xl font-bold px-6 md:px-3">Promoções</TabsTrigger>
              <TabsTrigger value="api" className="rounded-xl font-bold px-6 md:px-3">Notificações</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="orders" className="space-y-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 rounded-3xl overflow-hidden shadow-sm bg-primary/5 border-primary/10">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/10 rounded-xl"><DollarSign className="w-5 h-5 text-primary" /></div>
                  <Badge variant="outline" className="text-[10px] font-bold">MÊS ATUAL</Badge>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Mês</p>
                <p className="text-2xl font-black text-primary">R$ {stats.totalMes.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl overflow-hidden shadow-sm bg-green-50 border-green-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-100 rounded-xl"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-green-700/60 mb-1">Entregues</p>
                <p className="text-2xl font-black text-green-700">{stats.entregues}</p>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl overflow-hidden shadow-sm bg-yellow-50 border-yellow-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-yellow-100 rounded-xl"><Clock className="w-5 h-5 text-yellow-600" /></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700/60 mb-1">Pendentes</p>
                <p className="text-2xl font-black text-yellow-700">{stats.pendentes}</p>
              </CardContent>
            </Card>

            <Card className="border-2 rounded-3xl overflow-hidden shadow-sm bg-red-50 border-red-100">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-red-100 rounded-xl"><XCircle className="w-5 h-5 text-red-600" /></div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-700/60 mb-1">Cancelados</p>
                <p className="text-2xl font-black text-red-700">{stats.cancelados}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead>Código</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders?.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-black text-primary">#{order.codigo}</TableCell>
                      <TableCell><span className="font-bold">{order.clienteNome}</span></TableCell>
                      <TableCell className="font-bold">R$ {order.total?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={
                          order.status === 'entregue' ? 'bg-green-500' : 
                          order.status === 'cancelado' ? 'bg-red-500' : 
                          'bg-primary'
                        }>
                          {(order.status || 'pendente').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="rounded-xl">Gerenciar</Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-2 shadow-xl">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')}>Confirmar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')}>Entregue</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelado')} className="text-destructive font-bold">Cancelar</DropdownMenuItem>
                            <Separator className="my-1" />
                            <DropdownMenuItem onClick={() => setItemToDelete({ col: 'pedidos', id: order.id })} className="text-destructive font-bold">
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir Registro
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5" /> Clientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/10">
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers?.map(u => (
                    <TableRow key={u.id || (u as any).uid}>
                      <TableCell className="font-bold">{u.nome}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.emailVerificado ? "border-green-200" : "border-yellow-200"}>
                          {u.emailVerificado ? "OK" : "PENDENTE"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => handleSendEmailInvite(u)} className="rounded-xl" disabled={isSendingEmail === (u.id || (u as any).uid)}>
                          {isSendingEmail === (u.id || (u as any).uid) ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar E-mail"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="home" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-2 rounded-3xl p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-primary" /> Visual</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                   <Label>Logo Principal (250x80px)</Label>
                   <div className="flex flex-col sm:flex-row gap-4 items-center p-4 border-2 border-dashed rounded-2xl bg-muted/10">
                     <div className="h-16 w-32 bg-white rounded border flex items-center justify-center overflow-hidden">
                       {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} className="max-h-full" alt="Logo" /> : <Layers className="text-muted-foreground opacity-20" />}
                     </div>
                     <div className="flex-1 w-full space-y-2">
                       <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logoUrl')} className="hidden" id="logo-up" />
                       <Button asChild variant="outline" className="w-full cursor-pointer rounded-xl"><label htmlFor="logo-up">Upload</label></Button>
                       {siteSettings.logoUrl && <Button variant="ghost" onClick={() => handleRemoveImage('logoUrl')} className="w-full text-destructive text-xs font-bold rounded-xl">Excluir</Button>}
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Favicon (32x32)</Label>
                    <div className="flex gap-2 items-center p-3 border-2 border-dashed rounded-2xl">
                      {siteSettings.faviconUrl ? <img src={siteSettings.faviconUrl} className="w-8 h-8" alt="Favicon" /> : <div className="w-8 h-8 bg-muted rounded" />}
                      <Input type="file" onChange={e => handleFileUpload(e, 'faviconUrl')} className="hidden" id="fav-up" />
                      <label htmlFor="fav-up" className="text-xs font-bold text-primary cursor-pointer">Upload</label>
                      {siteSettings.faviconUrl && <Button variant="ghost" size="icon" onClick={() => handleRemoveImage('faviconUrl')} className="text-destructive h-6 w-6"><X className="w-3 h-3" /></Button>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp (64x64)</Label>
                    <div className="flex gap-2 items-center p-3 border-2 border-dashed rounded-2xl">
                      {siteSettings.whatsappIconUrl ? <img src={siteSettings.whatsappIconUrl} className="w-8 h-8 rounded-full" alt="WA" /> : <MessageCircle className="w-8 h-8 text-muted" />}
                      <Input type="file" onChange={e => handleFileUpload(e, 'whatsappIconUrl')} className="hidden" id="wa-up" />
                      <label htmlFor="wa-up" className="text-xs font-bold text-primary cursor-pointer">Upload</label>
                      {siteSettings.whatsappIconUrl && <Button variant="ghost" size="icon" onClick={() => handleRemoveImage('whatsappIconUrl')} className="text-destructive h-6 w-6"><X className="w-3 h-3" /></Button>}
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveSiteSettings} className="w-full h-14 rounded-2xl">Salvar Tudo</Button>
              </div>
            </Card>

            <Card className="border-2 rounded-3xl p-6 md:p-8 space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" /> Informações da Loja</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                   <Label>WhatsApp Contato</Label>
                   <Input value={siteSettings.whatsappNumber || ''} onChange={e => setSiteSettings({...siteSettings, whatsappNumber: e.target.value})} placeholder="551299186..." />
                </div>
                <div className="space-y-2">
                   <Label>Título Hero</Label>
                   <Input value={siteSettings.heroTitle || ''} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <Label>Descrição Hero</Label>
                   <Textarea value={siteSettings.heroDescription || ''} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <Label>Imagem Hero (Fundo)</Label>
                   <div className="flex flex-col sm:flex-row gap-4 items-center p-4 border-2 border-dashed rounded-2xl bg-muted/10">
                     <div className="h-16 w-32 bg-white rounded border flex items-center justify-center overflow-hidden">
                       {siteSettings.heroImage ? <img src={siteSettings.heroImage} className="w-full h-full object-cover" alt="Hero" /> : <Layers className="text-muted-foreground opacity-20" />}
                     </div>
                     <div className="flex-1 w-full space-y-2">
                       <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'heroImage')} className="hidden" id="hero-up" />
                       <Button asChild variant="outline" className="w-full cursor-pointer rounded-xl"><label htmlFor="hero-up">Upload</label></Button>
                       {siteSettings.heroImage && <Button variant="ghost" onClick={() => handleRemoveImage('heroImage')} className="w-full text-destructive text-xs font-bold rounded-xl">Excluir</Button>}
                     </div>
                   </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><LinkIcon className="w-4 h-4 text-primary" /> Redes Sociais</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                         <Label className="text-[10px]">Instagram</Label>
                         <Input value={siteSettings.instagramLink || ''} onChange={e => setSiteSettings({...siteSettings, instagramLink: e.target.value})} placeholder="https://instagram.com/..." />
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[10px]">Facebook</Label>
                         <Input value={siteSettings.facebookLink || ''} onChange={e => setSiteSettings({...siteSettings, facebookLink: e.target.value})} placeholder="https://facebook.com/..." />
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[10px]">Twitter (X)</Label>
                         <Input value={siteSettings.twitterLink || ''} onChange={e => setSiteSettings({...siteSettings, twitterLink: e.target.value})} placeholder="https://twitter.com/..." />
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[10px]">Telegram (Grupo VIP)</Label>
                         <Input value={siteSettings.telegramLink || ''} onChange={e => setSiteSettings({...siteSettings, telegramLink: e.target.value})} placeholder="https://t.me/..." />
                      </div>
                   </div>
                </div>

                <Button onClick={handleSaveSiteSettings} className="w-full h-14 rounded-2xl">Salvar Informações</Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 border-2 rounded-3xl p-6 md:p-8 space-y-8">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Layout className="w-6 h-6 text-primary" /> Conteúdo da Página Inicial</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Benefícios */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold border-b pb-2">Barra de Benefícios (4 Blocos)</h3>
                  {[1, 2, 3, 4].map((num) => (
                    <div key={`b${num}`} className="p-4 border rounded-2xl bg-muted/5 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-black text-xs uppercase tracking-widest">Bloco {num}</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold">Ativo?</span>
                          <Switch 
                            checked={siteSettings[`b${num}_active` as keyof SiteConfig] !== false} 
                            onCheckedChange={(val) => setSiteSettings({...siteSettings, [`b${num}_active` as keyof SiteConfig]: val})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Título</Label>
                          <Input 
                            value={(siteSettings[`b${num}_title` as keyof SiteConfig] as string) || ''} 
                            onChange={e => setSiteSettings({...siteSettings, [`b${num}_title` as keyof SiteConfig]: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Label className="text-[10px]">Ícone</Label>
                            {(() => {
                              const iconName = (siteSettings[`b${num}_icon` as keyof SiteConfig] as string);
                              const IconComp = ICON_MAP[iconName];
                              return IconComp ? <IconComp className="w-3 h-3 text-primary animate-in zoom-in" /> : null;
                            })()}
                          </div>
                          <Input 
                            value={(siteSettings[`b${num}_icon` as keyof SiteConfig] as string) || ''} 
                            onChange={e => setSiteSettings({...siteSettings, [`b${num}_icon` as keyof SiteConfig]: e.target.value})}
                            placeholder="Ex: Truck, ShieldCheck"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Subtítulo / Descrição Curta</Label>
                        <Input 
                          value={(siteSettings[`b${num}_sub` as keyof SiteConfig] as string) || ''} 
                          onChange={e => setSiteSettings({...siteSettings, [`b${num}_sub` as keyof SiteConfig]: e.target.value})}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Guia de Compra */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold border-b pb-2">Guia de Compra (Passo a Passo)</h3>
                  {[1, 2, 3, 4].map((num) => (
                    <div key={`step${num}`} className="p-4 border rounded-2xl bg-muted/5 space-y-3">
                      <Label className="font-black text-xs uppercase tracking-widest text-primary">Passo {num}</Label>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Título do Passo</Label>
                        <Input 
                          value={(siteSettings[`step${num}_title` as keyof SiteConfig] as string) || ''} 
                          onChange={e => setSiteSettings({...siteSettings, [`step${num}_title` as keyof SiteConfig]: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Descrição</Label>
                        <Textarea 
                          value={(siteSettings[`step${num}_desc` as keyof SiteConfig] as string) || ''} 
                          onChange={e => setSiteSettings({...siteSettings, [`step${num}_desc` as keyof SiteConfig]: e.target.value})}
                          className="min-h-[60px] text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleSaveSiteSettings} className="w-full h-14 rounded-2xl">Salvar Todo o Conteúdo</Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <Card className="border-2 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Estoque</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProducts?.map(prod => (
                    <TableRow key={prod.id}>
                      <TableCell><img src={prod.imagens?.[0] || 'https://placehold.co/50'} className="w-10 h-10 object-cover rounded-lg" alt={prod.nome} /></TableCell>
                      <TableCell className="font-bold">{prod.nome}</TableCell>
                      <TableCell><Badge variant={prod.estoque < 5 ? "destructive" : "outline"}>{prod.estoque} un</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="outline" className="rounded-xl"><Link href={`/admin/products/${prod.id}`}>Editar</Link></Button>
                          <Button size="sm" variant="ghost" onClick={() => setItemToDelete({ col: 'produtos', id: prod.id })} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
            <Card className="border-2 rounded-3xl p-6 h-fit space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Novo Frete</h2>
              <div className="space-y-3">
                <Input disabled={newFrete.isGlobal} value={newFrete.cidade} onChange={e => setNewFrete({...newFrete, cidade: e.target.value})} placeholder="Cidade" />
                <Input disabled={newFrete.isGlobal} value={newFrete.bairro} onChange={e => setNewFrete({...newFrete, bairro: e.target.value})} placeholder="Bairro" />
                <Input type="number" value={newFrete.valor} onChange={e => setNewFrete({...newFrete, valor: parseFloat(e.target.value)})} placeholder="Valor R$" />
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                  <Label>Global?</Label>
                  <Switch checked={newFrete.isGlobal} onCheckedChange={checked => setNewFrete({...newFrete, isGlobal: checked, cidade: checked ? 'Global' : '', bairro: checked ? 'Global' : ''})} />
                </div>
                <Button onClick={handleAddFrete} className="w-full rounded-xl">Adicionar</Button>
              </div>
            </Card>
            <Card className="lg:col-span-2 border-2 rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow><TableHead>Local</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ação</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {allFretes?.map(f => (
                    <TableRow key={f.id}>
                      <TableCell className="font-bold">{f.isGlobal ? "GLOBAL" : f.cidade}</TableCell>
                      <TableCell>R$ {f.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setItemToDelete({ col: 'fretes', id: f.id })} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
            <Card className="border-2 rounded-3xl p-6 h-fit space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Ticket className="w-5 h-5 text-primary" /> Novo Cupom</h2>
              <div className="space-y-4">
                <Input value={newCupom.codigo} onChange={e => setNewCupom({...newCupom, codigo: e.target.value})} placeholder="Código (Ex: GOLD10)" />
                <RadioGroup value={newCupom.tipo} onValueChange={(val: any) => setNewCupom({...newCupom, tipo: val})} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="porcentagem" id="perc" /><Label htmlFor="perc">%</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="fixo" id="fix" /><Label htmlFor="fix">R$</Label></div>
                </RadioGroup>
                <Input type="number" value={newCupom.desconto} onChange={e => setNewCupom({...newCupom, desconto: parseFloat(e.target.value)})} placeholder="Valor Desconto" />
                <Button onClick={handleAddCupom} className="w-full rounded-xl">Criar</Button>
              </div>
            </Card>
            <Card className="lg:col-span-2 border-2 rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow><TableHead>Código</TableHead><TableHead>Desconto</TableHead><TableHead className="text-right">Ação</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {allCupons?.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-black text-primary">{c.codigo}</TableCell>
                      <TableCell className="font-bold">{c.tipo === 'fixo' ? `R$ ${c.desconto}` : `${c.desconto}%`}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setItemToDelete({ col: 'cupons', id: c.id })} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
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
            <Card className="border-2 rounded-3xl p-6 h-fit space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Nova Promoção</h2>
              <div className="space-y-3">
                <Input value={newPromo.nome} onChange={e => setNewPromo({...newPromo, nome: e.target.value})} placeholder="Nome da Campanha" />
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="datetime-local" 
                    value={newPromo.dataInicio} 
                    onChange={e => setNewPromo({...newPromo, dataInicio: e.target.value})} 
                    className="text-xs cursor-pointer" 
                  />
                  <Input 
                    type="datetime-local" 
                    value={newPromo.dataFim} 
                    onChange={e => setNewPromo({...newPromo, dataFim: e.target.value})} 
                    className="text-xs cursor-pointer" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Tipo de Desconto</Label>
                  <RadioGroup value={newPromo.tipo} onValueChange={(val: any) => setNewPromo({...newPromo, tipo: val})} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="porcentagem" id="promo-perc-tab" /><Label htmlFor="promo-perc-tab" className="text-xs">%</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="fixo" id="promo-fix-tab" /><Label htmlFor="promo-fix-tab" className="text-xs">R$</Label></div>
                  </RadioGroup>
                </div>

                <Input type="number" value={newPromo.valorDesconto} onChange={e => setNewPromo({...newPromo, valorDesconto: parseFloat(e.target.value)})} placeholder="Valor do Desconto" />
                
                <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                  <Label className="font-bold text-xs">Black Friday?</Label>
                  <Switch checked={newPromo.isBlackFriday} onCheckedChange={checked => setNewPromo({...newPromo, isBlackFriday: checked})} />
                </div>
                <Button onClick={handleAddPromo} className="w-full rounded-xl">Ativar</Button>
              </div>
            </Card>
            <Card className="lg:col-span-2 border-2 rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow><TableHead>Campanha</TableHead><TableHead>Desconto</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {allPromotions?.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.nome} {p.isBlackFriday && "🔥"}</TableCell>
                      <TableCell className="font-black text-primary">
                        {p.tipo === 'fixo' ? `R$ ${p.valorDesconto.toFixed(2)}` : `-${p.valorDesconto}%`}
                      </TableCell>
                      <TableCell><Badge className={p.ativo ? 'bg-green-500' : 'bg-muted'}>{p.ativo ? 'ATIVO' : 'OFF'}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => setItemToDelete({ col: 'promocoes', id: p.id })} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api">
          <Card className="border-2 rounded-3xl p-6 md:p-8 space-y-8">
             <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-3xl"><Zap className="w-8 h-8 text-primary" /></div>
                <div><h2 className="text-2xl font-bold">Notificações</h2><p className="text-muted-foreground text-sm">Bot do Telegram</p></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <Label>Bot Token</Label><Input type="password" value={tgSettings.botToken || ''} onChange={e => setTgSettings({...tgSettings, botToken: e.target.value})} />
                   <Label>Chat ID</Label><Input value={tgSettings.chatId || ''} onChange={e => setTgSettings({...tgSettings, chatId: e.target.value})} />
                   <div className="flex items-center justify-between p-4 border-2 rounded-2xl bg-muted/10">
                      <Label>Notificações Ativas</Label>
                      <Switch checked={tgSettings.isActive} onCheckedChange={checked => setTgSettings({...tgSettings, isActive: checked})} />
                   </div>
                </div>
                <div className="space-y-4">
                   <Label>Template Mensagem</Label><Textarea value={tgSettings.messageTemplate || ''} onChange={e => setTgSettings({...tgSettings, messageTemplate: e.target.value})} className="min-h-[150px] font-mono" />
                   <div className="flex gap-4">
                      <Button onClick={handleSaveTgSettings} className="flex-1 h-14 rounded-2xl">Salvar</Button>
                      <Button variant="secondary" disabled={isTesting} onClick={handleTestTelegram} className="flex-1 h-14 rounded-2xl">Testar</Button>
                   </div>
                </div>
             </div>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog 
        open={!!itemToDelete} 
        onOpenChange={(open) => {
          if (!open) setItemToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-3xl border-2 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-headline font-bold">Confirmar Exclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o registro permanentemente do banco de dados e ele deixará de ser contabilizado nos totais do dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl border-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault(); 
                confirmDeleteItem();
              }} 
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold"
            >
              Sim, Excluir Registro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
