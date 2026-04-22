
"use client";

import Link from 'next/link';
import { Instagram, Twitter, Facebook, Send, LayoutDashboard, ExternalLink } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export function Footer() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Verifica se o usuário é administrador
  const adminRef = useMemoFirebase(() => user ? doc(firestore, 'roles_administrador', user.uid) : null, [firestore, user]);
  const { data: adminRole } = useDoc(adminRef);

  // Busca link do Telegram das configurações
  const configRef = useMemoFirebase(() => doc(firestore, 'configuracoes', 'geral'), [firestore]);
  const { data: config } = useDoc(configRef);

  const telegramUrl = config?.telegramLink || 'https://t.me/voguecraft';

  return (
    <footer className="bg-white border-t py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <span className="font-headline text-2xl font-bold text-primary">VogueCraft</span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Redefinindo a moda moderna com práticas sustentáveis e artesanato de alta qualidade. Seu destino para o estilo contemporâneo.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram size={20}/></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter size={20}/></Link>
              <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook size={20}/></Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-headline font-bold mb-6">Coleções</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/category/feminino" className="hover:text-primary transition-colors">Moda Feminina</Link></li>
              <li><Link href="/category/masculino" className="hover:text-primary transition-colors">Moda Masculina</Link></li>
              <li><Link href="/category/acessorios" className="hover:text-primary transition-colors">Acessórios</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">Novidades</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold mb-6">Suporte</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Política de Envio</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Trocas e Devoluções</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Guia de Tamanhos</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Perguntas Frequentes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold mb-6">Grupo no Telegram</h4>
            <p className="text-sm text-muted-foreground mb-6 text-balance">
              Entre em nosso grupo exclusivo para receber ofertas, novidades e cupons de desconto em primeira mão!
            </p>
            <Button asChild className="w-full rounded-xl bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-bold h-12">
              <a href={telegramUrl} target="_blank" rel="noopener noreferrer">
                <Send className="w-5 h-5 mr-2" /> Entrar no Telegram
              </a>
            </Button>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <div className="flex items-center gap-4">
            <p>&copy; {new Date().getFullYear()} VogueCraft. Todos os direitos reservados.</p>
            {adminRole && (
              <Link href="/admin" className="flex items-center gap-1 text-primary font-bold hover:underline">
                <LayoutDashboard className="w-3 h-3" /> Acesso Administrativo
              </Link>
            )}
          </div>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary">Política de Privacidade</Link>
            <Link href="#" className="hover:text-primary">Termos de Serviço</Link>
            <Link href="#" className="hover:text-primary">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
