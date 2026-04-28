
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
  MessageSquare,
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
  Star,
  Loader2,
  ChevronDown,
  Instagram,
  Facebook,
  Twitter,
  Mail,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { collection, query, doc, setDoc, deleteField } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pedido, TelegramConfig, FreteRule, Cupom, SiteConfig, User as AppUser, Product, Promocao } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { sendCustomEmail } from '@/ai/flows/send-custom-email';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { compressImage, cn } from '@/lib/utils';

export default function AdminDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const isAdmin = useMemo(() => {
    return user?.papel === 'admin' || user?.papel === 'administrador';
  }, [user]);

  // Queries administrativas - removido orderBy para garantir que todos os registros apareçam mesmo sem dataCriacao
  const ordersQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'pedidos') : null, [firestore, isAdmin]);
  const { data: allOrdersData } = useCollection<Pedido>(ordersQuery);
  const allOrders = useMemo(() => {
    if (!allOrdersData) return null;
    return [...allOrdersData].sort((a, b) => {
      const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
      const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
      return dateB - dateA;
    });
  }, [allOrdersData]);

  const usersQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'usuarios') : null, [firestore, isAdmin]);
  const { data: allUsers } = useCollection<AppUser>(usersQuery);

  const productsQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'produtos') : null, [firestore, isAdmin]);
  const { data: allProductsData } = useCollection<Product>(productsQuery);
  const allProducts = useMemo(() => {
    if (!allProductsData) return null;
    return [...allProductsData].sort((a, b) => {
      const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
      const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
      return dateB - dateA;
    });
  }, [allProductsData]);

  const fretesQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'fretes') : null, [firestore, isAdmin]);
  const { data: allFretes } = useCollection<FreteRule>(fretesQuery);

  const cuponsQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'cupons') : null, [firestore, isAdmin]);
  const { data: allCupons } = useCollection<Cupom>(cuponsQuery);

  const promosQuery = useMemoFirebase(() => isAdmin ? collection(firestore, 'promocoes') : null, [firestore, isAdmin]);
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
  
  const [itemToDelete, setItemToDelete] = useState<{ col: string; id: string } | null>(null);

  useEffect(() => {
    if (config) setSiteSettings(config);
    if (tgConfig) setTgSettings(tgConfig);
  }, [config, tgConfig]);

  const stats = useMemo(() => {
    if (!allOrders) return { totalMes: 0, entregues: 0, pendentes: 0, cancelados: 0 };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return allOrders.reduce((acc, order) => {
      const orderDate = order.dataCriacao ? new Date(order.dataCriacao) : null;
      const isThisMonth = orderDate && orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      if (isThisMonth && order.status !== 'cancelado') acc.totalMes += order.total || 0;
      if (order.status === 'entregue') acc.entregues += 1;
      else if (order.status === 'cancelado') acc.cancelados += 1;
      else acc.pendentes += 1;
      return acc;
    }, { totalMes: 0, entregues: 0, pendentes: 0, cancelados: 0 });
  }, [allOrders]);

  const handleUpdateStatus = async (pedido: Pedido, newStatus: Pedido['status']) => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', pedido.id), { status: newStatus });
    if (newStatus === 'entregue') {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(now.getDate() + 40);
      for (const item of pedido.itens) {
        if (!item.productId) continue;
        const elegivelId = `${item.productId}_${pedido.id}`;
        const elegivelRef = doc(firestore, 'usuarios', pedido.usuarioId, 'itens_elegiveis_avaliacao', elegivelId);
        setDoc(elegivelRef, {
          id: elegivelId, productId: item.productId, orderId: pedido.id,
          productName: item.nome, deliveryDate: now.toISOString(), expiresAt: expiresAt.toISOString()
        }, { merge: true });
      }
      toast({ title: "Pedido entregue!", description: "Itens liberados para avaliação." });
    } else {
      toast({ title: `Status atualizado para ${newStatus}` });
    }
  };

  const handleSendEmailInvite = async (u: AppUser) => {
    const userId = u.uid || u.id;
    setIsSendingEmail(userId);
    try {
      await sendCustomEmail({ clienteNome: u.nome, clienteEmail: u.email, tipo: u.emailVerificado ? 'boas_vindas' : 'confirmacao' });
      toast({ title: "Convite Enviado!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Falha na geração do e-mail." });
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
        const compressed = await compressImage(reader.result as string, 1200, 1200);
        if (configRef) await setDoc(configRef, { [field]: compressed }, { merge: true });
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

  const handleAddFrete = () => {
    if (!newFrete.valor || (!newFrete.cidade && !newFrete.isGlobal)) return;
    addDocumentNonBlocking(collection(firestore, 'fretes'), newFrete);
    setNewFrete({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
    toast({ title: "Frete Adicionado" });
  };

  const handleAddCupom = () => {
    if (!newCupom.codigo || !newCupom.desconto) return;
    addDocumentNonBlocking(collection(firestore, 'cupons'), { ...newCupom, codigo: newCupom.codigo.toUpperCase() });
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
      setItemToDelete(null);
      toast({ title: "Registro excluído" });
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
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 md:h-20 md:w-20 rounded-2xl border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
             {siteSettings.logoUrl ? (
               <img src={siteSettings.logoUrl} className="w-full h-full object-contain" alt="Logo" />
             ) : (
               <LayoutDashboard className="w-8 h-8 md:w-10 md:h-10 text-primary" />
             )}
          </div>
          <div>
            <h1 className="text-2xl md:text-5xl font-headline font-bold text-primary">Painel Admin</h1>
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-widest">Gestão Gold Dream</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button asChild variant="outline" className="flex-1 lg:flex-none rounded-xl"><Link href="/">Ver Loja</Link></Button>
          <Button asChild className="flex-1 lg:flex-none rounded-xl"><Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo Produto</Link></Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6 md:space-y-8">
        <div className="relative">
          <div className="overflow-x-auto pb-4 pt-1 px-1 custom-scrollbar">
            <TabsList className="inline-flex w-max min-w-full md:grid md:grid-cols-8 bg-muted/50 p-1 rounded-2xl h-auto border">
              <TabsTrigger value="orders" className="rounded-xl font-bold px-4 py-2">Pedidos</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl font-bold px-4 py-2">Usuários</TabsTrigger>
              <TabsTrigger value="home" className="rounded-xl font-bold px-4 py-2">Site</TabsTrigger>
              <TabsTrigger value="catalog" className="rounded-xl font-bold px-4 py-2">Estoque</TabsTrigger>
              <TabsTrigger value="frete" className="rounded-xl font-bold px-4 py-2">Fretes</TabsTrigger>
              <TabsTrigger value="coupons" className="rounded-xl font-bold px-4 py-2">Cupons</TabsTrigger>
              <TabsTrigger value="promos" className="rounded-xl font-bold px-4 py-2">Promoções</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-2 rounded-3xl bg-primary/5">
              <CardContent className="p-4 md:p-6">
                <DollarSign className="w-5 h-5 text-primary mb-3" />
                <p className="text-[9px] font-black uppercase text-muted-foreground">Mês Atual</p>
                <p className="text-lg md:text-2xl font-black text-primary">R$ {stats.totalMes.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-2 rounded-3xl bg-green-50">
              <CardContent className="p-4 md:p-6">
                <CheckCircle2 className="w-5 h-5 text-green-600 mb-3" />
                <p className="text-[9px] font-black uppercase text-green-700/60">Entregues</p>
                <p className="text-lg md:text-2xl font-black text-green-700">{stats.entregues}</p>
              </CardContent>
            </Card>
            <Card className="border-2 rounded-3xl bg-yellow-50">
              <CardContent className="p-4 md:p-6">
                <Clock className="w-5 h-5 text-yellow-600 mb-3" />
                <p className="text-[9px] font-black uppercase text-yellow-700/60">Pendentes</p>
                <p className="text-lg md:text-2xl font-black text-yellow-700">{stats.pendentes}</p>
              </CardContent>
            </Card>
            <Card className="border-2 rounded-3xl bg-red-50">
              <CardContent className="p-4 md:p-6">
                <XCircle className="w-5 h-5 text-red-600 mb-3" />
                <p className="text-[9px] font-black uppercase text-red-700/60">Cancelados</p>
                <p className="text-lg md:text-2xl font-black text-red-700">{stats.cancelados}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 shadow-sm rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black">Código</TableHead>
                    <TableHead className="text-[10px] uppercase font-black">Cliente</TableHead>
                    <TableHead className="text-[10px] uppercase font-black">Total</TableHead>
                    <TableHead className="text-[10px] uppercase font-black">Status</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-black pr-6">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders?.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-black text-primary text-xs">#{order.codigo}</TableCell>
                      <TableCell className="font-bold text-xs truncate max-w-[120px]">{order.clienteNome}</TableCell>
                      <TableCell className="font-bold text-xs">R$ {order.total?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[8px] font-black rounded-full", order.status === 'entregue' ? 'bg-green-500' : order.status === 'cancelado' ? 'bg-red-500' : 'bg-primary')}>
                          {(order.status || 'pendente').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="rounded-lg h-8">Opções</Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-2">
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'confirmado')}>Confirmar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'entregue')}>Entregue</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'cancelado')} className="text-destructive font-bold">Cancelar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="home" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <Card className="border-2 rounded-[2rem] p-6 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Visual & Logo</h2>
              <div className="space-y-6">
                <div className="space-y-3">
                   <Label className="text-xs font-black uppercase">Logo Principal</Label>
                   <div className="flex flex-col sm:flex-row gap-4">
                     <div className="h-24 w-full sm:w-40 bg-white rounded-xl border-2 border-dashed flex items-center justify-center p-2">
                       {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} className="max-h-full" alt="Logo" /> : <Layers className="opacity-10" />}
                     </div>
                     <div className="flex-1 space-y-2">
                       <Input value={siteSettings.logoUrl || ''} onChange={e => setSiteSettings({...siteSettings, logoUrl: e.target.value})} placeholder="URL da Logo" className="text-xs" />
                       <div className="flex gap-2">
                        <Input type="file" onChange={e => handleFileUpload(e, 'logoUrl')} className="hidden" id="logo-up" />
                        <Button asChild variant="outline" className="flex-1 text-[10px] h-9"><label htmlFor="logo-up"><Upload className="w-3 h-3 mr-1" /> Upload</label></Button>
                        {siteSettings.logoUrl && <Button variant="ghost" size="icon" onClick={() => handleRemoveImage('logoUrl')} className="text-destructive h-9 w-9"><Trash2 className="w-4 h-4" /></Button>}
                       </div>
                     </div>
                   </div>
                </div>
                <Separator />
                <Button onClick={handleSaveSiteSettings} className="w-full h-12 rounded-xl font-black">SALVAR ALTERAÇÕES</Button>
              </div>
            </Card>

            <Card className="border-2 rounded-[2rem] p-6 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="w-5 h-5 text-primary" /> Contatos & Hero</h2>
              <div className="space-y-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">WhatsApp</Label><Input value={siteSettings.whatsappNumber || ''} onChange={e => setSiteSettings({...siteSettings, whatsappNumber: e.target.value})} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Título Hero</Label><Input value={siteSettings.heroTitle || ''} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Descrição Hero</Label><Textarea value={siteSettings.heroDescription || ''} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} className="min-h-[80px]" /></div>
                <Button onClick={handleSaveSiteSettings} className="w-full h-12 rounded-xl font-black">SALVAR CONTEÚDO</Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="catalog">
          <Card className="border-2 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProducts?.map(prod => (
                    <TableRow key={prod.id}>
                      <TableCell className="font-bold text-xs"><div className="flex items-center gap-2"><img src={prod.variacoes?.[0]?.imagens?.[0] || 'https://placehold.co/40'} className="w-8 h-8 rounded object-cover" /> {prod.nome}</div></TableCell>
                      <TableCell><Badge variant={prod.estoque < 5 ? "destructive" : "outline"} className="text-[9px]">{prod.estoque} un</Badge></TableCell>
                      <TableCell className="text-right"><Button asChild size="sm" variant="ghost" className="rounded-lg"><Link href={`/admin/products/${prod.id}`}>Editar</Link></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
