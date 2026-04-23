
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, MapPin } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    cep: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        nome: user.nome || '',
        telefone: user.telefone || '',
        rua: user.endereco?.rua || '',
        numero: user.endereco?.numero || '',
        bairro: user.endereco?.bairro || '',
        cidade: user.endereco?.cidade || '',
        cep: user.endereco?.cep || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    try {
      const userRef = doc(firestore, 'usuarios', user.uid);
      const updateData = {
        id: user.uid,
        email: user.email,
        nome: formData.nome,
        telefone: formData.telefone,
        endereco: {
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          cep: formData.cep
        },
        papel: user.papel || 'cliente',
        dataCriacao: user.dataCriacao || new Date().toISOString()
      };

      // Usando setDoc com merge para garantir persistência total
      await setDoc(userRef, updateData, { merge: true });
      updateUser(updateData as any);
      
      toast({ title: "Perfil Salvo!", description: "Dados atualizados com sucesso." });
      
      // Pequeno atraso para garantir que o estado local foi atualizado
      setTimeout(() => {
        router.push('/');
      }, 500);
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 flex justify-center">
      <Card className="w-full max-w-2xl border-2 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center bg-muted/20 pb-8">
          <CardTitle className="text-3xl font-headline font-bold">Dados de Entrega</CardTitle>
          <CardDescription>Precisamos dessas informações para enviar seus pedidos.</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo</Label>
                <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Seu nome completo" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>WhatsApp (Telefone)</Label>
                <Input required value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>CEP</Label>
                <Input required value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} placeholder="00000-000" />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input required value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Rua / Logradouro</Label>
                <Input required value={formData.rua} onChange={e => setFormData({...formData, rua: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input required value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Bairro</Label>
                <Input required value={formData.bairro} onChange={e => setFormData({...formData, bairro: e.target.value})} />
              </div>
            </div>
            <Button type="submit" className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} SALVAR INFORMAÇÕES
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
