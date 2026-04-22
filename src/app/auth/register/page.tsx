
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [formData, setFormData] = useState({
    email: '',
    telefone: '',
    password: '',
    confirmPassword: ''
  });

  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 6) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    setPasswordStrength(score);
  };

  useEffect(() => {
    calculatePasswordStrength(formData.password);
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "As senhas não coincidem" });
      return;
    }
    if (passwordStrength < 50) {
      toast({ variant: "destructive", title: "Senha muito fraca", description: "Use letras maiúsculas, números e símbolos." });
      return;
    }

    setIsLoading(true);

    try {
      const uid = Math.random().toString(36).substr(2, 9);
      const userRef = doc(firestore, 'usuarios', uid);
      const userData = {
        id: uid,
        email: formData.email,
        telefone: formData.telefone,
        papel: 'cliente',
        dataCriacao: new Date().toISOString()
      };
      
      await setDoc(userRef, userData);
      await login(formData.email, "Novo Cliente", userData as any);
      
      toast({ title: "Conta Criada!", description: "Agora, complete seu perfil para continuar." });
      router.push('/auth/complete-profile');
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: "Tente novamente mais tarde." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 flex justify-center">
      <Card className="w-full max-w-md border-2 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline font-bold">Criar Conta</CardTitle>
          <CardDescription>Junte-se à Gold Dream Multimarcas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp (Telefone)</Label>
              <Input required value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} placeholder="(00) 00000-0000" />
            </div>
            
            <div className="space-y-2 relative">
              <Label>Senha</Label>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="space-y-1">
                <Progress value={passwordStrength} className={`h-1 ${passwordStrength < 50 ? 'bg-red-100' : passwordStrength < 100 ? 'bg-yellow-100' : 'bg-green-100'}`} />
                <p className="text-[10px] text-muted-foreground">Força da senha: {passwordStrength}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
            </div>

            <Button type="submit" className="w-full h-12 font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : <ShieldCheck className="mr-2 w-4 h-4" />} Cadastrar
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <Link href="/auth/login" className="text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
              <ArrowLeft size={14} /> Já tenho uma conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
