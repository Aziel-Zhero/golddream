"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth as useFirebaseAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useFirebaseAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
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
    if (pass.length >= 6) score += 25;
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
      toast({ 
        variant: "destructive", 
        title: "Senha muito fraca", 
        description: "Use pelo menos 6 caracteres, letras maiúsculas e números." 
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Cria o documento do usuário no Firestore (Non-blocking)
      const userRef = doc(firestore, 'usuarios', user.uid);
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        email: formData.email,
        telefone: formData.telefone,
        papel: 'cliente',
        dataCriacao: new Date().toISOString()
      }, { merge: true });
      
      toast({ 
        title: "Conta Criada!", 
        description: "Seja bem-vindo à Gold Dream Multimarcas." 
      });
      
      // 3. Redireciona para completar o perfil
      router.push('/auth/complete-profile');
    } catch (error: any) {
      let message = "Tente novamente mais tarde.";
      if (error.code === 'auth/email-already-in-use') message = "Este e-mail já está em uso.";
      if (error.code === 'auth/invalid-email') message = "E-mail inválido.";
      
      toast({ 
        variant: "destructive", 
        title: "Erro ao cadastrar", 
        description: message 
      });
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
              <Input 
                type="email" 
                required 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="seu@email.com" 
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp (Telefone)</Label>
              <Input 
                required 
                value={formData.telefone} 
                onChange={e => setFormData({...formData, telefone: e.target.value})} 
                placeholder="(12) 99186-2651" 
              />
            </div>
            
            <div className="space-y-2 relative">
              <Label>Senha</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={passwordStrength} 
                  className={`h-1 ${passwordStrength < 50 ? 'bg-red-100' : passwordStrength < 100 ? 'bg-yellow-100' : 'bg-green-100'}`} 
                />
                <p className="text-[10px] text-muted-foreground">Força da senha: {passwordStrength}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input 
                type="password" 
                required 
                value={formData.confirmPassword} 
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
              />
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