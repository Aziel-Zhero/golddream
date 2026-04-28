
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
  Upload,
  Trash2,
  Image as ImageIcon,
  Zap,
  Sparkles,
  AlertTriangle,
  Link as LinkIcon,
  Check,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { compressImage } from '@/lib/utils';
import { ProductVariation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const firestore = useFirestore();

  const productRef = useMemoFirebase(() => id ? doc(firestore, 'produtos', id) : null, [firestore, id]);
  const { data: product, isLoading: isFetching } = useDoc(productRef);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState<number | null>(null);
  const [imageUrlInputs, setImageUrlInputs] = useState<Record<number, string>>({});
  
  const [formData, setFormData] = useState<any>({
    nome: '',
    descricao: '',
    preco: 0,
    categoriaId: 'feminino',
    isFeatured: false,
    isNovidade: false,
    isLancamento: false,
    isUltimasPecas: false,
    tamanhosDisponiveis: [],
    variacoes: [] as ProductVariation[],
    dataCriacao: null
  });

  const [newSize, setNewSize] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        nome: product.nome || '',
        descricao: product.descricao || '',
        preco: product.preco || 0,
        categoriaId: product.categoriaId || 'feminino',
        isFeatured: product.isFeatured || false,
        isNovidade: product.isNovidade || false,
        isLancamento: product.isLancamento || false,
        isUltimasPecas: product.isUltimasPecas || false,
        tamanhosDisponiveis: product.tamanhosDisponiveis || [],
        variacoes: product.variacoes || [],
        dataCriacao: product.dataCriacao || null
      });
    }
  }, [product]);

  const handleAddSize = (sizeToAdd: string) => {
    const size = sizeToAdd.trim().toUpperCase();
    if (size && !formData.tamanhosDisponiveis.includes(size)) {
      const updatedSizes = [...formData.tamanhosDisponiveis, size];
      const updatedVariations = formData.variacoes.map(v => ({
        ...v,
        estoquePorTamanho: {
          ...(v.estoquePorTamanho || {}),
          [size]: 0
        }
      }));

      setFormData({ ...formData, tamanhosDisponiveis: updatedSizes, variacoes: updatedVariations });
      setNewSize('');
    }
  };

  const addPresetSizes = (type: 'letras' | 'numeros' | 'plus') => {
    let presets: string[] = [];
    if (type === 'letras') presets = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
    if (type === 'numeros') presets = ['34', '36', '38', '40', '42', '44', '46', '48'];
    if (type === 'plus') presets = ['G1', 'G2', 'G3', 'G4', 'G5'];
    
    presets.forEach(s => handleAddSize(s));
    toast({ title: "Grade adicionada!" });
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    const updatedSizes = formData.tamanhosDisponiveis.filter((s: string) => s !== sizeToRemove);
    const updatedVariations = formData.variacoes.map((v: any) => {
      const newStockMap = { ...(v.estoquePorTamanho || {}) };
      delete newStockMap[sizeToRemove];
      const newTotal = Object.values(newStockMap).reduce((a: any, b: any) => a + b, 0);
      return { ...v, estoquePorTamanho: newStockMap, estoque: newTotal };
    });

    setFormData({ ...formData, tamanhosDisponiveis: updatedSizes, variacoes: updatedVariations });
  };

  const handleAddVariation = () => {
    const initialSizeStock: Record<string, number> = {};
    formData.tamanhosDisponiveis.forEach((s: string) => initialSizeStock[s] = 0);

    setFormData({
      ...formData,
      variacoes: [...formData.variacoes, { 
        cor: '#000000', 
        estoque: 0, 
        estoquePorTamanho: initialSizeStock,
        imagens: [] 
      }]
    });
  };

  const handleRemoveVariation = (index: number) => {
    setFormData({
      ...formData,
      variacoes: formData.variacoes.filter((_: any, i: any) => i !== index)
    });
  };

  const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
    const newVariations = [...formData.variacoes];
    newVariations[index] = { ...newVariations[index], [field]: value };
    
    if (field === 'estoquePorTamanho') {
      const total = Object.values(value as Record<string, number>).reduce((a, b) => a + b, 0);
      newVariations[index].estoque = total;
    }
    
    setFormData({ ...formData, variacoes: newVariations });
  };

  const updateSizeStock = (vIdx: number, size: string, qty: number) => {
    const variation = formData.variacoes[vIdx];
    const newSizeStock = { ...(variation.estoquePorTamanho || {}), [size]: qty };
    updateVariation(vIdx, 'estoquePorTamanho', newSizeStock);
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
      toast({ title: "Imagens adicionadas!" });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productRef) return;
    
    setIsLoading(true);
    const totalEstoque = formData.variacoes.reduce((acc: number, v: any) => acc + (v.estoque || 0), 0);

    try {
      // Se não tem dataCriacao, cria com a data atual (Reparo Automático)
      const dataToSave = {
        ...formData,
        estoque: totalEstoque,
        dataCriacao: formData.dataCriacao || new Date().toISOString()
      };

      await setDoc(productRef, dataToSave, { merge: true });
      
      toast({ title: "Sucesso!", description: "Produto atualizado e indexação reparada." });
      router.push('/admin/products');
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="p-24 text-center"><Loader2 className="animate-spin mx-auto w-10 h-10 text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4 -ml-4">
          <Link href="/admin/products"><ArrowLeft className="w-4 h-4 mr-2" /> Lista de Produtos</Link>
        </Button>
        <h1 className="text-4xl font-headline font-bold">Editar Produto Premium</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-2 rounded-3xl">
            <CardHeader><CardTitle>Geral</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2"><Label>Nome</Label><Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="min-h-[120px]" required /></div>
              <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: parseFloat(e.target.value)})} required /></div>
            </CardContent>
          </Card>

          <Card className="border-2 rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary" /> Variações e Grade de Tamanhos</CardTitle>
                <Button type="button" onClick={handleAddVariation} size="sm" className="rounded-xl shadow-lg shadow-primary/10">
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Cor
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-8 bg-primary/[0.02] border-b space-y-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-primary" />
                      <Label className="text-lg font-bold">1. Defina os Tamanhos do Produto</Label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input value={newSize} onChange={(e) => setNewSize(e.target.value.toUpperCase())} placeholder="Ex: PP, 36, G1..." className="h-12 rounded-xl" />
                          <Button type="button" onClick={() => handleAddSize(newSize)} variant="secondary" className="h-12 px-6 rounded-xl font-bold">Adicionar</Button>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5">
                          <Button type="button" variant="outline" size="sm" className="text-[10px] h-8 px-3 rounded-lg border-primary/20 hover:bg-primary/5" onClick={() => addPresetSizes('letras')}>Grade PP-GG</Button>
                          <Button type="button" variant="outline" size="sm" className="text-[10px] h-8 px-3 rounded-lg border-primary/20 hover:bg-primary/5" onClick={() => addPresetSizes('numeros')}>Grade 34-48</Button>
                          <Button type="button" variant="outline" size="sm" className="text-[10px] h-8 px-3 rounded-lg border-primary/20 hover:bg-primary/5" onClick={() => addPresetSizes('plus')}>Grade G1-G5</Button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {formData.tamanhosDisponiveis.map((s: string, i: number) => (
                            <Badge key={i} className="bg-primary text-white border-none font-black py-1.5 pl-4 pr-2 flex items-center gap-2 rounded-xl shadow-sm">
                              {s} 
                              <X className="w-4 h-4 cursor-pointer hover:bg-white/20 rounded-full transition-colors p-0.5" onClick={() => handleRemoveSize(s)} />
                            </Badge>
                          ))}
                          {formData.tamanhosDisponiveis.length === 0 && <p className="text-xs text-muted-foreground italic">Nenhum tamanho adicionado ainda.</p>}
                        </div>
                      </div>

                      <div className="bg-white border-2 border-dashed rounded-2xl p-5 space-y-3 shadow-inner">
                        <p className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                          <Info className="w-4 h-4" /> Sugestão de Numeração:
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground font-medium">
                          <p>• PP: Veste 34/36</p>
                          <p>• P: Veste 38</p>
                          <p>• M: Veste 40/42</p>
                          <p>• G: Veste 44/46</p>
                          <p>• GG: Veste 46/48</p>
                          <p>• G1-G5: 48 ao 60+</p>
                        </div>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 space-y-12">
                <div className="flex items-center gap-2 mb-2">
                   <Palette className="w-5 h-5 text-primary" />
                   <Label className="text-lg font-bold">2. Configure as Cores e Estoque</Label>
                </div>

                {formData.variacoes.map((v: any, vIdx: number) => (
                  <div key={vIdx} className="p-6 border-2 rounded-3xl bg-card space-y-8 relative shadow-sm hover:shadow-md transition-shadow border-primary/5">
                    <button type="button" onClick={() => handleRemoveVariation(vIdx)} className="absolute -top-3 -right-3 bg-white text-destructive border-2 border-destructive/20 p-2 hover:bg-destructive hover:text-white rounded-full transition-all shadow-xl z-10">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Identificação da Cor</Label>
                          <div className="flex gap-3">
                            <Input 
                              value={v.cor} 
                              onChange={(e) => updateVariation(vIdx, 'cor', e.target.value)} 
                              placeholder="Ex: Preto, Azul Marinho..." 
                              required 
                              className="flex-1 h-12 rounded-xl"
                            />
                            <div className="relative w-12 h-12 shrink-0 border-2 rounded-xl overflow-hidden cursor-pointer shadow-inner">
                              <input 
                                type="color" 
                                value={v.cor.startsWith('#') && v.cor.length === 7 ? v.cor : '#000000'} 
                                onChange={e => updateVariation(vIdx, 'cor', e.target.value)} 
                                className="absolute inset-0 w-full h-full scale-150 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex justify-between items-center">
                           <p className="text-[10px] font-black uppercase text-primary">Estoque Total ({v.cor}):</p>
                           <p className="text-2xl font-black text-primary">{v.estoque}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                          Estoque por Tamanho
                          <Badge variant="outline" className="text-[9px] font-bold py-0">{formData.tamanhosDisponiveis.length} TAM</Badge>
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                           {formData.tamanhosDisponiveis.map((size: string) => (
                             <div key={size} className="space-y-1">
                               <Label className="text-[10px] font-bold text-muted-foreground ml-1">{size}</Label>
                               <Input 
                                  type="number" 
                                  min="0"
                                  value={v.estoquePorTamanho?.[size] || 0}
                                  onChange={(e) => updateSizeStock(vIdx, size, parseInt(e.target.value) || 0)}
                                  className="h-10 text-sm font-black rounded-lg bg-white border-2 focus-visible:ring-primary/20"
                               />
                             </div>
                           ))}
                           {formData.tamanhosDisponiveis.length === 0 && (
                             <p className="col-span-full text-[10px] text-red-500 font-bold italic bg-red-50 p-3 rounded-xl border border-red-100">
                               &uarr; Adicione os tamanhos no passo 1 acima!
                             </p>
                           )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" /> Fotos Desta Cor ({v.imagens?.length || 0}/12)
                      </Label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-2 items-center bg-white p-2 rounded-xl border-2 shadow-inner">
                          <Input 
                            placeholder="Colar link de imagem externa..." 
                            value={imageUrlInputs[vIdx] || ''} 
                            onChange={e => setImageUrlInputs({...imageUrlInputs, [vIdx]: e.target.value})}
                            className="h-9 text-xs border-none focus-visible:ring-0"
                          />
                          <Button type="button" onClick={() => addImageUrl(vIdx)} size="sm" variant="secondary" className="h-9 px-4 rounded-lg font-bold">Add Link</Button>
                        </div>
                        
                        <label className="flex items-center justify-center h-13 border-2 border-dashed rounded-xl cursor-pointer hover:bg-primary/5 transition-colors border-primary/20 group">
                          <Upload className="w-4 h-4 mr-2 text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-primary">UPLOAD ARQUIVOS</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, vIdx)} />
                        </label>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                        {v.imagens?.map((img: string, iIdx: number) => (
                          <div key={iIdx} className="relative aspect-square rounded-xl border-2 overflow-hidden bg-white group shadow-sm">
                            <img src={img} className="w-full h-full object-cover" alt="" />
                            <button type="button" onClick={() => removeVariationImage(vIdx, iIdx)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-6 h-6 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {isUploading === vIdx && <div className="flex items-center gap-2 text-[10px] text-primary animate-pulse font-bold bg-primary/5 p-2 rounded-lg w-fit"><Loader2 className="w-3 h-3 animate-spin" /> PROCESSANDO IMAGENS...</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="border-2 rounded-3xl">
            <CardHeader><CardTitle>Organização</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <select className="w-full h-12 px-3 border-2 rounded-xl bg-background font-bold text-sm" value={formData.categoriaId} onChange={e => setFormData({...formData, categoriaId: e.target.value})}>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-4">Selos de Destaque</p>
                
                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                    <Label htmlFor="feat" className="font-bold text-xs cursor-pointer">Destaque na Home</Label>
                  </div>
                  <Switch id="feat" checked={formData.isFeatured} onCheckedChange={(checked) => setFormData({...formData, isFeatured: checked})} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-500" />
                    <Label htmlFor="novidade" className="font-bold text-xs cursor-pointer">Novidade (Piscante)</Label>
                  </div>
                  <Switch id="novidade" checked={formData.isNovidade} onCheckedChange={(checked) => setFormData({...formData, isNovidade: checked})} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <Label htmlFor="lanc" className="font-bold text-xs cursor-pointer">Lançamento</Label>
                  </div>
                  <Switch id="lanc" checked={formData.isLancamento} onCheckedChange={(checked) => setFormData({...formData, isLancamento: checked})} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/20 border">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <Label htmlFor="ult" className="font-bold text-xs cursor-pointer">Últimas Peças</Label>
                  </div>
                  <Switch id="ult" checked={formData.isUltimasPecas} onCheckedChange={(checked) => setFormData({...formData, isUltimasPecas: checked})} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button type="submit" disabled={isLoading} className="w-full h-20 text-xl font-black rounded-3xl bg-primary shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform uppercase tracking-tighter">
            {isLoading ? <Loader2 className="animate-spin mr-3 w-6 h-6" /> : <Save className="mr-3 w-6 h-6" />} Atualizar Produto
          </Button>

          <div className="p-4 bg-muted/30 border-2 border-dashed rounded-2xl text-center">
            <p className="text-[10px] font-bold text-muted-foreground">
              O estoque total será recalculado ao salvar.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
