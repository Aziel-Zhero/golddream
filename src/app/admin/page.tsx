
"use client";

import React, { useState, useEffect } from 'react';
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
  User as UserIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, limit, doc, orderBy } from 'firebase/firestore';
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ICONS = ['Truck', 'ShieldCheck', 'Zap', 'ArrowRight', 'Star', 'Package', 'Heart'];

export default function AdminDashboard() {
  const { toast } = useToast();
  const firestore = useFirestore();
  
  const productsQuery = useMemoFirebase(() => query(collection(firestore, 'produtos'), limit(5)), [firestore]);
  const { data: recentProducts } = useCollection(productsQuery);
  
  const fretesQuery = useMemoFirebase(() => collection(firestore, 'fretes'), [firestore]);
  const { data: fretes } = useCollection(fretesQuery);

  const cuponsQuery = useMemoFirebase(() => collection(firestore, 'cupons'), [firestore]);
  const { data: cupons } = useCollection(cuponsQuery);

  const ordersQuery = useMemoFirebase(() => query(collection(firestore, 'pedidos'), orderBy('dataCriacao', 'desc'), limit(10)), [firestore]);
  const { data: orders } = useCollection(ordersQuery);

  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc(configRef);

  const [siteSettings, setSiteSettings] = useState<any>({
    heroBadge: '', heroTitle: '', heroDescription: '', heroImage: '',
    telegramLink: '',
    b1_title: '', b1_sub: '', b1_icon: 'Truck',
    b2_title: '', b2_sub: '', b2_icon: 'ShieldCheck',
    b3_title: '', b3_sub: '', b3_icon: 'Zap',
    b4_title: '', b4_sub: '', b4_icon: 'ArrowRight'
  });

  const [newFrete, setNewFrete] = useState({ cidade: '', bairro: '', valor: 0 });
  const [newCupom, setNewCupom] = useState({ codigo: '', desconto: 0, expira: false, dataExpiracao: '' });

  useEffect(() => {
    if (config) setSiteSettings({ ...siteSettings, ...config });
  }, [config]);

  const handleSaveSettings = () => {
    if (!configRef) return;
    setDocumentNonBlocking(configRef, siteSettings, { merge: true });
    toast({ title: "Configurações Salvas!", description: "A home Gold Dream foi atualizada." });
  };

  const handleAddFrete = () => {
    if (!newFrete.cidade || !newFrete.bairro) return;
    addDocumentNonBlocking(collection(firestore, 'fretes'), newFrete);
    setNewFrete({ cidade: '', bairro: '', valor: 0 });
    toast({ title: "Frete Adicionado" });
  };

  const handleAddCupom = () => {
    if (!newCupom.codigo) return;
    addDocumentNonBlocking(collection(firestore, 'cupons'), newCupom);
    setNewCupom({ codigo: '', desconto: 0, expira: false, dataExpiracao: '' });
    toast({ title: "Cupom Criado" });
  };

  const handleDeleteItem = (coll: string, id: string) => {
    deleteDocumentNonBlocking(doc(firestore, coll, id));
    toast({ title: "Item Removido" });
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

      <Tabs defaultValue="orders" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl bg-muted p-1 rounded-xl">
          <TabsTrigger value="orders" className="rounded-lg">Pedidos</TabsTrigger>
          <TabsTrigger value="home" className="rounded-lg">Visual Home</TabsTrigger>
          <TabsTrigger value="catalog" className="rounded-lg">Produtos</TabsTrigger>
          <TabsTrigger value="frete" className="rounded-lg">Fretes</TabsTrigger>
          <TabsTrigger value="coupons" className="rounded-lg">Cupons</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Histórico de Pedidos (WhatsApp)</CardTitle>
                <CardDescription>Estes pedidos foram gerados e enviados para o vendedor.</CardDescription>
              </div>
              <ClipboardList className="w-8 h-8 text-primary opacity-20" />
            </CardHeader>
            <CardContent>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Nenhum pedido registrado ainda.</TableCell></TableRow>
                    ) : orders?.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-bold">{order.codigo}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{order.clienteNome}</span>
                            <span className="text-[10px] text-muted-foreground">{order.clienteTelefone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(order.dataCriacao).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-primary">R$ {order.total.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Enviado WhatsApp</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteItem('pedidos', order.id)} className="text-destructive">Excluir</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="home" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardHeader><CardTitle>Seção Hero (Banner)</CardTitle><CardDescription>Imagem recomendada: 1200x600px</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Badge (Ex: Nova Coleção 2024)</Label>
                  <Input value={siteSettings.heroBadge} onChange={e => setSiteSettings({...siteSettings, heroBadge: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Título (Ex: Gold Dream Multimarcas)</Label>
                  <Input value={siteSettings.heroTitle} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={siteSettings.heroDescription} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Link da Imagem de Fundo</Label>
                  <Input value={siteSettings.heroImage} onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader><CardTitle>Cards de Benefícios</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Link do Canal Telegram</Label>
                  <Input value={siteSettings.telegramLink} onChange={e => setSiteSettings({...siteSettings, telegramLink: e.target.value})} placeholder="https://t.me/seugrupo" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(num => (
                    <div key={num} className="p-4 border rounded-xl space-y-3 bg-muted/20">
                      <Label className="text-xs font-bold uppercase">Benefício {num}</Label>
                      <Input placeholder="Título" value={siteSettings[`b${num}_title`]} onChange={e => setSiteSettings({...siteSettings, [`b${num}_title`]: e.target.value})} />
                      <Input placeholder="Subtítulo" value={siteSettings[`b${num}_sub`]} onChange={e => setSiteSettings({...siteSettings, [`b${num}_sub`]: e.target.value})} />
                      <select className="w-full p-2 text-sm border rounded-md" value={siteSettings[`b${num}_icon`]} onChange={e => setSiteSettings({...siteSettings, [`b${num}_icon`]: e.target.value})}>
                        {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveSettings} className="w-full h-12 font-bold shadow-lg shadow-primary/20">
                  <Save className="w-4 h-4 mr-2" /> Salvar Tudo
                </Button>
              </CardContent>
            </Card>
          </div>
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

        <TabsContent value="frete" className="space-y-6">
          <Card className="border-2">
            <CardHeader><CardTitle>Tabela de Fretes por Bairro</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end bg-muted/30 p-4 rounded-xl">
                <div className="space-y-2"><Label>Cidade</Label><Input value={newFrete.cidade} onChange={e => setNewFrete({...newFrete, cidade: e.target.value})} /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={newFrete.bairro} onChange={e => setNewFrete({...newFrete, bairro: e.target.value})} /></div>
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={newFrete.valor} onChange={e => setNewFrete({...newFrete, valor: parseFloat(e.target.value)})} /></div>
                <Button onClick={handleAddFrete} className="rounded-xl"><PlusCircle className="w-4 h-4 mr-2" /> Adicionar</Button>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted"><TableRow><TableHead>Cidade</TableHead><TableHead>Bairro</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {fretes?.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Nenhum frete cadastrado.</TableCell></TableRow>
                    ) : fretes?.map(f => (
                      <TableRow key={f.id}><TableCell>{f.cidade}</TableCell><TableCell>{f.bairro}</TableCell><TableCell>R$ {f.valor.toFixed(2)}</TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleDeleteItem('fretes', f.id)} className="text-destructive">Remover</Button></TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <Card className="border-2">
            <CardHeader><CardTitle>Cupons de Desconto</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-end bg-muted/30 p-4 rounded-xl">
                <div className="space-y-2"><Label>Código</Label><Input value={newCupom.codigo} onChange={e => setNewCupom({...newCupom, codigo: e.target.value.toUpperCase()})} placeholder="EX: GOLD20" /></div>
                <div className="space-y-2"><Label>Desconto (%)</Label><Input type="number" value={newCupom.desconto} onChange={e => setNewCupom({...newCupom, desconto: parseInt(e.target.value)})} /></div>
                <div className="space-y-2 flex flex-col h-10 justify-center"><div className="flex items-center gap-2"><input type="checkbox" checked={newCupom.expira} onChange={e => setNewCupom({...newCupom, expira: e.target.checked})} /><Label>Expira?</Label></div></div>
                {newCupom.expira && <div className="space-y-2"><Label>Data de Expiração</Label><Input type="date" value={newCupom.dataExpiracao} onChange={e => setNewCupom({...newCupom, dataExpiracao: e.target.value})} /></div>}
                <Button onClick={handleAddCupom} className="rounded-xl"><Ticket className="w-4 h-4 mr-2" /> Criar</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cupons?.map(c => (
                  <Card key={c.id} className="border-2 border-primary/10 shadow-sm">
                    <CardContent className="p-6 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-lg">{c.codigo}</p>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">{c.desconto}% OFF</Badge>
                        {c.expira && <p className="text-[10px] text-muted-foreground mt-2 uppercase">Vence em: {new Date(c.dataExpiracao!).toLocaleDateString()}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('cupons', c.id)} className="text-destructive">Remover</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
