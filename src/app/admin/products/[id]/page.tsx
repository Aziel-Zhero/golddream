
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
  Link as LinkIcon
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
    variacoes: [] as ProductVariation[]
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
        variacoes: product.variacoes || []
      });
    }
  }, [product]);

  const handleAddSize = () => {
    if (newSize && !formData.tamanhosDisponiveis.includes(newSize)) {
      setFormData({ ...formData, tamanhosDisponiveis: [...formData.tamanhosDisponiveis, newSize] });
      setNewSize('');
    }
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
      await setDoc(productRef, {
        ...formData,
        estoque: totalEstoque
      }, { merge: true });
      
      toast({ title: "Sucesso!", description: "Produto atualizado com sucesso." });
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
      <div className="mb-8 flex justify-between items-end">
        <div>
          <Button asChild variant="ghost" className="mb-4 -ml-4">
            <Link href="/admin/products"><ArrowLeft className="w-4 h-4 mr-2" /> Lista de Produtos</Link>
          </Button>
          <h1 className="text-4xl font-headline font-bold">Editar Produto Premium</h1>
        </div>
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

          <Card className="border-2 rounded-3xl">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Variações e Estoque Cruzado</CardTitle>
                <Button type="button" onClick={handleAddVariation} size="sm" variant="outline" className="rounded-xl border-2"><Plus className="w-4 h-4 mr-1" /> Nova Cor</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-12">
              {formData.variacoes.map((v: any, vIdx: number) => (
                <div key={vIdx} className="p-6 border-2 rounded-2xl bg-muted/5 space-y-6 relative shadow-sm">
                  <button type="button" onClick={() => setFormData({...formData, variacoes: formData.variacoes.filter((_:any, i:any) => i !== vIdx)})} className="absolute top-4 right-4 text-destructive p-1 hover:bg-destructive/10 rounded-full transition-colors"><Trash2 className="w-5 h-5" /></button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest">Identificação da Cor</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={v.cor} 
                          onChange={e => updateVariation(vIdx, 'cor', e.target.value)} 
                          required 
                          placeholder="Ex: Azul ou #0000ff"
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
                      <div className="pt-2">
                         <p className="text-[10px] font-black uppercase text-primary">Estoque Total desta Cor: {v.estoque}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest">Estoque por Tamanho</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                         {formData.tamanhosDisponiveis.map((size: string) => (
                           <div key={size} className="space-y-1">
                             <Label className="text-[9px] font-bold text-muted-foreground">{size}</Label>
                             <Input 
                                type="number" 
                                min="0"
                                value={v.estoquePorTamanho?.[size] || 0}
                                onChange={(e) => updateSizeStock(vIdx, size, parseInt(e.target.value) || 0)}
                                className="h-8 text-xs font-bold"
                             />
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon className="w-3 h-3" /> Galeria ({v.imagens?.length || 0}/12)
                    </Label>
                    
                    <div className="flex gap-2 items-center bg-white p-2 rounded-xl border shadow-inner">
                      <Input 
                        placeholder="Colar Link da Foto..." 
                        value={imageUrlInputs[vIdx] || ''} 
                        onChange={e => setImageUrlInputs({...imageUrlInputs, [vIdx]: e.target.value})}
                        className="h-8 text-xs border-none focus-visible:ring-0"
                      />
                      <Button type="button" onClick={() => addImageUrl(vIdx)} size="sm" variant="secondary" className="h-8 rounded-lg">Add Link</Button>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {v.imagens?.map((img: string, iIdx: number) => (
                        <div key={iIdx} className="relative aspect-square rounded-lg border overflow-hidden bg-white group shadow-sm">
                          <img src={img} className="w-full h-full object-cover" alt="" />
                          <button type="button" onClick={() => removeVariationImage(vIdx, iIdx)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4 text-white" /></button>
                        </div>
                      ))}
                      {(!v.imagens || v.imagens.length < 12) && (
                        <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-all">
                          <Plus className="w-5 h-5 text-muted-foreground" />
                          <span className="text-[8px] font-black text-muted-foreground mt-1">UPLOAD</span>
                          <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, vIdx)} />
                        </label>
                      )}
                    </div>
                    {isUploading === vIdx && <div className="flex items-center gap-2 text-[10px] text-primary animate-pulse font-bold"><Loader2 className="w-3 h-3 animate-spin" /> COMPRIMINDO IMAGENS...</div>}
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
                <select className="w-full p-2 border rounded-xl bg-background" value={formData.categoriaId} onChange={e => setFormData({...formData, categoriaId: e.target.value})}>
                  <option value="feminino">Feminino</option>
                  <option value="masculino">Masculino</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <Label htmlFor="feat">Destaque Home</Label>
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
                  <Input value={newSize} onChange={e => setNewSize(e.target.value.toUpperCase())} placeholder="Ex: P" />
                  <Button type="button" onClick={handleAddSize} variant="secondary" className="rounded-xl">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tamanhosDisponiveis.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="pr-1 font-bold">{s} <X className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" onClick={() => setFormData({...formData, tamanhosDisponiveis: formData.tamanhosDisponiveis.filter((_:any, idx:any) => idx !== i)})} /></Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Button type="submit" disabled={isLoading} className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Atualizar Produto
          </Button>
        </div>
      </form>
    </div>
  );
}
