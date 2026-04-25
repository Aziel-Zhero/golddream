
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
  Zap,
  Edit2,
  Save,
  X,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from 'next/link';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Promocao } from '@/types';

export default function AdminPromotions() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const promosQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'promocoes'), orderBy('dataCriacao', 'desc'));
  }, [firestore]);

  const { data: promotions, isLoading } = useCollection<Promocao>(promosQuery);

  const [formData, setFormData] = useState<Partial<Promocao>>({
    nome: '',
    dataInicio: '',
    dataFim: '',
    valorDesconto: 0,
    tipo: 'porcentagem',
    ativo: true,
    isBlackFriday: false
  });

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setDoc(doc(firestore, 'promocoes', editingId), {
        ...formData,
        id: editingId
      }, { merge: true });
      toast({ title: "Campanha Atualizada!" });
      setEditingId(null);
    } else {
      addDocumentNonBlocking(collection(firestore, 'promocoes'), {
        ...formData,
        dataCriacao: new Date().toISOString()
      });
      toast({ title: "Campanha Criada!", description: "A oferta será ativada no período selecionado." });
    }
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      dataInicio: '',
      dataFim: '',
      valorDesconto: 0,
      tipo: 'porcentagem',
      ativo: true,
      isBlackFriday: false
    });
  };

  const handleEdit = (promo: Promocao) => {
    setFormData({
      nome: promo.nome,
      dataInicio: promo.dataInicio,
      dataFim: promo.dataFim,
      valorDesconto: promo.valorDesconto,
      tipo: promo.tipo || 'porcentagem',
      ativo: promo.ativo,
      isBlackFriday: promo.isBlackFriday
    });
    setEditingId(promo.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir esta campanha?')) {
      deleteDocumentNonBlocking(doc(firestore, 'promocoes', id));
      toast({ title: "Campanha Removida" });
    }
  };

  const isPromoActive = (promo: Promocao) => {
    const now = new Date();
    const start = new Date(promo.dataInicio);
    const end = new Date(promo.dataFim);
    return promo.ativo && now >= start && now <= end;
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
          <p className="text-muted-foreground">Gerencie ofertas temporárias e Black Friday.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => { resetForm(); setIsAdding(true); }} className="rounded-full shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Criar Campanha
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {isAdding && (
          <Card className="lg:col-span-1 border-primary/20 bg-muted/30 shadow-xl">
            <CardHeader>
              <CardTitle>{editingId ? 'Editar Campanha' : 'Nova Campanha'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePromo} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Promoção</Label>
                  <Input 
                    value={formData.nome} 
                    onChange={e => setFormData({...formData, nome: e.target.value})} 
                    placeholder="Ex: Liquida Inverno" required 
                  />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Início da Campanha</Label>
                    <Input 
                      type="datetime-local" 
                      value={formData.dataInicio} 
                      onChange={e => setFormData({...formData, dataInicio: e.target.value})} 
                      className="cursor-pointer"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim da Campanha</Label>
                    <Input 
                      type="datetime-local" 
                      value={formData.dataFim} 
                      onChange={e => setFormData({...formData, dataFim: e.target.value})} 
                      className="cursor-pointer"
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <RadioGroup 
                    value={formData.tipo} 
                    onValueChange={(val: any) => setFormData({...formData, tipo: val})} 
                    className="flex gap-4 pt-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="porcentagem" id="promo-perc" />
                      <Label htmlFor="promo-perc" className="cursor-pointer">Porcentagem (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixo" id="promo-fix" />
                      <Label htmlFor="promo-fix" className="cursor-pointer">Valor Fixo (R$)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Valor do Desconto</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={formData.valorDesconto} 
                      onChange={e => setFormData({...formData, valorDesconto: parseFloat(e.target.value)})} 
                      className="pr-10" 
                    />
                    {formData.tipo === 'porcentagem' ? (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border-2 rounded-xl bg-background">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <Label htmlFor="bf" className="cursor-pointer font-bold">Modo Black Friday?</Label>
                  </div>
                  <input 
                    id="bf" 
                    type="checkbox" 
                    checked={formData.isBlackFriday} 
                    onChange={e => setFormData({...formData, isBlackFriday: e.target.checked})}
                    className="h-6 w-6 accent-black" 
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 h-12 text-lg font-bold">
                    {editingId ? <Save className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    {editingId ? 'Salvar' : 'Ativar Campanha'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => { setIsAdding(false); setEditingId(null); }} className="h-12"><X className="w-4 h-4" /></Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className={isAdding ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">Carregando campanhas...</div>
          ) : (promotions || []).map(promo => {
            const active = isPromoActive(promo);
            return (
              <Card key={promo.id} className={`overflow-hidden border-2 transition-all hover:scale-[1.02] ${promo.isBlackFriday ? 'border-black' : 'border-border'} ${!promo.ativo ? 'opacity-60 grayscale' : ''}`}>
                <div className={`p-4 ${promo.isBlackFriday ? 'bg-black text-white' : 'bg-muted'} flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    {promo.isBlackFriday ? <Zap className="w-4 h-4 text-yellow-500 fill-current" /> : <Tag className="w-4 h-4" />}
                    <span className="font-bold text-xs uppercase tracking-tighter">
                      {promo.isBlackFriday ? 'Evento Black Friday' : 'Promoção Sazonal'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className={`h-8 w-8 ${promo.isBlackFriday ? 'hover:bg-white/20 text-white' : ''}`} onClick={() => handleEdit(promo)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className={`h-8 w-8 ${promo.isBlackFriday ? 'hover:bg-white/20 text-white' : ''}`} onClick={() => handleDelete(promo.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black">{promo.nome}</h3>
                      <p className="text-sm font-bold text-primary">
                        {promo.tipo === 'fixo' ? `R$ ${promo.valorDesconto.toFixed(2)}` : `${promo.valorDesconto}%`} OFF
                      </p>
                    </div>
                    {active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-black text-[10px] animate-pulse">
                        AO VIVO
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">
                        {new Date() > new Date(promo.dataFim) ? 'Encerrada' : 'Agendada'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <Clock className="w-3 h-3" /> De: {new Date(promo.dataInicio).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <Clock className="w-3 h-3" /> Até: {new Date(promo.dataFim).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
