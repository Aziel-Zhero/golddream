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
  Users as UsersIcon,
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
  Twitter,
  RefreshCcw,
  Mail,
  MailCheck,
  MailWarning,
  MessageCircle,
  Image as ImageIcon,
  Link as LinkIcon
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
import { collection, query, doc, orderBy, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pedido, TelegramConfig, FreteRule, Cupom, SiteConfig, User as AppUser } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { sendCustomEmail } from '@/ai/flows/send-custom-email';
import { Separator } from '@/components/ui/separator';

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
  
  const isAdmin = useMemo(() => {
    return user?.papel === 'admin' || user?.papel === 'administrador';
  }, [user]);

  const ordersQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    return query(collection(firestore, 'pedidos'), orderBy('dataCriacao', 'desc'));
  }, [firestore, isAdmin]);
  const { data: allOrders } = useCollection<Pedido>(ordersQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!isAdmin) return null;
    return query(collection(firestore, 'usuarios'), orderBy('dataCriacao', 'desc'));
  }, [firestore, isAdmin]);
  const { data: allUsers } = useCollection<AppUser>(usersQuery);

  const configRef = useMemoFirebase(() => isAdmin ? doc(firestore, 'configuracoes', 'geral') : null, [firestore, isAdmin]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const [siteSettings, setSiteSettings] = useState<SiteConfig>({
    heroBadge: '', heroTitle: '', heroDescription: '', heroImage: '',
    telegramLink: '', instagramLink: '', facebookLink: '', twitterLink: '',
    exchangeDays: 30,
    step1_title: '', step1_desc: '',
    step2_title: '', step2_desc: '',
    step3_title: '', step3_desc: '',
    step4_title: '', step4_desc: '',
    b1_title: '', b1_sub: '', b1_icon: 'Truck', b1_active: true,
    b2_title: '', b2_sub: '', b2_icon: 'ShieldCheck', b2_active: true,
    b3_title: '', b3_sub: '', b3_icon: 'Zap', b3_active: true,
    b4_title: '', b4_sub: '', b4_icon: 'ArrowRight', b4_active: true
  });

  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  useEffect(() => {
    if (config) setSiteSettings((prev) => ({ ...prev, ...config }));
  }, [config]);

  const handleUpdateStatus = (id: string, newStatus: Pedido['status']) => {
    updateDocumentNonBlocking(doc(firestore, 'pedidos', id), { status: newStatus });
    toast({ title: `Status Atualizado` });
  };

  const handleSendEmailInvite = async (u: AppUser & { id: string }) => {
    setIsSendingEmail(u.id);
    try {
      const result = await sendCustomEmail({
        clienteNome: u.nome,
        clienteEmail: u.email,
        tipo: u.emailVerificado ? 'boas_vindas' : 'confirmacao'
      });
      console.log('E-mail Gerado:', result);
      toast({ title: "E-mail Enviado!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao enviar e-mail" });
    } finally {
      setIsSendingEmail(null);
    }
  };

  const handleSaveSettings = () => {
    if (!configRef) return;
    setDoc(configRef, siteSettings, { merge: true });
    toast({ title: "Configurações Salvas!" });
  };

  if (isAuthLoading) {
    return (
      <div className="p-24 text-center flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-bold">Validando acesso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-6">
        <ShieldCheck className="w-16 h-16 mx-auto text-destructive" />
        <h1 className="text-3xl font-bold">Acesso Restrito</h1>
        <Button asChild><Link href="/">Voltar para a Loja</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Painel Gold Dream</h1>
          <p className="text-muted-foreground">Gestão de clientes e operações.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl"><Link href="/">Ver Loja</Link></Button>
          <Button asChild className="rounded-xl"><Link href="/admin/products/new">Novo Produto</Link></Button>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 bg-muted/50 p-1 rounded-2xl h-auto">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="home">Site</TabsTrigger>
          <TabsTrigger value="catalog">Estoque</TabsTrigger>
          <TabsTrigger value="frete">Fretes</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="api">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          <Card className="border-2 shadow-sm">
            <CardHeader><CardTitle>Vendas Recentes</CardTitle></CardHeader>
            <CardContent>
              <div className="border rounded-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOrders?.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-bold text-primary">{order.codigo}</TableCell>
                        <TableCell>{order.clienteNome}</TableCell>
                        <TableCell className="font-black">R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell><Badge>{order.status.toUpperCase()}</Badge></TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button size="sm" variant="outline">Status</Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')}>Confirmado</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')}>Entregue</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'cancelado')} className="text-red-600">Cancelado</DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-2 shadow-sm">
            <CardHeader>
              <CardTitle>Clientes & Contatos</CardTitle>
              <CardDescription>Gerencie sua base de clientes e envie convites VIP.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-2xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>E-mail Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers?.map(u => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold">{u.nome}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{u.papel}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              {u.email}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                              <a href={`https://wa.me/${u.telefone?.replace(/\D/g, '')}`} target="_blank" className="hover:underline text-xs">
                                {u.telefone || 'Sem número'}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.emailVerificado ? (
                            <Badge className="bg-green-100 text-green-700 border-none font-bold">VERIFICADO</Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50 font-bold">PENDENTE</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            disabled={isSendingEmail === u.id}
                            onClick={() => handleSendEmailInvite(u as any)}
                          >
                            {isSendingEmail === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                            Convite VIP
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="home">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card className="border-2 shadow-sm p-8 space-y-6">
               <h2 className="text-2xl font-bold flex items-center gap-2"><ImageIcon className="w-6 h-6 text-primary" /> Hero & Banners</h2>
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Badge do Hero</Label>
                   <Input value={siteSettings.heroBadge} onChange={e => setSiteSettings({...siteSettings, heroBadge: e.target.value})} placeholder="Nova Coleção 2024" />
                 </div>
                 <div className="space-y-2">
                   <Label>Título do Hero</Label>
                   <Input value={siteSettings.heroTitle} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Descrição do Hero</Label>
                   <Textarea value={siteSettings.heroDescription} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>URL da Imagem Hero</Label>
                   <Input value={siteSettings.heroImage} onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})} />
                 </div>
               </div>
               
               <Separator />
               
               <h2 className="text-2xl font-bold flex items-center gap-2"><LinkIcon className="w-6 h-6 text-primary" /> Links Sociais</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Telegram</Label>
                   <Input value={siteSettings.telegramLink} onChange={e => setSiteSettings({...siteSettings, telegramLink: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Instagram</Label>
                   <Input value={siteSettings.instagramLink} onChange={e => setSiteSettings({...siteSettings, instagramLink: e.target.value})} />
                 </div>
               </div>
               
               <Button onClick={handleSaveSettings} className="w-full h-12 rounded-xl">Salvar Ajustes Visuais</Button>
             </Card>

             <Card className="border-2 shadow-sm p-8 space-y-6">
               <h2 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-6 h-6 text-primary" /> Fluxo de Experiência (4 Passos)</h2>
               <p className="text-sm text-muted-foreground">Personalize os passos que aparecem na home do site.</p>
               
               <div className="space-y-8">
                 {[1, 2, 3, 4].map(num => (
                   <div key={num} className="space-y-4 p-4 border rounded-2xl bg-muted/20">
                     <p className="font-bold text-xs uppercase text-primary">Passo {num}</p>
                     <div className="space-y-2">
                       <Label>Título</Label>
                       <Input 
                         value={siteSettings[`step${num}_title` as keyof SiteConfig] as string} 
                         onChange={e => setSiteSettings({...siteSettings, [`step${num}_title` as keyof SiteConfig]: e.target.value})} 
                       />
                     </div>
                     <div className="space-y-2">
                       <Label>Descrição</Label>
                       <Textarea 
                         value={siteSettings[`step${num}_desc` as keyof SiteConfig] as string} 
                         onChange={e => setSiteSettings({...siteSettings, [`step${num}_desc` as keyof SiteConfig]: e.target.value})} 
                       />
                     </div>
                   </div>
                 ))}
               </div>
               
               <Button onClick={handleSaveSettings} className="w-full h-12 rounded-xl">Salvar Fluxo de Compra</Button>
             </Card>
           </div>
        </TabsContent>

        <TabsContent value="api">
           <Card className="border-2 shadow-sm p-8">
             <h2 className="text-2xl font-bold mb-4">Automações</h2>
             <p className="text-muted-foreground">Configurações de Telegram e Notificações VIP.</p>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}