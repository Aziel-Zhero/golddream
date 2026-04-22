import Link from 'next/link';
import { Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
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
            <h4 className="font-headline font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-4">Junte-se à nossa comunidade para acesso antecipado exclusivo e atualizações de estilo.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Seu e-mail" 
                className="bg-muted border-none rounded-md px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary outline-none"
              />
              <button className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Assinar
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
          <p>&copy; {new Date().getFullYear()} VogueCraft. Todos os direitos reservados.</p>
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
