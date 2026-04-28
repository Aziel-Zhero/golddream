
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
  MessageCircle,
  Search,
  Edit
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function AdminDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  const isAdmin = useMemo(() => {
    return user?.papel === 'admin' || user?.papel === 'administrador';
  }, [user]);

  // Queries administrativas
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
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);
  const [newFrete, setNewFrete] = useState<Partial<FreteRule>>({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
  const [newCupom, setNewCupom] = useState<Partial<Cupom>>({ codigo: '', desconto: 0, tipo: 'porcentagem', expira: false });
  const [newPromo, setNewPromo] = useState<Partial<Promocao>>({ nome: '', dataInicio: '', dataFim: '', valorDesconto: 0, tipo: 'porcentagem', ativo: true, isBlackFriday: false });
  const [isUploading, setIsUploading] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ col: string; id: string } | null>(null);

  useEffect(() => {
    if (config) setSiteSettings(config);
  }, [config]);

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
    setIsSendingEmail(u.uid);
    try {
      await sendCustomEmail({ clienteNome: u.nome, clienteEmail: u.email, tipo: u.emailVerificado ? 'boas_vindas' : 'confirmacao' });
      toast({ title: "Convite Enviado!", description: `E-mail premium gerado para ${u.nome}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível gerar o e-mail." });
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

  const handleAddFrete = () => {
    if (!newFrete.valor || (!newFrete.cidade && !newFrete.isGlobal)) {
      toast({ variant: "destructive", title: "Preencha os campos obrigatórios." });
      return;
    }
    addDocumentNonBlocking(collection(firestore, 'fretes'), newFrete);
    setNewFrete({ cidade: '', bairro: '', valor: 0, ativo: true, isGlobal: false });
    toast({ title: "Frete Adicionado!" });
  };

  const handleAddCupom = () => {
    if (!newCupom.codigo || !newCupom.desconto) return;
    addDocumentNonBlocking(collection(firestore, 'cupons'), { ...newCupom, codigo: newCupom.codigo.toUpperCase() });
    setNewCupom({ codigo: '', desconto: 0, tipo: 'porcentagem', expira: false });
    toast({ title: "Cupom Criado!" });
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
      toast({ title: "Item Excluído!" });
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold text-muted-foreground uppercase text-xs tracking-widest">Carregando Painel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <XCircle className="w-20 h-20 mx-auto text-destructive" />
        <h1 className="text-4xl font-headline font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
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
            <h1 className="text-2xl md:text-5xl font-headline font-bold text-primary">Controle Mestre</h1>
            <p className="text-[10px] md:text-sm font-medium text-muted-foreground uppercase tracking-widest">Gerenciamento Gold Dream</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <Button asChild variant="outline" className="flex-1 lg:flex-none rounded-xl"><Link href="/">Ver Loja</Link></Button>
          <Button asChild className="flex-1 lg:flex-none rounded-xl"><Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo Produto</Link></Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-8">
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <TabsList className="inline-flex w-max min-w-full bg-muted/50 p-1 rounded-2xl h-auto border">
            <TabsTrigger value="orders" className="rounded-xl font-bold px-6 py-3">Pedidos</TabsTrigger>
            <TabsTrigger value="catalog" className="rounded-xl font-bold px-6 py-3">Produtos</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-bold px-6 py-3">Clientes</TabsTrigger>
            <TabsTrigger value="site" className="rounded-xl font-bold px-6 py-3">Visual Site</TabsTrigger>
            <TabsTrigger value="frete" className="rounded-xl font-bold px-6 py-3">Fretes</TabsTrigger>
            <TabsTrigger value="coupons" className="rounded-xl font-bold px-6 py-3">Cupons</TabsTrigger>
            <TabsTrigger value="promos" className="rounded-xl font-bold px-6 py-3">Campanhas</TabsTrigger>
          </TabsList>
        </div>

        {/* PEDIDOS */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 rounded-3xl bg-primary/5">
              <CardContent className="p-6">
                <DollarSign className="w-5 h-5 text-primary mb-3" />
                <p className="text-[10px] font-black uppercase text-muted-foreground">Faturamento Mês</p>
                <p className="text-2xl font-black text-primary">R$ {stats.totalMes.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="border-2 rounded-3xl bg-green-50">
              <CardContent className="p-6">
                <CheckCircle2 className="w-5 h-5 text-green-600 mb-3" />
                <p className="text-[10px] font-black uppercase text-green-700/60">Entregues</p>
                <p className="text-2xl font-black text-green-700">{stats.entregues}</p>
              </CardContent>
            </Card>
            <Card className="border-2 rounded-3xl bg-yellow-50">
              <CardContent className="p-6">
                <Clock className="w-5 h-5 text-yellow-600 mb-3" />
                <p className="text-[10px] font-black uppercase text-yellow-700/60">Pendentes</p>
                <p className="text-2xl font-black text-yellow-700">{stats.pendentes}</p>
              </CardContent>
            </Card>
            <Card className="border-2 rounded-3xl bg-red-50">
              <CardContent className="p-6">
                <XCircle className="w-5 h-5 text-red-600 mb-3" />
                <p className="text-[10px] font-black uppercase text-red-700/60">Cancelados</p>
                <p className="text-2xl font-black text-red-700">{stats.cancelados}</p>
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
                    <TableRow key={order.id} className="hover:bg-muted/5">
                      <TableCell className="font-black text-primary text-xs">#{order.codigo}</TableCell>
                      <TableCell className="font-bold text-xs">
                        <div className="flex flex-col">
                          <span>{order.clienteNome}</span>
                          <span className="text-[9px] text-muted-foreground">{order.clienteTelefone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-xs">R$ {order.total?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[8px] font-black rounded-full", order.status === 'entregue' ? 'bg-green-500' : order.status === 'cancelado' ? 'bg-red-500' : 'bg-primary')}>
                          {(order.status || 'pendente').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="rounded-lg h-8">Mudar Status</Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-2">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'confirmado')}>Confirmar</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'entregue')}>Entregue</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'cancelado')} className="text-destructive font-bold">Cancelar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setItemToDelete({ col: 'pedidos', id: order.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* PRODUTOS / ESTOQUE */}
        <TabsContent value="catalog">
          <Card className="border-2 rounded-[2rem] overflow-hidden">
            <div className="p-4 border-b bg-muted/5 flex justify-between items-center">
              <h3 className="font-bold text-sm">Inventário Geral ({allProducts?.length || 0})</h3>
              <Button asChild size="sm" className="rounded-xl"><Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo</Link></Button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black pl-6">Produto</TableHead>
                    <TableHead className="text-[10px] uppercase font-black">Preço</TableHead>
                    <TableHead className="text-[10px] uppercase font-black">Estoque</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-black pr-6">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allProducts?.map(prod => (
                    <TableRow key={prod.id}>
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <img src={prod.variacoes?.[0]?.imagens?.[0] || 'https://placehold.co/40'} className="w-10 h-12 rounded-lg object-cover border" alt="" />
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{prod.nome}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{prod.categoriaId}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-black text-xs text-primary">R$ {prod.preco?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={prod.estoque < 5 ? "destructive" : "outline"} className="text-[9px] font-black">
                          {prod.estoque} un
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button asChild size="icon" variant="ghost" className="h-8 w-8 text-primary"><Link href={`/admin/products/${prod.id}`}><Edit className="w-4 h-4" /></Link></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setItemToDelete({ col: 'produtos', id: prod.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* CLIENTES */}
        <TabsContent value="users">
          <Card className="border-2 rounded-[2rem] overflow-hidden">
             <div className="overflow-x-auto custom-scrollbar">
               <Table>
                 <TableHeader className="bg-muted/10">
                   <TableRow>
                     <TableHead className="text-[10px] uppercase font-black pl-6">Nome / E-mail</TableHead>
                     <TableHead className="text-[10px] uppercase font-black">Telefone</TableHead>
                     <TableHead className="text-[10px] uppercase font-black">Papel</TableHead>
                     <TableHead className="text-right text-[10px] uppercase font-black pr-6">Ação</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {allUsers?.map(u => (
                     <TableRow key={u.uid || u.id}>
                       <TableCell className="pl-6">
                         <div className="flex flex-col">
                           <span className="font-bold text-xs">{u.nome}</span>
                           <span className="text-[9px] text-muted-foreground">{u.email}</span>
                         </div>
                       </TableCell>
                       <TableCell className="font-medium text-xs">{u.telefone || '—'}</TableCell>
                       <TableCell>
                         <Badge variant={u.papel === 'admin' ? 'default' : 'secondary'} className="text-[8px] font-black uppercase">
                           {u.papel}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-right pr-6">
                         <div className="flex justify-end gap-2">
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="rounded-lg text-[10px] h-8"
                             disabled={isSendingEmail === u.uid}
                             onClick={() => handleSendEmailInvite(u)}
                           >
                             {isSendingEmail === u.uid ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Mail className="w-3 h-3 mr-1" />}
                             Enviar Convite IA
                           </Button>
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setItemToDelete({ col: 'usuarios', id: u.uid || u.id })}>
                             <Trash2 className="w-4 h-4" />
                           </Button>
                         </div>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
          </Card>
        </TabsContent>

        {/* VISUAL SITE */}
        <TabsContent value="site" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-2 rounded-[2rem] p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Identidade Visual</h2>
              <div className="space-y-6">
                <div className="space-y-3">
                   <Label className="text-xs font-black uppercase text-muted-foreground">Logo Principal (URL ou Upload)</Label>
                   <Input value={siteSettings.logoUrl || ''} onChange={e => setSiteSettings({...siteSettings, logoUrl: e.target.value})} placeholder="https://..." className="h-12 rounded-xl" />
                   <div className="flex gap-4 items-center">
                     <div className="h-20 w-20 bg-white rounded-2xl border-2 border-dashed flex items-center justify-center p-2">
                       {siteSettings.logoUrl ? <img src={siteSettings.logoUrl} className="max-h-full" alt="Logo" /> : <Layers className="opacity-10" />}
                     </div>
                     <label className="flex-1 h-12 flex items-center justify-center border-2 border-primary/20 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors font-bold text-xs text-primary uppercase">
                       <Upload className="w-4 h-4 mr-2" /> Upload Arquivo
                       <input type="file" onChange={e => handleFileUpload(e, 'logoUrl')} className="hidden" />
                     </label>
                   </div>
                </div>
                <div className="space-y-3">
                   <Label className="text-xs font-black uppercase text-muted-foreground">Favicon (Ícone de Aba - URL)</Label>
                   <Input value={siteSettings.faviconUrl || ''} onChange={e => setSiteSettings({...siteSettings, faviconUrl: e.target.value})} placeholder="URL do ícone .png ou .ico" className="h-12 rounded-xl" />
                </div>
                <Button onClick={handleSaveSiteSettings} className="w-full h-14 rounded-2xl font-black text-lg">SALVAR ALTERAÇÕES VISUAIS</Button>
              </div>
            </Card>

            <Card className="border-2 rounded-[2rem] p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Layout className="w-5 h-5 text-primary" /> Seção Hero & Contato</h2>
              <div className="space-y-4">
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Imagem do Hero (URL)</Label><Input value={siteSettings.heroImage || ''} onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})} placeholder="URL da foto de destaque" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Título Impactante</Label><Input value={siteSettings.heroTitle || ''} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Descrição Subtítulo</Label><Textarea value={siteSettings.heroDescription || ''} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} className="min-h-[100px]" /></div>
                <div className="pt-2">
                  <Label className="text-[10px] font-black uppercase">WhatsApp (Apenas Números)</Label>
                  <Input value={siteSettings.whatsappNumber || ''} onChange={e => setSiteSettings({...siteSettings, whatsappNumber: e.target.value})} placeholder="55129..." />
                </div>
                <Button onClick={handleSaveSiteSettings} className="w-full h-14 rounded-2xl font-black text-lg">ATUALIZAR CONTEÚDO</Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* FRETES */}
        <TabsContent value="frete" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-2 rounded-3xl p-6 h-fit">
              <CardHeader className="px-0 pt-0"><CardTitle className="text-lg">Adicionar Regra</CardTitle></CardHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border mb-4">
                   <Label className="font-bold text-xs">Frete Fixo Global?</Label>
                   <Switch checked={newFrete.isGlobal} onCheckedChange={val => setNewFrete({...newFrete, isGlobal: val})} />
                </div>
                {!newFrete.isGlobal && (
                  <>
                    <div className="space-y-1"><Label className="text-xs">Cidade</Label><Input value={newFrete.cidade} onChange={e => setNewFrete({...newFrete, cidade: e.target.value})} placeholder="Ex: São José dos Campos" /></div>
                    <div className="space-y-1"><Label className="text-xs">Bairro (Opcional)</Label><Input value={newFrete.bairro} onChange={e => setNewFrete({...newFrete, bairro: e.target.value})} placeholder="Ex: Centro" /></div>
                  </>
                )}
                <div className="space-y-1"><Label className="text-xs">Valor (R$)</Label><Input type="number" value={newFrete.valor} onChange={e => setNewFrete({...newFrete, valor: parseFloat(e.target.value)})} /></div>
                <Button onClick={handleAddFrete} className="w-full h-12 rounded-xl font-bold"><Truck className="w-4 h-4 mr-2" /> Salvar Regra</Button>
              </div>
            </Card>

            <Card className="lg:col-span-2 border-2 rounded-[2rem] overflow-hidden">
               <Table>
                 <TableHeader><TableRow><TableHead>Abrangência</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {allFretes?.map(f => (
                     <TableRow key={f.id}>
                       <TableCell className="font-bold text-xs">{f.isGlobal ? '🌍 GLOBAL (Todos)' : `${f.cidade}${f.bairro ? ` - ${f.bairro}` : ''}`}</TableCell>
                       <TableCell className="font-black text-xs text-primary">R$ {f.valor.toFixed(2)}</TableCell>
                       <TableCell className="text-right pr-4">
                         <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setItemToDelete({ col: 'fretes', id: f.id })}><Trash2 className="w-4 h-4" /></Button>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
            </Card>
          </div>
        </TabsContent>

        {/* CUPONS */}
        <TabsContent value="coupons" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <Card className="border-2 rounded-3xl p-6 h-fit">
                <CardTitle className="text-lg mb-6">Novo Cupom</CardTitle>
                <div className="space-y-4">
                  <div className="space-y-1"><Label className="text-xs">Código (Ex: BEMVINDO10)</Label><Input value={newCupom.codigo} onChange={e => setNewCupom({...newCupom, codigo: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-2">
                    <Label className="text-xs">Tipo de Desconto</Label>
                    <RadioGroup value={newCupom.tipo} onValueChange={(val: any) => setNewCupom({...newCupom, tipo: val})} className="flex gap-4">
                      <div className="flex items-center space-x-2"><RadioGroupItem value="porcentagem" id="c-perc" /><Label htmlFor="c-perc">Porcentagem</Label></div>
                      <div className="flex items-center space-x-2"><RadioGroupItem value="fixo" id="c-fix" /><Label htmlFor="c-fix">Valor Fixo</Label></div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Desconto</Label><Input type="number" value={newCupom.desconto} onChange={e => setNewCupom({...newCupom, desconto: parseFloat(e.target.value)})} /></div>
                  <Button onClick={handleAddCupom} className="w-full h-12 rounded-xl font-bold"><Ticket className="w-4 h-4 mr-2" /> Criar Cupom</Button>
                </div>
             </Card>

             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
               {allCupons?.map(c => (
                 <Card key={c.id} className="border-2 rounded-2xl p-6 flex justify-between items-center bg-primary/5">
                   <div>
                     <p className="font-black text-primary tracking-widest">{c.codigo}</p>
                     <p className="text-xs font-bold text-muted-foreground">{c.tipo === 'porcentagem' ? `${c.desconto}% OFF` : `R$ ${c.desconto.toFixed(2)} OFF`}</p>
                   </div>
                   <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setItemToDelete({ col: 'cupons', id: c.id })}><Trash2 className="w-4 h-4" /></Button>
                 </Card>
               ))}
             </div>
          </div>
        </TabsContent>

        {/* CAMPANHAS */}
        <TabsContent value="promos">
          <div className="flex flex-col gap-6">
             <div className="flex justify-between items-center">
               <h3 className="text-xl font-bold">Gerenciamento de Campanhas</h3>
               <Button asChild className="rounded-xl"><Link href="/admin/promotions">Abrir Editor de Campanhas <ArrowRight className="ml-2 w-4 h-4" /></Link></Button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {allPromotions?.map(p => (
                  <Card key={p.id} className={cn("border-2 rounded-3xl overflow-hidden", p.isBlackFriday && "border-black bg-black text-white")}>
                    <div className="p-6 space-y-4">
                       <div className="flex justify-between items-start">
                         <h4 className="font-black text-lg">{p.nome}</h4>
                         <Button size="icon" variant="ghost" className={cn("h-8 w-8", p.isBlackFriday ? "text-white hover:bg-white/10" : "text-destructive")} onClick={() => setItemToDelete({ col: 'promocoes', id: p.id })}><Trash2 className="w-4 h-4" /></Button>
                       </div>
                       <Badge className={cn("font-black", p.isBlackFriday ? "bg-yellow-400 text-black" : "bg-primary")}>
                         {p.tipo === 'porcentagem' ? `${p.valorDesconto}% OFF` : `R$ ${p.valorDesconto} OFF`}
                       </Badge>
                       <p className="text-[10px] opacity-60">Ativo até: {new Date(p.dataFim).toLocaleDateString()}</p>
                    </div>
                  </Card>
                ))}
             </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL DE EXCLUSÃO */}
      <AlertDialog open={!!itemToDelete} onOpenChange={open => !open && setItemToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] border-2 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-headline font-bold">Confirmar Exclusão?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg">
              Esta ação é permanente e removerá o registro definitivamente do sistema Gold Dream.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-xl h-12 border-2 px-6">Manter Registro</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="rounded-xl h-12 bg-destructive hover:bg-destructive/90 text-white font-bold px-8">
              Sim, Excluir Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
