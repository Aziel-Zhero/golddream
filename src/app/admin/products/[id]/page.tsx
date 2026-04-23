"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Ruler,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const firestore = useFirestore();

  const productRef = useMemoFirebase(() => id ? doc(firestore, 'produtos', id) : null, [firestore, id]);
  const { data: product, isLoading: isFetching } = useDoc(productRef);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    nome: '',
    descricao: '',
    preco: 0,
    estoque: 0,
    categoriaId: 'feminino',
    imagens: [],
    isFeatured: false,
    tamanhosDisponiveis: [],
    coresDisponiveis: []
  });

  const [imageUrl, setImageUrl] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('#000000');

  useEffect(() => {
    if (product) {
      setFormData({
        nome: product.nome || '',
        descricao: product.descricao || '',
        preco: product.preco || 0,
        estoque: product.estoque || 0,
        categoriaId: product.categoriaId || 'feminino',
        imagens: product.imagens || [],
        isFeatured: product.isFeatured || false,
        tamanhosDisponiveis: product.tamanhosDisponiveis || [],
        coresDisponiveis: product.coresDisponiveis || []
      });
    }
  }, [product]);

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

  const removeItem = (field: string, index: number) => {
    setFormData({ ...formData, [field]: formData[field].filter((_: any, i: number) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productRef) return;
    
    setIsLoading(true);
    updateDocumentNonBlocking(productRef, formData);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Sucesso!",
        description: "O produto foi atualizado com sucesso.",
      });
      router.push('/admin/products');
    }, 1000);
  };

  if (isFetching) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados do produto...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link href="/admin/products">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Lista
          </Link>
        </Button>
        <h1 className="text-4xl font-headline font-bold text-primary">Editar Produto</h1>
        <p className="text-muted-foreground">Atualize os detalhes do item # {id}</p>
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
                <Label htmlFor="description">Descrição Detalhada</Label>
                <Textarea 
                  id="description" 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descreva o material, caimento e detalhes..." 
                  className="min-h-[150px]" 
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
                  <Label htmlFor="stock">Estoque</Label>
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
              <CardTitle>Atributos e Variantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Tamanhos */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2"><Ruler className="w-4 h-4" /> Tamanhos Disponíveis</Label>
                <div className="flex gap-2">
                  <Input 
                    value={newSize} 
                    onChange={(e) => setNewSize(e.target.value.toUpperCase())}
                    placeholder="Ex: P, M, G, 42" 
                  />
                  <Button type="button" onClick={handleAddSize} variant="secondary">Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tamanhosDisponiveis.map((size: string, idx: number) => (
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
                <Label className="flex items-center gap-2"><Palette className="w-4 h-4" /> Cores Disponíveis</Label>
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
                  {formData.coresDisponiveis.map((color: string, idx: number) => (
                    <div key={idx} className="group relative">
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
              <CardTitle>Imagens do Produto</CardTitle>
              <CardDescription>Gerencie as fotos exibidas no catálogo (máx. 5).</CardDescription>
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
                {formData.imagens.map((url: string, idx: number) => (
                  <div key={url + idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeItem('imagens', idx)}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
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
                <Label>Categoria</Label>
                <select 
                  value={formData.categoriaId}
                  onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className={`w-4 h-4 ${formData.isFeatured ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                    <Label className="cursor-pointer" htmlFor="feat">Destaque?</Label>
                  </div>
                  <input 
                    id="feat"
                    type="checkbox" 
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                    className="h-5 w-5 accent-primary" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-2xl shadow-xl shadow-primary/20 text-lg font-bold">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}