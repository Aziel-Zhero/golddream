"use client";

import React, { useState } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowLeft,
  Percent,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function AdminPromotions() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  
  const promosQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'promocoes'), orderBy('dataCriacao', 'desc'));
  }, [firestore]);

  const { data: promotions, isLoading } = useCollection(promosQuery);

  const [newPromo, setNewPromo] = useState({
    nome: '',
    descricao: '',
    tipoDesconto: 'porcentagem',
    valorDesconto: 0,
    ativo: true,
    isBlackFriday: false
  });

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    addDocumentNonBlocking(collection(firestore, 'promocoes'), {
      ...newPromo,
      dataCriacao: new Date().toISOString()
    });
    setIsAdding(false);
    toast({ title: "Campanha Criada!", description: "A nova promoção já está ativa no sistema." });
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta campanha?')) {
      deleteDocumentNonBlocking(doc(firestore, 'promocoes', id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link href="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" /> Painel
            </Link>
          </Button>
          <h1 className="text-4xl font-headline font-bold">Campanhas e Promoções</h1>
          <p className="text-muted-foreground">Gerencie ofertas sazonais e Black Friday.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Criar Campanha
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isAdding && (
          <Card className="lg:col-span-1 border-primary/20 bg-muted/30">
            <CardHeader>
              <CardTitle>Nova Campanha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePromo} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Promoção</Label>
                  <Input 
                    value={newPromo.nome} 
                    onChange={e => setNewPromo({...newPromo, nome: e.target.value})} 
                    placeholder="Ex: Liquida Inverno" required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desconto (%)</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={newPromo.valorDesconto} 
                      onChange={e => setNewPromo({...newPromo, valorDesconto: parseInt(e.target.value)})} 
                      className="pr-10" 
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg bg-background">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-black" />
                    <Label htmlFor="bf" className="cursor-pointer">Black Friday?</Label>
                  </div>
                  <input 
                    id="bf" 
                    type="checkbox" 
                    checked={newPromo.isBlackFriday} 
                    onChange={e => setNewPromo({...newPromo, isBlackFriday: e.target.checked})}
                    className="h-5 w-5 accent-black" 
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Ativar</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className={isAdding ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">Carregando campanhas...</div>
          ) : promotions?.map(promo => (
            <Card key={promo.id} className={`overflow-hidden border-2 ${promo.isBlackFriday ? 'border-black' : 'border-border'}`}>
              <div className={`p-4 ${promo.isBlackFriday ? 'bg-black text-white' : 'bg-muted'} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span className="font-bold text-sm uppercase tracking-tighter">
                    {promo.isBlackFriday ? 'Evento Black Friday' : 'Promoção Ativa'}
                  </span>
                </div>
                <Button variant="ghost" size="icon" className={`h-8 w-8 ${promo.isBlackFriday ? 'hover:bg-white/20 text-white' : ''}`} onClick={() => handleDelete(promo.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{promo.nome}</h3>
                    <p className="text-sm text-muted-foreground">Desconto de {promo.valorDesconto}% aplicado.</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Ativa
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> Criada em {new Date(promo.dataCriacao).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
