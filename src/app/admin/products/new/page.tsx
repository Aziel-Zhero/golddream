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
  Plus, 
  X, 
  Save, 
  Loader2,
  Palette,
  Ruler
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    estoque: 0,
    categoriaId: 'feminino',
    imagens: [] as string[],
    isFeatured: false,
    tamanhosDisponiveis: [] as string[],
    coresDisponiveis: [] as string[]
  });
  
  const [imageUrl, setImageUrl] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('#000000');

  const handleAddImage = () => {
    if (imageUrl && formData.imagens.length < 5) {
      setFormData({ ...formData, imagens: [...formData.imagens, imageUrl] });
      setImageUrl('');
    }
  };

  const handleAddSize = () => {
    if (newSize && !formData.tamanhosDisponiveis.includes(newSize)) {
      setFormData({ ...formData, tamanhosDisponiveis: [...formData.tamanhosDisponiveis, newSize] });
      setNewSize('');
    }
  };

  const handleAddColor = () => {
    if (!formData.coresDisponiveis.includes(newColor)) {
      setFormData({ ...formData, coresDisponiveis: [...formData.coresDisponiveis, newColor] });
    }
  };

  const removeItem = (field: 'imagens' | 'tamanhosDisponiveis' | 'coresDisponiveis', index: number) => {
    setFormData({ 
      ...formData, 
      [field]: formData[field].filter((_, i) => i !== index) 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    addDocumentNonBlocking(collection(firestore, 'produtos'), {
      ...formData,
      dataCriacao: new Date().toISOString()
    });
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sucesso!",
        description: "O produto foi adicionado ao catálogo com sucesso.",
      });
      router.push('/admin/products');
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/products">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Link>
        </Button>
        <h1 className="text-4xl font-headline font-bold text-primary">Novo Produto</h1>
        <p className="text-muted-foreground">Cadastre novos itens em seu catálogo Gold Dream.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Produto</Label>
                <Input 
                  id="name" 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Camiseta Oversized Premium" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Detalhes do material, caimento e estilo..." 
                  className="min-h-[120px]" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    step="0.01" 
                    value={formData.preco}
                    onChange={(e) => setFormData({...formData, preco: parseFloat(e.target.value)})}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque Inicial</Label>
                  <Input 
                    id="stock" 
                    type="number" 
                    value={formData.estoque}
                    onChange={(e) => setFormData({...formData, estoque: parseInt(e.target.value)})}
                    required 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Atributos (Variações)</CardTitle>
              <CardDescription>Defina os tamanhos e cores disponíveis para este produto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Tamanhos */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2"><Ruler className="w-4 h-4" /> Tamanhos</Label>
                <div className="flex gap-2">
                  <Input 
                    value={newSize} 
                    onChange={(e) => setNewSize(e.target.value.toUpperCase())}
                    placeholder="Ex: P, M, G, 42" 
                  />
                  <Button type="button" onClick={handleAddSize} variant="secondary">Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tamanhosDisponiveis.map((size, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm font-bold">
                      {size}
                      <button type="button" onClick={() => removeItem('tamanhosDisponiveis', idx)} className="text-destructive hover:text-red-700">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cores */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cores</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    type="color" 
                    value={newColor} 
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-20 h-10 p-1 rounded-lg"
                  />
                  <Input 
                    value={newColor} 
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="#000000"
                    className="font-mono"
                  />
                  <Button type="button" onClick={handleAddColor} variant="secondary">Adicionar Cor</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {formData.coresDisponiveis.map((color, idx) => (
                    <div key={idx} className="group relative flex items-center justify-center">
                      <div 
                        className="w-8 h-8 rounded-full border shadow-sm" 
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                      <button 
                        type="button" 
                        onClick={() => removeItem('coresDisponiveis', idx)}
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
              <CardDescription>Adicione URLs de imagens de alta qualidade (máx 5).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto.jpg" 
                />
                <Button type="button" onClick={handleAddImage} variant="secondary">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {formData.imagens.map((url, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeItem('imagens', idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Categoria Principal</Label>
                <select 
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
                >
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <Label htmlFor="feat">Produto em Destaque?</Label>
                <input 
                  id="feat"
                  type="checkbox" 
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                  className="h-5 w-5 accent-primary" 
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isLoading} className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Salvar Produto
          </Button>
        </div>
      </form>
    </div>
  );
}