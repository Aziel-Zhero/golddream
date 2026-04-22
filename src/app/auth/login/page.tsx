"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const auth = useFirebaseAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      router.push('/');
    } catch (error: any) {
      let message = "E-mail ou senha incorretos.";
      if (error.code === 'auth/user-not-found') message = "Usuário não encontrado.";
      if (error.code === 'auth/wrong-password') message = "Senha incorreta.";
      
      toast({ variant: "destructive", title: "Erro no login", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 flex justify-center items-center">
      <Card className="w-full max-w-md border-2 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline font-bold">Acesse sua Conta</CardTitle>
          <CardDescription>Gerencie seus pedidos na Gold Dream.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input 
                type="password" 
                required 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <LogIn className="mr-2 w-4 h-4" />} Entrar
            </Button>
          </form>
          <div className="text-center text-sm">
            <p className="text-muted-foreground">Não tem uma conta?</p>
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Crie sua conta agora
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}