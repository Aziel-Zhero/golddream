
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Instagram, Twitter, Facebook, Send, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { SiteConfig } from '@/types';

export function Footer() {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const configRef = useMemoFirebase(() => mounted ? doc(firestore, 'configuracoes', 'geral') : null, [firestore, mounted]);
  const { data: config } = useDoc<SiteConfig>(configRef);

  const isAdmin = user?.papel === 'administrador' || user?.papel === 'admin';

  // Evita erros de hidratação renderizando o conteúdo que depende do cliente/banco apenas após a montagem
  if (!mounted) {
    return (
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-48" />
        </div>
      </footer>
    );
  }

  const telegramUrl = config?.telegramLink || '#';
  const instagramUrl = config?.instagramLink || '#';
  const facebookUrl = config?.facebookLink || '#';
  const twitterUrl = config?.twitterLink || '#';

  return (
    <footer className="bg-white border-t py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <span className="font-headline text-2xl font-bold text-primary">Gold Dream</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Gold Dream Multimarcas - O melhor da moda premium. Elegância e exclusividade para quem sabe o que quer.
            </p>
            <div className="flex space-x-4">
              <a 
                href={instagramUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-pink-600 transition-colors"
              >
                <Instagram size={20}/>
              </a>
              <a 
                href={twitterUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-sky-500 transition-colors"
              >
                <Twitter size={20}/>
              </a>
              <a 
                href={facebookUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-blue-600 transition-colors"
              >
                <Facebook size={20}/>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-headline font-bold mb-6 uppercase tracking-wider text-xs">Categorias</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/category/feminino" className="hover:text-primary transition-colors">Feminino</Link></li>
              <li><Link href="/category/masculino" className="hover:text-primary transition-colors">Masculino</Link></li>
              <li><Link href="/category/acessorios" className="hover:text-primary transition-colors">Acessórios</Link></li>
              <li><Link href="/category/all" className="hover:text-primary transition-colors">Toda a Loja</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold mb-6 uppercase tracking-wider text-xs">Suporte</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/suporte/envio-e-frete" className="hover:text-primary transition-colors">Envio e Frete</Link></li>
              <li><Link href="/suporte/trocas-e-devolucoes" className="hover:text-primary transition-colors">Trocas e Devoluções</Link></li>
              <li><Link href="/suporte/guia-de-tamanhos" className="hover:text-primary transition-colors">Guia de Tamanhos</Link></li>
              <li><Link href="/suporte/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
            </ul>
          </div>

          <div className="bg-muted/30 p-6 rounded-2xl border border-primary/10">
            <h4 className="font-headline font-bold mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#0088cc]" /> Grupo VIP
            </h4>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Receba ofertas exclusivas e cupons de Black Friday da Gold Dream no Telegram!
            </p>
            <Button asChild className="w-full rounded-xl bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-bold h-10 text-xs">
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                ENTRAR NO GRUPO
              </a>
            </Button>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-[10px] text-muted-foreground gap-4 uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <p>&copy; {new Date().getFullYear()} Gold Dream Multimarcas.</p>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1 text-primary font-black hover:underline bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                <LayoutDashboard className="w-3 h-3" /> PAINEL ADMIN
              </Link>
            )}
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary">Políticas de Privacidade</Link>
            <Link href="#" className="hover:text-primary">Termos de Uso</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
