
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    rua: '',
    bairro: '',
    cidade: '',
    cep: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const uid = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(firestore, 'usuarios', uid), {
        ...formData,
        id: uid,
        papel: 'cliente',
        dataCriacao: new Date().toISOString()
      });

      await login(formData.email, formData.nome);
      
      toast({ title: "Conta Criada!", description: "Seja bem-vindo(a) à Gold Dream Multimarcas." });
      router.push('/');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: "Verifique os dados e tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center">
      <Card className="w-full max-w-2xl border-2 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
             <Link href="/auth/login" className="text-xs flex items-center gap-1 text-muted-foreground hover:text-primary">
               <ArrowLeft className="w-3 h-3" /> Já tenho conta
             </Link>
          </div>
          <CardTitle className="text-4xl font-headline font-bold">Cadastro de Cliente</CardTitle>
          <CardDescription>Preencha os dados para calcular o frete e realizar pedidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo</Label>
                <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="João da Silva" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="joao@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input required placeholder="(00) 00000-0000" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input required value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input required value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label>Endereço (Rua e Número)</Label>
                <Input required value={formData.rua} onChange={e => setFormData({...formData, rua: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Bairro</Label>
                <Input required value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} />
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <UserPlus className="mr-2" />} Criar Minha Conta
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
