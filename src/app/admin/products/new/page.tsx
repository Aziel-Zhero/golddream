
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
  Ruler,
  Upload,
  Trash2,
  Image as ImageIcon,
  Zap,
  Sparkles,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';
import { compressImage } from '@/lib/utils';
import { ProductVariation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [imageUrlInputs, setImageUrlInputs] = useState<Record<number, string>>({});
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: 0,
    categoriaId: 'feminino',
    isFeatured: false,
    isNovidade: false,
    isLancamento: false,
    isUltimasPecas: false,
    tamanhosDisponiveis: [] as string[],
    variacoes: [] as ProductVariation[]
  });
  
  const [newSize, setNewSize] = useState('');

  const handleAddSize = () => {
    if (newSize && !formData.tamanhosDisponiveis.includes(newSize)) {
      setFormData({ ...formData, tamanhosDisponiveis: [...formData.tamanhosDisponiveis, newSize] });
      setNewSize('');
    }
  };

  const handleAddVariation = () => {
    setFormData({
      ...formData,
      variacoes: [...formData.variacoes, { cor: '#000000', estoque: 0, imagens: [] }]
    });
  };

  const handleRemoveVariation = (index: number) => {
    setFormData({
      ...formData,
      variacoes: formData.variacoes.filter((_, i) => i !== index)
    });
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = [...formData.variacoes];
    newVariations[index] = { ...newVariations[index], [field]: value };
    setFormData({ ...formData, variacoes: newVariations });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, variationIndex: number) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(variationIndex);
      const newImages = [...formData.variacoes[variationIndex].imagens];
      
      for (let i = 0; i < files.length; i++) {
        if (newImages.length >= 12) break;
        const reader = new FileReader();
        const promise = new Promise<string>((resolve) => {
          reader.onloadend = async () => {
            const compressed = await compressImage(reader.result as string);
            resolve(compressed);
          };
        });
        reader.readAsDataURL(files[i]);
        const compressedUrl = await promise;
        newImages.push(compressedUrl);
      }
      
      updateVariation(variationIndex, 'imagens', newImages);
      setIsUploading(null);
      toast({ title: "Imagens carregadas!" });
    }
  };

  const addImageUrl = (variationIndex: number) => {
    const url = imageUrlInputs[variationIndex];
    if (!url) return;
    
    const newImages = [...formData.variacoes[variationIndex].imagens, url];
    updateVariation(variationIndex, 'imagens', newImages);
    setImageUrlInputs({ ...imageUrlInputs, [variationIndex]: '' });
    toast({ title: "URL de imagem adicionada!" });
  };

  const removeVariationImage = (variationIndex: number, imageIndex: number) => {
    const newImages = formData.variacoes[variationIndex].imagens.filter((_, i) => i !== imageIndex);
    updateVariation(variationIndex, 'imagens', newImages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.variacoes.length === 0) {
      toast({ variant: "destructive", title: "Adicione ao menos uma variação." });
      return;
    }

    setIsLoading(true);
    const totalEstoque = formData.variacoes.reduce((acc, v) => acc + (v.estoque || 0), 0);
    
    addDocumentNonBlocking(collection(firestore, 'produtos'), {
      ...formData,
      estoque: totalEstoque,
      dataCriacao: new Date().toISOString()
    });
    
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Sucesso!", description: "Produto cadastrado com sucesso." });
      router.push('/admin/products');
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/admin/products"><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</Link>
        </Button>
        <h1 className="text-4xl font-headline font-bold text-primary">Novo Produto Premium</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2 rounded-3xl">
            <CardHeader><CardTitle>Informações Gerais</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nome do Produto</Label>
                <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Camiseta Oversized" required />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} className="min-h-[120px]" required />
              </div>
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={formData.preco} onChange={(e) => setFormData({...formData, preco: parseFloat(e.target.value)})} required />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-3xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Variações de Cor e Galerias</CardTitle>
                <Button type="button" onClick={handleAddVariation} size="sm" className="rounded-xl">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Cor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {formData.variacoes.map((v, vIdx) => (
                <div key={vIdx} className="p-6 border-2 rounded-2xl bg-muted/5 space-y-6 relative shadow-sm">
                  <button type="button" onClick={() => handleRemoveVariation(vIdx)} className="absolute top-4 right-4 text-destructive p-1 hover:bg-destructive/10 rounded-full transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest">Identificação da Cor</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={v.cor} 
                          onChange={(e) => updateVariation(vIdx, 'cor', e.target.value)} 
                          placeholder="Ex: Preto ou #000000" 
                          required 
                          className="flex-1"
                        />
                        <div className="relative w-10 h-10 shrink-0 border rounded-xl overflow-hidden cursor-pointer shadow-inner">
                          <input 
                            type="color" 
                            value={v.cor.startsWith('#') && v.cor.length === 7 ? v.cor : '#000000'} 
                            onChange={e => updateVariation(vIdx, 'cor', e.target.value)} 
                            className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest">Estoque Desta Cor</Label>
                      <Input type="number" value={v.estoque} onChange={(e) => updateVariation(vIdx, 'estoque', parseInt(e.target.value))} placeholder="0" required />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Fotos Desta Cor ({v.imagens.length}/12)
                    </Label>

                    <div className="flex gap-2 items-center bg-white p-2 rounded-xl border shadow-inner">
                      <Input 
                        placeholder="Link de imagem externa..." 
                        value={imageUrlInputs[vIdx] || ''} 
                        onChange={e => setImageUrlInputs({...imageUrlInputs, [vIdx]: e.target.value})}
                        className="h-8 text-xs border-none focus-visible:ring-0"
                      />
                      <Button type="button" onClick={() => addImageUrl(vIdx)} size="sm" variant="secondary" className="h-8 rounded-lg">Add Link</Button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {v.imagens.map((img, iIdx) => (
                        <div key={iIdx} className="relative aspect-square rounded-lg border overflow-hidden bg-white group shadow-sm">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          <button type="button" onClick={() => removeVariationImage(vIdx, iIdx)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                      {v.imagens.length < 12 && (
                        <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-all">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[8px] font-black text-muted-foreground mt-1">UPLOAD</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, vIdx)} />
                        </label>
                      )}
                    </div>
                    {isUploading === vIdx && <div className="flex items-center gap-2 text-[10px] text-primary animate-pulse font-bold"><Loader2 className="w-3 h-3 animate-spin" /> PROCESSANDO...</div>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-2 rounded-3xl">
            <CardHeader><CardTitle>Atributos e Selos</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select className="w-full p-2 border rounded-xl bg-background" value={formData.categoriaId} onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <Label htmlFor="feat">Destaque na Home?</Label>
                  </div>
                  <Switch id="feat" checked={formData.isFeatured} onCheckedChange={(checked) => setFormData({...formData, isFeatured: checked})} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <Label htmlFor="novidade">Novidade (Piscante)</Label>
                  </div>
                  <Switch id="novidade" checked={formData.isNovidade} onCheckedChange={(checked) => setFormData({...formData, isNovidade: checked})} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <Label htmlFor="lanc">Lançamento</Label>
                  </div>
                  <Switch id="lanc" checked={formData.isLancamento} onCheckedChange={(checked) => setFormData({...formData, isLancamento: checked})} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <Label htmlFor="ult">Últimas Peças</Label>
                  </div>
                  <Switch id="ult" checked={formData.isUltimasPecas} onCheckedChange={(checked) => setFormData({...formData, isUltimasPecas: checked})} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="flex items-center gap-2"><Ruler className="w-4 h-4" /> Tamanhos Grade</Label>
                <div className="flex gap-2">
                  <Input value={newSize} onChange={(e) => setNewSize(e.target.value.toUpperCase())} placeholder="P, M, G..." />
                  <Button type="button" onClick={handleAddSize} variant="secondary" className="rounded-xl">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tamanhosDisponiveis.map((s, i) => (
                    <Badge key={i} className="bg-primary/10 text-primary border-none font-bold">{s} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setFormData({...formData, tamanhosDisponiveis: formData.tamanhosDisponiveis.filter((_, idx) => idx !== i)})} /></Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isLoading || isUploading !== null} className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Salvar Produto Premium
          </Button>
        </div>
      </form>
    </div>
  );
}
