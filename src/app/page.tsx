import Link from 'next/link';
import { ArrowRight, Sparkles, Truck, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { productService } from '@/services/productService';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default async function Home() {
  const featuredProducts = await productService.getFeaturedProducts();
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-fashion')?.imageUrl;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Moda Moderna" 
            className="w-full h-full object-cover brightness-[0.85]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl space-y-6">
            <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
              Nova Coleção 2024
            </Badge>
            <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight">
              Crie seu Estilo <span className="text-primary italic">Único</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Descubra moda curada que combina artesanato de alta qualidade com silhuetas modernas. Elegância sem esforço para quem sabe o que quer.
            </p>
            <div className="flex gap-4 pt-4">
              <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-xl hover:scale-105 transition-transform">
                Comprar Agora <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base backdrop-blur-md bg-white/10 hover:bg-white/20">
                Descobrir Mais
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, label: 'Frete Grátis', sub: 'Em pedidos acima de R$250' },
              { icon: ShieldCheck, label: 'Pagamento Seguro', sub: '100% criptografado' },
              { icon: Zap, label: 'Entrega Rápida', sub: 'Todo o Brasil em 3-5 dias' },
              { icon: Sparkles, label: 'IA Stylist', sub: 'Personalizado para você' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary mb-2">
                  <item.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm uppercase tracking-wider">{item.label}</h4>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="border-accent text-accent rounded-full px-4 py-1">Mais Vendidos</Badge>
            <h2 className="text-4xl font-headline font-bold">Peças Favoritas</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Explore nossos designs mais populares, escolhidos por qualidade e estilo pela nossa comunidade.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* AI CTA */}
      <section className="py-24 bg-primary text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-accent rounded-full blur-[120px] opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold tracking-widest uppercase">Stylist com IA</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-headline font-bold">Dúvida sobre o que vestir?</h2>
            <p className="text-lg text-white/70">Nossa IA de Estilo analisa suas preferências e tendências sazonais para sugerir os looks perfeitos para você.</p>
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 rounded-full px-12 h-14 font-bold shadow-2xl">
              <Link href="/ai-recommender">Experimentar IA Stylist</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Badge({ className, children, ...props }: any) {
  return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>{children}</div>
}
