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
                alt="Modern Fashion" 
                className="w-full h-full object-cover brightness-[0.85]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />
            </div>
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-2xl space-y-6">
                <Badge className="bg-primary/20 text-primary border-primary/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                  New Collection 2024
                </Badge>
                <h1 className="text-5xl md:text-7xl font-headline font-bold leading-tight">
                  Crafting Your <span className="text-primary italic">Signature</span> Style
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Discover curated fashion that blends high-end craftsmanship with modern silhouettes. Effortless elegance for the discerning individual.
                </p>
                <div className="flex gap-4 pt-4">
                  <Button size="lg" className="rounded-full px-8 h-12 text-base shadow-xl hover:scale-105 transition-transform">
                    Shop Now <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base backdrop-blur-md bg-white/10 hover:bg-white/20">
                    Discover More
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
                  { icon: Truck, label: 'Free Shipping', sub: 'On orders over $150' },
                  { icon: ShieldCheck, label: 'Secure Payment', sub: '100% encryption' },
                  { icon: Zap, label: 'Fast Delivery', sub: 'Worldwide in 3-5 days' },
                  { icon: Sparkles, label: 'AI Styling', sub: 'Personalized for you' }
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

          {/* Categories Grid */}
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div>
                  <h2 className="text-4xl font-headline font-bold mb-4">Shop by Category</h2>
                  <p className="text-muted-foreground">Tailored collections for every occasion.</p>
                </div>
                <Button variant="link" className="text-primary font-bold">View All Categories <ArrowRight className="ml-2 w-4 h-4" /></Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {['women', 'men', 'accessories'].map((cat) => (
                  <Link key={cat} href={`/category/${cat}`} className="group relative h-[500px] overflow-hidden rounded-2xl bg-muted shadow-lg">
                    <img 
                      src={PlaceHolderImages.find(i => i.id === `category-${cat}`)?.imageUrl} 
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={cat}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
                    <div className="absolute bottom-8 left-8">
                      <h3 className="text-3xl font-headline font-bold text-white capitalize mb-2">{cat}</h3>
                      <p className="text-white/80 text-sm mb-4">Explore the collection</p>
                      <div className="h-1 w-0 bg-accent transition-all duration-500 group-hover:w-full" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16 space-y-4">
                <Badge variant="outline" className="border-accent text-accent rounded-full px-4 py-1">Best Sellers</Badge>
                <h2 className="text-4xl font-headline font-bold">Most Loved Pieces</h2>
                <p className="text-muted-foreground max-w-xl mx-auto">Explore our most popular designs, rated top for quality and style by our community.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              <div className="mt-16 text-center">
                <Button size="lg" variant="outline" className="rounded-full px-12 border-primary text-primary hover:bg-primary hover:text-white transition-all">
                  Browse All Products
                </Button>
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
                  <span className="text-xs font-bold tracking-widest uppercase">AI Stylist</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-headline font-bold">Confused about what to wear?</h2>
                <p className="text-lg text-white/70">Our AI Style Recommender analyzes your preferences and seasonal trends to suggest the perfect outfits just for you.</p>
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-12 h-14 font-bold shadow-2xl">
                  Try AI Styling
                </Button>
              </div>
            </div>
          </section>
        </div>
      );
    }

    // Helper Badge component since it's used in page
    function Badge({ className, children, ...props }: any) {
      return <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`} {...props}>{children}</div>
    }
    