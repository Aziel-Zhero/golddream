
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
  Send,
  Save,
  Globe,
  ExternalLink,
  MapPin,
  Ticket,
  Truck,
  Zap,
  ShieldCheck,
  Star,
  Heart,
  LayoutDashboard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { collection, query, limit, doc, deleteDoc } from 'firebase/firestore';
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
    toast({ title: "Configurações Salvas!", description: "A Home foi atualizada com sucesso." });
  };

  const handleAddFrete = () => {
    addDocumentNonBlocking(collection(firestore, 'fretes'), newFrete);
    setNewFrete({ cidade: '', bairro: '', valor: 0 });
    toast({ title: "Frete Adicionado" });
  };

  const handleAddCupom = () => {
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
          <h1 className="text-4xl font-headline font-bold">Gerenciamento VogueCraft</h1>
          <p className="text-muted-foreground">Controle total da sua loja de moda.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/admin/products"><Package className="w-4 h-4 mr-2" /> Produtos</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/admin/products/new"><PlusCircle className="w-4 h-4 mr-2" /> Novo Produto</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="home" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted p-1">
          <TabsTrigger value="home">Home & Topo</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
          <TabsTrigger value="frete">Frete & Logística</TabsTrigger>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Seção Hero (Topo)</CardTitle><CardDescription>Imagem recomendada: 1200x600px</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Texto da Badge</Label>
                  <Input value={siteSettings.heroBadge} onChange={e => setSiteSettings({...siteSettings, heroBadge: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Título Principal</Label>
                  <Input value={siteSettings.heroTitle} onChange={e => setSiteSettings({...siteSettings, heroTitle: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={siteSettings.heroDescription} onChange={e => setSiteSettings({...siteSettings, heroDescription: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>URL da Imagem de Fundo</Label>
                  <Input value={siteSettings.heroImage} onChange={e => setSiteSettings({...siteSettings, heroImage: e.target.value})} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Benefícios e Telegram</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Link do Grupo Telegram</Label>
                  <Input value={siteSettings.telegramLink} onChange={e => setSiteSettings({...siteSettings, telegramLink: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(num => (
                    <div key={num} className="p-4 border rounded-xl space-y-3 bg-muted/20">
                      <Label className="text-xs font-bold uppercase">Card {num}</Label>
                      <Input placeholder="Título" value={siteSettings[`b${num}_title`]} onChange={e => setSiteSettings({...siteSettings, [`b${num}_title`]: e.target.value})} />
                      <Input placeholder="Subtítulo" value={siteSettings[`b${num}_sub`]} onChange={e => setSiteSettings({...siteSettings, [`b${num}_sub`]: e.target.value})} />
                      <select className="w-full p-2 text-sm border rounded-md" value={siteSettings[`b${num}_icon`]} onChange={e => setSiteSettings({...siteSettings, [`b${num}_icon`]: e.target.value})}>
                        {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <Button onClick={handleSaveSettings} className="w-full h-12">
                  <Save className="w-4 h-4 mr-2" /> Salvar Visual da Home
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="frete" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Configurar Tabela de Fretes</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
                <div className="space-y-2"><Label>Cidade</Label><Input value={newFrete.cidade} onChange={e => setNewFrete({...newFrete, cidade: e.target.value})} /></div>
                <div className="space-y-2"><Label>Bairro</Label><Input value={newFrete.bairro} onChange={e => setNewFrete({...newFrete, bairro: e.target.value})} /></div>
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={newFrete.valor} onChange={e => setNewFrete({...newFrete, valor: parseFloat(e.target.value)})} /></div>
                <Button onClick={handleAddFrete}><PlusCircle className="w-4 h-4 mr-2" /> Adicionar</Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>Cidade</TableHead><TableHead>Bairro</TableHead><TableHead>Valor</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
                <TableBody>
                  {fretes?.map(f => (
                    <TableRow key={f.id}><TableCell>{f.cidade}</TableCell><TableCell>{f.bairro}</TableCell><TableCell>R$ {f.valor.toFixed(2)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => handleDeleteItem('fretes', f.id)}>Remover</Button></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Gerenciar Cupons</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 items-end">
                <div className="space-y-2"><Label>Código</Label><Input value={newCupom.codigo} onChange={e => setNewCupom({...newCupom, codigo: e.target.value.toUpperCase()})} /></div>
                <div className="space-y-2"><Label>Desconto (%)</Label><Input type="number" value={newCupom.desconto} onChange={e => setNewCupom({...newCupom, desconto: parseInt(e.target.value)})} /></div>
                <div className="space-y-2 flex items-center gap-2"><input type="checkbox" checked={newCupom.expira} onChange={e => setNewCupom({...newCupom, expira: e.target.checked})} /><Label>Expira?</Label></div>
                {newCupom.expira && <div className="space-y-2"><Label>Data</Label><Input type="date" value={newCupom.dataExpiracao} onChange={e => setNewCupom({...newCupom, dataExpiracao: e.target.value})} /></div>}
                <Button onClick={handleAddCupom}><Ticket className="w-4 h-4 mr-2" /> Criar Cupom</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cupons?.map(c => (
                  <Card key={c.id} className="border-2 border-primary/10">
                    <CardContent className="p-6 flex justify-between items-center">
                      <div><p className="font-bold text-lg">{c.codigo}</p><p className="text-sm text-primary">{c.desconto}% OFF</p>
                      {c.expira && <p className="text-[10px] text-muted-foreground">Vence em: {c.dataExpiracao}</p>}</div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem('cupons', c.id)}>Remover</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
           <Card><CardHeader><CardTitle>Ações de Catálogo</CardTitle></CardHeader>
           <CardContent className="flex gap-4">
             <Button asChild><Link href="/admin/products">Lista de Produtos</Link></Button>
             <Button asChild variant="outline"><Link href="/admin/promotions">Promoções Black Friday</Link></Button>
           </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
