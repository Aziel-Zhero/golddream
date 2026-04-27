
"use client";

import React, { useState } from 'react';
import { generatePersonalizedRecommendations } from '@/ai/flows/personalized-ai-style-recommendations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Send, Loader2, Shirt, User, Zap } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';

export default function AIRecommender() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  // Busca produtos reais do Firestore para a IA analisar
  const productsQuery = useMemoFirebase(() => collection(firestore, 'produtos'), [firestore]);
  const { data: allProducts } = useCollection<Product>(productsQuery);

  const handleGenerate = async () => {
    if (!prompt.trim() || !allProducts) return;

    setIsLoading(true);
    try {
      // Mapeia os produtos do banco para o formato esperado pelo Genkit
      const productsForAi = allProducts.map(p => ({
        id: p.id,
        name: p.nome,
        category: p.categoriaId,
        price: p.preco,
        description: p.descricao
      }));

      const result = await generatePersonalizedRecommendations({
        preferences: [prompt],
        browsingHistory: productsForAi.slice(0, 3), // Simula histórico com os primeiros itens
        availableProducts: productsForAi
      });
      setRecommendations(result);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na IA",
        description: "Não foi possível gerar recomendações no momento."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-1.5 rounded-full border border-accent/20">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">IA Experimental</span>
        </div>
        <h1 className="text-5xl font-headline font-bold">Personal Stylist</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Conte-nos sobre o seu estilo, uma ocasião especial ou apenas suas referências, e nossa IA criará o look perfeito para você.
        </p>
      </div>

      <Card className="border-2 border-primary/20 shadow-2xl overflow-hidden mb-12">
        <CardContent className="p-0">
          <div className="bg-primary p-8 text-white space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <p className="font-medium">"Procuro um look minimalista para um evento à noite no outono..."</p>
            </div>
            <div className="relative">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva seu estilo ou ocasião..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-16 pr-16 rounded-2xl"
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <Button 
                onClick={handleGenerate}
                disabled={isLoading || !allProducts}
                className="absolute right-2 top-2 h-12 w-12 rounded-xl bg-accent hover:bg-accent/90"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Nossa IA está analisando as melhores combinações para você...</p>
        </div>
      )}

      {recommendations && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-headline font-bold flex items-center gap-2">
                <Zap className="text-accent" /> Recomendação do Stylist
              </h2>
              <div className="bg-muted p-8 rounded-3xl space-y-4 border">
                <p className="text-lg italic font-medium leading-relaxed">"{recommendations.explanation}"</p>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-headline font-bold flex items-center gap-2">
                <Shirt className="text-primary" /> Peças Sugeridas
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {recommendations.recommendedProducts.map((p: any) => {
                  const actualProduct = allProducts?.find(item => item.id === p.id);
                  if (!actualProduct) return null;
                  return <ProductCard key={p.id} product={actualProduct} />;
                })}
              </div>
            </div>
          </div>

          <div className="bg-accent/5 p-8 rounded-3xl border border-accent/20">
            <h3 className="text-2xl font-headline font-bold mb-6">Sugestões de Composição (Outfits)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recommendations.suggestedOutfits.map((outfit: any, idx: number) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
                  <h4 className="font-bold text-lg text-accent">{outfit.outfitName}</h4>
                  <p className="text-sm text-muted-foreground">{outfit.styleNotes}</p>
                  <div className="flex flex-wrap gap-2">
                    {outfit.productIds.map((pid: string) => (
                      <Badge key={pid} variant="secondary" className="bg-accent/10 text-accent border-none">
                        {allProducts?.find(p => p.id === pid)?.nome || 'Item'}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
