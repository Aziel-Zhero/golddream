"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Upload, 
  Plus, 
  X, 
  Save, 
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  const handleAddImage = () => {
    if (imageUrl && images.length < 5) {
      setImages([...images, imageUrl]);
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular salvamento
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sucesso!",
        description: "O produto foi adicionado ao catálogo com sucesso.",
      });
      router.push('/admin');
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel
          </Link>
        </Button>
        <h1 className="text-4xl font-headline font-bold">Adicionar Novo Produto</h1>
        <p className="text-muted-foreground">Cadastre novos itens em seu catálogo de moda.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input id="name" placeholder="Ex: Camiseta Oversized Algodão" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Detalhada</Label>
                <Textarea id="description" placeholder="Descreva o material, caimento e detalhes..." className="min-h-[150px]" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" type="number" step="0.01" placeholder="0,00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque Inicial</Label>
                  <Input id="stock" type="number" placeholder="0" required />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagens do Produto</CardTitle>
              <CardDescription>Adicione até 5 imagens via URL para visualização.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg" 
                />
                <Button type="button" onClick={handleAddImage} variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {images.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 5 && (
                  <div className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                    <ImageIcon className="w-6 h-6 mb-1 opacity-20" />
                    <span className="text-[10px]">Vazio</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Categorização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none">
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="acessorios">Acessórios</option>
                  <option value="new">Novidades</option>
                </select>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Destaque na Home?</Label>
                  <input type="checkbox" className="h-5 w-5 accent-primary" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ativar Promoção?</Label>
                  <input type="checkbox" className="h-5 w-5 accent-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isLoading} className="w-full h-14 rounded-xl shadow-xl shadow-primary/20 text-lg font-bold">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Produto
          </Button>
        </div>
      </form>
    </div>
  );
}
