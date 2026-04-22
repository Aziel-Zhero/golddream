
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, MapPin } from 'lucide-react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    cep: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);

    try {
      const userRef = doc(firestore, 'usuarios', user.uid);
      const updateData = {
        nome: formData.nome,
        endereco: {
          rua: formData.rua,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          cep: formData.cep
        }
      };

      await updateDoc(userRef, updateData);
      updateUser(updateData as any);
      
      toast({ title: "Perfil Atualizado!", description: "Bem-vindo à Gold Dream Multimarcas." });
      router.push('/');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: "Verifique os dados e tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 flex justify-center">
      <Card className="w-full max-w-2xl border-2 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline font-bold">Complete seu Perfil</CardTitle>
          <CardDescription>Precisamos desses dados para realizar suas entregas com segurança.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo</Label>
                <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Como devemos te chamar?" />
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
                <Label>Rua / Avenida</Label>
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
            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} Finalizar Cadastro
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
